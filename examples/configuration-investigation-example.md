# Configuration Investigation Example

This example demonstrates how to use the Investigations MCP tools to investigate configuration drift issues with the new JSON storage system.

## Scenario
Application behavior changed unexpectedly. Suspected configuration drift or deployment issue.

## Storage System
This investigation uses the new JSON-based file storage system with automatic FIFO management (max 50 investigations). All data is stored in `./.investigations-mcp/` directory.

## Investigation Workflow

### 1. Start Configuration Investigation
```bash
investigation_start \
  --title "Unexpected Application Behavior" \
  --description "Application started returning different responses without deployment" \
  --severity medium \
  --category configuration \
  --reported-by "qa-team" \
  --affected-systems "app-service,config-service"
```

### 2. Collect Configuration Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_003" \
  --sources '[
    {
      "type": "config",
      "path": "/etc/app/config.yaml"
    },
    {
      "type": "config",
      "path": "/etc/app/environment"
    },
    {
      "type": "filesystem",
      "path": "/etc/app",
      "parameters": {
        "include_hidden": true,
        "check_permissions": true
      }
    }
  ]'
```

### 3. Perform Configuration Analysis
```bash
investigation_analyze_evidence \
  --investigation-id "inv_003" \
  --analysis-type correlation \
  --hypothesis "Configuration file changed without proper deployment"
```

### 4. Generate Configuration Report
```bash
investigation_generate_report \
  --investigation-id "inv_003" \
  --format json \
  --include-evidence true
```

## Expected Results
- Configuration drift identified
- Timeline of configuration changes
- Root cause analysis completed
- Configuration management recommendations provided

## Storage Benefits
- **Automatic Cleanup**: Old investigations automatically removed when limit exceeded
- **Human Readable**: JSON files can be inspected manually in `./.investigations-mcp/`
- **No Database Setup**: No SQLite or database configuration required
- **Portable**: Easy to backup, move, or version control
- **Atomic Operations**: File-based operations are naturally atomic
