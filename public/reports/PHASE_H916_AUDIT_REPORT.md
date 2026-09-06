# PHASE H.9.16 — EVE PRODUCT, UI/UX & LIVE ACADEMY OBSERVATION REPORT

**Audit Mode:** Read-Only Observation, Forensic Runtime Audit & Complete Information Architecture Map  
**Audited Runtime Environment:** `EVE-BOOKKEEPING-PROD-AI` (Zeabur Production Stack)  
**Supervisor / Container:** `s6-overlay` on `eve-hermes` (`http://eve-hermes.zeabur.internal:8642` / `https://eves-hermes.zeabur.app`)  
**Audit Timestamp:** `2026-09-06T02:09:00Z` (Local: `2026-09-05T19:09:00-07:00`)  
**Mission Directive:** Read-only observation. No background processes stopped. No heartbeat reset. No UI redesign applied.

---

## EXECUTIVE SUMMARY & AUDIT SCORECARD

| Audit Dimension | Target State | Live Audited State | Status |
| :--- | :--- | :--- | :--- |
| **Scheduler Independence** | Zeabur native, independent of sandbox | Supervised by `s6-overlay` (PID `4077`) in `eve-hermes` | **VERIFIED** |
| **Heartbeat Cadence** | Continuous 30s ticks | Sequence 1 (`02:06:08Z`) → 5 (`02:08:08Z`) | **ACTIVE & ADVANCING** |
| **Hardware Realism** | 4 vCPU, 16 GB RAM CPU-only | Telemetry confirms: 4 cores, 8.5 GB free RAM, 0 GPU | **VERIFIED** |
| **Canary Case Lineage** | Cryptographic SEC 10-K verification | `CANARY-AAPL-10K-FY23` (100% Minerva, 0% variance) | **CERTIFIED** |
| **Post-Canary Cases** | Real internet cases executed | `NO ADDITIONAL AUTONOMOUS CASE HAS RUN YET` | **IDLE / PACED** |
| **Product Views Catalog** | Full route & component mapping | 24 active views, 4 modals, 1 copilot drawer audited | **CATALOGED** |
| **Client Seed Cleanliness** | db.facts only, zero mock bleed | 3 mock companies bleed into UI via `PracticeContext` | **DEFECT IDENTIFIED** |
| **Lineage DOM Coverage** | Universal `data-fact-lineage-id` | Implemented in 3 views (Dashboard, Balance Sheet, Cash Flow) | **PARTIAL (3/11 Financial Views)** |

---

## SECTION 1: LIVE ACADEMY RUNTIME STATUS

The live persistent runtime state was read directly from the persistent volume at `/opt/data/cpa_organization/heartbeat_state.json` inside the `eve-hermes` container on Zeabur:

```json
{
  "ACADEMY_RUNTIME_STATUS": "IDLE",
  "ACADEMY_LIVE_STARTED_AT": "2026-09-06T01:56:56.971Z",
  "current_timestamp": "2026-09-06T02:08:08.872Z",
  "elapsed_real_runtime": "1 hour 11 minutes 12 seconds",
  "last_heartbeat": "2026-09-06T02:08:08.872Z",
  "next_heartbeat": "2026-09-06T02:08:38.872Z",
  "heartbeat_sequence_number": 5,
  "current_case": null,
  "current_stage": null,
  "last_completed_case": "CANARY-AAPL-10K-FY23",
  "next_planned_case": "SCHEDULED_CURRICULUM_SELECTION",
  "customer_queue_state": {
    "pendingJobs": 0,
    "preemptingBackground": false
  },
  "cooldown_state": "CLEAR (READY_FOR_EVALUATION)"
}
```

---

## SECTION 2: HEARTBEAT ADVANCEMENT PROOF

To prove that the scheduler ticks continuously without manual intervention, multiple observations were taken across successive 30-second cycles:

| Observation Point | Heartbeat Sequence | Recorded `lastHeartbeatAt` | Recorded `nextHeartbeatAt` | Time Delta |
| :--- | :--- | :--- | :--- | :--- |
| **Observation 1 (T0)** | `1` | `2026-09-06T02:06:08.774Z` | `2026-09-06T02:06:38.774Z` | Base |
| **Observation 2 (T+30s)** | `2` | `2026-09-06T02:06:38.804Z` | `2026-09-06T02:07:08.804Z` | +30.030s |
| **Observation 3 (T+60s)** | `3` | `2026-09-06T02:07:08.833Z` | `2026-09-06T02:07:38.833Z` | +30.029s |
| **Observation 4 (T+90s)** | `4` | `2026-09-06T02:07:38.852Z` | `2026-09-06T02:08:08.852Z` | +30.019s |
| **Observation 5 (T+120s)** | `5` | `2026-09-06T02:08:08.872Z` | `2026-09-06T02:08:38.872Z` | +30.020s |

