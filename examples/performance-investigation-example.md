# Performance Investigation Example

This example demonstrates how to use the Investigations MCP tools to investigate a performance issue with the new JSON storage system.

## Scenario
An API service is experiencing intermittent performance issues with response times spiking from 100ms to 5+ seconds.

## Storage System
This investigation uses the new JSON-based file storage system with automatic FIFO management (max 50 investigations). All data is stored in `./.investigations/` directory.

## Investigation Workflow

### 1. Start Investigation
```bash
investigation_start \
  --title "API Performance Degradation" \
  --description "Response times increased from 100ms to 5+ seconds intermittently" \
  --severity high \
  --category performance \
  --reported-by "monitoring-system" \
  --affected-systems "api-gateway,user-service,database"
```

### 2. Collect Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_001" \
  --sources '[
    {
      "type": "logs",
      "path": "/var/log/api-gateway/access.log",
      "time_range": {
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T16:00:00Z"
      }
    },
    {
      "type": "metrics",
      "parameters": {
        "metrics": ["cpu", "memory", "disk", "network"]
      }
    }
  ]'
```

### 3. Analyze Evidence
```bash
investigation_analyze_evidence \
  --investigation-id "inv_001" \
  --analysis-type timeline \
  --hypothesis "Database connection pool exhaustion"
```

### 4. Trace Causality
```bash
investigation_trace_causality \
  --investigation-id "inv_001" \
  --start-event "High response times" \
  --max-depth 5
```

### 5. Validate Hypothesis
```bash
investigation_validate_hypothesis \
  --investigation-id "inv_001" \
  --hypothesis "Connection pool size too small" \
  --confidence-threshold 0.8
```

### 6. Document Findings
```bash
investigation_document_findings \
  --investigation-id "inv_001" \
  --root-causes '["Insufficient database connection pool size"]' \
  --recommendations '["Increase pool size to 50 connections"]'
```

### 7. Generate Report
```bash
investigation_generate_report \
  --investigation-id "inv_001" \
  --format markdown \
  --include-evidence true
```

## Expected Results
- Root cause identified: Database connection pool exhaustion
- Confidence level: 91.2%
- Recommendations provided for resolution
- Comprehensive forensic report generated

## Storage Benefits
- **Automatic Cleanup**: Old investigations automatically removed when limit exceeded
- **Human Readable**: JSON files can be inspected manually in `./.investigations/`
- **No Database Setup**: No SQLite or database configuration required
- **Portable**: Easy to backup, move, or version control
- **Atomic Operations**: File-based operations are naturally atomic
