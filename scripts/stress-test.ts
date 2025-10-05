#!/usr/bin/env tsx

/**
 * Stress Testing Script for Investigations MCP
 * Creates 60-70 heavy, bulky investigations to test system performance
 */

import { InvestigationDatabase } from '../src/services/database.js';
import { InvestigationCase, EvidenceItem, AnalysisResult, Finding } from '../src/types/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import { performance } from 'perf_hooks';
import { logger } from '../src/utils/logger.js';
import { HealthMonitor } from '../src/utils/health-monitor.js';

interface StressTestConfig {
  investigationCount: number;
  evidencePerInvestigation: number;
  analysisPerInvestigation: number;
  findingsPerAnalysis: number;
  largeFileSize: number; // in bytes
  enableHealthMonitoring: boolean;
  enableMemoryTracking: boolean;
  testDuration: number; // in minutes
}

interface TestMetrics {
  startTime: number;
  endTime?: number;
  investigationsCreated: number;
  evidenceCreated: number;
  analysisCreated: number;
  findingsCreated: number;
  errors: Array<{ type: string; message: string; timestamp: Date }>;
  memorySnapshots: Array<{ timestamp: Date; memory: NodeJS.MemoryUsage }>;
  healthChecks: Array<{ timestamp: Date; status: string; details: any }>;
  performanceMetrics: {
    averageInvestigationTime: number;
    averageEvidenceTime: number;
    averageAnalysisTime: number;
    totalDataSize: number;
  };
}

class StressTester {
  private config: StressTestConfig;
  private database: InvestigationDatabase;
  private metrics: TestMetrics;
  private healthMonitor: HealthMonitor;
  private isRunning: boolean = false;

