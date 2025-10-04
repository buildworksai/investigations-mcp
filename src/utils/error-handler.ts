/**
 * Centralized error handling and graceful degradation
 */

import { InvestigationError, EvidenceError, AnalysisError } from '../types/index.js';
import { InputValidator } from './input-validator.js';

export interface ErrorContext {
  operation: string;
  investigationId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Only retry on certain types of errors
        if (this.isRetryableError(error)) {
          console.warn(`Operation ${context.operation} failed (attempt ${attempt}/${maxRetries}), retrying...`, {
            error: error instanceof Error ? error.message : String(error),
            context
          });
          
          await this.delay(this.RETRY_DELAY * attempt);
          continue;
        }

        // Don't retry on validation or security errors
        break;
      }
    }

    throw this.enhanceError(lastError!, context);
  }

  static handleError(error: unknown, context: ErrorContext): InvestigationError {
    if (error instanceof InvestigationError) {
      return error;
    }

    if (error instanceof EvidenceError) {
      return new InvestigationError(
        `Evidence error: ${error.message}`,
        'EVIDENCE_ERROR',
        context.investigationId,
        { originalError: error, context }
      );
    }

    if (error instanceof AnalysisError) {
      return new InvestigationError(
        `Analysis error: ${error.message}`,
        'ANALYSIS_ERROR',
        context.investigationId,
        { originalError: error, context }
      );
    }

    if (error instanceof Error) {
      return new InvestigationError(
        `Unexpected error: ${error.message}`,
        'UNEXPECTED_ERROR',
        context.investigationId,
        { originalError: error, context }
      );
    }

    return new InvestigationError(
      `Unknown error: ${String(error)}`,
      'UNKNOWN_ERROR',
      context.investigationId,
      { originalError: error, context }
    );
  }

  static validateAndSanitizeInput(input: any, fieldName: string, type: 'string' | 'id' | 'path' | 'array' | 'object'): any {
    try {
      switch (type) {
        case 'string':
          return InputValidator.validateString(input, fieldName);
        case 'id':
          return InputValidator.validateId(input, fieldName);
        case 'path':
          return InputValidator.validateFilePath(input, fieldName);
        case 'array':
          return InputValidator.validateArray(input, fieldName);
        case 'object':
          return InputValidator.validateObject(input, fieldName);
        default:
          return input;
      }
    } catch (error) {
      throw this.handleError(error, {
        operation: 'input_validation',
        timestamp: new Date(),
        metadata: { fieldName, type, input }
      });
    }
  }

  static async safeFileOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isFileSystemError(error)) {
        throw new InvestigationError(
          `File system error: ${error instanceof Error ? error.message : String(error)}`,
          'FILE_SYSTEM_ERROR',
          context.investigationId,
          { originalError: error, context }
        );
      }
      throw this.handleError(error, context);
    }
  }

  static async safeNetworkOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    timeout: number = 30000
  ): Promise<T> {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network operation timeout')), timeout)
        )
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new InvestigationError(
          `Network operation timed out after ${timeout}ms`,
          'NETWORK_TIMEOUT',
          context.investigationId,
          { timeout, context }
        );
      }
      throw this.handleError(error, context);
    }
  }

  static createGracefulDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    return primaryOperation().catch(async (error) => {
      console.warn(`Primary operation failed, falling back to alternative`, {
        operation: context.operation,
        error: error instanceof Error ? error.message : String(error),
        context
      });

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        throw new InvestigationError(
          `Both primary and fallback operations failed`,
          'OPERATION_FAILED',
          context.investigationId,
          { 
            primaryError: error, 
            fallbackError, 
            context 
          }
        );
      }
    });
  }

  private static isRetryableError(error: unknown): boolean {
    if (error instanceof InvestigationError) {
      // Don't retry validation or security errors
      return !['INVALID_INPUT_TYPE', 'DANGEROUS_INPUT', 'INVALID_ID_FORMAT', 'INVALID_PATH'].includes(error.code);
    }

    if (error instanceof Error) {
      // Retry on network and temporary file system errors
      return error.message.includes('ENOENT') || 
             error.message.includes('EACCES') || 
             error.message.includes('ECONNRESET') ||
             error.message.includes('ETIMEDOUT');
    }

    return false;
  }

  private static isFileSystemError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('ENOENT') ||
             error.message.includes('EACCES') ||
             error.message.includes('EMFILE') ||
             error.message.includes('ENFILE') ||
             error.message.includes('ENOSPC');
    }
    return false;
  }

  private static enhanceError(error: Error, context: ErrorContext): InvestigationError {
    return new InvestigationError(
      `Operation failed after retries: ${error.message}`,
      'OPERATION_FAILED_AFTER_RETRIES',
      context.investigationId,
      { 
        originalError: error, 
        context,
        retryCount: this.MAX_RETRIES
      }
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static logError(error: InvestigationError, context: ErrorContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      code: error.code,
      message: error.message,
      investigationId: error.investigation_id,
      context,
      stack: error.stack
    };

    // In production, this would go to a proper logging service
    console.error('Investigation Error:', JSON.stringify(logEntry, null, 2));
  }
}
