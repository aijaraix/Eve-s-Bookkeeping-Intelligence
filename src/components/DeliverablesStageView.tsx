import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Download, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Building, 
  DollarSign, 
  Calculator, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCw
} from 'lucide-react';
import { LeadScheduleSection, AuditMemorandum, DeliverablePackage } from '../types';

interface Props {
  workspaceId: string;
}

export const DeliverablesStageView: React.FC<Props> = ({ workspaceId }) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'memorandum' | 'export'>('schedules');
  const [leadSchedules, setLeadSchedules] = useState<LeadScheduleSection[]>([]);
  const [memo, setMemo] = useState<AuditMemorandum | null>(null);
  const [deliverablePkg, setDeliverablePkg] = useState<DeliverablePackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Balance Sheet: Assets Lead Schedule': true,
    'Income Statement: Revenue & Operating Income Lead Schedule': true
  });

  useEffect(() => {
    fetchDeliverablesData();
  }, [workspaceId]);

  const fetchDeliverablesData = async () => {
    setLoading(true);
    try {
      const [schedRes, memoRes, pkgRes] = await Promise.all([
        fetch(`/api/deliverables/lead-schedules?workspaceId=${workspaceId}`),
        fetch(`/api/deliverables/audit-memorandum?workspaceId=${workspaceId}`),
        fetch(`/api/deliverables/package?workspaceId=${workspaceId}`)
      ]);

      const schedData = await schedRes.json();
      const memoData = await memoRes.json();
      const pkgData = await pkgRes.json();

      if (schedData.success) setLeadSchedules(schedData.leadSchedules || []);
      if (memoData.success) setMemo(memoData.memo);
      if (pkgData.success) setDeliverablePkg(pkgData.package);
    } catch (err) {
      console.error('Failed to fetch deliverables data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleDownloadPackage = () => {
    window.open(`/api/deliverables/download/${workspaceId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Stage 4 Pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Deliverable & Audit Package Generation</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Audit working papers, lead schedules, automated audit memorandum, and complete exportable evidence package with line-by-line page citations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPackage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit Working Package
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'schedules' 
                ? 'bg-blue-600 text-white shadow' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            4.1 Lead Schedules & Working Papers
          </button>

          <button
            onClick={() => setActiveTab('memorandum')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'memorandum' 
                ? 'bg-blue-600 text-white shadow' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            4.2 Automated Audit Memorandum
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'export' 
                ? 'bg-blue-600 text-white shadow' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            4.3 Package Export & Provenance Bundle
          </button>
        </div>
      </div>

      {/* TAB 1: Lead Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Audit Working Paper Lead Schedules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Line-by-line breakdown mapping original extracted amounts to functional EUR currency with source document and page references.
              </p>
            </div>
            <button
              onClick={fetchDeliverablesData}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Schedules
            </button>
          </div>

          <div className="space-y-4">
            {leadSchedules.map(section => {
              const isExpanded = expandedSections[section.sectionTitle] !== false;
              return (
                <div key={section.sectionTitle} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div 
                    onClick={() => toggleSection(section.sectionTitle)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{section.sectionTitle}</h4>
                      <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        {section.rows.length} Items
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-slate-400 font-sans font-normal text-[11px]">Section Total:</span>
                      {section.currency} {section.totalFunctionalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                            <th className="py-2.5 px-4">Canonical Metric / Original Label</th>
                            <th className="py-2.5 px-4 text-right">Original Value</th>
                            <th className="py-2.5 px-4 text-center">FX Rate</th>
                            <th className="py-2.5 px-4 text-right">Functional (EUR) Value</th>
                            <th className="py-2.5 px-4">Document / Page Citation</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {section.rows.map(row => (
                            <tr key={row.factId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.labelNormalized}</div>
                                {row.labelOriginal !== row.labelNormalized && (
                                  <div className="text-[10px] text-slate-400 italic">Original: "{row.labelOriginal}"</div>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                                {row.originalCurrency} {row.valueOriginal}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-500">
                                {row.fxRateApplied ? row.fxRateApplied.toFixed(4) : '1.0000'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {row.functionalCurrency} {row.valueFunctional}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                <div className="font-medium text-slate-900 dark:text-slate-200">{row.documentTitle}</div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Page {row.pageNumber}</div>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {row.verificationStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {section.rows.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 text-xs italic">
                                No line items present for this schedule section.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Automated Audit Memorandum */}
      {activeTab === 'memorandum' && memo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                AUTOMATED AUDIT MEMORANDUM • {memo.memoId}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{memo.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Prepared by: {memo.preparedBy} • {new Date(memo.generatedAt).toLocaleDateString()}</p>
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              STATUS: {memo.signOffStatus}
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">1. Executive Audit Summary</h3>
              <p>{memo.executiveSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  2. Corporate Structure & Consolidation Scope
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{memo.entityStructureSummary}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  3. Multi-Currency Conversion Analysis
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{memo.currencyConversionSummary}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                4. Accounting Equation & Mathematical Reconciliation Status
              </h4>
              <p className="text-slate-600 dark:text-slate-400">{memo.reconciliationStatusSummary}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                5. Material Footnote & Narrative Disclosures
              </h4>
              <p className="text-slate-600 dark:text-slate-400">{memo.materialDisclosuresSummary}</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">6. Auditor Key Findings & Reviewer Notes</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                {memo.findingsAndNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Package Export */}
      {activeTab === 'export' && deliverablePkg && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-blue-600" />
                Complete Audit Working Package & Export Bundle
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download the complete working paper bundle including line schedules, automated memorandum, fact registry snapshot, and document citations.
              </p>
            </div>

            <button
              onClick={handleDownloadPackage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON Audit Bundle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-xs font-medium block">Total Documents Cited</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {deliverablePkg.totalDocumentsCount} Documents
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-xs font-medium block">Total Facts Included</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {deliverablePkg.totalFactsCount} Line Items
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-xs font-medium block">Lead Schedule Sections</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {deliverablePkg.leadSchedules.length} Schedules
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
