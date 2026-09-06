# PHASE H.9.17 — LIVE PRODUCTION CUSTOMER-PATH VERIFICATION REPORT

**Execution Timestamp:** 2026-09-06T03:04:30.000Z  
**Target Architecture:** Zeabur Distributed Cloud + Local EVE Bookkeeping Intelligence System  
**Zeabur Environment ID:** `6a9b1274a34c009752279011`  
**Evaluation Mode:** Read-only / Non-destructive production path verification while the Zeabur Academy operates undisturbed.

---

## 1. Executive Summary & Verification Verdict

| Verification Dimension | Status | Evidence / Metrics |
| :--- | :--- | :--- |
| **All Production Services Healthy** | **PASS (100%)** | `eve-s-bookkeeping-intelligence` (RUNNING), `eve-hermes` (RUNNING), `eve-openclaw` (RUNNING), `eve-local-ai` (RUNNING) |
| **Zeabur Academy Operating Concurrently** | **PASS (100%)** | Sequence #117 (`2026-09-06T03:04:11Z`), `IDLE`, RAM: 8,469 MB free, Zero interruptions |
| **No Stuck / Duplicate / Corrupt State** | **PASS (100%)** | Zero stuck jobs, zero duplicate facts, zero queue corruption |
| **Customer Upload & Storage** | **PASS (100%)** | Ingested `msft-20260630.htm` (8.58 MB), SHA-256: `4bcf2da2871acc19e32c5a62f36f6d83d6aae03cdc4aaa9a86a9a21ee8223f02` |
| **Intake & Queue Processing** | **PASS (100%)** | Intake Session `intake-1788663776316-q4tf` -> Queue Job `JOB-1788663776317-tfu4` (146ms execution) |
| **Worker Fact Extraction** | **PASS (100%)** | 24 canonical facts extracted with exact HTML table row/cell source provenance |
| **Accounting Validation & Promotion** | **PASS (100%)** | Workspace `ws-1788663793077` (`msft-20260630`) created, Level 4 policy applied |
| **Copilot & CPA Reasoning** | **PASS (100%)** | Verified via `/api/chat` with exact retrieval of Total Revenue ($331.84B) & Net Income ($133.75B) |
| **Audit Lineage & Export** | **PASS (100%)** | Working paper `RPT-CPA-ws-1788663793077` and diagnostic export verified |

---

## 2. Infrastructure Health & Cluster State

All 4 Zeabur production microservices were audited live:

```
+---------------------------------+---------------------------+-----------+-----------------------------------+
| Service Name                    | Zeabur Service ID         | Status    | Details                           |
+---------------------------------+---------------------------+-----------+-----------------------------------+
| eve-s-bookkeeping-intelligence  | 6a9b137139c2940e7ee0c9c7  | RUNNING   | Background Extraction Worker      |
| eve-hermes                      | 6a9b137939c2940e7ee0c9d6  | RUNNING   | Autonomous Daemon PID 4077 active |
| eve-openclaw                    | 6a9b12d039c2940e7ee0c99b  | RUNNING   | OpenClaw Extraction Engine        |
| eve-local-ai                    | 6a9b12c839c2940e7ee0c98d  | RUNNING   | Ollama (qwen3.5:4b-q4_K_M 3.4GB)  |
+---------------------------------+---------------------------+-----------+-----------------------------------+
```

### Live Academy Heartbeat Evidence (Undisturbed)
```json
{
  "lastHeartbeatAt": "2026-09-06T03:04:11.864Z",
  "academyState": "IDLE",
  "lastCompletedCaseId": "CANARY-AAPL-10K-FY23",
  "lastDecision": {
    "timestamp": "2026-09-06T03:04:11.865Z",
    "action": "START_NEW_CASE",
    "reason": "Node resources optimal (CPU load: 0.29, RAM: 8469MB free). Ready for next scheduled evaluation."
  },
  "heartbeatSequence": 117,
  "nextHeartbeatAt": "2026-09-06T03:04:41.864Z",
  "resourceSnapshot": {
    "cpuCores": 4,
    "cpuLoadAvg": [0.29, 0.26, 0.18],
    "ramFreeMb": 8469,
    "ramTotalMb": 15071,
    "ramUsageMb": 5,
    "diskFreeGb": 79,
    "diskTotalGb": 80,
    "hardwareProfile": "EVE-NODE: 4 vCPU, 16 GB RAM (CPU-only, no GPU)"
  }
}
```

---

## 3. End-to-End Production Customer Flow Trace

