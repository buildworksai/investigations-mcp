/**
 * Visualization service for investigations
 * Generates charts, graphs, and visual representations of investigation data
 */

import { InvestigationCase, EvidenceItem, AnalysisResult } from '../types/index.js';
import { InvestigationError } from '../types/index.js';

export interface VisualizationOptions {
  investigation: InvestigationCase;
  type: 'timeline' | 'evidence_flow' | 'analysis_confidence' | 'severity_distribution' | 'category_breakdown' | 'network_diagram' | 'process_flow';
  format: 'svg' | 'png' | 'html' | 'json';
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | 'corporate';
  include_labels?: boolean;
  interactive?: boolean;
}

export interface VisualizationResult {
  id: string;
  type: string;
  format: string;
  content: string;
  metadata: {
    width: number;
    height: number;
    theme: string;
    created_at: Date;
  };
}

export class VisualizationService {
  constructor() {}

  async generateVisualization(options: VisualizationOptions): Promise<VisualizationResult> {
    const { investigation, type, format, width = 800, height = 600, theme = 'light', include_labels = true, interactive = false } = options;

    try {
      let content: string;

      switch (type) {
        case 'timeline':
          content = await this.generateTimelineVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'evidence_flow':
          content = await this.generateEvidenceFlowVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'analysis_confidence':
          content = await this.generateAnalysisConfidenceVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'severity_distribution':
          content = await this.generateSeverityDistributionVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'category_breakdown':
          content = await this.generateCategoryBreakdownVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'network_diagram':
          content = await this.generateNetworkDiagramVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        case 'process_flow':
          content = await this.generateProcessFlowVisualization(investigation, { width, height, theme, include_labels, interactive });
          break;
        default:
          throw new InvestigationError(`Unsupported visualization type: ${type}`, 'UNSUPPORTED_VISUALIZATION_TYPE', options.investigation.id);
      }

      // Convert to requested format
      const finalContent = await this.convertToFormat(content, format, { width, height, theme });

      return {
        id: `viz_${Date.now()}`,
        type,
        format,
        content: finalContent,
        metadata: {
          width,
          height,
          theme,
          created_at: new Date()
        }
      };
    } catch (error) {
      throw new InvestigationError(
        `Failed to generate visualization: ${error}`,
        'VISUALIZATION_ERROR',
        investigation.id
      );
    }
  }

  private async generateTimelineVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create timeline data
    const timelineData = this.extractTimelineData(investigation);
    
