/**
 * Core type definitions for the Investigations MCP tools
 */

export interface InvestigationCase {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'reliability' | 'configuration' | 'network' | 'application';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  created_at: Date;
  updated_at: Date;
  reported_by: string;
  assigned_to?: string;
  affected_systems: string[];
  evidence: EvidenceItem[];
  analysis: AnalysisResult[];
  analysis_results: AnalysisResult[];
  findings: Finding[];
  root_causes: string[];
  contributing_factors: string[];
  recommendations: Recommendation[];
  metadata: Record<string, any>;
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  type: 'log' | 'config' | 'metric' | 'network' | 'process' | 'filesystem' | 'database' | 'security' | 'infrastructure' | 'container' | 'cloud' | 'monitoring';
  source: string;
  path?: string;
  content: any;
  metadata: EvidenceMetadata;
  chain_of_custody: CustodyEntry[];
  tags: string[];
  created_at: Date;
}

export interface EvidenceMetadata {
  timestamp: Date;
  size: number;
  checksum: string;
  collected_by: string;
  collection_method: string;
  source_system: string;
  original_path?: string;
  file_permissions?: string;
  process_id?: number;
  user_id?: string;
  environment?: string;
}

export interface CustodyEntry {
  timestamp: Date;
  action: 'collected' | 'transferred' | 'analyzed' | 'modified' | 'archived';
  performed_by: string;
  notes?: string;
  location?: string;
  integrity_verified: boolean;
}

export interface AnalysisResult {
  id: string;
  investigation_id: string;
  type: 'timeline' | 'causal' | 'performance' | 'security' | 'correlation' | 'statistical';
  hypothesis?: string;
  confidence: number;
  evidence_supporting: string[];
  evidence_contradicting: string[];
  conclusions: string[];
  recommendations: string[];
  methodology: string;
  limitations: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Finding {
  id: string;
  investigation_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  evidence_ids: string[];
  confidence: number;
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
  created_at: Date;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  created_at: Date;
}

export interface TimelineEvent {
  id: string;
  investigation_id: string;
  timestamp: Date;
  event_type: string;
  description: string;
  source: string;
  evidence_id?: string;
  related_events: string[];
  metadata: Record<string, any>;
}

export interface CausalRelationship {
  id: string;
  investigation_id: string;
  cause_event_id: string;
  effect_event_id: string;
  relationship_type: 'direct' | 'contributing' | 'correlated';
  confidence: number;
  evidence_ids: string[];
  description: string;
}

export interface InvestigationReport {
  id: string;
  investigation_id: string;
  format: 'json' | 'markdown' | 'pdf' | 'html' | 'xml' | 'yaml' | 'csv' | 'excel' | 'powerpoint';
  content: string;
  generated_at: Date;
  generated_by: string;
  includes_evidence: boolean;
  includes_timeline: boolean;
  includes_analysis: boolean;
  file_path?: string;
}

export interface EvidenceSource {
  type: 'logs' | 'config' | 'metrics' | 'network' | 'process' | 'filesystem' | 'database' | 'security';
  path?: string;
  filters?: Record<string, any>;
  time_range?: {
    start: Date;
    end: Date;
  };
  parameters?: Record<string, any>;
}

export interface InvestigationFilters {
  status?: 'active' | 'completed' | 'archived';
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  date_range?: {
    start: Date;
    end: Date;
  };
  assigned_to?: string;
  affected_systems?: string[];
  limit?: number;
  offset?: number;
}

export interface AnalysisOptions {
  analysis_type: 'timeline' | 'causal' | 'performance' | 'security' | 'correlation';
  hypothesis?: string;
  confidence_threshold?: number;
  max_depth?: number;
  include_contributing_factors?: boolean;
  correlation_rules?: string[];
  time_window?: {
    start: Date;
    end: Date;
  };
}

export interface ValidationResult {
  hypothesis: string;
  confidence: number;
  evidence_supporting: string[];
  evidence_contradicting: string[];
  conclusion: 'supported' | 'contradicted' | 'insufficient_evidence';
  reasoning: string;
  recommendations: string[];
}

export interface RootCauseAnalysis {
  primary_cause: string;
  contributing_factors: string[];
  causal_chain: CausalRelationship[];
  confidence: number;
  evidence_summary: string;
  impact_assessment: {
    scope: string;
    severity: string;
    duration: string;
    affected_systems: string[];
  };
  prevention_recommendations: string[];
}

// Error types
export class InvestigationError extends Error {
  constructor(
    message: string,
    public code: string,
    public investigation_id?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'InvestigationError';
  }
}

export class EvidenceError extends InvestigationError {
  constructor(
    message: string,
    public evidence_id?: string,
    details?: any
  ) {
    super(message, 'EVIDENCE_ERROR', undefined, details);
    this.name = 'EvidenceError';
  }
}

export class AnalysisError extends InvestigationError {
  constructor(
    message: string,
    public analysis_id?: string,
    details?: any
  ) {
    super(message, 'ANALYSIS_ERROR', undefined, details);
    this.name = 'AnalysisError';
  }
}

// Utility types
export type InvestigationStatus = InvestigationCase['status'];
export type InvestigationSeverity = InvestigationCase['severity'];
export type InvestigationCategory = InvestigationCase['category'];
export type EvidenceType = EvidenceItem['type'];
export type AnalysisType = AnalysisResult['type'];

// Analysis Engine Types

export interface TimelinePattern {
  pattern_type: string;
  description: string;
  frequency: number;
  confidence: number;
}

export interface PerformanceMetric {
  metric_type: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: number;
}

export interface PerformanceBottleneck {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
}

export interface SecurityIssue {
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_systems: string[];
  remediation: string[];
}

export interface CorrelationRule {
  rule_id: string;
  description: string;
  conditions: string[];
  confidence_threshold: number;
}

export interface StatisticalAnomaly {
  anomaly_type: string;
  description: string;
  confidence: number;
  affected_metrics: string[];
}

export interface VisualizationOptions {
  width: number;
  height: number;
  theme?: string;
  include_labels?: boolean;
  interactive?: boolean;
}

export interface APICredentials {
  base_url: string;
  api_key?: string;
  username?: string;
  password?: string;
  token?: string;
}

export interface APIParameters {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

