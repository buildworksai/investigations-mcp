# Investigations

**Investigations** is a production-grade Model Context Protocol (MCP) server providing forensic investigations, root cause analysis, and systematic evidence-based problem solving. Works with Cursor, Windsurf, and Claude via stdio. Distributed via npm and Docker. Built and maintained by [BuildWorks.AI](https://buildworks.ai).

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

## ⚠️ Security Disclaimer

**IMPORTANT SECURITY NOTICE**: This software is designed for forensic investigations and root cause analysis. Users must understand and accept the following security implications:

### Data Collection & Privacy
- **Sensitive Data**: This tool collects system information, logs, configurations, and potentially sensitive data
- **Data Storage**: All investigation data is stored locally in JSON files in `./.investigations/` directory
- **No Encryption**: Data is stored in plain text JSON format without encryption
- **Data Retention**: Automatic FIFO cleanup removes old investigations (max 50)
- **Storage Management**: Users are responsible for managing the `.investigations/` folder
- **Git Ignore**: Users must add `.investigations/` to their `.gitignore` file to prevent committing sensitive data

### Security Considerations
- **Access Control**: Ensure proper file permissions on the storage directory
- **Network Security**: Evidence collection may involve network requests and data transmission
- **System Access**: The tool requires system-level access to collect evidence
- **Data Sensitivity**: Be aware of what data is being collected and stored

### Compliance & Legal
- **Authorization Required**: Only use on systems you own or have explicit permission to investigate
- **Data Protection**: Comply with applicable data protection laws (GDPR, CCPA, etc.)
- **Chain of Custody**: Maintain proper chain of custody for forensic evidence
- **Legal Compliance**: Ensure investigations comply with local laws and regulations

### Limitations
- **No Warranty**: This software is provided "as is" without security guarantees
- **Use at Own Risk**: Users assume all risks associated with data collection and storage
- **Professional Use**: Intended for qualified professionals in controlled environments

**By using this software, you acknowledge and accept these security implications and limitations.**

## Storage Management

### Investigation Data Storage
All investigation data is stored in the `./.investigations/` directory with the following structure:
```
.investigations/
├── investigations/
│   ├── {investigation_id}.json
│   └── index.json
├── evidence/
│   ├── {investigation_id}/
│   │   └── {evidence_id}.json
│   └── index.json
├── analysis/
│   ├── {investigation_id}/
│   │   └── {analysis_id}.json
│   └── index.json
└── reports/
    ├── {investigation_id}/
    │   └── {report_id}.json
    └── index.json
```

### User Responsibilities
- **Directory Management**: Users are responsible for creating, managing, and cleaning up the `.investigations/` folder
- **Git Ignore**: **CRITICAL**: Add `.investigations/` to your `.gitignore` file to prevent committing sensitive investigation data
- **File Permissions**: Ensure proper file permissions on the storage directory
- **Data Cleanup**: Manually delete the folder when no longer needed
- **Backup**: Create backups of investigation data if needed for long-term storage

### Example .gitignore Entry
```gitignore
# Investigations MCP storage directory
.investigations/
```

## Installation

### Prerequisites
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher
- **Operating System**: macOS, Linux, or Windows

### System Requirements
- **Memory**: Minimum 512MB RAM
- **Disk Space**: 100MB for installation
- **Network**: Internet connection for initial installation

### Install via npm (recommended)
```bash
npm install -g investigations@latest
```

**Important Notes:**
- Always use `@latest` to ensure you get the most recent version and avoid npx resolution conflicts with global installations
- If you encounter "failed to initialize server" errors, see the [Troubleshooting](#troubleshooting) section below

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
        "args": ["investigations"],
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
        "args": ["investigations"],
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

## Troubleshooting

### Common Issues

#### Package Installation Failures
If you encounter installation errors, try these steps in order:

```bash
# 1. Clear npm and npx caches
npm cache clean --force
rm -rf ~/.npm/_npx

# 2. Verify Node.js version (requires 18+)
node --version

# 3. Try alternative installation methods
npm install -g investigations@latest
# OR
npx investigations@latest --version
```

#### ENOTEMPTY Error with npx
This is a common npm cache corruption issue. The package includes automatic detection and guidance:

```bash
# Clear npm and npx cache
npm cache clean --force
rm -rf ~/.npm/_npx
```

#### Storage System
The application uses JSON-based file storage for maximum compatibility. All data is stored in the `./.investigations/` directory with automatic FIFO management.

#### Crypto Deprecation Warnings
If you see warnings about deprecated `crypto@1.0.1` package, ensure you're using version 2.2.2 or later, which uses Node.js built-in crypto module instead.

#### MCP Server Connection Issues
If you encounter "failed to initialize server" or "transport error: server terminated" errors:

1. **Check version**: Ensure you're using version 2.2.2 or later
2. **Clear corrupted cache** (MOST COMMON FIX):
   ```bash
   npm cache clean --force
   rm -rf ~/.npm/_npx
   npx investigations@latest --version
   ```
3. **Verify Node.js version**: Ensure you're using Node.js 18 or higher
   ```bash
   node --version  # Should show v18.x.x or higher
   ```
4. **Check NODE_MODULE_VERSION compatibility**:
   ```bash
   node -p "process.versions.modules"  # Should match your Node.js version
   ```
5. **Fresh installation**:
   ```bash
   npm uninstall -g investigations
   npm cache clean --force
   rm -rf ~/.npm/_npx
   npm install -g investigations@latest
   ```

#### Native Module Issues (Resolved)
The application now uses JSON-based file storage, eliminating all native module compatibility issues. No more NODE_MODULE_VERSION or better-sqlite3 errors!


#### "No tools" in MCP Client
If your MCP client shows "No tools, prompts, or resources":

1. **Verify server startup**: Check that the server starts without errors
2. **Check MCP configuration**: Ensure correct command and args in your MCP config
3. **Test manually**: Run `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npx investigations@latest`
4. **Restart client**: Restart your MCP client after configuration changes

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/buildworksai/investigations-mcp/issues)
- **Documentation**: [Full documentation](https://github.com/buildworksai/investigations-mcp#readme)
- **BuildWorks.AI Support**: [contact@buildworks.ai](mailto:contact@buildworks.ai)

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
- [x] JSON-based file storage setup
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

### v2.2.2 (Current)
- **Complete JSON Storage System**: Full migration from SQLite to JSON-based file storage with FIFO management.
- **Enhanced Storage Architecture**: Organized file structure with automatic cleanup and indexing.
- **Improved Performance**: Eliminated native module dependencies for better compatibility.
- **Comprehensive Testing**: Updated test suite with FIFO enforcement and date handling.
- **Migration Utility**: Added migration script for existing SQLite users.
- **Updated Documentation**: Complete documentation overhaul reflecting new storage system.
- **Docker Integration**: Updated Docker configurations for JSON storage.
- **Simplified Setup**: Removed complex setup scripts and native module requirements.
- **Better Error Handling**: Enhanced error messages and troubleshooting guides.
- **Production Ready**: Fully tested and verified storage system with automatic cleanup.

### v2.2.2
- **Complete Rebranding**: Package renamed from `buildworks-ai-investigations-mcp` to `investigations` for simplicity
- **Simplified Installation**: Clean, short package name for easier installation and usage
- **JSON Storage System**: File-based JSON storage with FIFO management (max 50 investigations)
- **Enhanced Performance**: Optimized for high-concurrency operations (150 concurrent max)
- **Comprehensive Testing**: 75+ tests with stress testing for 65+ investigations
- **Production Ready**: Full error handling, logging, health monitoring, and audit trails
- **MCP Compliance**: Full Model Context Protocol compatibility for IDE integration
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Zero Dependencies**: No native modules or complex database setup required