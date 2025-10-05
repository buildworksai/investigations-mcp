# Investigations MCP Tools - Example Usage

## Overview
This document provides comprehensive examples of how to use the Investigations MCP tools for various forensic investigation scenarios. Each example demonstrates the complete workflow from problem identification to root cause analysis and reporting.

## Storage System (v2.2.2)
The Investigations MCP Tools now use a JSON-based file storage system with the following features:
- **Location**: All data stored in `./.investigations/` directory
- **FIFO Management**: Automatic cleanup of old investigations (max 50)
- **Human Readable**: JSON files can be inspected manually
- **No Database Setup**: No SQLite or database configuration required
- **Portable**: Easy to backup, move, or version control
- **Atomic Operations**: File-based operations are naturally atomic

## ⚠️ Security Notice
**IMPORTANT**: This software collects sensitive system data and stores it locally in JSON format without encryption. Ensure you have proper authorization to investigate target systems and follow security best practices. See the full security disclaimer in README.md and LICENSE files.

### Storage Folder Management
- **Storage Location**: All investigation data is stored in `./.investigations/` directory
- **User Responsibility**: You are responsible for managing this folder
- **Git Ignore**: **CRITICAL**: Add `.investigations/` to your `.gitignore` file to prevent committing sensitive data
- **Cleanup**: Manually delete the folder when no longer needed

## Example 1: API Performance Degradation Investigation

### Scenario
An API service is experiencing intermittent performance issues with response times spiking from 100ms to 5+ seconds. Users are reporting timeouts and errors.

### Investigation Workflow

#### Step 1: Initialize Investigation
```bash
# Start a new investigation
investigation_start \
  --title "API Performance Degradation - Production" \
  --description "API response times increased from 100ms to 5+ seconds intermittently. Users reporting timeouts and 500 errors. Started around 2024-01-15 14:30 UTC." \
  --severity high \
  --category performance \
  --priority p2 \
  --reported-by "monitoring-system" \
  --assigned-to "sre-team" \
  --affected-systems "api-gateway,user-service,database" \
  --initial-hypothesis "Database connection pool exhaustion or slow queries"
```

**Expected Output:**
```
Investigation started successfully.

ID: inv_20240115_001
Title: API Performance Degradation - Production
Status: Active
Severity: High
Category: Performance

Next steps:
1. Collect evidence using investigation_collect_evidence
2. Analyze evidence using investigation_analyze_evidence
3. Document findings using investigation_document_findings
```

#### Step 2: Collect Evidence
```bash
# Collect comprehensive evidence
investigation_collect_evidence \
  --investigation-id "inv_20240115_001" \
  --sources '[
    {
      "type": "logs",
      "path": "/var/log/api-gateway/access.log",
      "time_range": {
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T16:00:00Z"
      },
      "filters": {
        "response_time": ">1000",
        "status_code": "5xx"
      }
    },
    {
      "type": "logs",
      "path": "/var/log/user-service/app.log",
      "time_range": {
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T16:00:00Z"
      }
    },
    {
      "type": "metrics",
      "parameters": {
        "metrics": ["cpu", "memory", "disk", "network"],
        "time_range": {
          "start": "2024-01-15T14:00:00Z",
          "end": "2024-01-15T16:00:00Z"
        }
      }
    },
    {
      "type": "database",
      "parameters": {
        "database_type": "postgresql",
        "connection_info": {
          "host": "db-primary",
          "database": "user_service"
        },
        "queries": [
          "SELECT * FROM pg_stat_activity WHERE state = 'active'",
          "SELECT * FROM pg_stat_database WHERE datname = 'user_service'"
        ]
      }
    }
  ]' \
  --preserve-chain-of-custody true
```

**Expected Output:**
```
Evidence collection completed.

Investigation ID: inv_20240115_001
Sources collected: 4
Evidence items: 4

Collected evidence:
- log: /var/log/api-gateway/access.log (2.3MB)
- log: /var/log/user-service/app.log (1.8MB)
- metric: system_metrics (156KB)
- database: database_info (45KB)

Next steps:
1. Analyze evidence using investigation_analyze_evidence
2. Search evidence using investigation_search_evidence
```

