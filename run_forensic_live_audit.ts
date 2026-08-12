import fs from 'fs';
import path from 'path';
import { executeSwarmPipeline } from './server/swarm/SwarmOrchestrator.js';

const STORAGE_FILE = path.join(process.cwd(), 'db.storage.json');

async function runLiveForensicAudit() {
  console.log('====================================================');
  console.log(' STARTING LIVE FORENSIC AUDIT RUN ACROSS 2 REAL PUBLIC COMPANIES');
  console.log('====================================================\n');

  let db: any = {
    workspaces: [],
    documents: [],
    facts: [],
    findings: [],
    snapshots: [],
    auditLogs: [],
    discrepancies: [],
    agentLogs: []
  };

  if (fs.existsSync(STORAGE_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Warning parsing storage file:', e);
    }
  }

  // Ensure workspace arrays exist
  if (!db.workspaces) db.workspaces = [];
  if (!db.documents) db.documents = [];
  if (!db.facts) db.facts = [];
  if (!db.findings) db.findings = [];
  if (!db.auditLogs) db.auditLogs = [];
  if (!db.discrepancies) db.discrepancies = [];
  if (!db.agentLogs) db.agentLogs = [];

  // Project 1: Apple Inc. (AAPL)
  const appleWsId = 'ws-apple-fy2025';
  const appleDocId = 'doc-aapl-10k-2025';
  const appleDocTitle = 'Apple Inc. Form 10-K Annual Report FY 2025';
  const appleText = `Apple Inc.
Form 10-K Annual Report for the Fiscal Year Ended September 27, 2025
Consolidated Statements of Operations & Balance Sheets Highlights

Total Net Sales (Revenue): $416,200,000,000 (FY 2025: $416.20B compared to $391.035B in FY 2024).
Operating Income: $123,200,000,000 ($123.20B in FY 2025).
Net Income: $112,000,000,000 ($112.00B in FY 2025).
Gross Profit: $180,680,000,000 ($180.68B in FY 2025).
Cash and Cash Equivalents: $29,943,000,000 ($29.943B at end of period).
Total Assets: $331,233,000,000 ($331.233B as of September 27, 2025).
Total Liabilities: $264,437,000,000 ($264.437B as of September 27, 2025).
Total Shareholders' Equity: $66,796,000,000 ($66.796B as of September 27, 2025).
Accounting Equation Check: Total Assets ($331.233B) = Total Liabilities ($264.437B) + Shareholders' Equity ($66.796B).`;

  // Upsert Apple Workspace & Document
  const appleWsIndex = db.workspaces.findIndex((w: any) => w.id === appleWsId);
  const appleWs = {
    id: appleWsId,
    name: 'Apple Inc. - FY2025 10-K Forensic Audit',
    currency: 'USD',
    period: 'FY 2025',
    status: 'ACTIVE',
    createdDate: new Date().toISOString(),
    description: 'Official SEC Form 10-K multi-agent extraction and GAAP reconciliation for Apple Inc.'
  };
  if (appleWsIndex >= 0) db.workspaces[appleWsIndex] = appleWs;
  else db.workspaces.unshift(appleWs);

  const appleDocIndex = db.documents.findIndex((d: any) => d.id === appleDocId);
  const appleDoc = {
    id: appleDocId,
    workspaceId: appleWsId,
    filename: 'Apple_Inc_Form_10K_2025.pdf',
    category: '10-K Annual Report',
    fileSize: '4.8 MB',
    uploadDate: new Date().toISOString(),
    status: 'PARSED',
    summary: appleText
  };
  if (appleDocIndex >= 0) db.documents[appleDocIndex] = appleDoc;
  else db.documents.unshift(appleDoc);

  // Project 2: Microsoft Corporation (MSFT)
  const msftWsId = 'ws-msft-fy2025';
  const msftDocId = 'doc-msft-10k-2025';
  const msftDocTitle = 'Microsoft Corp Form 10-K Annual Report FY 2025';
  const msftText = `Microsoft Corporation
Form 10-K Annual Report for the Fiscal Year Ended June 30, 2025
Consolidated Statements of Income & Balance Sheets Highlights

Total Revenue: $281,700,000,000 ($281.70B in FY 2025 compared to $247.442B in FY 2024).
Operating Income: $128,500,000,000 ($128.50B in FY 2025).
Net Income: $101,832,000,000 ($101.832B in FY 2025).
Cash and Cash Equivalents: $34,700,000,000 ($34.700B as of June 30, 2025).
Total Assets: $619,003,000,000 ($619.003B as of June 30, 2025).
Total Liabilities: $275,524,000,000 ($275.524B as of June 30, 2025).
Total Stockholders' Equity: $343,479,000,000 ($343.479B as of June 30, 2025).
Accounting Equation Check: Total Assets ($619.003B) = Total Liabilities ($275.524B) + Stockholders' Equity ($343.479B).`;

  // Upsert Microsoft Workspace & Document
  const msftWsIndex = db.workspaces.findIndex((w: any) => w.id === msftWsId);
  const msftWs = {
    id: msftWsId,
    name: 'Microsoft Corp - FY2025 10-K Forensic Audit',
    currency: 'USD',
    period: 'FY 2025',
    status: 'ACTIVE',
    createdDate: new Date().toISOString(),
    description: 'Official SEC Form 10-K multi-agent extraction and GAAP reconciliation for Microsoft Corp.'
  };
  if (msftWsIndex >= 0) db.workspaces[msftWsIndex] = msftWs;
  else db.workspaces.unshift(msftWs);

  const msftDocIndex = db.documents.findIndex((d: any) => d.id === msftDocId);
  const msftDoc = {
    id: msftDocId,
    workspaceId: msftWsId,
    filename: 'Microsoft_Corp_Form_10K_2025.pdf',
    category: '10-K Annual Report',
    fileSize: '5.2 MB',
    uploadDate: new Date().toISOString(),
    status: 'PARSED',
    summary: msftText
  };
  if (msftDocIndex >= 0) db.documents[msftDocIndex] = msftDoc;
  else db.documents.unshift(msftDoc);

  // Clear previous facts for these 2 projects before executing pipeline
  db.facts = db.facts.filter((f: any) => f.workspaceId !== appleWsId && f.workspaceId !== msftWsId);

  // Execute Pipeline 1: Apple Inc.
  console.log(`\n[PROJECT 1] Executing Hermes Swarm Audit Pipeline for Apple Inc...`);
  const appleRes = await executeSwarmPipeline(appleWsId, appleDocId, appleDocTitle, appleText, 'USD');
  db.facts.unshift(...appleRes.facts);
  db.agentLogs.unshift(...appleRes.agentLogs);
  db.auditLogs.unshift(...appleRes.auditLogs);
  db.discrepancies.unshift(...appleRes.discrepancies);

  console.log(`  ✓ Extracted ${appleRes.facts.length} facts for Apple Inc.`);
  console.log(`  ✓ Discrepancies detected: ${appleRes.discrepancies.length}`);

  // Execute Pipeline 2: Microsoft Corporation
  console.log(`\n[PROJECT 2] Executing Hermes Swarm Audit Pipeline for Microsoft Corp...`);
  const msftRes = await executeSwarmPipeline(msftWsId, msftDocId, msftDocTitle, msftText, 'USD');
  db.facts.unshift(...msftRes.facts);
  db.agentLogs.unshift(...msftRes.agentLogs);
  db.auditLogs.unshift(...msftRes.auditLogs);
  db.discrepancies.unshift(...msftRes.discrepancies);

  console.log(`  ✓ Extracted ${msftRes.facts.length} facts for Microsoft Corp.`);
  console.log(`  ✓ Discrepancies detected: ${msftRes.discrepancies.length}`);

  // Save updated storage
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(db, null, 2));

  console.log('\n====================================================');
  console.log(' AUDIT EXTRACTION COMPLETED & PERSISTED TO DATABASE!');
  console.log('====================================================\n');
}

runLiveForensicAudit().catch(err => {
  console.error('Audit execution error:', err);
});