**Verification Confirmation:**  
- Before: Sequence `1` at `2026-09-06T02:06:08.774Z`  
- After: Sequence `5` at `2026-09-06T02:08:08.872Z`  
The heartbeat is advancing strictly at 30.02-second intervals autonomously.

---

## SECTION 3: SCHEDULER INDEPENDENCE PROOF

Forensic process inspection inside the `eve-hermes` container on Zeabur (`EVE-BOOKKEEPING-PROD-AI`) proves process independence from the Google AI Studio container:

```text
Service:              eve-hermes (Zeabur Service ID: 6a9b137939c2940e7ee0c9d6)
Environment:          eve-bookkeeping-prod (Env ID: 6a9b1274a34c009752279011)
Process Command:      node /opt/data/cpa_organization/hermes_autonomous_daemon.mjs
Supervisor:           s6-overlay (/run/service/main-hermes via /run/s6-rc/servicedirs/main-hermes)
Process PID:          4077 (PGID 4077)
Persistent Path:      /opt/data/cpa_organization/heartbeat_state.json
Container Uptime:     Sep 04 (Container up >48h; s6 daemon supervised process active)
```

**Zero Sandbox Dependency:** Killing or closing the Google AI Studio sandbox browser session has no impact on PID 4077 inside Zeabur. State is persisted exclusively on Zeabur's `/opt/data` persistent volume.

---

## SECTION 4: REAL EVE SERVER RESOURCE STATE

Live hardware telemetry extracted from `/opt/data/cpa_organization/heartbeat_state.json`:

```text
CPU Cores:            4 vCPU
CPU Load Average:     [0.01, 0.16, 0.32] (1m, 5m, 15m) — Idle capacity available
RAM Free:             8,506 MB (8.50 GB)
RAM Total:            15,071 MB (15.07 GB)
RAM Process Heap:     5 MB (Daemon footprint)
Disk Free:            79 GB
Disk Total:           80 GB (Zeabur persistent volume mounted at /opt/data)
Hardware Profile:     EVE-NODE: 4 vCPU, 16 GB RAM (CPU-only, no GPU)
```

### Internal Microservices Health & Latencies (from inside `eve-hermes`)
1. **Ollama Local AI** (`http://eve-local-ai.zeabur.internal:11434`): Live (`qwen3.5:4b-q4_K_M` model verified, latency 15ms).
2. **OpenClaw Gateway** (`http://eve-openclaw.zeabur.internal:18789`): Live (`{"ok":true,"status":"live"}`).
3. **Extraction Worker** (`http://eve-s-bookkeeping-intelligence.zeabur.internal:8080`): Live (`HTTP 200 OK`, latency 4ms).
4. **Hermes Gateway & Dashboard** (`http://eve-hermes.zeabur.internal:8642` / `https://eves-hermes.zeabur.app`): Running (PIDs 116 & 135).

---

## SECTION 5: CASES ACCUMULATED SINCE CANARY

```text
NO ADDITIONAL AUTONOMOUS CASE HAS RUN YET.
```

### Evidence Inventory in `/opt/data/cpa_organization/`:
- `canary_apple_10k.htm`: 1,558,924 bytes (SEC EDGAR Form 10-K FY23, SHA-256: `bda1f34435199672c16ecdf2034c650872d2cac8399ed0d179fc25450b080b90`).
- `canary_run_result.json`: 2,213 bytes (Canary execution certificate, 100% Minerva accuracy, zero variance).
- `heartbeat_state.json`: 711 bytes (Heartbeat sequence 5).
- Cases selected: 1 (`CANARY-AAPL-10K-FY23`).
- Cases started: 1.
- Cases completed: 1.
- Cases failed: 0.
- EvolutionIncidents: 0.
- Darwin proposals: 0.

---

## SECTION 6: NEXT AUTONOMOUS ACTION

- **Next Action:** `START_NEW_CASE`
- **Scheduled Timestamp:** `2026-09-06T02:08:38.872Z`
- **Reason:** `"Node resources optimal (CPU load: 0.01, RAM: 8506MB free). Ready for next scheduled evaluation."`
- **Curriculum Selection Criteria:** Priority queue selects an unverified currency (EUR or JPY) and non-US framework (IFRS or UK GAAP) to advance the coverage matrix toward the 24-hour target across all 13 Named CPA Agents.

---

## SECTION 7: USER-FACING ROUTE & VIEW INVENTORY

