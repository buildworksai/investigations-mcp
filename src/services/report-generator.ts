/**
 * Report generation service for investigations
 * Generates comprehensive forensic reports in various formats
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { InvestigationCase, InvestigationReport, EvidenceItem, AnalysisResult } from '../types/index.js';
import { InvestigationError } from '../types/index.js';

export interface ReportOptions {
  investigation: InvestigationCase;
  format: 'json' | 'markdown' | 'pdf' | 'html';
  include_evidence?: boolean;
  include_timeline?: boolean;
  include_analysis?: boolean;
  include_recommendations?: boolean;
  template?: string;
  output_path?: string;
}

export class ReportGenerator {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
  }

  async generateReport(options: ReportOptions): Promise<InvestigationReport> {
    const {
      investigation,
      format,
      include_evidence = true,
      include_timeline = true,
      include_analysis = true,
      include_recommendations = true,
      template,
      output_path
    } = options;

    try {
      // Ensure output directory exists
      await mkdir(this.outputDir, { recursive: true });

      // Generate report content based on format
      let content: string;
      let filePath: string | undefined;

      switch (format) {
        case 'json':
          content = await this.generateJSONReport(investigation, options);
          break;
        case 'markdown':
          content = await this.generateMarkdownReport(investigation, options);
          break;
        case 'html':
          content = await this.generateHTMLReport(investigation, options);
          break;
        case 'pdf':
          // For PDF, we'll generate HTML first and then convert
          const htmlContent = await this.generateHTMLReport(investigation, options);
          content = await this.convertHTMLToPDF(htmlContent);
          break;
        default:
          throw new InvestigationError(
            `Unsupported report format: ${format}`,
            'UNSUPPORTED_FORMAT',
            investigation.id
          );
      }

      // Save report to file if output path is specified
      if (output_path || format !== 'json') {
        const fileName = output_path || `${investigation.id}_report_${Date.now()}.${format}`;
        filePath = join(this.outputDir, fileName);
        await writeFile(filePath, content, 'utf-8');
      }

      const report: InvestigationReport = {
        id: uuidv4(),
        investigation_id: investigation.id,
        format,
        content,
        generated_at: new Date(),
        generated_by: 'investigations-mcp',
        includes_evidence: include_evidence,
        includes_timeline: include_timeline,
        includes_analysis: include_analysis,
        file_path: filePath
      };

      return report;
    } catch (error) {
      throw new InvestigationError(
        `Report generation failed: ${error}`,
        'REPORT_GENERATION_ERROR',
        investigation.id,
        { error }
      );
    }
  }

  private async generateJSONReport(investigation: InvestigationCase, options: ReportOptions): Promise<string> {
    const reportData = {
      investigation: {
        id: investigation.id,
        title: investigation.title,
        description: investigation.description,
        status: investigation.status,
        severity: investigation.severity,
        category: investigation.category,
        priority: investigation.priority,
        created_at: investigation.created_at,
        updated_at: investigation.updated_at,
        reported_by: investigation.reported_by,
        assigned_to: investigation.assigned_to,
        affected_systems: investigation.affected_systems,
        root_causes: investigation.root_causes,
        contributing_factors: investigation.contributing_factors,
        recommendations: investigation.recommendations,
        metadata: investigation.metadata
      },
      evidence: options.include_evidence ? investigation.evidence : undefined,
      analysis_results: options.include_analysis ? investigation.analysis_results : undefined,
      findings: investigation.findings,
      timeline: options.include_timeline ? this.buildTimeline(investigation) : undefined,
      summary: this.generateSummary(investigation),
      generated_at: new Date().toISOString(),
      generated_by: 'investigations-mcp'
    };

    return JSON.stringify(reportData, null, 2);
  }

  private async generateMarkdownReport(investigation: InvestigationCase, options: ReportOptions): Promise<string> {
    const sections: string[] = [];

    // Header
    sections.push(`# Investigation Report: ${investigation.title}`);
    sections.push(`\n**Investigation ID:** ${investigation.id}`);
    sections.push(`**Status:** ${investigation.status}`);
    sections.push(`**Severity:** ${investigation.severity}`);
    sections.push(`**Category:** ${investigation.category}`);
    sections.push(`**Priority:** ${investigation.priority}`);
    sections.push(`**Created:** ${investigation.created_at.toISOString()}`);
    sections.push(`**Updated:** ${investigation.updated_at.toISOString()}`);
    sections.push(`**Reported By:** ${investigation.reported_by}`);
    sections.push(`**Assigned To:** ${investigation.assigned_to || 'Unassigned'}`);

    // Executive Summary
    sections.push(`\n## Executive Summary`);
    sections.push(`\n${investigation.description}`);

    // Affected Systems
    if (investigation.affected_systems.length > 0) {
      sections.push(`\n## Affected Systems`);
      investigation.affected_systems.forEach(system => {
        sections.push(`- ${system}`);
      });
    }

    // Root Causes
    if (investigation.root_causes.length > 0) {
      sections.push(`\n## Root Causes`);
      investigation.root_causes.forEach((cause, index) => {
        sections.push(`${index + 1}. ${cause}`);
      });
    }

    // Contributing Factors
    if (investigation.contributing_factors.length > 0) {
      sections.push(`\n## Contributing Factors`);
      investigation.contributing_factors.forEach((factor, index) => {
        sections.push(`${index + 1}. ${factor}`);
      });
    }

    // Findings
    if (investigation.findings.length > 0) {
      sections.push(`\n## Findings`);
      investigation.findings.forEach((finding, index) => {
        sections.push(`\n### Finding ${index + 1}: ${finding.title}`);
        sections.push(`**Severity:** ${finding.severity}`);
        sections.push(`**Confidence:** ${(finding.confidence * 100).toFixed(1)}%`);
        sections.push(`\n${finding.description}`);
        if (finding.impact) {
          sections.push(`\n**Impact:** ${finding.impact}`);
        }
      });
    }

    // Evidence
    if (options.include_evidence && investigation.evidence.length > 0) {
      sections.push(`\n## Evidence`);
      sections.push(`\nTotal evidence items: ${investigation.evidence.length}`);
      
      const evidenceByType = this.groupEvidenceByType(investigation.evidence);
      Object.entries(evidenceByType).forEach(([type, items]) => {
        sections.push(`\n### ${type.charAt(0).toUpperCase() + type.slice(1)} Evidence (${items.length} items)`);
        items.forEach((item, index) => {
          sections.push(`\n#### Evidence ${index + 1}`);
          sections.push(`- **ID:** ${item.id}`);
          sections.push(`- **Source:** ${item.source}`);
          sections.push(`- **Size:** ${item.metadata.size} bytes`);
          sections.push(`- **Collected:** ${item.created_at.toISOString()}`);
          sections.push(`- **Checksum:** ${item.metadata.checksum}`);
        });
      });
    }

    // Timeline
    if (options.include_timeline) {
      const timeline = this.buildTimeline(investigation);
      if (timeline.length > 0) {
        sections.push(`\n## Timeline`);
        timeline.forEach((event, index) => {
          sections.push(`${index + 1}. **${event.timestamp}** - ${event.description} (${event.source})`);
        });
      }
    }

    // Analysis Results
    if (options.include_analysis && investigation.analysis_results.length > 0) {
      sections.push(`\n## Analysis Results`);
      investigation.analysis_results.forEach((result, index) => {
        sections.push(`\n### Analysis ${index + 1}: ${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Analysis`);
        sections.push(`**Confidence:** ${(result.confidence * 100).toFixed(1)}%`);
        sections.push(`**Methodology:** ${result.methodology}`);
        
        if (result.hypothesis) {
          sections.push(`**Hypothesis:** ${result.hypothesis}`);
        }
        
        if (result.conclusions.length > 0) {
          sections.push(`\n**Conclusions:**`);
          result.conclusions.forEach(conclusion => {
            sections.push(`- ${conclusion}`);
          });
        }
        
        if (result.recommendations.length > 0) {
          sections.push(`\n**Recommendations:**`);
          result.recommendations.forEach(recommendation => {
            sections.push(`- ${recommendation}`);
          });
        }
      });
    }

    // Recommendations
    if (options.include_recommendations && investigation.recommendations.length > 0) {
      sections.push(`\n## Recommendations`);
      investigation.recommendations.forEach((recommendation, index) => {
        sections.push(`${index + 1}. ${recommendation}`);
      });
    }

    // Metadata
    if (Object.keys(investigation.metadata).length > 0) {
      sections.push(`\n## Metadata`);
      sections.push(`\n\`\`\`json`);
      sections.push(JSON.stringify(investigation.metadata, null, 2));
      sections.push(`\`\`\``);
    }

    // Footer
    sections.push(`\n---`);
    sections.push(`\n*Report generated by investigations-mcp on ${new Date().toISOString()}*`);

    return sections.join('\n');
  }

  private async generateHTMLReport(investigation: InvestigationCase, options: ReportOptions): Promise<string> {
    const markdownContent = await this.generateMarkdownReport(investigation, options);
    
    // Convert markdown to HTML (simplified implementation)
    const htmlContent = this.convertMarkdownToHTML(markdownContent);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investigation Report: ${investigation.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .severity-high { color: #e74c3c; font-weight: bold; }
        .severity-medium { color: #f39c12; font-weight: bold; }
        .severity-low { color: #27ae60; font-weight: bold; }
        .severity-critical { color: #8e44ad; font-weight: bold; }
        code { background: #f1f2f6; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f1f2f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
        ul, ol { margin: 10px 0; }
        li { margin: 5px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    ${htmlContent}
    <div class="footer">
        <p>Report generated by investigations-mcp on ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
  }

  private async convertHTMLToPDF(htmlContent: string): Promise<string> {
    // This would require a PDF generation library like puppeteer
    // For now, return the HTML content as a placeholder
    return htmlContent;
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Simplified markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/```json\n([\s\S]*?)\n```/gim, '<pre><code>$1</code></pre>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(?!<[h|l|p|d])/gim, '<p>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/gim, '')
      .replace(/<p><\/p>/gim, '');
  }

  private buildTimeline(investigation: InvestigationCase): any[] {
    const timeline: any[] = [];

    // Add investigation creation
    timeline.push({
      timestamp: investigation.created_at,
      description: `Investigation created: ${investigation.title}`,
      source: 'system',
      type: 'investigation_created'
    });

    // Add evidence collection events
    investigation.evidence.forEach(evidence => {
      timeline.push({
        timestamp: evidence.created_at,
        description: `Evidence collected: ${evidence.type} from ${evidence.source}`,
        source: 'evidence_collector',
        type: 'evidence_collected',
        evidence_id: evidence.id
      });
    });

    // Add analysis events
    investigation.analysis_results.forEach(analysis => {
      timeline.push({
        timestamp: analysis.created_at,
        description: `Analysis completed: ${analysis.type}`,
        source: 'analysis_engine',
        type: 'analysis_completed',
        analysis_id: analysis.id
      });
    });

    // Add finding events
    investigation.findings.forEach(finding => {
      timeline.push({
        timestamp: finding.created_at,
        description: `Finding identified: ${finding.title}`,
        source: 'investigation',
        type: 'finding_identified',
        finding_id: finding.id
      });
    });

    // Sort by timestamp
    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private groupEvidenceByType(evidence: EvidenceItem[]): Record<string, EvidenceItem[]> {
    return evidence.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    }, {} as Record<string, EvidenceItem[]>);
  }

  private generateSummary(investigation: InvestigationCase): any {
    return {
      total_evidence_items: investigation.evidence.length,
      total_analysis_results: investigation.analysis_results.length,
      total_findings: investigation.findings.length,
      root_causes_identified: investigation.root_causes.length,
      contributing_factors_identified: investigation.contributing_factors.length,
      recommendations_provided: investigation.recommendations.length,
      investigation_duration: investigation.updated_at.getTime() - investigation.created_at.getTime(),
      status: investigation.status,
      severity: investigation.severity
    };
  }
}
