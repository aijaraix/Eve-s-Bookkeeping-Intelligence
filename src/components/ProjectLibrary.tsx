import React, { useState, useRef, useMemo } from 'react';
import { Workspace, DocumentRecord, FinancialSummary } from '../types';
import {
  FolderKanban, Plus, Search, Building2, FileText, ArrowRight, ShieldCheck, Sparkles,
  TrendingUp, Calendar, Clock, DollarSign, Pencil, Check, X, UploadCloud, UserCheck,
  Trash2, FileSpreadsheet, AlertCircle, ExternalLink, Layers, Filter, Download, Sliders,
  MoreHorizontal, Bell, HelpCircle, ChevronDown, ChevronRight, Briefcase, CheckSquare,
  AlertTriangle, Target, BarChart2, PieChartIcon, Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface ProjectLibraryProps {
  workspaces: Workspace[];
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
  onSelectProject: (workspace: Workspace) => void;
  onNewProjectClick?: () => void;
  onRenameProject?: (id: string, newName: string) => void;
  onDeleteProject?: (id: string) => void;
  userEmail: string | null;
  onSubmitUpload: (files: File[], instructions: string, driveUrl?: string, confirmAttach?: boolean, workspaceId?: string) => void;
  onResetData?: () => void;
}

export interface ProjectItem {
  id: string;
  name: string;
  company: string;
  type: 'Audit' | 'Review' | 'Advisory' | 'Due Diligence' | 'Compliance' | 'Tax';
  owner: string;
  ownerAvatar?: string;
  status: 'In Progress' | 'Review' | 'Completed' | 'Overdue';
  progress: number;
  riskScore: 'High' | 'Medium' | 'Low';
  dueDate: string;
  workspaceId?: string;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  workspaces,
  documents,
  summary,
  onSelectProject,
  onNewProjectClick,
  onRenameProject,
  onDeleteProject,
  userEmail,
  onSubmitUpload,
  onResetData,
}) => {
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All Companies');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('All Owners');

  // Selected Checkboxes in table
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Modals state
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalInstructions, setModalInstructions] = useState('');
  const [modalDriveUrl, setModalDriveUrl] = useState('');

  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');

  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // User details formatting
  const rawUsername = userEmail ? userEmail.split('@')[0] : 'Auditor';
  const username = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
  const userInitials = username.slice(0, 2).toUpperCase();

  // Map REAL workspaces into Project Items
  const allProjects: ProjectItem[] = useMemo(() => {
    return workspaces.map(ws => {
      const wsDocs = documents.filter(d => d.workspaceId === ws.id);
      const totalDocs = wsDocs.length;
      const reviewedDocs = wsDocs.filter(d => 
        d.reviewStatus?.toLowerCase() === 'approved' || 
        d.reviewStatus?.toLowerCase() === 'reviewed' ||
        d.status?.toLowerCase() === 'completed'
      ).length;

      let progress = 0;
      let status: 'In Progress' | 'Review' | 'Completed' | 'Overdue' = 'In Progress';

      if (totalDocs > 0) {
        const docRatio = reviewedDocs / totalDocs;
        progress = Math.min(95, Math.max(20, Math.round(docRatio * 85)));
        status = 'In Progress';
      } else {
        progress = 15;
        status = 'In Progress';
      }

      const dateStr = ws.createdAt
        ? new Date(ws.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return {
        id: ws.id,
        name: ws.name,
        company: ws.name,
        type: 'Audit' as const,
        owner: username,
        status,
        progress,
        riskScore: 'Medium' as const,
        dueDate: dateStr,
        workspaceId: ws.id
      };
    });
  }, [workspaces, documents, username]);

  // Derived Dynamic Filter Options
  const companiesList = useMemo(() => {
    const list = Array.from(new Set(allProjects.map(p => p.company)));
    return ['All Companies', ...list];
  }, [allProjects]);

  const ownersList = useMemo(() => {
    const list = Array.from(new Set(allProjects.map(p => p.owner)));
    return ['All Owners', ...list];
  }, [allProjects]);

  // Filter Projects based on user selections
  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => {
      if (selectedCompanyFilter !== 'All Companies' && p.company !== selectedCompanyFilter) return false;
      if (selectedStatusFilter !== 'All Status' && p.status !== selectedStatusFilter) return false;
      if (selectedTypeFilter !== 'All Types' && p.type !== selectedTypeFilter) return false;
      if (selectedOwnerFilter !== 'All Owners' && p.owner !== selectedOwnerFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProjects, searchQuery, selectedCompanyFilter, selectedStatusFilter, selectedTypeFilter, selectedOwnerFilter]);

  // Dynamic KPI Metrics derived 100% from actual projects
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter(p => p.status === 'In Progress' || p.status === 'Review').length;
  const completedProjects = allProjects.filter(p => p.status === 'Completed').length;
  const overdueProjects = allProjects.filter(p => p.status === 'Overdue').length;
  const avgCompletion = totalProjects > 0
    ? Math.round(allProjects.reduce((acc, p) => acc + p.progress, 0) / totalProjects)
    : 0;

  // Recharts Chart Datasets derived dynamically
  const statusPieData = useMemo(() => {
    const inProg = allProjects.filter(p => p.status === 'In Progress').length;
    const review = allProjects.filter(p => p.status === 'Review').length;
    const completed = allProjects.filter(p => p.status === 'Completed').length;
    const overdue = allProjects.filter(p => p.status === 'Overdue').length;
    const total = totalProjects || 1;

    return [
      { name: 'In Progress', value: inProg, color: '#2563eb', percentage: `${((inProg / total) * 100).toFixed(1)}%` },
      { name: 'Review', value: review, color: '#06b6d4', percentage: `${((review / total) * 100).toFixed(1)}%` },
      { name: 'Completed', value: completed, color: '#8b5cf6', percentage: `${((completed / total) * 100).toFixed(1)}%` },
      { name: 'Overdue', value: overdue, color: '#ef4444', percentage: `${((overdue / total) * 100).toFixed(1)}%` }
    ];
  }, [allProjects, totalProjects]);

  const typePieData = useMemo(() => {
    const typesCount: Record<string, number> = { Audit: 0, Review: 0, Advisory: 0, 'Due Diligence': 0, Compliance: 0, Tax: 0 };
    allProjects.forEach(p => {
      if (typesCount[p.type] !== undefined) typesCount[p.type]++;
    });
    const total = totalProjects || 1;
    const colors = ['#2563eb', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6', '#f59e0b'];

    return Object.entries(typesCount).map(([name, val], idx) => ({
      name,
      value: val,
      color: colors[idx % colors.length],
      percentage: `${((val / total) * 100).toFixed(1)}%`
    }));
  }, [allProjects, totalProjects]);

  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const month = d.getMonth();
      const count = workspaces.filter(ws => {
        if (!ws.createdAt) return false;
        const wsDate = new Date(ws.createdAt);
        return wsDate.getFullYear() === year && wsDate.getMonth() === month;
      }).length;
      result.push({ month: monthLabel, count });
    }
    return result;
  }, [workspaces]);

  const completionGaugeData = useMemo(() => [
    { name: 'Completed', value: avgCompletion, fill: '#2563eb' },
    { name: 'Remaining', value: 100 - avgCompletion, fill: '#e2e8f0' }
  ], [avgCompletion]);

  const riskDistributionData = useMemo(() => {
    const high = allProjects.filter(p => p.riskScore === 'High').length;
    const medium = allProjects.filter(p => p.riskScore === 'Medium').length;
    const low = allProjects.filter(p => p.riskScore === 'Low').length;
    return [
      { category: 'High', count: high, fill: '#ef4444' },
      { category: 'Medium', count: medium, fill: '#f59e0b' },
      { category: 'Low', count: low, fill: '#10b981' }
    ];
  }, [allProjects]);

  const upcomingDeadlines = useMemo(() => {
    return allProjects.slice(0, 4);
  }, [allProjects]);

  const topRiskProjects = useMemo(() => {
    return allProjects.filter(p => p.riskScore === 'High' || p.riskScore === 'Medium').slice(0, 3);
  }, [allProjects]);

  // Handle Project Item Click
  const handleProjectClick = (proj: ProjectItem) => {
    if (proj.workspaceId) {
      const ws = workspaces.find(w => w.id === proj.workspaceId);
      if (ws) {
        onSelectProject(ws);
        return;
      }
    }
    if (workspaces.length > 0) {
      onSelectProject(workspaces[0]);
    }
  };

  // Export Projects Handler
  const handleExport = () => {
    if (filteredProjects.length === 0) return;
    const headers = ['Project Name', 'Company', 'Type', 'Owner', 'Status', 'Progress (%)', 'Risk Score', 'Due Date'];
    const rows = filteredProjects.map(p => [
      `"${p.name}"`,
      `"${p.company}"`,
      `"${p.type}"`,
      `"${p.owner}"`,
      `"${p.status}"`,
      p.progress,
      `"${p.riskScore}"`,
      `"${p.dueDate}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table selection logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProjectIds(filteredProjects.map(p => p.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitUpload(modalFiles, modalInstructions, modalDriveUrl);
    setIsCreateModalOpen(false);
    setModalFiles([]);
    setModalInstructions('');
    setModalDriveUrl('');
  };

  const handleConfirmDelete = () => {
    if (deletingWorkspace && confirmDeleteInput.trim().toLowerCase() === 'confirm' && onDeleteProject) {
      onDeleteProject(deletingWorkspace.id);
      setDeletingWorkspace(null);
      setConfirmDeleteInput('');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 bg-[#f8fafc] -m-6 p-6 min-h-screen">

      {/* ----------------- PAGE HEADER ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-5 rounded-2xl shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Projects Portfolio</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Overview of active client engagements and workspaces</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={filteredProjects.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onNewProjectClick ? onNewProjectClick() : setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ----------------- 5 EXECUTIVE KPI CARDS ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

        {/* Total Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Projects</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalProjects}</div>
              <span className="text-[10px] font-medium text-slate-400">Active workspaces</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <button onClick={() => setSelectedStatusFilter('All Status')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
            <span>View all</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Projects</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{activeProjects}</div>
              <span className="text-[10px] font-medium text-slate-400">In progress / review</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <button onClick={() => setSelectedStatusFilter('In Progress')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
            <span>View active</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Completed Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{completedProjects}</div>
              <span className="text-[10px] font-medium text-slate-400">Sign-off completed</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <button onClick={() => setSelectedStatusFilter('Completed')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
            <span>View completed</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Overdue Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Overdue</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{overdueProjects}</div>
              <span className="text-[10px] font-medium text-slate-400">Pending action</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <button onClick={() => setSelectedStatusFilter('Overdue')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
            <span>View overdue</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Avg. Completion */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg. Completion</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{avgCompletion}%</div>
              <span className="text-[10px] font-medium text-slate-400">Across all projects</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Live calculating</span>
        </div>

      </div>

      {/* ----------------- SEARCH & FILTER CONTROLS BAR ----------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">

          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search project name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompanyFilter}
              onChange={e => setSelectedCompanyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {companiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All Types">All Types</option>
              <option value="Audit">Audit</option>
              <option value="Review">Review</option>
              <option value="Advisory">Advisory</option>
              <option value="Due Diligence">Due Diligence</option>
              <option value="Compliance">Compliance</option>
              <option value="Tax">Tax</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <select
              value={selectedOwnerFilter}
              onChange={e => setSelectedOwnerFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {ownersList.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ----------------- MAIN CONTENT SPLIT GRID ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ----------------- LEFT 7 COLS: PROJECTS TABLE ----------------- */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden min-h-[360px] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedProjectIds.length === filteredProjects.length && filteredProjects.length > 0}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => {
                    const isChecked = selectedProjectIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleProjectClick(p)}
                        className="hover:bg-slate-50/90 transition cursor-pointer group"
                      >
                        {/* Checkbox */}
                        <td className="p-3" onClick={e => handleToggleSelect(p.id, e)}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Project Name */}
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </span>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="p-3 text-slate-600 font-medium">{p.company}</td>

                        {/* Type Badge */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.type === 'Audit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            p.type === 'Review' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            p.type === 'Advisory' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            p.type === 'Due Diligence' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            p.type === 'Compliance' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {p.type}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                              {p.owner.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-slate-700 font-medium">{p.owner}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            p.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            p.status === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>

                        {/* Progress Bar */}
                        <td className="p-3 min-w-[100px]">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 font-mono">{p.progress}%</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              const ws = workspaces.find(w => w.id === p.workspaceId);
                              if (ws) setDeletingWorkspace(ws);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Delete Workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : null}
              </tbody>
            </table>

            {/* Clean Empty State when zero projects */}
            {filteredProjects.length === 0 && (
              <div className="p-12 text-center space-y-4 my-auto">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                  <FolderKanban className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">No Projects in Workspace</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {searchQuery || selectedCompanyFilter !== 'All Companies' || selectedStatusFilter !== 'All Status'
                      ? 'No projects match your current filters. Try resetting your search filters.'
                      : 'You do not have any active audit projects yet. Upload trial balance or financial statements to create your first project.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- RIGHT 5 COLS: SIDE PANELS & CHARTS ----------------- */}
        <div className="lg:col-span-5 space-y-5">

          {/* Panel 1: Projects by Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Projects by Status</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center">
                {totalProjects > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-[11px] font-bold text-slate-400">0 Projects</div>
                )}
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 text-xs">
                {statusPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-500">{item.value} ({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: Projects by Type */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Projects by Type</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center">
                {totalProjects > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {typePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-[11px] font-bold text-slate-400">0 Projects</div>
                )}
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 text-xs">
                {typePieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-500">{item.value} ({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 3: Upcoming Deadlines */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Upcoming Deadlines</h3>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2.5 text-xs">
                {upcomingDeadlines.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      <span className="text-slate-500">{p.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium py-2">No upcoming project deadlines.</p>
            )}
          </div>

          {/* Panel 4: Risk Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Top Risk Projects</h3>
            {topRiskProjects.length > 0 ? (
              <div className="space-y-2 text-xs">
                {topRiskProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-200">
                      {p.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium py-2">No high or medium risk projects identified.</p>
            )}
          </div>

        </div>

      </div>

      {/* ----------------- BOTTOM ROW CHARTS ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

        {/* Chart 1: Projects Created Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Projects Created</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Last 6 Months</span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMonthly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Completion % Gauge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Average Completion %</h3>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="w-36 h-20 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionGaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={42}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {completionGaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 text-center">
                <span className="text-xl font-black text-slate-900 block leading-none">{avgCompletion}%</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-2">Average across active projects</p>
          </div>
        </div>

        {/* Chart 3: Risk Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Risk Distribution</h3>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData}>
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ----------------- CREATE NEW PROJECT MODAL ----------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Create New Audit Project</h2>
                <p className="text-xs text-slate-500">Attach trial balance or financial statements to create a workspace</p>
              </div>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Source Financial Documents</label>
                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 p-4 rounded-xl text-center cursor-pointer transition"
                >
                  <UploadCloud className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <span className="font-bold text-slate-800 block">Click or drag files to upload</span>
                  <span className="text-[10px] text-slate-400">PDF, XLSX, CSV trial balances</span>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    multiple
                    onChange={e => e.target.files && setModalFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                </div>
                {modalFiles.length > 0 && (
                  <div className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{modalFiles.length} file(s) selected: {modalFiles.map(f => f.name).join(', ')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Audit Instructions / Context</label>
                <textarea
                  rows={2}
                  value={modalInstructions}
                  onChange={e => setModalInstructions(e.target.value)}
                  placeholder="E.g., Perform trial balance reconciliation and ISA 240 fraud check..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- DELETE CONFIRMATION MODAL ----------------- */}
      {deletingWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-base font-extrabold text-slate-900">Delete Project Workspace</h2>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deletingWorkspace.name}</span>? Type <span className="font-mono font-bold text-rose-600">confirm</span> below.
            </p>
            <input
              type="text"
              value={confirmDeleteInput}
              onChange={e => setConfirmDeleteInput(e.target.value)}
              placeholder="Type confirm..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingWorkspace(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={confirmDeleteInput.trim().toLowerCase() !== 'confirm'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
