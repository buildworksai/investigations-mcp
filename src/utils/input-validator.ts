/**
 * Input validation utilities for security and data integrity
 */

import { InvestigationError } from '../types/index.js';

export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_FILE_EXTENSIONS = ['.json', '.log', '.txt', '.md', '.yml', '.yaml', '.xml', '.csv'];
  private static readonly DANGEROUS_PATTERNS = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS
    /javascript:/gi, // XSS
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi, // Code injection
    /exec\s*\(/gi, // Code injection
    /system\s*\(/gi, // System calls
  ];

  static validateString(input: string, fieldName: string, maxLength: number = this.MAX_STRING_LENGTH): string {
    if (typeof input !== 'string') {
      throw new InvestigationError(
        `${fieldName} must be a string`,
        'INVALID_INPUT_TYPE',
        undefined,
        { fieldName, input }
      );
    }

    if (input.length > maxLength) {
      throw new InvestigationError(
        `${fieldName} exceeds maximum length of ${maxLength} characters`,
        'INPUT_TOO_LONG',
        undefined,
        { fieldName, length: input.length, maxLength }
      );
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        throw new InvestigationError(
          `${fieldName} contains potentially dangerous content`,
          'DANGEROUS_INPUT',
          undefined,
          { fieldName, pattern: pattern.toString() }
        );
      }
    }

    return input.trim();
  }

  static validateId(id: string, fieldName: string = 'ID'): string {
    if (!id || typeof id !== 'string') {
      throw new InvestigationError(
        `${fieldName} is required and must be a string`,
        'INVALID_ID',
        undefined,
        { fieldName, id }
      );
    }

    // UUID v4 pattern or alphanumeric with hyphens/underscores
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    if (!idPattern.test(id) || id.length < 1 || id.length > 100) {
      throw new InvestigationError(
        `${fieldName} must be alphanumeric with hyphens/underscores only (1-100 characters)`,
        'INVALID_ID_FORMAT',
        undefined,
        { fieldName, id }
      );
    }

    return id;
  }

  static validateFilePath(filePath: string, fieldName: string = 'file path'): string {
    const validatedPath = this.validateString(filePath, fieldName, 1000);

    // Check for path traversal
    if (validatedPath.includes('..') || validatedPath.includes('~')) {
      throw new InvestigationError(
        `${fieldName} contains invalid path traversal characters`,
        'INVALID_PATH',
        undefined,
        { fieldName, filePath: validatedPath }
      );
    }

    // Check file extension
    const extension = validatedPath.toLowerCase().substring(validatedPath.lastIndexOf('.'));
    if (extension && !this.ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      throw new InvestigationError(
        `${fieldName} has unsupported file extension: ${extension}`,
        'UNSUPPORTED_FILE_TYPE',
        undefined,
        { fieldName, extension, allowedExtensions: this.ALLOWED_FILE_EXTENSIONS }
      );
    }

    return validatedPath;
  }

  static validateFileSize(size: number, fieldName: string = 'file size'): number {
    if (typeof size !== 'number' || size < 0) {
      throw new InvestigationError(
        `${fieldName} must be a non-negative number`,
        'INVALID_FILE_SIZE',
        undefined,
        { fieldName, size }
      );
    }

    if (size > this.MAX_FILE_SIZE) {
      throw new InvestigationError(
        `${fieldName} exceeds maximum size of ${this.MAX_FILE_SIZE} bytes`,
        'FILE_TOO_LARGE',
        undefined,
        { fieldName, size, maxSize: this.MAX_FILE_SIZE }
      );
    }

    return size;
  }

  static validateEnum<T extends string>(value: string, allowedValues: readonly T[], fieldName: string): T {
    if (!allowedValues.includes(value as T)) {
      throw new InvestigationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        'INVALID_ENUM_VALUE',
        undefined,
        { fieldName, value, allowedValues }
      );
    }

    return value as T;
  }

  static validateArray<T>(array: T[], fieldName: string, maxLength: number = 1000): T[] {
    if (!Array.isArray(array)) {
      throw new InvestigationError(
        `${fieldName} must be an array`,
        'INVALID_ARRAY_TYPE',
        undefined,
        { fieldName, array }
      );
    }

    if (array.length > maxLength) {
      throw new InvestigationError(
        `${fieldName} exceeds maximum length of ${maxLength} items`,
        'ARRAY_TOO_LONG',
        undefined,
        { fieldName, length: array.length, maxLength }
      );
    }

    return array;
  }

  static validateObject(obj: any, fieldName: string, maxDepth: number = 10): any {
    if (typeof obj !== 'object' || obj === null) {
      throw new InvestigationError(
        `${fieldName} must be an object`,
        'INVALID_OBJECT_TYPE',
        undefined,
        { fieldName, obj }
      );
    }

    // Check for circular references and excessive depth
    const depth = this.getObjectDepth(obj);
    if (depth > maxDepth) {
      throw new InvestigationError(
        `${fieldName} exceeds maximum depth of ${maxDepth} levels`,
        'OBJECT_TOO_DEEP',
        undefined,
        { fieldName, depth, maxDepth }
      );
    }

    return obj;
  }

  private static getObjectDepth(obj: any, currentDepth: number = 0, visited: WeakSet<any> = new WeakSet()): number {
    if (obj === null || typeof obj !== 'object' || visited.has(obj)) {
      return currentDepth;
    }

    visited.add(obj);
    let maxDepth = currentDepth;

    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        maxDepth = Math.max(maxDepth, this.getObjectDepth(value, currentDepth + 1, visited));
      }
    }

    return maxDepth;
  }

  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizePath(input: string): string {
    return input
      .replace(/[<>:"|?*]/g, '_') // Replace invalid filename characters
      .replace(/\.\./g, '_') // Replace path traversal
      .replace(/^\.+/, '_') // Replace leading dots
      .replace(/\.+$/, '_'); // Replace trailing dots
  }
}
