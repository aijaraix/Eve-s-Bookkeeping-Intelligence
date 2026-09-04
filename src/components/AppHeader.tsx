import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { 
  ShieldCheck, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  ChevronDown, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const {
    selectedCompany,
    setSelectedCompany,
    companies,
    selectedPeriod,
    setSelectedPeriod,
    isCopilotOpen,
    setIsCopilotOpen,
    setIsUploadOpen,
    setIsReportWizardOpen,
    findings,
    isSwarmRunning,
  } = usePractice();

  const unresolvedCount = findings.filter((f) => !f.resolved).length;

  return (
    <header id="app-header" className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-30 px-4 flex items-center justify-between">
      {/* Brand & Client Selection */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-mono">EVE</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                AUDIT V2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Institutional Forensic Platform</p>
          </div>
        </div>

        {/* Entity Selector */}
        <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-6">
          <label htmlFor="company-select" className="text-xs text-slate-400 font-medium">
            Entity:
          </label>
          <div className="relative">
            <select
              id="company-select"
              value={selectedCompany.id}
              onChange={(e) => {
                const comp = companies.find((c) => c.id === e.target.value);
                if (comp) setSelectedCompany(comp);
              }}
              aria-label="Select reporting entity"
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.reportingStandard})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Period Selector */}
          <div className="relative ml-2">
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              aria-label="Select fiscal period"
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="FY2024">FY2024 (Audited)</option>
              <option value="FY2023">FY2023 (Restated)</option>
              <option value="FY2022">FY2022 (Historical)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Hermes Swarm Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
          <Cpu className={`w-3.5 h-3.5 ${isSwarmRunning ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
          <span className="text-slate-300 font-medium">Hermes Swarm:</span>
          <span className="text-emerald-400 font-semibold">{isSwarmRunning ? 'Verifying...' : '6/6 Passed'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{selectedCompany.verificationScore}% integrity</span>
        </div>

        {/* Unresolved findings badge */}
        {unresolvedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{unresolvedCount} Finding{unresolvedCount > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Upload Button */}
        <button
          id="header-upload-btn"
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Intake Document</span>
        </button>

        {/* Deliverables Button */}
        <button
          id="header-deliverables-btn"
          onClick={() => setIsReportWizardOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Audit Memo</span>
        </button>

        {/* Eve Copilot Drawer Toggle */}
        <button
          id="header-copilot-btn"
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-md cursor-pointer ${
            isCopilotOpen
              ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
              : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Eve Copilot</span>
        </button>
      </div>
    </header>
  );
};
