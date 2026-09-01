import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Award,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

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
  const { companies, selectedWorkspaceId, setSelectedCompanyId, setSelectedProjectId, userSession, compileReport, hasFacts } = usePractice();
  const [step, setStep] = useState<number>(1);
  const [selectedReportType, setSelectedReportType] = useState<string>('executive-opinion');
  const [includeProvenance, setIncludeProvenance] = useState<boolean>(true);
  const [includeCpaSignoff, setIncludeCpaSignoff] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [compiledReport, setCompiledReport] = useState<any>(null);

  if (!isOpen) return null;

  const reportTypes = [
    {
      id: 'executive-opinion',
      title: 'Executive Summary & Audit Opinion Brief',
      pages: 'CPA-gated',
      desc: 'Compiled only from REPORT_READY facts in db.facts with a real sign-off email.',
      badge: 'CPA Standard'
    },
    {
      id: 'working-papers',
      title: 'Consolidated Financial Working Papers',
      pages: 'CPA-gated',
      desc: 'Line-item audit trail from extracted facts. Refuses empty workspaces.',
      badge: 'Comprehensive'
    },
    {
      id: 'identity-log',
      title: 'Accounting Identity & Verification Log',
      pages: 'CPA-gated',
      desc: 'Assets = Liabilities + Equity and income-statement arithmetic from gated facts.',
      badge: 'Automated'
    }
  ];

  const selectedCompany = companies.find((c) => c.id === selectedWorkspaceId);

  const handleStartCompilation = async () => {
    setIsCompiling(true);
    setError(null);
    const result = await compileReport({
      deliverableType: reportTypes.find((r) => r.id === selectedReportType)?.title || 'Financial Report',
      audience: 'Audit Committee'
    });
    setIsCompiling(false);
    if (!result.success) {
      setError(result.error || 'REFUSED: cannot generate a report.');
      setIsCompleted(false);
      return;
    }
    setCompiledReport(result.report);
    setIsCompleted(true);
    onReportGenerated?.(result.report);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setIsCompiling(false);
    setIsCompleted(false);
    setError(null);
    setCompiledReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-mono">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                POST /api/deliverables/generate · signedOffBy {userSession.email || EMPTY_DISPLAY}
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

        <div className="w-full bg-slate-100 h-1">
          <div className="bg-purple-600 h-1 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Select Audit Deliverable Type</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export is refused unless the workspace has REPORT_READY facts and a real user email sign-off.
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-900">{rt.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{rt.badge}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rt.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Client workspace & sign-off</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Target entity is loaded from extracted workspaces. Dummy rows are not offered.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Client Entity</label>
                {companies.length === 0 ? (
                  <div className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                    No extracted client. Submit documents first.
                  </div>
                ) : (
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      setSelectedProjectId(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-purple-600"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div>Sign-off email: <span className="font-bold">{userSession.email || EMPTY_DISPLAY}</span></div>
                <div>Facts in workspace: <span className="font-bold">{hasFacts ? 'loaded from db.facts' : 'none'}</span></div>
                <div>Revenue (gated): <span className="font-bold">{selectedCompany?.revenue || EMPTY_DISPLAY}</span></div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">PDF line-item provenance</div>
                    <div className="text-[11px] text-slate-500">Included when facts carry source quotes.</div>
                  </div>
                </div>
                <input type="checkbox" checked={includeProvenance} onChange={(e) => setIncludeProvenance(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">CPA partner digital sign-off</div>
                    <div className="text-[11px] text-slate-500">Uses the authenticated user email. Fake names are refused.</div>
                  </div>
                </div>
                <input type="checkbox" checked={includeCpaSignoff} onChange={(e) => setIncludeCpaSignoff(e.target.checked)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-2">
              {!isCompiling && !isCompleted && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Compile from gated facts</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Empty extraction cannot generate a report. The API returns 422 if db.facts has no REPORT_READY rows.
                    </p>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 text-left text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
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
                  <h3 className="text-sm font-extrabold text-slate-900">Calling ReportingEngine…</h3>
                </div>
              )}

              {isCompleted && compiledReport && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">Report compiled from db.facts</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      {compiledReport.title || compiledReport.report?.title || 'Financial report'} signed by {userSession.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(compiledReport, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit_report_${selectedWorkspaceId || 'workspace'}.json`;
                      a.click();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Report JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isCompiling && !isCompleted && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200'
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
