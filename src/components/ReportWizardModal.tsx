import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  Building2,
  ShieldCheck,
  Award,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';

interface ReportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated?: (report: any) => void;
}

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({
  isOpen,
  onClose,
  onReportGenerated
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedReportType, setSelectedReportType] = useState<string>('executive-opinion');
  const [selectedCompany, setSelectedCompany] = useState<string>('Unilever PLC');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('FY 2025');
  const [selectedFramework, setSelectedFramework] = useState<string>('IFRS');
  const [includeProvenance, setIncludeProvenance] = useState<boolean>(true);
  const [includeSwarmTelemetry, setIncludeSwarmTelemetry] = useState<boolean>(true);
  const [includeCpaSignoff, setIncludeCpaSignoff] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationProgress, setCompilationProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const reportTypes = [
    {
      id: 'executive-opinion',
      title: 'Executive Summary & Audit Opinion Brief',
      pages: '4-6 Pages',
      desc: 'High-level CPA audit opinion brief, key financial highlights, and formal audit committee summary.',
      badge: 'CPA Standard'
    },
    {
      id: 'working-papers',
      title: 'Consolidated Financial Working Papers',
      pages: '25-35 Pages',
      desc: 'Full line-item audit trail with PDF page-level provenance, scale factors, and mathematical reconciliations.',
      badge: 'Comprehensive'
    },
    {
      id: 'identity-log',
      title: 'Accounting Identity & Verification Log',
      pages: '10-15 Pages',
      desc: 'Complete ledger balance identity logs (Assets = Liabilities + Equity) and variance breakdown.',
      badge: 'Automated'
    },
    {
      id: 'board-deck',
      title: 'Board Audit Committee Presentation Deck',
      pages: '15-20 Slides',
      desc: 'Executive-ready visual presentation for board members summarizing audit findings and risk register.',
      badge: 'Presentation'
    }
  ];

  const handleStartCompilation = () => {
    setIsCompiling(true);
    setCompilationProgress(0);

    const interval = setInterval(() => {
      setCompilationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          setIsCompleted(true);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setIsCompiling(false);
    setCompilationProgress(0);
    setIsCompleted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-mono">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">AI Audit Report Generation Wizard</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Step {step} of 3
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Automated CPA Workpaper & Deliverable Compiler Engine
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-purple-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Select Report Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Select Audit Deliverable Type</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the format and target audience for the AI-compiled audit report.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {reportTypes.map((rt) => {
                  const isSelected = selectedReportType === rt.id;
                  return (
                    <div
                      key={rt.id}
                      onClick={() => setSelectedReportType(rt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-900">{rt.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {rt.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rt.desc}</p>
                          <span className="text-[11px] font-bold text-purple-700 mt-1.5 inline-block">
                            Estimated Length: {rt.pages}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Configure Client & Options */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Configure Scope & Compliance Rules</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specify client entity, accounting standards, and evidence inclusions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Client Entity</label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-purple-600"
                  >
                    <option value="Unilever PLC">Unilever PLC (UK)</option>
                    <option value="Novartis AG">Novartis AG (Switzerland)</option>
                    <option value="Sony Group Corporation">Sony Group Corporation (Japan)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reporting Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-purple-600"
                  >
                    <option value="FY 2025">FY 2025 Annual</option>
                    <option value="FY 2024">FY 2024 Annual</option>
                    <option value="Q4 2025">Q4 2025 Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase">Verification & Audit Inclusions</span>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">PDF Line-Item Provenance Footnotes</div>
                      <div className="text-[11px] text-slate-500">Attach direct page numbers & source text quotes for every fact.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeProvenance}
                    onChange={(e) => setIncludeProvenance(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Hermes Agent Swarm Telemetry Log</div>
                      <div className="text-[11px] text-slate-500">Include real-time execution logs from 4 autonomous audit agents.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeSwarmTelemetry}
                    onChange={(e) => setIncludeSwarmTelemetry(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">CPA Partner Digital Signature & Stamp</div>
                      <div className="text-[11px] text-slate-500">Sign report with Steve Stein, CPA certified digital seal.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeCpaSignoff}
                    onChange={(e) => setIncludeCpaSignoff(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Compilation & Output */}
          {step === 3 && (
            <div className="space-y-6 py-2">
              {!isCompiling && !isCompleted && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Ready to Compile Audit Deliverable</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      AI Studio will extract all verified financial facts, run mathematical checks, and format the final document for {selectedCompany}.
                    </p>
                  </div>
                  <button
                    onClick={handleStartCompilation}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Compile Report Now</span>
                  </button>
                </div>
              )}

              {isCompiling && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Compiling Report Workpapers...</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Running Hermes Agent Swarm verification & formatting PDF deliverable
                    </p>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 max-w-md mx-auto overflow-hidden">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${compilationProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-700">{compilationProgress}% Completed</span>
                </div>
              )}

              {isCompleted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">Report Successfully Compiled!</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      {reportTypes.find((r) => r.id === selectedReportType)?.title} for {selectedCompany} is ready.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([`Audit Report for ${selectedCompany}\nPeriod: ${selectedPeriod}\nFramework: ${selectedFramework}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedCompany.replace(/\s+/g, '_')}_Audit_Report.txt`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Report</span>
                    </button>
                    <button
                      onClick={handleResetAndClose}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close Wizard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {!isCompiling && !isCompleted && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                step === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{step === 3 ? 'Review' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
