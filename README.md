# Investigations MCP by BuildWorks.AI

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
- **Security Data**: Gather user accounts, permissions, and security logs
- **Database Information**: Collect query results and database state
- **Filesystem Data**: Gather file system information and directory contents

### 🧠 Analysis Engine Tools
- **Timeline Analysis**: Chronological reconstruction of events
- **Causal Analysis**: Map cause-effect relationships to identify root causes
- **Performance Analysis**: Identify bottlenecks and optimization opportunities
- **Security Analysis**: Detect threats and assess vulnerabilities
- **Correlation Analysis**: Correlate evidence from multiple sources
- **Statistical Analysis**: Detect anomalies and patterns

### 📋 Reporting Tools
- **Multi-Format Reports**: Generate reports in JSON, Markdown, HTML, and PDF
- **Comprehensive Documentation**: Include evidence, analysis, timeline, and recommendations
- **Professional Layout**: Executive summaries and detailed findings
- **Audit Trails**: Complete chain of custody documentation

## Installation

1. Install via npm (recommended):
```bash
npm install -g @buildworksai/investigations-mcp
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
        "args": ["@buildworksai/investigations-mcp"],
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
        "args": ["@buildworksai/investigations-mcp"],
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

### Phase 2: Advanced Analysis (In Progress)
- [ ] Sophisticated causal analysis
- [ ] Hypothesis validation with confidence scoring
- [ ] Enhanced timeline reconstruction
- [ ] Multi-source evidence correlation

### Phase 3: Specialized Tools (Planned)
- [ ] Security forensics capabilities
- [ ] Performance analysis tools
- [ ] Infrastructure inspection tools
- [ ] Custom evidence collectors

### Phase 4: Integration & Polish (Planned)
- [ ] Advanced reporting formats
- [ ] Visualization tools
- [ ] API integrations
- [ ] Comprehensive documentation

## Changelog

### v1.0.0 (Current)
- Initial release with core investigation framework
- Basic evidence collection and analysis
- Timeline reconstruction and causal tracing
- Multi-format report generation
- SQLite database with proper schema
- Comprehensive MCP tool suite