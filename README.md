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

# Or use the provided script
./scripts/clear-npx-cache.sh
```

#### SQLite3 Native Module Issues
If you encounter `ERR_DLOPEN_FAILED` or similar native module errors, ensure you're using version 2.0.13 or later, which uses `better-sqlite3` for improved compatibility.

#### Crypto Deprecation Warnings
If you see warnings about deprecated `crypto@1.0.1` package, ensure you're using version 2.0.15 or later, which uses Node.js built-in crypto module instead.

#### MCP Server Connection Issues
If you encounter "failed to initialize server" or "transport error: server terminated" errors:

1. **Check version**: Ensure you're using version 2.0.23 or later
2. **Clear corrupted cache** (MOST COMMON FIX):
   ```bash
   npm cache clean --force
   rm -rf ~/.npm/_npx
   npx buildworks-ai-investigations-mcp@latest --version
   ```
3. **Verify installation**: Test with `npx buildworks-ai-investigations-mcp@latest --version`
4. **Check Node.js**: Ensure Node.js 18+ is installed

#### better-sqlite3 Native Module Errors
If you see errors mentioning `better_sqlite3.node`, `bindings.js`, or "failed to initialize server":

**Root Cause**: Corrupted npx cache with incomplete native module installation

**Solution** (Required):
```bash
# Clear all caches
npm cache clean --force
rm -rf ~/.npm/_npx

# Fresh installation
npx buildworks-ai-investigations-mcp@latest --version
```

**Prevention**: The package now includes automatic detection of corrupted cache in v2.0.23+

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

### v2.0.23 (Current)
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
- **Root Cause Fix**: Proactive detection and prevention of npx cache corruption that causes "failed to initialize server" errors.
- **Enhanced Pre-install**: Pre-install script now detects corrupted better-sqlite3 installations and prevents installation with clear guidance.
- **Runtime Error Handling**: Better error messages when native module loading fails, with specific cache clearing instructions.
- **Post-install Validation**: Post-install script validates better-sqlite3 native module integrity.
- **Comprehensive Documentation**: Updated troubleshooting with specific better-sqlite3 native module error solutions.

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
- **Troubleshooting Documentation**: Added comprehensive troubleshooting section for common issues including ENOTEMPTY errors and SQLite3 native module problems.
- **Helper Script**: Created `clear-npx-cache.sh` script to help users resolve npx cache issues.
- **User Experience**: Improved documentation and support for common installation and usage problems.

### v2.0.13
- **SQLite3 Fix**: Replaced `sqlite3` with `better-sqlite3` to resolve native module compatibility issues in Windsurf IDE and other sandboxed environments.
- **Native Module Reliability**: Eliminated `ERR_DLOPEN_FAILED` and segment loading errors that occurred when using npx in different environments.
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
- SQLite database with proper schema
- Comprehensive MCP tool suite