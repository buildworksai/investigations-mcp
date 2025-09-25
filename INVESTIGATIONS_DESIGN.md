# Investigations MCP Tools - Design Specification

## Overview
A comprehensive MCP tool suite for forensic investigations that performs thorough root cause analysis following scientific methodology and evidence-based approaches.

## Core Philosophy
- **Evidence-based analysis**: No assumptions without proof
- **Systematic root cause tracing**: Causal chain analysis
- **Comprehensive documentation**: Audit trails and reproducibility
- **Compliance-ready reporting**: Immutable evidence storage

## Architecture Components

### 1. Investigation Management Layer
- Case initialization and tracking
- Evidence collection orchestration
- Analysis workflow management
- Report generation and audit trails

### 2. Evidence Collection Layer
- Log file analysis
- Configuration inspection
- System state capture
- Network analysis
- Performance metrics
- Security scanning

### 3. Analysis Engine
- Timeline reconstruction
- Causal relationship mapping
- Hypothesis generation and validation
- Root cause identification
- Impact assessment

### 4. Data Storage Layer
- Immutable evidence storage
- Investigation case management
- Analysis results persistence
- Audit trail maintenance

## Core MCP Tools

### Investigation Lifecycle Tools

#### `investigation_start`
Initialize a new investigation case
```typescript
{
  "name": "investigation_start",
  "description": "Initialize a new forensic investigation case",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {"type": "string", "description": "Investigation title"},
      "description": {"type": "string", "description": "Problem description"},
      "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
      "category": {"type": "string", "enum": ["performance", "security", "reliability", "configuration"]},
      "affected_systems": {"type": "array", "items": {"type": "string"}},
      "reported_by": {"type": "string"},
      "priority": {"type": "string", "enum": ["p1", "p2", "p3", "p4"]}
    },
    "required": ["title", "description", "severity", "category"]
  }
}
```

#### `investigation_collect_evidence`
Gather evidence from various sources
```typescript
{
  "name": "investigation_collect_evidence",
  "description": "Collect evidence from specified sources",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "sources": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": {"type": "string", "enum": ["logs", "config", "metrics", "network", "process", "filesystem"]},
            "path": {"type": "string"},
            "filters": {"type": "object"},
            "time_range": {"type": "object"}
          }
        }
      },
      "preserve_chain_of_custody": {"type": "boolean", "default": true}
    },
    "required": ["investigation_id", "sources"]
  }
}
```

#### `investigation_analyze_evidence`
Perform systematic analysis of collected evidence
```typescript
{
  "name": "investigation_analyze_evidence",
  "description": "Analyze collected evidence using forensic methodology",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "analysis_type": {"type": "string", "enum": ["timeline", "causal", "performance", "security"]},
      "hypothesis": {"type": "string", "description": "Initial hypothesis to test"},
      "correlation_rules": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["investigation_id", "analysis_type"]
  }
}
```

#### `investigation_trace_causality`
Map cause-effect relationships
```typescript
{
  "name": "investigation_trace_causality",
  "description": "Trace causal relationships between events",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "start_event": {"type": "string"},
      "max_depth": {"type": "number", "default": 10},
      "include_contributing_factors": {"type": "boolean", "default": true}
    },
    "required": ["investigation_id", "start_event"]
  }
}
```

#### `investigation_validate_hypothesis`
Test theories against evidence
```typescript
{
  "name": "investigation_validate_hypothesis",
  "description": "Validate hypothesis against collected evidence",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "hypothesis": {"type": "string"},
      "confidence_threshold": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.8},
      "require_evidence": {"type": "boolean", "default": true}
    },
    "required": ["investigation_id", "hypothesis"]
  }
}
```

#### `investigation_document_findings`
Create comprehensive audit trail
```typescript
{
  "name": "investigation_document_findings",
  "description": "Document investigation findings and evidence",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "findings": {"type": "array", "items": {"type": "object"}},
      "root_causes": {"type": "array", "items": {"type": "string"}},
      "contributing_factors": {"type": "array", "items": {"type": "string"}},
      "impact_assessment": {"type": "object"},
      "recommendations": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["investigation_id", "findings", "root_causes"]
  }
}
```

#### `investigation_generate_report`
Generate final forensic report
```typescript
{
  "name": "investigation_generate_report",
  "description": "Generate comprehensive investigation report",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "format": {"type": "string", "enum": ["json", "markdown", "pdf", "html"]},
      "include_evidence": {"type": "boolean", "default": true},
      "include_timeline": {"type": "boolean", "default": true},
      "include_analysis": {"type": "boolean", "default": true}
    },
    "required": ["investigation_id", "format"]
  }
}
```

### Supporting Tools

