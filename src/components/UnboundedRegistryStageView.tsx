import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Calculator, 
  ArrowRight, 
  Eye, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Tag
} from 'lucide-react';
import { ExtractedFact, AccountingReconciliationRule } from '../types';

interface Props {
  workspaceId: string;
}

export const UnboundedRegistryStageView: React.FC<Props> = ({ workspaceId }) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'backfill' | 'secondpass' | 'reconciliation'>('registry');

  // Fact Registry state
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [totalFacts, setTotalFacts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stats, setStats] = useState<any>({
    totalFacts: 0,
    proposedCandidates: 0,
    secondPassDisclosures: 0,
    verifiedFacts: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [candidateStateFilter, setCandidateStateFilter] = useState<string>('ALL');
  const [disclosureCategoryFilter, setDisclosureCategoryFilter] = useState<string>('ALL');
  const [verificationStageFilter, setVerificationStageFilter] = useState<string>('ALL');

  // Reconciliation state
  const [reconRules, setReconRules] = useState<AccountingReconciliationRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistryData();
    fetchReconciliationData();
  }, [workspaceId, currentPage, candidateStateFilter, disclosureCategoryFilter, verificationStageFilter]);

  const fetchRegistryData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        workspaceId,
        page: currentPage.toString(),
        limit: '25',
        candidateState: candidateStateFilter,
        disclosureCategory: disclosureCategoryFilter,
        verificationStage: verificationStageFilter,
        searchQuery
      });

      const res = await fetch(`/api/unbounded-facts?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFacts(data.facts || []);
        setTotalFacts(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch unbounded facts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationData = async () => {
    try {
      const res = await fetch(`/api/reconciliation-rules?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.success) {
        setReconRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch reconciliation rules:', err);
    }
  };

  const handleUpdateCandidateState = async (factId: string, newState: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/facts/${factId}/candidate-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateState: newState })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Candidate ${newState === 'ACCEPTED' ? 'promoted to ACCEPTED' : 'marked as REJECTED'}`);
        setTimeout(() => setActionMessage(null), 3000);
        fetchRegistryData();
      }
    } catch (err) {
      console.error('Failed to update candidate state:', err);
    }
  };

  const handleTriggerBackfill = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backfill-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`BackfillAgent created ${data.candidatesCreated} PROPOSED candidates`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchRegistryData();
      }
    } catch (err) {
      console.error('Backfill error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSecondPass = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/doc-1/second-pass-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Second-Pass Narrative Parser extracted ${data.secondPassFactsCount} note disclosures`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchRegistryData();
      }
    } catch (err) {
      console.error('Second-pass extraction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Stage 3 Pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Unbounded Fact Registry, Second-Pass Disclosures & Candidate Verification</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              High-throughput Fact Registry with candidate workflow (<span className="text-purple-300 font-medium">PROPOSED, ACCEPTED, REJECTED</span>), narrative disclosure extraction, and multi-stage accounting reconciliation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchRegistryData}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Registry
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 bg-purple-950/80 border border-purple-500/40 text-purple-200 rounded-lg text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-purple-400 hover:text-white">&times;</button>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Registered Facts</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">{stats.totalFacts || totalFacts}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-amber-400 text-[10px] uppercase font-semibold block">Proposed Candidates</span>
            <span className="text-xl font-bold text-amber-300 font-mono mt-1 block">{stats.proposedCandidates}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-purple-400 text-[10px] uppercase font-semibold block">Second-Pass Disclosures</span>
            <span className="text-xl font-bold text-purple-300 font-mono mt-1 block">{stats.secondPassDisclosures}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-emerald-400 text-[10px] uppercase font-semibold block">Reconciled & Verified</span>
            <span className="text-xl font-bold text-emerald-300 font-mono mt-1 block">{stats.verifiedFacts}</span>
          </div>
        </div>

        {/* Sub-Stage Indicator Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'registry' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            3.1 Unbounded Fact Registry
          </button>

          <button
            onClick={() => setActiveTab('backfill')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'backfill' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3.2 BackfillAgent Candidate Generator
          </button>

          <button
            onClick={() => setActiveTab('secondpass')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'secondpass' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            3.3 Second-Pass Note Disclosures
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'reconciliation' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            3.4 Accounting Reconciliation Pipeline ({reconRules.length} Rules)
          </button>
        </div>
      </div>

      {/* TAB 1: 3.1 Unbounded Fact Registry Table */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Unbounded Queryable Fact Registry ({totalFacts} Records)
                </h2>
                <p className="text-xs text-slate-500">
                  Search across extracted facts, filter by candidate status or disclosure type, and manage candidate promotions.
                </p>
              </div>

              {/* Fast Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search facts, metrics, or notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchRegistryData()}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Filter controls bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                Filters:
              </div>

              <select
                value={candidateStateFilter}
                onChange={e => setCandidateStateFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Candidate States</option>
                <option value="PROPOSED">PROPOSED Only</option>
                <option value="ACCEPTED">ACCEPTED Only</option>
                <option value="REJECTED">REJECTED Only</option>
              </select>

              <select
                value={disclosureCategoryFilter}
                onChange={e => setDisclosureCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Categories</option>
                <option value="Leases & Commitments">Leases & Commitments</option>
                <option value="Tax Disclosures">Tax Disclosures</option>
                <option value="Segment Reporting">Segment Reporting</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] uppercase font-semibold">
                    <th className="py-3 px-4">Metric / Raw Label</th>
                    <th className="py-3 px-4">Candidate State</th>
                    <th className="py-3 px-4 text-right">Functional Value</th>
                    <th className="py-3 px-4">Source / Note Ref</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {facts.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{f.labelNormalized}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Metric: <span className="text-purple-600 dark:text-purple-400 font-semibold">{f.canonicalMetric || 'unclassified'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          f.candidateState === 'PROPOSED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : f.candidateState === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : f.candidateState === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {f.candidateState || 'VERIFIED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {f.functionalCurrency || 'EUR'} {f.valueFunctional}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{f.noteReference || `Page ${f.pageNumber}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{f.extractionMethod}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {f.candidateState === 'PROPOSED' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleUpdateCandidateState(f.id, 'ACCEPTED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] rounded transition"
                              title="Promote Candidate to Accepted"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateCandidateState(f.id, 'REJECTED')}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-medium text-[10px] rounded transition"
                              title="Reject Candidate"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {facts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No facts match the selected query parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>Page {currentPage} of {totalPages} ({totalFacts} facts)</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3.2 BackfillAgent Candidate Conversion */}
      {activeTab === 'backfill' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-purple-600" />
                BackfillAgent Candidate Conversion Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                BackfillAgent scans extracted line items and source blocks to derive missing figures. Candidates are saved exclusively as <strong className="text-amber-600">PROPOSED candidates</strong> without mutating verified primary facts.
              </p>
            </div>
            <button
              onClick={handleTriggerBackfill}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Execute Backfill Candidate Conversion Pass
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Backfill Candidate Safety Rules:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Candidates are flagged with <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-purple-600">candidateState = PROPOSED</code>.</li>
              <li>Derived calculations do NOT overwrite user-verified line items on financial statements.</li>
              <li>Reviewers can accept or reject candidate candidates from the Fact Registry view.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: 3.3 Second-Pass Note Disclosures */}
      {activeTab === 'secondpass' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-purple-600" />
                Second-Pass Extraction over Narrative & Footnote Blocks
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scans all narrative blocks to capture non-tabular disclosures (Operating Leases, Tax Rates, Segment Disclosures, Contingencies).
              </p>
            </div>
            <button
              onClick={handleTriggerSecondPass}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Run Second-Pass Narrative Note Extraction
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: 3.4 Multi-Stage Verification Pipeline & Accounting Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Calculator className="w-4.5 h-4.5 text-purple-600" />
              Automated Accounting Reconciliation Engine
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Verifies mathematical integrity across statement boundaries (Balance Sheet equation, Income Statement gross profit, Net Income bridge).
            </p>

            <div className="space-y-3">
              {reconRules.map(rule => (
                <div 
                  key={rule.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                          {rule.ruleCode}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rule.ruleName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{rule.expectedEquation}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${
                      rule.status === 'BALANCED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rule.status === 'VARIANCE_DETECTED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {rule.status === 'BALANCED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {rule.status === 'VARIANCE_DETECTED' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {rule.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 text-xs font-mono">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-sans block">{rule.statementA}: {rule.metricA}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{rule.calculatedValueA.toLocaleString()} EUR</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-sans block">{rule.statementB}: {rule.metricB}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{rule.calculatedValueB.toLocaleString()} EUR</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-sans block">Variance / Discrepancy</span>
                      <span className={`font-bold ${rule.variance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rule.variance.toLocaleString()} EUR
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 italic">
                    {rule.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