  constructor(config: Partial<StressTestConfig> = {}) {
    this.config = {
      investigationCount: 65, // 60-70 range
      evidencePerInvestigation: 15, // Heavy evidence load
      analysisPerInvestigation: 8, // Multiple analyses
      findingsPerAnalysis: 12, // Many findings per analysis
      largeFileSize: 5 * 1024 * 1024, // 5MB per large file
      enableHealthMonitoring: true,
      enableMemoryTracking: true,
      testDuration: 30, // 30 minutes
      ...config
    };

    this.database = new InvestigationDatabase();
    this.healthMonitor = HealthMonitor.getInstance();
    this.metrics = {
      startTime: 0,
      investigationsCreated: 0,
      evidenceCreated: 0,
      analysisCreated: 0,
      findingsCreated: 0,
      errors: [],
      memorySnapshots: [],
      healthChecks: [],
      performanceMetrics: {
        averageInvestigationTime: 0,
        averageEvidenceTime: 0,
        averageAnalysisTime: 0,
        totalDataSize: 0
      }
    };
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Stress Test for Investigations MCP');
    console.log(`📊 Configuration:`, this.config);
    console.log('='.repeat(60));

    this.isRunning = true;
    this.metrics.startTime = performance.now();

    try {
      // Initialize database
      await this.database.initialize();
      console.log('✅ Database initialized');

      // Start monitoring
      if (this.config.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }

      if (this.config.enableMemoryTracking) {
        this.startMemoryTracking();
      }

      // Create investigations
      await this.createHeavyInvestigations();

      // Run system tests
      await this.runSystemTests();

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Stress test failed:', error);
      this.metrics.errors.push({
        type: 'FATAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    } finally {
      this.isRunning = false;
      this.metrics.endTime = performance.now();
    }
  }

  private async createHeavyInvestigations(): Promise<void> {
    console.log(`\n🔨 Creating ${this.config.investigationCount} heavy investigations...`);

    for (let i = 0; i < this.config.investigationCount; i++) {
      try {
        const startTime = performance.now();
        
        // Create investigation
        const investigation = await this.createHeavyInvestigation(i + 1);
        this.metrics.investigationsCreated++;

        // Create evidence
        const evidenceTime = performance.now();
        await this.createHeavyEvidence(investigation.id);
        this.metrics.performanceMetrics.averageEvidenceTime += (performance.now() - evidenceTime);

        // Create analysis
        const analysisTime = performance.now();
        await this.createHeavyAnalysis(investigation.id);
        this.metrics.performanceMetrics.averageAnalysisTime += (performance.now() - analysisTime);

        this.metrics.performanceMetrics.averageInvestigationTime += (performance.now() - startTime);

        // Progress update
        if ((i + 1) % 10 === 0) {
          console.log(`📈 Progress: ${i + 1}/${this.config.investigationCount} investigations created`);
          await this.logCurrentMetrics();
        }

        // Small delay to prevent overwhelming the system
        await this.delay(100);

      } catch (error) {
        console.error(`❌ Failed to create investigation ${i + 1}:`, error);
        this.metrics.errors.push({
          type: 'INVESTIGATION_CREATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    // Calculate averages
    this.metrics.performanceMetrics.averageInvestigationTime /= this.config.investigationCount;
    this.metrics.performanceMetrics.averageEvidenceTime /= this.config.investigationCount;
    this.metrics.performanceMetrics.averageAnalysisTime /= this.config.investigationCount;

    console.log(`✅ Created ${this.metrics.investigationsCreated} investigations`);
  }

  private async createHeavyInvestigation(index: number): Promise<InvestigationCase> {
    const investigation: InvestigationCase = {
      id: uuidv4(),
      title: `Heavy Stress Test Investigation #${index} - ${this.generateRandomTitle()}`,
      description: this.generateHeavyDescription(),
      status: 'active',
      priority: this.getRandomPriority(),
      assigned_to: `stress-tester-${index}@buildworks.ai`,
      tags: this.generateRandomTags(),
      metadata: {
        stressTest: true,
        testIndex: index,
        createdBy: 'stress-tester',
        testData: this.generateLargeMetadata(),
        performance: {
          expectedLoad: 'heavy',
          testCategory: 'bulk-operations'
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.database.createInvestigation(investigation);
    return investigation;
  }

  private async createHeavyEvidence(investigationId: string): Promise<void> {
    for (let i = 0; i < this.config.evidencePerInvestigation; i++) {
      try {
        const evidence: EvidenceItem = {
          id: uuidv4(),
          investigation_id: investigationId,
          type: this.getRandomEvidenceType(),
          source: this.generateHeavySource(),
          content: this.generateHeavyEvidenceContent(),
          metadata: {
            timestamp: new Date(),
            size: this.config.largeFileSize,
            checksum: this.generateChecksum(),
            collected_by: 'stress-tester@buildworks.ai',
            collection_method: 'automated-stress-test',
            source_system: 'stress-test-environment',
            stressTest: true,
            largeData: this.generateLargeDataObject(),
            performance: {
              testLoad: 'heavy',
              dataSize: this.config.largeFileSize
            }
          },
          chain_of_custody: this.generateChainOfCustody(),
          tags: this.generateRandomTags(),
          created_at: new Date()
        };

        await this.database.addEvidence(evidence);
        this.metrics.evidenceCreated++;

      } catch (error) {
        this.metrics.errors.push({
          type: 'EVIDENCE_CREATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }
  }

  private async createHeavyAnalysis(investigationId: string): Promise<void> {
    for (let i = 0; i < this.config.analysisPerInvestigation; i++) {
      try {
        const analysis: AnalysisResult = {
          id: uuidv4(),
          investigation_id: investigationId,
          analysis_type: this.getRandomAnalysisType(),
          results: this.generateHeavyAnalysisResults(),
          confidence_score: Math.random(),
          methodology: this.generateHeavyMethodology(),
          findings: this.generateHeavyFindings(),
          recommendations: this.generateHeavyRecommendations(),
          created_at: new Date()
        };

        await this.database.addAnalysis(analysis);
        this.metrics.analysisCreated++;

      } catch (error) {
        this.metrics.errors.push({
          type: 'ANALYSIS_CREATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }
  }

  private async runSystemTests(): Promise<void> {
    console.log('\n🧪 Running system tests...');

    // Test 1: List all investigations
    await this.testListInvestigations();

    // Test 2: Search operations
    await this.testSearchOperations();

    // Test 3: Update operations
    await this.testUpdateOperations();

    // Test 4: Delete operations
    await this.testDeleteOperations();

    // Test 5: Concurrent operations
    await this.testConcurrentOperations();

    // Test 6: Memory stress test
    await this.testMemoryStress();

    console.log('✅ System tests completed');
  }

  private async testListInvestigations(): Promise<void> {
    console.log('📋 Testing list investigations...');
    const startTime = performance.now();
    
    try {
      const investigations = await this.database.listInvestigations();
      const duration = performance.now() - startTime;
      
      console.log(`✅ Listed ${investigations.length} investigations in ${duration.toFixed(2)}ms`);
      
      if (duration > 5000) {
        this.metrics.errors.push({
          type: 'PERFORMANCE_WARNING',
          message: `List investigations took ${duration.toFixed(2)}ms (slow)`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.metrics.errors.push({
        type: 'LIST_INVESTIGATIONS_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  private async testSearchOperations(): Promise<void> {
    console.log('🔍 Testing search operations...');
    
    const searchTerms = ['stress', 'test', 'heavy', 'bulk', 'performance'];
    
    for (const term of searchTerms) {
      try {
        const startTime = performance.now();
        const results = await this.database.searchInvestigations({ query: term });
        const duration = performance.now() - startTime;
        
        console.log(`✅ Search for "${term}" returned ${results.length} results in ${duration.toFixed(2)}ms`);
        
        if (duration > 3000) {
          this.metrics.errors.push({
            type: 'PERFORMANCE_WARNING',
            message: `Search for "${term}" took ${duration.toFixed(2)}ms (slow)`,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.metrics.errors.push({
          type: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }
  }

  private async testUpdateOperations(): Promise<void> {
    console.log('✏️ Testing update operations...');
    
    try {
      const investigations = await this.database.listInvestigations();
      const sampleSize = Math.min(10, investigations.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const investigation = investigations[i];
        const startTime = performance.now();
        
        investigation.updated_at = new Date();
        investigation.metadata = {
          ...investigation.metadata,
          lastUpdated: new Date().toISOString(),
          stressTestUpdate: true
        };
        
        await this.database.updateInvestigation(investigation);
        const duration = performance.now() - startTime;
        
        if (duration > 2000) {
          this.metrics.errors.push({
            type: 'PERFORMANCE_WARNING',
            message: `Update investigation took ${duration.toFixed(2)}ms (slow)`,
            timestamp: new Date()
          });
        }
      }
      
      console.log(`✅ Updated ${sampleSize} investigations`);
    } catch (error) {
      this.metrics.errors.push({
        type: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  private async testDeleteOperations(): Promise<void> {
    console.log('🗑️ Testing delete operations...');
    
    try {
      const investigations = await this.database.listInvestigations();
      const sampleSize = Math.min(5, investigations.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const investigation = investigations[i];
        const startTime = performance.now();
        
        await this.database.deleteInvestigation(investigation.id);
        const duration = performance.now() - startTime;
        
        if (duration > 3000) {
          this.metrics.errors.push({
            type: 'PERFORMANCE_WARNING',
            message: `Delete investigation took ${duration.toFixed(2)}ms (slow)`,
            timestamp: new Date()
          });
        }
      }
      
      console.log(`✅ Deleted ${sampleSize} investigations`);
    } catch (error) {
      this.metrics.errors.push({
        type: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  private async testConcurrentOperations(): Promise<void> {
    console.log('⚡ Testing concurrent operations...');
    
    const concurrentOperations = 10;
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(this.performConcurrentOperation(i));
    }
    
    try {
      await Promise.all(promises);
      console.log(`✅ Completed ${concurrentOperations} concurrent operations`);
    } catch (error) {
      this.metrics.errors.push({
        type: 'CONCURRENT_OPERATION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  private async performConcurrentOperation(index: number): Promise<void> {
    try {
      // Simulate concurrent read/write operations
      const investigations = await this.database.listInvestigations();
      if (investigations.length > 0) {
        const investigation = investigations[0];
        await this.database.getInvestigation(investigation.id);
      }
    } catch (error) {
      throw error;
    }
  }

  private async testMemoryStress(): Promise<void> {
    console.log('🧠 Testing memory stress...');
    
    try {
      // Create large objects to stress memory
      const largeObjects = [];
      for (let i = 0; i < 100; i++) {
        largeObjects.push({
          id: uuidv4(),
          data: this.generateLargeDataObject(),
          timestamp: new Date()
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      console.log('✅ Memory stress test completed');
    } catch (error) {
      this.metrics.errors.push({
        type: 'MEMORY_STRESS_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  private startHealthMonitoring(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      try {
        const healthStatus = await this.healthMonitor.performHealthCheck();
        this.metrics.healthChecks.push({
          timestamp: new Date(),
          status: healthStatus.status,
          details: healthStatus
        });
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private startMemoryTracking(): void {
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      this.metrics.memorySnapshots.push({
        timestamp: new Date(),
        memory: process.memoryUsage()
      });
    }, 10000); // Every 10 seconds
  }

  private async logCurrentMetrics(): Promise<void> {
    const memUsage = process.memoryUsage();
    console.log(`📊 Current Metrics:`);
    console.log(`   Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB used, ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB total`);
    console.log(`   Investigations: ${this.metrics.investigationsCreated}`);
    console.log(`   Evidence: ${this.metrics.evidenceCreated}`);
    console.log(`   Analysis: ${this.metrics.analysisCreated}`);
    console.log(`   Errors: ${this.metrics.errors.length}`);
  }

  private async generateReport(): Promise<void> {
    console.log('\n📊 Generating Stress Test Report...');
    
    const report = {
      testConfiguration: this.config,
      summary: {
        duration: this.metrics.endTime ? (this.metrics.endTime - this.metrics.startTime) / 1000 : 0,
        investigationsCreated: this.metrics.investigationsCreated,
        evidenceCreated: this.metrics.evidenceCreated,
        analysisCreated: this.metrics.analysisCreated,
        findingsCreated: this.metrics.findingsCreated,
        totalErrors: this.metrics.errors.length,
        errorTypes: this.getErrorTypeSummary()
      },
      performance: this.metrics.performanceMetrics,
      memoryUsage: this.getMemorySummary(),
      healthChecks: this.getHealthSummary(),
      errors: this.metrics.errors,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'stress-test-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 STRESS TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${report.summary.duration.toFixed(2)} seconds`);
    console.log(`📊 Investigations: ${report.summary.investigationsCreated}`);
    console.log(`📁 Evidence: ${report.summary.evidenceCreated}`);
    console.log(`🔍 Analysis: ${report.summary.analysisCreated}`);
    console.log(`❌ Errors: ${report.summary.totalErrors}`);
    console.log(`💾 Memory Peak: ${this.getPeakMemoryUsage()}MB`);
    console.log(`📄 Report saved to: ${reportPath}`);
    
    if (report.summary.totalErrors > 0) {
      console.log('\n⚠️  ERRORS DETECTED:');
      report.summary.errorTypes.forEach(({ type, count }) => {
        console.log(`   ${type}: ${count}`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }

  // Helper methods for generating test data
  private generateRandomTitle(): string {
    const titles = [
      'Critical Security Incident',
      'Performance Degradation Analysis',
      'Data Breach Investigation',
      'System Outage Root Cause',
      'Network Intrusion Detection',
      'Application Crash Analysis',
      'Database Corruption Recovery',
      'Malware Infection Cleanup',
      'User Access Violation',
      'Configuration Drift Analysis'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateHeavyDescription(): string {
    const baseDescription = 'This is a comprehensive investigation into a critical system issue that requires detailed analysis and documentation. ';
    const details = 'The incident involves multiple systems, complex interactions, and requires extensive evidence collection and analysis. ';
    const conclusion = 'This investigation will provide detailed findings and recommendations for system improvement and incident prevention.';
    
    return baseDescription + details.repeat(50) + conclusion;
  }

  private generateLargeMetadata(): Record<string, any> {
    return {
      systemInfo: {
        hostname: 'stress-test-host',
        os: 'Linux',
        version: '5.4.0',
        architecture: 'x64',
        memory: '16GB',
        cpu: '8 cores'
      },
      applicationInfo: {
        name: 'stress-test-app',
        version: '1.0.0',
        environment: 'stress-test',
        configuration: this.generateLargeConfig()
      },
      performance: {
        metrics: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 1000),
          value: Math.random() * 100,
          metric: `metric_${i}`
        }))
      },
      logs: Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(),
        level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
        message: `Log entry ${i}: ${this.generateRandomLogMessage()}`
      }))
    };
  }

  private generateLargeConfig(): Record<string, any> {
    const config: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
      config[`setting_${i}`] = {
        value: Math.random().toString(36),
        description: `Configuration setting ${i} for stress testing`,
        type: ['string', 'number', 'boolean'][Math.floor(Math.random() * 3)],
        metadata: {
          category: 'stress-test',
          priority: Math.floor(Math.random() * 5) + 1
        }
      };
    }
    return config;
  }

  private generateRandomLogMessage(): string {
    const messages = [
      'User authentication successful',
      'Database connection established',
      'Cache miss detected',
      'API request processed',
      'Background job completed',
      'Error occurred during processing',
      'Performance threshold exceeded',
      'Security event detected',
      'Configuration updated',
      'System health check passed'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateHeavySource(): string {
    const sources = [
      '/var/log/application.log',
      '/var/log/system.log',
      '/var/log/security.log',
      '/var/log/audit.log',
      '/var/log/nginx/access.log',
      '/var/log/nginx/error.log',
      '/var/log/mysql/error.log',
      '/var/log/apache2/access.log',
      '/var/log/apache2/error.log',
      '/var/log/syslog'
    ];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  private generateHeavyEvidenceContent(): Record<string, any> {
    return {
      rawData: this.generateLargeDataString(),
      parsedData: this.generateLargeDataObject(),
      metadata: {
        fileSize: this.config.largeFileSize,
        encoding: 'utf-8',
        checksum: this.generateChecksum(),
        compression: 'none'
      },
      analysis: {
        patterns: Array.from({ length: 100 }, (_, i) => `pattern_${i}`),
        anomalies: Array.from({ length: 50 }, (_, i) => `anomaly_${i}`),
        correlations: Array.from({ length: 25 }, (_, i) => `correlation_${i}`)
      }
    };
  }

  private generateLargeDataString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < this.config.largeFileSize / 2; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateLargeDataObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (let i = 0; i < 1000; i++) {
      obj[`field_${i}`] = {
        value: Math.random().toString(36),
        timestamp: new Date(),
        metadata: {
          index: i,
          category: 'stress-test',
          size: Math.floor(Math.random() * 1000)
        }
      };
    }
    return obj;
  }

  private generateChecksum(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateChainOfCustody(): Array<{ timestamp: Date; action: string; performed_by: string; notes?: string }> {
    return [
      {
        timestamp: new Date(),
        action: 'collected',
        performed_by: 'stress-tester@buildworks.ai',
        notes: 'Automated collection during stress test'
      },
      {
        timestamp: new Date(),
        action: 'transferred',
        performed_by: 'system@buildworks.ai',
        notes: 'Transferred to analysis system'
      }
    ];
  }

  private generateRandomTags(): string[] {
    const allTags = ['security', 'performance', 'error', 'critical', 'high-priority', 'investigation', 'analysis', 'forensics', 'incident', 'response'];
    const numTags = Math.floor(Math.random() * 5) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
  }

  private getRandomPriority(): 'low' | 'medium' | 'high' | 'critical' {
    const priorities = ['low', 'medium', 'high', 'critical'];
    return priorities[Math.floor(Math.random() * priorities.length)] as any;
  }

  private getRandomEvidenceType(): 'log' | 'file' | 'metric' | 'config' | 'network' | 'process' | 'system' {
    const types = ['log', 'file', 'metric', 'config', 'network', 'process', 'system'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  private getRandomAnalysisType(): 'timeline' | 'causal' | 'performance' | 'security' | 'correlation' | 'statistical' {
    const types = ['timeline', 'causal', 'performance', 'security', 'correlation', 'statistical'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  private generateHeavyAnalysisResults(): Record<string, any> {
    return {
      summary: this.generateHeavyDescription(),
      detailedResults: this.generateLargeDataObject(),
      metrics: Array.from({ length: 100 }, (_, i) => ({
        name: `metric_${i}`,
        value: Math.random() * 100,
        unit: 'percentage',
        threshold: 80
      })),
      correlations: Array.from({ length: 50 }, (_, i) => ({
        source: `source_${i}`,
        target: `target_${i}`,
        strength: Math.random(),
        confidence: Math.random()
      }))
    };
  }

  private generateHeavyMethodology(): string {
    return 'This analysis employed a comprehensive methodology including statistical analysis, pattern recognition, correlation analysis, and machine learning techniques to identify root causes and provide actionable insights. The methodology involved multiple phases of data collection, processing, analysis, and validation to ensure accuracy and reliability of findings.';
  }

  private generateHeavyFindings(): Finding[] {
    const findings: Finding[] = [];
    for (let i = 0; i < this.config.findingsPerAnalysis; i++) {
      findings.push({
        id: uuidv4(),
        title: `Finding ${i + 1}: ${this.generateRandomTitle()}`,
        description: this.generateHeavyDescription(),
        confidence: Math.random(),
        evidence_ids: [uuidv4(), uuidv4()],
        impact: this.getRandomPriority(),
        category: `category_${i}`
      });
    }
    return findings;
  }

  private generateHeavyRecommendations(): string[] {
    const recommendations = [];
    for (let i = 0; i < 10; i++) {
      recommendations.push(`Recommendation ${i + 1}: Implement comprehensive monitoring and alerting for the identified issues to prevent future occurrences and improve system reliability.`);
    }
    return recommendations;
  }

  private getErrorTypeSummary(): Array<{ type: string; count: number }> {
    const errorTypes = new Map<string, number>();
    this.metrics.errors.forEach(error => {
      const count = errorTypes.get(error.type) || 0;
      errorTypes.set(error.type, count + 1);
    });
    return Array.from(errorTypes.entries()).map(([type, count]) => ({ type, count }));
  }

  private getMemorySummary(): { peak: number; average: number; current: number } {
    if (this.metrics.memorySnapshots.length === 0) {
      return { peak: 0, average: 0, current: 0 };
    }

    const memoryValues = this.metrics.memorySnapshots.map(snapshot => snapshot.memory.heapUsed / 1024 / 1024);
    return {
      peak: Math.max(...memoryValues),
      average: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
      current: memoryValues[memoryValues.length - 1]
    };
  }

  private getPeakMemoryUsage(): number {
    const memorySummary = this.getMemorySummary();
    return memorySummary.peak;
  }

  private getHealthSummary(): { healthy: number; degraded: number; unhealthy: number } {
    const summary = { healthy: 0, degraded: 0, unhealthy: 0 };
    this.metrics.healthChecks.forEach(check => {
      summary[check.status as keyof typeof summary]++;
    });
    return summary;
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    
    if (this.metrics.errors.length > 0) {
      recommendations.push('Review and fix all errors identified during the stress test');
    }
    
    if (this.metrics.performanceMetrics.averageInvestigationTime > 1000) {
      recommendations.push('Optimize investigation creation performance - consider caching or batch operations');
    }
    
    if (this.getPeakMemoryUsage() > 1000) {
      recommendations.push('Monitor memory usage - consider implementing memory limits or cleanup strategies');
    }
    
    const healthSummary = this.getHealthSummary();
    if (healthSummary.unhealthy > 0) {
      recommendations.push('Address health check failures to ensure system stability');
    }
    
    if (this.metrics.performanceMetrics.averageEvidenceTime > 500) {
      recommendations.push('Optimize evidence creation performance');
    }
    
    if (this.metrics.performanceMetrics.averageAnalysisTime > 2000) {
      recommendations.push('Optimize analysis creation performance');
    }
    
    recommendations.push('Consider implementing rate limiting for high-volume operations');
    recommendations.push('Monitor disk space usage with large datasets');
    recommendations.push('Implement data archiving strategy for long-term storage');
    
    return recommendations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const config: Partial<StressTestConfig> = {
    investigationCount: 65, // 60-70 range
    evidencePerInvestigation: 15,
    analysisPerInvestigation: 8,
    findingsPerAnalysis: 12,
    largeFileSize: 5 * 1024 * 1024, // 5MB
    enableHealthMonitoring: true,
    enableMemoryTracking: true,
    testDuration: 30
  };

  const stressTester = new StressTester(config);
  
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

process.on('SIGTERM', () => {
  console.log('\n🛑 Stress test terminated');
  process.exit(0);
});

// Run the stress test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