#### `investigation_list_cases`
List all investigation cases
```typescript
{
  "name": "investigation_list_cases",
  "description": "List all investigation cases with filtering options",
  "parameters": {
    "type": "object",
    "properties": {
      "status": {"type": "string", "enum": ["active", "completed", "archived"]},
      "category": {"type": "string"},
      "severity": {"type": "string"},
      "date_range": {"type": "object"}
    }
  }
}
```

#### `investigation_get_case`
Get detailed information about a specific case
```typescript
{
  "name": "investigation_get_case",
  "description": "Get detailed information about an investigation case",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "include_evidence": {"type": "boolean", "default": false},
      "include_analysis": {"type": "boolean", "default": true}
    },
    "required": ["investigation_id"]
  }
}
```

#### `investigation_search_evidence`
Search through collected evidence
```typescript
{
  "name": "investigation_search_evidence",
  "description": "Search through collected evidence using various criteria",
  "parameters": {
    "type": "object",
    "properties": {
      "investigation_id": {"type": "string"},
      "query": {"type": "string"},
      "evidence_types": {"type": "array", "items": {"type": "string"}},
      "time_range": {"type": "object"},
      "filters": {"type": "object"}
    },
    "required": ["investigation_id", "query"]
  }
}
```

## Data Models

### Investigation Case
```typescript
interface InvestigationCase {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'reliability' | 'configuration';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  created_at: Date;
  updated_at: Date;
  reported_by: string;
  assigned_to?: string;
  affected_systems: string[];
  evidence: EvidenceItem[];
  analysis_results: AnalysisResult[];
  findings: Finding[];
  root_causes: string[];
  recommendations: string[];
}
```

### Evidence Item
```typescript
interface EvidenceItem {
  id: string;
  investigation_id: string;
  type: 'log' | 'config' | 'metric' | 'network' | 'process' | 'filesystem';
  source: string;
  path?: string;
  content: any;
  metadata: {
    timestamp: Date;
    size: number;
    checksum: string;
    collected_by: string;
    collection_method: string;
  };
  chain_of_custody: CustodyEntry[];
}
```

### Analysis Result
```typescript
interface AnalysisResult {
  id: string;
  investigation_id: string;
  type: 'timeline' | 'causal' | 'performance' | 'security';
  hypothesis?: string;
  confidence: number;
  evidence_supporting: string[];
  evidence_contradicting: string[];
  conclusions: string[];
  recommendations: string[];
  created_at: Date;
}
```

## Implementation Phases

### Phase 1: Core Framework (Weeks 1-2)
- Basic investigation case management
- Simple evidence collection (logs, configs)
- Basic analysis and reporting
- SQLite database setup

### Phase 2: Advanced Analysis (Weeks 3-4)
- Timeline reconstruction
- Causal analysis engine
- Hypothesis validation
- Multi-source evidence correlation

### Phase 3: Specialized Tools (Weeks 5-6)
- Performance analysis tools
- Security forensics
- Infrastructure inspection
- Custom evidence collectors

### Phase 4: Integration & Polish (Weeks 7-8)
- Advanced reporting formats
- Visualization tools
- API integrations
- Documentation and testing

## Example Investigation Workflow

1. **Initialize Investigation**
   ```bash
   investigation_start --title "API Performance Degradation" --severity high --category performance
   ```

2. **Collect Evidence**
   ```bash
   investigation_collect_evidence --sources logs,metrics,config --time-range "2024-01-01 to 2024-01-02"
   ```

3. **Analyze Evidence**
   ```bash
   investigation_analyze_evidence --type timeline --hypothesis "Database connection pool exhaustion"
   ```

4. **Trace Causality**
   ```bash
   investigation_trace_causality --start-event "High response times" --max-depth 5
   ```

5. **Validate Hypothesis**
   ```bash
   investigation_validate_hypothesis --hypothesis "Connection pool size too small" --confidence-threshold 0.9
   ```

6. **Document Findings**
   ```bash
   investigation_document_findings --root-causes "Insufficient connection pool size" --recommendations "Increase pool size to 50"
   ```

7. **Generate Report**
   ```bash
   investigation_generate_report --format markdown --include-evidence --include-timeline
   ```

## Best Practices

### Forensic Methodology
1. **Preserve Evidence**: Never modify original evidence
2. **Document Everything**: Maintain complete audit trail
3. **Test Hypotheses**: Validate theories against evidence
4. **Avoid Assumptions**: Base conclusions on facts only
5. **Chain of Custody**: Track evidence handling

### Compliance Considerations
- Immutable evidence storage
- Audit trail for all actions
- Reproducible investigations
- Secure access controls
- Data retention policies

### Performance Considerations
- Efficient evidence collection
- Parallel analysis where possible
- Caching of analysis results
- Incremental updates
- Resource usage monitoring

This design provides a comprehensive foundation for building forensic investigation tools that meet your requirements for thorough, evidence-based root cause analysis.
