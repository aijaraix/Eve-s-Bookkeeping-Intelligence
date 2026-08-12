import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'db.storage.json');

function seedDirectAudit() {
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
    } catch (e) {}
  }

  // Workspaces
  const appleWsId = 'ws-apple-fy2025';
  const msftWsId = 'ws-msft-fy2025';

  const appleWs = {
    id: appleWsId,
    name: 'Apple Inc. - FY2025 10-K Forensic Audit',
    currency: 'USD',
    period: 'FY 2025',
    status: 'ACTIVE',
    createdDate: new Date().toISOString(),
    description: 'Official SEC Form 10-K multi-agent extraction and GAAP reconciliation for Apple Inc.'
  };

  const msftWs = {
    id: msftWsId,
    name: 'Microsoft Corp - FY2025 10-K Forensic Audit',
    currency: 'USD',
    period: 'FY 2025',
    status: 'ACTIVE',
    createdDate: new Date().toISOString(),
    description: 'Official SEC Form 10-K multi-agent extraction and GAAP reconciliation for Microsoft Corp.'
  };

  db.workspaces = [
    appleWs,
    msftWs,
    ...db.workspaces.filter((w: any) => w.id !== appleWsId && w.id !== msftWsId)
  ];

  // Documents
  const appleDocId = 'doc-aapl-10k-2025';
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

  const msftDocId = 'doc-msft-10k-2025';
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

  db.documents = [
    appleDoc,
    msftDoc,
    ...db.documents.filter((d: any) => d.id !== appleDocId && d.id !== msftDocId)
  ];

  // Extracted Facts for Apple
  const appleFacts = [
    {
      id: 'fct-aapl-rev',
      workspaceId: appleWsId,
      documentId: appleDocId,
      factType: 'Revenue',
      labelOriginal: 'Total Net Sales',
      labelNormalized: 'Revenue',
      valueOriginal: '$416.20B',
      currencyOriginal: 'USD',
      valueFunctional: '416200000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-09-29',
      periodEnd: '2025-09-27',
      pageNumber: 1,
      sourceText: 'Total Net Sales (Revenue): $416,200,000,000 (FY 2025: $416.20B compared to $391.035B in FY 2024).',
      confidence: 0.99,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Net Sales (Revenue): $416,200,000,000',
        contextSentence: 'Total Net Sales reached $416.20B in FY 2025',
        sectionTitle: 'Consolidated Statements of Operations'
      },
      fxDetails: {
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        exchangeRate: 1.0,
        rateDate: '2025-09-27',
        rateSource: 'US Federal Reserve Official Rate'
      }
    },
    {
      id: 'fct-aapl-opinc',
      workspaceId: appleWsId,
      documentId: appleDocId,
      factType: 'Operating Profit',
      labelOriginal: 'Operating Income',
      labelNormalized: 'Operating Profit',
      valueOriginal: '$123.20B',
      currencyOriginal: 'USD',
      valueFunctional: '123200000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-09-29',
      periodEnd: '2025-09-27',
      pageNumber: 1,
      sourceText: 'Operating Income: $123,200,000,000 ($123.20B in FY 2025).',
      confidence: 0.98,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Operating Income: $123,200,000,000',
        contextSentence: 'Operating Income for FY 2025 was $123.20B',
        sectionTitle: 'Consolidated Statements of Operations'
      }
    },
    {
      id: 'fct-aapl-netinc',
      workspaceId: appleWsId,
      documentId: appleDocId,
      factType: 'Net Income',
      labelOriginal: 'Net Income',
      labelNormalized: 'Net Income',
      valueOriginal: '$112.00B',
      currencyOriginal: 'USD',
      valueFunctional: '112000000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-09-29',
      periodEnd: '2025-09-27',
      pageNumber: 1,
      sourceText: 'Net Income: $112,000,000,000 ($112.00B in FY 2025).',
      confidence: 0.99,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Net Income: $112,000,000,000',
        contextSentence: 'Consolidated Net Income reached $112.00B',
        sectionTitle: 'Consolidated Statements of Operations'
      }
    },
    {
      id: 'fct-aapl-assets',
      workspaceId: appleWsId,
      documentId: appleDocId,
      factType: 'Total Assets',
      labelOriginal: 'Total Assets',
      labelNormalized: 'Total Assets',
      valueOriginal: '$331.233B',
      currencyOriginal: 'USD',
      valueFunctional: '331233000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-09-29',
      periodEnd: '2025-09-27',
      pageNumber: 1,
      sourceText: 'Total Assets: $331,233,000,000 ($331.233B as of September 27, 2025).',
      confidence: 1.0,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Assets: $331,233,000,000',
        contextSentence: 'Total Assets as of September 27, 2025 stood at $331.233B',
        sectionTitle: 'Consolidated Balance Sheets'
      }
    },
    {
      id: 'fct-aapl-liab',
      workspaceId: appleWsId,
      documentId: appleDocId,
      factType: 'Total Liabilities',
      labelOriginal: 'Total Liabilities',
      labelNormalized: 'Total Liabilities',
      valueOriginal: '$264.437B',
      currencyOriginal: 'USD',
      valueFunctional: '264437000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-09-29',
      periodEnd: '2025-09-27',
      pageNumber: 1,
      sourceText: 'Total Liabilities: $264,437,000,000 ($264.437B as of September 27, 2025).',
      confidence: 1.0,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Liabilities: $264,437,000,000',
        contextSentence: 'Total Liabilities as of September 27, 2025 stood at $264.437B',
        sectionTitle: 'Consolidated Balance Sheets'
      }
    }
  ];

  // Extracted Facts for Microsoft
  const msftFacts = [
    {
      id: 'fct-msft-rev',
      workspaceId: msftWsId,
      documentId: msftDocId,
      factType: 'Revenue',
      labelOriginal: 'Total Revenue',
      labelNormalized: 'Revenue',
      valueOriginal: '$281.70B',
      currencyOriginal: 'USD',
      valueFunctional: '281700000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-07-01',
      periodEnd: '2025-06-30',
      pageNumber: 1,
      sourceText: 'Total Revenue: $281,700,000,000 ($281.70B in FY 2025 compared to $247.442B in FY 2024).',
      confidence: 0.99,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Revenue: $281,700,000,000',
        contextSentence: 'Total Revenue for FY 2025 reached $281.70B',
        sectionTitle: 'Consolidated Income Statements'
      },
      fxDetails: {
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        exchangeRate: 1.0,
        rateDate: '2025-06-30',
        rateSource: 'US Federal Reserve Official Rate'
      }
    },
    {
      id: 'fct-msft-opinc',
      workspaceId: msftWsId,
      documentId: msftDocId,
      factType: 'Operating Profit',
      labelOriginal: 'Operating Income',
      labelNormalized: 'Operating Profit',
      valueOriginal: '$128.50B',
      currencyOriginal: 'USD',
      valueFunctional: '128500000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-07-01',
      periodEnd: '2025-06-30',
      pageNumber: 1,
      sourceText: 'Operating Income: $128,500,000,000 ($128.50B in FY 2025).',
      confidence: 0.98,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Operating Income: $128,500,000,000',
        contextSentence: 'Operating Income for FY 2025 was $128.50B',
        sectionTitle: 'Consolidated Income Statements'
      }
    },
    {
      id: 'fct-msft-netinc',
      workspaceId: msftWsId,
      documentId: msftDocId,
      factType: 'Net Income',
      labelOriginal: 'Net Income',
      labelNormalized: 'Net Income',
      valueOriginal: '$101.832B',
      currencyOriginal: 'USD',
      valueFunctional: '101832000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-07-01',
      periodEnd: '2025-06-30',
      pageNumber: 1,
      sourceText: 'Net Income: $101,832,000,000 ($101.832B in FY 2025).',
      confidence: 0.99,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Net Income: $101,832,000,000',
        contextSentence: 'Consolidated Net Income reached $101.832B',
        sectionTitle: 'Consolidated Income Statements'
      }
    },
    {
      id: 'fct-msft-assets',
      workspaceId: msftWsId,
      documentId: msftDocId,
      factType: 'Total Assets',
      labelOriginal: 'Total Assets',
      labelNormalized: 'Total Assets',
      valueOriginal: '$619.003B',
      currencyOriginal: 'USD',
      valueFunctional: '619003000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-07-01',
      periodEnd: '2025-06-30',
      pageNumber: 1,
      sourceText: 'Total Assets: $619,003,000,000 ($619.003B as of June 30, 2025).',
      confidence: 1.0,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Assets: $619,003,000,000',
        contextSentence: 'Total Assets as of June 30, 2025 stood at $619.003B',
        sectionTitle: 'Consolidated Balance Sheets'
      }
    },
    {
      id: 'fct-msft-liab',
      workspaceId: msftWsId,
      documentId: msftDocId,
      factType: 'Total Liabilities',
      labelOriginal: 'Total Liabilities',
      labelNormalized: 'Total Liabilities',
      valueOriginal: '$275.524B',
      currencyOriginal: 'USD',
      valueFunctional: '275524000000',
      functionalCurrency: 'USD',
      exchangeRate: '1.0',
      periodStart: '2024-07-01',
      periodEnd: '2025-06-30',
      pageNumber: 1,
      sourceText: 'Total Liabilities: $275,524,000,000 ($275.524B as of June 30, 2025).',
      confidence: 1.0,
      status: 'APPROVED',
      extractionMethod: 'SWARM_CLAUDE_3_7',
      provenance: {
        pageNumber: 1,
        rawSnippet: 'Total Liabilities: $275,524,000,000',
        contextSentence: 'Total Liabilities as of June 30, 2025 stood at $275.524B',
        sectionTitle: 'Consolidated Balance Sheets'
      }
    }
  ];

  db.facts = [
    ...appleFacts,
    ...msftFacts,
    ...db.facts.filter((f: any) => f.workspaceId !== appleWsId && f.workspaceId !== msftWsId)
  ];

  // Audit Logs & Findings
  const auditLogs = [
    {
      id: `AUDIT-AAPL-1`,
      workspaceId: appleWsId,
      documentId: appleDocId,
      timestamp: new Date().toISOString(),
      action: 'SWARM_EXTRACT',
      actor: 'InspectorAgent (Claude 3.7 Sonnet)',
      details: 'Extracted 5 key financial facts from Apple Inc. Form 10-K with exact page and textual provenance coordinates.'
    },
    {
      id: `AUDIT-AAPL-2`,
      workspaceId: appleWsId,
      documentId: appleDocId,
      timestamp: new Date().toISOString(),
      action: 'RECONCILE_ARITHMETIC',
      actor: 'ArithmeticReconcilerAgent',
      details: 'Verified GAAP balance sheet equation: Total Assets ($331.233B) = Total Liabilities ($264.437B) + Equity ($66.796B). Equation reconciled cleanly with 0 variance.'
    },
    {
      id: `AUDIT-MSFT-1`,
      workspaceId: msftWsId,
      documentId: msftDocId,
      timestamp: new Date().toISOString(),
      action: 'SWARM_EXTRACT',
      actor: 'InspectorAgent (Claude 3.7 Sonnet)',
      details: 'Extracted 5 key financial facts from Microsoft Corp Form 10-K with exact page and textual provenance coordinates.'
    },
    {
      id: `AUDIT-MSFT-2`,
      workspaceId: msftWsId,
      documentId: msftDocId,
      timestamp: new Date().toISOString(),
      action: 'RECONCILE_ARITHMETIC',
      actor: 'ArithmeticReconcilerAgent',
      details: 'Verified GAAP balance sheet equation: Total Assets ($619.003B) = Total Liabilities ($275.524B) + Equity ($343.479B). Equation reconciled cleanly with 0 variance.'
    }
  ];

  db.auditLogs = [
    ...auditLogs,
    ...db.auditLogs.filter((a: any) => a.workspaceId !== appleWsId && a.workspaceId !== msftWsId)
  ];

  // Dynamic Findings
  const appleFindings = [
    {
      id: `FND-AAPL-REV`,
      workspaceId: appleWsId,
      companyName: appleWs.name,
      title: 'Revenue Recognition & 10-K Net Sales Audit',
      category: 'Revenue',
      risk: 'Low',
      finAgentStatus: 'Agree',
      auditAgentStatus: 'Agree',
      riskAgentStatus: 'Agree',
      consensusScore: 99,
      confidenceScore: 99,
      materiality: 2081000000,
      status: 'Auto Resolved',
      nextAction: 'Verified FY 2025 net sales of $416.20B against SEC Form 10-K source text.',
      period: 'FY 2025',
      createdDate: '2026-08-07',
      finAgentOpinion: 'Fin AI verified revenue line item $416,200,000,000.',
      finAgentConfidence: 99,
      auditAgentOpinion: 'Audit Agent cross-referenced line item on page 1 of Form 10-K.',
      auditAgentConfidence: 99,
      riskAgentOpinion: 'Risk Agent confirmed low cutoff risk.',
      riskAgentConfidence: 98,
      aiRecommendation: 'Approve net sales line item for financial statements.',
      relatedDocsCount: 1,
      relatedJeCount: 0,
      relatedAccountsCount: 1,
      relatedTasksCount: 0
    }
  ];

  const msftFindings = [
    {
      id: `FND-MSFT-REV`,
      workspaceId: msftWsId,
      companyName: msftWs.name,
      title: 'Revenue Recognition & Cloud Services Revenue Audit',
      category: 'Revenue',
      risk: 'Low',
      finAgentStatus: 'Agree',
      auditAgentStatus: 'Agree',
      riskAgentStatus: 'Agree',
      consensusScore: 99,
      confidenceScore: 99,
      materiality: 1408500000,
      status: 'Auto Resolved',
      nextAction: 'Verified FY 2025 total revenue of $281.70B against SEC Form 10-K source text.',
      period: 'FY 2025',
      createdDate: '2026-08-07',
      finAgentOpinion: 'Fin AI verified total revenue line item $281,700,000,000.',
      finAgentConfidence: 99,
      auditAgentOpinion: 'Audit Agent cross-referenced revenue statement on page 1 of Form 10-K.',
      auditAgentConfidence: 99,
      riskAgentOpinion: 'Risk Agent confirmed compliance with ASC 606 standards.',
      riskAgentConfidence: 98,
      aiRecommendation: 'Approve total revenue line item.',
      relatedDocsCount: 1,
      relatedJeCount: 0,
      relatedAccountsCount: 1,
      relatedTasksCount: 0
    }
  ];

  db.findings = [
    ...appleFindings,
    ...msftFindings,
    ...db.findings.filter((f: any) => f.workspaceId !== appleWsId && f.workspaceId !== msftWsId)
  ];

  fs.writeFileSync(STORAGE_FILE, JSON.stringify(db, null, 2));
  console.log('✅ DIRECT AUDIT SEEDING COMPLETE FOR APPLE INC AND MICROSOFT CORP!');
}

seedDirectAudit();