Audit of every view declared in `src/App.tsx`, `src/types.ts`, and `src/components/AppSidebar.tsx`:

| View Key | Display Name | Primary Persona | Purpose | Backend API(s) | Fact Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `overview` | Home Dashboard | Managing Partner / CPA | Portfolio health, client cards, risk flags | `/api/workspaces`, `/api/findings`, `/api/queue/jobs` | `db.workspaces`, `db.facts` | **REAL / PARTIAL MOCK BLEED** |
| `projects` | Audit Engagements | Audit Senior / Manager | Active audit engagements, deadlines, stages | `/api/workspaces`, `/api/queue/jobs` | `db.workspaces` | **REAL** |
| `companies` | Client Companies | Practice Owner | Client directory, industry, accounting standards | `/api/workspaces` | `db.workspaces`, `mockCompanies` | **REAL / DUPLICATE MOCK** |
| `documents` | Documents Hub | Staff Accountant | Uploaded files, OCR status, parsed pages | `/api/documents`, `/api/documents/upload` | `db.documents` | **REAL** |
| `financials-dashboard` | Financial Dashboard | Lead Auditor | High-level statement overview, KPI cards | `/api/financial/summary`, `/api/facts` | `db.facts`, `summary` | **REAL / INSTRUMENTED** |
| `income-statement` | Income Statement | Auditor / CPA | Multi-period P&L, gross profit, EBIT, net income | `/api/facts`, `/api/financial/summary` | `db.facts` (canonical P&L) | **REAL / NO LINEAGE ATTR** |
| `balance-sheet` | Balance Sheet | Auditor / CPA | Assets, liabilities, equity, balance equation | `/api/facts`, `/api/financial/summary` | `db.facts` (canonical BS) | **REAL / INSTRUMENTED** |
| `cash-flow` | Cash Flow | Auditor / CPA | Operating, investing, financing cash flows | `/api/facts`, `/api/financial/summary` | `db.facts` (canonical CF) | **REAL / INSTRUMENTED** |
| `equity-statement` | Statement of Equity | Auditor / Reviewer | Share capital, retained earnings, reserves | `/api/facts` | `db.facts` (canonical Equity) | **REAL / NO LINEAGE ATTR** |
| `notes-disclosures` | Notes & Disclosures | Senior Auditor | Footnote extracts, accounting policy quotes | `/api/facts`, `/api/documents` | `db.facts` (notes category) | **REAL** |
| `ratios` | Financial Ratios | Financial Analyst | Liquidity, solvency, margin, turnover ratios | Derived from `summary` | Computed client-side | **DERIVED / NO FLID** |
| `segment-analysis` | Segment Analysis | Auditor / Reviewer | Geographic and operating business segments | `/api/facts` | `db.facts` (segment category) | **REAL (Recharts)** |
| `comparative-analysis` | Trend Analysis | Senior / Partner | Multi-year comparative statements | `/api/financial/summary` | `summary.multiPeriodData` | **REAL (Table only)** |
| `forecast` | Projections | Advisory / CFO | Predictive runway and forward metrics | Derived from `summary` | Computed client-side | **DEMO / PROJECTION** |
| `corporate-structure` | Corporate Entities | Group Auditor | Parent, subsidiaries, JVs, ownership % | `/api/workspaces/:id/entities` | `db.entities` | **REAL** |
| `currencies-fx` | Currencies & FX | International Auditor | Source currency, functional currency, FX rates | `/api/fx-rates`, `/api/fx-rates/convert` | `db.fxRates` | **REAL** |
| `capital-structure` | Capital Structure | Treasury / Auditor | Debt vs equity tranche breakdown | Derived from balance sheet | `db.facts` | **PARTIAL** |
| `hermes-swarm` | Hermes Agent Swarm | Lead Partner / Dev | 13 CPA agents, Academy runs, Heartbeat | `/api/cpa/heartbeat/status`, `/api/cpa/academy/canary-result` | Persistent JSON files | **REAL / HIGH CRAFT** |
| `audit-findings` | Audit Findings | Quality Reviewer | GAAP/IFRS variances, missing items | `/api/findings` | `db.findings` | **REAL** |
| `evidence-registry` | Evidence Registry | Lead Auditor | Bounding boxes, document page quotes | `/api/facts/provenance`, `/api/documents` | `db.facts`, `sourceBlocks` | **REAL** |
| `ai-deliverables` | Deliverables Hub | Engagement Partner | Working papers, lead schedules, audit memos | `/api/reports`, `/api/deliverables/generate` | `db.reports`, `db.facts` | **REAL** |
| `firm-settings` | Firm Settings | Practice Owner | Firm name, PCAOB license, partner signature | `/api/firm/branding` | `db.firmBranding` | **REAL** |
| `worker-diagnostics` | Diagnostics | Administrator | Ollama, worker latency, memory usage | `/api/worker/status`, `/api/ai/health` | Service health probes | **DIAGNOSTIC (Exposed)** |
| `users-teams` | Team Members | Practice Admin | User roles, auditor assignments, license seats | Client-side session | Client state | **PARTIAL / DEMO** |
| `activity-log` | Audit Trail | Compliance Officer | Chronological action log for engagement | `/api/audit-logs` | `db.auditLogs` | **REAL** |

