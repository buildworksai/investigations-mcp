/**
 * Comprehensive logging system for investigations
 * Provides structured logging with different levels and contexts
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

export interface LogContext {
  investigationId?: string;
  userId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = this.createLogger();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogger(): winston.Logger {
    const logDir = process.env.INVESTIGATIONS_LOG_DIR || './logs';
    const logLevel = process.env.INVESTIGATIONS_LOG_LEVEL || 'info';
    
    // Ensure log directory exists
    fs.ensureDirSync(logDir);

    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, investigationId, userId, operation, metadata, stack, ...rest }) => {
        const logEntry = {
          timestamp,
          level,
          message,
          investigationId,
          userId,
          operation,
          metadata,
          ...rest
        };

        if (stack) {
          (logEntry as any).stack = stack;
        }

        return JSON.stringify(logEntry);
      })
    );

    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, investigationId, operation }) => {
            const prefix = investigationId ? `[${investigationId}]` : '';
            const op = operation ? `(${operation})` : '';
            return `${timestamp} ${level} ${prefix}${op} ${message}`;
          })
        )
      })
    ];

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        // Error log file
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        // Investigation-specific log file
        new winston.transports.File({
          filename: path.join(logDir, 'investigations.log'),
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    this.logger.error(message, logContext);
  }

  // Investigation-specific logging methods
  investigationStart(investigationId: string, userId: string, metadata?: Record<string, any>): void {
    this.info('Investigation started', {
      investigationId,
      userId,
      operation: 'investigation_start',
      metadata
    });
  }

  investigationComplete(investigationId: string, userId: string, metadata?: Record<string, any>): void {
    this.info('Investigation completed', {
      investigationId,
      userId,
      operation: 'investigation_complete',
      metadata
    });
  }

  evidenceCollected(investigationId: string, evidenceType: string, count: number, userId: string): void {
    this.info(`Evidence collected: ${evidenceType} (${count} items)`, {
      investigationId,
      userId,
      operation: 'evidence_collected',
      metadata: { evidenceType, count }
    });
  }

  analysisPerformed(investigationId: string, analysisType: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`Analysis performed: ${analysisType}`, {
      investigationId,
      userId,
      operation: 'analysis_performed',
      metadata: { analysisType, ...metadata }
    });
  }

  reportGenerated(investigationId: string, reportType: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`Report generated: ${reportType}`, {
      investigationId,
      userId,
      operation: 'report_generated',
      metadata: { reportType, ...metadata }
    });
  }

  // Security and audit logging
  securityEvent(event: string, userId?: string, investigationId?: string, metadata?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      investigationId,
      userId,
      operation: 'security_event',
      metadata: { event, ...metadata }
    });
  }

  auditLog(action: string, userId: string, investigationId?: string, metadata?: Record<string, any>): void {
    this.info(`Audit: ${action}`, {
      investigationId,
      userId,
      operation: 'audit',
      metadata: { action, ...metadata }
    });
  }

  // Performance logging
  performanceMetric(metric: string, value: number, investigationId?: string, metadata?: Record<string, any>): void {
    this.info(`Performance: ${metric} = ${value}`, {
      investigationId,
      operation: 'performance_metric',
      metadata: { metric, value, ...metadata }
    });
  }

  // System health logging
  systemHealth(status: 'healthy' | 'degraded' | 'unhealthy', details?: Record<string, any>): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    this.logger.log(level, `System health: ${status}`, {
      operation: 'system_health',
      metadata: { status, ...details }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
