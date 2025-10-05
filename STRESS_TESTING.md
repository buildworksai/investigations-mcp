# Stress Testing Guide for Investigations MCP

This guide explains how to run stress tests to validate the system's performance and reliability under heavy load.

## Overview

The stress testing suite creates 60-70 heavy, bulky investigations with extensive data to test:
- System performance under load
- Memory usage and management
- File I/O operations
- Database operations
- Error handling
- Concurrent access

## Available Tests

### 1. Simple Stress Test (Recommended)
**Command:** `npm run test:stress`

Creates 65 investigations with:
- 10 evidence items per investigation
- 5 analyses per investigation
- Heavy metadata and content
- Basic performance monitoring

**Duration:** ~5-10 minutes
**Memory Usage:** ~200-500MB

### 2. Full Stress Test (Comprehensive)
**Command:** `npm run test:stress:full`

Creates 65 investigations with:
- 15 evidence items per investigation
- 8 analyses per investigation
- 12 findings per analysis
- 5MB data per evidence item
- Comprehensive health monitoring
- Memory tracking
- Performance metrics

**Duration:** ~20-30 minutes
**Memory Usage:** ~1-2GB

### 3. Built Stress Test
**Command:** `npm run test:stress:build`

Runs the simple stress test using the built JavaScript version with increased memory limits.

## Test Configuration

### Environment Variables
```bash
export NODE_ENV=test
export INVESTIGATIONS_STORAGE_PATH="./.investigations-stress-test"
export INVESTIGATIONS_MAX_COUNT=100
export INVESTIGATIONS_LOG_LEVEL=info
export INVESTIGATIONS_ENABLE_VALIDATION=true
export INVESTIGATIONS_ENABLE_SECURITY=true
export INVESTIGATIONS_ENABLE_AUDIT=true
```

### Test Data Characteristics
- **Investigations**: 65 heavy investigations with detailed metadata
- **Evidence**: Large log files with 1-5MB of data each
- **Analysis**: Complex analysis results with multiple findings
- **Metadata**: Extensive metadata with performance metrics
- **Tags**: Multiple tags for search testing

## Running the Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Quick Test
```bash
# Run simple stress test
npm run test:stress
```

### Comprehensive Test
```bash
# Run full stress test with monitoring
npm run test:stress:full
```

### Using the Shell Script
```bash
# Make executable
chmod +x scripts/run-stress-test.sh

# Run with proper environment setup
./scripts/run-stress-test.sh
```

## What Gets Tested

### 1. Data Creation
- Investigation creation with heavy metadata
- Evidence collection with large files
- Analysis generation with multiple findings
- FIFO limit enforcement (50 investigations)

### 2. System Operations
- List all investigations
- Search operations with various terms
- Update operations on existing data
- Delete operations
- Concurrent read/write operations

### 3. Performance Metrics
- Average time per investigation creation
- Memory usage patterns
- File I/O performance
- Database operation timing

### 4. Error Handling
- Error detection and reporting
- System recovery from errors
- Graceful degradation

### 5. Health Monitoring
- System health checks
- Memory usage monitoring
- Performance tracking
- Error rate monitoring

## Expected Results

### Performance Benchmarks
- **Investigation Creation**: < 2 seconds per investigation
- **Memory Usage**: < 500MB for simple test, < 2GB for full test
- **Search Operations**: < 3 seconds for complex queries
- **Update Operations**: < 2 seconds per update

### Success Criteria
- ✅ All investigations created successfully
- ✅ No fatal errors during test execution
- ✅ Memory usage within acceptable limits
- ✅ Performance within benchmark thresholds
- ✅ All CRUD operations working correctly

## Troubleshooting

### Common Issues

#### 1. Memory Issues
```bash
# Increase memory limit
node --max-old-space-size=4096 scripts/simple-stress-test.ts
```

#### 2. Storage Issues
```bash
# Check available disk space
df -h

# Clean up old test data
rm -rf ./.investigations-stress-test
```

#### 3. Permission Issues
```bash
# Fix script permissions
chmod +x scripts/run-stress-test.sh
chmod +x scripts/stress-test.ts
chmod +x scripts/simple-stress-test.ts
```

### Debug Mode
```bash
# Run with debug logging
INVESTIGATIONS_LOG_LEVEL=debug npm run test:stress
```

## Test Reports

### Simple Test Output
```
🚀 Starting Simple Stress Test
📊 Will create 65 investigations
📁 Each with 10 evidence items
🔍 Each with 5 analyses
==================================================
🔧 Initializing database...
✅ Database initialized

📝 Creating investigations...
Creating investigation 1/65...
Creating investigation 2/65...
...
📊 Memory: 245.67MB

🧪 Testing operations...
  📋 Testing list operations...
  ✅ Listed 65 investigations
  🔍 Testing search operations...
  ✅ Found 45 matching investigations
  ✏️ Testing update operations...
  ✅ Updated investigation
  📊 Testing get operations...
  ✅ Retrieved investigation: Stress Test Investigation #1

==================================================
📊 STRESS TEST RESULTS
==================================================
⏱️  Duration: 127.45 seconds
📝 Investigations: 65
📁 Evidence: 650
🔍 Analysis: 325
❌ Errors: 0
💾 Memory Used: 245.67MB
💾 Memory Total: 512.00MB

📈 Performance:
  Average time per investigation: 1.96s
  ✅ Performance: Good

💾 Memory usage: Acceptable

🎯 RECOMMENDATIONS:
  • Consider implementing rate limiting for bulk operations
  • Monitor disk space usage with large datasets

🎉 Stress test completed successfully!
```

### Full Test Report
The full stress test generates a detailed JSON report (`stress-test-report.json`) with:
- Complete test configuration
- Performance metrics
- Memory usage analysis
- Health check results
- Error details
- Recommendations

## Interpreting Results

### Performance Analysis
- **Good**: < 2s per investigation, < 500MB memory
- **Acceptable**: 2-5s per investigation, 500MB-1GB memory
- **Poor**: > 5s per investigation, > 1GB memory

### Error Analysis
- **No Errors**: System is stable and reliable
- **Few Errors**: Minor issues, system mostly stable
- **Many Errors**: Significant issues, needs investigation

### Memory Analysis
- **Stable**: Memory usage remains consistent
- **Growing**: Memory usage increases over time (potential leak)
- **Spiking**: Memory usage spikes during operations

## Production Readiness

### Pass Criteria
- ✅ All tests pass without fatal errors
- ✅ Performance within acceptable limits
- ✅ Memory usage stable and reasonable
- ✅ All CRUD operations working correctly
- ✅ System recovers gracefully from errors

### Fail Criteria
- ❌ Fatal errors during test execution
- ❌ Performance significantly below benchmarks
- ❌ Memory leaks or excessive usage
- ❌ Data corruption or loss
- ❌ System crashes or hangs

## Continuous Testing

### Automated Testing
```bash
# Add to CI/CD pipeline
npm run test:stress
```

### Regular Testing
- Run simple stress test weekly
- Run full stress test monthly
- Run after major changes
- Run before production deployments

## Support

For issues with stress testing:
1. Check the troubleshooting section
2. Review test logs and reports
3. Verify system requirements
4. Contact the development team

---

**Note**: Stress tests create large amounts of data. Ensure you have sufficient disk space and memory before running the tests.