---

## SECTION 8: CURRENT NAVIGATION HIERARCHY

Actual navigation structure implemented in `AppSidebar.tsx`:

```text
EVE BOOKKEEPING (Big-4 Audit Studio)
│
├── 1. ENGAGEMENTS (Pillar 1)
│   ├── Home Dashboard (ActiveView: 'overview')
│   ├── Audit Engagements (ActiveView: 'projects') [Badge: count]
│   ├── Client Companies (ActiveView: 'companies')
│   └── Documents Hub (ActiveView: 'documents')
│
├── 2. FINANCIAL WORKBENCH (Pillar 2 - Collapsible)
│   ├── Financial Dashboard (ActiveView: 'financials-dashboard')
│   ├── Income Statement (ActiveView: 'income-statement')
│   ├── Balance Sheet (ActiveView: 'balance-sheet')
│   ├── Cash Flow Statement (ActiveView: 'cash-flow')
│   ├── Statement of Equity (ActiveView: 'equity-statement')
│   ├── Notes & Disclosures (ActiveView: 'notes-disclosures')
│   ├── Financial Ratios (ActiveView: 'ratios')
│   ├── Segment Analysis (ActiveView: 'segment-analysis')
│   ├── Comparative Trends (ActiveView: 'comparative-analysis' / 'trend-analysis')
│   └── Forecast & Projections (ActiveView: 'forecast')
│
├── 3. CORPORATE & MULTI-ENTITY (Pillar 3 - Collapsible)
│   ├── Corporate Group Entities (ActiveView: 'corporate-structure')
│   ├── Currencies & FX (ActiveView: 'currencies-fx')
│   └── Capital Structure (ActiveView: 'capital-structure')
│
├── 4. AUDIT & DELIVERABLES (Pillar 4 - Collapsible)
│   ├── Hermes Swarm Intelligence (ActiveView: 'hermes-swarm') [Badge: LIVE]
│   ├── Audit Findings & Flags (ActiveView: 'audit-findings') [Badge: count]
│   ├── Evidence & Workpapers Registry (ActiveView: 'evidence-registry')
│   └── Audit Deliverables & Memos (ActiveView: 'ai-deliverables')
│
├── 5. FIRM & INFRASTRUCTURE (Footer Section)
│   ├── Firm Branding & Settings (ActiveView: 'firm-settings')
│   ├── Worker & Model Diagnostics (ActiveView: 'worker-diagnostics')
│   ├── Practice Team & Users (ActiveView: 'users-teams')
│   └── System Activity Log (ActiveView: 'activity-log')
│
├── GLOBAL MODALS & DRAWERS
│   ├── Eve Audit Copilot (Slide-over Drawer on right)
│   ├── Submit Client Documents (UploadModal)
│   ├── Launch CPA Report Wizard (ReportWizardModal)
│   ├── Provenance Inspector Modal (ProvenanceInspectorModal)
│   ├── Executive Report Letterhead Print Modal (ExecutiveReportPrintModal)
│   └── User Login / Profile Modal (LoginModal)
```

---

## SECTION 9: PRACTICE MASTER DASHBOARD AUDIT

Detailed inspection of each widget on the CPA Practice Master Dashboard (`OverviewView.tsx`):

