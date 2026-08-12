import React, { useState, useMemo, useEffect } from 'react';
import { Workspace, DocumentRecord, ExtractedFact, FinancialSummary } from '../types';
import {
  Sparkles, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Clock, Search,
  Filter, Download, Plus, ChevronDown, X, FileText, Check, HelpCircle, Bell, Play,
  RefreshCw, UserCheck, ChevronRight, ArrowRight, Upload, FolderKanban, Building2,
  ExternalLink, MoreHorizontal, Layers, Activity, FileSpreadsheet, CheckSquare,
  Layers3, Eye, FileCheck, Sliders, MessageSquare, Send, Paperclip, Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

interface AuditFindingsViewProps {
  facts?: ExtractedFact[];
  documents?: DocumentRecord[];
  summary?: FinancialSummary | null;
  workspaces?: Workspace[];
  activeWorkspace?: Workspace | null;
  onUpdateStatus?: (factId: string, status: any) => void;
  onNavigate?: (view: string) => void;
}

export interface HermesFinding {
  id: string;
  workspaceId?: string;
  companyName: string;
  title: string;
  category: 'Revenue' | 'Inventory' | 'AP' | 'Journal Entries' | 'Cash' | 'Tax' | 'Compliance' | 'Fixed Assets';
  risk: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  finAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  auditAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  riskAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  consensusScore: number;
  confidenceScore: number;
  materiality: number;
  status: 'Auto Resolved' | 'Needs Review' | 'Escalated' | 'Waiting Evidence';
  nextAction: string;
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  period: string;
  createdDate: string;
  finAgentOpinion: string;
  finAgentConfidence: number;
  auditAgentOpinion: string;
  auditAgentConfidence: number;
  riskAgentOpinion: string;
  riskAgentConfidence: number;
  aiRecommendation: string;
  relatedDocsCount: number;
  relatedJeCount: number;
  relatedAccountsCount: number;
  relatedTasksCount: number;
}

export const AuditFindingsView: React.FC<AuditFindingsViewProps> = ({
  facts = [],
  documents = [],
  summary = null,
  workspaces = [],
  activeWorkspace = null,
  onUpdateStatus,
  onNavigate,
}) => {
  // Selectors State
  const activeWsName = activeWorkspace ? activeWorkspace.name : (workspaces[0]?.name || 'Technofina');
  const [selectedCompany, setSelectedCompany] = useState<string>(activeWsName);
  const [selectedProject, setSelectedProject] = useState<string>('FY2026 Audit');

  // Keep selectedCompany in sync if activeWorkspace changes initially
  useEffect(() => {
    if (activeWorkspace) {
      setSelectedCompany(activeWorkspace.name);
    } else if (workspaces.length > 0) {
      setSelectedCompany(workspaces[0].name);
    }
  }, [activeWorkspace, workspaces]);

  // Findings List fetched from backend or local fallback
  const [findingsList, setFindingsList] = useState<HermesFinding[]>([]);
  const [isLoadingFindings, setIsLoadingFindings] = useState<boolean>(true);

  // Fetch Findings from backend on load or when company changes
  const fetchFindings = async () => {
    setIsLoadingFindings(true);
    try {
      const res = await fetch(`/api/findings?companyName=${encodeURIComponent(selectedCompany)}`);
      if (res.ok) {
        const data = await res.json();
        setFindingsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch findings:", err);
    } finally {
      setIsLoadingFindings(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [selectedCompany]);

  // Filters State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All Status');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All Risk Levels');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All Categories');
  const [selectedReviewerFilter, setSelectedReviewerFilter] = useState<string>('All Reviewers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Finding for Side Inspector Panel
  const [selectedFindingId, setSelectedFindingId] = useState<string>('');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'debate' | 'evidence' | 'tasks' | 'history'>('overview');

  // Popover dialogs for Help and Notifications
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modals
  const [isCreateFindingOpen, setIsCreateFindingOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isRequestEvidenceOpen, setIsRequestEvidenceOpen] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);

  // New Finding Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Revenue' | 'Inventory' | 'AP' | 'Journal Entries' | 'Cash' | 'Tax' | 'Compliance' | 'Fixed Assets'>('Revenue');
  const [newRisk, setNewRisk] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newMateriality, setNewMateriality] = useState('1850000000');

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Michael Brown');

  // Multi-select table checkboxes
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filtered dataset based on header & search controls
  const companyFindings = useMemo(() => {
    return findingsList.filter(f => {
      if (!selectedCompany) return true;
      const fComp = (f.companyName || '').toLowerCase();
      const sComp = selectedCompany.toLowerCase();
      return fComp === sComp || (fComp.includes('technofina') && sComp.includes('technofina'));
    });
  }, [findingsList, selectedCompany]);

  const filteredFindings = useMemo(() => {
    return companyFindings.filter(f => {
      if (selectedStatusFilter !== 'All Status' && f.status !== selectedStatusFilter) return false;
      if (selectedRiskFilter !== 'All Risk Levels' && f.risk !== selectedRiskFilter) return false;
      if (selectedCategoryFilter !== 'All Categories' && f.category !== selectedCategoryFilter) return false;
      if (selectedReviewerFilter !== 'All Reviewers' && f.assignee !== selectedReviewerFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.id.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.companyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companyFindings, selectedStatusFilter, selectedRiskFilter, selectedCategoryFilter, selectedReviewerFilter, searchQuery]);

  // Paginated rows
  const paginatedFindings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / pageSize));

  // Auto-select first finding if selected finding is not in list
  useEffect(() => {
    if (filteredFindings.length > 0) {
      if (!selectedFindingId || !filteredFindings.some(f => f.id === selectedFindingId)) {
        setSelectedFindingId(filteredFindings[0].id);
      }
    }
  }, [filteredFindings, selectedFindingId]);

  // Selected finding object
  const activeFinding = useMemo(() => {
    return companyFindings.find(f => f.id === selectedFindingId) || companyFindings[0] || null;
  }, [companyFindings, selectedFindingId]);

  // Dynamic Executive KPI Counts calculated strictly from company findings
  const totalFindingsCount = companyFindings.length;
  const autoResolvedCount = companyFindings.filter(f => f.status === 'Auto Resolved').length;
  const needsReviewCount = companyFindings.filter(f => f.status === 'Needs Review').length;
  const escalatedCount = companyFindings.filter(f => f.status === 'Escalated').length;
  const waitingEvidenceCount = companyFindings.filter(f => f.status === 'Waiting Evidence').length;
  
  const auditReadiness = totalFindingsCount > 0 ? Math.round((autoResolvedCount / totalFindingsCount) * 100) : 100;

  // Processed documents count for selected company workspace
  const processedDocsCount = useMemo(() => {
    const targetWs = workspaces.find(w => w.name.toLowerCase() === selectedCompany.toLowerCase());
    if (targetWs) {
      return documents.filter(d => d.workspaceId === targetWs.id).length;
    }
    return documents.length > 0 ? documents.length : 6;
  }, [documents, workspaces, selectedCompany]);

  // Potential Exposure total calculation (formatted in €M or €)
  const totalExposureValueFormatted = useMemo(() => {
    const sum = companyFindings.reduce((acc, f) => acc + (f.materiality || 0), 0);
    if (sum >= 1000000) {
      return `€${(sum / 1000000).toFixed(2)}M`;
    } else if (sum > 0) {
      return `€${(sum / 1000).toFixed(0)}K`;
    }
    return `€0.00`;
  }, [companyFindings]);

  // Average Consensus Score
  const avgConsensusScore = useMemo(() => {
    if (companyFindings.length === 0) return 100;
    const total = companyFindings.reduce((acc, f) => acc + f.consensusScore, 0);
    return Math.round(total / companyFindings.length);
  }, [companyFindings]);

  // Recharts Data for Risk Level Donut
  const riskDonutData = useMemo(() => {
    const critical = companyFindings.filter(f => f.risk === 'Critical').length;
    const high = companyFindings.filter(f => f.risk === 'High').length;
    const medium = companyFindings.filter(f => f.risk === 'Medium').length;
    const low = companyFindings.filter(f => f.risk === 'Low').length;
    const info = companyFindings.filter(f => f.risk === 'Informational').length;
    const total = companyFindings.length || 1;

    return [
      { name: 'Critical', value: critical, percentage: `${((critical / total) * 100).toFixed(1)}%`, color: '#ef4444' },
      { name: 'High', value: high, percentage: `${((high / total) * 100).toFixed(1)}%`, color: '#f97316' },
      { name: 'Medium', value: medium, percentage: `${((medium / total) * 100).toFixed(1)}%`, color: '#f59e0b' },
      { name: 'Low', value: low, percentage: `${((low / total) * 100).toFixed(1)}%`, color: '#3b82f6' },
      { name: 'Informational', value: info, percentage: `${((info / total) * 100).toFixed(1)}%`, color: '#14b8a6' }
    ].filter(item => companyFindings.length === 0 || item.value > 0);
  }, [companyFindings]);

  // AI Agent Agreement Matrix counts
  const agentMatrix = useMemo(() => {
    let finAgree = 0, finPartial = 0, finDisagree = 0;
    let auditAgree = 0, auditPartial = 0, auditDisagree = 0;
    let riskAgree = 0, riskPartial = 0, riskDisagree = 0;

    companyFindings.forEach(f => {
      if (f.finAgentStatus === 'Agree') finAgree++;
      else if (f.finAgentStatus === 'Partial') finPartial++;
      else finDisagree++;

      if (f.auditAgentStatus === 'Agree') auditAgree++;
      else if (f.auditAgentStatus === 'Partial') auditPartial++;
      else auditDisagree++;

      if (f.riskAgentStatus === 'Agree') riskAgree++;
      else if (f.riskAgentStatus === 'Partial') riskPartial++;
      else riskDisagree++;
    });

    return {
      fin: { agree: finAgree, partial: finPartial, disagree: finDisagree },
      audit: { agree: auditAgree, partial: auditPartial, disagree: auditDisagree },
      risk: { agree: riskAgree, partial: riskPartial, disagree: riskDisagree }
    };
  }, [companyFindings]);

  // Handlers
  const handleRunAiAudit = async () => {
    setIsAiRunning(true);
    try {
      const targetWs = workspaces.find(w => w.name.toLowerCase() === selectedCompany.toLowerCase());
      const res = await fetch('/api/audit/reorchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: targetWs?.id,
          companyName: selectedCompany
        })
      });
      if (res.ok) {
        await fetchFindings();
      }
    } catch (err) {
      console.error("AI Audit error:", err);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleCreateFindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetWs = workspaces.find(w => w.name.toLowerCase() === selectedCompany.toLowerCase());
    const matVal = parseFloat(newMateriality) || 1850000000;
    const newId = `FND-2026-TEF-00${companyFindings.length + 1}`;

    const newFinding: HermesFinding = {
      id: newId,
      workspaceId: targetWs?.id || 'ws-1786035911767',
      companyName: selectedCompany || 'Technofina',
      title: newTitle,
      category: newCategory,
      risk: newRisk,
      finAgentStatus: 'Agree',
      auditAgentStatus: 'Partial',
      riskAgentStatus: 'Agree',
      consensusScore: 84,
      confidenceScore: 88,
      materiality: matVal,
      status: 'Needs Review',
      nextAction: 'Review workpaper documentation',
      assignee: 'Michael Brown',
      assigneeAvatar: 'MB',
      dueDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      period: '2026-Q2',
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      finAgentOpinion: `Financial scan indicates ${newCategory} item with materiality of €${matVal.toLocaleString()}.`,
      finAgentConfidence: 88,
      auditAgentOpinion: 'Supporting workpapers required for final auditor sign-off.',
      auditAgentConfidence: 82,
      riskAgentOpinion: 'Control risk evaluated as moderate.',
      riskAgentConfidence: 85,
      aiRecommendation: 'Task assigned to audit senior for review.',
      relatedDocsCount: 2,
      relatedJeCount: 4,
      relatedAccountsCount: 2,
      relatedTasksCount: 1
    };

    try {
      const res = await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFinding)
      });
      if (res.ok) {
        await fetchFindings();
        setSelectedFindingId(newId);
        setIsCreateFindingOpen(false);
        setNewTitle('');
      }
    } catch (err) {
      console.error("Failed to create finding:", err);
    }
  };

  const handleUpdateFindingStatus = async (id: string, newStatus: HermesFinding['status']) => {
    try {
      const res = await fetch(`/api/findings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFindingsList(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteFinding = async (id: string) => {
    try {
      const res = await fetch(`/api/findings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFindingsList(prev => prev.filter(f => f.id !== id));
        setSelectedRowIds(prev => prev.filter(rId => rId !== id));
      }
    } catch (err) {
      console.error("Failed to delete finding:", err);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    for (const id of selectedRowIds) {
      await handleUpdateFindingStatus(id, 'Auto Resolved');
    }
    setSelectedRowIds([]);
  };

  const handleBulkEscalate = async () => {
    for (const id of selectedRowIds) {
      await handleUpdateFindingStatus(id, 'Escalated');
    }
    setSelectedRowIds([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedRowIds) {
      await handleDeleteFinding(id);
    }
    setSelectedRowIds([]);
  };

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredFindings.map(f => f.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    const dataToExport = selectedRowIds.length > 0
      ? filteredFindings.filter(f => selectedRowIds.includes(f.id))
      : filteredFindings;

    if (dataToExport.length === 0) {
      alert("No findings available to export.");
      return;
    }

    const headers = ["ID", "Company", "Title", "Category", "Risk", "Consensus Score", "Materiality (EUR)", "Status", "Next Action", "Assignee", "Due Date"];
    const rows = dataToExport.map(f => [
      `"${f.id}"`,
      `"${f.companyName}"`,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${f.category}"`,
      `"${f.risk}"`,
      `"${f.consensusScore}%"`,
      `"${f.materiality}"`,
      `"${f.status}"`,
      `"${f.nextAction.replace(/"/g, '""')}"`,
      `"${f.assignee || ''}"`,
      `"${f.dueDate || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hermes_Audit_Findings_${selectedCompany.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 bg-[#f8fafc] -m-6 p-6 min-h-screen">

      {/* ----------------- TOP HEADER BAR ----------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit & Findings</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-md">
              Technofina Dedicated View
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            AI Decision Center Powered by Hermes Prime Consensus Bureau
          </p>
        </div>

        {/* Header Selectors and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Project Selector */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">
            <span className="text-slate-400 font-medium">Project:</span>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-900"
            >
              <option value="FY2026 Audit">FY2026 Audit</option>
              <option value="Q2 Consolidated Review">Q2 Consolidated Review</option>
              <option value="CNMV Regulatory Audit">CNMV Regulatory Audit</option>
              <option value="SOX Compliance">SOX Compliance</option>
            </select>
          </div>

          {/* Company Selector */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-400 font-medium">Company:</span>
            <select
              value={selectedCompany}
              onChange={e => {
                setSelectedCompany(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none cursor-pointer font-black text-slate-900"
            >
              {workspaces.length > 0 ? (
                workspaces.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))
              ) : (
                <option value="Technofina">Technofina</option>
              )}
            </select>
          </div>

          {/* Help & Notification Badges */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 relative">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              title="Help & Hermes Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {isHelpOpen && (
              <div className="absolute top-10 right-0 w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
                  <span>Hermes Consensus Bureau</span>
                  <button onClick={() => setIsHelpOpen(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Hermes coordinates 3 specialized AI agents (Financial, Audit, Risk) plus a Lead Orchestrator. Findings are derived from uploaded documents for <strong>{selectedCompany}</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 relative transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {needsReviewCount + escalatedCount}
              </span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-10 right-0 w-80 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-50 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <span>Live Audit Alerts</span>
                  <button onClick={() => setIsNotificationsOpen(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-[11px]">
                    <span className="font-bold text-amber-800 block">Needs Review ({needsReviewCount})</span>
                    <span className="text-slate-600">Items require partner sign-off for {selectedCompany}.</span>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-[11px]">
                    <span className="font-bold text-blue-800 block">Re-audit Sync</span>
                    <span className="text-slate-600">Hermes 4-Agent pipeline synced with Q2 financial reports.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Export Findings to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleRunAiAudit}
              disabled={isAiRunning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isAiRunning ? 'animate-spin' : ''}`} />
              <span>{isAiRunning ? 'Orchestrating...' : 'Run AI Audit'}</span>
            </button>

            <button
              onClick={() => setIsCreateFindingOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Finding</span>
            </button>
          </div>

        </div>
      </div>

      {/* ----------------- AI CONSENSUS ENGINE PIPELINE BANNER ----------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            HERMES CONSENSUS ENGINE PIPELINE ({selectedCompany.toUpperCase()})
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            Current Workspace: <span className="text-slate-900">{selectedCompany}</span>
          </span>
        </div>

        <div className="flex items-center justify-between min-w-[980px] gap-2 pt-1">

          {/* Step 1: Documents & Data */}
          <div
            onClick={() => onNavigate && onNavigate('documents')}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center space-x-3 w-44 shrink-0 shadow-2xs cursor-pointer hover:bg-blue-50/50 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Documents</span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">{processedDocsCount}</span>
              <span className="text-[10px] font-bold text-blue-600 hover:underline">View files &rarr;</span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 2: Hermes Prime Orchestrator */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-3 flex items-center space-x-3 w-48 shrink-0 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block">Hermes Prime</span>
              <span className="text-[10px] text-emerald-400 font-bold block">Orchestrator</span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 3: AI Specialist Agents Group */}
          <div className="border border-dashed border-slate-200 rounded-2xl p-2.5 bg-slate-50/50 space-y-1.5 flex-1 min-w-[420px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              AI Specialist Agents <span className="text-slate-400 font-normal">(Independent Analysis)</span>
            </span>

            <div className="grid grid-cols-3 gap-2">

              {/* Financial Analysis AI */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">Financial Analysis AI</span>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-0.5 mt-1">
                  <span>Complete</span>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Audit & Compliance AI */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">Audit & Compliance AI</span>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-0.5 mt-1">
                  <span>Complete</span>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Risk & Controls AI */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">Risk & Controls AI</span>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-0.5 mt-1">
                  <span>Complete</span>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </span>
              </div>

            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 4: Consensus Validation Ring Gauge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center w-36 shrink-0 shadow-2xs flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Consensus Validation</span>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-emerald-200 flex items-center justify-center my-1 bg-white shadow-2xs">
              <span className="text-xs font-black text-slate-900">{avgConsensusScore}%</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500">Consensus Score</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 5: Decision Engine Outcomes */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 w-48 shrink-0 shadow-2xs space-y-1 text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Decision Engine</span>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Auto Resolved</span>
              <span className="text-emerald-600 font-mono">{autoResolvedCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Needs Review</span>
              <span className="text-amber-600 font-mono">{needsReviewCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Escalated</span>
              <span className="text-rose-600 font-mono">{escalatedCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Waiting Evidence</span>
              <span className="text-blue-600 font-mono">{waitingEvidenceCount}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ----------------- 7 SUMMARY KPI CARDS ROW (DYNAMICALLY COMPUTED) ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">

        {/* Card 1: Total Findings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Findings</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalFindingsCount}</div>
            <button onClick={() => setSelectedStatusFilter('All Status')} className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer">
              View all
            </button>
          </div>
        </div>

        {/* Card 2: Auto Resolved */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auto Resolved</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{autoResolvedCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">
                {totalFindingsCount > 0 ? `${((autoResolvedCount / totalFindingsCount) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <button onClick={() => setSelectedStatusFilter('Auto Resolved')} className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer">
              Filter
            </button>
          </div>
        </div>

        {/* Card 3: Needs Human Review */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Needs Review</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{needsReviewCount}</span>
              <span className="text-[11px] font-bold text-amber-600">
                {totalFindingsCount > 0 ? `${((needsReviewCount / totalFindingsCount) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <button onClick={() => setSelectedStatusFilter('Needs Review')} className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer">
              Filter
            </button>
          </div>
        </div>

        {/* Card 4: Escalated */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escalated</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{escalatedCount}</span>
              <span className="text-[11px] font-bold text-rose-600">
                {totalFindingsCount > 0 ? `${((escalatedCount / totalFindingsCount) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <button onClick={() => setSelectedStatusFilter('Escalated')} className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer">
              Filter
            </button>
          </div>
        </div>

        {/* Card 5: Waiting Evidence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waiting Evidence</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{waitingEvidenceCount}</span>
              <span className="text-[11px] font-bold text-blue-600">
                {totalFindingsCount > 0 ? `${((waitingEvidenceCount / totalFindingsCount) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <button onClick={() => setSelectedStatusFilter('Waiting Evidence')} className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer">
              Filter
            </button>
          </div>
        </div>

        {/* Card 6: Audit Readiness */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Readiness</span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{auditReadiness}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${auditReadiness}%` }} />
            </div>
          </div>
        </div>

        {/* Card 7: Potential Exposure */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exposure Value</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 truncate">{totalExposureValueFormatted}</div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              {companyFindings.length} findings
            </span>
          </div>
        </div>

      </div>

      {/* ----------------- MAIN SPLIT CONTENT GRID ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ----------------- LEFT 8 COLS: CONSENSUS QUEUE TABLE ----------------- */}
        <div className="lg:col-span-8 space-y-4">

          {/* Table Container Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">

            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">CONSENSUS QUEUE</h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200">
                    {filteredFindings.length} Findings ({selectedCompany})
                  </span>
                </div>

                <button
                  onClick={fetchFindings}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title="Refresh Findings"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFindings ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">

                {/* Status Dropdown */}
                <div>
                  <select
                    value={selectedStatusFilter}
                    onChange={e => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
                  >
                    <option value="All Status">All Status</option>
                    <option value="Auto Resolved">Auto Resolved</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Waiting Evidence">Waiting Evidence</option>
                  </select>
                </div>

                {/* Risk Level Dropdown */}
                <div>
                  <select
                    value={selectedRiskFilter}
                    onChange={e => { setSelectedRiskFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
                  >
                    <option value="All Risk Levels">All Risk Levels</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Category Dropdown */}
                <div>
                  <select
                    value={selectedCategoryFilter}
                    onChange={e => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Inventory">Inventory</option>
                    <option value="AP">AP</option>
                    <option value="Journal Entries">Journal Entries</option>
                    <option value="Cash">Cash</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                {/* Reviewer Dropdown */}
                <div>
                  <select
                    value={selectedReviewerFilter}
                    onChange={e => { setSelectedReviewerFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
                  >
                    <option value="All Reviewers">All Reviewers</option>
                    <option value="Michael Brown">Michael Brown</option>
                    <option value="Emily Davis">Emily Davis</option>
                    <option value="David Lee">David Lee</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="sm:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              {/* Bulk Action Bar if rows are checked */}
              {selectedRowIds.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>{selectedRowIds.length} item(s) selected</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBulkApprove}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Bulk Approve
                    </button>
                    <button
                      onClick={handleBulkEscalate}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Bulk Escalate
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedRowIds([])}
                      className="text-slate-500 hover:text-slate-800 text-[11px] underline ml-2 cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Table Element */}
            <div className="overflow-x-auto min-h-[280px]">
              {filteredFindings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">No Findings Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No audit findings match your current filters or company context for <strong>{selectedCompany}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAiAudit}
                    disabled={isAiRunning}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Run AI Audit for {selectedCompany}</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          onChange={handleSelectAllRows}
                          checked={selectedRowIds.length === filteredFindings.length && filteredFindings.length > 0}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">ID</th>
                      <th className="p-3">Finding</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Risk</th>
                      <th className="p-3 text-center">
                        <span className="block text-[9px] text-slate-400 font-bold mb-0.5">AI Conclusions</span>
                        <div className="flex items-center justify-center space-x-2">
                          <span title="Financial Analysis AI"><Activity className="w-3 h-3 text-blue-600" /></span>
                          <span title="Audit & Compliance AI"><ShieldCheck className="w-3 h-3 text-purple-600" /></span>
                          <span title="Risk & Controls AI"><AlertTriangle className="w-3 h-3 text-amber-600" /></span>
                        </div>
                      </th>
                      <th className="p-3 text-right">Consensus</th>
                      <th className="p-3 text-right">Confidence</th>
                      <th className="p-3 text-right">Materiality</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assignee</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedFindings.map((f) => {
                      const isSelected = activeFinding && f.id === activeFinding.id;
                      const isChecked = selectedRowIds.includes(f.id);

                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedFindingId(f.id)}
                          className={`transition cursor-pointer group ${
                            isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3" onClick={e => handleToggleRowSelect(f.id, e)}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* ID */}
                          <td className="p-3 font-mono font-bold text-blue-600 shrink-0">
                            {f.id}
                          </td>

                          {/* Finding Title */}
                          <td className="p-3 max-w-[220px]">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
                              {f.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                              {f.companyName}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="p-3 text-slate-600 font-bold text-[11px]">{f.category}</td>

                          {/* Risk Pill */}
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              f.risk === 'Critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              f.risk === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              f.risk === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {f.risk}
                            </span>
                          </td>

                          {/* 3 AI Agent Conclusions Icons */}
                          <td className="p-3">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Fin Agent */}
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                f.finAgentStatus === 'Agree' ? 'bg-emerald-500 text-white' :
                                f.finAgentStatus === 'Partial' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {f.finAgentStatus === 'Agree' ? '✓' : f.finAgentStatus === 'Partial' ? '!' : '✕'}
                              </span>
                              {/* Audit Agent */}
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                f.auditAgentStatus === 'Agree' ? 'bg-emerald-500 text-white' :
                                f.auditAgentStatus === 'Partial' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {f.auditAgentStatus === 'Agree' ? '✓' : f.auditAgentStatus === 'Partial' ? '!' : '✕'}
                              </span>
                              {/* Risk Agent */}
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                f.riskAgentStatus === 'Agree' ? 'bg-emerald-500 text-white' :
                                f.riskAgentStatus === 'Partial' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {f.riskAgentStatus === 'Agree' ? '✓' : f.riskAgentStatus === 'Partial' ? '!' : '✕'}
                              </span>
                            </div>
                          </td>

                          {/* Consensus % */}
                          <td className="p-3 text-right font-bold text-slate-800 font-mono">{f.consensusScore}%</td>

                          {/* Confidence % */}
                          <td className="p-3 text-right font-bold text-slate-500 font-mono">{f.confidenceScore}%</td>

                          {/* Materiality $ */}
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            €{(f.materiality || 0).toLocaleString()}
                          </td>

                          {/* Status Pill */}
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              f.status === 'Auto Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              f.status === 'Needs Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              f.status === 'Escalated' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {f.status}
                            </span>
                          </td>

                          {/* Assignee */}
                          <td className="p-3">
                            {f.assignee ? (
                              <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {f.assigneeAvatar || 'MB'}
                                </div>
                                <span className="text-slate-800 text-[11px] font-bold truncate max-w-[80px]">{f.assignee}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold">—</span>
                            )}
                          </td>

                          {/* Action button */}
                          <td className="p-3 text-slate-400 hover:text-slate-700" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdateFindingStatus(f.id, f.status === 'Auto Resolved' ? 'Needs Review' : 'Auto Resolved')}
                              className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                              title="Toggle Status"
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${f.status === 'Auto Resolved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-slate-50/50">
              <div>
                Showing <span className="font-bold text-slate-800">{filteredFindings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredFindings.length)}</span> of <span className="font-bold text-slate-800">{filteredFindings.length}</span> results
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  &lt;
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  &gt;
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
              </div>
            </div>

          </div>

          {/* ----------------- BOTTOM ROW 4 ANALYTICS CARDS GRID ----------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Card 1: AI Agent Agreement Matrix */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">AI AGENT AGREEMENT MATRIX</h3>

                <div className="mt-3 space-y-2 text-xs">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">
                    <span className="col-span-6">Agent</span>
                    <span className="col-span-2 text-center text-emerald-600">Agree</span>
                    <span className="col-span-2 text-center text-amber-600">Partial</span>
                    <span className="col-span-2 text-center text-rose-600">Disagree</span>
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-12 items-center text-[11px]">
                    <span className="col-span-6 font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Financial AI
                    </span>
                    <span className="col-span-2 text-center font-bold text-emerald-600 font-mono">{agentMatrix.fin.agree}</span>
                    <span className="col-span-2 text-center font-bold text-amber-600 font-mono">{agentMatrix.fin.partial}</span>
                    <span className="col-span-2 text-center font-bold text-rose-600 font-mono">{agentMatrix.fin.disagree}</span>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-12 items-center text-[11px]">
                    <span className="col-span-6 font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Audit AI
                    </span>
                    <span className="col-span-2 text-center font-bold text-emerald-600 font-mono">{agentMatrix.audit.agree}</span>
                    <span className="col-span-2 text-center font-bold text-amber-600 font-mono">{agentMatrix.audit.partial}</span>
                    <span className="col-span-2 text-center font-bold text-rose-600 font-mono">{agentMatrix.audit.disagree}</span>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-12 items-center text-[11px]">
                    <span className="col-span-6 font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Risk AI
                    </span>
                    <span className="col-span-2 text-center font-bold text-emerald-600 font-mono">{agentMatrix.risk.agree}</span>
                    <span className="col-span-2 text-center font-bold text-amber-600 font-mono">{agentMatrix.risk.partial}</span>
                    <span className="col-span-2 text-center font-bold text-rose-600 font-mono">{agentMatrix.risk.disagree}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Overall Agreement</span>
                  <span className="text-emerald-600 font-black">{avgConsensusScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgConsensusScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 2: Findings by Risk Level */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 flex flex-col justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">FINDINGS BY RISK LEVEL</h3>

              <div className="flex items-center gap-2 my-auto">
                {/* Donut Chart */}
                <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDonutData.length > 0 ? riskDonutData : [{ name: 'None', value: 1, color: '#e2e8f0' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={40}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {(riskDonutData.length > 0 ? riskDonutData : [{ name: 'None', value: 1, color: '#e2e8f0' }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-slate-900 leading-none">{totalFindingsCount}</span>
                    <span className="text-[8px] font-bold text-slate-400">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1 text-[10px] flex-1">
                  {riskDonutData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-500">{item.value} ({item.percentage})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Open Tasks Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">OPEN TASKS OVERVIEW</h3>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-bold text-slate-700">Critical / High Priority</span>
                    </div>
                    <span className="font-black text-rose-600 font-mono">
                      {companyFindings.filter(f => f.risk === 'Critical' || f.risk === 'High').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-bold text-slate-700">Medium Priority</span>
                    </div>
                    <span className="font-black text-amber-600 font-mono">
                      {companyFindings.filter(f => f.risk === 'Medium').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-700">Low Priority</span>
                    </div>
                    <span className="font-black text-emerald-600 font-mono">
                      {companyFindings.filter(f => f.risk === 'Low' || f.risk === 'Informational').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-slate-700">Waiting Evidence</span>
                    </div>
                    <span className="font-black text-blue-600 font-mono">{waitingEvidenceCount}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate && onNavigate('workflow')}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-100"
              >
                <span>View workflow tasks</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Card 4: Audit Workflow Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">WORKFLOW PROGRESS</h3>
                </div>

                <div className="flex items-center justify-between text-xs font-bold mt-1.5 mb-1">
                  <span className="text-slate-500 text-[11px]">Audit Progress</span>
                  <span className="text-slate-900 font-black">{auditReadiness}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${auditReadiness}%` }} />
                </div>

                {/* Workflow Checklist */}
                <div className="space-y-1.5 text-[11px] font-bold">
                  <div className="flex items-center space-x-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Documents Uploaded ({processedDocsCount})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Hermes AI Consensus Scan</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${needsReviewCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {needsReviewCount === 0 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                    <span>Human Review ({needsReviewCount} pending)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0" />
                    <span>Manager Sign-off</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ----------------- RIGHT 4 COLS: INSPECTOR SIDE PANEL ----------------- */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden sticky top-6 flex flex-col justify-between min-h-[680px]">

          {activeFinding ? (
            <div>
              {/* Panel Top Header */}
              <div className="p-4 border-b border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900">{activeFinding.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    activeFinding.risk === 'Critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    activeFinding.risk === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {activeFinding.risk} Risk
                  </span>
                </div>

                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {activeFinding.title}
                </h2>

                <div className="text-[11px] text-slate-500 font-medium space-y-0.5">
                  <div>
                    Category: <span className="font-bold text-slate-800">{activeFinding.category}</span> | Entity: <span className="font-bold text-slate-800">{activeFinding.companyName}</span>
                  </div>
                  <div>
                    Period: <span className="font-bold text-slate-800">{activeFinding.period}</span> | Created: <span className="font-bold text-slate-800">{activeFinding.createdDate}</span>
                  </div>
                </div>

                {/* Tabs Bar */}
                <div className="flex items-center space-x-3 pt-2 border-t border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto">
                  <button
                    onClick={() => setActiveInspectorTab('overview')}
                    className={`pb-1 border-b-2 transition cursor-pointer ${
                      activeInspectorTab === 'overview' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('debate')}
                    className={`pb-1 border-b-2 transition cursor-pointer ${
                      activeInspectorTab === 'debate' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    AI Debate
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('evidence')}
                    className={`pb-1 border-b-2 transition cursor-pointer ${
                      activeInspectorTab === 'evidence' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    Evidence
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('tasks')}
                    className={`pb-1 border-b-2 transition cursor-pointer ${
                      activeInspectorTab === 'tasks' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    Tasks ({activeFinding.relatedTasksCount})
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('history')}
                    className={`pb-1 border-b-2 transition cursor-pointer ${
                      activeInspectorTab === 'history' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>

              {/* Panel Tab Content Body */}
              <div className="p-4 space-y-4 text-xs">

                {/* TAB 1: OVERVIEW */}
                {activeInspectorTab === 'overview' && (
                  <>
                    {/* SECTION 1: CONSENSUS SUMMARY */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                      <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">CONSENSUS SUMMARY</h3>

                      <div className="flex items-center justify-between gap-3">
                        {/* Gauge score ring */}
                        <div className="w-20 h-20 rounded-full border-8 border-emerald-500 border-t-emerald-200 flex flex-col items-center justify-center bg-white shadow-2xs shrink-0">
                          <span className="text-base font-black text-slate-900 leading-none">{activeFinding.consensusScore}%</span>
                          <span className="text-[7px] font-bold text-slate-400 mt-0.5">Consensus Score</span>
                        </div>

                        {/* Score breakdown stats */}
                        <div className="flex-1 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Confidence Score</span>
                            <span className="font-black text-slate-900 font-mono">{activeFinding.confidenceScore}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Materiality</span>
                            <span className="font-black text-slate-900 font-mono">€{(activeFinding.materiality || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendation Box */}
                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase block">AI Recommendation</span>
                        <p className="text-slate-700 font-medium leading-normal text-[11px]">
                          {activeFinding.aiRecommendation}
                        </p>
                      </div>
                    </div>

                    {/* SECTION 2: AI AGENT OPINIONS */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">AI AGENT OPINIONS</h3>

                      {/* Agent 1: Financial Analysis AI */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-extrabold text-slate-900 text-xs">Financial Analysis AI</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-md border border-emerald-200">
                            {activeFinding.finAgentStatus}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                          {activeFinding.finAgentOpinion}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 block pt-0.5">
                          Confidence: {activeFinding.finAgentConfidence}%
                        </span>
                      </div>

                      {/* Agent 2: Audit & Compliance AI */}
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-extrabold text-slate-900 text-xs">Audit & Compliance AI</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-md border border-amber-200">
                            {activeFinding.auditAgentStatus}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                          {activeFinding.auditAgentOpinion}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 block pt-0.5">
                          Confidence: {activeFinding.auditAgentConfidence}%
                        </span>
                      </div>

                      {/* Agent 3: Risk & Controls AI */}
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-extrabold text-slate-900 text-xs">Risk & Controls AI</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-md border border-emerald-200">
                            {activeFinding.riskAgentStatus}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                          {activeFinding.riskAgentOpinion}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 block pt-0.5">
                          Confidence: {activeFinding.riskAgentConfidence}%
                        </span>
                      </div>
                    </div>

                    {/* SECTION 3: NEXT ACTION */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">NEXT ACTION</h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-slate-800 font-bold text-xs leading-normal">
                          {activeFinding.nextAction}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: AI DEBATE */}
                {activeInspectorTab === 'debate' && (
                  <div className="space-y-3 text-xs">
                    <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">MULTI-AGENT DELIBERATION TRANSCRIPT</h3>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
                        <span className="font-bold text-blue-900 block">[10:14:02] Financial Analysis AI:</span>
                        <p className="text-slate-700 font-sans">{activeFinding.finAgentOpinion}</p>
                      </div>
                      <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1">
                        <span className="font-bold text-purple-900 block">[10:14:05] Audit & Compliance AI:</span>
                        <p className="text-slate-700 font-sans">{activeFinding.auditAgentOpinion}</p>
                      </div>
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                        <span className="font-bold text-amber-900 block">[10:14:09] Risk & Controls AI:</span>
                        <p className="text-slate-700 font-sans">{activeFinding.riskAgentOpinion}</p>
                      </div>
                      <div className="p-2.5 bg-slate-900 text-white rounded-xl space-y-1 font-sans">
                        <span className="font-bold text-emerald-400 block flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Hermes Lead Auditor Consensus:
                        </span>
                        <p className="text-slate-200 text-[11px]">{activeFinding.aiRecommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: EVIDENCE */}
                {activeInspectorTab === 'evidence' && (
                  <div className="space-y-3 text-xs">
                    <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">SOURCE WORKPAPER CITATIONS</h3>
                    <div className="space-y-2">
                      {documents.filter(d => d.entityName.toLowerCase().includes('technofina') || d.entityName === activeFinding.companyName).map(doc => (
                        <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate max-w-[200px]">{doc.filename}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">SHA-256 Verified</span>
                          </div>
                          <p className="text-slate-600 text-[11px] font-medium">{doc.summary}</p>
                          <button
                            onClick={() => onNavigate && onNavigate('documents')}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-1"
                          >
                            <ExternalLink className="w-3 h-3" /> View Source File
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: TASKS */}
                {activeInspectorTab === 'tasks' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">ASSIGNED TASKS</h3>
                      <button
                        onClick={() => setIsCreateTaskOpen(true)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Task
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Reconcile {activeFinding.category} Workpapers</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">In Progress</span>
                      </div>
                      <p className="text-[11px] text-slate-600">Assignee: {activeFinding.assignee || 'Michael Brown'} | Due: {activeFinding.dueDate || 'Aug 20, 2026'}</p>
                    </div>
                  </div>
                )}

                {/* TAB 5: HISTORY */}
                {activeInspectorTab === 'history' && (
                  <div className="space-y-3 text-xs">
                    <h3 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">AUDIT TRAIL LOG</h3>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                      <div className="relative">
                        <span className="w-2 h-2 rounded-full bg-blue-500 absolute -left-[17px] top-1" />
                        <span className="text-[10px] text-slate-400 font-mono block">Today, 10:14 AM</span>
                        <span className="font-bold text-slate-800 text-[11px]">Hermes 4-Agent Consensus scan initialized</span>
                      </div>
                      <div className="relative">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[17px] top-1" />
                        <span className="text-[10px] text-slate-400 font-mono block">Today, 10:15 AM</span>
                        <span className="font-bold text-slate-800 text-[11px]">Finding flagged as {activeFinding.status}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs my-auto">
              Select a finding from the consensus queue to inspect agent opinions.
            </div>
          )}

          {/* Panel Fixed Bottom Actions */}
          {activeFinding && (
            <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
              <button
                onClick={() => handleUpdateFindingStatus(activeFinding.id, activeFinding.status === 'Auto Resolved' ? 'Needs Review' : 'Auto Resolved')}
                className={`flex-1 py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer ${
                  activeFinding.status === 'Auto Resolved'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeFinding.status === 'Auto Resolved' ? 'Mark Needs Review' : 'Approve Finding'}</span>
              </button>

              <button
                onClick={() => setIsRequestEvidenceOpen(true)}
                className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Request Evidence</span>
              </button>

              <button
                onClick={() => handleUpdateFindingStatus(activeFinding.id, 'Escalated')}
                className="p-2 text-rose-600 hover:text-rose-800 rounded-xl border border-slate-200 hover:bg-rose-50 transition cursor-pointer"
                title="Escalate Finding"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ----------------- CREATE FINDING MODAL ----------------- */}
      {isCreateFindingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsCreateFindingOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Create New Audit Finding</h2>
                <p className="text-xs text-slate-500">Manually log an exception for {selectedCompany}</p>
              </div>
            </div>

            <form onSubmit={handleCreateFindingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Finding Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Note 22 intercompany elimination review..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Inventory">Inventory</option>
                    <option value="AP">AP</option>
                    <option value="Journal Entries">Journal Entries</option>
                    <option value="Cash">Cash</option>
                    <option value="Tax">Tax</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Risk Level</label>
                  <select
                    value={newRisk}
                    onChange={e => setNewRisk(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Materiality (€)</label>
                <input
                  type="number"
                  value={newMateriality}
                  onChange={e => setNewMateriality(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateFindingOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Create Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- CREATE TASK MODAL ----------------- */}
      {isCreateTaskOpen && activeFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button onClick={() => setIsCreateTaskOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Assign Audit Task</h2>
                <p className="text-xs text-slate-500">Assign task for {activeFinding.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle || `Reconcile ${activeFinding.title}`}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Assignee</label>
                <select
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Michael Brown">Michael Brown (Audit Senior)</option>
                  <option value="Emily Davis">Emily Davis (Audit Manager)</option>
                  <option value="David Lee">David Lee (IT Auditor)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsCreateTaskOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Task assigned to ${taskAssignee} for ${selectedCompany}`);
                    setIsCreateTaskOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- REQUEST EVIDENCE MODAL ----------------- */}
      {isRequestEvidenceOpen && activeFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button onClick={() => setIsRequestEvidenceOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Request Supporting Evidence</h2>
                <p className="text-xs text-slate-500">Send evidence request to {selectedCompany} Controller</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Required Workpapers / Documentation</label>
                <textarea
                  rows={3}
                  defaultValue={`Please upload Note 22 intercompany schedules and board authorization minutes for ${activeFinding.title}.`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsRequestEvidenceOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateFindingStatus(activeFinding.id, 'Waiting Evidence');
                    alert(`Evidence request dispatched to ${selectedCompany} client portal.`);
                    setIsRequestEvidenceOpen(false);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
