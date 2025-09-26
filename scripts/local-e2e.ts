import { InvestigationDatabase } from '../src/services/database.js';
import { EvidenceCollector } from '../src/collectors/evidence-collector.js';
import { ReportGenerator } from '../src/services/report-generator.js';
import { v4 as uuidv4 } from 'uuid';
import type { InvestigationCase } from '../src/types/index.js';

async function main() {
  const db = new InvestigationDatabase();
  const collector = new EvidenceCollector();
  const reports = new ReportGenerator('./reports');

  await db.initialize();

  const id = uuidv4();
  const now = new Date();
  const inv: InvestigationCase = {
    id,
    title: 'Local E2E Test',
    description: 'Local terminal-only test for security/infrastructure and report generation',
    status: 'active',
    severity: 'medium',
    category: 'application',
    priority: 'p2',
    created_at: now,
    updated_at: now,
    reported_by: 'local-tester',
    affected_systems: ['localhost'],
    assigned_to: undefined,
    evidence: [],
    analysis: [],
    analysis_results: [],
    findings: [],
    root_causes: [],
    contributing_factors: [],
    recommendations: [],
    metadata: {}
  };

  await db.createInvestigation(inv);
  console.log('Investigation created:', id);

  // Collect security and infrastructure evidence
  for (const type of ['security', 'infrastructure'] as const) {
    try {
      const ev = await collector.collect({ type, source: type }, { investigation_id: id, preserve_chain_of_custody: true });
      await db.addEvidence(ev);
      console.log(`Collected evidence: ${type} ->`, ev.metadata.size, 'bytes');
    } catch (e) {
      console.error(`ERROR collecting ${type}:`, e);
    }
  }

  // Reload full investigation for reporting (with evidence)
  const loaded = await db.getInvestigation(id);
  if (!loaded) throw new Error('Failed to reload investigation');
  loaded.evidence = await db.getEvidence(id);

  // Generate multiple report formats
  for (const format of ['json', 'markdown', 'html', 'xml', 'yaml', 'csv', 'excel', 'powerpoint'] as const) {
    try {
      const report = await reports.generateReport({
        investigation: loaded,
        format,
        include_evidence: true,
        include_timeline: true,
        include_analysis: true
      });
      console.log(`Report OK: ${format} ->`, report.file_path || `${report.content.length} chars`);
    } catch (e) {
      console.error(`ERROR report ${format}:`, e);
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});


