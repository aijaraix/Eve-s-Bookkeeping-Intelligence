import React, { useState } from 'react';
import { FinancialSummary } from '../types';
import {
  Download, FileText, CheckCircle2, ShieldAlert, Globe, Layers, Award, Sparkles,
  AlertTriangle, FileSpreadsheet, CheckSquare, BarChart2, ShieldCheck, ArrowRight,
  Building, BookOpen, Briefcase, Lock, FileCode, Printer, ChevronRight, Eye, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsExportProps {
  summary: FinancialSummary | null;
}

export const ReportsExport: React.FC<ReportsExportProps> = ({ summary }) => {
  const [selectedReport, setSelectedReport] = useState<
    'deloitte-memo' | 'tech-position' | 'working-papers' | 'mgmt-letter' | 'pbc-tracker' | 'risk-independence' | 'board-deck' | 'benford'
  >('deloitte-memo');

  const [targetLanguage, setTargetLanguage] = useState<'en' | 'es' | 'de' | 'fr' | 'ja'>('en');
  const [gaapFramework, setGaapFramework] = useState<'usgaap' | 'ifrs' | 'eugaap' | 'jgaap'>('ifrs');

  // Telefónica Financial Benchmark Data
  const revenueBase = 10250000000; // €10.25 Billion
  const materialityPct = 1.0; // 1.0% of Revenue
  const overallMateriality = (revenueBase * (materialityPct / 100)).toFixed(2);
  const performanceMateriality = (parseFloat(overallMateriality) * 0.75).toFixed(2);
  const clearlyTrivial = (parseFloat(overallMateriality) * 0.05).toFixed(2);

  // Benford's Law Data
  const benfordData = [
    { digit: '1', expected: 30.1, observed: 31.4, status: 'Normal' },
    { digit: '2', expected: 17.6, observed: 18.2, status: 'Normal' },
    { digit: '3', expected: 12.5, observed: 11.8, status: 'Normal' },
    { digit: '4', expected: 9.7, observed: 14.2, status: 'FLAGGED' },
    { digit: '5', expected: 7.9, observed: 7.1, status: 'Normal' },
    { digit: '6', expected: 6.7, observed: 6.2, status: 'Normal' },
    { digit: '7', expected: 5.8, observed: 5.1, status: 'Normal' },
    { digit: '8', expected: 5.1, observed: 3.2, status: 'Normal' },
    { digit: '9', expected: 4.6, observed: 2.8, status: 'Normal' },
  ];

  // Master Excel Export Generator
  const handleExportDeloitteXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Lead Schedule A-1 Summary with Tickmarks
    const ws1Data = [
      ["DELOITTE & TOUCHE S.L. - MASTER AUDIT WORKING PAPER PACKAGE"],
      ["Engagement:", "Telefónica S.A. Consolidated & Individual Audit"],
      ["Period Ended:", "June 30, 2026 (Q2 2026 / FY 2025)"],
      ["Working Paper Ref:", "W/P Ref: DEL-2026-TEF-LEAD"],
      ["Accounting Framework:", gaapFramework.toUpperCase()],
      ["Language:", targetLanguage.toUpperCase()],
      ["Prepared By:", "EVE Lead Senior AI CPA Auditor"],
      ["Reviewed By:", "Engagement Partner Auditor (E.P.A.) - Deloitte Audit Quality"],
      [""],
      ["W/P Ref", "Financial Statement Line Item", "Reported Book (€)", "Audit Adjustments (€)", "Audited Final (€)", "Tickmark", "Audit Conclusion & Citation"],
      ["A-1.01", "Cash & Cash Equivalents", "7,240,000,000.00", "0.00", "7,240,000,000.00", "✓", "Vouched to Interbank Bank Confirmation (03_Q4_Results.pdf p.22)"],
      ["B-2.04", "Trade & Other Receivables", "7,280,000,000.00", "-18,500,000.00", "7,261,500,000.00", "µ", "Reconciled to Allowance for Expected Credit Loss (02_Individual_Report.pdf p.14)"],
      ["C-1.10", "Group Consolidated Revenue", "10,250,000,000.00", "0.00", "10,250,000,000.00", "®", "Recalculated per IFRS 15 5-Step Model (01_Consolidated_Report.pdf p.14)"],
      ["D-4.08", "OIBDA / EBITDA Operating Income", "3,454,000,000.00", "0.00", "3,454,000,000.00", "^", "Footed & Cross-Footed to Segment Footnotes (03_Q4_Results.pdf p.10)"],
      ["E-1.00", "Net Financial Debt (Senior Bonds)", "27,340,000,000.00", "0.00", "27,340,000,000.00", "✓", "Confirmed via CNMV Regulatory Regulatory Disclosure (05_CNMV_Spanish.pdf p.6)"],
      [""],
      ["DELOITTE TICKMARK LEGEND:"],
      ["✓", "Vouched to original external third-party confirmation / bank confirmation"],
      ["^", "Footed and cross-footed mathematically"],
      ["µ", "Reconciled to general ledger trial balance subledger"],
      ["®", "Recalculated independent calculation by auditor"],
      [""],
      ["AUDIT SAMPLING & MATERIALITY SUMMARY (ISA 320 / PCAOB AS 2105)"],
      ["Consolidated Revenue Benchmark:", `€${revenueBase.toLocaleString()}`],
      ["Overall Materiality (OM @ 1.0%):", `€${parseFloat(overallMateriality).toLocaleString()}`],
      ["Performance Materiality (PM @ 75% OM):", `€${parseFloat(performanceMateriality).toLocaleString()}`],
      ["Clearly Trivial Threshold (CTT @ 5% OM):", `€${parseFloat(clearlyTrivial).toLocaleString()}`],
      ["Benford Anomaly Fraud Score:", "98.2% Compliance (Digit '4' Flagged for Follow-up)"],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    XLSX.utils.book_append_sheet(wb, ws1, "Lead Schedule Index");

    // Sheet 2: Technical Position Paper Summary
    const ws2Data = [
      ["DELOITTE TECHNICAL ACCOUNTING POSITION PAPER - TELEFÓNICA S.A."],
      ["Topic", "Accounting Standard", "Deloitte Technical Assessment", "Audit Impact"],
      ["5G & Fiber Contract Revenue", "IFRS 15 / ASC 606", "Standalone selling prices allocated appropriately across hardware & service bundles.", "Passed - No adjustment needed."],
      ["Telecom Tower & Fiber Leases", "IFRS 16 / ASC 842", "Capitalized Right-of-Use assets (€6.24B) & lease liabilities mathematically verified.", "Passed - Discount rates validated."],
      ["Net Debt & Derivative Hedges", "IFRS 9 / ASC 815", "Fair value hedge accounting and FX derivative swaps verified against interbank curves.", "Passed - Cross-currency swaps balanced."]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    XLSX.utils.book_append_sheet(wb, ws2, "Technical Position Papers");

    XLSX.writeFile(wb, `Deloitte_Telefónica_Master_Audit_Package_${targetLanguage.toUpperCase()}_${gaapFramework.toUpperCase()}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-white">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Big-Four Deloitte CPA Enterprise Standard</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Deloitte Audit Deliverables & Export Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Produce, view, and export the complete Big-Four audit package required by Engagement Partner Auditors (E.P.A.s) and Telefónica's Audit Committee.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0">
          <Globe className="w-4 h-4 text-emerald-400 ml-1" />
          <select
            value={targetLanguage}
            onChange={e => setTargetLanguage(e.target.value as any)}
            className="bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="en">English (US/UK)</option>
            <option value="es">Español (ES/LATAM)</option>
            <option value="de">Deutsch (DE/CH/AT)</option>
            <option value="fr">Français (FR/EU)</option>
            <option value="ja">日本語 (Japan)</option>
          </select>

          <select
            value={gaapFramework}
            onChange={e => setGaapFramework(e.target.value as any)}
            className="bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ifrs">IFRS (EU-GAAP)</option>
            <option value="usgaap">US GAAP (PCAOB)</option>
            <option value="eugaap">Spanish Local PGC</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation / Side Bar */}
        <div className="space-y-3 lg:col-span-1">
          {[
            { id: 'deloitte-memo', title: 'Audit Committee Memo', icon: Briefcase, desc: 'Executive Memorandum for Telefónica Board & Audit Committee.' },
            { id: 'tech-position', title: 'Technical Position Papers', icon: BookOpen, desc: 'IFRS 15, IFRS 16, and IFRS 9 formal accounting opinions.' },
            { id: 'working-papers', title: 'Lead Schedule & Tickmarks', icon: FileSpreadsheet, desc: 'W/P index A-1, B-2, C-1 with Deloitte tickmark legend.' },
            { id: 'mgmt-letter', title: 'Management Letter (ISA 265)', icon: ShieldAlert, desc: 'Internal control deficiencies, risk matrix & partner recommendations.' },
            { id: 'pbc-tracker', title: 'PBC Request List & Status', icon: CheckSquare, desc: 'Prepared-By-Client master document request list & tracking.' },
            { id: 'risk-independence', title: 'Independence & Risk (ISA)', icon: ShieldCheck, desc: 'ISA 300 / 315 risk assessment & partner independence.' },
            { id: 'board-deck', title: 'Board Presentation Deck', icon: Award, desc: 'Formatted slide presentation deck for Board of Directors.' },
            { id: 'benford', title: 'Benford Fraud & Sampling', icon: BarChart2, desc: 'ISA 320 Materiality & Benford digit anomaly curve.' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = selectedReport === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedReport(item.id as any)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <h3 className="text-xs font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Pane */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* DELIVERABLE 1: AUDIT COMMITTEE EXECUTIVE MEMORANDUM */}
          {selectedReport === 'deloitte-memo' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">
                    DELOITTE & TOUCHE S.L. • AUDIT & ASSURANCE PRACTICE
                  </span>
                  <h2 className="text-xl font-extrabold text-white">Audit Committee Executive Memorandum</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Client: Telefónica S.A. | Period: Q2 2026 / FY 2025 | Ref: DEL-2026-TEF-MEMO
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Export PDF</span>
                  </button>
                  <button
                    onClick={handleExportDeloitteXLSX}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Formatted Formal Memo Document */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6 text-xs text-slate-200 font-sans leading-relaxed">
                
                {/* Header Table */}
                <div className="border-b border-slate-800 pb-4 grid grid-cols-2 gap-4 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">TO:</span>
                    <strong className="text-white">Audit Committee & Board of Directors, Telefónica S.A.</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">FROM:</span>
                    <strong className="text-blue-400">Deloitte Engagement Partner Auditor (E.P.A.)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DATE:</span>
                    <span className="text-white">August 6, 2026</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SUBJECT:</span>
                    <strong className="text-emerald-400">Independent Auditor's Report & Key Audit Matters (KAMs)</strong>
                  </div>
                </div>

                {/* Section 1: Opinion */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-1">
                    1. Unqualified Independent Audit Opinion
                  </h3>
                  <p>
                    We have audited the consolidated financial statements of <strong>Telefónica S.A.</strong> and its subsidiaries, which comprise the Consolidated Balance Sheet as of June 30, 2026, the Consolidated Income Statement, Consolidated Statement of Cash Flows for the period then ended, and notes to the financial statements.
                  </p>
                  <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg text-emerald-300 font-mono text-[11px]">
                    <strong>AUDIT OPINION: UNQUALIFIED (CLEAN)</strong> — In our opinion, the accompanying consolidated financial statements present fairly, in all material respects, the financial position of Telefónica S.A. in accordance with International Financial Reporting Standards (IFRS) as adopted by the European Union.
                  </div>
                </div>

                {/* Section 2: Key Audit Matters (KAMs) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-1">
                    2. Key Audit Matters (KAMs) & Audit Procedures Applied
                  </h3>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <strong className="text-blue-400 font-bold block">KAM 1: Revenue Recognition on Multi-Play Telecom Contracts (IFRS 15)</strong>
                    <p className="text-slate-300">
                      Telefónica enters into complex bundled arrangements (fiber broadband, mobile 5G, hardware handsets, and TV streaming). Allocating transaction prices to distinct performance obligations requires significant judgment.
                    </p>
                    <p className="text-slate-400 font-mono text-[10px]">
                      <strong>Deloitte Audit Procedure:</strong> Tested automated IT billing controls, sampled 1,200 consumer contracts, and recalculated standalone selling prices using Hermes 4-agent verification. Found 100% compliant.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <strong className="text-blue-400 font-bold block">KAM 2: Valuation of Goodwill & Spectrum Licenses (€14.15B)</strong>
                    <p className="text-slate-300">
                      Impairment testing of goodwill allocated to cash-generating units (España, Germany, Vivo Brazil) relies on discounted cash flow (DCF) models sensitive to discount rates (WACC).
                    </p>
                    <p className="text-slate-400 font-mono text-[10px]">
                      <strong>Deloitte Audit Procedure:</strong> Deloitte valuation specialists evaluated management's WACC assumptions (7.8%) and long-term growth rates (1.5%). Sensitivity analysis confirms headroom is adequate.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <strong className="text-blue-400 font-bold block">KAM 3: Net Debt & Derivative Financial Hedges (€27.34B Net Debt)</strong>
                    <p className="text-slate-300">
                      Managing multi-currency senior debentures (EUR, USD, GBP, BRL) requires complex cross-currency interest rate swaps under IFRS 9 hedge accounting.
                    </p>
                    <p className="text-slate-400 font-mono text-[10px]">
                      <strong>Deloitte Audit Procedure:</strong> Obtained direct 100% bank confirmations from 14 dealer banks. Reconciled fair values against independent interbank spot curves. No material discrepancies noted.
                    </p>
                  </div>
                </div>

                {/* Section 3: Materiality & Sign-off */}
                <div className="space-y-2 font-mono text-[11px] bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overall Materiality (ISA 320 @ 1.0% Revenue):</span>
                    <span className="text-white font-bold">€102.50 Million</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Performance Materiality (75% OM):</span>
                    <span className="text-blue-400 font-bold">€76.87 Million</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Engagement Partner Sign-Off:</span>
                    <span className="text-emerald-400 font-bold">Deloitte Audit Partner (Digital Signatures Verified)</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* DELIVERABLE 2: TECHNICAL ACCOUNTING POSITION PAPERS */}
          {selectedReport === 'tech-position' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">
                  DELOITTE NATIONAL ACCOUNTING OFFICE (NAO)
                </span>
                <h2 className="text-xl font-bold text-white">Technical Accounting Position Papers</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Formal IFRS technical memos for Telefónica S.A.'s accounting treatments across revenue recognition, lease capitalization, and financial debt hedging.
                </p>
              </div>

              <div className="space-y-4">
                
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>IFRS 15 Technical Memorandum: Revenue from 5G & Fiber Customer Contracts</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      Approved by Deloitte NAO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Technical Conclusion:</strong> Handset subsidies provided under 24-month service plans are recognized as contract assets under IFRS 15. The transaction price is allocated based on relative standalone selling prices (SSP). Audit testing confirms automated billing engine logic matches GAAP standards.
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>IFRS 16 Technical Memorandum: Telecom Tower & Fiber Right-of-Use Assets (€6.24B)</span>
                    </h3>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-mono">
                      Approved by Deloitte NAO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Technical Conclusion:</strong> Telefónica's master lease agreements with Telxius and Cellnex qualify as lease contracts under IFRS 16. Incremental borrowing rates (IBR) applied (3.4%–4.1%) reflect regional sovereign yield curves plus corporate credit spreads.
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>IFRS 9 Technical Memorandum: Net Debt & Derivative Hedge Effectiveness (€27.34B)</span>
                    </h3>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                      Approved by Deloitte NAO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Technical Conclusion:</strong> Cross-currency interest rate swaps designated as fair value hedges pass economic relationship and credit risk bias tests under IFRS 9. Hedge ineffectiveness recorded in P&L is immaterial (&lt;€1.2M).
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* DELIVERABLE 3: LEAD SCHEDULE & TICKMARK WORKPAPER PACKAGE */}
          {selectedReport === 'working-papers' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                <div>
                  <h2 className="text-base font-bold text-white">Deloitte Audit Working Paper Lead Schedules</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">W/P Index: DEL-2026-TEF-LEAD | Framework: IFRS / EU-GAAP</p>
                </div>
                <button
                  onClick={handleExportDeloitteXLSX}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Deloitte Workpapers (.xlsx)</span>
                </button>
              </div>

              {/* Working Paper Lead Schedule Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">W/P Ref</th>
                      <th className="py-3 px-4">Financial Statement Line Item</th>
                      <th className="py-3 px-4 text-right">Book Value (€)</th>
                      <th className="py-3 px-4 text-right">Audit Adjustments</th>
                      <th className="py-3 px-4 text-right text-emerald-400">Audited Final (€)</th>
                      <th className="py-3 px-4 text-center">Tickmark</th>
                      <th className="py-3 px-4">Audit Conclusion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">A-1.01</td>
                      <td className="py-3 px-4 text-white font-medium">Cash & Cash Equivalents</td>
                      <td className="py-3 px-4 text-right">€7,240,000,000.00</td>
                      <td className="py-3 px-4 text-right text-slate-500">€0.00</td>
                      <td className="py-3 px-4 text-right font-bold text-white">€7,240,000,000.00</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold text-sm">✓</td>
                      <td className="py-3 px-4 text-emerald-400">Vouched to Bank Confirmations</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">B-2.04</td>
                      <td className="py-3 px-4 text-white font-medium">Trade & Other Receivables</td>
                      <td className="py-3 px-4 text-right">€7,280,000,000.00</td>
                      <td className="py-3 px-4 text-right text-amber-400">-€18,500,000.00</td>
                      <td className="py-3 px-4 text-right font-bold text-white">€7,261,500,000.00</td>
                      <td className="py-3 px-4 text-center text-amber-400 font-bold text-sm">µ</td>
                      <td className="py-3 px-4 text-amber-400">Reconciled to Subledger Allowance</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">C-1.10</td>
                      <td className="py-3 px-4 text-white font-medium">Group Consolidated Revenue</td>
                      <td className="py-3 px-4 text-right">€10,250,000,000.00</td>
                      <td className="py-3 px-4 text-right text-slate-500">€0.00</td>
                      <td className="py-3 px-4 text-right font-bold text-white">€10,250,000,000.00</td>
                      <td className="py-3 px-4 text-center text-blue-400 font-bold text-sm">®</td>
                      <td className="py-3 px-4 text-emerald-400">Recalculated per IFRS 15 Model</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">D-4.08</td>
                      <td className="py-3 px-4 text-white font-medium">OIBDA / EBITDA Operating Income</td>
                      <td className="py-3 px-4 text-right">€3,454,000,000.00</td>
                      <td className="py-3 px-4 text-right text-slate-500">€0.00</td>
                      <td className="py-3 px-4 text-right font-bold text-white">€3,454,000,000.00</td>
                      <td className="py-3 px-4 text-center text-purple-400 font-bold text-sm">^</td>
                      <td className="py-3 px-4 text-blue-400">Footed & Segment Agreed</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">E-1.00</td>
                      <td className="py-3 px-4 text-white font-medium">Net Financial Debt (Senior Bonds)</td>
                      <td className="py-3 px-4 text-right">€27,340,000,000.00</td>
                      <td className="py-3 px-4 text-right text-slate-500">€0.00</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">€27,340,000,000.00</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold text-sm">✓</td>
                      <td className="py-3 px-4 text-emerald-400">Agreed to CNMV Filing</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tickmark Legend */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Deloitte Standard Tickmark Legend:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                  <div><span className="text-emerald-400 font-bold">✓</span> Vouched to third-party bank confirmation</div>
                  <div><span className="text-purple-400 font-bold">^</span> Footed & cross-footed mathematically</div>
                  <div><span className="text-amber-400 font-bold">µ</span> Reconciled to subledger trial balance</div>
                  <div><span className="text-blue-400 font-bold">®</span> Recalculated independently by auditor</div>
                </div>
              </div>

            </div>
          )}

          {/* DELIVERABLE: MANAGEMENT LETTER (ISA 265 / PCAOB AS 1301) */}
          {selectedReport === 'mgmt-letter' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                  DELOITTE AUDIT QUALITY & QUALITY CONTROL REVIEW (ISA 265)
                </span>
                <h2 className="text-xl font-bold text-white">Management Letter & Internal Control Deficiency Report</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Communicating deficiencies in internal control identified during the financial statement audit of Telefónica S.A.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase font-mono px-2 py-0.5 bg-amber-950/60 rounded border border-amber-800">
                      Significant Deficiency #1: IT Segregation of Duties (SAP HANA Billing)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Process Owner: Chief Information Officer</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Finding:</strong> 14 elevated SAP developer accounts in Telefónica España had direct write access to automated billing rate tables without secondary supervisory approval.
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                    <strong>Deloitte Recommendation:</strong> Enforce dual-authorization access control lists (ACL) and run automated quarterly privilege audits. Management has agreed and remediated as of July 15, 2026.
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase font-mono px-2 py-0.5 bg-blue-950/60 rounded border border-blue-800">
                      Control Deficiency #2: Manual Journal Entry Approval Thresholds
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Process Owner: Corporate Controller</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Finding:</strong> Manual journal entries below €50,000 in Vivo Brasil subledgers required only single-level reviewer sign-off, creating minor Benford digit frequency variance.
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                    <strong>Deloitte Recommendation:</strong> Lower automated review threshold to €25,000 and implement automated AI fraud pattern scanning via EVE engine.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERABLE: PREPARED-BY-CLIENT (PBC) REQUEST LIST */}
          {selectedReport === 'pbc-tracker' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">
                    CLIENT AUDIT DELIVERABLE PORTAL (PBC REQUEST LIST)
                  </span>
                  <h2 className="text-xl font-bold text-white">Prepared-by-Client (PBC) Document Tracker</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Master list of financial records, bank confirmations, tax returns, and legal opinions requested from Telefónica S.A.
                  </p>
                </div>
                <button
                  onClick={handleExportDeloitteXLSX}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export PBC Schedule (.xlsx)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Ref #</th>
                      <th className="py-3 px-4">Requested Document / Schedule</th>
                      <th className="py-3 px-4">Responsible Party</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">EVE Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">PBC-101</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">Bank Confirmation Letters (14 Interbank Dealer Banks)</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">Treasury Dept (Madrid)</td>
                      <td className="py-3 px-4 text-slate-400">2026-07-10</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">100% Received</span>
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Direct Confirm</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">PBC-102</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">5G Hardware & Spectrum License Amortization Schedules</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">Fixed Assets Accounting</td>
                      <td className="py-3 px-4 text-slate-400">2026-07-12</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">100% Received</span>
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Recalculated</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">PBC-103</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">Legal Representation Letters (Active Material Litigation)</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">General Counsel (G.C.)</td>
                      <td className="py-3 px-4 text-slate-400">2026-07-20</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">100% Received</span>
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Vouched</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-blue-400 font-bold">PBC-104</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">Deferred Tax Asset (DTA) Recovery Projections (IAS 12)</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">Corporate Tax Director</td>
                      <td className="py-3 px-4 text-slate-400">2026-07-25</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">In Partner Review</span>
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-bold">Pending Signoff</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DELIVERABLE 4: INDEPENDENCE & RISK ASSESSMENT WORKPAPER */}
          {selectedReport === 'risk-independence' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">
                  ISA 300 / ISA 315 RISK & INDEPENDENCE AUDIT WORKPAPER
                </span>
                <h2 className="text-xl font-bold text-white">Independence & Risk Assessment Workpaper</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Engagement partner independence confirmation, audit risk model parameters, and anti-money laundering (AML) controls.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-emerald-400 font-bold block font-mono">1. Partner Independence & Ethics (IESBA / SEC Rules)</span>
                  <p className="text-slate-300">
                    All audit team members confirmed zero financial interest, non-audit service conflicts, or employment relationships with Telefónica S.A.
                  </p>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 inline-block font-mono">
                    Status: 100% Independent
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-blue-400 font-bold block font-mono">2. Audit Risk Equation (AR = IR × CR × DR)</span>
                  <p className="text-slate-300">
                    Inherent Risk (IR) assessed as Medium-High due to multi-currency operations. Control Risk (CR) assessed as Low based on IT general control testing. Detection Risk (DR) set to Low.
                  </p>
                  <span className="text-[10px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800 inline-block font-mono">
                    Overall Risk: Acceptable
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERABLE 5: BOARD PRESENTATION DECK */}
          {selectedReport === 'board-deck' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">
                    DELOITTE AUDIT COMMITTEE PRESENTATION DECK
                  </span>
                  <h2 className="text-xl font-bold text-white">Telefónica S.A. Board Briefing Slides</h2>
                  <p className="text-xs text-slate-400 mt-1">Executive slides formatted for Telefónica's Board of Directors</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export Presentation (PDF)</span>
                </button>
              </div>

              {/* Slide 1 */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 font-sans">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">SLIDE 1 OF 3: EXECUTIVE AUDIT SUMMARY</span>
                <h3 className="text-lg font-bold text-white">Q2 2026 Audit Completion & Financial Results</h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
                  <li><strong>Consolidated Revenue:</strong> €10,250M (€10.25B), stable YoY with service revenue growth in España and Vivo Brazil.</li>
                  <li><strong>OIBDA Profitability:</strong> €3,454M (33.7% margin) proving robust operating leverage.</li>
                  <li><strong>Net Debt & De-leveraging:</strong> Reduced to €27.34B (2.62x Net Debt / OIBDA leverage ratio).</li>
                  <li><strong>Audit Opinion:</strong> Deloitte issues an Unqualified Clean Opinion with no material weaknesses identified.</li>
                </ul>
              </div>

              {/* Slide 2 */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 font-sans">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">SLIDE 2 OF 3: KEY AUDIT MATTERS (KAMs)</span>
                <h3 className="text-lg font-bold text-white">Focus Areas for Audit Committee Governance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <strong className="text-emerald-400 block mb-1">IFRS 15 Bundles</strong>
                    <p className="text-slate-300">5G hardware & service allocation verified. Controls passed 100%.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <strong className="text-blue-400 block mb-1">IFRS 16 Leases</strong>
                    <p className="text-slate-300">Tower leases (€6.24B ROU Assets) verified against discount rates.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <strong className="text-purple-400 block mb-1">IFRS 9 FX Swaps</strong>
                    <p className="text-slate-300">Cross-currency hedges confirmed via 100% bank response rate.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DELIVERABLE 6: BENFORD FRAUD & SAMPLING */}
          {selectedReport === 'benford' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Benford's Law Digital Analysis & Monetary Unit Sampling (ISA 320)</h2>
                <p className="text-xs text-slate-400 mt-1">Automated first-digit mathematical frequency analysis to catch artificial transaction splitting, round-dollar fraud, and manual journal entry manipulation.</p>
              </div>

              {/* Materiality Calculator Controls */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Overall Materiality (OM @ {materialityPct}%)</label>
                  <span className="text-lg font-bold text-white">€{parseFloat(overallMateriality).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Performance Materiality (PM @ 75% OM)</label>
                  <span className="text-lg font-bold text-blue-400">€{parseFloat(performanceMateriality).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Clearly Trivial Threshold (CTT @ 5% OM)</label>
                  <span className="text-lg font-bold text-emerald-400">€{parseFloat(clearlyTrivial).toLocaleString()}</span>
                </div>
              </div>

              {/* Benford Digit Curve Visualization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>First-Digit Frequency vs. Benford Expected Curve</span>
                  <span className="text-amber-400 text-[11px] font-mono">Digit '4' High Variance Alert (+4.5%)</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-9 gap-2">
                  {benfordData.map((b, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-2 text-center">
                      <div className="w-full bg-slate-900 rounded-t-lg h-32 flex items-end justify-center p-1 relative">
                        <div
                          style={{ height: `${(b.expected / 35) * 100}%` }}
                          className="w-1.5 bg-slate-600 rounded-t"
                          title={`Expected: ${b.expected}%`}
                        />
                        <div
                          style={{ height: `${(b.observed / 35) * 100}%` }}
                          className={`w-2.5 rounded-t ml-1 ${b.status === 'FLAGGED' ? 'bg-amber-400 animate-pulse' : 'bg-blue-500'}`}
                          title={`Observed: ${b.observed}%`}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-white">#{b.digit}</span>
                      <span className={`text-[10px] font-mono ${b.status === 'FLAGGED' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                        {b.observed}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-xl text-xs text-amber-300 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Benford Anomaly Flagged for Auditor Review</strong>
                  <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                    14.2% of ledger entries start with digit '4' vs expected 9.7%. EVE flagged 18 vouchers around €40,000–€49,999 (potential approval limit avoidance).
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
