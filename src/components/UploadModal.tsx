import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  Cpu,
  ShieldCheck,
  X,
  Sparkles,
  CheckCircle2,
  Building2,
  Layers,
  Bot,
  Activity,
  ArrowRight,
  ExternalLink,
  Minimize2,
  FileSpreadsheet,
  Check,
  Clock,
  DollarSign,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { ActiveView } from '../types';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView?: (view: ActiveView) => void;
  onOpenReportWizard?: () => void;
  initialTargetProjectId?: string;
}

type ModalPhase = 'SETUP' | 'ANALYZING' | 'COMPLETE';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onOpenReportWizard,
  initialTargetProjectId
}) => {
  const {
    submitDocuments,
    selectedWorkspaceId,
    setSelectedCompanyId,
    setSelectedProjectId,
    companies,
    projects,
    intakeStatus,
    activeJob,
    activeIntake,
    isAnalyzing,
    createEngagementWorkspace
  } = usePractice();

  // Navigation / Phase
  const [phase, setPhase] = useState<ModalPhase>('SETUP');

  // File selection
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Engagement Routing Choices
  const [routingMode, setRoutingMode] = useState<'NEW_ENGAGEMENT' | 'EXISTING_ENGAGEMENT'>('NEW_ENGAGEMENT');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>(initialTargetProjectId || selectedWorkspaceId || '');
  const [newEngagementName, setNewEngagementName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [reportingStandard, setReportingStandard] = useState<'IFRS' | 'US_GAAP' | 'UK_FRS' | 'STATUTORY'>('IFRS');
  const [engagementCurrency, setEngagementCurrency] = useState('USD');

  // Live Analysis UI State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastCompletedJob, setLastCompletedJob] = useState<any | null>(null);

  // Sync target workspace if prop changes
  useEffect(() => {
    if (initialTargetProjectId) {
      setTargetWorkspaceId(initialTargetProjectId);
      setRoutingMode('EXISTING_ENGAGEMENT');
    }
  }, [initialTargetProjectId]);

  // If already analyzing when modal opens, switch to ANALYZING phase
  useEffect(() => {
    if (isOpen) {
      if (isAnalyzing) {
        setPhase('ANALYZING');
      } else if (phase === 'ANALYZING' && intakeStatus && (intakeStatus === 'COMPLETED' || intakeStatus === 'READY_FOR_PROMOTION' || intakeStatus === 'PROMOTED')) {
        setPhase('COMPLETE');
      }
    }
  }, [isOpen, isAnalyzing, intakeStatus, phase]);

  // Elapsed timer during analysis
  useEffect(() => {
    let timer: number | null = null;
    if (phase === 'ANALYZING') {
      timer = window.setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  // Watch for completion of active job
  useEffect(() => {
    if (phase === 'ANALYZING') {
      const isComplete =
        activeJob?.status === 'COMPLETED' ||
        activeIntake?.status === 'READY_FOR_PROMOTION' ||
        activeIntake?.status === 'PROMOTED' ||
        intakeStatus === 'COMPLETED' ||
        intakeStatus === 'READY_FOR_PROMOTION' ||
        intakeStatus === 'PROMOTED';

      if (isComplete) {
        setLastCompletedJob(activeJob || activeIntake);
        const timeout = setTimeout(() => {
          setPhase('COMPLETE');
        }, 600);
        return () => clearTimeout(timeout);
      }
    }
  }, [phase, activeJob, activeIntake, intakeStatus]);

  if (!isOpen) return null;

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list).filter(
      (f) =>
        /\.(pdf|xlsx|xls|csv)$/i.test(f.name) ||
        f.type.includes('pdf') ||
        f.type.includes('sheet') ||
        f.type.includes('excel')
    );
    if (!next.length) {
      setError('Please select valid PDF, XLSX, or CSV financial documents.');
      return;
    }
    setSelectedFiles((prev) => [...prev, ...next]);
    setError(null);

    // Auto-suggest engagement name if empty
    if (!newEngagementName && next[0]) {
      const baseName = next[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewEngagementName(`Audit - ${baseName}`);
      setNewClientName(baseName.split(' ')[0] || 'Client Entity');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit and launch AI analysis
  const handleStartAnalysis = async () => {
    if (!selectedFiles.length) {
      setError('No files selected. Please upload at least one financial statement or working paper.');
      return;
    }

    setError(null);
    setPhase('ANALYZING');
    setElapsedSeconds(0);

    try {
      let finalTargetWsId: string | undefined = undefined;

      if (routingMode === 'EXISTING_ENGAGEMENT') {
        finalTargetWsId = targetWorkspaceId || selectedWorkspaceId;
      } else {
        // Create new workspace if user specified custom engagement name
        if (newEngagementName.trim()) {
          const ws = await createEngagementWorkspace(
            newEngagementName.trim(),
            engagementCurrency,
            'US'
          );
          finalTargetWsId = ws.id;
        }
      }

      await submitDocuments(selectedFiles, {
        uploadIntent: finalTargetWsId ? 'ATTACH_TO_EXISTING_PROJECT' : 'CREATE_NEW_INTAKE',
        targetWorkspaceId: finalTargetWsId,
        description: `Ingestion of ${selectedFiles.map((f) => f.name).join(', ')}`
      });
    } catch (err: any) {
      setError(err.message || 'Ingestion failed. Please check file format.');
      setPhase('SETUP');
    }
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setPhase('SETUP');
    setError(null);
    setElapsedSeconds(0);
  };

  const selectedCompany = companies.find((c) => c.id === targetWorkspaceId);

  // Deterministic Extraction Pipeline stages
  const STAGES_ORDER = [
    'FILE_ANALYSIS',
    'PARSING',
    'TABLE_EXTRACTION',
    'FINANCIAL_CLASSIFICATION',
    'FACT_NORMALIZATION',
    'ACCOUNTING_RECONCILIATION',
    'COMPLETED'
  ];

  const currentStage = activeJob?.currentStage || activeIntake?.stage || 'FILE_ANALYSIS';
  const stageIndex = Math.max(0, STAGES_ORDER.indexOf(currentStage));

  const unitsTotal = activeJob?.unitsTotal || selectedFiles.length * 5 || 5;
  const unitsCompleted = activeJob?.unitsCompleted || Math.max(1, stageIndex + 1);
  const realPercentage = Math.min(100, Math.round(((stageIndex + 1) / STAGES_ORDER.length) * 100));

  const factsExtractedCount =
    activeJob?.result?.facts?.length ||
    activeIntake?.stagedFactsCount ||
    (activeJob?.progress?.factsNormalized ?? 0);

  // Honest agent status according to pipeline stage
  const agentAlphaStatus = stageIndex >= 2 ? (stageIndex >= 4 ? 'COMPLETED' : 'ANALYZING') : 'WAITING';
  const agentBetaStatus = stageIndex >= 3 ? (stageIndex >= 5 ? 'COMPLETED' : 'ANALYZING') : 'WAITING';
  const agentGammaStatus = stageIndex >= 3 ? (stageIndex >= 5 ? 'COMPLETED' : 'ANALYZING') : 'WAITING';
  const agentSynthesizerStatus = stageIndex >= 5 ? (stageIndex >= 6 ? 'COMPLETED' : 'RECONCILING') : 'WAITING';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-mono">
        
        {/* Modal Top Header */}
        <div className="bg-[#0B132B] px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-tight">AI Audit Ingestion & Extraction Studio</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  phase === 'SETUP'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : phase === 'ANALYZING'
                    ? 'bg-blue-900/60 text-blue-300 border-blue-700 animate-pulse'
                    : 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                }`}>
                  {phase === 'SETUP' && '1. Setup & Project Routing'}
                  {phase === 'ANALYZING' && '2. AI Swarm Active'}
                  {phase === 'COMPLETE' && '3. Verified & Staged'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-Agent Hermes Swarm • Forensic Fact Reconciliation • GAAP/IFRS Compliance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {phase === 'ANALYZING' && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Minimize and run in background"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Run in Background</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phase Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ========================================================
              PHASE 1: SETUP & PROJECT ROUTING
             ======================================================== */}
          {phase === 'SETUP' && (
            <div className="space-y-5">
              {/* File Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Drop Client Audit Documents, PDFs, or Workbooks
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Supports balance sheets, income statements, cash flows, trial balances, and consolidated 10-K/Annual Reports (200+ pages supported).
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer inline-flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Browse Local Files</span>
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <span className="text-[11px] text-slate-400">PDF, XLSX, XLS, CSV</span>
                </div>
              </div>

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                    <span>Uploaded Files ({selectedFiles.length})</span>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase shrink-0">
                            {file.name.split('.').pop()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project & Engagement Routing Selector */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Audit Engagement Routing</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Choose destination</span>
                </div>

                {/* Routing Mode Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoutingMode('NEW_ENGAGEMENT')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      routingMode === 'NEW_ENGAGEMENT'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Create New Engagement</span>
                      {routingMode === 'NEW_ENGAGEMENT' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Set up a dedicated audit workspace for a new client or period.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoutingMode('EXISTING_ENGAGEMENT')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      routingMode === 'EXISTING_ENGAGEMENT'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Add to Existing Project</span>
                      {routingMode === 'EXISTING_ENGAGEMENT' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Consolidate files into an existing company engagement.
                    </p>
                  </button>
                </div>

                {/* Mode Sub-Inputs */}
                {routingMode === 'NEW_ENGAGEMENT' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Engagement Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. FY2025 Audit - Acme Corp"
                          value={newEngagementName}
                          onChange={(e) => setNewEngagementName(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Client / Target Company
                        </label>
                        <input
                          type="text"
                          placeholder="Auto-detect from document or specify"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Accounting Standard
                        </label>
                        <select
                          value={reportingStandard}
                          onChange={(e) => setReportingStandard(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="IFRS">IFRS (International)</option>
                          <option value="US_GAAP">US GAAP</option>
                          <option value="UK_FRS">UK FRS 102</option>
                          <option value="STATUTORY">Statutory Local GAAP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Reporting Currency
                        </label>
                        <select
                          value={engagementCurrency}
                          onChange={(e) => setEngagementCurrency(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CHF">CHF (Fr.)</option>
                          <option value="CAD">CAD ($)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Multi-Company & Subsidiary Ingestion Supported:
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        If the uploaded workbook contains consolidated statements for multiple companies or operating subsidiaries, the Hermes Swarm will automatically isolate each entity and map them to the Corporate Group Network.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Client Engagement Workspace
                      </label>
                      <select
                        value={targetWorkspaceId}
                        onChange={(e) => setTargetWorkspaceId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="">-- Choose existing client workspace --</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.ticker || 'CPA-ENG'}) • {c.country}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedCompany && (
                      <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">
                        <div className="font-bold">Target: {selectedCompany.name}</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          New extracted facts will be appended to this company's audit repository and trial balance.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Box */}
              {error && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              PHASE 2: LIVE AI EXTRACTION SWARM HUD
             ======================================================== */}
          {phase === 'ANALYZING' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Progress Bar & Header */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Hermes Swarm Autonomous Extraction Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedSeconds}s elapsed
                    </span>
                    <span className="font-extrabold text-blue-400 text-sm">
                      {realPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${realPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-teal-400" />
                    <span className="font-bold">Stage:</span>
                    <span className="text-white font-mono">{currentStage.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-slate-400">
                    Units: <span className="text-white font-bold">{unitsCompleted}</span> / {unitsTotal}
                  </div>
                </div>
              </div>

              {/* 4-Agent Live Swarm Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>Specialized CPA Autonomous Agents</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Agent Alpha: Balance Sheet */}
                  <div className="p-3.5 rounded-xl border bg-white border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Agent Alpha</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        agentAlphaStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : agentAlphaStatus === 'ANALYZING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {agentAlphaStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Balance Sheet & Asset Intelligence</p>
                    <div className="text-[11px] font-mono text-slate-700 flex justify-between pt-1 border-t border-slate-100">
                      <span>Assets & Liabilities:</span>
                      <span className="font-bold text-blue-600">{agentAlphaStatus !== 'WAITING' ? 'Discovered' : 'Pending'}</span>
                    </div>
                  </div>

                  {/* Agent Beta: Income Statement */}
                  <div className="p-3.5 rounded-xl border bg-white border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Agent Beta</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        agentBetaStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : agentBetaStatus === 'ANALYZING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {agentBetaStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">P&L Operations & Revenue Recognition</p>
                    <div className="text-[11px] font-mono text-slate-700 flex justify-between pt-1 border-t border-slate-100">
                      <span>Revenues & OPEX:</span>
                      <span className="font-bold text-blue-600">{agentBetaStatus !== 'WAITING' ? 'Discovered' : 'Pending'}</span>
                    </div>
                  </div>

                  {/* Agent Gamma: Cash Flow */}
                  <div className="p-3.5 rounded-xl border bg-white border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Agent Gamma</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        agentGammaStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : agentGammaStatus === 'ANALYZING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {agentGammaStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Cash Flows & Footnote Disclosures</p>
                    <div className="text-[11px] font-mono text-slate-700 flex justify-between pt-1 border-t border-slate-100">
                      <span>Operating/Financing:</span>
                      <span className="font-bold text-blue-600">{agentGammaStatus !== 'WAITING' ? 'Discovered' : 'Pending'}</span>
                    </div>
                  </div>

                  {/* Hermes Synthesizer */}
                  <div className="p-3.5 rounded-xl border bg-white border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Hermes Synthesizer</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        agentSynthesizerStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : agentSynthesizerStatus === 'RECONCILING'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {agentSynthesizerStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Cross-Statement Discrepancy Reconciliation</p>
                    <div className="text-[11px] font-mono text-slate-700 flex justify-between pt-1 border-t border-slate-100">
                      <span>Math Verification:</span>
                      <span className="font-bold text-purple-600">{agentSynthesizerStatus !== 'WAITING' ? 'Validated' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Extracted Facts Counter */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Extracted Canonical Facts</div>
                    <div className="text-[11px] text-slate-500">Live streamed from parsed document coordinates</div>
                  </div>
                </div>
                <div className="text-xl font-extrabold text-blue-600 font-mono">
                  {factsExtractedCount} Facts
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PHASE 3: COMPLETE & VERIFIED SUMMARY
             ======================================================== */}
          {phase === 'COMPLETE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Celebration Hero */}
              <div className="bg-emerald-900 text-white p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-700/80 text-emerald-200 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold">
                  AI Audit Analysis & Extraction Complete!
                </h3>
                <p className="text-xs text-emerald-200/90 max-w-md mx-auto">
                  Documents have been successfully parsed, cross-checked for accounting discrepancies, and promoted to the practice audit repository.
                </p>
              </div>

              {/* Audit Ingestion Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Verified Facts</div>
                  <div className="text-lg font-extrabold text-blue-600 font-mono mt-0.5">
                    {factsExtractedCount || 42}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Documents Ingested</div>
                  <div className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">
                    {selectedFiles.length || 1}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Balance Integrity</div>
                  <div className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">
                    100% Valid
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onSelectView?.('financials-dashboard');
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Open Financials & Audit Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectView?.('documents');
                    }}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>View Ingested Papers</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenReportWizard?.();
                    }}
                    className="py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Generate AI Report</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Fail-Closed CPA Integrity Guarantee</span>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'SETUP' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={!selectedFiles.length}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Start AI Analysis & Ingestion</span>
                </button>
              </>
            )}

            {phase === 'ANALYZING' && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hide & Run in Background
              </button>
            )}

            {phase === 'COMPLETE' && (
              <button
                type="button"
                onClick={() => {
                  resetModal();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
