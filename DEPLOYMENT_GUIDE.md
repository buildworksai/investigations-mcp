# 🚀 Production Deployment Guide - Investigations MCP v2.2.1

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### ✅ **System Requirements**
- **Node.js**: 18.0.0 or higher
- **Memory**: Minimum 512MB RAM, Recommended 2GB+
- **Disk Space**: Minimum 1GB free space
- **OS**: Linux (Ubuntu 20.04+), macOS 10.15+, Windows 10+
- **Network**: Outbound HTTPS access for MCP protocol

### ✅ **Security Prerequisites**
- [ ] Firewall configured (ports 443, 80 if using reverse proxy)
- [ ] SSL/TLS certificates ready
- [ ] User accounts and permissions configured
- [ ] Backup strategy planned
- [ ] Monitoring system configured

---

## 🏗️ **DEPLOYMENT METHODS**

### **Method 1: Direct Node.js Deployment**

#### **Step 1: Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.0.0+
npm --version
```

#### **Step 2: Application Deployment**
```bash
# Create application user
sudo useradd -m -s /bin/bash investigations-mcp
sudo usermod -aG sudo investigations-mcp

# Switch to application user
sudo su - investigations-mcp

# Create application directory
mkdir -p /home/investigations-mcp/app
cd /home/investigations-mcp/app

# Clone repository
git clone <your-repo-url> .
git checkout v2.2.1

# Install dependencies
npm ci --production

# Build application
npm run build

# Create storage directory
mkdir -p .investigations-mcp
chmod 755 .investigations-mcp
```

#### **Step 3: Environment Configuration**
```bash
# Create environment file
cat > .env << EOF
NODE_ENV=production
INVESTIGATIONS_STORAGE_PATH=/home/investigations-mcp/app/.investigations-mcp
INVESTIGATIONS_MAX_COUNT=50
INVESTIGATIONS_MAX_CONCURRENT=10
LOG_LEVEL=info
LOG_FILE=/home/investigations-mcp/app/logs/app.log
EOF

# Create logs directory
mkdir -p logs
chmod 755 logs
```

#### **Step 4: System Service Setup**
```bash
# Create systemd service file
sudo tee /etc/systemd/system/investigations-mcp.service > /dev/null << EOF
[Unit]
Description=Investigations MCP Server
After=network.target

[Service]
Type=simple
User=investigations-mcp
WorkingDirectory=/home/investigations-mcp/app
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/investigations-mcp/app/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/investigations-mcp/app/.investigations-mcp
ReadWritePaths=/home/investigations-mcp/app/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable investigations-mcp
sudo systemctl start investigations-mcp

# Check status
sudo systemctl status investigations-mcp
```

---

### **Method 2: Docker Deployment**

#### **Step 1: Docker Setup**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### **Step 2: Application Deployment**
```bash
# Create deployment directory
mkdir -p /opt/investigations-mcp
cd /opt/investigations-mcp

# Clone repository
git clone <your-repo-url> .
git checkout v2.2.1

# Create environment file
cat > .env << EOF
NODE_ENV=production
INVESTIGATIONS_STORAGE_PATH=/app/.investigations-mcp
INVESTIGATIONS_MAX_COUNT=50
INVESTIGATIONS_MAX_CONCURRENT=10
LOG_LEVEL=info
EOF

# Create storage directory
mkdir -p .investigations-mcp
chmod 755 .investigations-mcp

# Build and run
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### **Step 3: Docker Compose Configuration**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  investigations-mcp:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: investigations-mcp-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - INVESTIGATIONS_STORAGE_PATH=/app/.investigations-mcp
      - INVESTIGATIONS_MAX_COUNT=50
      - INVESTIGATIONS_MAX_CONCURRENT=10
      - LOG_LEVEL=info
    volumes:
      - ./investigations-mcp:/app/.investigations-mcp
      - ./logs:/app/logs
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `INVESTIGATIONS_STORAGE_PATH` | `./.investigations-mcp` | Storage directory path |
| `INVESTIGATIONS_MAX_COUNT` | `50` | Maximum investigations |
| `INVESTIGATIONS_MAX_CONCURRENT` | `10` | Max concurrent operations |
| `LOG_LEVEL` | `info` | Logging level |
| `LOG_FILE` | `./logs/app.log` | Log file path |

