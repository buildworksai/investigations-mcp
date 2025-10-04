/**
 * Basic tests for investigation functionality
 */

import { InvestigationDatabase } from '../services/database.js';
import type { InvestigationCase, EvidenceItem } from '../types/index.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Investigation System', () => {
  let database: InvestigationDatabase;
  let tempStoragePath: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempStoragePath = path.join(os.tmpdir(), `investigations-test-${Date.now()}`);
    database = new InvestigationDatabase(tempStoragePath);
    await database.initialize();
  });

  afterEach(async () => {
    await database.close();
    // Clean up temporary directory
    if (await fs.pathExists(tempStoragePath)) {
      await fs.remove(tempStoragePath);
    }
  });

  test('should create database instance', () => {
    expect(database).toBeDefined();
    expect(database.getDatabasePath()).toBe(tempStoragePath);
  });

  test('should initialize database', async () => {
    await expect(database.initialize()).resolves.not.toThrow();
  });

  test('should create and retrieve investigation', async () => {
    const investigation: InvestigationCase = {
      id: `test-${Date.now()}`,
      title: 'Test Investigation',
      description: 'A test investigation for unit testing',
      status: 'active',
      severity: 'medium',
      category: 'performance',
      priority: 'p2',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: 'test-user',
      assigned_to: 'test-investigator',
      affected_systems: ['test-system'],
      evidence: [],
      analysis: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: { test: true }
    };

    await database.createInvestigation(investigation);
    
    const retrieved = await database.getInvestigation(investigation.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(investigation.id);
    expect(retrieved?.title).toBe(investigation.title);
    expect(retrieved?.status).toBe(investigation.status);
  }, 10000);

  test('should list investigations', async () => {
    const investigation: InvestigationCase = {
      id: `test-${Date.now()}`,
      title: 'Test Investigation',
      description: 'A test investigation for unit testing',
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

    await database.createInvestigation(investigation);
    
    const investigations = await database.listInvestigations();
    expect(investigations).toHaveLength(1);
    expect(investigations[0].id).toBe(investigation.id);
  }, 10000);

  test('should add and retrieve evidence', async () => {
    const investigationId = `test-${Date.now()}`;
    const investigation: InvestigationCase = {
      id: investigationId,
      title: 'Test Investigation',
      description: 'A test investigation for unit testing',
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

    await database.createInvestigation(investigation);

    const evidence: EvidenceItem = {
      id: `evidence-${Date.now()}`,
      investigation_id: investigationId,
      type: 'log',
      source: 'test-source',
      content: { message: 'test log entry' },
      metadata: {
        timestamp: new Date(),
        size: 100,
        checksum: 'test-checksum',
        collected_by: 'test-collector',
        collection_method: 'test-method',
        source_system: 'test-system'
      },
      chain_of_custody: [],
      tags: ['test'],
      created_at: new Date()
    };

    await database.addEvidence(evidence);
    
    const retrievedEvidence = await database.getEvidence(investigationId);
    expect(retrievedEvidence).toHaveLength(1);
    expect(retrievedEvidence[0].id).toBe(evidence.id);
    expect(retrievedEvidence[0].type).toBe(evidence.type);
  });

  test('should update investigation', async () => {
    const investigation: InvestigationCase = {
      id: `test-${Date.now()}`,
      title: 'Test Investigation',
      description: 'A test investigation for unit testing',
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

    await database.createInvestigation(investigation);
    
    await database.updateInvestigation(investigation.id, {
      status: 'completed',
      severity: 'high'
    });

    const updated = await database.getInvestigation(investigation.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.severity).toBe('high');
  });

  test('should enforce FIFO limit', async () => {
    // Create 6 investigations to test FIFO limit of 5 (reduced for faster testing)
    const investigations: InvestigationCase[] = [];
    
    for (let i = 0; i < 6; i++) {
      const investigation: InvestigationCase = {
        id: `test-${Date.now()}-${i}`,
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
      investigations.push(investigation);
      await database.createInvestigation(investigation);
    }

    // Should only have 5 investigations due to FIFO limit
    const allInvestigations = await database.listInvestigations();
    expect(allInvestigations).toHaveLength(5);
    
    // The first investigation should be removed (oldest)
    const firstInvestigation = await database.getInvestigation(investigations[0].id);
    expect(firstInvestigation).toBeNull();
    
    // The last investigation should still exist (newest)
    const lastInvestigation = await database.getInvestigation(investigations[5].id);
    expect(lastInvestigation).toBeDefined();
  }, 15000);
});