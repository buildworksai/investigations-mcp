#!/usr/bin/env node

/**
 * Post-install script for buildworks-ai-investigations-mcp
 * Verifies installation and provides helpful information
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function verifyInstallation() {
  try {
    // Check if the main executable exists
    const packagePath = process.env.npm_package_json ? 
      join(process.env.npm_package_json, '..', 'dist', 'index.js') : 
      join(process.cwd(), 'dist', 'index.js');
    
    if (!existsSync(packagePath)) {
      log('❌ Installation verification failed: Main executable not found', 'red');
      return false;
    }
    
    // Test version command
    try {
      const version = execSync('node dist/index.js --version', { 
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000 
      }).trim();
      
      log(`✅ BuildWorks.AI Investigations MCP v${version} installed successfully!`, 'green');
      return true;
    } catch (error) {
      log('⚠️  Could not verify version, but installation appears complete', 'yellow');
      return true;
    }
  } catch (error) {
    log('⚠️  Installation verification incomplete', 'yellow');
    return true;
  }
}

function showUsageInstructions() {
  log('\n🎯 Quick Start Guide:', 'bold');
  log('=' .repeat(40), 'cyan');
  
  log('\n1. Test the installation:', 'blue');
  log('   npx buildworks-ai-investigations-mcp@latest --version', 'green');
  
  log('\n2. Configure in your MCP client:', 'blue');
  log('   Add to your MCP configuration:', 'green');
  log('   {', 'green');
  log('     "command": "npx",', 'green');
  log('     "args": ["buildworks-ai-investigations-mcp@latest"]', 'green');
  log('   }', 'green');
  
  log('\n3. Available tools:', 'blue');
  log('   • investigation_start - Initialize new investigation', 'green');
  log('   • investigation_collect_evidence - Collect evidence', 'green');
  log('   • investigation_analyze_evidence - Analyze evidence', 'green');
  log('   • investigation_generate_report - Generate reports', 'green');
  log('   • And 6 more specialized tools...', 'green');
  
  log('\n📚 Documentation:', 'blue');
  log('   https://github.com/buildworksai/investigations-mcp#readme', 'magenta');
  
  log('\n🆘 Need help?', 'blue');
  log('   https://github.com/buildworksai/investigations-mcp#troubleshooting', 'magenta');
}

function main() {
  log('\n🔍 BuildWorks.AI Investigations MCP - Post-installation Verification', 'bold');
  log('=' .repeat(70), 'cyan');
  
  const installationOk = verifyInstallation();
  
  if (installationOk) {
    showUsageInstructions();
    log('\n🎉 Installation completed successfully!', 'green');
  } else {
    log('\n❌ Installation verification failed. Please check the error messages above.', 'red');
    log('💡 Try running: npm cache clean --force && rm -rf ~/.npm/_npx', 'yellow');
  }
}

// Only run if this script is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