### **Production Configuration**
```bash
# Recommended production settings
NODE_ENV=production
INVESTIGATIONS_STORAGE_PATH=/var/lib/investigations-mcp
INVESTIGATIONS_MAX_COUNT=100
INVESTIGATIONS_MAX_CONCURRENT=20
LOG_LEVEL=warn
LOG_FILE=/var/log/investigations-mcp/app.log
```

---

## 🔒 **SECURITY CONFIGURATION**

### **File Permissions**
```bash
# Set proper permissions
sudo chown -R investigations-mcp:investigations-mcp /home/investigations-mcp/app
sudo chmod -R 755 /home/investigations-mcp/app
sudo chmod -R 700 /home/investigations-mcp/app/.investigations-mcp
sudo chmod -R 755 /home/investigations-mcp/app/logs
```

### **Firewall Configuration**
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (if using reverse proxy)
sudo ufw allow 443/tcp   # HTTPS (if using reverse proxy)
sudo ufw enable

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### **SSL/TLS Setup (Nginx Reverse Proxy)**
```nginx
# /etc/nginx/sites-available/investigations-mcp
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 **MONITORING & LOGGING**

### **Log Management**
```bash
# Configure logrotate
sudo tee /etc/logrotate.d/investigations-mcp > /dev/null << EOF
/home/investigations-mcp/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 investigations-mcp investigations-mcp
    postrotate
        systemctl reload investigations-mcp
    endscript
}
EOF
```

### **Health Monitoring**
```bash
# Create health check script
cat > /home/investigations-mcp/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Service is healthy"
    exit 0
else
    echo "❌ Service is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
EOF

chmod +x /home/investigations-mcp/health-check.sh

# Add to crontab for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/investigations-mcp/health-check.sh") | crontab -
```

### **System Monitoring**
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Create monitoring script
cat > /home/investigations-mcp/monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "Process Status:"
systemctl status investigations-mcp --no-pager
echo ""
echo "Recent Logs:"
tail -n 20 /home/investigations-mcp/app/logs/app.log
EOF

chmod +x /home/investigations-mcp/monitor.sh
```

---

## 🔄 **BACKUP & RECOVERY**

### **Automated Backup**
```bash
# Create backup script
cat > /home/investigations-mcp/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/investigations-mcp/backups"
APP_DIR="/home/investigations-mcp/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/investigations-mcp_$DATE.tar.gz \
    -C $APP_DIR \
    .investigations-mcp \
    logs \
    .env

# Keep only last 7 days of backups
find $BACKUP_DIR -name "investigations-mcp_*.tar.gz" -mtime +7 -delete

echo "Backup completed: investigations-mcp_$DATE.tar.gz"
EOF

chmod +x /home/investigations-mcp/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/investigations-mcp/backup.sh") | crontab -
```

### **Recovery Procedure**
```bash
# Stop service
sudo systemctl stop investigations-mcp

# Restore from backup
cd /home/investigations-mcp/app
tar -xzf /home/investigations-mcp/backups/investigations-mcp_YYYYMMDD_HHMMSS.tar.gz

# Fix permissions
sudo chown -R investigations-mcp:investigations-mcp .investigations-mcp logs

# Start service
sudo systemctl start investigations-mcp
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check service status
sudo systemctl status investigations-mcp

# Check logs
sudo journalctl -u investigations-mcp -f

# Check application logs
tail -f /home/investigations-mcp/app/logs/app.log
```

#### **Permission Issues**
```bash
# Fix ownership
sudo chown -R investigations-mcp:investigations-mcp /home/investigations-mcp/app

# Fix permissions
sudo chmod -R 755 /home/investigations-mcp/app
sudo chmod -R 700 /home/investigations-mcp/app/.investigations-mcp
```

