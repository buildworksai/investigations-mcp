/**
 * Environment configuration management system
 * Provides centralized configuration with validation and defaults
 */

import Joi from 'joi';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/error-handler.js';

export interface EnvironmentConfig {
  // Storage configuration
  storagePath: string;
  maxInvestigations: number;
  maxFileSize: number;
  
  // Security configuration
  enableValidation: boolean;
  enableSecurity: boolean;
  enableAudit: boolean;
  
  // Performance configuration
  maxConcurrent: number;
  operationTimeout: number;
  retryAttempts: number;
  
  // Logging configuration
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logDir: string;
  
  // API configuration
  enableApi: boolean;
  apiTimeout: number;
  apiRetries: number;
  
  // System configuration
  nodeEnv: 'development' | 'production' | 'test';
  enableDebugMode: boolean;
  
  // Backup configuration
  enableBackup: boolean;
  backupInterval: number;
  backupRetention: number;
  
  // Monitoring configuration
  enableMonitoring: boolean;
  healthCheckInterval: number;
  metricsInterval: number;
}

export class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private config: EnvironmentConfig;
  private schema: Joi.ObjectSchema;

  private constructor() {
    this.schema = this.createValidationSchema();
    this.config = this.loadAndValidateConfig();
  }

  static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  private createValidationSchema(): Joi.ObjectSchema {
    return Joi.object({
      // Storage configuration
      storagePath: Joi.string().min(1).max(500).default('./.investigations-mcp'),
      maxInvestigations: Joi.number().integer().min(1).max(1000).default(50),
      maxFileSize: Joi.number().integer().min(1024).max(1024 * 1024 * 1024).default(100 * 1024 * 1024), // 100MB
      
      // Security configuration
      enableValidation: Joi.boolean().default(true),
      enableSecurity: Joi.boolean().default(true),
      enableAudit: Joi.boolean().default(true),
      
      // Performance configuration
      maxConcurrent: Joi.number().integer().min(1).max(1000).default(150),
      operationTimeout: Joi.number().integer().min(1000).max(300000).default(30000), // 30 seconds
      retryAttempts: Joi.number().integer().min(0).max(10).default(3),
      
      // Logging configuration
      logLevel: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
      logDir: Joi.string().min(1).max(500).default('./logs'),
      
      // API configuration
      enableApi: Joi.boolean().default(true),
      apiTimeout: Joi.number().integer().min(1000).max(60000).default(10000), // 10 seconds
      apiRetries: Joi.number().integer().min(0).max(10).default(3),
      
      // System configuration
      nodeEnv: Joi.string().valid('development', 'production', 'test').default('development'),
      enableDebugMode: Joi.boolean().default(false),
      
      // Backup configuration
      enableBackup: Joi.boolean().default(true),
      backupInterval: Joi.number().integer().min(3600).max(86400).default(3600), // 1 hour
      backupRetention: Joi.number().integer().min(1).max(365).default(30), // 30 days
      
      // Monitoring configuration
      enableMonitoring: Joi.boolean().default(true),
      healthCheckInterval: Joi.number().integer().min(60).max(3600).default(300), // 5 minutes
      metricsInterval: Joi.number().integer().min(60).max(3600).default(60) // 1 minute
    });
  }

  private loadAndValidateConfig(): EnvironmentConfig {
    try {
      const rawConfig = this.loadFromEnvironment();
      const { error, value } = this.schema.validate(rawConfig, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.error('Configuration validation failed', new Error(errorMessages.join(', ')));
        throw new ValidationError(`Configuration validation failed: ${errorMessages.join(', ')}`);
      }

      logger.info('Configuration loaded and validated successfully', {
        operation: 'config_load',
        metadata: { nodeEnv: value.nodeEnv, logLevel: value.logLevel }
      });

      return value;
    } catch (error) {
      logger.error('Failed to load configuration', error as Error);
      throw error;
    }
  }

  private loadFromEnvironment(): Partial<EnvironmentConfig> {
    return {
      // Storage configuration
      storagePath: process.env.INVESTIGATIONS_STORAGE_PATH,
      maxInvestigations: process.env.INVESTIGATIONS_MAX_COUNT ? parseInt(process.env.INVESTIGATIONS_MAX_COUNT, 10) : undefined,
      maxFileSize: process.env.INVESTIGATIONS_MAX_FILE_SIZE ? parseInt(process.env.INVESTIGATIONS_MAX_FILE_SIZE, 10) : undefined,
      
      // Security configuration
      enableValidation: process.env.INVESTIGATIONS_ENABLE_VALIDATION ? process.env.INVESTIGATIONS_ENABLE_VALIDATION === 'true' : undefined,
      enableSecurity: process.env.INVESTIGATIONS_ENABLE_SECURITY ? process.env.INVESTIGATIONS_ENABLE_SECURITY === 'true' : undefined,
      enableAudit: process.env.INVESTIGATIONS_ENABLE_AUDIT ? process.env.INVESTIGATIONS_ENABLE_AUDIT === 'true' : undefined,
      
      // Performance configuration
      maxConcurrent: process.env.INVESTIGATIONS_MAX_CONCURRENT ? parseInt(process.env.INVESTIGATIONS_MAX_CONCURRENT, 10) : undefined,
      operationTimeout: process.env.INVESTIGATIONS_OPERATION_TIMEOUT ? parseInt(process.env.INVESTIGATIONS_OPERATION_TIMEOUT, 10) : undefined,
      retryAttempts: process.env.INVESTIGATIONS_RETRY_ATTEMPTS ? parseInt(process.env.INVESTIGATIONS_RETRY_ATTEMPTS, 10) : undefined,
      
      // Logging configuration
      logLevel: process.env.INVESTIGATIONS_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
      logDir: process.env.INVESTIGATIONS_LOG_DIR,
      
      // API configuration
      enableApi: process.env.INVESTIGATIONS_ENABLE_API ? process.env.INVESTIGATIONS_ENABLE_API === 'true' : undefined,
      apiTimeout: process.env.INVESTIGATIONS_API_TIMEOUT ? parseInt(process.env.INVESTIGATIONS_API_TIMEOUT, 10) : undefined,
      apiRetries: process.env.INVESTIGATIONS_API_RETRIES ? parseInt(process.env.INVESTIGATIONS_API_RETRIES, 10) : undefined,
      
      // System configuration
      nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
      enableDebugMode: process.env.INVESTIGATIONS_DEBUG ? process.env.INVESTIGATIONS_DEBUG === 'true' : undefined,
      
      // Backup configuration
      enableBackup: process.env.INVESTIGATIONS_ENABLE_BACKUP ? process.env.INVESTIGATIONS_ENABLE_BACKUP === 'true' : undefined,
      backupInterval: process.env.INVESTIGATIONS_BACKUP_INTERVAL ? parseInt(process.env.INVESTIGATIONS_BACKUP_INTERVAL, 10) : undefined,
      backupRetention: process.env.INVESTIGATIONS_BACKUP_RETENTION ? parseInt(process.env.INVESTIGATIONS_BACKUP_RETENTION, 10) : undefined,
      
      // Monitoring configuration
      enableMonitoring: process.env.INVESTIGATIONS_ENABLE_MONITORING ? process.env.INVESTIGATIONS_ENABLE_MONITORING === 'true' : undefined,
      healthCheckInterval: process.env.INVESTIGATIONS_HEALTH_CHECK_INTERVAL ? parseInt(process.env.INVESTIGATIONS_HEALTH_CHECK_INTERVAL, 10) : undefined,
      metricsInterval: process.env.INVESTIGATIONS_METRICS_INTERVAL ? parseInt(process.env.INVESTIGATIONS_METRICS_INTERVAL, 10) : undefined
    };
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  getStoragePath(): string {
    return this.config.storagePath;
  }

  getMaxInvestigations(): number {
    return this.config.maxInvestigations;
  }

  getMaxFileSize(): number {
    return this.config.maxFileSize;
  }

  isValidationEnabled(): boolean {
    return this.config.enableValidation;
  }

  isSecurityEnabled(): boolean {
    return this.config.enableSecurity;
  }

  isAuditEnabled(): boolean {
    return this.config.enableAudit;
  }

  getMaxConcurrent(): number {
    return this.config.maxConcurrent;
  }

  getOperationTimeout(): number {
    return this.config.operationTimeout;
  }

  getRetryAttempts(): number {
    return this.config.retryAttempts;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  getLogDir(): string {
    return this.config.logDir;
  }

  isApiEnabled(): boolean {
    return this.config.enableApi;
  }

  getApiTimeout(): number {
    return this.config.apiTimeout;
  }

  getApiRetries(): number {
    return this.config.apiRetries;
  }

  getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  isDebugMode(): boolean {
    return this.config.enableDebugMode;
  }

  isBackupEnabled(): boolean {
    return this.config.enableBackup;
  }

  getBackupInterval(): number {
    return this.config.backupInterval;
  }

  getBackupRetention(): number {
    return this.config.backupRetention;
  }

  isMonitoringEnabled(): boolean {
    return this.config.enableMonitoring;
  }

  getHealthCheckInterval(): number {
    return this.config.healthCheckInterval;
  }

  getMetricsInterval(): number {
    return this.config.metricsInterval;
  }

  // Method to reload configuration (useful for testing)
  reloadConfig(): void {
    this.config = this.loadAndValidateConfig();
    logger.info('Configuration reloaded', { operation: 'config_reload' });
  }

  // Method to get configuration summary (for health checks)
  getConfigSummary(): Record<string, any> {
    return {
      nodeEnv: this.config.nodeEnv,
      logLevel: this.config.logLevel,
      maxInvestigations: this.config.maxInvestigations,
      maxConcurrent: this.config.maxConcurrent,
      enableValidation: this.config.enableValidation,
      enableSecurity: this.config.enableSecurity,
      enableAudit: this.config.enableAudit,
      enableBackup: this.config.enableBackup,
      enableMonitoring: this.config.enableMonitoring
    };
  }
}