#### Step 3: Analyze Evidence
```bash
# Perform timeline analysis
investigation_analyze_evidence \
  --investigation-id "inv_20240115_001" \
  --analysis-type timeline \
  --hypothesis "Database connection pool exhaustion causing performance degradation" \
  --confidence-threshold 0.8

# Perform performance analysis
investigation_analyze_evidence \
  --investigation-id "inv_20240115_001" \
  --analysis-type performance \
  --hypothesis "High database query response times" \
  --confidence-threshold 0.8
```

**Expected Output:**
```
Evidence analysis completed.

Investigation ID: inv_20240115_001
Analysis Type: timeline
Confidence: 87.5%

Conclusions:
- Timeline shows performance degradation starting at 14:32:15 UTC
- First error occurred at 14:32:18 UTC with 5xx status code
- Database connection pool reached maximum at 14:32:20 UTC
- Performance issues correlate with high database query times

Recommendations:
- Review database connection pool configuration
- Investigate slow queries identified in logs
- Monitor database connection usage patterns

Next steps:
1. Trace causality using investigation_trace_causality
2. Validate hypothesis using investigation_validate_hypothesis
3. Document findings using investigation_document_findings
```

#### Step 4: Trace Causality
```bash
# Trace causal relationships
investigation_trace_causality \
  --investigation-id "inv_20240115_001" \
  --start-event "High response times at 14:32:15" \
  --max-depth 5 \
  --include-contributing-factors true \
  --confidence-threshold 0.7
```

**Expected Output:**
```
Causality tracing completed.

Investigation ID: inv_20240115_001
Start Event: High response times at 14:32:15
Max Depth: 5

Causal Chain:
1. Database connection pool exhaustion (Confidence: 95.0%)
2. Slow query execution due to connection wait (Confidence: 88.0%)
3. API request queuing and timeout (Confidence: 92.0%)
4. User experience degradation (Confidence: 98.0%)
5. Error rate increase (Confidence: 85.0%)

Next steps:
1. Validate hypothesis using investigation_validate_hypothesis
2. Document findings using investigation_document_findings
```

#### Step 5: Validate Hypothesis
```bash
# Validate the root cause hypothesis
investigation_validate_hypothesis \
  --investigation-id "inv_20240115_001" \
  --hypothesis "Database connection pool size insufficient for current load" \
  --confidence-threshold 0.8 \
  --validation-method logical
```

**Expected Output:**
```
Hypothesis validation completed.

Investigation ID: inv_20240115_001
Hypothesis: Database connection pool size insufficient for current load
Confidence: 91.2%
Conclusion: supported

Reasoning:
- Evidence shows connection pool reaching maximum capacity
- Timeline correlates connection pool exhaustion with performance issues
- Database metrics show increased connection wait times
- No other resource constraints identified

Supporting Evidence:
- ev_001: Database connection pool metrics
- ev_002: API gateway access logs
- ev_003: System performance metrics

Contradicting Evidence:
- None identified

Recommendations:
- Increase database connection pool size from 20 to 50
- Implement connection pool monitoring
- Add circuit breaker for database connections
```

#### Step 6: Document Findings
```bash
# Document investigation findings
investigation_document_findings \
  --investigation-id "inv_20240115_001" \
  --findings '[
    {
      "title": "Database Connection Pool Exhaustion",
      "description": "Connection pool reached maximum capacity (20 connections) during peak load, causing request queuing and timeouts.",
      "severity": "high",
      "evidence_ids": ["ev_001", "ev_002"],
      "confidence": 0.95
    },
    {
      "title": "Slow Query Performance",
      "description": "Database queries taking 2-5 seconds due to connection wait times and resource contention.",
      "severity": "medium",
      "evidence_ids": ["ev_001", "ev_003"],
      "confidence": 0.88
    }
  ]' \
  --root-causes '[
    "Insufficient database connection pool size (20 connections) for current application load",
    "Lack of connection pool monitoring and alerting"
  ]' \
  --contributing-factors '[
    "Increased user traffic during peak hours",
    "Long-running database transactions",
    "No connection pool health checks"
  ]' \
  --recommendations '[
    "Increase database connection pool size to 50 connections",
    "Implement connection pool monitoring with alerts",
    "Add connection pool health checks",
    "Optimize long-running database queries",
    "Implement circuit breaker pattern for database connections"
  ]'
```

