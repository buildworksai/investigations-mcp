/**
 * Database service for investigations MCP tools
 * Provides SQLite-based storage with proper schema and data integrity
 */

import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type {
  InvestigationCase,
  EvidenceItem,
  // AnalysisResult,
  // Finding,
  // TimelineEvent,
  // CausalRelationship,
  // InvestigationReport,
  InvestigationFilters
} from '../types/index.js';

// Helper function to get expected NODE_MODULE_VERSION for Node.js versions
function getExpectedNodeModuleVersion(nodeMajorVersion: number): number | string {
  const expectedVersions: Record<number, number> = {
    16: 108,
    18: 137,
    20: 115,
    22: 127
  };
  return expectedVersions[nodeMajorVersion] || 'Unknown';
}
import { InvestigationError } from '../types/index.js';

export class InvestigationDatabase {
  private db: Database.Database | null = null;
  private initialized: boolean = false;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Use provided path or create a proper data directory
    if (dbPath) {
      this.dbPath = dbPath;
    } else {
      // For Windsurf IDE and other sandboxed environments, prioritize user home directory
      const possiblePaths = [
        path.join(os.homedir(), '.investigations-mcp', 'investigations.db'),
        path.join(os.tmpdir(), 'investigations-mcp', 'investigations.db'),
        path.join(process.cwd(), 'data', 'investigations.db'),
        './investigations.db'
      ];
      
      this.dbPath = possiblePaths[0]; // Start with user home directory
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure the directory exists and is writable
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);
      
      // Test if we can write to the directory
      const testFile = path.join(dbDir, '.write-test');
      try {
        await fs.writeFile(testFile, 'test');
        await fs.remove(testFile);
      } catch (_writeError) {
        // If we can't write to the preferred location, try fallback locations
        const fallbackPaths = [
          path.join(os.tmpdir(), 'investigations-mcp', 'investigations.db'),
          path.join(process.cwd(), 'data', 'investigations.db'),
          './investigations.db'
        ];
        
        for (const fallbackPath of fallbackPaths) {
          try {
            const fallbackDir = path.dirname(fallbackPath);
            await fs.ensureDir(fallbackDir);
            const testFallbackFile = path.join(fallbackDir, '.write-test');
            await fs.writeFile(testFallbackFile, 'test');
            await fs.remove(testFallbackFile);
            
            // If we can write here, update the database path
            this.dbPath = fallbackPath;
            break;
          } catch (_fallbackError) {
            continue; // Try next fallback
          }
        }
      }
      
      // Now create the database connection with error handling
      try {
        this.db = new Database(this.dbPath);
      } catch (dbError: unknown) {
        // If database creation fails due to native module issues, provide helpful error
        if (dbError instanceof Error && dbError.message.includes('better_sqlite3.node')) {
          console.error('❌ Database initialization failed: better-sqlite3 native module error');
          console.error('💡 This is likely due to corrupted npx cache. Try:');
          console.error('   1. npm cache clean --force');
          console.error('   2. rm -rf ~/.npm/_npx');
          console.error('   3. Retry: npx buildworks-ai-investigations-mcp@latest');
          console.error('📖 See: https://github.com/buildworksai/investigations-mcp#troubleshooting');
        }
        throw new InvestigationError(
          'DATABASE_INIT_ERROR',
          `Failed to initialize database at ${this.dbPath}: ${(dbError as Error).message}`
        );
      }
      // Create investigations table
      await this.run(`
        CREATE TABLE IF NOT EXISTS investigations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          category TEXT NOT NULL CHECK (category IN ('performance', 'security', 'reliability', 'configuration', 'network', 'application')),
          priority TEXT NOT NULL CHECK (priority IN ('p1', 'p2', 'p3', 'p4')),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reported_by TEXT NOT NULL,
          assigned_to TEXT,
          affected_systems TEXT,
          metadata TEXT,
          root_causes TEXT,
          contributing_factors TEXT,
          recommendations TEXT,
          findings TEXT
        )
      `);

