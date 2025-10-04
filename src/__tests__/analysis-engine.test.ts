import { AnalysisEngine } from '../analyzers/analysis-engine.js';
import type { AnalysisOptions, CausalityOptions, HypothesisValidationOptions } from '../analyzers/analysis-engine.js';
import type { EvidenceItem } from '../types/index.js';

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;
  const testEvidence: EvidenceItem[] = [
      {
        id: 'evidence-1',
        investigation_id: 'test-investigation',
        type: 'log',
        source: 'application.log',
        content: { message: 'Error occurred at 10:00 AM' },
        metadata: {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          size: 1024,
          checksum: 'test-checksum-1',
          collected_by: 'test-user',
          collection_method: 'manual',
          source_system: 'test-system'
        },
        chain_of_custody: [],
        tags: ['error'],
        created_at: new Date()
      },
      {
        id: 'evidence-2',
        investigation_id: 'test-investigation',
        type: 'metric',
        source: 'system.metrics',
        content: { cpu_usage: 95, memory_usage: 80 },
        metadata: {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          size: 2048,
          checksum: 'test-checksum-2',
          collected_by: 'test-user',
          collection_method: 'manual',
          source_system: 'test-system'
        },
        chain_of_custody: [],
        tags: ['performance'],
        created_at: new Date()
      }
    ];

  beforeEach(() => {
    analysisEngine = new AnalysisEngine();
  });

  describe('Analysis Methods', () => {
    test('should perform timeline analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'timeline',
        evidence: testEvidence,
        hypothesis: 'System performance degraded due to high CPU usage'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('timeline');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should perform causal analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'causal',
        evidence: testEvidence,
        hypothesis: 'High CPU usage caused system errors'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('causal');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should perform performance analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'performance',
        evidence: testEvidence,
        hypothesis: 'System performance issues due to resource constraints'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('performance');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should perform security analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'security',
        evidence: testEvidence,
        hypothesis: 'Security incident detected'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('security');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should perform correlation analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'correlation',
        evidence: testEvidence,
        hypothesis: 'Events are correlated'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('correlation');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should perform statistical analysis', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'statistical',
        evidence: testEvidence,
        hypothesis: 'Statistical anomaly detected'
      };

      const result = await analysisEngine.analyze(options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('statistical');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should throw error for unknown analysis type', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'unknown' as any,
        evidence: testEvidence,
        hypothesis: 'Test hypothesis'
      };

      await expect(analysisEngine.analyze(options))
        .rejects.toThrow('Unknown analysis type: unknown');
    });
  });

  describe('Causality Tracing', () => {
    test('should trace causality between events', async () => {
      const options: CausalityOptions = {
        investigation_id: 'test-investigation',
        start_event: 'error-occurred',
        confidence_threshold: 0.7
      };

      const result = await analysisEngine.traceCausality(options);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Hypothesis Validation', () => {
    test('should validate hypothesis with logical method', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'High CPU usage caused system errors',
        evidence: testEvidence,
        confidence_threshold: 0.8,
        validation_method: 'logical'
      };

      const result = await analysisEngine.validateHypothesis(options);
      
      expect(result).toBeDefined();
      expect(result.hypothesis).toBe('High CPU usage caused system errors');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['validated', 'rejected', 'insufficient_evidence']).toContain(result.conclusion);
    });

    test('should validate hypothesis with temporal method', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'Events occurred in sequence',
        evidence: testEvidence,
        confidence_threshold: 0.8,
        validation_method: 'temporal'
      };

      const result = await analysisEngine.validateHypothesis(options);
      
      expect(result).toBeDefined();
      expect(result.hypothesis).toBe('Events occurred in sequence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should validate hypothesis with correlational method', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'Events are correlated',
        evidence: testEvidence,
        confidence_threshold: 0.8,
        validation_method: 'correlational'
      };

      const result = await analysisEngine.validateHypothesis(options);
      
      expect(result).toBeDefined();
      expect(result.hypothesis).toBe('Events are correlated');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should validate hypothesis with statistical method', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'Statistical anomaly detected',
        evidence: testEvidence,
        confidence_threshold: 0.8,
        validation_method: 'statistical'
      };

      const result = await analysisEngine.validateHypothesis(options);
      
      expect(result).toBeDefined();
      expect(result.hypothesis).toBe('Statistical anomaly detected');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle insufficient evidence', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'Test hypothesis',
        evidence: [],
        confidence_threshold: 0.8,
        require_evidence: true
      };

      const result = await analysisEngine.validateHypothesis(options);
      
      expect(result).toBeDefined();
      expect(result.conclusion).toBe('insufficient_evidence');
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('No evidence available');
    });

    test('should throw error for unknown validation method', async () => {
      const options: HypothesisValidationOptions = {
        investigation_id: 'test-investigation',
        hypothesis: 'Test hypothesis',
        evidence: testEvidence,
        validation_method: 'unknown' as any
      };

      await expect(analysisEngine.validateHypothesis(options))
        .rejects.toThrow('Unknown validation method: unknown');
    });
  });

  describe('Error Handling', () => {
    test('should handle analysis errors gracefully', async () => {
      const options: AnalysisOptions = {
        investigation_id: 'test-investigation',
        analysis_type: 'timeline',
        evidence: [],
        hypothesis: 'Test hypothesis'
      };

      // Should not throw, but return a result with low confidence
      const result = await analysisEngine.analyze(options);
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});
