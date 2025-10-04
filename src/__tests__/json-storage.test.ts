import { JsonStorageService } from '../services/json-storage.js';
import type { InvestigationCase, EvidenceItem, AnalysisResult, Finding, InvestigationReport } from '../types/index.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('JsonStorageService', () => {
  let storage: JsonStorageService;
  let tempStoragePath: string;

  beforeEach(async () => {
    tempStoragePath = path.join(os.tmpdir(), `json-storage-test-${Date.now()}`);
    storage = new JsonStorageService(tempStoragePath, 5); // Use 5 for testing
    await storage.initialize();
  });

  afterEach(async () => {
    if (await fs.pathExists(tempStoragePath)) {
      await fs.remove(tempStoragePath);
    }
  });

  describe('Initialization', () => {
    test('should initialize storage directory structure', async () => {
      expect(await fs.pathExists(tempStoragePath)).toBe(true);
      expect(await fs.pathExists(path.join(tempStoragePath, 'investigations'))).toBe(true);
      expect(await fs.pathExists(path.join(tempStoragePath, 'evidence'))).toBe(true);
      expect(await fs.pathExists(path.join(tempStoragePath, 'analysis'))).toBe(true);
      expect(await fs.pathExists(path.join(tempStoragePath, 'reports'))).toBe(true);
    });

    test('should create index files', async () => {
      const investigationsIndex = await fs.readJson(path.join(tempStoragePath, 'investigations', 'index.json'));
      expect(investigationsIndex).toEqual({
        version: '1.0.0',
        entries: []
      });
    });
  });

  describe('Investigation CRUD Operations', () => {
    const testInvestigation: InvestigationCase = {
      id: 'test-investigation-1',
      title: 'Test Investigation',
      description: 'A test investigation',
      status: 'active',
      severity: 'medium',
      category: 'performance',
      priority: 'p2',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: 'test-user',
      affected_systems: ['system1', 'system2'],
      evidence: [],
      analysis: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: { test: true }
    };

    test('should create investigation', async () => {
      await storage.createInvestigation(testInvestigation);
      
      const investigationPath = path.join(tempStoragePath, 'investigations', 'test-investigation-1.json');
      expect(await fs.pathExists(investigationPath)).toBe(true);
      
      const savedInvestigation = await fs.readJson(investigationPath);
      expect(savedInvestigation.id).toBe('test-investigation-1');
      expect(savedInvestigation.title).toBe('Test Investigation');
    });

    test('should get investigation', async () => {
      await storage.createInvestigation(testInvestigation);
      
      const retrieved = await storage.getInvestigation('test-investigation-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-investigation-1');
      expect(retrieved?.title).toBe('Test Investigation');
    });

    test('should return null for non-existent investigation', async () => {
      const retrieved = await storage.getInvestigation('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should update investigation', async () => {
      await storage.createInvestigation(testInvestigation);
      
      const updates = {
        title: 'Updated Investigation',
        status: 'completed' as const
      };
      
      await storage.updateInvestigation('test-investigation-1', updates);
      
      const updated = await storage.getInvestigation('test-investigation-1');
      expect(updated?.title).toBe('Updated Investigation');
      expect(updated?.status).toBe('completed');
      expect(updated?.updated_at).not.toEqual(testInvestigation.updated_at);
    });

    test('should list investigations', async () => {
      await storage.createInvestigation(testInvestigation);
      
      const investigations = await storage.listInvestigations();
      expect(investigations).toHaveLength(1);
      expect(investigations[0].id).toBe('test-investigation-1');
    });

    test('should handle investigation operations', async () => {
      await storage.createInvestigation(testInvestigation);
      
      // Test that investigation exists
      const retrieved = await storage.getInvestigation('test-investigation-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-investigation-1');
    });
  });

  describe('Evidence Operations', () => {
    const testEvidence: EvidenceItem = {
      id: 'test-evidence-1',
      investigation_id: 'test-investigation-1',
      type: 'log',
      source: 'application.log',
      content: { message: 'Test log entry' },
      metadata: {
        timestamp: new Date(),
        size: 1024,
        checksum: 'test-checksum',
        collected_by: 'test-user',
        collection_method: 'manual',
        source_system: 'test-system'
      },
      chain_of_custody: [],
      tags: ['test'],
      created_at: new Date()
    };

    beforeEach(async () => {
      const testInvestigation: InvestigationCase = {
        id: 'test-investigation-1',
        title: 'Test Investigation',
        description: 'A test investigation',
        status: 'active',
        severity: 'medium',
        category: 'performance',
        priority: 'p2',
        created_at: new Date(),
        updated_at: new Date(),
        reported_by: 'test-user',
        affected_systems: [],
        evidence: [],
        analysis: [],
        analysis_results: [],
        findings: [],
        root_causes: [],
        contributing_factors: [],
        recommendations: [],
        metadata: {}
      };
      await storage.createInvestigation(testInvestigation);
    });

    test('should add evidence', async () => {
      await storage.addEvidence(testEvidence);
      
      const evidencePath = path.join(tempStoragePath, 'evidence', 'test-investigation-1', 'test-evidence-1.json');
      expect(await fs.pathExists(evidencePath)).toBe(true);
      
      const savedEvidence = await fs.readJson(evidencePath);
      expect(savedEvidence.id).toBe('test-evidence-1');
      expect(savedEvidence.investigation_id).toBe('test-investigation-1');
    });

    test('should get evidence', async () => {
      await storage.addEvidence(testEvidence);
      
      const retrieved = await storage.getEvidence('test-investigation-1');
      expect(retrieved).toBeDefined();
      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].id).toBe('test-evidence-1');
    });
  });

  describe('Analysis Operations', () => {
    const testAnalysis: AnalysisResult = {
      id: 'test-analysis-1',
      investigation_id: 'test-investigation-1',
      type: 'causal',
      hypothesis: 'Test hypothesis',
      confidence: 0.8,
      evidence_supporting: ['test-evidence-1'],
      evidence_contradicting: [],
      conclusions: ['Test conclusion'],
      recommendations: ['Test recommendation'],
      methodology: 'Test methodology',
      limitations: ['Test limitation'],
      created_at: new Date(),
      updated_at: new Date()
    };

    beforeEach(async () => {
      const testInvestigation: InvestigationCase = {
        id: 'test-investigation-1',
        title: 'Test Investigation',
        description: 'A test investigation',
        status: 'active',
        severity: 'medium',
        category: 'performance',
        priority: 'p2',
        created_at: new Date(),
        updated_at: new Date(),
        reported_by: 'test-user',
        affected_systems: [],
        evidence: [],
        analysis: [],
        analysis_results: [],
        findings: [],
        root_causes: [],
        contributing_factors: [],
        recommendations: [],
        metadata: {}
      };
      await storage.createInvestigation(testInvestigation);
    });

    test('should add analysis result', async () => {
      await storage.addAnalysisResult(testAnalysis);
      
      const analysisPath = path.join(tempStoragePath, 'analysis', 'test-investigation-1', 'test-analysis-1.json');
      expect(await fs.pathExists(analysisPath)).toBe(true);
    });

    test('should get analysis results', async () => {
      await storage.addAnalysisResult(testAnalysis);
      
      const analysisList = await storage.getAnalysisResults('test-investigation-1');
      expect(analysisList).toHaveLength(1);
      expect(analysisList[0].id).toBe('test-analysis-1');
    });
  });

  describe('FIFO Management', () => {
    test('should enforce FIFO limit', async () => {
      // Create 6 investigations to test FIFO limit of 5
      for (let i = 0; i < 6; i++) {
        const investigation: InvestigationCase = {
          id: `test-investigation-${i}`,
          title: `Test Investigation ${i}`,
          description: `A test investigation ${i}`,
          status: 'active',
          severity: 'medium',
          category: 'performance',
          priority: 'p2',
          created_at: new Date(Date.now() + i * 1000), // Ensure different timestamps
          updated_at: new Date(Date.now() + i * 1000),
          reported_by: 'test-user',
          affected_systems: [],
          evidence: [],
          analysis: [],
          analysis_results: [],
          findings: [],
          root_causes: [],
          contributing_factors: [],
          recommendations: [],
          metadata: {}
        };
        await storage.createInvestigation(investigation);
      }

      // Should only have 5 investigations due to FIFO limit
      const allInvestigations = await storage.listInvestigations();
      expect(allInvestigations).toHaveLength(5);

      // The first investigation should be removed (oldest)
      const firstInvestigation = await storage.getInvestigation('test-investigation-0');
      expect(firstInvestigation).toBeNull();

      // The last investigation should still exist (newest)
      const lastInvestigation = await storage.getInvestigation('test-investigation-5');
      expect(lastInvestigation).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle investigation not found during update', async () => {
      await expect(storage.updateInvestigation('non-existent', { title: 'Updated' }))
        .rejects.toThrow('Investigation not found');
    });

    test('should handle duplicate investigation creation', async () => {
      const testInvestigation: InvestigationCase = {
        id: 'duplicate-test',
        title: 'Test Investigation',
        description: 'A test investigation',
        status: 'active',
        severity: 'medium',
        category: 'performance',
        priority: 'p2',
        created_at: new Date(),
        updated_at: new Date(),
        reported_by: 'test-user',
        affected_systems: [],
        evidence: [],
        analysis: [],
        analysis_results: [],
        findings: [],
        root_causes: [],
        contributing_factors: [],
        recommendations: [],
        metadata: {}
      };

      await storage.createInvestigation(testInvestigation);
      
      await expect(storage.createInvestigation(testInvestigation))
        .rejects.toThrow('Investigation with ID duplicate-test already exists');
    });
  });
});