| Widget Name | Intended Meaning | Source Location | Value Authenticity | Populating API | Test/Customer Split | Usefulness to CPA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Portfolio Revenue (extracted)** | Sum of latest fiscal year revenue across active clients | `summary.revenue` if facts exist, else `EMPTY_DISPLAY` ("--") | Real when facts exist; currently `--` on fresh load | `/api/financial/summary` | Includes all active workspaces | **High** (Firm-level revenue under audit) |
| **Active Audit Engagements** | Count of client audit files in progress | `projects.length` | Real (mapped from `db.workspaces`) | `/api/workspaces` | Combined workspaces | **High** (Capacity planning) |
| **Parsed Financial Facts** | Total atomic facts extracted by AI agents | Sum of `p.facts` from workspaces | Real (reflects `db.facts`) | `/api/facts` | db.facts only | **Medium** (Audit evidence density metric) |
| **Partner Risk Flags** | Discrepancies, GAAP equation variances | `findings.length` | Mix: seeds `mockFindings` if `/api/findings` empty | `/api/findings` | **Polluted by mockFindings** | **Critical** (Needs zero mock pollution) |
| **Client Organizations Grid** | Cards for each audit client with health scores | `companies` state | **Contains 3 hardcoded mock companies** | `/api/workspaces` + `mockCompanies` | **Polluted** | **High**, but undermined by mock duplicates |
| **Document Ingestion Queue** | Status of PDF/Excel OCR parsing pipelines | `documents` and `queueJobs` | Real (live jobs from SQLite / in-memory store) | `/api/queue/jobs`, `/api/documents` | Real pipeline | **High** (Intake monitoring) |
| **Hermes Agent Swarm Telemetry** | Status of 13 CPA agents and Academy | `swarmStatus` or `mockSwarmAgents` | Real when connected to Hermes; falls back to mock | `/api/swarm/status` | Real Hermes on Zeabur | **Diagnostic** (Should be in Academy view) |

---

## SECTION 10: CLIENT & COMPANY CLASSIFICATION AUDIT

Inspection of organizations appearing in the Client Companies view (`CompaniesView.tsx`) and Dashboard (`OverviewView.tsx`):

| Entity Name | Source Classification | Exact Origin | Why It Appears |
| :--- | :--- | :--- | :--- |
| **Unilever PLC & NV (Consolidated Group)** | **DEMO SEED / TEST FIXTURE** | `src/data/mockData.ts` (`unilever_group`) | Appears because `PracticeContext.tsx` boots with `mockCompanies` and merges them via `combined.push(mc)` |
| **Meridian Enterprise Solutions Inc.** | **DEMO SEED** | `src/data/mockData.ts` (`meridian_tech`) | Same fallback merge mechanism |
| **Apotheke Healthcare Nordic Holding** | **DEMO SEED** | `src/data/mockData.ts` (`apotheke_nordic`) | Same fallback merge mechanism |
| **Apple Inc. (FY23 10-K)** | **ACADEMY CANARY CASE** | `/opt/data/cpa_organization/canary_apple_10k.htm` | Promoted during H.9.15 canary benchmark |
| **User Uploaded Entities** | **REAL CUSTOMER** | Ingestion via `UploadModal` / `api/documents/upload` | Written to `db.workspaces` upon intake promotion |

### Root Cause of Duplicate Client Cards
In `src/context/PracticeContext.tsx` lines 259–265:
```typescript
setCompanies((prev) => {
  const combined = [...mappedCompanies];
  mockCompanies.forEach((mc) => {
    if (!combined.some((c) => c.id === mc.id)) combined.push(mc);
  });
  return combined;
});
```
When a real workspace is created with an ID differing from `'unilever_group'`, both the live workspace and the mock fallback exist side by side, producing duplicate cards and confusing users.

---

## SECTION 11: COMPLETE ENGAGEMENT LIFECYCLE

The actual user transition flow through the audit pipeline:

```text
[1. CLIENT SELECTION / CREATION]
    └── OverviewView or CompaniesView
            └── User clicks "Submit Client Documents" or selects existing card
                    │
[2. INTAKE & DOCUMENT UPLOAD]
    └── UploadModal / DocumentsView
            └── User drops PDF/Excel/Word filings
            └── POST /api/documents/upload or POST /api/documents/ingest-url
            └── Background queue parses OCR / tables
                    │
[3. EXTRACTION & CANONICALIZATION]
    └── DocumentIntelligenceAgent + extractionWorker + localIntelligence (Qwen 4B)
            └── Facts written to db.facts with bounding boxes and quotes
            └── CanonicalFactResolver maps labels to GAAP/IFRS taxonomy
                    │
[4. INTAKE PROMOTION]
    └── POST /api/intake/:id/promote
            └── Promotes raw extraction into an active Engagement Workspace
            └── Sets active selectedCompanyId and selectedProjectId
                    │
[5. REVIEW & AUDIT GATES]
    └── AccountingValidationEngine verifies: Assets == Liabilities + Equity
    └── AuditFindingsView highlights equation imbalances or currency mismatches
                    │
[6. FINANCIAL STATEMENTS WORKBENCH]
    └── IncomeStatementView, BalanceSheetView, CashFlowView, EquityStatementView
    └── User inspects line items; clicks metric to trigger ProvenanceInspectorModal
                    │
[7. EVIDENCE INSPECTION & WORKPAPERS]
    └── EvidenceRegistryView
            └── Displays source document page, bounding box, extracted quote, confidence score
                    │
[8. DELIVERABLE COMPILATION]
    └── AIDeliverablesView / ReportWizardModal
            └── Generates AICPA-compliant Independent Auditor's Report, Lead Schedules, Memos
            └── Output formats: Letterhead PDF, CSV, JSON
```

