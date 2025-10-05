#!/usr/bin/env node

/**
 * Prepare for publishing script
 * Validates the package is ready for publishing
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const PACKAGE_JSON = './package.json';
const DIST_DIR = './dist';
const REQUIRED_FILES = [
  'dist/index.js',
  'README.md',
  'SETUP.md'
];

async function checkPackageJson() {
  console.log('📦 Checking package.json...');
  
  const pkg = await fs.readJson(PACKAGE_JSON);
  
  // Check required fields
  const required = ['name', 'version', 'description', 'main', 'bin'];
  for (const field of required) {
    if (!pkg[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check version format
  if (!/^\d+\.\d+\.\d+/.test(pkg.version)) {
    throw new Error(`Invalid version format: ${pkg.version}`);
  }
  
  console.log(`✅ Package: ${pkg.name}@${pkg.version}`);
  return pkg;
}

async function checkBuild() {
  console.log('🔨 Checking build...');
  
  if (!await fs.pathExists(DIST_DIR)) {
    throw new Error('dist/ directory not found. Run "npm run build" first.');
  }
  
  if (!await fs.pathExists('dist/index.js')) {
    throw new Error('dist/index.js not found. Build may have failed.');
  }
  
  // Test the built version
  try {
    const version = execSync('node dist/index.js --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Built version: ${version}`);
  } catch (error) {
    throw new Error('Built package failed to run: ' + error.message);
  }
}

async function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  
  for (const file of REQUIRED_FILES) {
    if (!await fs.pathExists(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  console.log('✅ All required files present');
}

async function checkTests() {
  console.log('🧪 Running tests...');
  
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passed');
  } catch (error) {
    throw new Error('Tests failed. Fix tests before publishing.');
  }
}

async function checkLinting() {
  console.log('🔍 Checking linting...');
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ Linting passed');
  } catch (error) {
    console.log('⚠️ Linting issues found, but continuing...');
  }
}

async function checkGitStatus() {
  console.log('📋 Checking git status...');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️ Uncommitted changes detected:');
      console.log(status);
      console.log('Consider committing changes before publishing.');
    } else {
      console.log('✅ Working directory clean');
    }
  } catch (error) {
    console.log('⚠️ Could not check git status');
  }
}

async function checkRegistry() {
  console.log('🌐 Checking registry status...');
  
  try {
    const pkg = await fs.readJson(PACKAGE_JSON);
    const published = execSync(`npm view ${pkg.name} version`, { encoding: 'utf8' }).trim();
    
    if (published === pkg.version) {
      console.log(`⚠️ Version ${pkg.version} already published to npm`);
      console.log('Consider bumping version before publishing.');
    } else {
      console.log(`✅ Version ${pkg.version} not yet published (latest: ${published})`);
    }
  } catch (error) {
    console.log('✅ Package not found in registry (first publish)');
  }
}

async function main() {
  try {
    console.log('🚀 Preparing package for publishing...\n');
    
    await checkPackageJson();
    await checkBuild();
    await checkRequiredFiles();
    await checkTests();
    await checkLinting();
    await checkGitStatus();
    await checkRegistry();
    
    console.log('\n🎉 Package is ready for publishing!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a git tag: git tag v' + (await fs.readJson(PACKAGE_JSON)).version);
    console.log('2. Push the tag: git push origin v' + (await fs.readJson(PACKAGE_JSON)).version);
    console.log('3. The GitHub Action will automatically publish to both npmjs.org and GitHub Packages');
    console.log('\nOr manually publish with: npm publish');
    
  } catch (error) {
    console.error('\n❌ Preparation failed:', error.message);
    process.exit(1);
  }
}

main();
