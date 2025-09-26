/**
 * API Integration service for investigations
 * Provides integration with external APIs and services
 */

import { InvestigationCase, EvidenceItem, AnalysisResult } from '../types/index.js';
import { InvestigationError } from '../types/index.js';

export interface APIIntegrationOptions {
  investigation: InvestigationCase;
  service: 'slack' | 'jira' | 'confluence' | 'github' | 'gitlab' | 'jenkins' | 'prometheus' | 'grafana' | 'elasticsearch' | 'splunk';
  action: 'create_ticket' | 'send_notification' | 'create_page' | 'create_issue' | 'trigger_build' | 'query_metrics' | 'search_logs' | 'update_dashboard';
  credentials?: {
    api_key?: string;
    token?: string;
    username?: string;
    password?: string;
    base_url?: string;
  };
  parameters?: {
    [key: string]: any;
  };
}

export interface APIIntegrationResult {
  id: string;
  service: string;
  action: string;
  status: 'success' | 'error' | 'partial';
  response?: any;
  error?: string;
  created_at: Date;
}

export class APIIntegrationService {
  private integrations: Map<string, (options: APIIntegrationOptions) => Promise<APIIntegrationResult>>;

  constructor() {
    this.integrations = new Map([
      ['slack', this.integrateWithSlack.bind(this)],
      ['jira', this.integrateWithJira.bind(this)],
      ['confluence', this.integrateWithConfluence.bind(this)],
      ['github', this.integrateWithGitHub.bind(this)],
      ['gitlab', this.integrateWithGitLab.bind(this)],
      ['jenkins', this.integrateWithJenkins.bind(this)],
      ['prometheus', this.integrateWithPrometheus.bind(this)],
      ['grafana', this.integrateWithGrafana.bind(this)],
      ['elasticsearch', this.integrateWithElasticsearch.bind(this)],
      ['splunk', this.integrateWithSplunk.bind(this)]
    ]);
  }

  async integrate(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { service, action } = options;
    
    const integration = this.integrations.get(service);
    if (!integration) {
      throw new InvestigationError(
        `Unsupported service: ${service}`,
        'UNSUPPORTED_SERVICE',
        options.investigation.id
      );
    }

    try {
      return await integration(options);
    } catch (error) {
      throw new InvestigationError(
        `Failed to integrate with ${service}: ${error}`,
        'INTEGRATION_ERROR',
        options.investigation.id
      );
    }
  }