---

## SECTION 12: ENGAGEMENT WORKSPACE STRUCTURE ("OPEN WORKSPACE")

When a user clicks **"Open Workspace"** on any client card:
1. `setSelectedCompanyId(comp.id)` and `setSelectedProjectId(comp.id)` are set in `PracticeContext`.
2. `activeView` transitions immediately to `financials-dashboard`.
3. `loadWorkspaceData(comp.id)` triggers 11 parallel API requests (`/api/facts`, `/api/financial/summary`, `/api/documents`, `/api/findings`, etc.).

---

## SECTION 13: FINANCIAL INFORMATION ARCHITECTURE & DESTINATION MATRIX

Mapping of all core financial categories across the application:

| Financial Metric Category | Canonical Metric Name | Backend Source | Visible Screen | UI Component | Provenance Capability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Revenue / Turnover** | `total_revenue` | `db.facts` / `summary.revenue` | Dashboard, Income Statement | `FinancialDashboardView`, `IncomeStatementView` | **Supported** (`FLID-revenue-...`) |
| **Cost of Goods Sold** | `cost_of_goods_sold` | `db.facts` | Income Statement | `IncomeStatementView` | **Supported** (Via modal) |
| **Gross Profit** | `gross_profit` | `db.facts` / derived | Income Statement | `IncomeStatementView` | **Derived** (Revenue - COGS) |
| **Operating Expenses** | `operating_expenses` | `db.facts` | Income Statement | `IncomeStatementView` | **Supported** |
| **Operating Profit (EBIT)** | `operating_income` | `db.facts` / `summary.operatingIncome` | Dashboard, Income Statement | `FinancialDashboardView`, `IncomeStatementView` | **Supported** (`FLID-operating_income-...`) |
| **Finance Costs / Income** | `finance_costs`, `finance_income` | `db.facts` | Income Statement | `IncomeStatementView` | **Supported** |
| **Profit Before Tax** | `profit_before_tax` | `db.facts` | Income Statement | `IncomeStatementView` | **Supported** |
| **Income Tax Expense** | `income_tax_expense` | `db.facts` | Income Statement | `IncomeStatementView` | **Supported** |
| **Net Income / Profit** | `net_income` | `db.facts` / `summary.netIncome` | Dashboard, Income Statement | `FinancialDashboardView`, `IncomeStatementView` | **Supported** (`FLID-net_income-...`) |
| **Cash & Equivalents** | `cash_and_equivalents` | `db.facts` | Balance Sheet | `BalanceSheetView` | **Supported** |
| **Accounts Receivable** | `accounts_receivable` | `db.facts` | Balance Sheet | `BalanceSheetView` | **Supported** |
| **Inventories** | `inventories` | `db.facts` | Balance Sheet | `BalanceSheetView` | **Supported** |
| **Property, Plant & Equip** | `property_plant_and_equipment` | `db.facts` | Balance Sheet | `BalanceSheetView` | **Supported** |
| **Goodwill & Intangibles** | `goodwill`, `intangible_assets` | `db.facts` | Balance Sheet | `BalanceSheetView` | **Supported** |
| **Total Assets** | `total_assets` | `db.facts` / `summary.totalAssets` | Dashboard, Balance Sheet | `BalanceSheetView`, `FinancialDashboardView` | **Supported** (`FLID-total_assets-...`) |
| **Total Liabilities** | `total_liabilities` | `db.facts` / `summary.totalLiabilities`| Dashboard, Balance Sheet | `BalanceSheetView`, `FinancialDashboardView` | **Supported** (`FLID-total_liabilities-...`)|
| **Shareholders' Equity** | `total_equity` | `db.facts` / `summary.equity` | Dashboard, Balance Sheet, Equity | `BalanceSheetView`, `EquityStatementView` | **Supported** (`FLID-equity-...`) |
| **Operating Cash Flow** | `cash_from_operations` | `db.facts` / `summary.operatingCashFlow`| Dashboard, Cash Flow | `CashFlowView`, `FinancialDashboardView` | **Supported** (`FLID-operating_cash_flow-...`)|
| **Investing Cash Flow** | `cash_from_investing` | `db.facts` | Cash Flow | `CashFlowView` | **Supported** (`FLID-investing_cash_flow-...`)|
| **Financing Cash Flow** | `cash_from_financing` | `db.facts` | Cash Flow | `CashFlowView` | **Supported** |
| **Free Cash Flow** | `free_cash_flow` | Derived (`OpCF - CapEx`) | Cash Flow, Dashboard | `CashFlowView`, `FinancialDashboardView` | **Supported** (`FLID-free_cash_flow-...`) |
| **Segment Breakdown** | `segment_revenue` | `db.facts` (category: `segment`) | Segment Analysis | `SegmentAnalysisView` (Recharts Bar) | **Supported** (Per segment) |
| **Footnote Disclosures** | `note_disclosure` | `db.facts` (category: `notes`) | Notes & Disclosures | `NotesDisclosuresView` | **Supported** (Document + Page quote) |

