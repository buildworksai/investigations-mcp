import { EvidenceCollector } from '../collectors/evidence-collector.js';
import type { CollectionOptions } from '../collectors/evidence-collector.js';
import type { EvidenceSource } from '../types/index.js';

describe('EvidenceCollector', () => {
  let evidenceCollector: EvidenceCollector;

  beforeEach(() => {
    evidenceCollector = new EvidenceCollector();
  });

  describe('Evidence Collection', () => {
    test('should collect filesystem evidence', async () => {
      const source: EvidenceSource = {
        type: 'filesystem',
        path: process.cwd()
      };
      
      const options: CollectionOptions = {
        investigation_id: 'test-investigation',
        preserve_chain_of_custody: true,
        user_id: 'test-user'
      };

      const result = await evidenceCollector.collect(source, options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('filesystem');
      expect(result.source).toBe(process.cwd());
    });

    test('should collect system information', async () => {
      const source: EvidenceSource = {
        type: 'logs',
        path: '/var/log'
      };
      
      const options: CollectionOptions = {
        investigation_id: 'test-investigation',
        preserve_chain_of_custody: true,
        user_id: 'test-user'
      };

      const result = await evidenceCollector.collect(source, options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('logs');
    });

    test('should collect process information', async () => {
      const source: EvidenceSource = {
        type: 'config',
        path: '/etc'
      };
      
      const options: CollectionOptions = {
        investigation_id: 'test-investigation',
        preserve_chain_of_custody: true,
        user_id: 'test-user'
      };

      const result = await evidenceCollector.collect(source, options);
      
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
      expect(result.type).toBe('config');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid evidence types', async () => {
      const source: EvidenceSource = {
        type: 'unknown' as any,
        path: '/some/path'
      };
      
      const options: CollectionOptions = {
        investigation_id: 'test-investigation',
        preserve_chain_of_custody: true,
        user_id: 'test-user'
      };

      await expect(evidenceCollector.collect(source, options))
        .rejects.toThrow('Unknown evidence type: unknown');
    });

    test('should handle invalid paths gracefully', async () => {
      const source: EvidenceSource = {
        type: 'filesystem',
        path: '/non-existent-path'
      };
      
      const options: CollectionOptions = {
        investigation_id: 'test-investigation',
        preserve_chain_of_custody: true,
        user_id: 'test-user'
      };

      // Should not throw, but return empty or minimal evidence
      const result = await evidenceCollector.collect(source, options);
      expect(result).toBeDefined();
      expect(result.investigation_id).toBe('test-investigation');
    });
  });
});
