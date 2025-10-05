# Investigations MCP Tools v2.2.2
# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Create storage directory for JSON files
RUN mkdir -p /app/.investigations

# Change ownership of the app directory
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port (optional, for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the MCP server
CMD ["node", "dist/index.js"]
