import React, { useState } from 'react';
import { FileCheck2, Download, Printer, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

export const AIDeliverablesView: React.FC = () => {
  const { selectedCompany } = usePractice();
  const [selectedTemplate, setSelectedTemplate] = useState('board_memo');
  const [isCopied, setIsCopied] = useState(false);

  const reportText = `CONFIDENTIAL AUDIT MEMORANDUM
TO: Audit Committee of the Board of Directors (${selectedCompany.name})
FROM: Eve Autonomous Financial Intelligence & Senior Audit Practice
DATE: September 4, 2026
SUBJECT: Mathematical, Presentation & Forensic Footnote Audit of Consolidated FY2024 Financial Statements

1. EXECUTIVE SUMMARY & OPINION
Based on the execution of the 6-agent Hermes Swarm Verification Matrix comprising 1,080 distinct analytical and mathematical tests, the consolidated financial statements for ${selectedCompany.name} (FY2024) are found to be presentationally coherent with an aggregate integrity score of ${selectedCompany.verificationScore}%.

2. KEY FINDINGS & DISCLOSURE RECONCILIATIONS
a. Fundamental Balance Sheet Equation:
   Total Assets (€73,020M) = Total Liabilities (€50,200M) + Total Shareholders' Equity (€22,820M).
   Balance Check: Zero variance (€0.00).

b. Footnote 15 Restatement Analysis (Capitalized Lease Liabilities):
   Note 15 restates FY2023 comparative capitalized leases from €2,396M to €2,410M (+€14M). Our Discrepancy Auditor verified this reflects retrospective adoption of revised IFRS 16 lease parameters. We recommend formal documentation in Working Paper WP-401.

3. COVENANT & LIQUIDITY COHERENCE
- Net Debt: €22,720M
- Free Cash Flow: €7,558M
- Interest Coverage Ratio: 17.0x (Well within standard covenant limits > 3.5x).

CONCLUSION: CLEAN AUDIT OPINION RECOMMENDED WITH WP-401 ANNOTATIONS.`;

  return (
    <div id="deliverables-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Audit Deliverables & Board Memos</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated generation of audit committee memos, working paper WP-401 reviews, and covenant compliance certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(reportText);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            {isCopied ? 'Copied to Clipboard!' : 'Copy Text'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
        {reportText}
      </div>
    </div>
  );
};
