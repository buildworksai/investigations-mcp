/**
 * Database service for investigations MCP tools
 * Provides JSON-based storage with FIFO limit and data integrity
 */

import type {
  InvestigationCase,
  EvidenceItem,
  AnalysisResult,
  Finding,
  InvestigationReport,
  InvestigationFilters
} from '../types/index.js';
import { InvestigationError } from '../types/index.js';
import { JsonStorageService } from './json-storage.js';

export class InvestigationDatabase {
  private storage: JsonStorageService;
  private initialized: boolean = false;

  constructor(storagePath?: string) {
    // Initialize JSON storage service
    this.storage = new JsonStorageService(storagePath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.storage.initialize();
      this.initialized = true;
    } catch (error) {
      throw new InvestigationError(
        `Failed to initialize JSON storage: ${error}`,
        'STORAGE_INIT_ERROR',
        undefined,
        { error }
      );
    }
  }

  async createInvestigation(case_: InvestigationCase): Promise<void> {
    try {
      await this.storage.createInvestigation(case_);
    } catch (error) {
      throw new InvestigationError(
        `Failed to create investigation: ${error}`,
        'DATABASE_CREATE_ERROR',
        case_.id,
        { error }
      );
    }
  }

  async getInvestigation(id: string): Promise<InvestigationCase | null> {
    try {
      return await this.storage.getInvestigation(id);
    } catch (error) {
      throw new InvestigationError(
        `Failed to get investigation: ${error}`,
        'DATABASE_GET_ERROR',
        id,
        { error }
      );
    }
  }

  async listInvestigations(filters: InvestigationFilters = {}): Promise<InvestigationCase[]> {
    try {
      return await this.storage.listInvestigations(filters);
    } catch (error) {
      throw new InvestigationError(
        `Failed to list investigations: ${error}`,
        'DATABASE_LIST_ERROR',
        undefined,
        { error }
      );
    }
  }


  async addEvidence(evidence: EvidenceItem): Promise<void> {
    try {
      await this.storage.addEvidence(evidence);
    } catch (error) {
      throw new InvestigationError(
        `Failed to add evidence: ${error}`,
        'DATABASE_ADD_EVIDENCE_ERROR',
        evidence.investigation_id,
        { error }
      );
    }
  }

  async getEvidence(investigationId: string): Promise<EvidenceItem[]> {
    try {
      return await this.storage.getEvidence(investigationId);
    } catch (error) {
      throw new InvestigationError(
        `Failed to get evidence: ${error}`,
        'DATABASE_GET_EVIDENCE_ERROR',
        investigationId,
        { error }
      );
    }
  }

  async updateInvestigation(id: string, updates: Partial<InvestigationCase>): Promise<void> {
    try {
      await this.storage.updateInvestigation(id, updates);
    } catch (error) {
      throw new InvestigationError(
        `Failed to update investigation: ${error}`,
        'DATABASE_UPDATE_ERROR',
        id,
        { error }
      );
    }
  }

  getDatabasePath(): string {
    return this.storage.getStoragePath();
  }

  async close(): Promise<void> {
    return await this.storage.close();
  }

  // Additional methods for analysis, findings, and reports
  async addAnalysisResult(analysis: AnalysisResult): Promise<void> {
    try {
      await this.storage.addAnalysisResult(analysis);
    } catch (error) {
      throw new InvestigationError(
        `Failed to add analysis result: ${error}`,
        'DATABASE_ADD_ANALYSIS_ERROR',
        analysis.investigation_id,
        { error }
      );
    }
  }

  async getAnalysisResults(investigationId: string): Promise<AnalysisResult[]> {
    try {
      return await this.storage.getAnalysisResults(investigationId);
    } catch (error) {
      throw new InvestigationError(
        `Failed to get analysis results: ${error}`,
        'DATABASE_GET_ANALYSIS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  async addFinding(finding: Finding): Promise<void> {
    try {
      await this.storage.addFinding(finding);
    } catch (error) {
      throw new InvestigationError(
        `Failed to add finding: ${error}`,
        'DATABASE_ADD_FINDING_ERROR',
        finding.investigation_id,
        { error }
      );
    }
  }

  async getFindings(investigationId: string): Promise<Finding[]> {
    try {
      return await this.storage.getFindings(investigationId);
    } catch (error) {
      throw new InvestigationError(
        `Failed to get findings: ${error}`,
        'DATABASE_GET_FINDINGS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  async addReport(report: InvestigationReport): Promise<void> {
    try {
      await this.storage.addReport(report);
    } catch (error) {
      throw new InvestigationError(
        `Failed to add report: ${error}`,
        'DATABASE_ADD_REPORT_ERROR',
        report.investigation_id,
        { error }
      );
    }
  }

  async getReports(investigationId: string): Promise<InvestigationReport[]> {
    try {
      return await this.storage.getReports(investigationId);
    } catch (error) {
      throw new InvestigationError(
        `Failed to get reports: ${error}`,
        'DATABASE_GET_REPORTS_ERROR',
        investigationId,
        { error }
      );
    }
  }

  async searchEvidence(investigationId: string, query: string, options: {
    evidence_types?: string[];
    time_range?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<EvidenceItem[]> {
    try {
      return await this.storage.searchEvidence(investigationId, query, options);
    } catch (error) {
      throw new InvestigationError(
        `Failed to search evidence: ${error}`,
        'DATABASE_SEARCH_ERROR',
        investigationId,
        { error }
      );
    }
  }

  getStoragePath(): string {
    return this.storage.getStoragePath();
  }
}