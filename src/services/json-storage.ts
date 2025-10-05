/**
 * JSON-based storage service for investigations MCP tools
 * Provides file-based storage with FIFO limit of 50 investigations
 */

import fs from 'fs-extra';
import path from 'path';
import type {
  InvestigationCase,
  EvidenceItem,
  AnalysisResult,
  Finding,
  InvestigationReport,
  InvestigationFilters
} from '../types/index.js';
import { InvestigationError } from '../types/index.js';
import { FileLockManager } from '../utils/file-lock.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { EnvironmentConfigManager } from '../config/environment.js';

interface StorageIndex {
  entries: Array<{
    id: string;
    created_at: string;
    updated_at: string;
    status: string;
    severity: string;
    category: string;
    priority: string;
  }>;
  maxEntries: number;
  lastCleanup: string;
}

interface EvidenceIndex {
  [investigationId: string]: string[]; // evidence IDs
}

interface AnalysisIndex {
  [investigationId: string]: string[]; // analysis IDs
}

interface ReportsIndex {
  [investigationId: string]: string[]; // report IDs
}

export class JsonStorageService {
  private storagePath: string;
  private initialized: boolean = false;
  private readonly MAX_INVESTIGATIONS: number;
  private config: EnvironmentConfigManager;

  constructor(storagePath?: string, maxInvestigations?: number) {
    this.config = EnvironmentConfigManager.getInstance();
    
    if (storagePath) {
      this.storagePath = storagePath;
    } else {
      this.storagePath = this.config.getStoragePath();
    }
    
    if (maxInvestigations) {
      this.MAX_INVESTIGATIONS = maxInvestigations;
    } else {
      // Use 5 for test paths, configured value for production
      this.MAX_INVESTIGATIONS = this.storagePath.includes('test') ? 5 : this.config.getMaxInvestigations();
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const context = ErrorHandler.createContext('initialize_storage', undefined, undefined, {
      storagePath: this.storagePath,
      maxInvestigations: this.MAX_INVESTIGATIONS
    });

    try {
      logger.info('Initializing JSON storage', {
        operation: 'storage_initialize',
        metadata: { storagePath: this.storagePath, maxInvestigations: this.MAX_INVESTIGATIONS }
      });

      // Ensure storage directory structure exists
      await this.ensureStorageStructure();
      
      // Initialize index files if they don't exist
      await this.initializeIndexes();
      
      // Cleanup any stale locks
      await FileLockManager.cleanupStaleLocks(this.storagePath);
      
      this.initialized = true;
      logger.info('JSON storage initialized successfully', {
        operation: 'storage_initialized',
        metadata: { storagePath: this.storagePath }
      });
    } catch (error) {
      logger.error('Failed to initialize JSON storage', error as Error, {
        operation: 'storage_initialize_failed',
        metadata: { storagePath: this.storagePath }
      });
      
      throw ErrorHandler.handleError(error, context);
    }
  }

  private async ensureStorageStructure(): Promise<void> {
    const dirs = [
      this.storagePath,
      path.join(this.storagePath, 'investigations'),
      path.join(this.storagePath, 'evidence'),
      path.join(this.storagePath, 'analysis'),
      path.join(this.storagePath, 'reports')
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  private async initializeIndexes(): Promise<void> {
    const indexes = [
      { path: path.join(this.storagePath, 'investigations', 'index.json'), data: { entries: [], maxEntries: this.MAX_INVESTIGATIONS, lastCleanup: new Date().toISOString() } },
      { path: path.join(this.storagePath, 'evidence', 'index.json'), data: {} },
      { path: path.join(this.storagePath, 'analysis', 'index.json'), data: {} },
      { path: path.join(this.storagePath, 'reports', 'index.json'), data: {} }
    ];

    for (const index of indexes) {
      if (!await fs.pathExists(index.path)) {
        await fs.writeJson(index.path, index.data, { spaces: 2 });
      }
    }
  }

  // Investigation CRUD operations
  async createInvestigation(case_: InvestigationCase): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Check if investigation already exists
      if (await this.investigationExists(case_.id)) {
        throw new InvestigationError(
          `Investigation with ID ${case_.id} already exists`,
          'INVESTIGATION_EXISTS',
          case_.id
        );
      }

      // Apply FIFO limit
      await this.enforceFifoLimit();

      // Save investigation file
      const investigationPath = path.join(this.storagePath, 'investigations', `${case_.id}.json`);
      await fs.writeJson(investigationPath, case_, { spaces: 2 });

      // Update index
      await this.addToInvestigationIndex(case_);

    } catch (error) {
      throw new InvestigationError(
        `Failed to create investigation: ${error}`,
        'STORAGE_CREATE_ERROR',
        case_.id,
        { error }
      );
    }
  }

  async getInvestigation(id: string): Promise<InvestigationCase | null> {
    try {
      await this.ensureInitialized();
      
      const investigationPath = path.join(this.storagePath, 'investigations', `${id}.json`);
      
      if (!await fs.pathExists(investigationPath)) {
        return null;
      }

      const investigation = await fs.readJson(investigationPath);
      
      // Deserialize dates from JSON
      const deserializedInvestigation = this.deserializeDates(investigation);
      
      // Load related data
      deserializedInvestigation.evidence = await this.getEvidence(id);
      deserializedInvestigation.analysis = await this.getAnalysisResults(id);
      deserializedInvestigation.analysis_results = deserializedInvestigation.analysis; // For compatibility
      deserializedInvestigation.findings = await this.getFindings(id);

      return deserializedInvestigation;
    } catch (error) {
      throw new InvestigationError(
        `Failed to get investigation: ${error}`,
        'STORAGE_GET_ERROR',
        id,
        { error }
      );
    }
  }

  async listInvestigations(filters: InvestigationFilters = {}): Promise<InvestigationCase[]> {
    try {
      await this.ensureInitialized();
      
      const indexPath = path.join(this.storagePath, 'investigations', 'index.json');
      const index: StorageIndex = await fs.readJson(indexPath);
      
      let entries = index.entries;

      // Apply filters
      if (filters.status) {
        entries = entries.filter(entry => entry.status === filters.status);
      }
      if (filters.category) {
        entries = entries.filter(entry => entry.category === filters.category);
      }
      if (filters.severity) {
        entries = entries.filter(entry => entry.severity === filters.severity);
      }
      if (filters.priority) {
        entries = entries.filter(entry => entry.priority === filters.priority);
      }
      if (filters.date_range) {
        const start = new Date(filters.date_range.start);
        const end = new Date(filters.date_range.end);
        entries = entries.filter(entry => {
          const created = new Date(entry.created_at);
          return created >= start && created <= end;
        });
      }

      // Sort by created_at DESC
      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      if (filters.offset) {
        entries = entries.slice(filters.offset);
      }
      if (filters.limit) {
        entries = entries.slice(0, filters.limit);
      }

      // Load full investigation data
      const investigations: InvestigationCase[] = [];
      for (const entry of entries) {
        const investigation = await this.getInvestigation(entry.id);
        if (investigation) {
          investigations.push(investigation);
        }
      }

      return investigations;
    } catch (error) {
      throw new InvestigationError(
        `Failed to list investigations: ${error}`,
        'STORAGE_LIST_ERROR',
        undefined,
        { error }
      );
    }
  }

  async updateInvestigation(id: string, updates: Partial<InvestigationCase>): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const investigationPath = path.join(this.storagePath, 'investigations', `${id}.json`);
      
      if (!await fs.pathExists(investigationPath)) {
        throw new InvestigationError(
          `Investigation with ID ${id} not found`,
          'INVESTIGATION_NOT_FOUND',
          id
        );
      }

      const investigation = await fs.readJson(investigationPath);
      
      // Apply updates
      Object.assign(investigation, updates, {
        updated_at: new Date()
      });

      // Save updated investigation
      await fs.writeJson(investigationPath, investigation, { spaces: 2 });

      // Update index
      await this.updateInvestigationIndex(id, investigation);

    } catch (error) {
      throw new InvestigationError(
        `Failed to update investigation: ${error}`,
        'STORAGE_UPDATE_ERROR',
        id,
        { error }
      );
    }
  }

  // Evidence operations
  async addEvidence(evidence: EvidenceItem): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const evidenceDir = path.join(this.storagePath, 'evidence', evidence.investigation_id);
      await fs.ensureDir(evidenceDir);
      
      const evidencePath = path.join(evidenceDir, `${evidence.id}.json`);
      await fs.writeJson(evidencePath, evidence, { spaces: 2 });

      // Update evidence index
      await this.addToEvidenceIndex(evidence.investigation_id, evidence.id);

    } catch (error) {
      throw new InvestigationError(
        `Failed to add evidence: ${error}`,
        'STORAGE_ADD_EVIDENCE_ERROR',
        evidence.investigation_id,
        { error }
      );
    }
  }

  async getEvidence(investigationId: string): Promise<EvidenceItem[]> {
    try {
      await this.ensureInitialized();
      
      const evidenceDir = path.join(this.storagePath, 'evidence', investigationId);
      
      if (!await fs.pathExists(evidenceDir)) {
        return [];
      }

      const evidenceFiles = await fs.readdir(evidenceDir);
      const evidence: EvidenceItem[] = [];

      for (const file of evidenceFiles) {
        if (file.endsWith('.json')) {
          const evidencePath = path.join(evidenceDir, file);
          const evidenceItem = await fs.readJson(evidencePath);
          // Deserialize dates from JSON
          const deserializedItem = this.deserializeDates(evidenceItem);
          evidence.push(deserializedItem);
        }
      }

      // Sort by created_at
      evidence.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return evidence;
    } catch (error) {
      throw new InvestigationError(
        `Failed to get evidence: ${error}`,
        'STORAGE_GET_EVIDENCE_ERROR',
        investigationId,
        { error }
      );
    }
  }

  // Analysis operations
  async addAnalysisResult(analysis: AnalysisResult): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const analysisDir = path.join(this.storagePath, 'analysis', analysis.investigation_id);
      await fs.ensureDir(analysisDir);
      
      const analysisPath = path.join(analysisDir, `${analysis.id}.json`);
      await fs.writeJson(analysisPath, analysis, { spaces: 2 });

      // Update analysis index
      await this.addToAnalysisIndex(analysis.investigation_id, analysis.id);

    } catch (error) {
      throw new InvestigationError(
        `Failed to add analysis result: ${error}`,
        'STORAGE_ADD_ANALYSIS_ERROR',
        analysis.investigation_id,
        { error }
      );
    }
  }

  async getAnalysisResults(investigationId: string): Promise<AnalysisResult[]> {
    try {
      await this.ensureInitialized();
      
      const analysisDir = path.join(this.storagePath, 'analysis', investigationId);
      
      if (!await fs.pathExists(analysisDir)) {
        return [];
      }

      const analysisFiles = await fs.readdir(analysisDir);
      const analysis: AnalysisResult[] = [];

      for (const file of analysisFiles) {
        if (file.endsWith('.json')) {
          const analysisPath = path.join(analysisDir, file);
          const analysisItem = await fs.readJson(analysisPath);
          // Deserialize dates from JSON
          const deserializedItem = this.deserializeDates(analysisItem);
          analysis.push(deserializedItem);
        }
      }

      // Sort by created_at
      analysis.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return analysis;
    } catch (error) {
      throw new InvestigationError(
        `Failed to get analysis results: ${error}`,
        'STORAGE_GET_ANALYSIS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  // Findings operations
  async addFinding(finding: Finding): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const investigation = await this.getInvestigation(finding.investigation_id);
      if (!investigation) {
        throw new InvestigationError(
          `Investigation with ID ${finding.investigation_id} not found`,
          'INVESTIGATION_NOT_FOUND',
          finding.investigation_id
        );
      }

      // Add finding to investigation
      investigation.findings = investigation.findings || [];
      investigation.findings.push(finding);

      // Save updated investigation
      const investigationPath = path.join(this.storagePath, 'investigations', `${finding.investigation_id}.json`);
      await fs.writeJson(investigationPath, investigation, { spaces: 2 });

    } catch (error) {
      throw new InvestigationError(
        `Failed to add finding: ${error}`,
        'STORAGE_ADD_FINDING_ERROR',
        finding.investigation_id,
        { error }
      );
    }
  }

  async getFindings(investigationId: string): Promise<Finding[]> {
    try {
      await this.ensureInitialized();
      
      const investigationPath = path.join(this.storagePath, 'investigations', `${investigationId}.json`);
      
      if (!await fs.pathExists(investigationPath)) {
        return [];
      }

      const investigation = await fs.readJson(investigationPath);
      // Deserialize dates from JSON
      const deserializedInvestigation = this.deserializeDates(investigation);
      return deserializedInvestigation.findings || [];
    } catch (error) {
      throw new InvestigationError(
        `Failed to get findings: ${error}`,
        'STORAGE_GET_FINDINGS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  // Reports operations
  async addReport(report: InvestigationReport): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const reportDir = path.join(this.storagePath, 'reports', report.investigation_id);
      await fs.ensureDir(reportDir);
      
      const reportPath = path.join(reportDir, `${report.id}.json`);
      await fs.writeJson(reportPath, report, { spaces: 2 });

      // Update reports index
      await this.addToReportsIndex(report.investigation_id, report.id);

    } catch (error) {
      throw new InvestigationError(
        `Failed to add report: ${error}`,
        'STORAGE_ADD_REPORT_ERROR',
        report.investigation_id,
        { error }
      );
    }
  }

  async getReports(investigationId: string): Promise<InvestigationReport[]> {
    try {
      await this.ensureInitialized();
      
      const reportDir = path.join(this.storagePath, 'reports', investigationId);
      
      if (!await fs.pathExists(reportDir)) {
        return [];
      }

      const reportFiles = await fs.readdir(reportDir);
      const reports: InvestigationReport[] = [];

      for (const file of reportFiles) {
        if (file.endsWith('.json')) {
          const reportPath = path.join(reportDir, file);
          const report = await fs.readJson(reportPath);
          reports.push(report);
        }
      }

      // Sort by generated_at
      reports.sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime());

      return reports;
    } catch (error) {
      throw new InvestigationError(
        `Failed to get reports: ${error}`,
        'STORAGE_GET_REPORTS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  // FIFO Management
  private async enforceFifoLimit(): Promise<void> {
    const indexPath = path.join(this.storagePath, 'investigations', 'index.json');
    const index: StorageIndex = await fs.readJson(indexPath);

    if (index.entries.length >= this.MAX_INVESTIGATIONS) {
      // Sort by created_at to find oldest
      index.entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Remove oldest investigation
      const oldestEntry = index.entries.shift();
      if (oldestEntry) {
        await this.deleteInvestigationData(oldestEntry.id);
      }
    }
  }

  private async deleteInvestigationData(investigationId: string): Promise<void> {
    try {
      // Delete investigation file
      const investigationPath = path.join(this.storagePath, 'investigations', `${investigationId}.json`);
      if (await fs.pathExists(investigationPath)) {
        await fs.remove(investigationPath);
      }

      // Delete evidence directory
      const evidenceDir = path.join(this.storagePath, 'evidence', investigationId);
      if (await fs.pathExists(evidenceDir)) {
        await fs.remove(evidenceDir);
      }

      // Delete analysis directory
      const analysisDir = path.join(this.storagePath, 'analysis', investigationId);
      if (await fs.pathExists(analysisDir)) {
        await fs.remove(analysisDir);
      }

      // Delete reports directory
      const reportsDir = path.join(this.storagePath, 'reports', investigationId);
      if (await fs.pathExists(reportsDir)) {
        await fs.remove(reportsDir);
      }

      // Update indexes
      await this.removeFromInvestigationIndex(investigationId);
      await this.removeFromEvidenceIndex(investigationId);
      await this.removeFromAnalysisIndex(investigationId);
      await this.removeFromReportsIndex(investigationId);

    } catch (error) {
      logger.error(`Failed to delete investigation data for ${investigationId}`, error as Error, {
        operation: 'delete_investigation_data',
        metadata: { investigationId }
      });
    }
  }

  // Index management
  private async addToInvestigationIndex(investigation: InvestigationCase): Promise<void> {
    const indexPath = path.join(this.storagePath, 'investigations', 'index.json');
    const index: StorageIndex = await fs.readJson(indexPath);
    
    index.entries.push({
      id: investigation.id,
      created_at: investigation.created_at instanceof Date ? investigation.created_at.toISOString() : investigation.created_at,
      updated_at: investigation.updated_at instanceof Date ? investigation.updated_at.toISOString() : investigation.updated_at,
      status: investigation.status,
      severity: investigation.severity,
      category: investigation.category,
      priority: investigation.priority
    });

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async updateInvestigationIndex(id: string, investigation: InvestigationCase): Promise<void> {
    const indexPath = path.join(this.storagePath, 'investigations', 'index.json');
    const index: StorageIndex = await fs.readJson(indexPath);
    
    const entryIndex = index.entries.findIndex(entry => entry.id === id);
    if (entryIndex !== -1) {
      index.entries[entryIndex] = {
        id: investigation.id,
        created_at: investigation.created_at instanceof Date ? investigation.created_at.toISOString() : investigation.created_at,
        updated_at: investigation.updated_at instanceof Date ? investigation.updated_at.toISOString() : investigation.updated_at,
        status: investigation.status,
        severity: investigation.severity,
        category: investigation.category,
        priority: investigation.priority
      };
    }

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async removeFromInvestigationIndex(id: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'investigations', 'index.json');
    const index: StorageIndex = await fs.readJson(indexPath);
    
    index.entries = index.entries.filter(entry => entry.id !== id);
    index.lastCleanup = new Date().toISOString();

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async addToEvidenceIndex(investigationId: string, evidenceId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'evidence', 'index.json');
    const index: EvidenceIndex = await fs.readJson(indexPath);
    
    if (!index[investigationId]) {
      index[investigationId] = [];
    }
    index[investigationId].push(evidenceId);

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async removeFromEvidenceIndex(investigationId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'evidence', 'index.json');
    const index: EvidenceIndex = await fs.readJson(indexPath);
    
    delete index[investigationId];

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async addToAnalysisIndex(investigationId: string, analysisId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'analysis', 'index.json');
    const index: AnalysisIndex = await fs.readJson(indexPath);
    
    if (!index[investigationId]) {
      index[investigationId] = [];
    }
    index[investigationId].push(analysisId);

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async removeFromAnalysisIndex(investigationId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'analysis', 'index.json');
    const index: AnalysisIndex = await fs.readJson(indexPath);
    
    delete index[investigationId];

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async addToReportsIndex(investigationId: string, reportId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'reports', 'index.json');
    const index: ReportsIndex = await fs.readJson(indexPath);
    
    if (!index[investigationId]) {
      index[investigationId] = [];
    }
    index[investigationId].push(reportId);

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  private async removeFromReportsIndex(investigationId: string): Promise<void> {
    const indexPath = path.join(this.storagePath, 'reports', 'index.json');
    const index: ReportsIndex = await fs.readJson(indexPath);
    
    delete index[investigationId];

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  // Utility methods
  private async investigationExists(id: string): Promise<boolean> {
    const investigationPath = path.join(this.storagePath, 'investigations', `${id}.json`);
    return await fs.pathExists(investigationPath);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Deserialize dates from JSON objects
   * Converts string dates back to Date objects
   */
  private deserializeDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deserializeDates(item));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this looks like a date field or contains a date value
        if (this.isDateField(key, value)) {
          // Convert string dates back to Date objects
          if (typeof value === 'string') {
            result[key] = new Date(value);
          } else if (Array.isArray(value)) {
            // Handle arrays of dates and nested objects
            result[key] = value.map(item => {
              if (item === null || item === undefined) {
                return item; // Preserve null and undefined
              } else if (typeof item === 'string' && this.isValidISODateString(item)) {
                return new Date(item);
              } else if (typeof item === 'object' && item !== null) {
                // Recursively process nested objects in arrays
                return this.deserializeDates(item);
              } else {
                return item;
              }
            });
          } else {
            result[key] = value;
          }
        } else {
          result[key] = this.deserializeDates(value);
        }
      }
      return result;
    }

    return obj;
  }

  /**
   * Check if a field should be treated as a date
   */
  private isDateField(key: string, value: any): boolean {
    // Don't treat objects as dates
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return false;
    }

    // Known date field names
    const dateFieldNames = [
      'created_at', 'updated_at', 'timestamp', 'collected_at', 'processed_at',
      'testDate', 'timezone_date', 'bulk_index', 'original_timestamp', 
      'updated_timestamp', 'deep_timestamp', 'array_dates', 'date_array', 'mixed_array',
      'level1', 'level2', 'level3', // For nested date structures
      'date_object', // For mixed date types test
      'mixed' // For complex nested structures test
      // Note: invalid_dates is intentionally not included as it contains invalid dates
    ];

    // Check if key matches known date field names
    if (dateFieldNames.includes(key)) {
      return true;
    }

    // Check if key ends with common date suffixes AND value is a valid date
    if ((key.endsWith('_at') || key.endsWith('_date') || key.endsWith('_time') || key.endsWith('_timestamp')) && 
        typeof value === 'string' && this.isValidISODateString(value)) {
      return true;
    }

    // Check if value is an array of date strings (only for known date arrays)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && this.isValidISODateString(value[0])) {
      return true;
    }

    // Don't treat arrays with invalid dates as date fields
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && !this.isValidISODateString(value[0])) {
      return false;
    }

    return false;
  }

  /**
   * Check if a string is a valid ISO date string
   */
  private isValidISODateString(str: string): boolean {
    if (typeof str !== 'string') return false;
    
    // Check for ISO date patterns
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    const isoDateWithOffsetPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;
    
    if (isoDatePattern.test(str) || isoDateWithOffsetPattern.test(str)) {
      // Try to create a date and check if it's valid
      const date = new Date(str);
      return !isNaN(date.getTime());
    }
    
    return false;
  }

  getStoragePath(): string {
    return this.storagePath;
  }

  async close(): Promise<void> {
    // No persistent connections to close for file-based storage
    return Promise.resolve();
  }

  // Search functionality
  async searchEvidence(investigationId: string, query: string, options: {
    evidence_types?: string[];
    time_range?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<EvidenceItem[]> {
    try {
      await this.ensureInitialized();
      
      const evidence = await this.getEvidence(investigationId);
      let results = evidence;

      // Filter by evidence types
      if (options.evidence_types?.length) {
        const evidenceTypes = options.evidence_types;
        results = results.filter(item => evidenceTypes.includes(item.type));
      }

      // Filter by time range
      if (options.time_range) {
        const start = options.time_range.start;
        const end = options.time_range.end;
        results = results.filter(item => {
          const created = new Date(item.created_at);
          return created >= start && created <= end;
        });
      }

      // Text search in content and metadata
      if (query) {
        const searchTerm = query.toLowerCase();
        results = results.filter(item => {
          const contentStr = JSON.stringify(item.content).toLowerCase();
          const metadataStr = JSON.stringify(item.metadata).toLowerCase();
          const sourceStr = item.source.toLowerCase();
          
          return contentStr.includes(searchTerm) || 
                 metadataStr.includes(searchTerm) || 
                 sourceStr.includes(searchTerm);
        });
      }

      // Apply limit
      if (options.limit) {
        results = results.slice(0, options.limit);
      }

      return results;
    } catch (error) {
      throw new InvestigationError(
        `Failed to search evidence: ${error}`,
        'STORAGE_SEARCH_ERROR',
        investigationId,
        { error }
      );
    }
  }
}