  // Slack Integration
  private async integrateWithSlack(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'send_notification') {
      const message = this.formatSlackMessage(investigation, parameters);
      
      // Simulate Slack API call
      const response = await this.makeAPICall('POST', 'https://hooks.slack.com/services/...', {
        text: message,
        channel: parameters?.channel || '#investigations',
        username: 'Investigation Bot',
        icon_emoji: ':mag:'
      }, credentials);
      
      return {
        id: `slack_${Date.now()}`,
        service: 'slack',
        action: 'send_notification',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Slack action: ${action}`);
  }

  // Jira Integration
  private async integrateWithJira(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'create_ticket') {
      const issue = this.formatJiraIssue(investigation, parameters);
      
      // Simulate Jira API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/rest/api/2/issue`, issue, credentials);
      
      return {
        id: `jira_${Date.now()}`,
        service: 'jira',
        action: 'create_ticket',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Jira action: ${action}`);
  }

  // Confluence Integration
  private async integrateWithConfluence(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'create_page') {
      const page = this.formatConfluencePage(investigation, parameters);
      
      // Simulate Confluence API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/rest/api/content`, page, credentials);
      
      return {
        id: `confluence_${Date.now()}`,
        service: 'confluence',
        action: 'create_page',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Confluence action: ${action}`);
  }

  // GitHub Integration
  private async integrateWithGitHub(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'create_issue') {
      const issue = this.formatGitHubIssue(investigation, parameters);
      
      // Simulate GitHub API call
      const response = await this.makeAPICall('POST', `https://api.github.com/repos/${parameters?.owner}/${parameters?.repo}/issues`, issue, credentials);
      
      return {
        id: `github_${Date.now()}`,
        service: 'github',
        action: 'create_issue',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported GitHub action: ${action}`);
  }

  // GitLab Integration
  private async integrateWithGitLab(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'create_issue') {
      const issue = this.formatGitLabIssue(investigation, parameters);
      
      // Simulate GitLab API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/api/v4/projects/${parameters?.project_id}/issues`, issue, credentials);
      
      return {
        id: `gitlab_${Date.now()}`,
        service: 'gitlab',
        action: 'create_issue',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported GitLab action: ${action}`);
  }

  // Jenkins Integration
  private async integrateWithJenkins(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'trigger_build') {
      // Simulate Jenkins API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/job/${parameters?.job_name}/build`, {}, credentials);
      
      return {
        id: `jenkins_${Date.now()}`,
        service: 'jenkins',
        action: 'trigger_build',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Jenkins action: ${action}`);
  }

  // Prometheus Integration
  private async integrateWithPrometheus(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'query_metrics') {
      const query = parameters?.query || 'up';
      
      // Simulate Prometheus API call
      const response = await this.makeAPICall('GET', `${credentials?.base_url}/api/v1/query?query=${encodeURIComponent(query)}`, {}, credentials);
      
      return {
        id: `prometheus_${Date.now()}`,
        service: 'prometheus',
        action: 'query_metrics',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Prometheus action: ${action}`);
  }

  // Grafana Integration
  private async integrateWithGrafana(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'update_dashboard') {
      const dashboard = this.formatGrafanaDashboard(investigation, parameters);
      
      // Simulate Grafana API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/api/dashboards/db`, dashboard, credentials);
      
      return {
        id: `grafana_${Date.now()}`,
        service: 'grafana',
        action: 'update_dashboard',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Grafana action: ${action}`);
  }

  // Elasticsearch Integration
  private async integrateWithElasticsearch(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'search_logs') {
      const query = this.formatElasticsearchQuery(investigation, parameters);
      
      // Simulate Elasticsearch API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/${parameters?.index}/_search`, query, credentials);
      
      return {
        id: `elasticsearch_${Date.now()}`,
        service: 'elasticsearch',
        action: 'search_logs',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Elasticsearch action: ${action}`);
  }

  // Splunk Integration
  private async integrateWithSplunk(options: APIIntegrationOptions): Promise<APIIntegrationResult> {
    const { investigation, action, credentials, parameters } = options;
    
    if (action === 'search_logs') {
      const query = parameters?.query || 'index=*';
      
      // Simulate Splunk API call
      const response = await this.makeAPICall('POST', `${credentials?.base_url}/services/search/jobs/export`, {
        search: query,
        output_mode: 'json'
      }, credentials);
      
      return {
        id: `splunk_${Date.now()}`,
        service: 'splunk',
        action: 'search_logs',
        status: 'success',
        response: response,
        created_at: new Date()
      };
    }
    
    throw new InvestigationError(`Unsupported Splunk action: ${action}`);
  }

  // Helper methods for formatting data
  private formatSlackMessage(investigation: InvestigationCase, parameters?: any): string {
    return `🔍 *Investigation Update: ${investigation.title}*

*Severity:* ${investigation.severity}
*Status:* ${investigation.status}
*Category:* ${investigation.category}

*Summary:* ${investigation.description}

*Evidence Collected:* ${investigation.evidence.length} items
*Analysis Completed:* ${investigation.analysis.length} analyses
*Findings:* ${investigation.findings.length} findings

*Investigation ID:* ${investigation.id}
*Created:* ${investigation.created_at.toISOString()}`;
  }

  private formatJiraIssue(investigation: InvestigationCase, parameters?: any): any {
    return {
      fields: {
        project: { key: parameters?.project_key || 'INV' },
        summary: `Investigation: ${investigation.title}`,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: investigation.description
                }
              ]
            }
          ]
        },
        issuetype: { name: 'Task' },
        priority: { name: this.mapSeverityToPriority(investigation.severity) },
        labels: [investigation.category, 'investigation', 'forensics']
      }
    };
  }

  private formatConfluencePage(investigation: InvestigationCase, parameters?: any): any {
    return {
      type: 'page',
      title: `Investigation Report: ${investigation.title}`,
      space: { key: parameters?.space_key || 'INV' },
      body: {
        storage: {
          value: this.generateConfluenceContent(investigation),
          representation: 'storage'
        }
      }
    };
  }

  private formatGitHubIssue(investigation: InvestigationCase, parameters?: any): any {
    return {
      title: `Investigation: ${investigation.title}`,
      body: this.generateGitHubIssueBody(investigation),
      labels: [investigation.category, 'investigation', 'forensics'],
      assignees: parameters?.assignees || []
    };
  }

  private formatGitLabIssue(investigation: InvestigationCase, parameters?: any): any {
    return {
      title: `Investigation: ${investigation.title}`,
      description: this.generateGitLabIssueBody(investigation),
      labels: [investigation.category, 'investigation', 'forensics'],
      assignee_ids: parameters?.assignee_ids || []
    };
  }

  private formatGrafanaDashboard(investigation: InvestigationCase, parameters?: any): any {
    return {
      dashboard: {
        title: `Investigation Dashboard: ${investigation.title}`,
        panels: this.generateGrafanaPanels(investigation),
        time: {
          from: investigation.created_at.toISOString(),
          to: investigation.updated_at.toISOString()
        }
      }
    };
  }

  private formatElasticsearchQuery(investigation: InvestigationCase, parameters?: any): any {
    return {
      query: {
        bool: {
          must: [
            {
              range: {
                timestamp: {
                  gte: investigation.created_at.toISOString(),
                  lte: investigation.updated_at.toISOString()
                }
              }
            }
          ]
        }
      },
      size: parameters?.size || 100
    };
  }

  // Utility methods
  private async makeAPICall(method: string, url: string, data: any, credentials?: any): Promise<any> {
    // Simulate API call - in real implementation, use fetch or axios
    return {
      status: 200,
      data: {
        message: 'API call simulated',
        url: url,
        method: method,
        timestamp: new Date().toISOString()
      }
    };
  }

  private mapSeverityToPriority(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'Highest';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  }

  private generateConfluenceContent(investigation: InvestigationCase): string {
    return `
<h1>Investigation Report: ${investigation.title}</h1>
<h2>Summary</h2>
<p>${investigation.description}</p>
<h2>Details</h2>
<ul>
  <li><strong>Severity:</strong> ${investigation.severity}</li>
  <li><strong>Category:</strong> ${investigation.category}</li>
  <li><strong>Status:</strong> ${investigation.status}</li>
  <li><strong>Created:</strong> ${investigation.created_at.toISOString()}</li>
  <li><strong>Updated:</strong> ${investigation.updated_at.toISOString()}</li>
</ul>
<h2>Evidence</h2>
<p>Total evidence items: ${investigation.evidence.length}</p>
<h2>Analysis</h2>
<p>Total analyses: ${investigation.analysis.length}</p>
<h2>Findings</h2>
<p>Total findings: ${investigation.findings.length}</p>
    `;
  }

  private generateGitHubIssueBody(investigation: InvestigationCase): string {
    return `## Investigation Report: ${investigation.title}

### Summary
${investigation.description}

### Details
- **Severity:** ${investigation.severity}
- **Category:** ${investigation.category}
- **Status:** ${investigation.status}
- **Created:** ${investigation.created_at.toISOString()}
- **Updated:** ${investigation.updated_at.toISOString()}

### Evidence
Total evidence items: ${investigation.evidence.length}

### Analysis
Total analyses: ${investigation.analysis.length}

### Findings
Total findings: ${investigation.findings.length}

### Investigation ID
\`${investigation.id}\``;
  }

  private generateGitLabIssueBody(investigation: InvestigationCase): string {
    return `## Investigation Report: ${investigation.title}

### Summary
${investigation.description}

### Details
- **Severity:** ${investigation.severity}
- **Category:** ${investigation.category}
- **Status:** ${investigation.status}
- **Created:** ${investigation.created_at.toISOString()}
- **Updated:** ${investigation.updated_at.toISOString()}

### Evidence
Total evidence items: ${investigation.evidence.length}

### Analysis
Total analyses: ${investigation.analysis.length}

### Findings
Total findings: ${investigation.findings.length}

### Investigation ID
\`${investigation.id}\``;
  }

  private generateGrafanaPanels(investigation: InvestigationCase): any[] {
    return [
      {
        title: 'Investigation Timeline',
        type: 'graph',
        targets: [
          {
            expr: 'investigation_events_total',
            legendFormat: 'Events'
          }
        ]
      },
      {
        title: 'Evidence Collection',
        type: 'stat',
        targets: [
          {
            expr: 'evidence_items_total',
            legendFormat: 'Evidence Items'
          }
        ]
      }
    ];
  }
}
