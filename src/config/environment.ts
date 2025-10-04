/**
 * Environment configuration and validation
 */

import { InvestigationError } from '../types/index.js';

export interface EnvironmentConfig {
  // Storage configuration
  storagePath: string;
  maxInvestigations: number;
  maxFileSize: number;
  
  // Security configuration
  enableInputValidation: boolean;
  enableSecurityScanning: boolean;
  allowedFileTypes: string[];
  
  // Performance configuration
  maxConcurrentOperations: number;
  operationTimeout: number;
  retryAttempts: number;
  
  // Logging configuration
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAuditLogging: boolean;
  
  // API configuration
  enableApiIntegration: boolean;
  apiTimeout: number;
  maxApiRetries: number;
  
  // Development configuration
  isDevelopment: boolean;
  enableDebugMode: boolean;
}

export class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  private loadConfiguration(): EnvironmentConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      // Storage configuration
      storagePath: process.env.INVESTIGATIONS_STORAGE_PATH || './.investigations-mcp',
      maxInvestigations: parseInt(process.env.INVESTIGATIONS_MAX_COUNT || '50', 10),
      maxFileSize: parseInt(process.env.INVESTIGATIONS_MAX_FILE_SIZE || '104857600', 10), // 100MB
      
      // Security configuration
      enableInputValidation: process.env.INVESTIGATIONS_ENABLE_VALIDATION !== 'false',
      enableSecurityScanning: process.env.INVESTIGATIONS_ENABLE_SECURITY !== 'false',
      allowedFileTypes: (process.env.INVESTIGATIONS_ALLOWED_FILE_TYPES || '.json,.log,.txt,.md,.yml,.yaml,.xml,.csv').split(','),
      
      // Performance configuration
      maxConcurrentOperations: parseInt(process.env.INVESTIGATIONS_MAX_CONCURRENT || '10', 10),
      operationTimeout: parseInt(process.env.INVESTIGATIONS_OPERATION_TIMEOUT || '30000', 10), // 30 seconds
      retryAttempts: parseInt(process.env.INVESTIGATIONS_RETRY_ATTEMPTS || '3', 10),
      
      // Logging configuration
      logLevel: (process.env.INVESTIGATIONS_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
      enableAuditLogging: process.env.INVESTIGATIONS_ENABLE_AUDIT !== 'false',
      
      // API configuration
      enableApiIntegration: process.env.INVESTIGATIONS_ENABLE_API !== 'false',
      apiTimeout: parseInt(process.env.INVESTIGATIONS_API_TIMEOUT || '10000', 10), // 10 seconds
      maxApiRetries: parseInt(process.env.INVESTIGATIONS_API_RETRIES || '3', 10),
      
      // Development configuration
      isDevelopment,
      enableDebugMode: isDevelopment || process.env.INVESTIGATIONS_DEBUG === 'true'
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate storage configuration
    if (this.config.maxInvestigations < 1 || this.config.maxInvestigations > 1000) {
      errors.push('maxInvestigations must be between 1 and 1000');
    }

    if (this.config.maxFileSize < 1024 || this.config.maxFileSize > 1024 * 1024 * 1024) { // 1KB to 1GB
      errors.push('maxFileSize must be between 1KB and 1GB');
    }

    // Validate performance configuration
    if (this.config.maxConcurrentOperations < 1 || this.config.maxConcurrentOperations > 100) {
      errors.push('maxConcurrentOperations must be between 1 and 100');
    }

    if (this.config.operationTimeout < 1000 || this.config.operationTimeout > 300000) { // 1s to 5min
      errors.push('operationTimeout must be between 1000ms and 300000ms');
    }

    if (this.config.retryAttempts < 0 || this.config.retryAttempts > 10) {
      errors.push('retryAttempts must be between 0 and 10');
    }

    // Validate API configuration
    if (this.config.apiTimeout < 1000 || this.config.apiTimeout > 60000) { // 1s to 1min
      errors.push('apiTimeout must be between 1000ms and 60000ms');
    }

    if (this.config.maxApiRetries < 0 || this.config.maxApiRetries > 10) {
      errors.push('maxApiRetries must be between 0 and 10');
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.config.logLevel)) {
      errors.push(`logLevel must be one of: ${validLogLevels.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new InvestigationError(
        `Invalid configuration: ${errors.join(', ')}`,
        'INVALID_CONFIGURATION',
        undefined,
        { errors, config: this.config }
      );
    }
  }

  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();
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

  isInputValidationEnabled(): boolean {
    return this.config.enableInputValidation;
  }

  isSecurityScanningEnabled(): boolean {
    return this.config.enableSecurityScanning;
  }

  getAllowedFileTypes(): string[] {
    return [...this.config.allowedFileTypes];
  }

  getMaxConcurrentOperations(): number {
    return this.config.maxConcurrentOperations;
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

  isAuditLoggingEnabled(): boolean {
    return this.config.enableAuditLogging;
  }

  isApiIntegrationEnabled(): boolean {
    return this.config.enableApiIntegration;
  }

  getApiTimeout(): number {
    return this.config.apiTimeout;
  }

  getMaxApiRetries(): number {
    return this.config.maxApiRetries;
  }

  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  isDebugModeEnabled(): boolean {
    return this.config.enableDebugMode;
  }

  // Environment-specific configurations
  getProductionConfig(): Partial<EnvironmentConfig> {
    return {
      enableInputValidation: true,
      enableSecurityScanning: true,
      enableAuditLogging: true,
      logLevel: 'warn',
      enableDebugMode: false,
      maxConcurrentOperations: 5,
      retryAttempts: 3
    };
  }

  getDevelopmentConfig(): Partial<EnvironmentConfig> {
    return {
      enableInputValidation: true,
      enableSecurityScanning: false,
      enableAuditLogging: true,
      logLevel: 'debug',
      enableDebugMode: true,
      maxConcurrentOperations: 10,
      retryAttempts: 1
    };
  }

  getTestConfig(): Partial<EnvironmentConfig> {
    return {
      enableInputValidation: true,
      enableSecurityScanning: false,
      enableAuditLogging: false,
      logLevel: 'error',
      enableDebugMode: false,
      maxConcurrentOperations: 1,
      retryAttempts: 0,
      maxInvestigations: 5
    };
  }
}
