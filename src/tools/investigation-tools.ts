/**
 * Core MCP tool definitions for investigations
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
// Import types for tool definitions (currently unused but may be needed for future enhancements)
// import { 
//   InvestigationCase, 
//   EvidenceSource, 
//   InvestigationFilters, 
//   AnalysisOptions,
//   ValidationResult,
//   RootCauseAnalysis 
// } from '../types/index.js';

export const investigationStartTool: Tool = {
  name: 'investigation_start',
  description: 'Initialize a new forensic investigation case with proper metadata and tracking',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Clear, descriptive title for the investigation'
      },
      description: {
        type: 'string',
        description: 'Detailed description of the problem, symptoms, and initial observations'
      },
      severity: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Severity level based on business impact'
      },
      category: {
        type: 'string',
        enum: ['performance', 'security', 'reliability', 'configuration', 'network', 'application'],
        description: 'Primary category of the investigation'
      },
      affected_systems: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of systems, services, or components affected'
      },
      reported_by: {
        type: 'string',
        description: 'Person or system that reported the issue'
      },
      assigned_to: {
        type: 'string',
        description: 'Investigator assigned to this case (optional)'
      },
      priority: {
        type: 'string',
        enum: ['p1', 'p2', 'p3', 'p4'],
        description: 'Priority level for investigation (p1 = highest)'
      },
      initial_hypothesis: {
        type: 'string',
        description: 'Initial hypothesis or theory about the root cause (optional)'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the investigation'
      }
    },
    required: ['title', 'description', 'severity', 'category', 'reported_by']
  }
};

export const investigationCollectEvidenceTool: Tool = {
  name: 'investigation_collect_evidence',
  description: 'Collect evidence from specified sources while maintaining chain of custody',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['logs', 'config', 'metrics', 'network', 'process', 'filesystem', 'database', 'security'],
              description: 'Type of evidence to collect'
            },
            path: {
              type: 'string',
              description: 'Path or location of the evidence source'
            },
            filters: {
              type: 'object',
              description: 'Filters to apply when collecting evidence'
            },
            time_range: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' }
              },
              description: 'Time range for evidence collection'
            },
            parameters: {
              type: 'object',
              description: 'Additional parameters for evidence collection'
            }
          },
          required: ['type']
        },
        description: 'List of evidence sources to collect from'
      },
      preserve_chain_of_custody: {
        type: 'boolean',
        default: true,
        description: 'Whether to maintain detailed chain of custody records'
      },
      parallel_collection: {
        type: 'boolean',
        default: true,
        description: 'Whether to collect evidence in parallel for efficiency'
      }
    },
    required: ['investigation_id', 'sources']
  }
};

export const investigationAnalyzeEvidenceTool: Tool = {
  name: 'investigation_analyze_evidence',
  description: 'Perform systematic analysis of collected evidence using forensic methodology',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      analysis_type: {
        type: 'string',
        enum: ['timeline', 'causal', 'performance', 'security', 'correlation', 'statistical'],
        description: 'Type of analysis to perform'
      },
      hypothesis: {
        type: 'string',
        description: 'Initial hypothesis to test against evidence'
      },
      correlation_rules: {
        type: 'array',
        items: { type: 'string' },
        description: 'Custom correlation rules for analysis'
      },
      confidence_threshold: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.8,
        description: 'Minimum confidence threshold for conclusions'
      },
      max_depth: {
        type: 'number',
        default: 10,
        description: 'Maximum depth for causal analysis'
      },
      include_contributing_factors: {
        type: 'boolean',
        default: true,
        description: 'Whether to include contributing factors in analysis'
      },
      time_window: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        },
        description: 'Time window for analysis focus'
      }
    },
    required: ['investigation_id', 'analysis_type']
  }
};

export const investigationTraceCausalityTool: Tool = {
  name: 'investigation_trace_causality',
  description: 'Trace causal relationships between events to identify root causes',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      start_event: {
        type: 'string',
        description: 'Event ID or description to start tracing from'
      },
      max_depth: {
        type: 'number',
        default: 10,
        description: 'Maximum depth for causal tracing'
      },
      include_contributing_factors: {
        type: 'boolean',
        default: true,
        description: 'Whether to include contributing factors'
      },
      relationship_types: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['direct', 'contributing', 'correlated']
        },
        default: ['direct', 'contributing'],
        description: 'Types of relationships to trace'
      },
      confidence_threshold: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.7,
        description: 'Minimum confidence for causal relationships'
      }
    },
    required: ['investigation_id', 'start_event']
  }
};

export const investigationValidateHypothesisTool: Tool = {
  name: 'investigation_validate_hypothesis',
  description: 'Validate hypothesis against collected evidence with confidence scoring',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      hypothesis: {
        type: 'string',
        description: 'Hypothesis to validate against evidence'
      },
      confidence_threshold: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.8,
        description: 'Minimum confidence threshold for validation'
      },
      require_evidence: {
        type: 'boolean',
        default: true,
        description: 'Whether evidence is required for validation'
      },
      evidence_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific evidence types to consider'
      },
      validation_method: {
        type: 'string',
        enum: ['statistical', 'logical', 'temporal', 'correlational'],
        default: 'logical',
        description: 'Method for hypothesis validation'
      }
    },
    required: ['investigation_id', 'hypothesis']
  }
};

export const investigationDocumentFindingsTool: Tool = {
  name: 'investigation_document_findings',
  description: 'Document investigation findings, root causes, and recommendations',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            evidence_ids: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['title', 'description', 'severity', 'evidence_ids', 'confidence']
        },
        description: 'List of findings from the investigation'
      },
      root_causes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Identified root causes'
      },
      contributing_factors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Contributing factors to the issue'
      },
      impact_assessment: {
        type: 'object',
        properties: {
          scope: { type: 'string' },
          severity: { type: 'string' },
          duration: { type: 'string' },
          affected_systems: { type: 'array', items: { type: 'string' } }
        },
        description: 'Assessment of the impact'
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Recommendations for resolution and prevention'
      },
      lessons_learned: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lessons learned from the investigation'
      }
    },
    required: ['investigation_id', 'findings', 'root_causes']
  }
};

export const investigationGenerateReportTool: Tool = {
  name: 'investigation_generate_report',
  description: 'Generate comprehensive investigation report in specified format',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown', 'pdf', 'html'],
        description: 'Output format for the report'
      },
      include_evidence: {
        type: 'boolean',
        default: true,
        description: 'Whether to include evidence details'
      },
      include_timeline: {
        type: 'boolean',
        default: true,
        description: 'Whether to include timeline analysis'
      },
      include_analysis: {
        type: 'boolean',
        default: true,
        description: 'Whether to include analysis results'
      },
      include_recommendations: {
        type: 'boolean',
        default: true,
        description: 'Whether to include recommendations'
      },
      template: {
        type: 'string',
        description: 'Custom template for report generation'
      },
      output_path: {
        type: 'string',
        description: 'Path to save the generated report'
      }
    },
    required: ['investigation_id', 'format']
  }
};

export const investigationListCasesTool: Tool = {
  name: 'investigation_list_cases',
  description: 'List investigation cases with filtering and sorting options',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['active', 'completed', 'archived'],
        description: 'Filter by investigation status'
      },
      category: {
        type: 'string',
        description: 'Filter by investigation category'
      },
      severity: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filter by severity level'
      },
      priority: {
        type: 'string',
        enum: ['p1', 'p2', 'p3', 'p4'],
        description: 'Filter by priority level'
      },
      assigned_to: {
        type: 'string',
        description: 'Filter by assigned investigator'
      },
      date_range: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        },
        description: 'Filter by date range'
      },
      limit: {
        type: 'number',
        default: 50,
        description: 'Maximum number of cases to return'
      },
      offset: {
        type: 'number',
        default: 0,
        description: 'Number of cases to skip'
      },
      sort_by: {
        type: 'string',
        enum: ['created_at', 'updated_at', 'severity', 'priority'],
        default: 'created_at',
        description: 'Field to sort by'
      },
      sort_order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order'
      }
    }
  }
};

export const investigationGetCaseTool: Tool = {
  name: 'investigation_get_case',
  description: 'Get detailed information about a specific investigation case',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      include_evidence: {
        type: 'boolean',
        default: false,
        description: 'Whether to include evidence details'
      },
      include_analysis: {
        type: 'boolean',
        default: true,
        description: 'Whether to include analysis results'
      },
      include_timeline: {
        type: 'boolean',
        default: true,
        description: 'Whether to include timeline events'
      },
      include_reports: {
        type: 'boolean',
        default: false,
        description: 'Whether to include generated reports'
      }
    },
    required: ['investigation_id']
  }
};

export const investigationSearchEvidenceTool: Tool = {
  name: 'investigation_search_evidence',
  description: 'Search through collected evidence using various criteria',
  inputSchema: {
    type: 'object',
    properties: {
      investigation_id: {
        type: 'string',
        description: 'ID of the investigation case'
      },
      query: {
        type: 'string',
        description: 'Search query (text, regex, or structured query)'
      },
      evidence_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by evidence types'
      },
      time_range: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        },
        description: 'Filter by time range'
      },
      filters: {
        type: 'object',
        description: 'Additional filters for evidence search'
      },
      search_type: {
        type: 'string',
        enum: ['text', 'regex', 'structured', 'semantic'],
        default: 'text',
        description: 'Type of search to perform'
      },
      limit: {
        type: 'number',
        default: 100,
        description: 'Maximum number of results to return'
      }
    },
    required: ['investigation_id', 'query']
  }
};

// Export all tools as an array
export const investigationTools: Tool[] = [
  investigationStartTool,
  investigationCollectEvidenceTool,
  investigationAnalyzeEvidenceTool,
  investigationTraceCausalityTool,
  investigationValidateHypothesisTool,
  investigationDocumentFindingsTool,
  investigationGenerateReportTool,
  investigationListCasesTool,
  investigationGetCaseTool,
  investigationSearchEvidenceTool
];
