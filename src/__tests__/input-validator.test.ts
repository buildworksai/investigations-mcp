/**
 * Tests for input validation system
 */

import { InputValidator } from '../utils/input-validator.js';
import { InvestigationError } from '../utils/error-handler.js';

describe('InputValidator', () => {
  describe('Investigation Validation', () => {
    test('should validate valid investigation', () => {
      const validInvestigation = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Investigation',
        description: 'A test investigation',
        status: 'active',
        priority: 'high',
        assigned_to: 'user@example.com',
        tags: ['test', 'investigation'],
        metadata: { key: 'value' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = InputValidator.validateInvestigation(validInvestigation);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.sanitizedData).toBeDefined();
    });

    test('should reject invalid investigation', () => {
      const invalidInvestigation = {
        id: 'invalid-uuid',
        title: '',
        status: 'invalid-status',
        created_at: 'invalid-date',
        updated_at: 'invalid-date'
      };

      const result = InputValidator.validateInvestigation(invalidInvestigation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    test('should sanitize investigation data', () => {
      const investigation = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '  Test Investigation  ',
        description: 'A test investigation with <script>alert("xss")</script>',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = InputValidator.validateInvestigation(investigation);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.title).toBe('Test Investigation');
      expect(result.sanitizedData?.description).not.toContain('<script>');
    });
  });

  describe('Evidence Validation', () => {
    test('should validate valid evidence', () => {
      const validEvidence = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        investigation_id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'log',
        source: '/var/log/app.log',
        content: { message: 'Test log entry' },
        metadata: {
          timestamp: new Date().toISOString(),
          size: 1024,
          checksum: 'abcd1234567890abcd1234567890abcd',
          collected_by: 'user@example.com',
          collection_method: 'manual',
          source_system: 'test-system'
        },
        created_at: new Date().toISOString()
      };

      const result = InputValidator.validateEvidence(validEvidence);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject invalid evidence', () => {
      const invalidEvidence = {
        id: 'invalid-uuid',
        investigation_id: 'invalid-uuid',
        type: 'invalid-type',
        source: '',
        content: null,
        metadata: {},
        created_at: 'invalid-date'
      };

      const result = InputValidator.validateEvidence(invalidEvidence);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('String Validation', () => {
    test('should validate valid string', () => {
      const result = InputValidator.validateString('Valid string', 'testField');
      expect(result).toBe('Valid string');
    });

    test('should reject string that is too long', () => {
      const longString = 'a'.repeat(20000);
      
      expect(() => {
        InputValidator.validateString(longString, 'testField');
      }).toThrow(InvestigationError);
    });

    test('should sanitize string', () => {
      const dirtyString = '  Test string with <script>alert("xss")</script>  ';
      const result = InputValidator.validateString(dirtyString, 'testField');
      
      expect(result).toBe('Test string with alert("xss")');
    });
  });

  describe('Path Validation', () => {
    test('should validate valid path', () => {
      const result = InputValidator.validatePath('valid/path', 'testPath');
      expect(result).toBe('valid/path');
    });

    test('should reject path traversal attempts', () => {
      expect(() => {
        InputValidator.validatePath('../etc/passwd', 'testPath');
      }).toThrow(InvestigationError);

      expect(() => {
        InputValidator.validatePath('~/secret', 'testPath');
      }).toThrow(InvestigationError);

      expect(() => {
        InputValidator.validatePath('/etc/passwd', 'testPath');
      }).toThrow(InvestigationError);
    });
  });

  describe('Email Validation', () => {
    test('should validate valid email', () => {
      const result = InputValidator.validateEmail('user@example.com');
      expect(result).toBe('user@example.com');
    });

    test('should reject invalid email', () => {
      expect(() => {
        InputValidator.validateEmail('invalid-email');
      }).toThrow(InvestigationError);
    });

    test('should normalize email', () => {
      const result = InputValidator.validateEmail('  USER@EXAMPLE.COM  ');
      expect(result).toBe('user@example.com');
    });
  });

  describe('UUID Validation', () => {
    test('should validate valid UUID', () => {
      const result = InputValidator.validateUUID('123e4567-e89b-12d3-a456-426614174000', 'testId');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    test('should reject invalid UUID', () => {
      expect(() => {
        InputValidator.validateUUID('invalid-uuid', 'testId');
      }).toThrow(InvestigationError);
    });

    test('should normalize UUID', () => {
      const result = InputValidator.validateUUID('123E4567-E89B-12D3-A456-426614174000', 'testId');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('File Validation', () => {
    test('should validate allowed file type', () => {
      const result = InputValidator.validateFileType('text/plain');
      expect(result).toBe('text/plain');
    });

    test('should reject disallowed file type', () => {
      expect(() => {
        InputValidator.validateFileType('application/x-executable');
      }).toThrow(InvestigationError);
    });

    test('should validate file size', () => {
      const result = InputValidator.validateFileSize(1024);
      expect(result).toBe(1024);
    });

    test('should reject file that is too large', () => {
      expect(() => {
        InputValidator.validateFileSize(200 * 1024 * 1024); // 200MB
      }).toThrow(InvestigationError);
    });
  });

  describe('Security Validation', () => {
    test('should detect SQL injection attempts', () => {
      expect(() => {
        InputValidator.validateSecurity("'; DROP TABLE users; --", 'testContext');
      }).toThrow(InvestigationError);

      expect(() => {
        InputValidator.validateSecurity("SELECT * FROM users WHERE id = 1 OR 1=1", 'testContext');
      }).toThrow(InvestigationError);
    });

    test('should detect XSS attempts', () => {
      expect(() => {
        InputValidator.validateSecurity('<script>alert("xss")</script>', 'testContext');
      }).toThrow(InvestigationError);

      expect(() => {
        InputValidator.validateSecurity('javascript:alert("xss")', 'testContext');
      }).toThrow(InvestigationError);
    });

    test('should detect command injection attempts', () => {
      expect(() => {
        InputValidator.validateSecurity('test; rm -rf /', 'testContext');
      }).toThrow(InvestigationError);

      expect(() => {
        InputValidator.validateSecurity('test && cat /etc/passwd', 'testContext');
      }).toThrow(InvestigationError);
    });

    test('should allow safe input', () => {
      expect(() => {
        InputValidator.validateSecurity('Safe input string', 'testContext');
      }).not.toThrow();
    });
  });
});
