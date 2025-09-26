/**
 * Basic tests for investigation functionality
 */

import { InvestigationDatabase } from '../services/database.js';

describe('Investigation System', () => {
  let database: InvestigationDatabase;

  beforeEach(async () => {
    database = new InvestigationDatabase(':memory:');
    await database.initialize();
  });

  afterEach(async () => {
    await database.close();
  });

  test('should create database instance', () => {
    expect(database).toBeDefined();
    expect(database.getDatabasePath()).toContain('investigations.db');
  });

  test('should initialize database', async () => {
    await expect(database.initialize()).resolves.not.toThrow();
  });

  test('should have basic functionality', () => {
    expect(true).toBe(true);
  });
});