**Expected Output:**
```
Findings documented successfully.

Investigation ID: inv_20240115_001
Status: Completed

Root Causes:
- Insufficient database connection pool size (20 connections) for current application load
- Lack of connection pool monitoring and alerting

Contributing Factors:
- Increased user traffic during peak hours
- Long-running database transactions
- No connection pool health checks

Recommendations:
- Increase database connection pool size to 50 connections
- Implement connection pool monitoring with alerts
- Add connection pool health checks
- Optimize long-running database queries
- Implement circuit breaker pattern for database connections

Next steps:
1. Generate report using investigation_generate_report
2. Archive case if investigation is complete
```

#### Step 7: Generate Report
```bash
# Generate comprehensive report
investigation_generate_report \
  --investigation-id "inv_20240115_001" \
  --format markdown \
  --include-evidence true \
  --include-timeline true \
  --include-analysis true \
  --include-recommendations true
```

**Expected Output:**
```
Report generated successfully.

Investigation ID: inv_20240115_001
Format: markdown
File Path: ./reports/inv_20240115_001_report_1705334400000.md

Report Summary:
# Investigation Report: API Performance Degradation - Production

**Investigation ID:** inv_20240115_001
**Status:** completed
**Severity:** high
**Category:** performance
**Priority:** p2
**Created:** 2024-01-15T14:30:00.000Z
**Updated:** 2024-01-15T16:45:00.000Z
**Reported By:** monitoring-system
**Assigned To:** sre-team

## Executive Summary

API response times increased from 100ms to 5+ seconds intermittently. Users reporting timeouts and 500 errors. Started around 2024-01-15 14:30 UTC.

## Root Causes
1. Insufficient database connection pool size (20 connections) for current application load
2. Lack of connection pool monitoring and alerting

## Recommendations
1. Increase database connection pool size to 50 connections
2. Implement connection pool monitoring with alerts
3. Add connection pool health checks
4. Optimize long-running database queries
5. Implement circuit breaker pattern for database connections

Full report available at: ./reports/inv_20240115_001_report_1705334400000.md
```

## Example 2: Security Incident Investigation

### Scenario
Suspicious login attempts detected from multiple IP addresses. Need to investigate potential security breach.

### Investigation Workflow

#### Step 1: Initialize Security Investigation
```bash
investigation_start \
  --title "Suspicious Login Attempts - Security Incident" \
  --description "Multiple failed login attempts detected from 15+ IP addresses within 2-hour window. Pattern suggests coordinated attack." \
  --severity critical \
  --category security \
  --priority p1 \
  --reported-by "security-monitoring" \
  --assigned-to "security-team" \
  --affected-systems "auth-service,user-database,api-gateway" \
  --initial-hypothesis "Coordinated brute force attack or credential stuffing"
```

#### Step 2: Collect Security Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_20240115_002" \
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
      "time_range": {
        "start": "2024-01-15T12:00:00Z",
        "end": "2024-01-15T14:00:00Z"
      },
      "filters": {
        "event_type": "failed_login"
      }
    },
    {
      "type": "network",
      "parameters": {
        "collect_connections": true,
        "collect_interfaces": true,
        "time_range": {
          "start": "2024-01-15T12:00:00Z",
          "end": "2024-01-15T14:00:00Z"
        }
      }
    }
  ]'
```

#### Step 3: Perform Security Analysis
```bash
investigation_analyze_evidence \
  --investigation-id "inv_20240115_002" \
  --analysis-type security \
  --hypothesis "Coordinated brute force attack from multiple IP addresses" \
  --confidence-threshold 0.9
```

#### Step 4: Generate Security Report
```bash
investigation_generate_report \
  --investigation-id "inv_20240115_002" \
  --format html \
  --include-evidence true \
  --include-timeline true \
  --include-analysis true
```

## Example 3: Configuration Drift Investigation

### Scenario
Application behavior changed unexpectedly. Suspected configuration drift or deployment issue.

### Investigation Workflow

#### Step 1: Initialize Configuration Investigation
```bash
investigation_start \
  --title "Unexpected Application Behavior - Configuration Drift" \
  --description "Application started returning different responses without deployment. Suspected configuration change or environment drift." \
  --severity medium \
  --category configuration \
  --priority p3 \
  --reported-by "qa-team" \
  --assigned-to "devops-team" \
  --affected-systems "app-service,config-service,load-balancer" \
  --initial-hypothesis "Configuration drift or environment variable change"
