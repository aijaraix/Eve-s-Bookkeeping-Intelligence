import React, { useState } from 'react';
import {
  Building2,
  Search,
  Globe,
  MapPin,
  Users,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Share2,
  Download,
  MoreVertical,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  FileSpreadsheet,
  Plus,
  Edit,
  Archive,
  Sparkles,
  DollarSign,
  Briefcase,
  FolderOpen,
  FileBarChart,
  Network,
  UserCheck,
  Clock,
  Settings,
  Scale,
  Building,
  CheckSquare,
  Lock,
  MessageSquare,
  Send,
  ExternalLink,
  Award,
  BarChart3,
  Filter,
  RefreshCw,
  X,
  Database,
  Cpu,
  Leaf
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Workspace, DocumentRecord } from '../types';

interface CompanyDirectoryViewProps {
  workspaces: Workspace[];
  documents: DocumentRecord[];
  onSelectWorkspace: (ws: Workspace) => void;
  onNavigate: (view: string) => void;
}

export const CompanyDirectoryView: React.FC<CompanyDirectoryViewProps> = ({
  workspaces,
  documents,
  onSelectWorkspace,
  onNavigate,
}) => {
  // Currently selected company ID
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(workspaces[0]?.id || 'ws-1');
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  React.useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch(`/api/financial/summary?workspaceId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to fetch summary for company directory", err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [selectedCompanyId]);

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'country' | 'documents'>('name');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'financials' | 'documents' | 'findings' | 'reports' | 'insights' | 'subsidiaries' | 'contacts' | 'activity' | 'geographic' | 'settings'
  >('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<
    'key_info' | 'financial_highlights' | 'credit_ratings' | 'banking_facilities' | 'legal_compliance' | 'esg_overview'
  >('key_info');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    key_info: true,
    financial_highlights: false,
    credit_ratings: false,
    banking_facilities: false,
    legal_compliance: false,
    esg_overview: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Business Segments Data for Donut Chart
  const businessSegmentsData = [
    { name: 'Cloud & B2B Solutions', value: 42.6, color: '#1e3a8a', rev: '$2.31B' },
    { name: 'Digital Software Platform', value: 31.0, color: '#3b82f6', rev: '$1.68B' },
    { name: 'Hardware & Infrastructure', value: 16.0, color: '#10b981', rev: '$0.87B' },
    { name: 'Professional Services', value: 7.8, color: '#8b5cf6', rev: '$0.42B' },
    { name: 'Other Operations', value: 2.6, color: '#94a3b8', rev: '$0.14B' },
  ];

  // Regional Distribution Data
  const geographicRegions = [
    { region: 'North America', pct: 45, rev: '$2.44B', color: 'bg-blue-600' },
    { region: 'Europe', pct: 25, rev: '$1.35B', color: 'bg-indigo-600' },
    { region: 'Asia Pacific', pct: 20, rev: '$1.08B', color: 'bg-emerald-600' },
    { region: 'Latin America', pct: 6, rev: '$0.32B', color: 'bg-purple-600' },
    { region: 'Middle East & Africa', pct: 4, rev: '$0.21B', color: 'bg-amber-600' },
  ];

  // Modal States
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Eve, your corporate AI Analyst for this client profile. How can I assist with financial analysis, compliance audit findings, or report generation today?'
    }
  ]);

  // Find selected workspace / company
  const currentWs = workspaces.find((w) => w.id === selectedCompanyId) || workspaces[0] || {
    id: 'ws-empty',
    name: 'New Client Workspace',
    code: 'CLIENT-01',
    currency: 'USD',
    country: 'United States',
    createdAt: new Date().toISOString(),
  };

  // Dynamic company metadata based on actual workspace and extracted documents
  const companyDocs = documents.filter(d => d.workspaceId === currentWs.id);
  const companyDetails = {
    name: currentWs.name,
    legalName: currentWs.name,
    status: 'Active Workspace',
    listing: 'Corporate Client',
    industry: 'Financial & Corporate Entity',
    country: currentWs.country || 'Global',
    hq: 'Global Office',
    fiscalYearEnd: 'December 31',
    reportingCurrency: currentWs.currency || 'USD',
    accountingStandard: 'IFRS / GAAP',
    healthScore: 'Pending',
    riskScore: companyDocs.length > 0 ? 'Low Risk' : 'Awaiting Data',
    auditReadiness: companyDocs.length > 0 ? `${Math.round((companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length / companyDocs.length) * 100)}% Ingested` : 'Not Assessed',
    dataCompleteness: companyDocs.length > 0 ? `${companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length} / ${companyDocs.length} Docs` : '0 Docs',
    annualRevenue: summary?.revenue && summary.revenue !== '—' ? `${summary.currency} ${summary.revenue}` : (loadingSummary ? 'Loading...' : 'Awaiting Data'),
    netIncome: summary?.netIncome && summary.netIncome !== '—' ? `${summary.currency} ${summary.netIncome}` : (loadingSummary ? 'Loading...' : 'Awaiting Data'),
    totalAssets: summary?.assets && summary.assets !== '—' ? `${summary.currency} ${summary.assets}` : (loadingSummary ? 'Loading...' : 'Awaiting Data'),
    totalLiabilities: summary?.liabilities && summary.liabilities !== '—' ? `${summary.currency} ${summary.liabilities}` : (loadingSummary ? 'Loading...' : 'Awaiting Data'),
    equity: summary?.equity && summary.equity !== '—' ? `${summary.currency} ${summary.equity}` : (loadingSummary ? 'Loading...' : 'Awaiting Data'),
    cashBalance: summary?.cash && summary.cash !== '—' ? `${summary.currency} ${summary.cash}` : 'Awaiting Data',
    marketCap: '—',
    enterpriseValue: '—',
    employees: '—',
    operatingCountries: currentWs.country || 'Global',
    taxId: '—',
    regNumber: '—',
    dateIncorporated: '—',
    website: 'https://client-portal.com',
    auditor: 'Hermes CPA AI System',
    legalCounsel: 'Corporate Counsel',
    bankingPartners: 'Primary Interbank',
    ownership: 'Corporate',
    documentsCount: companyDocs.length,
    lastUpdated: 'Just now'
  };

  // Financial Trend 5-Year Data
  const fiveYearTrendData = [
    { year: '2020', Revenue: 38.2, NetIncome: 1.8, EBITDA: 11.4 },
    { year: '2021', Revenue: 39.1, NetIncome: 2.0, EBITDA: 12.1 },
    { year: '2022', Revenue: 39.9, NetIncome: 2.15, EBITDA: 12.5 },
    { year: '2023', Revenue: 40.65, NetIncome: 2.36, EBITDA: 13.0 },
    { year: '2024 (F)', Revenue: 41.8, NetIncome: 2.52, EBITDA: 13.6 },
  ];

  // Engagements / Projects List for this company
  const companyProjects = [
    {
      id: 'p-1',
      title: 'FY 2023 Statutory Financial Audit',
      type: 'Annual Audit',
      status: 'In Progress',
      partner: 'Jane Smith (Partner)',
      manager: 'Michael Brown (Senior Mgr)',
      completion: 87,
      budget: '€450,000',
      risk: 'Low',
      startDate: 'Jan 15, 2024',
      endDate: 'Jun 30, 2024',
      findings: 3,
      tasksRemaining: 4,
    },
    {
      id: 'p-2',
      title: 'Q1 2024 Interim Financial Review',
      type: 'Quarterly Review',
      status: 'Completed',
      partner: 'Jane Smith (Partner)',
      manager: 'Sarah Johnson (Audit Mgr)',
      completion: 100,
      budget: '€120,000',
      risk: 'Low',
      startDate: 'Apr 1, 2024',
      endDate: 'May 10, 2024',
      findings: 0,
      tasksRemaining: 0,
    },
    {
      id: 'p-3',
      title: 'IFRS 16 Lease & Asset Valuation Review',
      type: 'Internal Controls / Technical',
      status: 'In Progress',
      partner: 'David Wilson (Partner)',
      manager: 'Emily Davis (Senior Ass.)',
      completion: 64,
      budget: '€180,000',
      risk: 'Medium',
      startDate: 'Feb 1, 2024',
      endDate: 'Jul 15, 2024',
      findings: 2,
      tasksRemaining: 7,
    },
    {
      id: 'p-4',
      title: 'Corporate Tax & Transfer Pricing Review',
      type: 'Tax Projects',
      status: 'Planning',
      partner: 'Carlos Mendez (Tax Partner)',
      manager: 'Jessica Lee (Tax Mgr)',
      completion: 20,
      budget: '€210,000',
      risk: 'Medium',
      startDate: 'May 1, 2024',
      endDate: 'Aug 30, 2024',
      findings: 1,
      tasksRemaining: 12,
    },
  ];

  // Dynamic Subsidiaries Data based on active company
  const getDynamicSubs = () => {
    const name = currentWs.name || 'Corporate Entity';
    const nameLower = name.toLowerCase();

    if (nameLower.includes('apple')) {
      return [
        { name: 'Apple Operations International', country: 'Ireland', ownership: '100%', rev: '$120.4B', role: 'Holding & Global Operations Sub' },
        { name: 'Apple Sales International Ltd', country: 'Ireland', ownership: '100%', rev: '$85.2B', role: 'Global Sales & Distribution Unit' },
        { name: 'Apple Retail UK Ltd', country: 'United Kingdom', ownership: '100%', rev: '£4.1B', role: 'Retail Store Operations' },
        { name: 'Apple Japan Inc.', country: 'Japan', ownership: '100%', rev: '¥3.2T', role: 'Regional APAC Operating Sub' }
      ];
    } else if (nameLower.includes('microsoft')) {
      return [
        { name: 'Microsoft Ireland Operations Ltd', country: 'Ireland', ownership: '100%', rev: '$52.0B', role: 'EMEA Regional Operations Sub' },
        { name: 'LinkedIn Corporation', country: 'United States', ownership: '100%', rev: '$15.2B', role: 'Professional Platform Unit' },
        { name: 'GitHub Inc.', country: 'United States', ownership: '100%', rev: '$1.2B', role: 'Developer Ecosystem Unit' }
      ];
    } else if (nameLower.includes('unilever')) {
      return [
        { name: 'Unilever NV / BV', country: 'Netherlands', ownership: '100%', rev: '€22.4B', role: 'European Operating Division' },
        { name: 'Unilever United States Inc.', country: 'United States', ownership: '100%', rev: '$12.8B', role: 'North America Operating Sub' },
        { name: 'Hindustan Unilever Ltd', country: 'India', ownership: '61.9%', rev: '₹590B', role: 'Listed Operating Subsidiary' }
      ];
    }
    const c = currentWs.country || 'United States';
    const curr = currentWs.currency || 'USD';
    return [
      { name: `${name} Primary Operations Unit`, country: c, ownership: '100%', rev: `${curr} - Ingested`, role: 'Wholly Owned Operating Sub' },
      { name: `${name} Commercial Division`, country: 'United Kingdom', ownership: '100%', rev: `${curr} - Ingested`, role: 'Commercialization Unit' },
      { name: `${name} R&D Division`, country: c, ownership: '100%', rev: `${curr} - Ingested`, role: 'Research & Intellectual Property Unit' }
    ];
  };

  const subsidiariesList = getDynamicSubs();

  // Dynamic Client Contacts
  const getDynamicContacts = () => {
    const cleanName = currentWs.name || 'Corporate Entity';
    const domain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    return [
      { name: `Chief Executive Officer (${cleanName})`, title: 'Chief Executive Officer', role: 'CEO', email: `executive@${domain}.com`, phone: '+1 (555) 019-2831' },
      { name: `Chief Financial Officer (${cleanName})`, title: 'Chief Financial Officer', role: 'CFO', email: `finance@${domain}.com`, phone: '+1 (555) 019-2832' },
      { name: `Chief Accounting Officer (${cleanName})`, title: 'Chief Accounting Officer & Group Controller', role: 'Controller', email: `accounting@${domain}.com`, phone: '+1 (555) 019-2833' },
      { name: `General Counsel (${cleanName})`, title: 'Chief Legal Officer & General Counsel', role: 'Legal Counsel', email: `legal@${domain}.com`, phone: '+1 (555) 019-2834' },
    ];
  };

  const clientContacts = getDynamicContacts();

  // Activity Feed
  const activityLogs = [
    { id: 'act-1', text: 'Document uploaded', user: 'User', time: '12 mins ago', type: 'doc' },
    { id: 'act-2', text: 'Eve AI executed automated scan', user: 'Eve AI Agent', time: '5 hours ago', type: 'ai' },
  ];

  // Handle AI Chat Submit
  const handleSendAiChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatMessage.trim()) return;

    const userText = aiChatMessage;
    setAiChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiChatMessage('');

    setTimeout(() => {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Based on ${currentWs.name}'s FY 2023 financial statements and current audit records: Revenue is reported at ${companyDetails.annualRevenue} with EBITDA margin of 32.0%. All 4 primary financial statements (Income Statement, Balance Sheet, Cash Flow, Equity) are verified and reconciled. Zero material fraud indicators were flagged.`,
        },
      ]);
    }, 600);
  };

  // --- LIST MODE COMPUTATIONS ---
  const allCountries = Array.from(new Set(workspaces.map(w => w.country || 'Global'))).filter(Boolean);
  const allCurrencies = Array.from(new Set(workspaces.map(w => w.currency || 'USD'))).filter(Boolean);

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = listSearchTerm === '' ||
      w.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      (w.code && w.code.toLowerCase().includes(listSearchTerm.toLowerCase())) ||
      (w.country && w.country.toLowerCase().includes(listSearchTerm.toLowerCase()));

    const matchesCountry = countryFilter === 'ALL' || w.country === countryFilter;
    const matchesCurrency = currencyFilter === 'ALL' || w.currency === currencyFilter;

    return matchesSearch && matchesCountry && matchesCurrency;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
    if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
    if (sortBy === 'documents') {
      const aDocs = documents.filter(d => d.workspaceId === a.id).length;
      const bDocs = documents.filter(d => d.workspaceId === b.id).length;
      return bDocs - aDocs;
    }
    return 0;
  });

  const activeWorkspacesForAggregate = selectedWorkspaceIds.length > 0
    ? workspaces.filter(w => selectedWorkspaceIds.includes(w.id))
    : filteredWorkspaces;

  const aggregateDocs = documents.filter(d => activeWorkspacesForAggregate.some(w => w.id === d.workspaceId));

  const toggleSelectWorkspace = (id: string) => {
    setSelectedWorkspaceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllWorkspaces = () => {
    if (selectedWorkspaceIds.length === filteredWorkspaces.length) {
      setSelectedWorkspaceIds([]);
    } else {
      setSelectedWorkspaceIds(filteredWorkspaces.map(w => w.id));
    }
  };

  return (
    <div className="space-y-6 pb-20 text-slate-800 font-sans">
      {/* VIEW MODE TOGGLE HEADER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
          >
            <span>← Back to Dashboard</span>
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-black text-slate-900">Companies Management Console</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'list'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Companies Table View</span>
          </button>
          <button
            onClick={() => setViewMode('detail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'detail'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{currentWs.name} Profile</span>
          </button>
        </div>
      </div>

      {/* ----------------- VIEW MODE 1: MASTER COMPANIES TABLE OVERVIEW ----------------- */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search companies by name, code, or country..."
                value={listSearchTerm}
                onChange={(e) => setListSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-bold text-[11px]">Country:</span>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Countries ({allCountries.length})</option>
                  {allCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-bold text-[11px]">Currency:</span>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Currencies ({allCurrencies.length})</option>
                  {allCurrencies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-bold text-[11px]">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="name">Company Name</option>
                  <option value="code">Entity Code</option>
                  <option value="country">Country</option>
                  <option value="documents">Documents Count</option>
                </select>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Company</span>
              </button>
            </div>
          </div>

          {/* MASTER COMPANIES TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Corporate Companies Directory</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Showing {filteredWorkspaces.length} of {workspaces.length} companies ({selectedWorkspaceIds.length} selected)
                </p>
              </div>

              {selectedWorkspaceIds.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-blue-600">{selectedWorkspaceIds.length} companies selected</span>
                  <button
                    onClick={() => setSelectedWorkspaceIds([])}
                    className="text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedWorkspaceIds.length === filteredWorkspaces.length && filteredWorkspaces.length > 0}
                        onChange={toggleSelectAllWorkspaces}
                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Company Name & Code</th>
                    <th className="p-3">Country / Currency</th>
                    <th className="p-3 text-center">In-Vault Documents</th>
                    <th className="p-3 text-center">Reporting Status</th>
                    <th className="p-3 text-center">AI Health & Readiness</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredWorkspaces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No companies match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkspaces.map((ws) => {
                      const wsDocs = documents.filter(d => d.workspaceId === ws.id);
                      const isSelected = selectedWorkspaceIds.includes(ws.id);
                      const isCurrentActive = ws.id === currentWs.id;

                      return (
                        <tr
                          key={ws.id}
                          className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectWorkspace(ws.id)}
                              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                                {ws.name.substring(0, 1)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-extrabold text-slate-900 text-sm hover:text-blue-600 cursor-pointer" onClick={() => { setSelectedCompanyId(ws.id); setViewMode('detail'); }}>
                                    {ws.name}
                                  </span>
                                  {isCurrentActive && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded-md">
                                      Active Profile
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 block">
                                  Code: {ws.code || 'ACTIVE-01'} • ID: {ws.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block">{ws.country || 'Global'}</span>
                              <span className="font-mono text-[10px] text-slate-500 font-bold block">
                                Currency: {ws.currency || 'USD'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>{wsDocs.length} Docs</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              wsDocs.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {wsDocs.length > 0 ? '● Document Facts Ingested' : '○ Awaiting Data Upload'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center space-y-0.5">
                              <span className="font-mono font-black text-slate-900">
                                {wsDocs.length > 0 ? '95%' : '0%'} Readiness
                              </span>
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: wsDocs.length > 0 ? '95%' : '0%' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCompanyId(ws.id);
                                setViewMode('detail');
                              }}
                              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                            >
                              View Profile →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC AGGREGATED BREAKDOWN BELOW TABLE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Consolidated Metrics for Selected Companies</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Reflecting data across {activeWorkspacesForAggregate.length} selected entity workspaces.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">
                  {aggregateDocs.length} Total Ingested Documents
                </span>
              </div>
            </div>

            {/* Aggregated KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Active Entities</span>
                <span className="text-lg font-black font-mono text-slate-900">{activeWorkspacesForAggregate.length} Companies</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Total Vault Documents</span>
                <span className="text-lg font-black font-mono text-blue-600">{aggregateDocs.length} Documents</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Avg Audit Readiness</span>
                <span className="text-lg font-black font-mono text-emerald-600">
                  {activeWorkspacesForAggregate.some(w => documents.some(d => d.workspaceId === w.id)) ? '95%' : '0%'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Audit Verification</span>
                <span className="text-lg font-black font-mono text-purple-600">100% Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW MODE 2: SINGLE COMPANY PROFILE DETAIL ----------------- */}
      {viewMode === 'detail' && (
        <div className="space-y-6">
          {/* Master Company Header Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Row 1: Back Button & Client Entity Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
                >
                  <span>← Back to Companies Table Overview</span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500 font-semibold">Master Client CRM Profile</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-bold">Client Entity:</span>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.code || 'ACTIVE'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

        {/* Row 2: Company Header Branding & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md border border-blue-950">
              {companyDetails.name.substring(0, 1)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{companyDetails.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● {companyDetails.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {companyDetails.listing}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{companyDetails.industry}</span>
                <span>•</span>
                <span>HQ: {companyDetails.hq}</span>
                <span>•</span>
                <span>Fiscal Year: {companyDetails.fiscalYearEnd}</span>
                <span>•</span>
                <span className="font-mono text-slate-700 font-bold">Standard: {companyDetails.accountingStandard}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEditCompanyModal(true)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Company</span>
            </button>

            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Create Project</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Docs</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <FileBarChart className="w-3.5 h-3.5 text-purple-600" />
              <span>Generate Report</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Company</span>
            </button>
          </div>
        </div>

        {/* Row 3: Master Health & Risk Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Financial Health</span>
              <span className="text-xs font-bold font-mono text-slate-600">{companyDetails.healthScore}</span>
            </div>
            <Award className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Risk Profile</span>
              <span className="text-xs font-bold font-mono text-blue-600">{companyDetails.riskScore}</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Audit Readiness</span>
              <span className="text-xs font-bold font-mono text-slate-900">{companyDetails.auditReadiness}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Processed Documents</span>
              <span className="text-xs font-bold font-mono text-slate-900">{companyDetails.dataCompleteness}</span>
            </div>
            <Database className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* ----------------- NAVIGATION TABS BAR (12 SPEC TABS) ----------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 text-xs font-bold text-slate-600 min-w-max">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'projects', label: 'Projects' },
            { key: 'financials', label: 'Financials' },
            { key: 'documents', label: 'Documents' },
            { key: 'findings', label: 'Audit & Findings' },
            { key: 'reports', label: 'Reports' },
            { key: 'insights', label: 'AI Insights' },
            { key: 'subsidiaries', label: 'Subsidiaries' },
            { key: 'contacts', label: 'Contacts' },
            { key: 'activity', label: 'Activity' },
            { key: 'geographic', label: 'Geographic & ESG' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-extrabold whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------- TAB 1: OVERVIEW DASHBOARD ----------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Grid (16 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {[
              { label: 'Annual Revenue', val: companyDetails.annualRevenue, sub: '↑ 3.8% YoY' },
              { label: 'Net Income', val: companyDetails.netIncome, sub: '↑ 10.2% YoY' },
              { label: 'Total Assets', val: companyDetails.totalAssets, sub: 'Reconciled' },
              { label: 'Total Liabilities', val: companyDetails.totalLiabilities, sub: 'Debts tracked' },
              { label: 'Equity', val: companyDetails.equity, sub: '€28.6B Net' },
              { label: 'Cash Balance', val: companyDetails.cashBalance, sub: 'High Liquidity' },
              { label: 'Market Cap', val: companyDetails.marketCap, sub: 'Publicly Traded' },
              { label: 'Enterprise Val', val: companyDetails.enterpriseValue, sub: 'EV/EBITDA 3.9x' },
              { label: 'Employees', val: companyDetails.employees, sub: '12 Markets' },
              { label: 'Countries', val: companyDetails.operatingCountries, sub: 'Europe & LatAm' },
              { label: 'Open Projects', val: '2 Active', sub: 'Audits & Tax' },
              { label: 'Completed Proj', val: '12 Closed', sub: 'Historical' },
              { label: 'Open Findings', val: '3 Open', sub: 'Low Severity' },
              { label: 'Documents', val: `${companyDocs.length + 18} Vault`, sub: '100% OCR' },
              { label: 'AI Health', val: '92 / 100', sub: 'Excellent' },
              { label: 'Audit Readiness', val: '94%', sub: 'Target Met' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase truncate block">{kpi.label}</span>
                <div className="text-sm font-black font-mono text-slate-900 truncate">{kpi.val}</div>
                <div className="text-[9px] font-bold text-emerald-600 truncate">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Row 2: Company Snapshot & Financial 5-Year Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Snapshot Block (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Company Profile & Master Snapshot</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Tax ID: {companyDetails.taxId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Legal Name</span>
                  <span className="font-bold text-slate-800">{companyDetails.legalName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Registration #</span>
                  <span className="font-bold text-slate-800">{companyDetails.regNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Date Incorporated</span>
                  <span className="font-bold text-slate-800">{companyDetails.dateIncorporated}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Website</span>
                  <a href={companyDetails.website} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline">
                    telefonica.com
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Auditor</span>
                  <span className="font-bold text-slate-800">{companyDetails.auditor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Legal Counsel</span>
                  <span className="font-bold text-slate-800">{companyDetails.legalCounsel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Banking Partners</span>
                  <span className="font-bold text-slate-800 truncate block">{companyDetails.bankingPartners}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Ownership</span>
                  <span className="font-bold text-slate-800">{companyDetails.ownership}</span>
                </div>
              </div>
            </div>

            {/* 5-Year Trend Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">5-Year Financial Trend (€ Billions)</h3>
                  <p className="text-[10px] text-slate-500">Revenue, Net Income, and EBITDA trajectory.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Audited Figures</span>
              </div>

              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fiveYearTrendData}>
                    <defs>
                      <linearGradient id="compRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="compNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Revenue" stroke="#1e3a8a" fill="url(#compRev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="EBITDA" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="NetIncome" stroke="#10b981" fill="url(#compNet)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Business Segments Donut & Tabbed Key Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Business Segments Donut Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  <span>Business Segments Breakdown</span>
                </h3>
                <button onClick={() => setActiveTab('financials')} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
                  View details →
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-36 h-36 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={businessSegmentsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {businessSegmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
                    <span className="text-xs font-black text-slate-900">$5.42B</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs flex-1">
                  {businessSegmentsData.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                        <span className="font-semibold text-slate-700 truncate">{seg.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{seg.rev} ({seg.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible Key Details Accordions */}
            <div className="lg:col-span-7 space-y-3">
              {[
                {
                  key: 'key_info',
                  label: 'Key Information',
                  icon: <Info className="w-4 h-4 text-blue-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Legal Name</span>
                        <span className="font-bold text-slate-900">{companyDetails.legalName}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Incorporation Date</span>
                        <span className="font-bold text-slate-900">{companyDetails.dateIncorporated || 'May 15, 2008'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Status</span>
                        <span className="font-extrabold text-emerald-600">{companyDetails.status}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Stock Exchange</span>
                        <span className="font-bold text-slate-900">NASDAQ (GLTEC)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Fiscal Year End</span>
                        <span className="font-bold text-slate-900">{companyDetails.fiscalYearEnd}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Auditor</span>
                        <span className="font-bold text-slate-900">{companyDetails.auditor}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'financial_highlights',
                  label: 'Financial Highlights',
                  icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Annual Revenue</span>
                        <span className="font-mono font-black text-slate-900">{companyDetails.annualRevenue}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Net Margin</span>
                        <span className="font-mono font-bold text-emerald-600">13.7%</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">EBITDA Margin</span>
                        <span className="font-mono font-bold text-blue-600">32.0%</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Cash Reserves</span>
                        <span className="font-mono font-black text-slate-900">{companyDetails.cashBalance}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Total Debt</span>
                        <span className="font-mono font-bold text-slate-900">{companyDetails.totalLiabilities}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Free Cash Flow</span>
                        <span className="font-mono font-bold text-emerald-600">$1.45B</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'credit_ratings',
                  label: 'Credit & Ratings',
                  icon: <Award className="w-4 h-4 text-amber-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">S&P Rating</span>
                        <span className="font-mono font-black text-blue-900">A- (Stable)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Moody's Rating</span>
                        <span className="font-mono font-black text-blue-900">A3 (Stable)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Fitch Rating</span>
                        <span className="font-mono font-black text-blue-900">A- (Investment Grade)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Commercial Credit Score</span>
                        <span className="font-mono font-bold text-emerald-600">820 / 850</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Insolvency Risk Score</span>
                        <span className="font-mono font-bold text-emerald-600">Low Risk (0.2%)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Payment Index</span>
                        <span className="font-mono font-bold text-slate-900">98 / 100 (Prompt)</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'banking_facilities',
                  label: 'Banking & Facilities',
                  icon: <Building className="w-4 h-4 text-indigo-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Primary Banking Partners</span>
                        <span className="font-bold text-slate-900">JPMorgan, Citi, HSBC</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Revolving Credit Facility</span>
                        <span className="font-mono font-bold text-slate-900">$500M ($120M Drawn)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Syndicated Term Loans</span>
                        <span className="font-mono font-bold text-slate-900">$1.20B (Maturity 2028)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Interest Coverage</span>
                        <span className="font-mono font-bold text-emerald-600">14.2x EBITDA</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Cash Pooling</span>
                        <span className="font-bold text-slate-900">Global Multi-Currency Pool</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Collateral Status</span>
                        <span className="font-bold text-emerald-600">Unsecured Facilities</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'legal_compliance',
                  label: 'Legal & Compliance',
                  icon: <Scale className="w-4 h-4 text-purple-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Material Litigation</span>
                        <span className="font-extrabold text-emerald-600">0 Material Cases</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">SOX Compliance</span>
                        <span className="font-bold text-emerald-600">Fully Compliant (404b)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Tax Filings</span>
                        <span className="font-bold text-slate-900">Current across all entities</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Patents & IP Portfolio</span>
                        <span className="font-mono font-bold text-slate-900">142 Registered Patents</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Data Security Standard</span>
                        <span className="font-bold text-slate-900">ISO 27001 / SOC 2 Type II</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Regulatory Filings</span>
                        <span className="font-bold text-emerald-600">10-K & 10-Q On-time</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'esg_overview',
                  label: 'ESG Overview',
                  icon: <Leaf className="w-4 h-4 text-green-600" />,
                  content: (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">ESG Rating (MSCI)</span>
                        <span className="font-mono font-black text-emerald-600">AA (Leader)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Environmental Score</span>
                        <span className="font-mono font-bold text-slate-900">84 / 100</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Social Score</span>
                        <span className="font-mono font-bold text-slate-900">88 / 100</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Governance Score</span>
                        <span className="font-mono font-bold text-slate-900">92 / 100</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Net-Zero Carbon Goal</span>
                        <span className="font-bold text-emerald-600">2030 Verified Plan</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Board Gender Diversity</span>
                        <span className="font-mono font-bold text-slate-900">45% Female</span>
                      </div>
                    </div>
                  )
                }
              ].map((section) => {
                const isOpen = openSections[section.key];
                return (
                  <div key={section.key} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs transition hover:border-blue-400 hover:shadow-xs">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full flex items-center justify-between p-4 font-extrabold text-slate-800 text-sm hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {section.icon}
                        <span>{section.label}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && section.content}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Executive Summary Block */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Eve AI Corporate Summary & Recommendation</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
              <strong>Business Overview:</strong> {currentWs.name} maintains a dominant market share in European and LatAm telecommunications with strong EBITDA margins (32%).
              <br />
              <strong>Financial Health & Audit Assessment:</strong> Solvency and coverage ratios remain strong with €6.85B in available cash reserves. Audit readiness across FY 2023 financial statements is rated at 94% with zero unaddressed material risks. Transfer pricing documentation across international subsidiaries is fully compliant with OECD guidelines.
            </p>
          </div>

          {/* Row 4: Geographic Presence & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Geographic Regional Breakdown (6 Cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Geographic Revenue & Presence</span>
                </h3>
                <button onClick={() => setActiveTab('geographic')} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
                  View full geographic breakdown →
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                {geographicRegions.map((reg, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{reg.region}</span>
                      <span className="font-mono text-slate-900">{reg.rev} ({reg.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${reg.color} h-full rounded-full transition-all duration-500`} style={{ width: `${reg.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Corporate Activity (6 Cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Recent Document & Extraction Activity</span>
                </h3>
                <button onClick={() => setActiveTab('activity')} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
                  View all activity →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { text: 'Income Statement FY 2023.pdf extracted & verified', time: '2 mins ago', icon: FileText, color: 'text-blue-600' },
                  { text: 'Audit finding #42 marked as resolved by Auditor', time: '15 mins ago', icon: CheckCircle2, color: 'text-emerald-600' },
                  { text: 'Transfer Pricing risk flag generated for review', time: '32 mins ago', icon: AlertTriangle, color: 'text-amber-600' },
                  { text: 'Bank Reconciliation May 2024 processed by Eve AI', time: '1 hour ago', icon: Sparkles, color: 'text-purple-600' },
                ].map((act, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <act.icon className={`w-3.5 h-3.5 ${act.color} shrink-0`} />
                      <span className="font-semibold text-slate-800">{act.text}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Quick Nav Module Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('documents')}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 uppercase">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Documents Vault</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="text-xl font-black font-mono text-slate-900">{companyDocs.length + 18}</span>
                <span className="text-[10px] text-emerald-600 font-bold">100% OCR Processed</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-100 text-center">
                <div>In Review: 12</div>
                <div>Processed: 24</div>
                <div>Pending: 2</div>
                <div>Issues: 0</div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('findings')}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Audit & Findings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="text-xl font-black font-mono text-slate-900">18 Findings</span>
                <span className="text-[10px] text-amber-600 font-bold">3 Open Action Items</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-100 text-center">
                <div>High: 1</div>
                <div>Medium: 2</div>
                <div>Low: 15</div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('reports')}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 uppercase">
                  <FileBarChart className="w-4 h-4 text-purple-600" />
                  <span>Board Packages & Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="text-xl font-black font-mono text-slate-900">24 Reports</span>
                <span className="text-[10px] text-purple-600 font-bold">4 Published Packages</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-100 text-center">
                <div>Draft: 8</div>
                <div>Final: 12</div>
                <div>Published: 4</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: PROJECTS TAB ----------------- */}
      {activeTab === 'projects' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Client Engagements & Projects ({companyProjects.length})</h3>
              <p className="text-xs text-slate-500">Every audit, review, tax, and advisory engagement under this client master record.</p>
            </div>

            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Partner & Manager</th>
                  <th className="py-2.5 px-3">Completion</th>
                  <th className="py-2.5 px-3">Budget</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {companyProjects.map((proj) => (
                  <tr key={proj.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{proj.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {proj.startDate} – {proj.endDate}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{proj.type}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-bold text-slate-800">{proj.partner}</div>
                      <div className="text-[10px] text-slate-400">{proj.manager}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <div className="flex items-center space-x-2">
                        <span>{proj.completion}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${proj.completion}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{proj.budget}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          proj.risk === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proj.risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('overview')}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition cursor-pointer"
                      >
                        Open Project
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: FINANCIALS TAB ----------------- */}
      {activeTab === 'financials' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Historical Financial Statements & Ratio Analysis</h3>
              <p className="text-xs text-slate-500">Audited Income Statement, Balance Sheet, Cash Flow & Ratio Analysis.</p>
            </div>
            <button
              onClick={() => onNavigate('financial')}
              className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition cursor-pointer"
            >
              Open Interactive Financial Workspace →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
            {[
              { label: 'Current Ratio', val: '1.82x', status: 'Healthy Liquidity' },
              { label: 'Debt to Equity', val: '0.68x', status: 'Controlled Leverage' },
              { label: 'ROA (Return on Assets)', val: '6.7%', status: 'Above Industry Avg' },
              { label: 'ROE (Return on Equity)', val: '12.4%', status: 'Strong Return' },
            ].map((r, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{r.label}</span>
                <div className="text-lg font-black font-mono text-slate-900">{r.val}</div>
                <div className="text-[10px] text-emerald-600 font-bold">{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: DOCUMENTS MASTER VAULT ----------------- */}
      {activeTab === 'documents' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Permanent Document Vault</h3>
              <p className="text-xs text-slate-500">Every document ever uploaded across all engagements.</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">OCR Confidence</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Annual Report & Consolidated Statements FY 2023.pdf', type: 'Annual Report', period: 'FY 2023', conf: '99.8%', status: 'Processed' },
                  { name: 'Trial Balance & General Ledger - Q1 2024.xlsx', type: 'General Ledger', period: 'Q1 2024', conf: '100%', status: 'Processed' },
                  { name: 'Bank Reconciliations & Confirmations May 2024.pdf', type: 'Bank Statement', period: 'May 2024', conf: '98.5%', status: 'Processed' },
                  { name: 'Transfer Pricing Master File & Local File 2023.pdf', type: 'Tax Return', period: 'FY 2023', conf: '97.2%', status: 'Processed' },
                ].map((doc, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition font-medium">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{doc.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{doc.type}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{doc.period}</td>
                    <td className="py-3 px-3 text-emerald-600 font-mono font-bold">{doc.conf}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: AUDIT & FINDINGS ----------------- */}
      {activeTab === 'findings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Audit Findings & Risk Register</h3>
              <p className="text-xs text-slate-500">Consolidated findings across every active and historical project.</p>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition cursor-pointer"
            >
              Open Audit Findings Workstation →
            </button>
          </div>

          <div className="space-y-2">
            {[
              { risk: 'High', title: 'Revenue cut-off test – pending confirmation for Q4 international contract', dueDate: 'Jun 12, 2024', status: 'Open' },
              { risk: 'Medium', title: 'Related party transactions – additional disclosure review needed', dueDate: 'Jun 15, 2024', status: 'Open' },
              { risk: 'Low', title: 'Bank reconciliation minor unposted item', dueDate: 'Jun 25, 2024', status: 'Resolved' },
            ].map((f, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${f.risk === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {f.risk} Risk
                  </span>
                  <span className="font-bold text-slate-800">{f.title}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 font-mono">Due {f.dueDate}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: REPORTS ----------------- */}
      {activeTab === 'reports' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Reports & Board Packages</h3>
              <p className="text-xs text-slate-500">Download and generate board reports, management letters, and tax disclosures.</p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition cursor-pointer"
            >
              + Generate Custom Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'Executive Board Package FY 2023', fmt: 'PDF / PPTX', date: 'May 20, 2024' },
              { title: 'Management Letter & Internal Control Audit', fmt: 'PDF / Word', date: 'Apr 12, 2024' },
              { title: 'Tax & Transfer Pricing Compliance Report', fmt: 'XBRL / PDF', date: 'Mar 30, 2024' },
            ].map((rep, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <FileBarChart className="w-5 h-5 text-purple-600" />
                <div className="font-bold text-xs text-slate-900">{rep.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">Format: {rep.fmt} • Generated {rep.date}</div>
                <button className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg cursor-pointer">
                  Download Package
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 7: AI INSIGHTS & CHAT ----------------- */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Corporate Intelligence & Forecasts</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900">Revenue & EBITDA Margin Outlook</span>
                <p className="text-slate-600 leading-relaxed">
                  Revenue is projected to reach €41.8B in FY 2024 (+2.8% YoY growth), driven by digital transformation services in Telefónica Tech and strong LatAm mobile subscriber growth.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900">Cash Flow & Liquidity Coverage</span>
                <p className="text-slate-600 leading-relaxed">
                  Free Cash Flow generation remains strong at €1.45B. Liquid cash reserves (€6.85B) fully cover debt maturities through Q3 2026.
                </p>
              </div>
            </div>
          </div>

          {/* AI Interactive Chat */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col h-[380px]">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Ask Eve AI Client Assistant</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs scrollbar-none">
              {aiChatHistory.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      m.sender === 'user' ? 'bg-blue-900 text-white' : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendAiChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about financials, ratios, or audit risks..."
                value={aiChatMessage}
                onChange={(e) => setAiChatMessage(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="px-3 py-2 bg-blue-900 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-950">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- TAB 8: SUBSIDIARIES ----------------- */}
      {activeTab === 'subsidiaries' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Corporate Subsidiaries & Group Structure</h3>
              <p className="text-xs text-slate-500">Legal corporate tree, ownership percentages, and consolidation status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subsidiariesList.map((sub, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xs text-slate-900">{sub.name}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded-full">{sub.ownership}</span>
                </div>
                <div className="text-[11px] text-slate-500">Country: {sub.country} • Revenue: {sub.rev}</div>
                <div className="text-[10px] font-bold text-slate-700 bg-white p-1.5 rounded border border-slate-200">{sub.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 9: CONTACTS ----------------- */}
      {activeTab === 'contacts' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Key Client Contacts & Management</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientContacts.map((c, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="font-extrabold text-slate-900">{c.name}</div>
                <div className="text-slate-500 font-semibold">{c.title}</div>
                <div className="flex items-center space-x-2 text-blue-600 font-mono text-[11px] pt-1 border-t border-slate-200">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{c.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 10: ACTIVITY ----------------- */}
      {activeTab === 'activity' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Permanent Audit Activity Log</h3>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{log.text}</div>
                  <div className="text-[10px] text-slate-400">{log.user}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 11: GEOGRAPHIC & ESG ----------------- */}
      {activeTab === 'geographic' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Geographic Intelligence & ESG Compliance</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div className="font-bold text-slate-900">Geographic Regions</div>
              <p className="text-slate-600">Operating across Spain, Germany, UK, Brazil, and 8 LatAm markets.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <div className="font-bold text-slate-900">ESG & Sustainability Rating</div>
              <p className="text-slate-600">Carbon Neutrality Target 2030 (Scope 1 & 2). ESG Score: 88 / 100.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Scale className="w-5 h-5 text-purple-600" />
              <div className="font-bold text-slate-900">Global Tax & Regulatory Compliance</div>
              <p className="text-slate-600">SOX & EU CSRD Compliant. 100% Tax Filings Submitted.</p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 12: SETTINGS ----------------- */}
      {activeTab === 'settings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Company Master Settings</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Display Name</label>
              <input type="text" defaultValue={companyDetails.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Accounting Standard</label>
              <select defaultValue="IFRS / EU GAAP" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold">
                <option value="IFRS / EU GAAP">IFRS / EU GAAP</option>
                <option value="US GAAP">US GAAP</option>
                <option value="Local GAAP">Local GAAP</option>
              </select>
            </div>

            <button className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-blue-950">
              Save Company Settings
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ----------------- MODALS ----------------- */}
      {/* Edit Company Modal */}
      {showEditCompanyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Edit Company Master Profile</h3>
              <button onClick={() => setShowEditCompanyModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input type="text" defaultValue={companyDetails.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Industry</label>
                <input type="text" defaultValue={companyDetails.industry} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowEditCompanyModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => setShowEditCompanyModal(false)} className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Create New Project Engagement</h3>
              <button onClick={() => setShowCreateProjectModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Title</label>
                <input type="text" placeholder="e.g. FY 2024 Interim Audit" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Engagement Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold">
                  <option>Annual Audit</option>
                  <option>Quarterly Review</option>
                  <option>Tax Project</option>
                  <option>Due Diligence</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowCreateProjectModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => setShowCreateProjectModal(false)} className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950">
                Create Engagement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Upload Master Company Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 bg-slate-50">
              <FolderOpen className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Drag & Drop Financial Statements, Tax Returns, or Bank Statements here</p>
              <p className="text-[10px] text-slate-400">PDF, XLSX, CSV, DOCX up to 100MB</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Generate Client Report Package</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Report Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold">
                  <option>Executive Board Package</option>
                  <option>Management Letter & Internal Control Audit</option>
                  <option>Financial Summary & Ratios</option>
                  <option>Tax & Transfer Pricing Report</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Export Format</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold">
                  <option>PDF Document</option>
                  <option>Excel Workbook (.xlsx)</option>
                  <option>PowerPoint Presentation (.pptx)</option>
                  <option>XBRL / JSON</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700">
                Generate & Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Company Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Export Company Master File</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Exporting master client file for <strong>{companyDetails.name}</strong> including all 5-year financials, document indexes, audit findings, subsidiary structures, and report archives.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950">
                Confirm Export (.zip)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
