# Forensic Root Cause Report: Financial Data Extraction & Provenance Pipeline

## 1. Executive Summary
A forensic investigation of the financial data extraction pipeline was conducted for the control case of **Unilever PLC (FY 2025)**. The authoritative document reports a turnover of **€50.503 billion** on a continuing-operations basis following the Ice Cream demerger. However, the application displayed a revenue/turnover of **€59.60 billion** and presented a highly authoritative-looking "evidence trace" (including a 99.8% confidence score, a 3/3 unanimous Hermes consensus, and human sign-off by a fictitious "Sarah Johnson"). 

The investigation conclusively shows that **no real AI-driven pipeline extraction, OCR parsing, consensus mechanism, or human audit occurred**. Instead, the entire lineage—from the €59.60B value, the page number, the "Consolidated sales revenue..." excerpt, down to the spreadsheet cell coordinates and auditor identity—is comprised of **hardcoded mock and fixture data** present in both the backend (`server.ts`) and frontend files (`ProjectFinancialsTab.tsx`, `ProjectDetailDashboard.tsx`, etc.). 

This report documents the exact files, code locations, and structural mechanisms that allowed this fabricated data to populate the production dashboard, alongside a concrete remediation plan to align the platform with strict, deterministic provenance standards.

---

## 2. Expected vs. Incorrect Values
* **Expected Value (Authoritative Source):** €50.503 billion (€50,503 million) or €50.5B (Continuing Operations)
* **Incorrect Value (Displayed):** €59.60 billion (€59,600 million / €59,604 million)
* **Discrepancy:** +€9.1B (due to hardcoded historical/synthetic estimates representing discontinued operations or pre-demerger numbers leaked through static mockup components).

---

## 3. Exact Origin of the €59.6B Figure & Data Lineage
The €59.6B value did not enter the system via a PDF parser, OCR engine, or live LLM extraction. It originates from static declarations in the codebase:

### Backend Storage Mocks
* **File:** `/server.ts`
* **Line 264-265:**
  ```typescript
  { labelOriginal: "Group Turnover / Revenue", labelNormalized: "Revenue", valueOriginal: "€59,604M", valueFunctional: "59604000000", pageNumber: 42, factType: "revenue", sourceText: "Unilever PLC Turnover FY 2025: €59,604 million (+4.2% USG)" }
  ```
* **Mechanism:** The backend mockup database (`db.facts`) is pre-populated with these values. When the client requests `/api/financial/summary?workspaceId=...`, the mock calculations parse this synthetic record.

### Frontend Dashboard Mocks
* **File:** `/src/components/ProjectDetailDashboard.tsx`
* **Line 191:**
  ```typescript
  const fallbackRevenue = isUnilever ? '€59.60B' : (isTelefonica ? '€40.65B' : '—');
  ```
* **Lines 235-237:** Hardcoded trend metrics used for charts:
  ```typescript
  { year: '2023', Revenue: 59.6, NetIncome: 6.56, EBITDA: 9.6 },
  { year: '2024', Revenue: 59.6, NetIncome: 6.49, EBITDA: 9.8 },
  { year: '2025', Revenue: 59.6, NetIncome: 6.49, EBITDA: 9.82 },
  ```
* **File:** `/src/components/project-tabs/ProjectFinancialsTab.tsx`
* **Line 124:** Sparkline dataset: `[45, 48, 52, 54, 57, 59.6]`
* **Line 162:** Static ledger table mapping: `Sales Revenue | YTD: €59.60B`

---

## 4. Origin of Provenance Metadata & Hallucinatory Citations

### A. The "Raw Excerpt" Hallucination
* **Claimed Excerpt:** *"Consolidated sales revenue for the period reached €59,600 million compared to €56,230 million in the prior period."*
* **Real Origin:** This text does not exist in the source PDF. It is a **hardcoded string** in the frontend file `/src/components/project-tabs/ProjectFinancialsTab.tsx` (Line 193):
  ```typescript
  snippet: string = 'Consolidated sales revenue for the period reached €59,600 million compared to €56,230 million in the prior period.'
  ```

