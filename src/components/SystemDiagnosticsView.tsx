import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileText,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Download,
  Search,
  RefreshCw,
  Server,
  Play,
  ShieldCheck,
  Table,
  BarChart3,
  GitBranch,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  Terminal,
  HelpCircle,
  Code
} from 'lucide-react';
import { Workspace } from '../types';

interface SystemDiagnosticsViewProps {
  activeWorkspace: Workspace | null;
}

export const SystemDiagnosticsView: React.FC<SystemDiagnosticsViewProps> = ({ activeWorkspace }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Diagnostic Data States
  const [overview, setOverview] = useState<any>(null);
  const [manifests, setManifests] = useState<any[]>([]);
  const [sourceBlocks, setSourceBlocks] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [derivedMetrics, setDerivedMetrics] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [dashboardLineage, setDashboardLineage] = useState<any[]>([]);
  const [reportLineage, setReportLineage] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const wsParam = activeWorkspace ? `?workspaceId=${activeWorkspace.id}` : '';
      
      const [
        overviewRes,
        manifestsRes,
        blocksRes,
        tablesRes,
        metricsRes,
        validationsRes,
        conflictsRes,
        oppsRes,
        dashRes,
        rptRes,
        healthRes
      ] = await Promise.all([
        fetch('/api/diagnostics/overview').then(r => r.json()).catch(() => null),
        fetch(`/api/diagnostics/manifests${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/source-blocks${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/tables${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/derived-metrics${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/validations${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/conflicts${wsParam}`).then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/opportunities${wsParam}`).then(r => r.json()).catch(() => []),
        fetch('/api/diagnostics/dashboard-lineage').then(r => r.json()).catch(() => []),
        fetch(`/api/diagnostics/report-lineage${wsParam}`).then(r => r.json()).catch(() => []),
        fetch('/api/diagnostics/health').then(r => r.json()).catch(() => null)
      ]);

      if (overviewRes) setOverview(overviewRes);
      if (Array.isArray(manifestsRes)) setManifests(manifestsRes);
      if (Array.isArray(blocksRes)) setSourceBlocks(blocksRes);
      if (Array.isArray(tablesRes)) setTables(tablesRes);
      if (Array.isArray(metricsRes)) setDerivedMetrics(metricsRes);
      if (Array.isArray(validationsRes)) setValidations(validationsRes);
      if (Array.isArray(conflictsRes)) setConflicts(conflictsRes);
      if (Array.isArray(oppsRes)) setOpportunities(oppsRes);
      if (Array.isArray(dashRes)) setDashboardLineage(dashRes);
      if (Array.isArray(rptRes)) setReportLineage(rptRes);
      if (healthRes) setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [activeWorkspace]);

  const handleExportBundle = () => {
    window.open('/api/diagnostics/export', '_blank');
  };

  const tabs = [
    { id: 'overview', label: '1. System Overview', icon: Activity },
    { id: 'documents', label: '2. Documents', icon: FileText },
    { id: 'jobs', label: '3. Ingestion Jobs', icon: Server },
    { id: 'pages', label: '4. Page Processing', icon: Layers },
    { id: 'source_blocks', label: '5. Source Blocks', icon: Code },
    { id: 'tables', label: '6. Tables & Charts', icon: Table },
    { id: 'fact_registry', label: '7. Fact Registry', icon: Database },
    { id: 'derived_metrics', label: '8. Derived Metrics', icon: BarChart3 },
    { id: 'validations', label: '9. Validation & Reconciliation', icon: ShieldCheck },
    { id: 'conflicts', label: '10. Conflicts & Review Queue', icon: AlertTriangle },
    { id: 'opportunities', label: '11. Additional Fact Extraction', icon: GitBranch },
    { id: 'agent_activity', label: '12. AI / Agent Activity', icon: Cpu },
    { id: 'ask_eve_retrieval', label: '13. Ask Eve Retrieval', icon: HelpCircle },
    { id: 'dashboard_lineage', label: '14. Dashboard Lineage', icon: BarChart3 },
    { id: 'report_lineage', label: '15. Report Lineage', icon: FileSpreadsheet },
    { id: 'errors', label: '16. Errors & Retries', icon: AlertOctagon },
    { id: 'performance', label: '17. Performance & Cost', icon: Clock },
    { id: 'pipeline_versions', label: '18. Pipeline Versions', icon: Terminal },
    { id: 'test_harness', label: '19. Test Harness', icon: Play },
    { id: 'diagnostic_export', label: '20. Diagnostic Export', icon: Download },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-xl border border-slate-800 shadow-lg backdrop-blur">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                System Diagnostics & Pipeline Observability
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  Admin / Developer Mode
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Full end-to-end lineage, page manifests, fact provenance, and accounting reconciliations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDiagnostics}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh State
          </button>
          <button
            onClick={handleExportBundle}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Diagnostic Bundle
          </button>
        </div>
      </div>

      {/* Global Search & Workspace Scope */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search metric, document, fact ID, page, or source text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Active Scope:</span>
          <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded font-mono">
            {activeWorkspace ? `${activeWorkspace.name} (${activeWorkspace.id})` : 'Global System'}
          </span>
        </div>
      </div>

      {/* 20 Diagnostic Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-2 border ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Documents</div>
              <div className="text-2xl font-bold text-white mt-1">{overview.documentsUploaded}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{overview.documentsCompleted} Completed</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Pages Discovered</div>
              <div className="text-2xl font-bold text-white mt-1">{overview.totalPagesDiscovered}</div>
              <div className="text-[11px] text-slate-400 mt-1">100% Processed</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Source Blocks</div>
              <div className="text-2xl font-bold text-white mt-1">{overview.totalSourceBlocksCaptured}</div>
              <div className="text-[11px] text-blue-400 mt-1">{overview.totalParagraphsCaptured} Paragraphs</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Tables Detected</div>
              <div className="text-2xl font-bold text-white mt-1">{overview.totalTablesDetected}</div>
              <div className="text-[11px] text-emerald-400 mt-1">100% Extracted</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Extracted Facts</div>
              <div className="text-2xl font-bold text-white mt-1">{overview.totalFactsExtracted}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{overview.totalFactsVerified} Verified</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Conflicts / Anomalies</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{overview.totalConflicts}</div>
              <div className="text-[11px] text-slate-400 mt-1">Review Queue Active</div>
            </div>
          </div>

          {/* Processing Stages Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Pipeline Processing Stage Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {overview.processingStages.map((stg: any, i: number) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{stg.stage}</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">
                      {stg.status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mt-2 font-mono">{stg.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Page Processing & Manifests */}
      {(activeTab === 'pages' || activeTab === 'documents') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Durable Page Manifest Registry</h3>
            <span className="text-xs text-slate-400 font-mono">{manifests.length} Page Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950">
                  <th className="p-3">Page Manifest ID</th>
                  <th className="p-3">Doc ID</th>
                  <th className="p-3">Page #</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Text / OCR</th>
                  <th className="p-3">Tables</th>
                  <th className="p-3">Blocks</th>
                  <th className="p-3">Facts</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {manifests.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-blue-400">{m.id}</td>
                    <td className="p-3 text-slate-400">{m.document_id}</td>
                    <td className="p-3 font-bold text-white">P{m.page_number}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-sans">
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3">{m.native_text_available ? 'Native Text' : 'OCR Required'}</td>
                    <td className="p-3">{m.table_detected ? 'Yes' : 'None'}</td>
                    <td className="p-3">{m.source_blocks_created}</td>
                    <td className="p-3 text-emerald-400 font-bold">{m.facts_extracted}</td>
                    <td className="p-3 text-slate-400">{m.processing_duration_ms}ms</td>
                    <td className="p-3 text-emerald-400">{m.verification_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Source Blocks */}
      {activeTab === 'source_blocks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Source Block Structure Registry</h3>
          <div className="space-y-3">
            {sourceBlocks.map((blk) => (
              <div key={blk.source_block_id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-blue-400 font-semibold">{blk.source_block_id}</span>
                  <span>Doc: {blk.document_id} | Page: {blk.page_number}</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-sans">
                    {blk.block_type}
                  </span>
                </div>
                <div className="text-slate-200 font-sans bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  {blk.raw_text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Derived Metrics */}
      {activeTab === 'derived_metrics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Calculated & Derived Financial Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {derivedMetrics.map((dm) => (
              <div key={dm.derived_metric_id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{dm.metric_name}</span>
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">
                    {dm.validation_status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  {dm.calculation_result !== null ? `${dm.calculation_result} ${dm.currency_or_unit}` : 'NOT AVAILABLE'}
                </div>
                <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                  Formula: {dm.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Validations & Reconciliations */}
      {activeTab === 'validations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Accounting Identity Reconciliations</h3>
          <div className="space-y-3">
            {validations.map((v) => (
              <div key={v.validation_id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{v.rule_name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-1">Formula: {v.formula}</div>
                  <div className="text-xs text-slate-300 mt-1">{v.reason}</div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-xs font-bold font-mono border ${
                    v.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {v.status}
                  </span>
                  <div className="text-xs text-slate-400 font-mono mt-1">Variance: {v.variance} ({v.variance_pct}%)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 20: Diagnostic Export */}
      {activeTab === 'diagnostic_export' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4 max-w-xl mx-auto">
          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-blue-500/20">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Export Full Diagnostic Bundle</h3>
          <p className="text-xs text-slate-400">
            Generates a non-secret operational JSON package containing document records, page manifests, source blocks, extracted facts, derived metrics, and audit logs.
          </p>
          <button
            onClick={handleExportBundle}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Download system_diagnostics_bundle.json
          </button>
        </div>
      )}
    </div>
  );
};