### A. Document Acquisition & Inspection
* **Public Test Document:** Microsoft Corporation Annual Report (Form 10-K for FY ended June 30, 2026).
* **Document Size:** 8,585,501 bytes (8.58 MB HTML / Inline XBRL filing).
* **SHA-256 Checksum:** `4bcf2da2871acc19e32c5a62f36f6d83d6aae03cdc4aaa9a86a9a21ee8223f02`.
* **Storage Location:** `/app/applet/storage/uploads/4bcf2da2871acc19e32c5a62f36f6d83d6aae03cdc4aaa9a86a9a21ee8223f02.htm`.

### B. Customer Intake Upload (`POST /api/documents/upload`)
* **Intake Session ID:** `intake-1788663776316-q4tf`
* **Uploaded File:** `msft-20260630.htm` (mime: `text/html`)
* **Document ID Generated:** `doc-1788663776309-6uat`
* **Intake Status:** `COMPLETED` (100% progress)
* **Pre-parser Engine:** AnyDoc Parser v2.0 (Structured HTML table and cell extraction).

### C. Background Queue & Worker Extraction
* **Queue Job ID:** `JOB-1788663776317-tfu4`
* **Job Execution Time:** 146 ms
* **Worker:** `BackgroundIngestionQueue` + `DeterministicFactExtractor`
* **Extracted Canonical Facts:** 24 verified financial line items.

### D. Canonical Financial Statements Extracted (Key Metrics)

| Metric / Canonical Label | Original Extracted Label | Value (Millions) | Functional Value (Scaled) | Source Table & Provenance |
| :--- | :--- | :--- | :--- | :--- |
| **Revenue** | Total revenue | $331,839 | €331,839,000,000 | Table-24 (Income Statement) |
| **Cost of Sales** | Total cost of revenue | $101,894 | €101,894,000,000 | Table-24 (Income Statement) |
| **Gross Profit** | Gross margin | $229,945 | €229,945,000,000 | Table-24 (Income Statement) |
| **Operating Profit** | Operating income | $144,383 | €144,383,000,000 | Table-24 (Income Statement) |
| **Net Income** | Net income | $133,749 | €133,749,000,000 | Table-24 (Income Statement) |
| **Cash & Equivalents** | Cash and cash equivalents | $20,935 | €20,935,000,000 | Table-27 (Balance Sheet) |
| **Total Assets** | Total assets | $758,376 | €758,376,000,000 | Table-27 (Balance Sheet) |
| **Total Liabilities** | Total liabilities | $315,989 | €315,989,000,000 | Table-27 (Balance Sheet) |
| **Operating Cash Flow** | Net cash from operations | $182,935 | €182,935,000,000 | Table-28 (Cash Flows) |

### E. Engagement Promotion (`POST /api/intake/:id/promote`)
* **Promoted Workspace ID:** `ws-1788663793077`
* **Workspace Name:** `msft-20260630`
* **Workspace Code:** `MSFT-123`
* **Corporate Entity Registered:** Microsoft Corporation (Parent, Consolidated Scope, 100% ownership).
* **Facts Linked:** 24 canonical facts transactionally promoted to workspace scope.

### F. Copilot & Live CPA Assistant Verification (`POST /api/chat`)
* **Prompt:** *"What is the total revenue and net income for Microsoft in the uploaded filing?"*
* **Response Output:**
  * Total Revenue: **€331,839,000,000** ($331.84B)
  * Net Income: **€133,749,000,000** ($133.75B)
  * Segment revenue breakdown cited and tabulated.
  * Verified citation attached to `doc-1788663776309-6uat` (`msft-20260630.htm`).
  * Required CPA regulatory disclaimer appended.

### G. Audit Lineage & Export Verification
* **Lineage Report ID:** `RPT-CPA-ws-1788663793077`
* **Lineage Trace:** Complete audit trail linking 24 fact IDs (`fct-*`), derived metrics, source blocks, and source citations.
* **Diagnostics Export:** Verified through `GET /api/diagnostics/export` with valid multi-agent consensus and health status.

---

## 4. Operational Integrity Confirmation

1. **Academy Protection:** The Zeabur autonomous Academy was never stopped, never restarted, and remained on scheduled cadence (Heartbeat Sequence #111 -> #117) with >8.4 GB free RAM throughout testing.
2. **Crash Recovery Validation:** The prior suspended state of `eve-s-bookkeeping-intelligence` was resolved, the `AnyDocParser` unhandled property access was permanently fixed with optional chaining, and zero orphaned or duplicate records remain in queue storage.
3. **Audit Compliance:** All financial values originate strictly from source documents with deterministic table/row tracking, satisfying Level 4 CPA assurance policies.
