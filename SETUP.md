# Investigations MCP Tools - Setup Guide (v2.2.2)

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### What's New in v2.2.2
- **Complete JSON Storage System**: Full migration from SQLite to JSON-based file storage
- **Automatic FIFO Management**: Old investigations automatically cleaned up (max 50)
- **No Database Setup**: No SQLite or database configuration required
- **Enhanced Performance**: Eliminated native module dependencies
- **Simplified Architecture**: Human-readable JSON files in `./.investigations/`

### ⚠️ Security Notice
**IMPORTANT**: This software collects sensitive system data and stores it locally in JSON format without encryption. Ensure you have proper authorization and follow security best practices. See the full security disclaimer in README.md and LICENSE files.

### Storage Folder Management
- **Storage Location**: All investigation data is stored in `./.investigations/` directory
- **User Responsibility**: You are responsible for managing this folder
- **Git Ignore**: **CRITICAL**: Add `.investigations/` to your `.gitignore` file
- **Cleanup**: Manually delete the folder when no longer needed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd investigations
   ```

2. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

3. **Start the MCP server**
   ```bash
   npm start
   ```

## Docker Setup

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

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Create Directories
```bash
mkdir -p reports
```

### 4. Start the Server
```bash
npm start
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` or `development`
- `REPORTS_DIR`: Directory for generated reports (default: `./reports`)

### Storage
The system uses JSON-based file storage by default. All data is stored in the `./.investigations/` directory with automatic FIFO management (maximum 50 investigations).

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

## Usage Examples

### Basic Investigation
```bash
# Start an investigation
investigation_start \
  --title "API Performance Issue" \
  --description "Response times increased significantly" \
  --severity high \
  --category performance \
  --reported-by "monitoring-system"

# Collect evidence
investigation_collect_evidence \
  --investigation-id "inv_001" \
  --sources '[{"type": "logs", "path": "/var/log/app.log"}]'

# Analyze evidence
investigation_analyze_evidence \
  --investigation-id "inv_001" \
  --analysis-type timeline

# Generate report
investigation_generate_report \
  --investigation-id "inv_001" \
  --format markdown
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x dist/index.js
   chmod +x scripts/setup.sh
   ```

2. **Database Connection Issues**
   - Ensure the data directory exists and is writable
   - Check file permissions on the database file

3. **Evidence Collection Fails**
   - Verify file paths exist and are readable
   - Check system permissions for log files and system information

4. **Docker Build Fails**
   - Ensure Docker is running
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json

### Logs and Debugging

Enable debug logging:
```bash
DEBUG=investigations:* npm start
```

Check container logs:
```bash
docker logs investigations
```

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

## Support

For issues and questions:
- Check the [README.md](./README.md) for detailed documentation
- Review [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) for usage examples
- Create an issue in the repository
- Contact BuildWorks.AI support

## License

MIT License - see [LICENSE](./LICENSE) file for details.