      // Create evidence table
      await this.run(`
        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('log', 'config', 'metric', 'network', 'process', 'filesystem', 'database', 'security', 'infrastructure', 'container', 'cloud', 'monitoring')),
          source TEXT NOT NULL,
          path TEXT,
          content TEXT NOT NULL,
          metadata TEXT NOT NULL,
          chain_of_custody TEXT,
          tags TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
        )
      `);
      // Migration: widen evidence.type CHECK to include new types if existing table has old CHECK
      try {
        await this.all(`PRAGMA table_info(evidence)`);
        // naive check: try inserting and rollback on failure
        const testId = 'migrate-check-' + Date.now();
        await this.run('BEGIN');
        try {
          await this.run(`INSERT INTO evidence (id, investigation_id, type, source, content, metadata, created_at) VALUES (?, ?, 'infrastructure', 'migration_test', '{}', '{}', CURRENT_TIMESTAMP)`, [testId, 'non-existent']);
          await this.run(`DELETE FROM evidence WHERE id = ?`, [testId]);
          await this.run('COMMIT');
        } catch {
          await this.run('ROLLBACK');
          // Recreate evidence table with expanded CHECK by renaming and copying
          await this.run('ALTER TABLE evidence RENAME TO evidence_old');
          await this.run(`
            CREATE TABLE evidence (
              id TEXT PRIMARY KEY,
              investigation_id TEXT NOT NULL,
              type TEXT NOT NULL CHECK (type IN ('log', 'config', 'metric', 'network', 'process', 'filesystem', 'database', 'security', 'infrastructure', 'container', 'cloud', 'monitoring')),
              source TEXT NOT NULL,
              path TEXT,
              content TEXT NOT NULL,
              metadata TEXT NOT NULL,
              chain_of_custody TEXT,
              tags TEXT,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
            )
          `);
          await this.run(`
            INSERT INTO evidence (id, investigation_id, type, source, path, content, metadata, chain_of_custody, tags, created_at)
            SELECT id, investigation_id, type, source, path, content, metadata, chain_of_custody, tags, created_at FROM evidence_old
          `);
          await this.run('DROP TABLE evidence_old');
        }
      } catch (_e) {
        // best-effort migration; continue
      }