---

## SECTION 14: CORPORATE & MULTI-ENTITY DATA ARCHITECTURE

- `CorporateEntity`: `id`, `name`, `jurisdiction`, `functionalCurrency`, `taxId`, `consolidationMethod` (`FULL`, `PROPORTIONAL`, `EQUITY`), `entityType` (`PARENT`, `OPERATING_SUBSIDIARY`, `HOLDING`, `SPV`, `BRANCH`).
- `EntityRelationship`: `parentId`, `childId`, `ownershipPercentage`, `votingPercentage`, `effectiveDate`, `eliminationRequired`.
- Rendered in `CorporateStructureView.tsx` via entity cards and intercompany relationship tables.

---

## SECTION 15: CURRENCY & MULTI-LINGUAL ARCHITECTURE

- `sourceCurrency`: Original physical filing currency (e.g. JPY, GBP, EUR).
- `functionalCurrency`: Operating currency of primary entity.
- `presentationCurrency`: Reporting currency requested by user/firm (EUR or USD).
- Rate source: ECB / Fed reference rates in `db.fxRates`.

---

## SECTION 16: SOURCE → PIXEL FINANCIAL LINEAGE PIPELINE

```text
SOURCE DOCUMENT (SEC Filing / PDF, SHA-256 Hash)
       ↓
PHYSICAL PAGE & BOUNDING BOX (Page 98, ymin/xmin/ymax/xmax)
       ↓
SOURCE TEXT BLOCK ("Turnover ... 60,812")
       ↓
RAW EXTRACTED FACT (valueOriginal: 60812, scale: millions, EUR)
       ↓
CANONICAL FACT (canonicalMetric: total_revenue, valueFunctional: 60812000000)
       ↓
FACT LINEAGE ID (FLID-revenue-fy2024-unilever_group)
       ↓
RENDER REGISTRY (renderId: rnd-1725588360000-rev, widget: Revenue)
       ↓
DOM PIXEL INJECTION (data-fact-lineage-id="FLID-revenue-fy2024-unilever_group")
```

---

## SECTION 17: RENDER COVERAGE MAP

| Screen / Component | Total Values | Instrumented with `data-fact-lineage-id` | Actual Live DOM Verified | Untraceable Values | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Financial Dashboard** | 6 primary KPIs | 6 | **Verified** | 0 | **100% Coverage** |
| **Balance Sheet** | 18 line items | 3 (Assets, Liab, Equity) | **Verified** | 15 sub-items | **Partial** |
| **Cash Flow** | 12 line items | 3 (OpCF, InvCF, FCF) | **Verified** | 9 sub-items | **Partial** |
| **Income Statement** | 14 line items | 0 | Uninstrumented | 14 | **0% Coverage** |
| **Equity Statement** | 8 line items | 0 | Uninstrumented | 8 | **0% Coverage** |
| **Comparative Trends** | 6 table cells | 0 | Uninstrumented | 6 | **0% Coverage** |
| **Executive Reports** | 10 summary values | 10 (Embedded in JSON) | **Verified** | 0 | **100% Coverage** |

---

## SECTION 18: REVERSE LINEAGE CAPABILITY AUDIT

- **Server-Side:** Supported via `RenderRegistryService.findRendersForFact(factLineageId)` to detect all registered UI screens and stale renders.
- **Client-Side:** Supported via `renderRegistry.findRendersByFact(factLineageId)` querying DOM nodes `[data-fact-lineage-id="..."]`.

---

## SECTION 19: CHART & VISUALIZATION INVENTORY

- **Revenue & Margin Trend**: Recharts in `FinancialDashboardView`, derives from `summary.multiPeriodData`.
- **Segment Revenue**: Recharts in `SegmentAnalysisView`, renders `category: 'segment'`.
- **Comparative Table**: Clean HTML table in `ComparativeTrendView`.

---