```

#### Step 2: Collect Configuration Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_20240115_003" \
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
      "type": "config",
      "path": "/etc/nginx/nginx.conf"
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

#### Step 3: Perform Configuration Analysis
```bash
investigation_analyze_evidence \
  --investigation-id "inv_20240115_003" \
  --analysis-type correlation \
  --hypothesis "Configuration file changed without proper deployment process" \
  --correlation-rules '[
    "config_file_modification_time",
    "application_behavior_change_time",
    "deployment_timeline"
  ]'
```

## Example 4: Network Connectivity Investigation

### Scenario
Intermittent network connectivity issues between services. Need to identify root cause.

### Investigation Workflow

#### Step 1: Initialize Network Investigation
```bash
investigation_start \
  --title "Intermittent Network Connectivity Issues" \
  --description "Services experiencing intermittent connection failures. Network timeouts and connection refused errors." \
  --severity high \
  --category network \
  --priority p2 \
  --reported-by "service-mesh" \
  --assigned-to "network-team" \
  --affected-systems "service-a,service-b,load-balancer,dns" \
  --initial-hypothesis "Network infrastructure issue or DNS resolution problems"
```

#### Step 2: Collect Network Evidence
```bash
investigation_collect_evidence \
  --investigation-id "inv_20240115_004" \
  --sources '[
    {
      "type": "network",
      "parameters": {
        "collect_connections": true,
        "collect_interfaces": true,
        "collect_routing": true
      }
    },
    {
      "type": "logs",
      "path": "/var/log/nginx/error.log",
      "filters": {
        "error_type": "connection_refused"
      }
    },
    {
      "type": "process",
      "parameters": {
        "process_names": ["nginx", "haproxy", "consul"]
      }
    }
  ]'
```

## Best Practices

### Evidence Collection
1. **Collect Early**: Gather evidence as soon as possible to prevent data loss
2. **Preserve Chain of Custody**: Always maintain detailed audit trails
3. **Multiple Sources**: Collect evidence from multiple sources for correlation
4. **Time Synchronization**: Ensure all systems have synchronized clocks
5. **Filter Appropriately**: Use time ranges and filters to focus on relevant data

### Analysis Approach
1. **Start with Timeline**: Build chronological sequence of events first
2. **Test Hypotheses**: Validate theories against evidence systematically
3. **Consider Multiple Causes**: Don't assume single root cause
4. **Document Reasoning**: Record analysis methodology and assumptions
5. **Validate Conclusions**: Cross-check findings with multiple evidence sources

### Reporting
1. **Clear Structure**: Use consistent report format and structure
2. **Evidence-Based**: Base all conclusions on collected evidence
3. **Actionable Recommendations**: Provide specific, implementable solutions
4. **Appropriate Detail**: Match report detail to audience needs
5. **Follow-up Actions**: Include monitoring and prevention measures

### Investigation Management
1. **Regular Updates**: Keep stakeholders informed of progress
2. **Document Everything**: Maintain comprehensive investigation records
3. **Learn from Failures**: Use investigations to improve processes
4. **Share Knowledge**: Document lessons learned for future reference
5. **Continuous Improvement**: Refine investigation processes based on experience

## Common Investigation Patterns

### Performance Issues
1. Collect metrics, logs, and configuration
2. Build timeline of performance degradation
3. Identify resource bottlenecks
4. Trace causal relationships
5. Validate performance hypotheses

### Security Incidents
1. Collect security logs and access records
2. Analyze attack patterns and timelines
3. Identify compromised systems
4. Trace attack vectors
5. Document security recommendations

### Configuration Problems
1. Collect current and historical configurations
2. Compare configurations across environments
3. Identify configuration drift
4. Trace configuration changes
5. Validate configuration impact

### Network Issues
1. Collect network logs and metrics
2. Analyze connectivity patterns
3. Identify network bottlenecks
4. Trace routing and DNS issues
5. Validate network hypotheses

This comprehensive example usage guide demonstrates how to effectively use the Investigations MCP tools for various forensic investigation scenarios, following best practices for evidence collection, analysis, and reporting.