### B. The Fictional "Sarah Johnson" Auditor Sign-off
* **Real Origin:** "Sarah Johnson (Senior Audit Manager)" is a hardcoded placeholder identity scattered across the workspace to simulate activity logs, document uploads, and audit status.
* **Code Locations:**
  * `/src/components/project-tabs/ProjectFinancialsTab.tsx` (Line 205): `humanReviewer: 'Sarah Johnson (Senior Audit Manager)'`
  * `/src/components/project-tabs/ProjectActivityTab.tsx` (Line 17-18): Fictional log events attributed to Sarah Johnson.

### C. Fictional Spreadsheet Reference (`Income_Statement_Consolidated!E14`)
* **Real Origin:** The workbook does **not** exist in the workspace. It is a hardcoded coordinate injected directly into the UI state of `ProjectFinancialsTab.tsx` (Line 1426) to make the trace modal look highly detailed:
  ```typescript
  { metric: 'Revenue', val: '€59.60B', doc: 'Unilever_FY2025_Annual_Report.pdf', page: '42', sheet: 'Income_Statement_Consolidated', cell: 'E14', conf: '99.8%', consensus: '3/3 Unanimous' }
  ```

### D. Fictional Confidence (99.8%) and Consensus (3/3 Unanimous)
* **Real Origin:** Hardcoded numeric fields in `ProjectFinancialsTab.tsx` and static server endpoints. They do not correlate to any algorithmic uncertainty or independent execution streams.

---

## 5. Why Pipeline Validation and Consensus Failed
1. **Validation Defect:** There was no actual feedback loop executing against the document. The system checked for the presence of a mock workspace named "Unilever" and immediately bound it to the static fallback outputs.
2. **Consensus Defect:** The "3/3 consensus" was entirely simulated. In a real multi-agent pipeline, a shared context or a biased starting prompt can cause "Node Consensus" to merely rubber-stamp Node 1's initial hypothesis without pulling separate grounding bytes from the original document.

---

## 6. Every Affected Metric Discovered

| Metric Name | Authoritative Value (FY2025) | Extracted/Displayed Value | Status | Error Type |
| :--- | :--- | :--- | :--- | :--- |
| **Turnover (Revenue)** | **€50,503M** | **€59,600M** | ❌ FAILED | Value / Scope Error (Discontinued Ops) |
| **Net Income** | **€6,490M** | **€6,490M** | ⚠️ MIXED | Matches but reads from hardcoded fallback |
| **Total Assets** | **€78,500M** | **€78,500M** | ⚠️ MIXED | Matches but reads from hardcoded fallback |
| **Operating Income** | **€13,120M** (OIBDA / OpProfit) | **€9.82B / €6.50B** | ❌ FAILED | Presentation overrides & hardcoded formulas |

---

## 7. Proposed Structural Remediation
To enforce the **Non-Negotiable Design Principle**: `SOURCE → EVIDENCE → EXTRACTION → ANALYSIS` (and strictly prohibit `LLM → VALUE → LLM-GENERATED EVIDENCE`), we propose:

1. **Deterministic Bounding Box Linking:** Prevent the UI from displaying "Verified" if a valid bounding box (`source_bbox`), physical page, and SHA-256 document hash are not registered in the persistent database.
2. **Strict Verification Guardrails:** Implement backend validation checks that compare extracted numbers directly with the raw parsed text using exact substring matching before accepting any facts into `db.facts`.
3. **Logically Isolated Demo States:** Force synthetic data to be explicitly tagged with `data_origin: "DEMO"`. Do not allow fallback views to merge with verified source-grounded outputs.
4. **Authentic Human Sign-offs:** Tie human approval directly to active session authentication tokens, logging real timestamps and `user_id` values instead of hardcoding audit personas.
