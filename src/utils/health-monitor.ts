/**
 * Health monitoring and system observability
 * Provides comprehensive health checks, metrics, and monitoring
 */

import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';
import { InvestigationDatabase } from '../services/database.js';
import { FileLockManager } from './file-lock.js';
import { EnvironmentConfigManager } from '../config/environment.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  metrics: SystemMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    path: string;
    exists: boolean;
    writable: boolean;
    investigations: number;
    maxInvestigations: number;
    usage: number;
  };
  locks: {
    active: number;
    stale: number;
  };
  performance: {
    activeOperations: number;
    maxConcurrent: number;
    averageResponseTime: number;
  };
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private startTime: Date;
  private config: EnvironmentConfigManager;
  private database: InvestigationDatabase;
  private metrics: SystemMetrics;
  private responseTimes: number[] = [];
  private activeOperations = 0;

  private constructor() {
    this.startTime = new Date();
    this.config = EnvironmentConfigManager.getInstance();
    this.database = new InvestigationDatabase();
    this.metrics = this.initializeMetrics();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private initializeMetrics(): SystemMetrics {
    return {
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      storage: {
        path: '',
        exists: false,
        writable: false,
        investigations: 0,
        maxInvestigations: 0,
        usage: 0
      },
      locks: {
        active: 0,
        stale: 0
      },
      performance: {
        activeOperations: 0,
        maxConcurrent: 0,
        averageResponseTime: 0
      }
    };
  }

  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    try {
      // Database connectivity check
      checks.push(await this.checkDatabase());
      
      // Storage system check
      checks.push(await this.checkStorage());
      
      // File locking check
      checks.push(await this.checkFileLocks());
      
      // Memory usage check
      checks.push(await this.checkMemory());
      
      // Configuration check
      checks.push(await this.checkConfiguration());
      
      // Performance check
      checks.push(await this.checkPerformance());

      // Update metrics
      await this.updateMetrics();

      // Determine overall status
      const failedChecks = checks.filter(check => check.status === 'fail');
      const warningChecks = checks.filter(check => check.status === 'warn');
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (failedChecks.length) {
        status = 'unhealthy';
      } else if (warningChecks.length) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: '2.2.5',
        uptime: Date.now() - this.startTime.getTime(),
        checks,
        metrics: this.metrics
      };

      logger.systemHealth(status, {
        checks: checks.length,
        failed: failedChecks.length,
        warnings: warningChecks.length,
        duration: Date.now() - startTime
      });

      return healthStatus;
    } catch (error) {
      logger.error('Health check failed', error as Error, {
        operation: 'health_check_failed'
      });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '2.2.5',
        uptime: Date.now() - this.startTime.getTime(),
        checks: [{
          name: 'health_check_system',
          status: 'fail',
          message: `Health check system failed: ${error}`,
          duration: Date.now() - startTime
        }],
        metrics: this.metrics
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.database.initialize();
      const investigations = await this.database.listInvestigations();
      
      return {
        name: 'database',
        status: 'pass',
        message: `Database is healthy with ${investigations.length} investigations`,
        duration: Date.now() - startTime,
        metadata: { investigationCount: investigations.length }
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        message: `Database check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const storagePath = this.config.getStoragePath();
      const exists = await fs.pathExists(storagePath);
      const writable = await this.checkWritable(storagePath);
      
      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let message = 'Storage is healthy';
      
      if (!exists) {
        status = 'warn';
        message = 'Storage directory does not exist';
      } else if (!writable) {
        status = 'fail';
        message = 'Storage directory is not writable';
      }
      
      return {
        name: 'storage',
        status,
        message,
        duration: Date.now() - startTime,
        metadata: { path: storagePath, exists, writable }
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'fail',
        message: `Storage check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkFileLocks(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const activeLocks = FileLockManager.getActiveLocks();
      const lockCount = FileLockManager.getLockCount();
      
      return {
        name: 'file_locks',
        status: 'pass',
        message: `File locking system is healthy with ${lockCount} active locks`,
        duration: Date.now() - startTime,
        metadata: { activeLocks: lockCount, lockPaths: activeLocks }
      };
    } catch (error) {
      return {
        name: 'file_locks',
        status: 'fail',
        message: `File lock check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const percentage = (usedMem / totalMem) * 100;
      
      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let message = `Memory usage is healthy (${percentage.toFixed(1)}%)`;
      
      if (percentage > 90) {
        status = 'fail';
        message = `Memory usage is critical (${percentage.toFixed(1)}%)`;
      } else if (percentage > 80) {
        status = 'warn';
        message = `Memory usage is high (${percentage.toFixed(1)}%)`;
      }
      
      return {
        name: 'memory',
        status,
        message,
        duration: Date.now() - startTime,
        metadata: { 
          used: usedMem, 
          total: totalMem, 
          percentage: Math.round(percentage * 100) / 100 
        }
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        message: `Memory check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkConfiguration(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // const config = this.config.getConfig();
      const summary = this.config.getConfigSummary();
      
      return {
        name: 'configuration',
        status: 'pass',
        message: 'Configuration is valid',
        duration: Date.now() - startTime,
        metadata: summary
      };
    } catch (error) {
      return {
        name: 'configuration',
        status: 'fail',
        message: `Configuration check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const maxConcurrent = this.config.getMaxConcurrent();
      const averageResponseTime = this.calculateAverageResponseTime();
      
      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let message = 'Performance is healthy';
      
      if (this.activeOperations >= maxConcurrent) {
        status = 'warn';
        message = `High concurrent operations (${this.activeOperations}/${maxConcurrent})`;
      }
      
      if (averageResponseTime > 5000) { // 5 seconds
        status = 'warn';
        message = `High average response time (${averageResponseTime}ms)`;
      }
      
      return {
        name: 'performance',
        status,
        message,
        duration: Date.now() - startTime,
        metadata: {
          activeOperations: this.activeOperations,
          maxConcurrent,
          averageResponseTime
        }
      };
    } catch (error) {
      return {
        name: 'performance',
        status: 'fail',
        message: `Performance check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkWritable(directory: string): Promise<boolean> {
    try {
      const testFile = path.join(directory, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.memory = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      };

      // Storage metrics
      const storagePath = this.config.getStoragePath();
      const exists = await fs.pathExists(storagePath);
      const writable = await this.checkWritable(storagePath);
      const investigations = await this.database.listInvestigations();
      
      this.metrics.storage = {
        path: storagePath,
        exists,
        writable,
        investigations: investigations.length,
        maxInvestigations: this.config.getMaxInvestigations(),
        usage: (investigations.length / this.config.getMaxInvestigations()) * 100
      };

      // Lock metrics
      this.metrics.locks = {
        active: FileLockManager.getLockCount(),
        stale: 0 // Stale lock detection not implemented in current version
      };

      // Performance metrics
      this.metrics.performance = {
        activeOperations: this.activeOperations,
        maxConcurrent: this.config.getMaxConcurrent(),
        averageResponseTime: this.calculateAverageResponseTime()
      };
    } catch (error) {
      logger.error('Failed to update metrics', error as Error, {
        operation: 'update_metrics_failed'
      });
    }
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  // Performance tracking methods
  startOperation(): void {
    this.activeOperations++;
  }

  endOperation(responseTime: number): void {
    this.activeOperations = Math.max(0, this.activeOperations - 1);
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }
}
