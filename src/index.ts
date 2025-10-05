#!/usr/bin/env node

/**
 * Main MCP server for investigations tools
 * Provides forensic investigation capabilities with evidence-based analysis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import { InvestigationDatabase } from './services/database.js';
import { EvidenceCollector } from './collectors/evidence-collector.js';
import { AnalysisEngine } from './analyzers/analysis-engine.js';
import { ReportGenerator } from './services/report-generator.js';
import { investigationTools } from './tools/investigation-tools.js';
import type {
  InvestigationCase,
  EvidenceItem
} from './types/index.js';
import {
  InvestigationError,
  EvidenceError,
  AnalysisError
} from './types/index.js';

class InvestigationMCPServer {
  private server: Server;
  private database: InvestigationDatabase;
  private evidenceCollector: EvidenceCollector;
  private analysisEngine: AnalysisEngine;
  private reportGenerator: ReportGenerator;

  constructor() {
            this.server = new Server(
              {
                name: 'Investigations MCP by BuildWorks.AI',
                version: '2.2.2',
              },
          {
            capabilities: {
              tools: {},
            },
          }
        );

    this.database = new InvestigationDatabase();
    this.evidenceCollector = new EvidenceCollector();
    this.analysisEngine = new AnalysisEngine();
    this.reportGenerator = new ReportGenerator();

    this.setupHandlers();
    
    // Log storage path for debugging (stderr to avoid interfering with MCP stdio)
    console.error(`JSON storage will be created at: ${this.database.getStoragePath()}`);
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: investigationTools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'investigation_start':
            return await this.handleInvestigationStart(args);
          case 'investigation_collect_evidence':
            return await this.handleCollectEvidence(args);
          case 'investigation_analyze_evidence':
            return await this.handleAnalyzeEvidence(args);
          case 'investigation_trace_causality':
            return await this.handleTraceCausality(args);
          case 'investigation_validate_hypothesis':
            return await this.handleValidateHypothesis(args);
          case 'investigation_document_findings':
            return await this.handleDocumentFindings(args);
          case 'investigation_generate_report':
            return await this.handleGenerateReport(args);
          case 'investigation_list_cases':
            return await this.handleListCases(args);
          case 'investigation_get_case':
            return await this.handleGetCase(args);
          case 'investigation_search_evidence':
            return await this.handleSearchEvidence(args);
          default:
            throw new InvestigationError(
              `Unknown tool: ${name}`,
              'UNKNOWN_TOOL'
            );
        }
      } catch (error) {
        if (error instanceof InvestigationError) {
          return {
            content: [
              {
                type: 'text',
                text: `Investigation Error: ${error.message}\nCode: ${error.code}\nDetails: ${JSON.stringify(error.details, null, 2)}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  private async handleInvestigationStart(args: any) {
    const investigationId = uuidv4();
    const now = new Date();

    const investigation: InvestigationCase = {
      id: investigationId,
      title: args.title,
      description: args.description,
      status: 'active',
      severity: args.severity,
      category: args.category,
      priority: args.priority || 'p3',
      created_at: now,
      updated_at: now,
      reported_by: args.reported_by,
      assigned_to: args.assigned_to,
      affected_systems: args.affected_systems || [],
      evidence: [],
      analysis: [],
      analysis_results: [],
      findings: [],
      root_causes: [],
      contributing_factors: [],
      recommendations: [],
      metadata: {
        initial_hypothesis: args.initial_hypothesis,
        ...args.metadata
      }
    };

    await this.database.createInvestigation(investigation);

    return {
      content: [
        {
          type: 'text',
          text: `Investigation started successfully.\n\nID: ${investigationId}\nTitle: ${args.title}\nStatus: Active\nSeverity: ${args.severity}\nCategory: ${args.category}\n\nNext steps:\n1. Collect evidence using investigation_collect_evidence\n2. Analyze evidence using investigation_analyze_evidence\n3. Document findings using investigation_document_findings`,
        },
      ],
    };
  }

  private async handleCollectEvidence(args: any) {
    const { investigation_id, sources, preserve_chain_of_custody = true } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    const collectedEvidence: EvidenceItem[] = [];

    for (const source of sources) {
      try {
        const evidence = await this.evidenceCollector.collect(source, {
          investigation_id,
          preserve_chain_of_custody
        });

        await this.database.addEvidence(evidence);
        collectedEvidence.push(evidence);
      } catch (error) {
        throw new EvidenceError(
          `Failed to collect evidence from ${source.type}: ${error}`,
          undefined,
          { source, error }
        );
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Evidence collection completed.\n\nInvestigation ID: ${investigation_id}\nSources collected: ${sources.length}\nEvidence items: ${collectedEvidence.length}\n\nCollected evidence:\n${collectedEvidence.map(e => `- ${e.type}: ${e.source} (${e.metadata.size} bytes)`).join('\n')}\n\nNext steps:\n1. Analyze evidence using investigation_analyze_evidence\n2. Search evidence using investigation_search_evidence`,
        },
      ],
    };
  }

  private async handleAnalyzeEvidence(args: any) {
    const { investigation_id, analysis_type, hypothesis, confidence_threshold = 0.8 } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    // Get evidence for analysis
    const evidence = await this.database.getEvidence(investigation_id);
    if (evidence.length === 0) {
      throw new InvestigationError(
        `No evidence found for investigation: ${investigation_id}`,
        'NO_EVIDENCE_FOUND',
        investigation_id
      );
    }

    try {
      const analysisResult = await this.analysisEngine.analyze({
        investigation_id,
        analysis_type,
        hypothesis,
        evidence,
        confidence_threshold
      });

      // Store analysis result (implementation depends on your database schema)
      // await this.database.addAnalysisResult(analysisResult);

      return {
        content: [
          {
            type: 'text',
            text: `Evidence analysis completed.\n\nInvestigation ID: ${investigation_id}\nAnalysis Type: ${analysis_type}\nConfidence: ${(analysisResult.confidence * 100).toFixed(1)}%\n\nConclusions:\n${analysisResult.conclusions.map(c => `- ${c}`).join('\n')}\n\nRecommendations:\n${analysisResult.recommendations.map(r => `- ${r}`).join('\n')}\n\nNext steps:\n1. Trace causality using investigation_trace_causality\n2. Validate hypothesis using investigation_validate_hypothesis\n3. Document findings using investigation_document_findings`,
          },
        ],
      };
    } catch (error) {
      throw new AnalysisError(
        `Analysis failed: ${error}`,
        undefined,
        { investigation_id, analysis_type, error }
      );
    }
  }

  private async handleTraceCausality(args: any) {
    const { investigation_id, start_event, max_depth = 10 } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    try {
      const causalChain = await this.analysisEngine.traceCausality({
        investigation_id,
        start_event,
        max_depth
      });

      return {
        content: [
          {
            type: 'text',
            text: `Causality tracing completed.\n\nInvestigation ID: ${investigation_id}\nStart Event: ${start_event}\nMax Depth: ${max_depth}\n\nCausal Chain:\n${causalChain.map((link, index) => `${index + 1}. ${link.description} (Confidence: ${(link.confidence * 100).toFixed(1)}%)`).join('\n')}\n\nNext steps:\n1. Validate hypothesis using investigation_validate_hypothesis\n2. Document findings using investigation_document_findings`,
          },
        ],
      };
    } catch (error) {
      throw new AnalysisError(
        `Causality tracing failed: ${error}`,
        undefined,
        { investigation_id, start_event, error }
      );
    }
  }

  private async handleValidateHypothesis(args: any) {
    const { investigation_id, hypothesis, confidence_threshold = 0.8 } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    // Get evidence for validation
    const evidence = await this.database.getEvidence(investigation_id);

    try {
      const validationResult = await this.analysisEngine.validateHypothesis({
        investigation_id,
        hypothesis,
        evidence,
        confidence_threshold
      });

      return {
        content: [
          {
            type: 'text',
            text: `Hypothesis validation completed.\n\nInvestigation ID: ${investigation_id}\nHypothesis: ${hypothesis}\nConfidence: ${(validationResult.confidence * 100).toFixed(1)}%\nConclusion: ${validationResult.conclusion}\n\nReasoning:\n${validationResult.reasoning}\n\nSupporting Evidence:\n${validationResult.evidence_supporting.map(id => `- ${id}`).join('\n')}\n\nContradicting Evidence:\n${validationResult.evidence_contradicting.map(id => `- ${id}`).join('\n')}\n\nRecommendations:\n${validationResult.recommendations.map(r => `- ${r}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      throw new AnalysisError(
        `Hypothesis validation failed: ${error}`,
        undefined,
        { investigation_id, hypothesis, error }
      );
    }
  }

  private async handleDocumentFindings(args: any) {
    const { investigation_id, findings, root_causes, contributing_factors, recommendations } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    // Update investigation with findings
    await this.database.updateInvestigation(investigation_id, {
      findings,
      root_causes,
      contributing_factors,
      recommendations,
      status: 'completed',
      updated_at: new Date()
    });

    return {
      content: [
        {
          type: 'text',
          text: `Findings documented successfully.\n\nInvestigation ID: ${investigation_id}\nStatus: Completed\n\nRoot Causes:\n${root_causes.map((cause: string) => `- ${cause}`).join('\n')}\n\nContributing Factors:\n${contributing_factors?.map((factor: string) => `- ${factor}`).join('\n') || 'None identified'}\n\nRecommendations:\n${recommendations?.map((rec: string) => `- ${rec}`).join('\n') || 'None provided'}\n\nNext steps:\n1. Generate report using investigation_generate_report\n2. Archive case if investigation is complete`,
        },
      ],
    };
  }

  private async handleGenerateReport(args: any) {
    const { investigation_id, format, include_evidence = true, include_timeline = true, include_analysis = true } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    try {
      const report = await this.reportGenerator.generateReport({
        investigation,
        format,
        include_evidence,
        include_timeline,
        include_analysis
      });

      return {
        content: [
          {
            type: 'text',
            text: `Report generated successfully.\n\nInvestigation ID: ${investigation_id}\nFormat: ${format}\nFile Path: ${report.file_path || 'N/A'}\n\nReport Summary:\n${report.content.substring(0, 500)}${report.content.length > 500 ? '...' : ''}\n\nFull report available at: ${report.file_path || 'See content above'}`,
          },
        ],
      };
    } catch (error) {
      throw new InvestigationError(
        `Report generation failed: ${error}`,
        'REPORT_GENERATION_ERROR',
        investigation_id,
        { error }
      );
    }
  }

  private async handleListCases(args: any) {
    const filters = {
      status: args.status,
      category: args.category,
      severity: args.severity,
      priority: args.priority,
      assigned_to: args.assigned_to,
      date_range: args.date_range,
      limit: args.limit,
      offset: args.offset
    };

    const cases = await this.database.listInvestigations(filters);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${cases.length} investigation cases.\n\n${cases.map(c => 
            `ID: ${c.id}\nTitle: ${c.title}\nStatus: ${c.status}\nSeverity: ${c.severity}\nCategory: ${c.category}\nCreated: ${c.created_at.toISOString()}\n---`
          ).join('\n')}`,
        },
      ],
    };
  }

  private async handleGetCase(args: any) {
    const { investigation_id, include_evidence = false } = args;

    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    let evidence: EvidenceItem[] = [];
    if (include_evidence) {
      evidence = await this.database.getEvidence(investigation_id);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Investigation Case Details\n\nID: ${investigation.id}\nTitle: ${investigation.title}\nDescription: ${investigation.description}\nStatus: ${investigation.status}\nSeverity: ${investigation.severity}\nCategory: ${investigation.category}\nPriority: ${investigation.priority}\nCreated: ${investigation.created_at.toISOString()}\nUpdated: ${investigation.updated_at.toISOString()}\nReported By: ${investigation.reported_by}\nAssigned To: ${investigation.assigned_to || 'Unassigned'}\nAffected Systems: ${investigation.affected_systems.join(', ')}\n\nRoot Causes: ${investigation.root_causes.join(', ') || 'None identified'}\nContributing Factors: ${investigation.contributing_factors.join(', ') || 'None identified'}\nRecommendations: ${investigation.recommendations.join(', ') || 'None provided'}\n\nEvidence Items: ${evidence.length}\n${include_evidence ? evidence.map(e => `- ${e.type}: ${e.source}`).join('\n') : 'Use include_evidence=true to see details'}`,
        },
      ],
    };
  }

  private async handleSearchEvidence(args: any) {
    const { investigation_id, query, evidence_types, time_range, search_type = 'text' } = args;

    // Verify investigation exists
    const investigation = await this.database.getInvestigation(investigation_id);
    if (!investigation) {
      throw new InvestigationError(
        `Investigation not found: ${investigation_id}`,
        'INVESTIGATION_NOT_FOUND',
        investigation_id
      );
    }

    const evidence = await this.database.getEvidence(investigation_id);
    
    // Simple text search implementation (can be enhanced with more sophisticated search)
    const filteredEvidence = evidence.filter(e => {
      if (evidence_types && !evidence_types.includes(e.type)) return false;
      if (time_range) {
        const evidenceTime = e.created_at;
        if (evidenceTime < time_range.start || evidenceTime > time_range.end) return false;
      }
      
      // Simple text search in content
      const contentStr = JSON.stringify(e.content).toLowerCase();
      return contentStr.includes(query.toLowerCase());
    });

    return {
      content: [
        {
          type: 'text',
          text: `Evidence search completed.\n\nInvestigation ID: ${investigation_id}\nQuery: ${query}\nSearch Type: ${search_type}\nResults: ${filteredEvidence.length}\n\nMatching Evidence:\n${filteredEvidence.map(e => 
            `ID: ${e.id}\nType: ${e.type}\nSource: ${e.source}\nSize: ${e.metadata.size} bytes\nCreated: ${e.created_at.toISOString()}\n---`
          ).join('\n')}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    try {
      await this.database.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('Investigation MCP server running on stdio');
      
      // Keep the server running
      process.on('SIGINT', () => {
        console.error('Shutting down Investigation MCP server...');
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.error('Shutting down Investigation MCP server...');
        process.exit(0);
      });
      
    } catch (error) {
      console.error('Failed to start Investigation MCP server:', error);
      process.exit(1);
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--version')) {
  console.log('2.2.2');
  process.exit(0);
}

if (process.argv.includes('--config')) {
  try {
    const { EnvironmentConfigManager } = await import('./config/environment.js');
    const configManager = EnvironmentConfigManager.getInstance();
    const config = configManager.getConfig();
    
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({
      error: 'Configuration module not available',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}

if (process.argv.includes('--health')) {
  try {
    const { HealthMonitor } = await import('./utils/health-monitor.js');
    const healthMonitor = HealthMonitor.getInstance();
    const healthStatus = await healthMonitor.performHealthCheck();
    
    console.log(JSON.stringify(healthStatus, null, 2));
    process.exit(healthStatus.status === 'healthy' ? 0 : 1);
  } catch (error) {
    console.log(JSON.stringify({
      status: 'unhealthy',
      version: '2.2.2',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}

if (process.argv.includes('--storage-info')) {
  try {
    const database = new InvestigationDatabase();
    await database.initialize();
    
    const investigations = await database.listInvestigations();
    const storagePath = database.getStoragePath();
    
    console.log(JSON.stringify({
      storagePath,
      totalInvestigations: investigations.length,
      maxInvestigations: 50,
      storageType: 'JSON',
      fifoEnabled: true,
      investigations: investigations.map(inv => ({
        id: inv.id,
        title: inv.title,
        status: inv.status,
        created_at: inv.created_at,
        updated_at: inv.updated_at
      }))
    }, null, 2));
    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      storagePath: './.investigations'
    }, null, 2));
    process.exit(1);
  }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔍 Investigations MCP Tools v2.2.2
BuildWorks.AI - Forensic Investigation & Root Cause Analysis

USAGE:
  investigations [OPTIONS]

OPTIONS:
  --version, -v     Show version information
  --help, -h        Show this help message
  --config          Show current configuration
  --health          Perform health check
  --storage-info    Show storage information

DESCRIPTION:
  Investigations MCP Tools provides comprehensive forensic investigation 
  capabilities with evidence-based analysis. It integrates with Model 
  Context Protocol (MCP) to enable AI-powered investigation workflows.

FEATURES:
  📁 JSON Storage System
     • File-based storage with FIFO limit (50 investigations)
     • Automatic cleanup of old investigations
     • No SQLite dependency - pure JSON storage

  🔍 Evidence Collection
     • Filesystem scanning with pattern matching
     • System information gathering
     • Process and network data collection
     • Log file analysis
     • Configuration file collection
     • Metrics and monitoring data

  🧠 Analysis Engine
     • Timeline analysis
     • Causal analysis
     • Performance analysis
     • Security analysis
     • Correlation analysis
     • Statistical analysis

  📊 Report Generation
     • Automated investigation reports
     • Evidence summaries
     • Analysis results
     • Recommendations
     • Executive summaries

  🛡️ Security Features
     • Input validation and sanitization
     • Path traversal protection
     • XSS prevention
     • File type validation
     • Size limits and quotas

  ⚡ Performance & Reliability
     • Optimized JSON storage operations
     • FIFO-based cleanup system
     • Graceful error handling
     • Resource usage monitoring

MCP TOOLS:
  investigation_start              Start a new investigation
  investigation_collect_evidence   Collect evidence from various sources
  investigation_analyze_evidence   Analyze collected evidence
  investigation_trace_causality    Trace causal relationships
  investigation_validate_hypothesis Validate investigation hypotheses
  investigation_document_findings  Document investigation findings
  investigation_generate_report    Generate investigation reports
  investigation_list_cases         List all investigation cases
  investigation_get_case           Get specific investigation details
  investigation_search_evidence    Search through collected evidence

ENVIRONMENT VARIABLES:
  INVESTIGATIONS_STORAGE_PATH      Storage directory (default: ./.investigations)
  INVESTIGATIONS_MAX_COUNT         Max investigations (default: 50)
  NODE_ENV                         Environment: development|production (default: development)

STORAGE:
  All investigation data is stored in JSON format in the .investigations/ directory:
  .investigations/
  ├── investigations/          # Investigation cases
  │   ├── {id}.json           # Individual investigations
  │   └── index.json          # Investigation index
  ├── evidence/               # Collected evidence
  │   ├── {investigation_id}/ # Evidence per investigation
  │   └── index.json          # Evidence index
  ├── analysis/               # Analysis results
  │   ├── {investigation_id}/ # Analysis per investigation
  │   └── index.json          # Analysis index
  └── reports/                # Generated reports
      ├── {investigation_id}/ # Reports per investigation
      └── index.json          # Report index

SECURITY NOTICE:
  ⚠️  This tool collects sensitive system data and stores it locally in JSON format.
  ⚠️  Ensure you have proper authorization and follow security best practices.
  ⚠️  Add .investigations/ to your .gitignore file to prevent data exposure.
  ⚠️  See LICENSE file for complete security disclaimer and limitations.

EXAMPLES:
  # Start the MCP server
  investigations

  # Check version
  investigations --version

  # Show configuration
  investigations --config

  # Perform health check
  investigations --health

  # Show storage information
  investigations --storage-info

  # With custom storage path
  INVESTIGATIONS_STORAGE_PATH=/custom/path investigations

  # Production deployment
  NODE_ENV=production INVESTIGATIONS_LOG_LEVEL=warn investigations

DOCUMENTATION:
  • README.md              - Getting started guide
  • SETUP.md               - Installation and setup
  • PRODUCTION_READY.md    - Production deployment guide
  • examples/              - Usage examples
  • LICENSE                - License and security disclaimer

SUPPORT:
  • GitHub: https://github.com/buildworks-ai/investigations-mcp
  • Issues: https://github.com/buildworks-ai/investigations-mcp/issues
  • Documentation: https://github.com/buildworks-ai/investigations-mcp#readme

BuildWorks.AI - Professional Investigation Tools
Version 2.2.2 - JSON Storage System
`);
  process.exit(0);
}

// Start the server
const server = new InvestigationMCPServer();
server.run().catch(console.error);
