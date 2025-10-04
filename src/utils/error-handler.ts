/**
 * Comprehensive error handling system for investigations
 * Provides structured error handling, retry logic, and error categorization
 */

export interface ErrorContext {
  operation: string;
  investigationId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class InvestigationError extends Error {
  public readonly code: string;
  public readonly investigationId?: string;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    investigationId?: string,
    context?: ErrorContext,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'InvestigationError';
    this.code = code;
    this.investigationId = investigationId;
    this.context = context;
    this.retryable = retryable;
    this.timestamp = new Date();

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, InvestigationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      investigationId: this.investigationId,
      context: this.context,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

export class ValidationError extends InvestigationError {
  constructor(message: string, investigationId?: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', investigationId, context, false);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends InvestigationError {
  constructor(message: string, investigationId?: string, context?: ErrorContext) {
    super(message, 'SECURITY_ERROR', investigationId, context, false);
    this.name = 'SecurityError';
  }
}

export class StorageError extends InvestigationError {
  constructor(message: string, investigationId?: string, context?: ErrorContext) {
    super(message, 'STORAGE_ERROR', investigationId, context, true);
    this.name = 'StorageError';
  }
}

export class NetworkError extends InvestigationError {
  constructor(message: string, investigationId?: string, context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', investigationId, context, true);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends InvestigationError {
  constructor(message: string, investigationId?: string, context?: ErrorContext) {
    super(message, 'TIMEOUT_ERROR', investigationId, context, true);
    this.name = 'TimeoutError';
  }
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 10000; // 10 seconds

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;
    
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
          const delay = Math.min(
            this.RETRY_DELAY * Math.pow(2, attempt - 1),
            this.MAX_RETRY_DELAY
          );
          
          console.warn(`Operation ${context.operation} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, {
            error: error instanceof Error ? error.message : String(error),
            context
          });
          
          await this.delay(delay);
          continue;
        }

        // Don't retry on validation or security errors
        break;
      }
    }

    if (!lastError) {
      throw new InvestigationError(
        'Unknown error occurred during retry operation',
        'UNKNOWN_RETRY_ERROR',
        context.investigationId,
        context
      );
    }

    throw this.enhanceError(lastError, context);
  }

  static handleError(error: unknown, context: ErrorContext): InvestigationError {
    if (error instanceof InvestigationError) {
      return error;
    }

    // Preserve specific error types
    if (error instanceof ValidationError || error instanceof SecurityError || error instanceof StorageError) {
      return error;
    }

    return this.enhanceError(error as Error, context);
  }

  static enhanceError(error: Error, context: ErrorContext): InvestigationError {
    const message = error.message || 'Unknown error occurred';
    const code = this.categorizeError(error);
    const retryable = this.isRetryableError(error);

    return new InvestigationError(
      message,
      code,
      context.investigationId,
      context,
      retryable
    );
  }

  private static categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'SECURITY_ERROR';
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT_ERROR';
    }
    
    if (message.includes('network') || message.includes('connection') || message.includes('econnreset')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('file') || message.includes('storage') || message.includes('disk')) {
      return 'STORAGE_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  private static isRetryableError(error: unknown): boolean {
    if (error instanceof InvestigationError) {
      return error.retryable;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Retry on network, timeout, and storage errors
      if (message.includes('timeout') || 
          message.includes('network') || 
          message.includes('connection') ||
          message.includes('econnreset') ||
          message.includes('storage') ||
          message.includes('disk')) {
        return true;
      }
      
      // Don't retry on validation or security errors
      if (message.includes('validation') || 
          message.includes('invalid') ||
          message.includes('permission') ||
          message.includes('unauthorized') ||
          message.includes('forbidden')) {
        return false;
      }
    }

    return false;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createContext(operation: string, investigationId?: string, userId?: string, metadata?: Record<string, any>): ErrorContext {
    return {
      operation,
      investigationId,
      userId,
      timestamp: new Date(),
      metadata
    };
  }
}
