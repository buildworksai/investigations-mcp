/**
 * File locking system for concurrent access protection
 * Provides atomic operations and prevents data corruption
 */

import properLockfile from 'proper-lockfile';
import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';
import { StorageError } from './error-handler.js';

export interface LockOptions {
  retries?: number;
  retryDelay?: number;
  stale?: number;
  update?: number;
}

export class FileLockManager {
  private static readonly DEFAULT_OPTIONS: LockOptions = {
    retries: 3,
    retryDelay: 1000,
    stale: 30000, // 30 seconds
    update: 10000 // 10 seconds
  };

  private static locks = new Map<string, any>();

  static async acquireLock(filePath: string, options: LockOptions = {}): Promise<any> {
    const lockOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const lockPath = `${filePath}.lock`;

    try {
      // Ensure the directory exists
      await fs.ensureDir(path.dirname(filePath));

      logger.debug(`Acquiring lock for file: ${filePath}`, {
        operation: 'acquire_lock',
        metadata: { filePath, options: lockOptions }
      });

      const lock = await properLockfile.lock(filePath, {
        retries: lockOptions.retries,
        stale: lockOptions.stale,
        update: lockOptions.update
      });

      this.locks.set(filePath, lock);

      logger.debug(`Lock acquired for file: ${filePath}`, {
        operation: 'lock_acquired',
        metadata: { filePath }
      });

      return lock;
    } catch (error) {
      logger.error(`Failed to acquire lock for file: ${filePath}`, error as Error, {
        operation: 'acquire_lock_failed',
        metadata: { filePath, options: lockOptions }
      });

      throw new StorageError(
        `Failed to acquire lock for file: ${filePath}`,
        undefined,
        { operation: 'acquire_lock', timestamp: new Date(), metadata: { filePath, error } }
      );
    }
  }

  static async releaseLock(filePath: string): Promise<void> {
    try {
      const lock = this.locks.get(filePath);
      if (lock) {
        await properLockfile.unlock(lock);
        this.locks.delete(filePath);

        logger.debug(`Lock released for file: ${filePath}`, {
          operation: 'lock_released',
          metadata: { filePath }
        });
      }
    } catch (error) {
      logger.error(`Failed to release lock for file: ${filePath}`, error as Error, {
        operation: 'release_lock_failed',
        metadata: { filePath }
      });

      // Don't throw here as the lock might have been released already
      // Just log the error and continue
    }
  }

  static async withLock<T>(
    filePath: string,
    operation: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lock = await this.acquireLock(filePath, options);
    
    try {
      return await operation();
    } finally {
      await this.releaseLock(filePath);
    }
  }

  static async checkLock(filePath: string): Promise<boolean> {
    try {
      return await properLockfile.check(filePath);
    } catch (error) {
      logger.debug(`Lock check failed for file: ${filePath}`, {
        operation: 'lock_check_failed',
        metadata: { filePath, error }
      });
      return false;
    }
  }

  static async isLocked(filePath: string): Promise<boolean> {
    try {
      const lockPath = `${filePath}.lock`;
      return await fs.pathExists(lockPath);
    } catch (error) {
      logger.debug(`Lock status check failed for file: ${filePath}`, {
        operation: 'lock_status_check_failed',
        metadata: { filePath, error }
      });
      return false;
    }
  }

  static async waitForLock(filePath: string, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!(await this.isLocked(filePath))) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new StorageError(
      `Timeout waiting for lock on file: ${filePath}`,
      undefined,
      { operation: 'wait_for_lock', timestamp: new Date(), metadata: { filePath, timeout } }
    );
  }

  static async cleanupStaleLocks(directory: string): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const lockFiles = files.filter(file => file.endsWith('.lock'));

      for (const lockFile of lockFiles) {
        const lockPath = path.join(directory, lockFile);
        const originalPath = lockPath.replace('.lock', '');

        try {
          // Check if the original file exists
          if (!(await fs.pathExists(originalPath))) {
            // Original file doesn't exist, remove stale lock
            await fs.remove(lockPath);
            logger.info(`Removed stale lock file: ${lockPath}`, {
              operation: 'cleanup_stale_lock',
              metadata: { lockPath, originalPath }
            });
          } else {
            // Check if lock is stale
            const stats = await fs.stat(lockPath);
            const age = Date.now() - stats.mtime.getTime();
            
            if (age > 300000) { // 5 minutes
              await fs.remove(lockPath);
              logger.info(`Removed stale lock file: ${lockPath}`, {
                operation: 'cleanup_stale_lock',
                metadata: { lockPath, age }
              });
            }
          }
        } catch (error) {
          logger.warn(`Failed to cleanup lock file: ${lockPath}`, {
            operation: 'cleanup_lock_failed',
            metadata: { lockPath, error }
          });
        }
      }
    } catch (error) {
      logger.error(`Failed to cleanup stale locks in directory: ${directory}`, error as Error, {
        operation: 'cleanup_stale_locks_failed',
        metadata: { directory }
      });
    }
  }

  static async releaseAllLocks(): Promise<void> {
    const lockPaths = Array.from(this.locks.keys());
    
    for (const lockPath of lockPaths) {
      await this.releaseLock(lockPath);
    }
    
    logger.info(`Released ${lockPaths.length} locks`, {
      operation: 'release_all_locks',
      metadata: { count: lockPaths.length }
    });
  }

  static getActiveLocks(): string[] {
    return Array.from(this.locks.keys());
  }

  static getLockCount(): number {
    return this.locks.size;
  }
}
