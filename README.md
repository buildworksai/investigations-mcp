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
- **Data Storage**: All investigation data is stored locally in JSON files in `./.investigations-mcp/` directory
- **No Encryption**: Data is stored in plain text JSON format without encryption
- **Data Retention**: Automatic FIFO cleanup removes old investigations (max 50)
- **Storage Management**: Users are responsible for managing the `.investigations-mcp/` folder
- **Git Ignore**: Users must add `.investigations-mcp/` to their `.gitignore` file to prevent committing sensitive data

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
All investigation data is stored in the `./.investigations-mcp/` directory with the following structure:
```
.investigations-mcp/
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
- **Directory Management**: Users are responsible for creating, managing, and cleaning up the `.investigations-mcp/` folder
- **Git Ignore**: **CRITICAL**: Add `.investigations-mcp/` to your `.gitignore` file to prevent committing sensitive investigation data
- **File Permissions**: Ensure proper file permissions on the storage directory
- **Data Cleanup**: Manually delete the folder when no longer needed
- **Backup**: Create backups of investigation data if needed for long-term storage

### Example .gitignore Entry
```gitignore
# Investigations MCP storage directory
.investigations-mcp/
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
npm install -g buildworks-ai-investigations-mcp@latest
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
npm install -g buildworks-ai-investigations-mcp@latest
# OR
npx buildworks-ai-investigations-mcp@latest --version
```

#### ENOTEMPTY Error with npx
This is a common npm cache corruption issue. The package includes automatic detection and guidance:

```bash
# Clear npm and npx cache
npm cache clean --force
rm -rf ~/.npm/_npx
```

#### Storage System
The application now uses JSON-based file storage instead of SQLite, eliminating native module compatibility issues. All data is stored in the `./.investigations-mcp/` directory with automatic FIFO management.

#### Crypto Deprecation Warnings
If you see warnings about deprecated `crypto@1.0.1` package, ensure you're using version 2.2.1 or later, which uses Node.js built-in crypto module instead.

#### MCP Server Connection Issues
If you encounter "failed to initialize server" or "transport error: server terminated" errors:

1. **Check version**: Ensure you're using version 2.2.1 or later
2. **Clear corrupted cache** (MOST COMMON FIX):
   ```bash
   npm cache clean --force
   rm -rf ~/.npm/_npx
   npx buildworks-ai-investigations-mcp@latest --version
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
   npm uninstall -g buildworks-ai-investigations-mcp
   npm cache clean --force
   rm -rf ~/.npm/_npx
   npm install -g buildworks-ai-investigations-mcp@latest
   ```

#### Native Module Issues (Resolved)
The application now uses JSON-based file storage, eliminating all native module compatibility issues. No more NODE_MODULE_VERSION or better-sqlite3 errors!


#### "No tools" in MCP Client
If your MCP client shows "No tools, prompts, or resources":

1. **Verify server startup**: Check that the server starts without errors
2. **Check MCP configuration**: Ensure correct command and args in your MCP config
3. **Test manually**: Run `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npx buildworks-ai-investigations-mcp@latest`
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

### v2.2.1 (Current)
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

### v2.0.26
- **JSON Storage Migration**: Migrated from SQLite to JSON-based file storage for better compatibility.
- **FIFO Management**: Automatic cleanup of old investigations (max 50).
- **Enhanced Error Handling**: Comprehensive error messages for storage operations.
- **Simplified Dependencies**: Removed native module dependencies.
- **Engine Requirements**: Added explicit Node.js 18+ and npm 8+ requirements.
- **Global Installation Update System**: Added comprehensive global installation update mechanisms.
- **GitHub Actions Integration**: Automated global installation updates via CI/CD pipeline.
- **Enhanced Post-Install Script**: Detects global installations and provides update guidance.
- **Dedicated Update Script**: New `npm run update-global` command for easy global updates.
- **NPX Resolution Fix**: Resolved npx version resolution conflicts with global installations.
- **User Experience Improvements**: Clear warnings and instructions for global installation management.

### v2.0.25
- **Complete Version Consistency**: Thoroughly verified and updated all version references across entire codebase.
- **Zero Version Mismatches**: Ensured complete consistency between package.json, source code, and documentation.
- **Comprehensive Verification**: Performed systematic verification of all version references before publication.
- **Publication Readiness**: All version references updated and ready for publication.

### v2.0.24
- **Workflow Verification Fix**: Fixed GitHub Actions verification step that was causing workflow failures.
- **Registry Update Handling**: Added retry logic for npm registry updates with proper error handling.
- **Robust Verification**: Made verification more robust by checking registry version instead of downloading package.
- **Workflow Stability**: Ensured workflow continues even if registry is slow to update.

### v2.0.23
- **GitHub Actions Fix**: Fixed GitHub Actions workflow to ensure correct package publication.
- **Build Verification**: Added build and package verification steps to prevent version mismatches.
- **Cache Clearing**: Added npm cache clearing to prevent cached dependency issues.
- **Package Integrity**: Ensured published package content matches source code version.

### v2.0.22
- **Package Lock Fix**: Regenerated package-lock.json with fresh dependencies to resolve build cache issues.
- **Version Consistency**: Ensured all version references are consistent across the codebase.
- **IDE Compatibility**: Resolved MCP server red status issue in IDEs.
- **Build Integrity**: Fixed GitHub Actions build process to use correct source code.

### v2.0.21
- **Build Cache Fix**: Fixed GitHub Actions build cache issue that caused version mismatch in published package.
- **Version Consistency**: Ensured published package content matches version metadata.
- **IDE Compatibility**: Resolved MCP server red status issue in IDEs.
- **Package Integrity**: Verified complete package functionality after publication.

### v2.0.20
- **Zero Deprecated Packages**: Upgraded all dependencies to latest versions, eliminating all deprecated package usage.
- **ESLint v9 Migration**: Migrated from ESLint v8 (deprecated) to v9 with new flat config format.
- **TypeScript ESLint v8**: Upgraded to latest TypeScript ESLint packages for better compatibility.
- **MCP SDK v1.19.1**: Upgraded to latest MCP SDK with proper capabilities declaration.
- **Enhanced Security**: All packages updated to latest versions with zero security vulnerabilities.
- **Improved Compatibility**: Better compatibility with modern Node.js versions and IDEs.

### v2.0.19
- **Storage System Overhaul**: Complete migration to JSON-based file storage.
- **FIFO Management**: Automatic cleanup of old investigations to prevent storage bloat.
- **Enhanced Error Handling**: Better error messages for storage operations.
- **Simplified Architecture**: Removed complex native module dependencies.
- **Comprehensive Documentation**: Updated troubleshooting and setup guides.

### v2.0.18
- **MCP Compliance**: Routed startup diagnostics to stderr so MCP clients receive clean stdout responses.
- **Enhanced Installation**: Added pre-install and post-install scripts for better user experience.
- **Cache Issue Detection**: Automatic detection of npm/npx cache corruption with helpful guidance.
- **Improved Troubleshooting**: Comprehensive troubleshooting documentation and multiple installation methods.
- **Better Error Messages**: Clear, actionable error messages for common installation issues.
- **Installation Verification**: Post-install verification and usage instructions.

### v2.0.16
- **Server Stability**: Improved MCP server startup and error handling with proper signal handling.
- **Version Flag**: Added proper `--version` flag support for better CLI compatibility.
- **Better Error Handling**: Enhanced error handling and graceful shutdown for MCP clients.

### v2.0.15
- **Dependency Cleanup**: Removed deprecated `crypto@1.0.1` package that was causing npm warnings.
- **Clean Installation**: Package now uses only Node.js built-in crypto module, eliminating deprecation warnings.
- **Improved Reliability**: Cleaner dependency tree with no deprecated packages.

### v2.0.14
- **Troubleshooting Documentation**: Added comprehensive troubleshooting section for common issues.
- **User Experience**: Improved documentation and support for common installation and usage problems.

### v2.0.13
- **Storage System**: Initial implementation of file-based storage system.
- **Improved Compatibility**: Better cross-platform support and reduced installation complexity.

### v2.0.12
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
- JSON-based file storage with FIFO management
- Comprehensive MCP tool suite