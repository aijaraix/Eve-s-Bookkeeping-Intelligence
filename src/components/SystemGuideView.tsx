import React, { useState } from 'react';
import {
  HelpCircle,
  Cpu,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Search,
  Building2,
  DollarSign,
  Activity,
  Sparkles,
  BookOpen,
  ArrowRight,
  Scale,
  FolderKanban,
  Database,
  AlertTriangle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Settings,
  Award,
  Zap,
  Filter,
  Eye,
  CheckSquare,
  FileCheck,
  TrendingUp,
  Sliders,
  BarChart3,
  Server,
  LayoutDashboard
} from 'lucide-react';

interface SystemGuideViewProps {
  onNavigate?: (view: string) => void;
}

export const SystemGuideView: React.FC<SystemGuideViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hermes' | 'taxonomy' | 'dashboards' | 'controls' | 'rules'>('all');

  const sections = [
    {
      id: 'hermes',
      title: '1. Hermes 4-Agent Orchestration Architecture',
      icon: Cpu,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'How Eve processes unstructured statutory financial reports into 100% verified structured facts using multi-agent AI consensus.',
      content: (
        <div className="space-y-6 text-sm text-slate-700">
          <p className="leading-relaxed">
            The backbone of Eve's Bookkeeping Platform is the <strong>Hermes 4-Agent Autonomous Pipeline</strong>. Instead of relying on a single generative prompt (which can hallucinate or miscalculate scale), Hermes splits document intelligence into four specialized agentic roles operating in strict sequence:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Ingestion Agent</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Layout &amp; OCR Structuring</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingests PDFs, PNGs, and Excel sheets. Performs multi-column OCR layout analysis, isolates financial tables, and maps bounding box coordinates (x, y, w, h) and page numbers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Extraction Agent</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Deterministic Fact Extraction</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Runs temperature 0.0 extraction queries against structured text. Isolates financial line items, monetary magnitudes (Thousands, Millions, Billions), and reporting periods (FY 2025, FY 2024).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">3</span>
                <span>Consensus Agent</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Lineage &amp; Provenance Binding</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verifies every extracted fact against the exact raw page text snippet. Binds the fact to its source document ID, page number, and original table cell coordinates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black">4</span>
                <span>Reconciliation Agent</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Accounting Identity Validation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes hard mathematical checks (Assets = Liabilities + Equity, Gross Profit = Revenue - Cost of Sales). Flags discrepancies for human auditor review.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Key Hermes Principles &amp; Technical Commitments
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-indigo-900">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Zero Fabrication:</strong> Never hallucinated values or synthetic placeholding metrics.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Audit Provenance:</strong> Every number clickable to reveal exact document page &amp; snippet.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Scale Protection:</strong> Explicit scale factor resolution (Thousands vs Millions vs Billions).</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Sign Normalization:</strong> Parenthetical accounting expenses e.g. (26,794)M mapped correctly to computational negatives.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'taxonomy',
      title: '2. Financial Fact Extraction Taxonomy',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Every financial statement metric, balance sheet line item, and cash flow category monitored by Eve.',
      content: (
        <div className="space-y-6 text-sm text-slate-700">
          <p className="leading-relaxed">
            Eve automatically categorizes extracted values into standardized IFRS / US GAAP financial taxonomy fields. Below is the complete catalog of facts extracted from financial statements and bank reports:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Statement Group */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Income Statement Facts</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Total Revenue / Turnover:</span>
                  <span className="font-mono text-slate-500">rev_01</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Cost of Sales / COGS:</span>
                  <span className="font-mono text-slate-500">cogs_02</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Gross Profit:</span>
                  <span className="font-mono text-slate-500">gp_03</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Operating Expenses (SG&amp;A, R&amp;D):</span>
                  <span className="font-mono text-slate-500">opex_04</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Operating Income / EBIT:</span>
                  <span className="font-mono text-slate-500">ebit_05</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">EBITDA:</span>
                  <span className="font-mono text-slate-500">ebitda_06</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Net Income / Profit for Period:</span>
                  <span className="font-mono text-slate-500">ni_07</span>
                </li>
              </ul>
            </div>

            {/* Balance Sheet Group */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Balance Sheet Facts</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Total Assets:</span>
                  <span className="font-mono text-slate-500">assets_01</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Cash &amp; Cash Equivalents:</span>
                  <span className="font-mono text-slate-500">cash_02</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Current Assets:</span>
                  <span className="font-mono text-slate-500">ca_03</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Non-Current Assets:</span>
                  <span className="font-mono text-slate-500">nca_04</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Total Liabilities:</span>
                  <span className="font-mono text-slate-500">liab_05</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Current Liabilities:</span>
                  <span className="font-mono text-slate-500">cl_06</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Shareholders' Equity:</span>
                  <span className="font-mono text-slate-500">equity_07</span>
                </li>
              </ul>
            </div>

            {/* Cash Flow & Bank Group */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">Cash Flow &amp; Bank Facts</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Operating Cash Flow (OCF):</span>
                  <span className="font-mono text-slate-500">ocf_01</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Investing Cash Flow (ICF):</span>
                  <span className="font-mono text-slate-500">icf_02</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Financing Cash Flow (FCF):</span>
                  <span className="font-mono text-slate-500">fcf_03</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Free Cash Flow (Derived):</span>
                  <span className="font-mono text-slate-500">free_cash_04</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Bank Statement Deposits:</span>
                  <span className="font-mono text-slate-500">bank_dep_05</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Bank Statement Withdrawals:</span>
                  <span className="font-mono text-slate-500">bank_wth_06</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-800">Ending Bank Balance:</span>
                  <span className="font-mono text-slate-500">bank_end_07</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboards',
      title: '3. Complete Platform Views & Dashboard Catalog',
      icon: LayoutDashboard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Detailed operational breakdown of every view and dashboard available in the sidebar.',
      content: (
        <div className="space-y-6 text-sm text-slate-700">
          <p className="leading-relaxed">
            The navigation sidebar provides access to 13 distinct specialized modules designed for executive reporting, auditor drill-down, and AI inspection:
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-purple-600" /> Executive Overview Dashboard
                </span>
                <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">View ID: overview</span>
              </div>
              <p className="text-xs text-slate-600">
                Aggregates high-level metrics across all client entities. Displays total corporate revenue, net income, asset base, multi-period comparative bar charts, and real-time document ingestion completion rings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" /> Workspaces &amp; Project Library
                </span>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">View ID: projects</span>
              </div>
              <p className="text-xs text-slate-600">
                Directory of client workspaces (e.g. Enterprise Client Workspaces, Regional Subsidiaries). Allows users to create new workspaces, assign fiscal periods, edit workspace settings, upload statutory files, or delete old engagements.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Company Directory &amp; Subsidiary Explorer
                </span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">View ID: companies</span>
              </div>
              <p className="text-xs text-slate-600">
                Detailed profile directory for corporate entities, displaying registration numbers, legal entity type, accounting standards (IFRS vs US GAAP), reporting currency, tax ID, and audit readiness status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Document Explorer &amp; Raw File Center
                </span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">View ID: documents</span>
              </div>
              <p className="text-xs text-slate-600">
                Document repository supporting multi-file upload, Google Drive import URLs, document status filters (Processed, Needs Review, Failed), raw PDF page rendering, and OCR table visualization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-600" /> Financial Statements Suite (Income, Balance, Cash)
                </span>
                <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-semibold">View ID: financials, income, balance, cash</span>
              </div>
              <p className="text-xs text-slate-600">
                Interactive financial statement viewer providing Income Statement variance analysis, Balance Sheet capital structure reconciliation bars (Assets = Liabilities + Equity), and Cash Flow waterfall visuals.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Audit Findings &amp; Review Center
                </span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">View ID: findings</span>
              </div>
              <p className="text-xs text-slate-600">
                Auditor review queue where extracted facts can be approved, marked as proposed, rejected, or flagged for discrepancy. Includes auditor notes, page snippets, and confidence scores.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" /> Data Quality &amp; Verification Dashboard
                </span>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">View ID: quality</span>
              </div>
              <p className="text-xs text-slate-600">
                Metrics on pipeline accuracy, instruction context score (99.2%), consensus log history, duplicate resolution, and hallucination rejection records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" /> Hermes Swarm &amp; Agent Inspector
                </span>
                <span className="text-[10px] font-mono bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-semibold">View ID: swarm, inspector</span>
              </div>
              <p className="text-xs text-slate-600">
                Live agentic telemetry dashboard showing active agent tasks, pipeline execution states, token bandwidth, and swarm agent logs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Ask AICPA - Financial AI Assistant
                </span>
                <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">View ID: insights, chat</span>
              </div>
              <p className="text-xs text-slate-600">
                Contextual AI assistant grounded exclusively in ingested facts. Answers questions regarding accounting standards, variance explanations, working capital analysis, and ratio trends.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" /> AI Deliverables &amp; Reports Export
                </span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">View ID: deliverables, reports</span>
              </div>
              <p className="text-xs text-slate-600">
                Generates formal audit memos, executive PDF board summaries, and downloadable financial data packages in CSV/Excel format.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'controls',
      title: '4. Interactive Controls & Button Options Guide',
      icon: Sliders,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'How every button, modal trigger, drill-down link, and filter control operates across the platform.',
      content: (
        <div className="space-y-6 text-sm text-slate-700">
          <p className="leading-relaxed">
            Eve features deep interactive drill-downs and verification controls. Here is a dictionary of key UI controls and how they behave:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Provenance Trace Modal</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Clicking Any Fact Metric</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking any financial number in dashboard cards or financial statements opens the Provenance Modal, displaying the source document name, exact page number, confidence percentage, and the verbatim text snippet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Line Item Drill-Down</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Clicking Income Line Items</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking on line items like Revenue or Cost of Sales opens a detailed modal showing sub-segment breakdowns, geographic origin, or quarterly ledger splits.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Global Currency Switcher</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Top Header Currency Dropdown</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Located in the top header bar. Instantly converts all display figures between EUR (€), USD ($), GBP (£), JPY (¥), BRL (R$), CHF (Fr), CAD (CA$), AUD (A$), and CNY (¥) using real-time FX multipliers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase">
                <Search className="w-4 h-4 text-purple-600" />
                <span>Global Search Bar (Cmd + K)</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Header Search Input</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pressing <kbd className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">Cmd + K</kbd> or clicking search lets you search across all workspaces, documents, and individual financial line items in milliseconds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Fact Status Toggles</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Review Center Status Selector</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                In Audit Findings, users can change a fact's status between <span className="text-emerald-700 font-semibold">Approved</span>, <span className="text-blue-700 font-semibold">Proposed</span>, <span className="text-amber-700 font-semibold">Needs Review</span>, or <span className="text-rose-700 font-semibold">Discrepancy</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase">
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span>Reset System Data</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Landing Page Reset Trigger</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clears all stored documents and extracted facts from local storage, returning the platform to a clean baseline state.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'rules',
      title: '5. Accounting Rules & Verification Safeguards',
      icon: ShieldCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Core financial logic safeguards that guarantee zero mathematical hallucinations.',
      content: (
        <div className="space-y-6 text-sm text-slate-700">
          <p className="leading-relaxed">
            To maintain Big Four level compliance, Eve enforces strict automated validation rules during ingestion and rendering:
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> 1. Year-as-Value Protection Guard
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents isolated calendar year numbers (such as <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">2025</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">2024</code>) from being misparsed as monetary balances. Unless preceded by an explicit currency symbol (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">$2025M</code>), isolated 4-digit numbers are automatically rejected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" /> 2. Balance Sheet Accounting Identity Equation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded text-slate-800">
                Total Assets == Total Liabilities + Shareholders' Equity
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the extracted assets differ from the sum of liabilities and equity by more than 2%, the system displays a prominent <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">RECONCILIATION FAILED</span> warning pill.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> 3. Income Statement Accounting Identity Equation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded text-slate-800">
                Gross Profit == Total Revenue + Cost of Sales (where Cost of Sales is negative)
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cost of sales items presented in parentheses e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">(26,794)M</code> are automatically converted to computational negative values so gross profit calculations remain mathematically precise.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" /> 4. Cash Flow Identity Equation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded text-slate-800">
                Derived Free Cash Flow == Operating Cash Flow - Net Capital Expenditures
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Free Cash Flow is derived strictly from verified operating and investing cash flow facts without synthetic estimation.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter((s) => {
    if (activeTab !== 'all' && s.id !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#081028] via-[#0f1f4b] to-[#081028] text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                  System Architecture &amp; How-To Operational Guide
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Comprehensive Manual to Eve's Bookkeeping Platform, Hermes Orchestration &amp; Verification Rules
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                Version 2026.8.1
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Systems Nominal
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            This reference manual provides an exhaustive breakdown of how Eve's Bookkeeping Platform ingests statutory financial reports, executes Hermes 4-Agent consensus, structures financial fact taxonomies, enforces accounting identities, and renders interactive analytical views.
          </p>

          {/* Guide Quick Search & Category Pills */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, views, options, buttons, or accounting rules..."
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Topics
              </button>
              <button
                onClick={() => setActiveTab('hermes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'hermes'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Hermes AI
              </button>
              <button
                onClick={() => setActiveTab('taxonomy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'taxonomy'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Fact Taxonomy
              </button>
              <button
                onClick={() => setActiveTab('dashboards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboards'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                View Catalog
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'controls'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Buttons &amp; Options
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Accounting Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Content Sections */}
      <div className="space-y-6">
        {filteredSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${section.bgColor} ${section.color} border ${section.borderColor}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {section.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50">
                {section.content}
              </div>
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No matching documentation sections found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search filter or selecting a different category tab.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>

      {/* Footer Return Action */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Need to navigate to an active workspace?</h4>
          <p className="text-xs text-slate-500">You can switch to any financial view using the left navigation sidebar at any time.</p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('overview')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
          >
            <span>Return to Global Overview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
