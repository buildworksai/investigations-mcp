#!/usr/bin/env node

/**
 * Pre-install script for buildworks-ai-investigations-mcp
 * Detects and helps resolve common npm/npx cache issues
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

function checkNpmCache() {
  try {
    const npmCachePath = join(homedir(), '.npm');
    const npxCachePath = join(homedir(), '.npm', '_npx');
    
    if (existsSync(npxCachePath)) {
      log('⚠️  Detected npx cache directory. This may cause installation issues.', 'yellow');
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      log(`❌ Node.js version ${version} is not supported. Please upgrade to Node.js 18 or higher.`, 'red');
      return false;
    }
    
    log(`✅ Node.js version ${version} is supported.`, 'green');
    return true;
  } catch (error) {
    log('⚠️  Could not determine Node.js version.', 'yellow');
    return true;
  }
}

function provideCacheClearingInstructions() {
  log('\n🔧 If you encounter installation issues, try these steps:', 'cyan');
  log('1. Clear npm cache: npm cache clean --force', 'blue');
  log('2. Clear npx cache: rm -rf ~/.npm/_npx', 'blue');
  log('3. Retry installation: npx buildworks-ai-investigations-mcp@latest', 'blue');
  log('\n📖 For more help, see: https://github.com/buildworksai/investigations-mcp#troubleshooting', 'magenta');
}

function main() {
  log('🔍 BuildWorks.AI Investigations MCP - Pre-installation Check', 'bold');
  log('=' .repeat(60), 'cyan');
  
  const hasCacheIssues = checkNpmCache();
  const nodeVersionOk = checkNodeVersion();
  
  if (hasCacheIssues) {
    provideCacheClearingInstructions();
  }
  
  if (!nodeVersionOk) {
    process.exit(1);
  }
  
  log('\n✅ Pre-installation checks completed successfully!', 'green');
  log('🚀 Proceeding with installation...\n', 'green');
}

// Only run if this script is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
