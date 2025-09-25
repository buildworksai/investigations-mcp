/**
 * Basic tests for investigation functionality
 */

import { InvestigationDatabase } from '../services/database.js';
import { EvidenceCollector } from '../collectors/evidence-collector.js';
import { AnalysisEngine } from '../analyzers/analysis-engine.js';
import { InvestigationCase, EvidenceItem } from '../types/index.js';

describe('Investigation System', () => {
  let database: InvestigationDatabase;
  let evidenceCollector: EvidenceCollector;
  let analysisEngine: AnalysisEngine;

  beforeEach(async () => {
    database = new InvestigationDatabase(':memory:');
    await database.initialize();
    evidenceCollector = new EvidenceCollector();
    analysisEngine = new AnalysisEngine();
  });

  afterEach(async () => {
    await database.close();
  });

  test('should create investigation case', async () => {
    const investigation: InvestigationCase = {
      id: 'test-inv-001',
      title: 'Test Investigation',
      description: 'A test investigation case',
      status: 'active',
      severity: 'medium',
      category: 'performance',
      priority: 'p3',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: 'test-user',
      affected_systems: ['test-system'],
      evidence: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: {}
    };

    await database.createInvestigation(investigation);
    const retrieved = await database.getInvestigation('test-inv-001');
    
    expect(retrieved).toBeTruthy();
    expect(retrieved?.title).toBe('Test Investigation');
    expect(retrieved?.status).toBe('active');
  });

  test('should collect evidence', async () => {
    const source = {
      type: 'logs' as const,
      path: '/tmp/test.log'
    };

    const options = {
      investigation_id: 'test-inv-001',
      preserve_chain_of_custody: true
    };

    // Create a test log file
    const fs = await import('fs/promises');
    await fs.writeFile('/tmp/test.log', 'Test log content\nLine 2\nLine 3', 'utf-8');

    try {
      const evidence = await evidenceCollector.collect(source, options);
      
      expect(evidence).toBeTruthy();
      expect(evidence.type).toBe('log');
      expect(evidence.source).toBe('/tmp/test.log');
      expect(evidence.chain_of_custody.length).toBeGreaterThan(0);
    } finally {
      // Clean up test file
      await fs.unlink('/tmp/test.log').catch(() => {});
    }
  });

  test('should perform timeline analysis', async () => {
    const evidence: EvidenceItem[] = [
      {
        id: 'ev-001',
        investigation_id: 'test-inv-001',
        type: 'log',
        source: 'test.log',
        content: { raw_content: 'Test log content' },
        metadata: {
          timestamp: new Date('2024-01-15T14:00:00Z'),
          size: 100,
          checksum: 'test-checksum',
          collected_by: 'test-user',
          collection_method: 'test-method',
          source_system: 'test-system'
        },
        chain_of_custody: [],
        tags: ['test'],
        created_at: new Date('2024-01-15T14:00:00Z')
      }
    ];

    const options = {
      investigation_id: 'test-inv-001',
      analysis_type: 'timeline' as const,
      evidence,
      confidence_threshold: 0.8
    };

    const result = await analysisEngine.analyze(options);
    
    expect(result).toBeTruthy();
    expect(result.type).toBe('timeline');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.conclusions.length).toBeGreaterThan(0);
  });

  test('should list investigations', async () => {
    // Create test investigations
    const inv1: InvestigationCase = {
      id: 'test-inv-001',
      title: 'Test Investigation 1',
      description: 'First test investigation',
      status: 'active',
      severity: 'high',
      category: 'performance',
      priority: 'p1',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: 'test-user',
      affected_systems: ['system1'],
      evidence: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: {}
    };

    const inv2: InvestigationCase = {
      id: 'test-inv-002',
      title: 'Test Investigation 2',
      description: 'Second test investigation',
      status: 'completed',
      severity: 'medium',
      category: 'security',
      priority: 'p2',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: 'test-user',
      affected_systems: ['system2'],
      evidence: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: {}
    };

    await database.createInvestigation(inv1);
    await database.createInvestigation(inv2);

    const activeCases = await database.listInvestigations({ status: 'active' });
    const allCases = await database.listInvestigations();

    expect(activeCases.length).toBe(1);
    expect(allCases.length).toBe(2);
    expect(activeCases[0].title).toBe('Test Investigation 1');
  });
});
