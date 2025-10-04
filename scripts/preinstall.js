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

async function checkNpmCache() {
  try {
    const npmCachePath = join(homedir(), '.npm');
    const npxCachePath = join(homedir(), '.npm', '_npx');
    
    if (existsSync(npxCachePath)) {
      log('⚠️  Detected npx cache directory. Checking for corrupted better-sqlite3 installations...', 'yellow');
      
      // Check for corrupted better-sqlite3 installations in npx cache
      try {
        const { readdirSync, statSync } = await import('fs');
        const cacheEntries = readdirSync(npxCachePath);
        
        for (const entry of cacheEntries) {
          const entryPath = join(npxCachePath, entry);
          if (statSync(entryPath).isDirectory()) {
            const betterSqlitePath = join(entryPath, 'node_modules', 'better-sqlite3');
            const bindingPath = join(betterSqlitePath, 'lib', 'binding');
            const buildPath = join(betterSqlitePath, 'build', 'Release', 'better_sqlite3.node');
            
            if (existsSync(betterSqlitePath) && existsSync(buildPath) && !existsSync(bindingPath)) {
              log('🚨 Found corrupted better-sqlite3 installation in npx cache!', 'red');
              log(`   Cache entry: ${entry}`, 'red');
              log('   Missing lib/binding directory structure', 'red');
              return 'corrupted';
            }
          }
        }
      } catch (error) {
        // If we can't check, assume potential corruption
        log('⚠️  Could not verify npx cache integrity', 'yellow');
      }
      
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
    const nodeModuleVersion = process.versions.modules;
    
    // Expected NODE_MODULE_VERSION for different Node.js versions
    const expectedModuleVersions = {
      16: 108,
      18: 137,
      20: 115,
      22: 127
    };
    
    if (majorVersion < 18) {
      log(`❌ Node.js version ${version} is not supported. Please upgrade to Node.js 18 or higher.`, 'red');
      return false;
    }
    
    // Check NODE_MODULE_VERSION compatibility
    const expectedVersion = expectedModuleVersions[majorVersion];
    if (expectedVersion && nodeModuleVersion != expectedVersion) {
      log(`⚠️  NODE_MODULE_VERSION mismatch detected!`, 'yellow');
      log(`   Node.js ${version} reports NODE_MODULE_VERSION ${nodeModuleVersion}`, 'yellow');
      log(`   Expected NODE_MODULE_VERSION for Node.js ${majorVersion}: ${expectedVersion}`, 'yellow');
      log(`   This may cause "failed to initialize server" errors with better-sqlite3.`, 'yellow');
      log(`   Consider reinstalling Node.js or using a different Node.js version.`, 'yellow');
    }
    
    log(`✅ Node.js version ${version} is supported.`, 'green');
    log(`✅ NODE_MODULE_VERSION: ${nodeModuleVersion}`, 'green');
    return true;
  } catch (error) {
    log('⚠️  Could not determine Node.js version.', 'yellow');
    return true;
  }
}

function provideCacheClearingInstructions(isCorrupted = false) {
  if (isCorrupted) {
    log('\n🚨 CRITICAL: Corrupted npx cache detected!', 'red');
    log('This will cause "failed to initialize server" errors.', 'red');
    log('\n🔧 REQUIRED: Clear corrupted cache before proceeding:', 'cyan');
  } else {
    log('\n🔧 If you encounter installation issues, try these steps:', 'cyan');
  }
  
  log('1. Clear npm cache: npm cache clean --force', 'blue');
  log('2. Clear npx cache: rm -rf ~/.npm/_npx', 'blue');
  log('3. Retry installation: npx buildworks-ai-investigations-mcp@latest', 'blue');
  
  if (isCorrupted) {
    log('\n⚠️  Installation will likely FAIL without clearing the cache first!', 'yellow');
  }
  
  log('\n🔧 For NODE_MODULE_VERSION issues:', 'cyan');
  log('1. Reinstall Node.js from official source: https://nodejs.org/', 'blue');
  log('2. Use Node Version Manager (nvm): nvm install 18 && nvm use 18', 'blue');
  log('3. Clear all caches and reinstall: npm cache clean --force && rm -rf ~/.npm/_npx', 'blue');
  
  log('\n📖 For more help, see: https://github.com/buildworksai/investigations-mcp#troubleshooting', 'magenta');
}

async function main() {
  log('🔍 BuildWorks.AI Investigations MCP - Pre-installation Check', 'bold');
  log('=' .repeat(60), 'cyan');
  
  const cacheStatus = await checkNpmCache();
  const nodeVersionOk = checkNodeVersion();
  
  if (cacheStatus === 'corrupted') {
    provideCacheClearingInstructions(true);
    log('\n❌ Pre-installation check FAILED: Corrupted cache detected!', 'red');
    log('Please clear the cache and retry installation.', 'red');
    process.exit(1);
  } else if (cacheStatus) {
    provideCacheClearingInstructions(false);
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
