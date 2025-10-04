#!/usr/bin/env node

/**
 * Global Installation Update Script
 * Updates the global installation to the latest version
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

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

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    log('❌ Could not read package.json', 'red');
    process.exit(1);
  }
}

function getGlobalVersion() {
  try {
    const globalVersion = execSync('npm list -g buildworks-ai-investigations-mcp --depth=0', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (globalVersion.includes('buildworks-ai-investigations-mcp@')) {
      const match = globalVersion.match(/buildworks-ai-investigations-mcp@([^\s]+)/);
      return match ? match[1] : null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function updateGlobalInstallation(version) {
  try {
    log(`🔄 Updating global installation to version ${version}...`, 'blue');
    
    execSync(`npm install -g buildworks-ai-investigations-mcp@${version}`, {
      stdio: 'inherit',
      timeout: 30000
    });
    
    log(`✅ Global installation updated to version ${version}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to update global installation: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n🔧 BuildWorks.AI Investigations MCP - Global Installation Update', 'bold');
  log('=' .repeat(60), 'cyan');
  
  const currentVersion = getCurrentVersion();
  const globalVersion = getGlobalVersion();
  
  log(`Current package version: ${currentVersion}`, 'blue');
  
  if (globalVersion) {
    log(`Global installation version: ${globalVersion}`, 'blue');
    
    if (globalVersion === currentVersion) {
      log('✅ Global installation is already up to date!', 'green');
      return;
    }
    
    log(`🔄 Updating from ${globalVersion} to ${currentVersion}...`, 'yellow');
  } else {
    log('📦 No global installation found, installing...', 'yellow');
  }
  
  const success = updateGlobalInstallation(currentVersion);
  
  if (success) {
    log('\n🎉 Global installation update completed successfully!', 'green');
    log('\n💡 You can now use:', 'blue');
    log('   buildworks-ai-investigations-mcp --version', 'green');
    log('   npx buildworks-ai-investigations-mcp@latest --version', 'green');
  } else {
    log('\n❌ Global installation update failed.', 'red');
    log('💡 Try running manually:', 'yellow');
    log(`   npm install -g buildworks-ai-investigations-mcp@${currentVersion}`, 'green');
  }
}

// Only run if this script is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
