/**
 * Comprehensive input validation and sanitization system
 * Provides security validation, data sanitization, and schema validation
 */

import Joi from 'joi';
import { ValidationError, SecurityError } from './error-handler.js';

export interface ValidationResult {
  isValid: boolean;
  data?: any;
  errors?: string[];
  sanitizedData?: any;
}

export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_FILE_TYPES = [
    'text/plain',
    'application/json',
    'text/csv',
    'application/xml',
    'text/xml',
    'application/log'
  ];

  // Investigation validation schemas
  static readonly investigationSchema = Joi.object({
    id: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('active', 'completed', 'suspended', 'archived').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    assigned_to: Joi.string().email().optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
    created_at: Joi.date().iso().required(),
    updated_at: Joi.date().iso().required()
  });

  static readonly evidenceSchema = Joi.object({
    id: Joi.string().uuid().required(),
    investigation_id: Joi.string().uuid().required(),
    type: Joi.string().valid('log', 'file', 'metric', 'config', 'network', 'process', 'system').required(),
    source: Joi.string().min(1).max(500).required(),
    content: Joi.object().required(),
    metadata: Joi.object({
      timestamp: Joi.date().iso().required(),
      size: Joi.number().integer().min(0).max(this.MAX_FILE_SIZE).required(),
      checksum: Joi.string().alphanum().length(32).required(),
      collected_by: Joi.string().email().required(),
      collection_method: Joi.string().max(100).required(),
      source_system: Joi.string().max(100).required()
    }).required(),
    chain_of_custody: Joi.array().items(Joi.object({
      timestamp: Joi.date().iso().required(),
      action: Joi.string().max(100).required(),
      performed_by: Joi.string().email().required(),
      notes: Joi.string().max(500).optional()
    })).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    created_at: Joi.date().iso().required()
  });

  static readonly analysisSchema = Joi.object({
    id: Joi.string().uuid().required(),
    investigation_id: Joi.string().uuid().required(),
    analysis_type: Joi.string().valid('timeline', 'causal', 'performance', 'security', 'correlation', 'statistical').required(),
    results: Joi.object().required(),
    confidence_score: Joi.number().min(0).max(1).required(),
    methodology: Joi.string().max(500).required(),
    findings: Joi.array().items(Joi.object({
      id: Joi.string().uuid().required(),
      title: Joi.string().max(200).required(),
      description: Joi.string().max(2000).required(),
      confidence: Joi.number().min(0).max(1).required(),
      evidence_ids: Joi.array().items(Joi.string().uuid()).required(),
      impact: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      category: Joi.string().max(100).required()
    })).required(),
    recommendations: Joi.array().items(Joi.string().max(500)).optional(),
    created_at: Joi.date().iso().required()
  });

  static validateInvestigation(data: unknown): ValidationResult {
    try {
      const { error, value } = this.investigationSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message)
        };
      }

      return {
        isValid: true,
        data: value,
        sanitizedData: this.sanitizeInvestigation(value)
      };
    } catch (err) {
      throw new ValidationError(
        `Investigation validation failed: ${err}`,
        undefined,
        { operation: 'validate_investigation', timestamp: new Date(), metadata: { data } }
      );
    }
  }

  static validateEvidence(data: unknown): ValidationResult {
    try {
      const { error, value } = this.evidenceSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message)
        };
      }

      return {
        isValid: true,
        data: value,
        sanitizedData: this.sanitizeEvidence(value)
      };
    } catch (err) {
      throw new ValidationError(
        `Evidence validation failed: ${err}`,
        undefined,
        { operation: 'validate_evidence', timestamp: new Date(), metadata: { data } }
      );
    }
  }

  static validateAnalysis(data: unknown): ValidationResult {
    try {
      const { error, value } = this.analysisSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message)
        };
      }

      return {
        isValid: true,
        data: value,
        sanitizedData: this.sanitizeAnalysis(value)
      };
    } catch (err) {
      throw new ValidationError(
        `Analysis validation failed: ${err}`,
        undefined,
        { operation: 'validate_analysis', timestamp: new Date(), metadata: { data } }
      );
    }
  }

  static validateString(input: string, fieldName: string, maxLength: number = this.MAX_STRING_LENGTH): string {
    if (typeof input !== 'string') {
      throw new ValidationError(`Invalid ${fieldName}: must be a string`);
    }

    if (input.length > maxLength) {
      throw new ValidationError(`Invalid ${fieldName}: exceeds maximum length of ${maxLength}`);
    }

    return this.sanitizeString(input);
  }

  static validatePath(input: string, fieldName: string): string {
    const sanitized = this.sanitizeString(input);
    
    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('~') || sanitized.startsWith('/')) {
      throw new SecurityError(`Invalid ${fieldName}: path traversal detected`);
    }

    return sanitized;
  }

  static validateEmail(email: string): string {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new ValidationError(`Invalid email format: ${email}`);
    }

    return trimmedEmail.toLowerCase();
  }

  static validateUUID(uuid: string, fieldName: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new ValidationError(`Invalid ${fieldName}: must be a valid UUID`);
    }

    return uuid.toLowerCase();
  }

  static validateFileType(mimeType: string): string {
    if (!this.ALLOWED_FILE_TYPES.includes(mimeType)) {
      throw new SecurityError(`Invalid file type: ${mimeType} is not allowed`);
    }

    return mimeType;
  }

  static validateFileSize(size: number): number {
    if (size > this.MAX_FILE_SIZE) {
      throw new ValidationError(`File too large: ${size} bytes exceeds maximum of ${this.MAX_FILE_SIZE} bytes`);
    }

    return size;
  }

  // Sanitization methods
  private static sanitizeInvestigation(data: any): any {
    return {
      ...data,
      title: this.sanitizeString(data.title),
      description: data.description ? this.sanitizeString(data.description) : undefined,
      tags: data.tags ? data.tags.map((tag: string) => this.sanitizeString(tag)) : undefined,
      assigned_to: data.assigned_to ? this.sanitizeString(data.assigned_to) : undefined
    };
  }

  private static sanitizeEvidence(data: any): any {
    return {
      ...data,
      source: this.sanitizeString(data.source),
      tags: data.tags ? data.tags.map((tag: string) => this.sanitizeString(tag)) : undefined,
      chain_of_custody: data.chain_of_custody ? data.chain_of_custody.map((entry: any) => ({
        ...entry,
        action: this.sanitizeString(entry.action),
        notes: entry.notes ? this.sanitizeString(entry.notes) : undefined
      })) : undefined
    };
  }

  private static sanitizeAnalysis(data: any): any {
    return {
      ...data,
      methodology: this.sanitizeString(data.methodology),
      findings: data.findings.map((finding: any) => ({
        ...finding,
        title: this.sanitizeString(finding.title),
        description: this.sanitizeString(finding.description),
        category: this.sanitizeString(finding.category)
      })),
      recommendations: data.recommendations ? data.recommendations.map((rec: string) => this.sanitizeString(rec)) : undefined
    };
  }

  private static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/<script[^>]*>(.*?)<\/script>/gi, '$1') // Remove script tags but keep content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .substring(0, this.MAX_STRING_LENGTH);
  }

  // Security validation methods
  static validateSecurity(input: any, context: string): boolean {
    try {
      // Check for SQL injection patterns
      if (this.containsSQLInjection(input)) {
        throw new SecurityError(`SQL injection attempt detected in ${context}`);
      }

      // Check for XSS patterns
      if (this.containsXSS(input)) {
        throw new SecurityError(`XSS attempt detected in ${context}`);
      }

      // Check for command injection patterns
      if (this.containsCommandInjection(input)) {
        throw new SecurityError(`Command injection attempt detected in ${context}`);
      }

      return true;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`Security validation failed for ${context}: ${error}`);
    }
  }

  private static containsSQLInjection(input: any): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/i
    ];

    const inputStr = JSON.stringify(input);
    return sqlPatterns.some(pattern => pattern.test(inputStr));
  }

  private static containsXSS(input: any): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi
    ];

    const inputStr = JSON.stringify(input);
    return xssPatterns.some(pattern => pattern.test(inputStr));
  }

  private static containsCommandInjection(input: any): boolean {
    const commandPatterns = [
      /[;&|`$(){}[\]\\]/,
      /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b/i,
      /(\||&&|;|\$\(|`)/,
      /(rm\s+-rf|del\s+\/s|format\s+)/i
    ];

    const inputStr = JSON.stringify(input);
    return commandPatterns.some(pattern => pattern.test(inputStr));
  }
}
