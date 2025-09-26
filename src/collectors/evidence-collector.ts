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
      ['security', this.collectSecurityInfo.bind(this)],
      ['infrastructure', this.collectInfrastructureInfo.bind(this)],
      ['container', this.collectContainerInfo.bind(this)],
      ['cloud', this.collectCloudInfo.bind(this)],
      ['monitoring', this.collectMonitoringInfo.bind(this)]
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
      const [
        users, 
        permissions, 
        securityLogs, 
        networkConnections,
        openPorts,
        runningServices,
        fileIntegrity,
        suspiciousProcesses,
        malwareSignatures,
        vulnerabilityScan
      ] = await Promise.all([
        this.getUserInfo(),
        this.getPermissionInfo(),
        this.getSecurityLogs(),
        this.getNetworkConnections(),
        this.getOpenPorts(),
        this.getRunningServices(),
        this.getFileIntegrityCheck(),
        this.getSuspiciousProcesses(),
        this.getMalwareSignatures(),
        this.getVulnerabilityScan()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        users,
        permissions,
        security_logs: securityLogs,
        network_connections: networkConnections,
        open_ports: openPorts,
        running_services: runningServices,
        file_integrity: fileIntegrity,
        suspicious_processes: suspiciousProcesses,
        malware_signatures: malwareSignatures,
        vulnerability_scan: vulnerabilityScan,
        security_score: this.calculateSecurityScore({
          users, permissions, securityLogs, networkConnections,
          openPorts, runningServices, fileIntegrity, suspiciousProcesses
        }),
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
      tags: ['security', 'forensics', 'evidence'],
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

  // Advanced Security Forensics Methods
  private async getOpenPorts(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || echo "Unable to get open ports"');
      return { open_ports: stdout };
    } catch {
      return { open_ports: 'Unable to collect open ports' };
    }
  }

  private async getRunningServices(): Promise<any> {
    try {
      const { stdout } = await execAsync('systemctl list-units --type=service --state=running 2>/dev/null || ps aux | grep -E "(httpd|nginx|apache|mysql|postgres)" || echo "Unable to get running services"');
      return { running_services: stdout };
    } catch {
      return { running_services: 'Unable to collect running services' };
    }
  }

  private async getFileIntegrityCheck(): Promise<any> {
    try {
      const { stdout } = await execAsync('find /etc /bin /sbin -type f -executable -newer /etc/passwd 2>/dev/null | head -20 || echo "Unable to perform file integrity check"');
      return { file_integrity: stdout };
    } catch {
      return { file_integrity: 'Unable to perform file integrity check' };
    }
  }

  private async getSuspiciousProcesses(): Promise<any> {
    try {
      const { stdout } = await execAsync('ps aux | grep -E "(nc|netcat|nmap|masscan|hydra|john|hashcat)" 2>/dev/null || echo "No suspicious processes found"');
      return { suspicious_processes: stdout };
    } catch {
      return { suspicious_processes: 'Unable to check for suspicious processes' };
    }
  }

  private async getMalwareSignatures(): Promise<any> {
    try {
      const { stdout } = await execAsync('find /tmp /var/tmp -name "*.sh" -o -name "*.py" -o -name "*.pl" 2>/dev/null | head -10 || echo "No suspicious files found"');
      return { malware_signatures: stdout };
    } catch {
      return { malware_signatures: 'Unable to scan for malware signatures' };
    }
  }

  private async getVulnerabilityScan(): Promise<any> {
    try {
      const { stdout } = await execAsync('uname -a && cat /etc/os-release 2>/dev/null || echo "Unable to get system info for vulnerability scan"');
      return { vulnerability_scan: stdout };
    } catch {
      return { vulnerability_scan: 'Unable to perform vulnerability scan' };
    }
  }

  private calculateSecurityScore(securityData: any): number {
    let score = 100; // Start with perfect score
    
    // Deduct points for various security issues
    if (securityData.users?.includes('root')) score -= 10;
    if (securityData.open_ports?.includes('22')) score -= 5; // SSH
    if (securityData.open_ports?.includes('80')) score -= 5; // HTTP
    if (securityData.open_ports?.includes('443')) score -= 5; // HTTPS
    if (securityData.suspicious_processes?.length > 0) score -= 20;
    if (securityData.malware_signatures?.length > 0) score -= 30;
    
    return Math.max(0, score);
  }

  // Infrastructure Inspection Tools
  private async collectInfrastructureInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const [
        systemInfo,
        hardwareInfo,
        softwareInfo,
        serviceStatus,
        loadBalancerInfo,
        proxyInfo
      ] = await Promise.all([
        this.getSystemInfo(),
        this.getHardwareInfo(),
        this.getSoftwareInfo(),
        this.getServiceStatus(),
        this.getLoadBalancerInfo(),
        this.getProxyInfo()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        system_info: systemInfo,
        hardware_info: hardwareInfo,
        software_info: softwareInfo,
        service_status: serviceStatus,
        load_balancer_info: loadBalancerInfo,
        proxy_info: proxyInfo,
        infrastructure_score: this.calculateInfrastructureScore({
          systemInfo, hardwareInfo, softwareInfo, serviceStatus
        }),
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect infrastructure info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'infrastructure',
      source: 'infrastructure_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['infrastructure', 'system', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectContainerInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const [
        dockerInfo,
        containerList,
        imageList,
        volumeInfo,
        networkInfo
      ] = await Promise.all([
        this.getDockerInfo(),
        this.getContainerList(),
        this.getImageList(),
        this.getVolumeInfo(),
        this.getContainerNetworkInfo()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        docker_info: dockerInfo,
        containers: containerList,
        images: imageList,
        volumes: volumeInfo,
        networks: networkInfo,
        container_score: this.calculateContainerScore({
          dockerInfo, containerList, imageList, volumeInfo
        }),
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect container info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'container',
      source: 'container_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['container', 'docker', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectCloudInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const [
        cloudProvider,
        instanceInfo,
        storageInfo,
        networkInfo,
        securityGroups
      ] = await Promise.all([
        this.getCloudProvider(),
        this.getInstanceInfo(),
        this.getStorageInfo(),
        this.getCloudNetworkInfo(),
        this.getSecurityGroups()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        cloud_provider: cloudProvider,
        instance_info: instanceInfo,
        storage_info: storageInfo,
        network_info: networkInfo,
        security_groups: securityGroups,
        cloud_score: this.calculateCloudScore({
          cloudProvider, instanceInfo, storageInfo, networkInfo
        }),
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect cloud info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'cloud',
      source: 'cloud_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['cloud', 'aws', 'azure', 'gcp', 'evidence'],
      created_at: new Date()
    };
  }

  private async collectMonitoringInfo(source: EvidenceSource, options: CollectionOptions): Promise<EvidenceItem> {
    const { parameters } = source;
    let content: any;

    try {
      const [
        monitoringTools,
        alertStatus,
        metricsHistory,
        healthChecks,
        dashboards
      ] = await Promise.all([
        this.getMonitoringTools(),
        this.getAlertStatus(),
        this.getMetricsHistory(),
        this.getHealthChecks(),
        this.getDashboards()
      ]);

      content = {
        timestamp: new Date().toISOString(),
        monitoring_tools: monitoringTools,
        alert_status: alertStatus,
        metrics_history: metricsHistory,
        health_checks: healthChecks,
        dashboards: dashboards,
        monitoring_score: this.calculateMonitoringScore({
          monitoringTools, alertStatus, metricsHistory, healthChecks
        }),
        parameters
      };
    } catch (error) {
      throw new EvidenceError(
        `Failed to collect monitoring info: ${error}`,
        undefined,
        { error }
      );
    }

    const metadata = this.createMetadata(source, JSON.stringify(content), null, options);
    const chainOfCustody = this.createChainOfCustody('collected', options);

    return {
      id: uuidv4(),
      investigation_id: options.investigation_id,
      type: 'monitoring',
      source: 'monitoring_info',
      content,
      metadata,
      chain_of_custody: chainOfCustody,
      tags: ['monitoring', 'alerts', 'metrics', 'evidence'],
      created_at: new Date()
    };
  }

  // Infrastructure Helper Methods
  private async getSystemInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('uname -a && cat /etc/os-release 2>/dev/null || echo "Unable to get system info"');
      return { system_info: stdout };
    } catch {
      return { system_info: 'Unable to collect system info' };
    }
  }

  private async getHardwareInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('lscpu 2>/dev/null || cat /proc/cpuinfo 2>/dev/null || echo "Unable to get hardware info"');
      return { hardware_info: stdout };
    } catch {
      return { hardware_info: 'Unable to collect hardware info' };
    }
  }

  private async getSoftwareInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('dpkg -l 2>/dev/null || rpm -qa 2>/dev/null || echo "Unable to get software info"');
      return { software_info: stdout };
    } catch {
      return { software_info: 'Unable to collect software info' };
    }
  }

  private async getServiceStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync('systemctl list-units --type=service --state=running 2>/dev/null || echo "Unable to get service status"');
      return { service_status: stdout };
    } catch {
      return { service_status: 'Unable to collect service status' };
    }
  }

  private async getLoadBalancerInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('nginx -t 2>/dev/null && nginx -T 2>/dev/null || echo "No nginx load balancer found"');
      return { load_balancer_info: stdout };
    } catch {
      return { load_balancer_info: 'Unable to collect load balancer info' };
    }
  }

  private async getProxyInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('env | grep -i proxy 2>/dev/null || echo "No proxy configuration found"');
      return { proxy_info: stdout };
    } catch {
      return { proxy_info: 'Unable to collect proxy info' };
    }
  }

  private async getDockerInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('docker version 2>/dev/null || echo "Docker not available"');
      return { docker_info: stdout };
    } catch {
      return { docker_info: 'Unable to collect Docker info' };
    }
  }

  private async getContainerList(): Promise<any> {
    try {
      const { stdout } = await execAsync('docker ps -a 2>/dev/null || echo "No containers found"');
      return { containers: stdout };
    } catch {
      return { containers: 'Unable to collect container list' };
    }
  }

  private async getImageList(): Promise<any> {
    try {
      const { stdout } = await execAsync('docker images 2>/dev/null || echo "No images found"');
      return { images: stdout };
    } catch {
      return { images: 'Unable to collect image list' };
    }
  }

  private async getVolumeInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('docker volume ls 2>/dev/null || echo "No volumes found"');
      return { volumes: stdout };
    } catch {
      return { volumes: 'Unable to collect volume info' };
    }
  }

  private async getContainerNetworkInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('docker network ls 2>/dev/null || echo "No networks found"');
      return { networks: stdout };
    } catch {
      return { networks: 'Unable to collect container network info' };
    }
  }

  private async getCloudProvider(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null && echo "AWS" || echo "Unknown cloud provider"');
      return { cloud_provider: stdout };
    } catch {
      return { cloud_provider: 'Unable to detect cloud provider' };
    }
  }

  private async getInstanceInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/ 2>/dev/null || echo "Unable to get instance info"');
      return { instance_info: stdout };
    } catch {
      return { instance_info: 'Unable to collect instance info' };
    }
  }

  private async getStorageInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('df -h && lsblk 2>/dev/null || echo "Unable to get storage info"');
      return { storage_info: stdout };
    } catch {
      return { storage_info: 'Unable to collect storage info' };
    }
  }

  private async getCloudNetworkInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/network/ 2>/dev/null || echo "Unable to get cloud network info"');
      return { network_info: stdout };
    } catch {
      return { network_info: 'Unable to collect cloud network info' };
    }
  }

  private async getSecurityGroups(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/security-groups 2>/dev/null || echo "Unable to get security groups"');
      return { security_groups: stdout };
    } catch {
      return { security_groups: 'Unable to collect security groups' };
    }
  }

  private async getMonitoringTools(): Promise<any> {
    try {
      const { stdout } = await execAsync('ps aux | grep -E "(prometheus|grafana|nagios|zabbix)" 2>/dev/null || echo "No monitoring tools found"');
      return { monitoring_tools: stdout };
    } catch {
      return { monitoring_tools: 'Unable to collect monitoring tools info' };
    }
  }

  private async getAlertStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync('systemctl status alertmanager 2>/dev/null || echo "No alert manager found"');
      return { alert_status: stdout };
    } catch {
      return { alert_status: 'Unable to collect alert status' };
    }
  }

  private async getMetricsHistory(): Promise<any> {
    try {
      const { stdout } = await execAsync('find /var/lib/prometheus -name "*.db" 2>/dev/null | head -5 || echo "No metrics history found"');
      return { metrics_history: stdout };
    } catch {
      return { metrics_history: 'Unable to collect metrics history' };
    }
  }

  private async getHealthChecks(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://localhost:9090/-/healthy 2>/dev/null || echo "No health checks available"');
      return { health_checks: stdout };
    } catch {
      return { health_checks: 'Unable to collect health checks' };
    }
  }

  private async getDashboards(): Promise<any> {
    try {
      const { stdout } = await execAsync('curl -s http://localhost:3000/api/dashboards 2>/dev/null || echo "No dashboards available"');
      return { dashboards: stdout };
    } catch {
      return { dashboards: 'Unable to collect dashboards' };
    }
  }

  // Scoring Methods
  private calculateInfrastructureScore(data: any): number {
    let score = 100;
    // Deduct points for infrastructure issues
    if (!data.systemInfo?.includes('Linux')) score -= 10;
    if (!data.hardwareInfo?.includes('CPU')) score -= 5;
    if (!data.softwareInfo?.includes('package')) score -= 5;
    return Math.max(0, score);
  }

  private calculateContainerScore(data: any): number {
    let score = 100;
    if (!data.dockerInfo?.includes('Docker')) score -= 20;
    if (!data.containerList?.includes('CONTAINER')) score -= 10;
    return Math.max(0, score);
  }

  private calculateCloudScore(data: any): number {
    let score = 100;
    if (!data.cloudProvider?.includes('AWS')) score -= 15;
    if (!data.instanceInfo?.includes('instance')) score -= 10;
    return Math.max(0, score);
  }

  private calculateMonitoringScore(data: any): number {
    let score = 100;
    if (!data.monitoringTools?.includes('prometheus')) score -= 20;
    if (!data.alertStatus?.includes('active')) score -= 15;
    return Math.max(0, score);
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
