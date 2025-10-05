/**
 * Backup and recovery system for investigations
 * Provides automated backup, restore, and data recovery capabilities
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import { ErrorHandler, StorageError } from './error-handler.js';
import { EnvironmentConfigManager } from '../config/environment.js';

export interface BackupInfo {
  id: string;
  timestamp: Date;
  size: number;
  investigationCount: number;
  evidenceCount: number;
  analysisCount: number;
  reportCount: number;
  checksum: string;
  metadata: Record<string, any>;
}

export interface RestoreOptions {
  backupId?: string;
  targetPath?: string;
  overwrite?: boolean;
  validateIntegrity?: boolean;
}

export class BackupManager {
  private static instance: BackupManager;
  private config: EnvironmentConfigManager;
  private backupPath: string;
  private initialized: boolean = false;

  private constructor() {
    this.config = EnvironmentConfigManager.getInstance();
    this.backupPath = path.join(this.config.getStoragePath(), 'backups');
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const context = ErrorHandler.createContext('initialize_backup_manager');

    try {
      await fs.ensureDir(this.backupPath);
      this.initialized = true;

      logger.info('Backup manager initialized', {
        operation: 'backup_manager_initialized',
        metadata: { backupPath: this.backupPath }
      });
    } catch (error) {
      logger.error('Failed to initialize backup manager', error as Error, {
        operation: 'backup_manager_initialize_failed',
        metadata: { backupPath: this.backupPath }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async createBackup(sourcePath: string, metadata?: Record<string, any>): Promise<BackupInfo> {
    await this.initialize();

    const context = ErrorHandler.createContext('create_backup', undefined, undefined, {
      sourcePath,
      metadata
    });

    try {
      const backupId = uuidv4();
      const timestamp = new Date();
      const backupDir = path.join(this.backupPath, backupId);

      logger.info('Starting backup creation', {
        operation: 'backup_start',
        metadata: { backupId, sourcePath }
      });

      // Create backup directory
      await fs.ensureDir(backupDir);

      // Copy all files from source to backup
      await fs.copy(sourcePath, backupDir, {
        filter: (src, _dest) => {
          // Skip backup directories to avoid recursion
          return !src.includes('/backups/');
        }
      });

      // Calculate backup statistics
      const stats = await this.calculateBackupStats(backupDir);
      const checksum = await this.calculateChecksum(backupDir);

      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp,
        size: stats.totalSize,
        investigationCount: stats.investigationCount,
        evidenceCount: stats.evidenceCount,
        analysisCount: stats.analysisCount,
        reportCount: stats.reportCount,
        checksum,
        metadata: {
          sourcePath,
          ...metadata
        }
      };

      // Save backup metadata
      await fs.writeJSON(path.join(backupDir, 'backup-info.json'), backupInfo, { spaces: 2 });

      logger.info('Backup created successfully', {
        operation: 'backup_created',
        metadata: { 
          backupId, 
          size: backupInfo.size,
          investigationCount: backupInfo.investigationCount
        }
      });

      return backupInfo;
    } catch (error) {
      logger.error('Failed to create backup', error as Error, {
        operation: 'backup_creation_failed',
        metadata: { sourcePath }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async restoreBackup(backupId: string, options: RestoreOptions = {}): Promise<void> {
    await this.initialize();

    const context = ErrorHandler.createContext('restore_backup', undefined, undefined, {
      backupId,
      options
    });

    try {
      const backupDir = path.join(this.backupPath, backupId);
      const backupInfoPath = path.join(backupDir, 'backup-info.json');

      // Verify backup exists
      if (!(await fs.pathExists(backupInfoPath))) {
        throw new StorageError(`Backup not found: ${backupId}`);
      }

      // Load backup metadata
      const backupInfo: BackupInfo = await fs.readJSON(backupInfoPath);

      // Validate backup integrity if requested
      if (options.validateIntegrity !== false) {
        await this.validateBackupIntegrity(backupDir, backupInfo);
      }

      const targetPath = options.targetPath || backupInfo.metadata.sourcePath;

      logger.info('Starting backup restore', {
        operation: 'restore_start',
        metadata: { backupId, targetPath }
      });

      // Check if target exists and handle overwrite
      if (await fs.pathExists(targetPath)) {
        if (!options.overwrite) {
          throw new StorageError(`Target path exists and overwrite not allowed: ${targetPath}`);
        }

        // Create backup of existing data before overwriting
        const existingBackupId = await this.createBackup(targetPath, {
          reason: 'pre_restore_backup',
          originalBackupId: backupId
        });

        logger.info('Created pre-restore backup', {
          operation: 'pre_restore_backup_created',
          metadata: { existingBackupId, targetPath }
        });
      }

      // Restore files
      await fs.copy(backupDir, targetPath, {
        filter: (src, _dest) => {
          // Skip backup-info.json file
          return !src.endsWith('backup-info.json');
        }
      });

      logger.info('Backup restored successfully', {
        operation: 'backup_restored',
        metadata: { backupId, targetPath }
      });
    } catch (error) {
      logger.error('Failed to restore backup', error as Error, {
        operation: 'backup_restore_failed',
        metadata: { backupId }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    await this.initialize();

    const context = ErrorHandler.createContext('list_backups');

    try {
      const backupDirs = await fs.readdir(this.backupPath);
      const backups: BackupInfo[] = [];

      for (const dir of backupDirs) {
        const backupInfoPath = path.join(this.backupPath, dir, 'backup-info.json');
        
        if (await fs.pathExists(backupInfoPath)) {
          try {
            const backupInfo: BackupInfo = await fs.readJSON(backupInfoPath);
            backups.push(backupInfo);
          } catch (error) {
            logger.warn('Failed to read backup info', {
              operation: 'backup_info_read_failed',
              metadata: { backupId: dir, error }
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', error as Error, {
        operation: 'backup_list_failed'
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    await this.initialize();

    const context = ErrorHandler.createContext('delete_backup', undefined, undefined, {
      backupId
    });

    try {
      const backupDir = path.join(this.backupPath, backupId);

      if (!(await fs.pathExists(backupDir))) {
        throw new StorageError(`Backup not found: ${backupId}`);
      }

      await fs.remove(backupDir);

      logger.info('Backup deleted successfully', {
        operation: 'backup_deleted',
        metadata: { backupId }
      });
    } catch (error) {
      logger.error('Failed to delete backup', error as Error, {
        operation: 'backup_delete_failed',
        metadata: { backupId }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    await this.initialize();

    const context = ErrorHandler.createContext('cleanup_old_backups', undefined, undefined, {
      retentionDays
    });

    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }

      logger.info('Old backups cleaned up', {
        operation: 'backup_cleanup_completed',
        metadata: { deletedCount, retentionDays }
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old backups', error as Error, {
        operation: 'backup_cleanup_failed',
        metadata: { retentionDays }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  async validateBackupIntegrity(backupDir: string, backupInfo: BackupInfo): Promise<boolean> {
    const context = ErrorHandler.createContext('validate_backup_integrity', undefined, undefined, {
      backupId: backupInfo.id
    });

    try {
      // Calculate current checksum
      const currentChecksum = await this.calculateChecksum(backupDir);

      // Compare with stored checksum
      if (currentChecksum !== backupInfo.checksum) {
        throw new StorageError(`Backup integrity check failed: checksum mismatch`);
      }

      // Verify file counts
      const stats = await this.calculateBackupStats(backupDir);
      if (stats.investigationCount !== backupInfo.investigationCount ||
          stats.evidenceCount !== backupInfo.evidenceCount ||
          stats.analysisCount !== backupInfo.analysisCount ||
          stats.reportCount !== backupInfo.reportCount) {
        throw new StorageError(`Backup integrity check failed: file count mismatch`);
      }

      return true;
    } catch (error) {
      logger.error('Backup integrity validation failed', error as Error, {
        operation: 'backup_integrity_validation_failed',
        metadata: { backupId: backupInfo.id }
      });

      throw ErrorHandler.handleError(error, context);
    }
  }

  private async calculateBackupStats(backupDir: string): Promise<{
    totalSize: number;
    investigationCount: number;
    evidenceCount: number;
    analysisCount: number;
    reportCount: number;
  }> {
    let totalSize = 0;
    let investigationCount = 0;
    let evidenceCount = 0;
    let analysisCount = 0;
    let reportCount = 0;

    const walkDir = async (dir: string): Promise<void> => {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          await walkDir(itemPath);
        } else {
          totalSize += stats.size;

          // Count files by type
          if (dir.includes('/investigations/') && item.endsWith('.json') && item !== 'index.json') {
            investigationCount++;
          } else if (dir.includes('/evidence/') && item.endsWith('.json') && item !== 'index.json') {
            evidenceCount++;
          } else if (dir.includes('/analysis/') && item.endsWith('.json') && item !== 'index.json') {
            analysisCount++;
          } else if (dir.includes('/reports/') && item.endsWith('.json') && item !== 'index.json') {
            reportCount++;
          }
        }
      }
    };

    await walkDir(backupDir);

    return {
      totalSize,
      investigationCount,
      evidenceCount,
      analysisCount,
      reportCount
    };
  }

  private async calculateChecksum(backupDir: string): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');

    const walkDir = async (dir: string): Promise<void> => {
      const items = await fs.readdir(dir);
      items.sort(); // Ensure consistent ordering

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          await walkDir(itemPath);
        } else {
          const content = await fs.readFile(itemPath);
          hash.update(content);
        }
      }
    };

    await walkDir(backupDir);
    return hash.digest('hex');
  }

  getBackupPath(): string {
    return this.backupPath;
  }
}
