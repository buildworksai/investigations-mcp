# Investigations MCP Tools - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd investigations-mcp
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup.sh
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
mkdir -p data reports
```

### 4. Start the Server
```bash
npm start
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` or `development`
- `DB_PATH`: Path to SQLite database file (default: `./investigations.db`)
- `REPORTS_DIR`: Directory for generated reports (default: `./reports`)

### Database
The system uses SQLite by default. For production deployments, consider using PostgreSQL:

```typescript
// In src/services/database.ts
const database = new InvestigationDatabase('postgresql://user:pass@host:port/db');
```

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
docker logs investigations-mcp
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
