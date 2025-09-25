/**
 * Evidence collection service for investigations
 * Handles collection of various types of evidence while maintaining chain of custody
 */

import { readFile, readdir, stat } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { EvidenceItem, EvidenceSource, EvidenceMetadata, CustodyEntry } from '../types/index.js';
import { EvidenceError } from '../types/index.js';

const execAsync = promisify(exec);

export interface CollectionOptions {
  investigation_id: string;
  preserve_chain_of_custody: boolean;
  user_id?: string;
  environment?: string;
}

export class EvidenceCollector {
  private collectionMethods: Map<string, (source: EvidenceSource, options: CollectionOptions) => Promise<EvidenceItem>>;

  constructor() {
    this.collectionMethods = new Map([
      ['logs', this.collectLogs.bind(this)],
      ['config', this.collectConfig.bind(this)],
      ['metrics', this.collectMetrics.bind(this)],
      ['network', this.collectNetworkInfo.bind(this)],
      ['process', this.collectProcessInfo.bind(this)],
      ['filesystem', this.collectFilesystemInfo.bind(this)],
      ['database', this.collectDatabaseInfo.bind(this)],
      ['security', this.collectSecurityInfo.bind(this)]
    ]);
  }

  async collect(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const method = this.collectionMethods.get(source.type);
    if (!method) {
      throw new EvidenceError(
        `Unknown evidence type: ${source.type}`,
        undefined,
        { source }
      );
    }

    try {
      return await method(source, options);
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect evidence from ${source.type}: ${error}`,
        undefined,
        { source, error }
      );
    }
  }

  private async collectLogs(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { path, filters, time_range } = source;
    
    if (!path) {
      throw new EvidenceError('Log path is required for log collection');
    }

    let content: string;
    let fileStats;

    try {
      // Read log file
      content = await readFile(path, 'utf-8');
      fileStats = await stat(path);

      // Apply time range filter if specified
      if (time_range) {
        content = this.filterLogsByTimeRange(content, time_range);
      }

      // Apply additional filters if specified
      if (filters) {
        content = this.applyLogFilters(content, filters);
      }
    } catch (error) {
      throw new EvidenceError(
        `Failed to read log file: ${error}`,
        undefined,
        { path, error }
      );
    }

    const metadata = this.createMetadata(source, content, fileStats, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'log',
      source: path,
      path,
      content: {
        raw_content: content,
        line_count: content.split('\n').length,
        filters_applied: filters,
        time_range: time_range
      },
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['log', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectConfig(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { path } = source;
    
    if (!path) {
      throw new EvidenceError('Config path is required for config collection');
    }

    let content: any;
    let fileStats;

    try {
      const rawContent = await readFile(path, 'utf-8');
      fileStats = await stat(path);

      // Try to parse as JSON, YAML, or keep as text
      try {
        content = JSON.parse(rawContent);
      } catch {
        // If not JSON, try to detect YAML or keep as text
        if (rawContent.includes('---') || rawContent.includes(':')) {
          content = { raw_content: rawContent, format: 'yaml' };
        } else {
          content = { raw_content: rawContent, format: 'text' };
        }
      }
    } catch (error) {
      throw new EvidenceError(
        `Failed to read config file: ${error}`,
        undefined,
        { path, error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), fileStats, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'config',
      source: path,
      path,
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['config', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectMetrics(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    
    let content: any;

    try {
      // Collect system metrics
      const [cpuInfo, memoryInfo, diskInfo, networkInfo] = await Promise.all([
        this.getCPUInfo(),
        this.getMemoryInfo(),
        this.getDiskInfo(),
        this.getNetworkInfo()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        cpu: cpuInfo,
        memory: memoryInfo,
        disk: diskInfo,
        network: networkInfo,
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect metrics: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'metric',
      source: 'system_metrics',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['metrics', 'system', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectNetworkInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    let content: any;

    try {
      const [connections, interfaces, routing] = await Promise.all([
        this.getNetworkConnections(),
        this.getNetworkInterfaces(),
        this.getRoutingTable()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        connections,
        interfaces,
        routing
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect network info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'network',
      source: 'network_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['network', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectProcessInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const processes = await this.getProcessList(parameters);
      content = {
        timestamp: new Date().toISOString(),
        processes,
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect process info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'process',
      source: 'process_list',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['process', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectFilesystemInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { path, parameters } = source;
    let content: any;

    try {
      if (path) {
        // Collect info about specific path
        const stats = await stat(path);
        const files = await this.getDirectoryContents(path);
        
        content = {
          timestamp: new Date().toISOString(),
          path,
          stats: {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            mode: stats.mode.toString(8)
          },
          contents: files,
          parameters
        };
      } else {
        // Collect general filesystem info
        const diskUsage = await this.getDiskUsage();
        content = {
          timestamp: new Date().toISOString(),
          disk_usage: diskUsage,
          parameters
        };
      }
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect filesystem info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'filesystem',
      source: path || 'filesystem_info',
      path,
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['filesystem', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectDatabaseInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      // This would need to be implemented based on specific database types
      // For now, return a placeholder structure
      content = {
        timestamp: new Date().toISOString(),
        database_type: parameters?.database_type || 'unknown',
        connection_info: parameters?.connection_info || {},
        queries_executed: parameters?.queries || [],
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect database info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'database',
      source: 'database_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['database', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectSecurityInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const [users, permissions, securityLogs] = await Promise.all([
        this.getUserInfo(),
        this.getPermissionInfo(),
        this.getSecurityLogs()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        users,
        permissions,
        security_logs: securityLogs,
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect security info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'security',
      source: 'security_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['security', 'evidence'],
      created_at: new Date()
    };
  }

  // Helper methods for system information collection
  private async getCPUInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('top -l 1 | grep "CPU usage"');
      return { cpu_usage: stdout.trim() };
    } catch {
      return { cpu_usage: 'Unable to collect CPU info' };
    }
  }

  private async getMemoryInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('vm_stat');
      return { memory_stats: stdout };
    } catch {
      return { memory_stats: 'Unable to collect memory info' };
    }
  }

  private async getDiskInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('df -h');
      return { disk_usage: stdout };
    } catch {
      return { disk_usage: 'Unable to collect disk info' };
    }
  }

  private async getNetworkInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -i');
      return { network_interfaces: stdout };
    } catch {
      return { network_interfaces: 'Unable to collect network info' };
    }
  }

  private async getNetworkConnections(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -an');
      return { connections: stdout };
    } catch {
      return { connections: 'Unable to collect network connections' };
    }
  }

  private async getNetworkInterfaces(): Promise<any> {
    try {
      const { stdout } = await execAsync('ifconfig');
      return { interfaces: stdout };
    } catch {
      return { interfaces: 'Unable to collect network interfaces' };
    }
  }

  private async getRoutingTable(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -rn');
      return { routing_table: stdout };
    } catch {
      return { routing_table: 'Unable to collect routing table' };
    }
  }

  private async getProcessList(parameters?: any): Promise<any> {
    try {
      const { stdout } = await execAsync('ps aux');
      return { processes: stdout };
    } catch {
      return { processes: 'Unable to collect process list' };
    }
  }

  private async getDirectoryContents(path: string): Promise<any> {
    try {
      const files = await readdir(path);
      return { files };
    } catch {
      return { files: 'Unable to read directory contents' };
    }
  }

  private async getDiskUsage(): Promise<any> {
    try {
      const { stdout } = await execAsync('df -h');
      return { disk_usage: stdout };
    } catch {
      return { disk_usage: 'Unable to collect disk usage' };
    }
  }

  private async getUserInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('who');
      return { users: stdout };
    } catch {
      return { users: 'Unable to collect user info' };
    }
  }

  private async getPermissionInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('ls -la /etc/passwd /etc/shadow');
      return { permissions: stdout };
    } catch {
      return { permissions: 'Unable to collect permission info' };
    }
  }

  private async getSecurityLogs(): Promise<any> {
    try {
      const { stdout } = await execAsync('tail -n 100 /var/log/auth.log 2>/dev/null || tail -n 100 /var/log/secure 2>/dev/null || echo "No security logs found"');
      return { security_logs: stdout };
    } catch {
      return { security_logs: 'Unable to collect security logs' };
    }
  }

  // Utility methods
  private filterLogsByTimeRange(content: string, timeRange: any): string {
    // Simple implementation - in practice, this would parse timestamps
    // and filter based on the time range
    return content;
  }

  private applyLogFilters(content: string, filters: any): string {
    // Apply various filters like grep patterns, log levels, etc.
    return content;
  }

  private createMetadata(source: EvidenceSource, content: string, fileStats: any, options: CollectionOptions): EvidenceMetadata {
    const checksum = createHash('sha256').update(content).digest('hex');
    
    return {
      timestamp: new Date(),
      size: content.length,
      checksum,
      collected_by: options.user_id || 'system',
      collection_method: `evidence_collector_${source.type}`,
      source_system: 'localhost', // Could be enhanced to detect actual system
      original_path: source.path,
      file_permissions: fileStats?.mode?.toString(8),
      process_id: process.pid,
      user_id: options.user_id || 'system',
      environment: options.environment || 'production'
    };
  }

  private createChainOfCustody(action: string, options: CollectionOptions): CustodyEntry[] {
    if (!options.preserve_chain_of_custody) {
      return [];
    }

    return [{
      timestamp: new Date(),
      action: action as any,
      performed_by: options.user_id || 'system',
      notes: `Evidence collected via MCP investigation tool`,
      location: 'investigation_database',
      integrity_verified: true
    }];
  }
}