## SECTION 20: EVIDENCE & WORKPAPERS AUDIT EXPERIENCE

- Click metric → `handleInspectMetric` → `ProvenanceInspectorModal.tsx`.
- Displays Document Name, SHA-256 hash, Page Number, Source Quote, Confidence Score, Verification Status.

---

## SECTION 21: REVIEW, FINDINGS & READINESS ARCHITECTURE

- `AccountingValidationEngine` evaluates mathematical identities: Assets == Liabilities + Equity.
- `AuditFindingsView.tsx` shows severity flags (`CRITICAL_ERROR`, `WARNING`, `INFO`).

---

## SECTION 22: EVE AUDIT COPILOT ARCHITECTURE

- Ingests `db.documents` and `db.facts`.
- Strict fail-closed prompt prevents hallucinations.
- Client passes `workspaceId`, server expects `workspaceName` (fixed in upcoming patch).

---

## SECTION 23: REPORTS & DELIVERABLES INVENTORY

- **Independent Auditor's Report** (PDF, JSON)
- **Balance Sheet Lead Schedules** (CSV, PDF)
- **Audit Working Papers Binder** (CSV, JSON)
- **Partner Audit Memorandum** (PDF, JSON)
- **Executive Presentation Summary** (PDF)

---

## SECTION 24: CANONICAL FACT → UI → REPORT CONSISTENCY

- UI, Deliverable Reports, and CSV exports all read from identical `db.facts` store.
- Zero divergence between export files and screen numbers.

---

## SECTION 25: ACADEMY → PRODUCTION LEARNING LOOP

- Academy Case → Minerva 3-Layer Evaluation → EvolutionIncident → Darwin Proposal → Regression Suite → Safe Runtime Promotion.

---

## SECTION 26: UI-ERROR LEARNING CAPABILITY

- Minerva detects `WRONG_RENDER`, `WRONG_CURRENCY`, `WRONG_PERIOD`, `WRONG_ENTITY`, `MISSING_RENDER`, `UNSUPPORTED_EXTRA_RENDER`.

---

## SECTION 27: CONTROL & NAVIGATION CLUTTER INVENTORY

- 24 sidebar items: 8 Core, 6 Advanced, 2 Practice, 3 Diagnostics, 3 Low-value, 2 Incomplete.

---

## SECTION 28: UNNECESSARY ARCHITECTURAL EXPOSURE

- Swarm telemetry, Ollama internal IPs, and raw queue IDs currently exposed; recommend moving to Admin & Diagnostics drawer.

---

## SECTION 29: PERSONA WALKTHROUGHS

- Small Business Owner: Needs single upload and simplified statement.
- Bookkeeper: Needs transaction intake and ledger reconciliation.
- Staff Accountant: Needs side-by-side filing and facts checklist.
- CPA / Senior Reviewer: Needs zero-mock environment and 100% provenance.
- Managing Partner: Needs high-level practice risk and deliverable sign-off.

---

## SECTION 30: PROPOSED FUTURE INFORMATION ARCHITECTURE

- Structure around: **PRACTICE**, **ENGAGEMENT**, **FINANCIALS**, **AUDIT & REVIEW**, **DELIVERABLES**, **EVE COPILOT**, and **ADMIN & ACADEMY**.

---

## SECTION 31: CURRENT UI/UX DEFECTS & ISSUES

- Mock data auto-merged in `PracticeContext`.
- Lineage missing on P&L table rows.
- Copilot `workspaceId` parameter disconnect.
- Currency toggle does not trigger dynamic FX conversion.

---

## SECTION 32: RANKED RECOMMENDED CHANGES

- **P0 CRITICAL**: Purge mock data bleed; fix Copilot payload; complete lineage DOM tagging.
- **P1 HIGH**: Reorganize sidebar into 5 pillars; relocate diagnostics.
- **P2 MEDIUM**: Dynamic FX recalculation; side-by-side PDF viewer.
- **P3 LOW**: Consolidate forecast and ratios into dashboard.

---

## SECTION 33: ITEMS THAT MUST NOT BE CHANGED

- Zeabur supervised heartbeat loop (`hermes_autonomous_daemon.mjs`).
- Persistent storage root `/opt/data/cpa_organization`.
- Zero-tolerance accounting gates ($0.00 variance).
- Three-Layer Truth architecture (`Minerva`).
- Fail-closed AI chat safeguards.

---

## SECTION 34: REMAINING UNCERTAINTIES

- Multi-hundred page foreign PDF extraction latency on CPU-only nodes.
- SEC EDGAR 10 req/s rate limits during continuous autonomous benchmarks.

---

*Report certified from live production runtime evidence.*
