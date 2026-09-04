import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// System & Worker Diagnostics
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), port: PORT });
});

app.get('/api/status', (req, res) => {
  const workerUrl = process.env.EXTRACTION_WORKER_URL || 'https://eves-worker.zeabur.app';
  const hasSecret = Boolean(process.env.EXTRACTION_WORKER_SECRET);
  res.json({
    status: 'operational',
    service: 'Eve Audit & Financial Intelligence Platform',
    version: '2.4.1',
    hermesSwarm: {
      activeAgents: 6,
      totalAgents: 6,
      systemHealth: 99.4,
      lastVerificationPass: '2026-09-04T12:40:00Z',
    },
    worker: {
      url: workerUrl,
      authenticated: hasSecret,
      status: 'ready',
    },
    llmGateway: {
      provider: process.env.GEMINI_API_KEY ? 'Google Gemini 2.5 Pro' : 'Local Deterministic Forensic Model',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    }
  });
});

// Mock Data APIs
app.get('/api/companies', (req, res) => {
  res.json([
    {
      id: 'unilever_group',
      name: 'Unilever PLC & NV (Consolidated Group)',
      ticker: 'ULVR.L / UNA.AS',
      reportingStandard: 'IFRS',
      currency: 'EUR',
      scale: 'millions',
      fiscalYear: 'FY2024 Audited',
      auditStatus: 'Clean Opinion',
      verificationScore: 99.4,
    },
    {
      id: 'meridian_tech',
      name: 'Meridian Enterprise Solutions Inc.',
      ticker: 'MES.NYSE',
      reportingStandard: 'US-GAAP',
      currency: 'USD',
      scale: 'millions',
      fiscalYear: 'FY2024 10-K',
      auditStatus: 'Findings Detected',
      verificationScore: 94.2,
    }
  ]);
});

// AI Copilot endpoint
app.post('/api/copilot/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Eve, an institutional-grade Senior Audit Partner and Forensic Financial AI.
Context:
Company: Unilever PLC & NV (Consolidated Group)
Reporting Standard: IFRS, Currency: EUR in millions
FY2024 Turnover: €60,812M (+2.0% YoY)
FY2024 Operating Profit: €10,387M
Total Assets: €73,020M, Total Equity: €22,820M
Audit Status: Clean Opinion (99.4% Hermes Swarm confidence)
Recent findings: Note 15 Lease Restatement variance of €14M, EPS rounding artifact of €0.01 in continuing vs discontinued ops.

User Query: ${message}

Provide a concise, forensic-grade analysis with citations to Notes, Working Papers, and specific materiality thresholds where applicable.`,
      });

      return res.json({
        reply: response.text || 'Audit analysis completed successfully.',
        model: 'gemini-2.5-flash',
        citations: [
          { source: 'Annual_Report_2024_P98.pdf', page: 98, fact: 'Turnover €60,812M' },
          { source: 'Annual_Report_2024_P101.pdf', page: 101, fact: 'Note 15 Capitalized Leases' }
        ]
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, using deterministic forensic fallback:', err.message);
    }
  }

  // Forensic accounting intelligent fallback
  let fallbackReply = `**Eve Audit Intelligence Report**:
Based on the current verified statements for Unilever PLC (FY2024 IFRS):
- **Turnover**: €60,812M (reconciled across P&L, Segment Note 3, and Cash Flow operating activities).
- **Operating Margin**: 17.08% (10,387 / 60,812), showing +70 bps expansion.
- **Audit Findings**: 1 material footnote variance identified in Note 15 (€14M lease liability adjustment due to IFRS 16 scope revision). All balance checks hold ($0.00 discrepancy).
- **Hermes Swarm Status**: All 6 verification agents report passing integrity with 99.4% confidence score.`;

  const lower = message.toLowerCase();
  if (lower.includes('lease') || lower.includes('note 15')) {
    fallbackReply = `**Forensic Note 15 Deep-Dive**:
In the FY2024 Annual Report (Page 101), Note 15 shows capitalized lease obligations of €2,410M for the prior comparative year (FY2023), whereas the FY2023 standalone report printed €2,396M.
- **Variance**: +€14M.
- **Cause**: Retrospective adoption of IFRS 16 lease amendment regarding sale-and-leaseback transactions.
- **Audit Recommendation**: Accept restatement and annotate Working Paper WP-401 with cross-reference to Note 15 paragraph 4.`;
  } else if (lower.includes('balance sheet') || lower.includes('equation')) {
    fallbackReply = `**Balance Sheet Integrity Check (IAS 1)**:
- Total Assets: €73,020M
- Total Liabilities: €50,200M
- Total Shareholders' Equity: €22,820M
- **Equation Verification**: Total Assets (€73,020M) = Liabilities (€50,200M) + Equity (€22,820M)
- **Variance**: €0.00 (Zero variance). The fundamental accounting equation is satisfied with 100% mathematical precision.`;
  }

  res.json({
    reply: fallbackReply,
    model: 'Deterministic Forensic Expert Engine',
    citations: [
      { source: 'Annual_Report_2024_P98.pdf', page: 98, fact: 'Turnover €60,812M' },
      { source: 'Annual_Report_2024_P101.pdf', page: 101, fact: 'Total Assets & Note 15' }
    ]
  });
});

// Swarm execution simulation
app.post('/api/swarm/run', (req, res) => {
  res.json({
    success: true,
    runId: `run-${Date.now()}`,
    passedAgents: 6,
    totalAgents: 6,
    checksExecuted: 1080,
    discrepanciesDetected: 3,
    integrityScore: 99.4,
    executionTimeMs: 412,
  });
});

// Setup Vite dev middleware or static serving
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Eve Audit Platform] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Eve Audit Platform] Mode: ${isProduction ? 'Production' : 'Development'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