    // Generate SVG timeline
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .timeline-line { stroke: #3498db; stroke-width: 3; }
      .timeline-point { fill: #e74c3c; stroke: #c0392b; stroke-width: 2; }
      .timeline-label { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
      .timeline-date { font-family: Arial, sans-serif; font-size: 10px; fill: #7f8c8d; }
    </style>
  </defs>
  
  <!-- Timeline line -->
  <line x1="50" y1="${height/2}" x2="${width-50}" y2="${height/2}" class="timeline-line"/>
  
  <!-- Timeline points -->
  ${timelineData.map((point, index) => `
    <circle cx="${50 + (index * (width-100) / (timelineData.length-1))}" cy="${height/2}" r="8" class="timeline-point"/>
    ${include_labels ? `
      <text x="${50 + (index * (width-100) / (timelineData.length-1))}" y="${height/2 - 20}" text-anchor="middle" class="timeline-label">${point.event}</text>
      <text x="${50 + (index * (width-100) / (timelineData.length-1))}" y="${height/2 + 35}" text-anchor="middle" class="timeline-date">${point.date}</text>
    ` : ''}
  `).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Investigation Timeline</text>
</svg>`;

    return svg;
  }

  private async generateEvidenceFlowVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create evidence flow data
    const evidenceData = this.extractEvidenceFlowData(investigation);
    
    // Generate SVG flow diagram
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .evidence-box { fill: #ecf0f1; stroke: #bdc3c7; stroke-width: 2; }
      .evidence-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2c3e50; text-anchor: middle; }
      .flow-arrow { stroke: #3498db; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#3498db"/>
    </marker>
  </defs>
  
  <!-- Evidence boxes -->
  ${evidenceData.map((evidence, index) => `
    <rect x="${50 + (index * 150)}" y="${height/2 - 30}" width="120" height="60" class="evidence-box"/>
    <text x="${110 + (index * 150)}" y="${height/2 - 10}" class="evidence-text">${evidence.type}</text>
    <text x="${110 + (index * 150)}" y="${height/2 + 5}" class="evidence-text">${evidence.source}</text>
    <text x="${110 + (index * 150)}" y="${height/2 + 20}" class="evidence-text">${evidence.date}</text>
  `).join('')}
  
  <!-- Flow arrows -->
  ${evidenceData.slice(0, -1).map((_, index) => `
    <line x1="${170 + (index * 150)}" y1="${height/2}" x2="${50 + ((index+1) * 150)}" y2="${height/2}" class="flow-arrow"/>
  `).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Evidence Flow</text>
</svg>`;

    return svg;
  }

  private async generateAnalysisConfidenceVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create analysis confidence data
    const analysisData = this.extractAnalysisConfidenceData(investigation);
    
    // Generate SVG bar chart
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bar { fill: #3498db; }
      .bar-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; text-anchor: middle; }
      .axis-label { font-family: Arial, sans-serif; font-size: 14px; fill: #2c3e50; }
    </style>
  </defs>
  
  <!-- Bars -->
  ${analysisData.map((analysis, index) => {
    const barHeight = (analysis.confidence * (height - 100)) / 100;
    const barWidth = (width - 100) / analysisData.length;
    return `
      <rect x="${50 + (index * barWidth)}" y="${height - 50 - barHeight}" width="${barWidth - 10}" height="${barHeight}" class="bar"/>
      <text x="${50 + (index * barWidth) + barWidth/2}" y="${height - 30}" class="bar-text">${analysis.type}</text>
      <text x="${50 + (index * barWidth) + barWidth/2}" y="${height - 60 - barHeight}" class="bar-text">${Math.round(analysis.confidence * 100)}%</text>
    `;
  }).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Analysis Confidence</text>
</svg>`;

    return svg;
  }

  private async generateSeverityDistributionVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create severity distribution data
    const severityData = this.extractSeverityDistributionData(investigation);
    
    // Generate SVG pie chart
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .pie-slice { stroke: white; stroke-width: 2; }
      .pie-label { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
    </style>
  </defs>
  
  <!-- Pie chart slices -->
  ${severityData.map((severity, index) => {
    const percentage = severity.count / severityData.reduce((sum, s) => sum + s.count, 0);
    const angle = percentage * 360;
    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71'];
    return `
      <path d="M ${width/2} ${height/2} L ${width/2 + 100 * Math.cos((index * angle) * Math.PI / 180)} ${height/2 + 100 * Math.sin((index * angle) * Math.PI / 180)} A 100 100 0 0 1 ${width/2 + 100 * Math.cos(((index + 1) * angle) * Math.PI / 180)} ${height/2 + 100 * Math.sin(((index + 1) * angle) * Math.PI / 180)} Z" fill="${colors[index % colors.length]}" class="pie-slice"/>
      <text x="${width/2 + 120 * Math.cos((index + 0.5) * angle * Math.PI / 180)}" y="${height/2 + 120 * Math.sin((index + 0.5) * angle * Math.PI / 180)}" class="pie-label">${severity.level}: ${severity.count}</text>
    `;
  }).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Severity Distribution</text>
</svg>`;

    return svg;
  }

  private async generateCategoryBreakdownVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create category breakdown data
    const categoryData = this.extractCategoryBreakdownData(investigation);
    
    // Generate SVG horizontal bar chart
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .category-bar { fill: #9b59b6; }
      .category-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
    </style>
  </defs>
  
  <!-- Category bars -->
  ${categoryData.map((category, index) => {
    const barWidth = (category.count / Math.max(...categoryData.map(c => c.count))) * (width - 150);
    const barHeight = 30;
    const y = 80 + (index * 40);
    return `
      <rect x="100" y="${y}" width="${barWidth}" height="${barHeight}" class="category-bar"/>
      <text x="90" y="${y + 20}" class="category-text" text-anchor="end">${category.name}</text>
      <text x="${110 + barWidth}" y="${y + 20}" class="category-text">${category.count}</text>
    `;
  }).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Category Breakdown</text>
</svg>`;

    return svg;
  }

  private async generateNetworkDiagramVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create network diagram data
    const networkData = this.extractNetworkDiagramData(investigation);
    
    // Generate SVG network diagram
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .node { fill: #3498db; stroke: #2980b9; stroke-width: 2; }
      .node-text { font-family: Arial, sans-serif; font-size: 10px; fill: white; text-anchor: middle; }
      .edge { stroke: #7f8c8d; stroke-width: 2; fill: none; }
    </style>
  </defs>
  
  <!-- Network edges -->
  ${networkData.edges.map((edge: any) => `
    <line x1="${edge.from.x}" y1="${edge.from.y}" x2="${edge.to.x}" y2="${edge.to.y}" class="edge"/>
  `).join('')}
  
  <!-- Network nodes -->
  ${networkData.nodes.map((node: any) => `
    <circle cx="${node.x}" cy="${node.y}" r="20" class="node"/>
    <text x="${node.x}" y="${node.y + 5}" class="node-text">${node.label}</text>
  `).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Network Diagram</text>
</svg>`;

    return svg;
  }

  private async generateProcessFlowVisualization(investigation: InvestigationCase, options: any): Promise<string> {
    const { width, height, theme, include_labels, interactive } = options;
    
    // Create process flow data
    const processData = this.extractProcessFlowData(investigation);
    
    // Generate SVG process flow diagram
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .process-box { fill: #e8f4f8; stroke: #3498db; stroke-width: 2; }
      .process-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2c3e50; text-anchor: middle; }
      .process-arrow { stroke: #3498db; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#3498db"/>
    </marker>
  </defs>
  
  <!-- Process boxes -->
  ${processData.map((process, index) => `
    <rect x="${50 + (index * 150)}" y="${height/2 - 25}" width="120" height="50" class="process-box"/>
    <text x="${110 + (index * 150)}" y="${height/2 - 5}" class="process-text">${process.name}</text>
    <text x="${110 + (index * 150)}" y="${height/2 + 10}" class="process-text">${process.status}</text>
  `).join('')}
  
  <!-- Process arrows -->
  ${processData.slice(0, -1).map((_, index) => `
    <line x1="${170 + (index * 150)}" y1="${height/2}" x2="${50 + ((index+1) * 150)}" y2="${height/2}" class="process-arrow"/>
  `).join('')}
  
  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">Process Flow</text>
</svg>`;

    return svg;
  }

  private async convertToFormat(content: string, format: string, options: any): Promise<string> {
    switch (format) {
      case 'svg':
        return content;
      case 'html':
        return `<html><head><title>Investigation Visualization</title></head><body>${content}</body></html>`;
      case 'json':
        return JSON.stringify({
          type: 'visualization',
          format: 'svg',
          content: content,
          options: options
        }, null, 2);
      case 'png':
        // For PNG, we'd need a library like canvas or puppeteer
        // For now, return the SVG content
        return content;
      default:
        return content;
    }
  }

  // Data extraction methods
  private extractTimelineData(investigation: InvestigationCase): any[] {
    const timeline = [];
    
    // Add investigation start
    timeline.push({
      event: 'Investigation Started',
      date: investigation.created_at.toISOString().split('T')[0]
    });
    
    // Add evidence collection events
    investigation.evidence.forEach(evidence => {
      timeline.push({
        event: `Evidence: ${evidence.type}`,
        date: evidence.created_at.toISOString().split('T')[0]
      });
    });
    
    // Add analysis events
    investigation.analysis.forEach(analysis => {
      timeline.push({
        event: `Analysis: ${analysis.type}`,
        date: analysis.created_at.toISOString().split('T')[0]
      });
    });
    
    // Add investigation end
    timeline.push({
      event: 'Investigation Completed',
      date: investigation.updated_at.toISOString().split('T')[0]
    });
    
    return timeline;
  }

  private extractEvidenceFlowData(investigation: InvestigationCase): any[] {
    return investigation.evidence.map(evidence => ({
      type: evidence.type,
      source: evidence.source,
      date: evidence.created_at.toISOString().split('T')[0]
    }));
  }

  private extractAnalysisConfidenceData(investigation: InvestigationCase): any[] {
    return investigation.analysis.map(analysis => ({
      type: analysis.type,
      confidence: analysis.confidence
    }));
  }

  private extractSeverityDistributionData(investigation: InvestigationCase): any[] {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Count findings by severity
    investigation.findings.forEach(finding => {
      severityCounts[finding.severity as keyof typeof severityCounts]++;
    });
    
    return Object.entries(severityCounts).map(([level, count]) => ({
      level,
      count
    }));
  }

  private extractCategoryBreakdownData(investigation: InvestigationCase): any[] {
    const categoryCounts: { [key: string]: number } = {};
    
    // Count evidence by category
    investigation.evidence.forEach(evidence => {
      evidence.tags?.forEach(tag => {
        categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));
  }

  private extractNetworkDiagramData(investigation: InvestigationCase): any {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Create nodes for evidence sources
    investigation.evidence.forEach((evidence, index) => {
      nodes.push({
        id: evidence.id,
        label: evidence.type,
        x: 100 + (index * 100),
        y: 100 + (index % 3) * 100
      });
    });
    
    // Create edges between related evidence
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: { x: nodes[i].x, y: nodes[i].y },
        to: { x: nodes[i + 1].x, y: nodes[i + 1].y }
      });
    }
    
    return { nodes, edges };
  }

  private extractProcessFlowData(investigation: InvestigationCase): any[] {
    return [
      { name: 'Start', status: 'Completed' },
      { name: 'Evidence Collection', status: 'Completed' },
      { name: 'Analysis', status: 'Completed' },
      { name: 'Findings', status: 'Completed' },
      { name: 'Report', status: 'Completed' }
    ];
  }
}
