/**
 * Comprehensive logging system for investigations
 * Provides structured logging with different levels and contexts
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import { EnvironmentConfigManager } from '../config/environment.js';

export interface LogContext {
  investigationId?: string;
  userId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
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
    const config = (() => {
      try {
        return EnvironmentConfigManager.getInstance();
      } catch {
        // If env config is unavailable during early import, fall back to env/defaults
        return undefined;
      }
    })();

    const configuredLogDir = process.env.INVESTIGATIONS_LOG_DIR 
      || (config?.getLogDir?.() as string | undefined)
      || (config ? path.join(config.getStoragePath(), 'logs') : './logs');

    const logDir = path.isAbsolute(configuredLogDir)
      ? configuredLogDir
      : path.resolve(process.cwd(), configuredLogDir);

    const logLevel = process.env.INVESTIGATIONS_LOG_LEVEL || (config?.getLogLevel?.() as string) || 'info';

    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, investigationId, userId, operation, metadata, stack, ...rest }) => {
        const logEntry: Record<string, unknown> = {
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
          (logEntry as Record<string, unknown>).stack = stack;
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

    // File transports for production only; ensure directory lazily with fallback
    if (process.env.NODE_ENV === 'production') {
      try {
        fs.ensureDirSync(logDir);

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
      } catch (e) {
        // Fall back to console-only if file system is not writable/available
        // Intentionally avoid throwing here to prevent server init failures
        console.error(`Logger: failed to initialize file transports at ${logDir}: ${e instanceof Error ? e.message : String(e)}. Falling back to console-only.`);
      }
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
  investigationStart(investigationId: string, userId: string, metadata?: Record<string, unknown>): void {
    this.info('Investigation started', {
      investigationId,
      userId,
      operation: 'investigation_start',
      metadata
    });
  }

  investigationComplete(investigationId: string, userId: string, metadata?: Record<string, unknown>): void {
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

  analysisPerformed(investigationId: string, analysisType: string, userId: string, metadata?: Record<string, unknown>): void {
    this.info(`Analysis performed: ${analysisType}`, {
      investigationId,
      userId,
      operation: 'analysis_performed',
      metadata: { analysisType, ...metadata }
    });
  }

  reportGenerated(investigationId: string, reportType: string, userId: string, metadata?: Record<string, unknown>): void {
    this.info(`Report generated: ${reportType}`, {
      investigationId,
      userId,
      operation: 'report_generated',
      metadata: { reportType, ...metadata }
    });
  }

  // Security and audit logging
  securityEvent(event: string, userId?: string, investigationId?: string, metadata?: Record<string, unknown>): void {
    this.warn(`Security event: ${event}`, {
      investigationId,
      userId,
      operation: 'security_event',
      metadata: { event, ...metadata }
    });
  }

  auditLog(action: string, userId: string, investigationId?: string, metadata?: Record<string, unknown>): void {
    this.info(`Audit: ${action}`, {
      investigationId,
      userId,
      operation: 'audit',
      metadata: { action, ...metadata }
    });
  }

  // Performance logging
  performanceMetric(metric: string, value: number, investigationId?: string, metadata?: Record<string, unknown>): void {
    this.info(`Performance: ${metric} = ${value}`, {
      investigationId,
      operation: 'performance_metric',
      metadata: { metric, value, ...metadata }
    });
  }

  // System health logging
  systemHealth(status: 'healthy' | 'degraded' | 'unhealthy', details?: Record<string, unknown>): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    this.logger.log(level, `System health: ${status}`, {
      operation: 'system_health',
      metadata: { status, ...details }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