#### **Storage Issues**
```bash
# Check disk space
df -h

# Check storage directory
ls -la /home/investigations-mcp/app/.investigations-mcp/

# Clean old investigations if needed
# (FIFO system should handle this automatically)
```

#### **Memory Issues**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart service if needed
sudo systemctl restart investigations-mcp
```

### **Performance Tuning**
```bash
# Increase file limits
echo "investigations-mcp soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "investigations-mcp hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=1024"
```

---

## 📈 **SCALING CONSIDERATIONS**

### **Horizontal Scaling**
- Deploy multiple instances behind a load balancer
- Use shared storage (NFS, S3) for investigation data
- Implement session affinity if needed

### **Vertical Scaling**
- Increase memory allocation
- Add more CPU cores
- Use SSD storage for better I/O performance

### **Database Scaling**
- Consider migrating to PostgreSQL for high-volume deployments
- Implement read replicas for read-heavy workloads
- Use connection pooling

---

## 🔍 **MAINTENANCE**

### **Regular Maintenance Tasks**
```bash
# Weekly maintenance script
cat > /home/investigations-mcp/maintenance.sh << 'EOF'
#!/bin/bash
echo "Starting weekly maintenance..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean old logs
sudo journalctl --vacuum-time=7d

# Check disk space
df -h

# Restart service
sudo systemctl restart investigations-mcp

echo "Maintenance completed."
EOF

chmod +x /home/investigations-mcp/maintenance.sh

# Schedule weekly maintenance
(crontab -l 2>/dev/null; echo "0 3 * * 0 /home/investigations-mcp/maintenance.sh") | crontab -
```

### **Update Procedure**
```bash
# Create update script
cat > /home/investigations-mcp/update.sh << 'EOF'
#!/bin/bash
APP_DIR="/home/investigations-mcp/app"
BACKUP_DIR="/home/investigations-mcp/backups"

# Create backup
$BACKUP_DIR/backup.sh

# Stop service
sudo systemctl stop investigations-mcp

# Update application
cd $APP_DIR
git fetch origin
git checkout v2.2.1  # or latest version
npm ci --production
npm run build

# Start service
sudo systemctl start investigations-mcp

echo "Update completed."
EOF

chmod +x /home/investigations-mcp/update.sh
```

---

## 📞 **SUPPORT & CONTACT**

### **Emergency Contacts**
- **System Administrator**: [Your Contact]
- **Development Team**: [Your Contact]
- **24/7 Support**: [Your Contact]

### **Useful Commands**
```bash
# Service management
sudo systemctl start investigations-mcp
sudo systemctl stop investigations-mcp
sudo systemctl restart investigations-mcp
sudo systemctl status investigations-mcp

# Log viewing
sudo journalctl -u investigations-mcp -f
tail -f /home/investigations-mcp/app/logs/app.log

# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/storage-info

# Performance monitoring
htop
iotop
nethogs
```

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### **Checklist**
- [ ] Service is running (`systemctl status investigations-mcp`)
- [ ] Health endpoint responds (`curl http://localhost:3000/health`)
- [ ] Storage is accessible (`curl http://localhost:3000/storage-info`)
- [ ] Logs are being written
- [ ] Backup script is working
- [ ] Monitoring is configured
- [ ] SSL/TLS is working (if applicable)
- [ ] Firewall is configured
- [ ] Performance is acceptable

### **Test Commands**
```bash
# Test MCP connection
node -e "
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function test() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/home/investigations-mcp/app/dist/index.js']
  });
  
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  console.log('✅ MCP connection successful');
  await client.close();
}

test().catch(console.error);
"
```

---

**🎉 Congratulations! Your Investigations MCP server is now deployed and ready for production use.**

**⚠️ Remember**: This system handles sensitive investigation data. Ensure you have proper security measures, backups, and monitoring in place before processing real investigations.
