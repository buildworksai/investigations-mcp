# Security Investigation Example

This example demonstrates how to use the Investigations MCP tools to investigate a security incident with the new JSON storage system.

## Scenario
Suspicious login attempts detected from multiple IP addresses. Need to investigate potential security breach.

## Storage System
This investigation uses the new JSON-based file storage system with automatic FIFO management (max 50 investigations). All data is stored in `./.investigations/` directory.

## Investigation Workflow

### 1. Start Security Investigation
```bash
investigation_start \
  --title "Suspicious Login Attempts" \
  --description "Multiple failed login attempts from 15+ IP addresses" \
  --severity critical \
  --category security \
  --reported-by "security-monitoring" \
  --affected-systems "auth-service,user-database"
```

### 2. Collect Security Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_002" \
  --sources '[
    {
      "type": "security",
      "parameters": {
        "collect_users": true,
        "collect_permissions": true,
        "collect_security_logs": true
      }
    },
    {
      "type": "logs",
      "path": "/var/log/auth.log",
      "filters": {
        "event_type": "failed_login"
      }
    }
  ]'
```

### 3. Perform Security Analysis
```bash
investigation_analyze_evidence \
  --investigation-id "inv_002" \
  --analysis-type security \
  --hypothesis "Coordinated brute force attack"
```

### 4. Generate Security Report
```bash
investigation_generate_report \
  --investigation-id "inv_002" \
  --format html \
  --include-evidence true \
  --include-timeline true
```

## Expected Results
- Attack pattern identified: Coordinated brute force attack
- Timeline of attack events reconstructed
- Security recommendations provided
- Detailed security report generated

## Storage Benefits
- **Automatic Cleanup**: Old investigations automatically removed when limit exceeded
- **Human Readable**: JSON files can be inspected manually in `./.investigations/`
- **No Database Setup**: No SQLite or database configuration required
- **Portable**: Easy to backup, move, or version control
- **Atomic Operations**: File-based operations are naturally atomic