      // Create analysis_results table
      await this.run(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('timeline', 'causal', 'performance', 'security', 'correlation', 'statistical')),
          hypothesis TEXT,
          confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
          evidence_supporting TEXT,
          evidence_contradicting TEXT,
          conclusions TEXT,
          recommendations TEXT,
          methodology TEXT,
          limitations TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
        )
      `);

      // Create findings table
      await this.run(`
        CREATE TABLE IF NOT EXISTS findings (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          category TEXT NOT NULL,
          evidence_ids TEXT,
          confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
          impact TEXT,
          likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
        )
      `);

      // Create timeline_events table
      await this.run(`
        CREATE TABLE IF NOT EXISTS timeline_events (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          event_type TEXT NOT NULL,
          description TEXT NOT NULL,
          source TEXT NOT NULL,
          evidence_id TEXT,
          related_events TEXT,
          metadata TEXT,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE,
          FOREIGN KEY (evidence_id) REFERENCES evidence (id) ON DELETE SET NULL
        )
      `);

      // Create causal_relationships table
      await this.run(`
        CREATE TABLE IF NOT EXISTS causal_relationships (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          cause_event_id TEXT NOT NULL,
          effect_event_id TEXT NOT NULL,
          relationship_type TEXT NOT NULL CHECK (relationship_type IN ('direct', 'contributing', 'correlated')),
          confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
          evidence_ids TEXT,
          description TEXT,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
        )
      `);

      // Create reports table
      await this.run(`
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          investigation_id TEXT NOT NULL,
          format TEXT NOT NULL CHECK (format IN ('json', 'markdown', 'pdf', 'html')),
          content TEXT NOT NULL,
          generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          generated_by TEXT NOT NULL,
          includes_evidence BOOLEAN NOT NULL DEFAULT 0,
          includes_timeline BOOLEAN NOT NULL DEFAULT 0,
          includes_analysis BOOLEAN NOT NULL DEFAULT 0,
          file_path TEXT,
          FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      await this.run(`CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations (status)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_investigations_severity ON investigations (severity)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_investigations_category ON investigations (category)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations (created_at)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_evidence_investigation_id ON evidence (investigation_id)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence (type)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_analysis_investigation_id ON analysis_results (investigation_id)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_timeline_investigation_id ON timeline_events (investigation_id)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON timeline_events (timestamp)`);

      this.initialized = true;
      console.log(`Database initialized successfully at: ${this.dbPath}`);
    } catch (error) {
      console.error(`Failed to initialize database at ${this.dbPath}:`, error);
      
      // Enhanced error handling for better-sqlite3 native module issues
      let enhancedErrorMessage = `Failed to initialize database at ${this.dbPath}: ${error}`;
      let errorCode = 'DATABASE_INIT_ERROR';
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Check for NODE_MODULE_VERSION mismatch
        if (errorMessage.includes('node_module_version') || errorMessage.includes('was compiled against a different node.js version')) {
          enhancedErrorMessage = `NODE_MODULE_VERSION mismatch detected. This is a Node.js native module compatibility issue.
          
Root Cause: better-sqlite3 was compiled for a different Node.js version than what you're currently running.

Solutions:
1. Clear npm/npx cache: npm cache clean --force && rm -rf ~/.npm/_npx
2. Reinstall Node.js from official source: https://nodejs.org/
3. Use Node Version Manager: nvm install 18 && nvm use 18
4. Try: npx buildworks-ai-investigations-mcp@latest --version

Current Node.js: ${process.version}
NODE_MODULE_VERSION: ${process.versions.modules}
Expected for Node.js ${process.version.split('.')[0]}: ${getExpectedNodeModuleVersion(parseInt(process.version.split('.')[0]))}

For more help: https://github.com/buildworksai/investigations-mcp#troubleshooting`;
          errorCode = 'NODE_MODULE_VERSION_MISMATCH';
        }
        // Check for better-sqlite3 specific errors
        else if (errorMessage.includes('better_sqlite3') || errorMessage.includes('better-sqlite3')) {
          enhancedErrorMessage = `better-sqlite3 native module error detected.

This is typically caused by:
1. Corrupted npm/npx cache
2. Node.js version incompatibility
3. Missing native module dependencies

Solutions:
1. Clear all caches: npm cache clean --force && rm -rf ~/.npm/_npx
2. Reinstall: npm install -g buildworks-ai-investigations-mcp@latest
3. Check Node.js version: node --version (requires Node.js 18+)

For more help: https://github.com/buildworksai/investigations-mcp#troubleshooting`;
          errorCode = 'BETTER_SQLITE3_ERROR';
        }
      }
      
      throw new InvestigationError(
        enhancedErrorMessage,
        errorCode,
        undefined,
        { error, dbPath: this.dbPath }
      );
    }
  }

  async createInvestigation(case_: InvestigationCase): Promise<void> {
    try {
      await this.run(`
        INSERT INTO investigations (
          id, title, description, status, severity, category, priority,
          reported_by, assigned_to, affected_systems, metadata,
          root_causes, contributing_factors, recommendations, findings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        case_.id,
        case_.title,
        case_.description,
        case_.status,
        case_.severity,
        case_.category,
        case_.priority,
        case_.reported_by,
        case_.assigned_to || null,
        JSON.stringify(case_.affected_systems),
        JSON.stringify(case_.metadata),
        JSON.stringify(case_.root_causes),
        JSON.stringify(case_.contributing_factors),
        JSON.stringify(case_.recommendations),
        JSON.stringify(case_.findings)
      ]);
    } catch (error) {
      throw new InvestigationError(
        `Failed to create investigation: ${error}`,
        'DATABASE_CREATE_ERROR',
        case_.id,
        { error }
      );
    }
  }

  async getInvestigation(id: string): Promise<InvestigationCase | null> {
    try {
      const row = await this.get('SELECT * FROM investigations WHERE id = ?', [id]) as Record<string, unknown> | null;
      if (!row) return null;

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        status: row.status as 'active' | 'completed' | 'archived',
        severity: row.severity as 'low' | 'medium' | 'high' | 'critical',
        category: row.category as 'performance' | 'security' | 'reliability' | 'configuration' | 'network' | 'application',
        priority: row.priority as 'p1' | 'p2' | 'p3' | 'p4',
        created_at: new Date(row.created_at as string),
        updated_at: new Date(row.updated_at as string),
        reported_by: row.reported_by as string,
        assigned_to: row.assigned_to as string | undefined,
        affected_systems: JSON.parse((row.affected_systems as string) || '[]'),
        evidence: [], // Will be loaded separately if needed
        analysis: [], // Will be loaded separately if needed
        analysis_results: [], // Will be loaded separately if needed
        findings: JSON.parse((row.findings as string) || '[]'),
        root_causes: JSON.parse((row.root_causes as string) || '[]'),
        contributing_factors: JSON.parse((row.contributing_factors as string) || '[]'),
        recommendations: JSON.parse((row.recommendations as string) || '[]'),
        metadata: JSON.parse((row.metadata as string) || '{}')
      };
    } catch (error) {
      throw new InvestigationError(
        `Failed to get investigation: ${error}`,
        'DATABASE_GET_ERROR',
        id,
        { error }
      );
    }
  }

  async listInvestigations(filters: InvestigationFilters = {}): Promise<InvestigationCase[]> {
    try {
      let query = 'SELECT * FROM investigations WHERE 1=1';
      const params: unknown[] = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.severity) {
        query += ' AND severity = ?';
        params.push(filters.severity);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.assigned_to) {
        query += ' AND assigned_to = ?';
        params.push(filters.assigned_to);
      }

      if (filters.date_range) {
        query += ' AND created_at >= ? AND created_at <= ?';
        params.push(filters.date_range.start.toISOString(), filters.date_range.end.toISOString());
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const rows = await this.all(query, params) as Record<string, unknown>[];

      return rows.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        status: row.status as 'active' | 'completed' | 'archived',
        severity: row.severity as 'low' | 'medium' | 'high' | 'critical',
        category: row.category as 'performance' | 'security' | 'reliability' | 'configuration' | 'network' | 'application',
        priority: row.priority as 'p1' | 'p2' | 'p3' | 'p4',
        created_at: new Date(row.created_at as string),
        updated_at: new Date(row.updated_at as string),
        reported_by: row.reported_by as string,
        assigned_to: row.assigned_to as string | undefined,
        affected_systems: JSON.parse((row.affected_systems as string) || '[]'),
        evidence: [],
        analysis: [],
        analysis_results: [],
        findings: [],
        root_causes: JSON.parse((row.root_causes as string) || '[]'),
        contributing_factors: JSON.parse((row.contributing_factors as string) || '[]'),
        recommendations: JSON.parse((row.recommendations as string) || '[]'),
        metadata: JSON.parse((row.metadata as string) || '{}')
      }));
    } catch (error) {
      throw new InvestigationError(
        `Failed to list investigations: ${error}`,
        'DATABASE_LIST_ERROR',
        undefined,
        { error }
      );
    }
  }


  async addEvidence(evidence: EvidenceItem): Promise<void> {
    try {
      await this.run(`
        INSERT INTO evidence (
          id, investigation_id, type, source, path, content, metadata,
          chain_of_custody, tags, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evidence.id,
        evidence.investigation_id,
        evidence.type,
        evidence.source,
        evidence.path || null,
        JSON.stringify(evidence.content),
        JSON.stringify(evidence.metadata),
        JSON.stringify(evidence.chain_of_custody),
        JSON.stringify(evidence.tags),
        evidence.created_at.toISOString()
      ]);
    } catch (error) {
      throw new InvestigationError(
        `Failed to add evidence: ${error}`,
        'DATABASE_ADD_EVIDENCE_ERROR',
        evidence.investigation_id,
        { error }
      );
    }
  }

  async getEvidence(investigationId: string): Promise<EvidenceItem[]> {
    try {
      const rows = await this.all(
        'SELECT * FROM evidence WHERE investigation_id = ? ORDER BY created_at ASC',
        [investigationId]
      ) as Record<string, unknown>[];

      return rows.map((row) => ({
        id: row.id as string,
        investigation_id: row.investigation_id as string,
        type: row.type as 'security' | 'network' | 'log' | 'config' | 'metric' | 'process' | 'filesystem' | 'database' | 'infrastructure' | 'container' | 'cloud' | 'monitoring',
        source: row.source as string,
        path: row.path as string | undefined,
        content: JSON.parse(row.content as string),
        metadata: JSON.parse(row.metadata as string),
        chain_of_custody: JSON.parse((row.chain_of_custody as string) || '[]'),
        tags: JSON.parse((row.tags as string) || '[]'),
        created_at: new Date(row.created_at as string)
      }));
    } catch (error) {
      throw new InvestigationError(
        `Failed to get evidence: ${error}`,
        'DATABASE_GET_EVIDENCE_ERROR',
        investigationId,
        { error }
      );
    }
  }

  async updateInvestigation(id: string, updates: Partial<InvestigationCase>): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        params.push(updates.title);
      }
      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        params.push(updates.description);
      }
      if (updates.status !== undefined) {
        setClauses.push('status = ?');
        params.push(updates.status);
      }
      if (updates.severity !== undefined) {
        setClauses.push('severity = ?');
        params.push(updates.severity);
      }
      if (updates.category !== undefined) {
        setClauses.push('category = ?');
        params.push(updates.category);
      }
      if (updates.priority !== undefined) {
        setClauses.push('priority = ?');
        params.push(updates.priority);
      }
      if (updates.assigned_to !== undefined) {
        setClauses.push('assigned_to = ?');
        params.push(updates.assigned_to);
      }
      if (updates.affected_systems !== undefined) {
        setClauses.push('affected_systems = ?');
        params.push(JSON.stringify(updates.affected_systems));
      }
      if (updates.metadata !== undefined) {
        setClauses.push('metadata = ?');
        params.push(JSON.stringify(updates.metadata));
      }
      if (updates.root_causes !== undefined) {
        setClauses.push('root_causes = ?');
        params.push(JSON.stringify(updates.root_causes));
      }
      if (updates.contributing_factors !== undefined) {
        setClauses.push('contributing_factors = ?');
        params.push(JSON.stringify(updates.contributing_factors));
      }
      if (updates.recommendations !== undefined) {
        setClauses.push('recommendations = ?');
        params.push(JSON.stringify(updates.recommendations));
      }
      if (updates.findings !== undefined) {
        setClauses.push('findings = ?');
        params.push(JSON.stringify(updates.findings));
      }

      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.run(
        `UPDATE investigations SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    } catch (error) {
      throw new InvestigationError(
        `Failed to update investigation: ${error}`,
        'DATABASE_UPDATE_ERROR',
        id,
        { error }
      );
    }
  }

  getDatabasePath(): string {
    return this.dbPath;
  }

  async close(): Promise<void> {
    if (!this.db) return;
    try {
      this.db.close();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Helper methods for database operations
  private run(sql: string, params: unknown[] = []): Promise<void> {
    if (!this.db) {
      throw new InvestigationError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }
    try {
      this.db.prepare(sql).run(...params);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private get(sql: string, params: unknown[] = []): Promise<unknown> {
    if (!this.db) {
      throw new InvestigationError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }
    try {
      const result = this.db.prepare(sql).get(...params);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    if (!this.db) {
      throw new InvestigationError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }
    try {
      const result = this.db.prepare(sql).all(...params);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}