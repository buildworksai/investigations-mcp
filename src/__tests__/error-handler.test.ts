/**
 * Tests for error handling system
 */

import { ErrorHandler, InvestigationError, ValidationError, SecurityError, StorageError } from '../utils/error-handler.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ErrorHandler', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'error-handler-test-'));
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  describe('Error Classes', () => {
    test('should create InvestigationError with proper properties', () => {
      const context = ErrorHandler.createContext('test_operation', 'test-investigation', 'test-user');
      const error = new InvestigationError('Test error', 'TEST_ERROR', 'test-investigation', context);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.investigationId).toBe('test-investigation');
      expect(error.context).toBe(context);
      expect(error.retryable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('should create ValidationError', () => {
      const context = ErrorHandler.createContext('validation_test');
      const error = new ValidationError('Validation failed', 'test-investigation', context);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    test('should create SecurityError', () => {
      const context = ErrorHandler.createContext('security_test');
      const error = new SecurityError('Security violation', 'test-investigation', context);

      expect(error.message).toBe('Security violation');
      expect(error.code).toBe('SECURITY_ERROR');
      expect(error.retryable).toBe(false);
    });

    test('should create StorageError', () => {
      const context = ErrorHandler.createContext('storage_test');
      const error = new StorageError('Storage failed', 'test-investigation', context);

      expect(error.message).toBe('Storage failed');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.retryable).toBe(true);
    });

    test('should serialize to JSON correctly', () => {
      const context = ErrorHandler.createContext('test_operation', 'test-investigation', 'test-user');
      const error = new InvestigationError('Test error', 'TEST_ERROR', 'test-investigation', context);
      const json = error.toJSON();

      expect(json.name).toBe('InvestigationError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.investigationId).toBe('test-investigation');
      expect(json.retryable).toBe(false);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('Error Context', () => {
    test('should create context with all properties', () => {
      const context = ErrorHandler.createContext('test_operation', 'test-investigation', 'test-user', { key: 'value' });

      expect(context.operation).toBe('test_operation');
      expect(context.investigationId).toBe('test-investigation');
      expect(context.userId).toBe('test-user');
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.metadata).toEqual({ key: 'value' });
    });

    test('should create context with minimal properties', () => {
      const context = ErrorHandler.createContext('test_operation');

      expect(context.operation).toBe('test_operation');
      expect(context.investigationId).toBeUndefined();
      expect(context.userId).toBeUndefined();
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.metadata).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle InvestigationError without modification', () => {
      const originalError = new InvestigationError('Original error', 'ORIGINAL_ERROR');
      const context = ErrorHandler.createContext('test_operation');
      const handledError = ErrorHandler.handleError(originalError, context);

      expect(handledError).toBe(originalError);
    });

    test('should enhance regular Error to InvestigationError', () => {
      const originalError = new Error('Regular error');
      const context = ErrorHandler.createContext('test_operation', 'test-investigation');
      const handledError = ErrorHandler.handleError(originalError, context);

      expect(handledError).toBeInstanceOf(InvestigationError);
      expect(handledError.message).toBe('Regular error');
      expect(handledError.investigationId).toBe('test-investigation');
    });

    test('should categorize errors correctly', () => {
      const context = ErrorHandler.createContext('test_operation');

      const validationError = new Error('Invalid input validation failed');
      const handledValidation = ErrorHandler.handleError(validationError, context);
      expect(handledValidation.code).toBe('VALIDATION_ERROR');

      const securityError = new Error('Unauthorized access denied');
      const handledSecurity = ErrorHandler.handleError(securityError, context);
      expect(handledSecurity.code).toBe('SECURITY_ERROR');

      const timeoutError = new Error('Operation timed out');
      const handledTimeout = ErrorHandler.handleError(timeoutError, context);
      expect(handledTimeout.code).toBe('TIMEOUT_ERROR');

      const networkError = new Error('Network connection failed');
      const handledNetwork = ErrorHandler.handleError(networkError, context);
      expect(handledNetwork.code).toBe('NETWORK_ERROR');

      const storageError = new Error('File system error');
      const handledStorage = ErrorHandler.handleError(storageError, context);
      expect(handledStorage.code).toBe('STORAGE_ERROR');
    });
  });

  describe('Retry Logic', () => {
    test('should retry on retryable errors', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new StorageError('Temporary storage error');
        }
        return 'success';
      };

      const context = ErrorHandler.createContext('test_operation');
      const result = await ErrorHandler.withRetry(operation, context, 3);

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    test('should not retry on non-retryable errors', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        throw new ValidationError('Validation error');
      };

      const context = ErrorHandler.createContext('test_operation');
      
      await expect(ErrorHandler.withRetry(operation, context, 3))
        .rejects.toThrow(InvestigationError);
      
      expect(attemptCount).toBe(1);
    });

    test('should fail after max retries', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        throw new StorageError('Persistent storage error');
      };

      const context = ErrorHandler.createContext('test_operation');
      
      await expect(ErrorHandler.withRetry(operation, context, 2))
        .rejects.toThrow(InvestigationError);
      
      expect(attemptCount).toBe(2);
    });

    test('should succeed on first attempt', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        return 'success';
      };

      const context = ErrorHandler.createContext('test_operation');
      const result = await ErrorHandler.withRetry(operation, context, 3);

      expect(result).toBe('success');
      expect(attemptCount).toBe(1);
    });
  });
});
