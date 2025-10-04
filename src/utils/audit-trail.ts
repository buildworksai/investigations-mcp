/**
 * Audit trail system for investigations
 * Provides comprehensive logging of all system activities and user actions
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import { ErrorHandler, StorageError } from './error-handler.js';
import { EnvironmentConfigManager } from '../config/environment.js';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  investigationId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  investigationId?: string;
  action?: string;
  resource?: string;
  result?: 'success' | 'failure' | 'warning';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditTrail {
  private static instance: AuditTrail;
  private config: EnvironmentConfigManager;
  private auditPath: string;
  private initialized: boolean = false;
  private auditBuffer: AuditEntry[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = EnvironmentConfigManager.getInstance();
    this.auditPath = path.join(this.config.getStoragePath(), 'audit');
  }

  static getInstance(): AuditTrail {
    if (!AuditTrail.instance) {
      AuditTrail.instance = new AuditTrail();
    }
    return AuditTrail.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const context = ErrorHandler.createContext('initialize_audit_trail');

    try {
      await fs.ensureDir(this.auditPath);

      // Start periodic flush timer
      this.startFlushTimer();

      this.initialized = true;

      logger.info('Audit trail initialized', {
        operation: 'audit_trail_initialized',
        metadata: { auditPath: this.auditPath }
      });
    } catch (error) {
      logger.error('Failed to initialize audit trail', error as Error, {
        operation: 'audit_trail_initialize_failed',
        metadata: { auditPath: this.auditPath }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async log(
    action: string,
    resource: string,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      sessionId?: string;
      resourceId?: string;
      investigationId?: string;
      ipAddress?: string;
      userAgent?: string;
      result?: 'success' | 'failure' | 'warning';
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    await this.initialize();

    const context = ErrorHandler.createContext('log_audit_entry', options.investigationId, options.userId, {
      action,
      resource,
      options
    });

    try {
      const auditEntry: AuditEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        userId: options.userId,
        sessionId: options.sessionId,
        action,
        resource,
        resourceId: options.resourceId,
        investigationId: options.investigationId,
        details,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        result: options.result || 'success',
        errorMessage: options.errorMessage,
        metadata: {
          ...options.metadata,
          systemVersion: '2.2.1',
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      // Add to buffer
      this.auditBuffer.push(auditEntry);

      // Flush if buffer is full
      if (this.auditBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }

      // Log to system logger as well
      logger.auditLog(action, options.userId || 'system', options.investigationId, {
        resource,
        resourceId: options.resourceId,
        result: auditEntry.result,
        details
      });
    } catch (error) {
      logger.error('Failed to log audit entry', error as Error, {
        operation: 'audit_log_failed',
        metadata: { action, resource }
      });

      // Don't throw here as audit logging should not break the main flow
    }
  }

  async query(query: AuditQuery): Promise<AuditEntry[]> {
    await this.initialize();

    const context = ErrorHandler.createContext('query_audit_trail', undefined, query.userId, {
      query
    });

    try {
      // Flush buffer first to ensure all entries are available
      await this.flushBuffer();

      const auditFiles = await this.getAuditFiles();
      const entries: AuditEntry[] = [];

      for (const file of auditFiles) {
        const fileEntries = await this.readAuditFile(file);
        
        for (const entry of fileEntries) {
          if (this.matchesQuery(entry, query)) {
            entries.push(entry);
          }
        }
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 1000;

      return entries.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Failed to query audit trail', error as Error, {
        operation: 'audit_query_failed',
        metadata: { query }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async getAuditSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEntries: number;
    successCount: number;
    failureCount: number;
    warningCount: number;
    uniqueUsers: number;
    uniqueInvestigations: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    await this.initialize();

    const context = ErrorHandler.createContext('get_audit_summary', undefined, undefined, {
      startDate,
      endDate
    });

    try {
      await this.flushBuffer();

      const query: AuditQuery = {
        startDate,
        endDate,
        limit: 10000 // Large limit for summary
      };

      const entries = await this.query(query);

      const summary = {
        totalEntries: entries.length,
        successCount: entries.filter(e => e.result === 'success').length,
        failureCount: entries.filter(e => e.result === 'failure').length,
        warningCount: entries.filter(e => e.result === 'warning').length,
        uniqueUsers: new Set(entries.map(e => e.userId).filter(Boolean)).size,
        uniqueInvestigations: new Set(entries.map(e => e.investigationId).filter(Boolean)).size,
        topActions: [] as Array<{ action: string; count: number }>,
        topUsers: [] as Array<{ userId: string; count: number }>
      };

      // Calculate top actions
      const actionCounts = new Map<string, number>();
      const userCounts = new Map<string, number>();

      for (const entry of entries) {
        // Count actions
        const actionCount = actionCounts.get(entry.action) || 0;
        actionCounts.set(entry.action, actionCount + 1);

        // Count users
        if (entry.userId) {
          const userCount = userCounts.get(entry.userId) || 0;
          userCounts.set(entry.userId, userCount + 1);
        }
      }

      summary.topActions = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      summary.topUsers = Array.from(userCounts.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return summary;
    } catch (error) {
      logger.error('Failed to get audit summary', error as Error, {
        operation: 'audit_summary_failed',
        metadata: { startDate, endDate }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async cleanupOldEntries(retentionDays: number = 90): Promise<number> {
    await this.initialize();

    const context = ErrorHandler.createContext('cleanup_old_audit_entries', undefined, undefined, {
      retentionDays
    });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const auditFiles = await this.getAuditFiles();
      let deletedCount = 0;

      for (const file of auditFiles) {
        const fileDate = this.getDateFromFilename(file);
        
        if (fileDate && fileDate < cutoffDate) {
          await fs.remove(file);
          deletedCount++;
        }
      }

      logger.info('Old audit entries cleaned up', {
        operation: 'audit_cleanup_completed',
        metadata: { deletedCount, retentionDays }
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old audit entries', error as Error, {
        operation: 'audit_cleanup_failed',
        metadata: { retentionDays }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;

    const context = ErrorHandler.createContext('flush_audit_buffer');

    try {
      const today = new Date().toISOString().split('T')[0];
      const auditFile = path.join(this.auditPath, `audit-${today}.jsonl`);

      // Append entries to file
      const lines = this.auditBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(auditFile, lines);

      logger.debug('Audit buffer flushed', {
        operation: 'audit_buffer_flushed',
        metadata: { 
          entryCount: this.auditBuffer.length,
          file: auditFile
        }
      });

      // Clear buffer
      this.auditBuffer = [];
    } catch (error) {
      logger.error('Failed to flush audit buffer', error as Error, {
        operation: 'audit_buffer_flush_failed',
        metadata: { bufferSize: this.auditBuffer.length }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      try {
        await this.flushBuffer();
      } catch (error) {
        logger.error('Failed to flush audit buffer on timer', error as Error, {
          operation: 'audit_buffer_timer_flush_failed'
        });
      }
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private async getAuditFiles(): Promise<string[]> {
    const files = await fs.readdir(this.auditPath);
    return files
      .filter(file => file.startsWith('audit-') && file.endsWith('.jsonl'))
      .map(file => path.join(this.auditPath, file))
      .sort();
  }

  private async readAuditFile(filePath: string): Promise<AuditEntry[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        const entry = JSON.parse(line);
        entry.timestamp = new Date(entry.timestamp);
        return entry;
      });
    } catch (error) {
      logger.warn('Failed to read audit file', {
        operation: 'audit_file_read_failed',
        metadata: { file: filePath, error }
      });
      return [];
    }
  }

  private matchesQuery(entry: AuditEntry, query: AuditQuery): boolean {
    if (query.userId && entry.userId !== query.userId) return false;
    if (query.investigationId && entry.investigationId !== query.investigationId) return false;
    if (query.action && entry.action !== query.action) return false;
    if (query.resource && entry.resource !== query.resource) return false;
    if (query.result && entry.result !== query.result) return false;
    if (query.startDate && entry.timestamp < query.startDate) return false;
    if (query.endDate && entry.timestamp > query.endDate) return false;

    return true;
  }

  private getDateFromFilename(filePath: string): Date | null {
    const filename = path.basename(filePath);
    const match = filename.match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
    
    if (match) {
      return new Date(match[1]);
    }
    
    return null;
  }

  async shutdown(): Promise<void> {
    this.stopFlushTimer();
    await this.flushBuffer();
    
    logger.info('Audit trail shutdown', {
      operation: 'audit_trail_shutdown'
    });
  }

  getAuditPath(): string {
    return this.auditPath;
  }
}
