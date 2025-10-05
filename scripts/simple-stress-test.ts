#!/usr/bin/env tsx

/**
 * Simple Stress Test for Investigations MCP
 * Creates heavy investigations to test system performance
 */

import { InvestigationDatabase } from '../src/services/database.js';
import { InvestigationCase, EvidenceItem, AnalysisResult } from '../src/types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';

interface TestConfig {
  investigationCount: number;
  evidencePerInvestigation: number;
  analysisPerInvestigation: number;
}

class SimpleStressTester {
  private config: TestConfig;
  private database: InvestigationDatabase;
  private startTime: number = 0;
  private errors: Array<{ type: string; message: string }> = [];

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      investigationCount: 65, // 60-70 range
      evidencePerInvestigation: 10,
      analysisPerInvestigation: 5,
      ...config
    };

    this.database = new InvestigationDatabase();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Simple Stress Test');
    console.log(`📊 Will create ${this.config.investigationCount} investigations`);
    console.log(`📁 Each with ${this.config.evidencePerInvestigation} evidence items`);
    console.log(`🔍 Each with ${this.config.analysisPerInvestigation} analyses`);
    console.log('='.repeat(50));

    this.startTime = performance.now();

    try {
      // Initialize database
      console.log('🔧 Initializing database...');
      await this.database.initialize();
      console.log('✅ Database initialized');

      // Create investigations
      console.log('\n📝 Creating investigations...');
      await this.createInvestigations();

      // Test operations
      console.log('\n🧪 Testing operations...');
      await this.testOperations();

      // Generate report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Stress test failed:', error);
      this.errors.push({
        type: 'FATAL_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async createInvestigations(): Promise<void> {
    for (let i = 0; i < this.config.investigationCount; i++) {
      try {
        console.log(`Creating investigation ${i + 1}/${this.config.investigationCount}...`);

        // Create investigation
        const investigation = await this.createInvestigation(i + 1);

        // Create evidence
        for (let j = 0; j < this.config.evidencePerInvestigation; j++) {
          await this.createEvidence(investigation.id, j + 1);
        }

        // Create analysis
        for (let k = 0; k < this.config.analysisPerInvestigation; k++) {
          await this.createAnalysis(investigation.id, k + 1);
        }

        // Progress update
        if ((i + 1) % 10 === 0) {
          const memUsage = process.memoryUsage();
          console.log(`  📊 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }

      } catch (error) {
        console.error(`❌ Failed to create investigation ${i + 1}:`, error);
        this.errors.push({
          type: 'INVESTIGATION_ERROR',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async createInvestigation(index: number): Promise<InvestigationCase> {
    const investigation: InvestigationCase = {
      id: uuidv4(),
      title: `Stress Test Investigation #${index}`,
      description: this.generateHeavyDescription(),
      status: 'active',
      priority: 'high',
      assigned_to: `tester-${index}@buildworks.ai`,
      tags: ['stress-test', 'performance', 'bulk'],
      metadata: {
        stressTest: true,
        testIndex: index,
        heavyData: this.generateHeavyData(),
        performance: {
          testLoad: 'heavy',
          category: 'bulk-operations'
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.database.createInvestigation(investigation);
    return investigation;
  }

  private async createEvidence(investigationId: string, index: number): Promise<void> {
    const evidence: EvidenceItem = {
      id: uuidv4(),
      investigation_id: investigationId,
      type: 'log',
      source: `/var/log/stress-test-${index}.log`,
      content: {
        rawData: this.generateLargeString(),
        metadata: {
          size: 1024 * 1024, // 1MB
          lines: 10000,
          stressTest: true
        }
      },
      metadata: {
        timestamp: new Date(),
        size: 1024 * 1024,
        checksum: this.generateChecksum(),
        collected_by: 'stress-tester@buildworks.ai',
        collection_method: 'automated',
        source_system: 'stress-test',
        heavyData: this.generateHeavyData()
      },
      tags: ['stress-test', 'log'],
      created_at: new Date()
    };

    await this.database.addEvidence(evidence);
  }

  private async createAnalysis(investigationId: string, index: number): Promise<void> {
    const analysis: AnalysisResult = {
      id: uuidv4(),
      investigation_id: investigationId,
      analysis_type: 'performance',
      results: {
        summary: this.generateHeavyDescription(),
        detailedResults: this.generateHeavyData(),
        metrics: Array.from({ length: 100 }, (_, i) => ({
          name: `metric_${i}`,
          value: Math.random() * 100,
          unit: 'percentage'
        }))
      },
      confidence_score: Math.random(),
      methodology: 'Comprehensive analysis using multiple techniques including statistical analysis, pattern recognition, and correlation analysis.',
      findings: Array.from({ length: 5 }, (_, i) => ({
        id: uuidv4(),
        title: `Finding ${i + 1}: Performance Issue`,
        description: this.generateHeavyDescription(),
        confidence: Math.random(),
        evidence_ids: [uuidv4()],
        impact: 'high',
        category: 'performance'
      })),
      recommendations: [
        'Implement comprehensive monitoring',
        'Optimize database queries',
        'Add caching layer',
        'Improve error handling',
        'Enhance logging system'
      ],
      created_at: new Date()
    };

    await this.database.addAnalysisResult(analysis);
  }

  private async testOperations(): Promise<void> {
    console.log('  📋 Testing list operations...');
    const investigations = await this.database.listInvestigations();
    console.log(`  ✅ Listed ${investigations.length} investigations`);

    console.log('  🔍 Testing search operations...');
    // Use listInvestigations with filters instead of searchInvestigations
    const searchResults = await this.database.listInvestigations({ 
      tags: ['stress-test'],
      status: 'active'
    });
    console.log(`  ✅ Found ${searchResults.length} matching investigations`);

    console.log('  ✏️ Testing update operations...');
    if (investigations.length > 0) {
      const investigation = investigations[0];
      await this.database.updateInvestigation(investigation.id, {
        updated_at: new Date(),
        metadata: {
          ...investigation.metadata,
          lastUpdated: new Date().toISOString()
        }
      });
      console.log('  ✅ Updated investigation');
    }

    console.log('  📊 Testing get operations...');
    if (investigations.length > 0) {
      const investigation = investigations[0];
      const retrieved = await this.database.getInvestigation(investigation.id);
      console.log(`  ✅ Retrieved investigation: ${retrieved?.title}`);
    }
  }

  private async generateReport(): Promise<void> {
    const duration = (performance.now() - this.startTime) / 1000;
    const memUsage = process.memoryUsage();

    console.log('\n' + '='.repeat(50));
    console.log('📊 STRESS TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📝 Investigations: ${this.config.investigationCount}`);
    console.log(`📁 Evidence: ${this.config.investigationCount * this.config.evidencePerInvestigation}`);
    console.log(`🔍 Analysis: ${this.config.investigationCount * this.config.analysisPerInvestigation}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`💾 Memory Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`💾 Memory Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);

    if (this.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      this.errors.forEach(error => {
        console.log(`  ${error.type}: ${error.message}`);
      });
    }

    // Performance assessment
    const avgTimePerInvestigation = duration / this.config.investigationCount;
    console.log(`\n📈 Performance:`);
    console.log(`  Average time per investigation: ${avgTimePerInvestigation.toFixed(2)}s`);
    
    if (avgTimePerInvestigation > 2) {
      console.log('  ⚠️  Performance warning: Slow investigation creation');
    } else {
      console.log('  ✅ Performance: Good');
    }

    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.log('  ⚠️  Memory warning: High memory usage');
    } else {
      console.log('  ✅ Memory usage: Acceptable');
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.errors.length > 0) {
      console.log('  • Fix all errors before production deployment');
    }
    if (avgTimePerInvestigation > 2) {
      console.log('  • Optimize investigation creation performance');
    }
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      console.log('  • Monitor memory usage and implement cleanup strategies');
    }
    console.log('  • Consider implementing rate limiting for bulk operations');
    console.log('  • Monitor disk space usage with large datasets');
  }

  // Helper methods
  private generateHeavyDescription(): string {
    const base = 'This is a comprehensive investigation into a critical system issue. ';
    return base.repeat(100); // ~5KB description
  }

  private generateHeavyData(): Record<string, any> {
    const data: Record<string, any> = {};
    for (let i = 0; i < 1000; i++) {
      data[`field_${i}`] = {
        value: Math.random().toString(36),
        timestamp: new Date(),
        metadata: {
          index: i,
          category: 'stress-test',
          size: Math.floor(Math.random() * 1000)
        }
      };
    }
    return data;
  }

  private generateLargeString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10000; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateChecksum(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Main execution
async function main() {
  const config: Partial<TestConfig> = {
    investigationCount: 65, // 60-70 range
    evidencePerInvestigation: 10,
    analysisPerInvestigation: 5
  };

  const stressTester = new SimpleStressTester(config);
  
  try {
    await stressTester.run();
    console.log('\n🎉 Stress test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Stress test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stress test interrupted by user');
  process.exit(0);
});

// Run the stress test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
