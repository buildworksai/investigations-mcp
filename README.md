# Investigations MCP by BuildWorks.AI

[![npm version](https://img.shields.io/npm/v/buildworks-ai-investigations-mcp.svg)](https://www.npmjs.com/package/buildworks-ai-investigations-mcp)
[![npm downloads](https://img.shields.io/npm/dm/buildworks-ai-investigations-mcp.svg)](https://www.npmjs.com/package/buildworks-ai-investigations-mcp)
[![Publish](https://github.com/buildworksai/investigations-mcp/actions/workflows/publish.yml/badge.svg)](https://github.com/buildworksai/investigations-mcp/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Investigations MCP by BuildWorks.AI is a production-grade Model Context Protocol (MCP) server providing forensic investigations, root cause analysis, and systematic evidence-based problem solving. Works with Cursor, Windsurf, and Claude via stdio. Distributed via npm and Docker. Built and maintained by [BuildWorks.AI](https://buildworks.ai).

## Features

### 🔍 Investigation Management Tools
- **Case Initialization**: Create and manage investigation cases with proper metadata
- **Evidence Collection**: Gather evidence from multiple sources while maintaining chain of custody
- **Case Tracking**: Monitor investigation progress and status
- **Case Search**: Find and filter investigations by various criteria

### 📊 Evidence Collection Tools
- **Log Analysis**: Collect and analyze application, system, and security logs
- **Configuration Inspection**: Gather system and application configurations
- **Performance Metrics**: Collect CPU, memory, disk, and network metrics
- **Network Analysis**: Gather connection, interface, and routing information
- **Process Information**: Collect running processes and system state
- **Filesystem Data**: Gather file system information and directory contents
- **Database Information**: Collect query results and database state
- **Security Data**: Users, permissions, security logs, open ports, running services, file integrity, suspicious processes, vulnerability scan
- **Infrastructure**: System, hardware, software, services, load balancer, proxies with scoring
- **Container**: Docker info, containers, images, volumes, networks with scoring
- **Cloud**: Cloud provider, instance metadata, security groups with scoring
- **Monitoring**: Tools, alerts, metrics history, health checks, dashboards with scoring

### 🧠 Analysis Engine Tools
- **Timeline Analysis**: Chronological reconstruction of events
- **Causal Analysis**: Map cause-effect relationships to identify root causes
- **Performance Analysis**: Identify bottlenecks and optimization opportunities
- **Security Analysis**: Detect threats and assess vulnerabilities
- **Correlation Analysis**: Correlate evidence from multiple sources
- **Statistical Analysis**: Detect anomalies and patterns

### 📋 Reporting Tools
- **Multi-Format Reports**: Generate reports in JSON, Markdown, HTML, PDF, XML, YAML, CSV, Excel, and PowerPoint
- **Comprehensive Documentation**: Include evidence, analysis, timeline, and recommendations
- **Professional Layout**: Executive summaries and detailed findings
- **Audit Trails**: Complete chain of custody documentation

### 🧩 Visualization & Integrations
- **Visualization Tools**: Timeline, evidence flow, analysis confidence, severity distribution, category breakdown, network diagram, process flow
- **API Integrations**: Slack, Jira, Confluence, GitHub, GitLab, Jenkins, Prometheus, Grafana, Elasticsearch, Splunk

## Installation

1. Install via npm (recommended):
```bash
npm install -g buildworks-ai-investigations-mcp
```

Or clone the repository:
```bash
git clone https://github.com/buildworksai/investigations-mcp.git
cd investigations-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

## Quick Start

### Basic Investigation Workflow

1. **Start an Investigation**
```bash
investigation_start \
  --title "API Performance Issue" \
  --description "Response times increased significantly" \
  --severity high \
  --category performance \
  --reported-by "monitoring-system"
```

2. **Collect Evidence**
```bash
investigation_collect_evidence \
  --investigation-id "inv_001" \
  --sources '[
    {
      "type": "logs",
      "path": "/var/log/app.log",
      "time_range": {
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T16:00:00Z"
      }
    },
    {
      "type": "metrics",
      "parameters": {
        "metrics": ["cpu", "memory", "disk"]
      }
    }
  ]'
```

3. **Analyze Evidence**
```bash
investigation_analyze_evidence \
  --investigation-id "inv_001" \
  --analysis-type timeline \
  --hypothesis "Database connection pool exhaustion"
```

4. **Generate Report**
```bash
investigation_generate_report \
  --investigation-id "inv_001" \
  --format markdown \
  --include-evidence true
```

## Available Tools

| Tool | Description |
|------|-------------|
| `investigation_start` | Initialize a new investigation case |
| `investigation_collect_evidence` | Collect evidence from specified sources |
| `investigation_analyze_evidence` | Perform systematic analysis of evidence |
| `investigation_trace_causality` | Trace causal relationships between events |
| `investigation_validate_hypothesis` | Validate hypothesis against evidence |
| `investigation_document_findings` | Document investigation findings |
| `investigation_generate_report` | Generate comprehensive report |
| `investigation_list_cases` | List investigation cases with filtering |
| `investigation_get_case` | Get detailed case information |
| `investigation_search_evidence` | Search through collected evidence |

## MCP Client Configuration

### Cursor IDE
Add to your Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "investigations": {
        "command": "npx",
        "args": ["buildworks-ai-investigations-mcp"],
        "env": {}
      }
    }
  }
}
```

### Windsurf IDE
Add to your Windsurf configuration:

```json
{
  "mcp": {
    "servers": {
      "investigations": {
        "command": "npx",
        "args": ["buildworks-ai-investigations-mcp"],
        "env": {}
      }
    }
  }
}
```

## Docker Support

### Build and Run
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Development with Docker
```bash
# Run in development mode
npm run docker:dev
```

## Examples

See the [examples/](./examples/) directory for detailed usage scenarios:
- [Performance Investigation](./examples/performance-investigation-example.md)
- [Security Investigation](./examples/security-investigation-example.md)
- [Configuration Investigation](./examples/configuration-investigation-example.md)

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Development Mode
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For questions, issues, or contributions:
- Create an issue in the [GitHub repository](https://github.com/buildworksai/investigations-mcp/issues)
- Review the [SETUP.md](./SETUP.md) for detailed setup instructions
- Check the [examples](./examples/) for usage patterns
- Contact [BuildWorks.AI](https://buildworks.ai) support

## Roadmap

### Phase 1: Core Framework ✅
- [x] Basic investigation case management
- [x] Evidence collection from common sources
- [x] Simple analysis and reporting
- [x] SQLite database setup
- [x] MCP server implementation
- [x] npm and GitHub Packages publishing
- [x] Docker containerization

### Phase 2: Advanced Analysis ✅
- [x] Sophisticated causal analysis
- [x] Hypothesis validation with confidence scoring
- [x] Enhanced timeline reconstruction
- [x] Multi-source evidence correlation

### Phase 3: Specialized Tools ✅
- [x] Security forensics capabilities
- [x] Performance analysis tools
- [x] Infrastructure inspection tools
- [x] Custom evidence collectors

### Phase 4: Integration & Polish ✅
- [x] Advanced reporting formats
- [x] Visualization tools
- [x] API integrations
- [x] Comprehensive documentation

## Changelog

### v2.0.12 (Current)
- README updated: new collectors, 9 report formats, visualization & integrations
- No functional code changes; docs and packaging only

### v2.0.10
- Fix report date handling and null-safety
- Harden security/infrastructure scoring
- Add DB migration for new evidence types

### v2.0.9
- Minor fixes and TS typing hardening
- Build green in CI for publish

### v2.0.8
- **COMPLETED PHASE 3 & 4**: All specialized tools and integrations implemented
- **Security Forensics**: Advanced security analysis with malware detection, vulnerability scanning, and security scoring
- **Performance Analysis**: Comprehensive performance bottleneck identification and optimization recommendations
- **Infrastructure Inspection**: Docker, cloud, and monitoring system analysis with scoring
- **Advanced Reporting**: 9 report formats (JSON, Markdown, HTML, PDF, XML, YAML, CSV, Excel, PowerPoint)
- **Visualization Tools**: 7 visualization types (timeline, evidence flow, analysis confidence, severity distribution, category breakdown, network diagram, process flow)
- **API Integrations**: 10 service integrations (Slack, Jira, Confluence, GitHub, GitLab, Jenkins, Prometheus, Grafana, Elasticsearch, Splunk)
- **Custom Evidence Collectors**: Infrastructure, container, cloud, and monitoring evidence collection
- Enhanced analysis engine with advanced performance and security analysis capabilities
- Comprehensive documentation and examples for all new features

### v2.0.6
- Added GitHub Packages publishing support
- Copied successful workflow from decision-mcp
- Dual publishing to both npm and GitHub Packages
- Improved error handling and debugging

### v2.0.5
- Tested GitHub Packages publishing with proper permissions
- Enhanced workflow configuration
- Better authentication handling

### v2.0.4
- Added GitHub Packages publishing to workflow
- Dual publishing for maximum visibility
- Enhanced package metadata

### v2.0.3
- Fixed SQLITE_CANTOPEN database error
- Improved database path resolution for sandboxed environments
- Enhanced error handling and logging
- Tested in Windsurf IDE and Docker

### v2.0.2
- Database persistence improvements
- Better file system permissions handling
- Enhanced Docker compatibility

### v2.0.1
- Initial npm publication
- Core investigation framework
- Basic evidence collection and analysis
- Timeline reconstruction and causal tracing
- Multi-format report generation
- SQLite database with proper schema
- Comprehensive MCP tool suite