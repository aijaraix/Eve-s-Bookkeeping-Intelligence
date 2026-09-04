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
  AlertCircle,
  Printer,
  FileSpreadsheet,
  Building2,
  Settings2
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { ExecutiveReportPrintModal } from './ExecutiveReportPrintModal';

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
  const {
    companies,
    selectedWorkspaceId,
    setSelectedCompanyId,
    setSelectedProjectId,
    userSession,
    compileReport,
    hasFacts,
    facts,
    entities,
    firmBranding,
    updateFirmBranding,
    activeCurrency
  } = usePractice();

  const [step, setStep] = useState<number>(1);
  const [selectedReportType, setSelectedReportType] = useState<string>('executive-opinion');
  const [includeProvenance, setIncludeProvenance] = useState<boolean>(true);
  const [includeCpaSignoff, setIncludeCpaSignoff] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [compiledReport, setCompiledReport] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Editable Firm Branding state for the wizard
  const [customFirmName, setCustomFirmName] = useState(firmBranding?.firmName || 'Stein & Associates Audit LLP');
  const [customPartnerName, setCustomPartnerName] = useState(firmBranding?.partnerName || userSession.name || 'Steve Stein, CPA');
  const [customLicense, setCustomLicense] = useState(firmBranding?.licenseNumber || 'CPA License #NY-894120 / AICPA #0482910');
  const [customAddress, setCustomAddress] = useState(firmBranding?.firmAddress || 'One World Trade Center, 48th Floor, New York, NY 10007');
  const [customOpinion, setCustomOpinion] = useState(firmBranding?.opinionType || 'UNQUALIFIED_INDEPENDENT_AUDITOR_REPORT');

  if (!isOpen) return null;

  const reportTypes = [
    {
      id: 'executive-opinion',
      title: 'Executive Summary & Audit Opinion Brief',
      desc: 'Certified Independent Auditor Report with AICPA letterhead, scope of examination, and balance sheet equilibrium proof.',
      badge: 'CPA Standard'
    },
    {
      id: 'working-papers',
      title: 'Consolidated Financial Working Papers',
      desc: 'Line-item lead schedules from extracted facts with exact source quotes, document citations, and verification status.',
      badge: 'Comprehensive'
    },
    {
      id: 'elimination-schedule',
      title: 'Multi-Entity Hierarchy & Elimination Schedule',
      desc: 'Corporate group ownership hierarchy, intercompany cross-charge eliminations, and supply chain risk disclosures.',
      badge: 'Multi-Entity'
    }
  ];

  const selectedCompany = companies.find((c) => c.id === selectedWorkspaceId);

  const handleStartCompilation = async () => {
    setIsCompiling(true);
    setError(null);

    // Save custom firm branding
    await updateFirmBranding({
      firmName: customFirmName,
      partnerName: customPartnerName,
      licenseNumber: customLicense,
      firmAddress: customAddress,
      opinionType: customOpinion
    });

    const result = await compileReport({
      deliverableType: reportTypes.find((r) => r.id === selectedReportType)?.title || 'Financial Report',
      audience: 'Audit Committee & Board of Directors'
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

  const handleExportCsv = (mode: 'lead-schedules' | 'working-papers') => {
    const filename = mode === 'lead-schedules'
      ? `Lead_Schedules_${selectedCompany?.name || 'Audit'}.csv`
      : `Working_Papers_Binder_${selectedCompany?.name || 'Audit'}.csv`;

    const headers = [
      'Fact ID',
      'Metric Name',
      'Classification',
      'Original Value',
      'Currency',
      'Functional Value',
      'Functional Currency',
      'Source Document',
      'Page',
      'Source Quote',
      'Verification Status'
    ];

    const rows = (facts || []).map((f) => [
      `"${f.id || ''}"`,
      `"${f.canonicalMetric || f.labelNormalized || f.labelOriginal || ''}"`,
      `"${f.statementType || 'GENERAL'}"`,
      `"${f.valueOriginal || ''}"`,
      `"${f.currencyOriginal || activeCurrency}"`,
      `"${f.valueFunctional || f.valueOriginal || ''}"`,
      `"${activeCurrency}"`,
      `"${(f as any).documentTitle || f.documentId || ''}"`,
      `"${f.pageNumber || '1'}"`,
      `"${(f.sourceText || '').replace(/"/g, '""')}"`,
      `"${f.verificationStatus || 'VERIFIED'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-mono">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight">CPA Audit Deliverable & Report Wizard</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Step {step} of 3
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Brandable CPA Deliverables • Signed off by {userSession.email || EMPTY_DISPLAY}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full bg-slate-100 h-1">
            <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          <div className="p-6 space-y-6">
            {/* STEP 1: DELIVERABLE TYPE */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">1. Select Audit Deliverable Package</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Reports are compiled directly from verified facts in db.facts. Empty workspaces cannot generate deliverables.
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
                            ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
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

            {/* STEP 2: FIRM BRANDING & ENGAGEMENT CONFIG */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">2. Target Client & CPA Firm Branding</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure your official CPA letterhead, partner sign-off, and engagement opinion standard.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Target Client Engagement</label>
                    <select
                      value={selectedWorkspaceId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setSelectedProjectId(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Audit Firm Name</label>
                    <input
                      type="text"
                      value={customFirmName}
                      onChange={(e) => setCustomFirmName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Signing Partner</label>
                    <input
                      type="text"
                      value={customPartnerName}
                      onChange={(e) => setCustomPartnerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CPA License / AICPA Number</label>
                    <input
                      type="text"
                      value={customLicense}
                      onChange={(e) => setCustomLicense(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Audit Opinion Framework</label>
                    <select
                      value={customOpinion}
                      onChange={(e) => setCustomOpinion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    >
                      <option value="UNQUALIFIED_INDEPENDENT_AUDITOR_REPORT">Unqualified Independent Auditor's Report (Clean)</option>
                      <option value="QUALIFIED_OPINION">Qualified Opinion (Matter of Scope)</option>
                      <option value="REVIEW_MEMORANDUM">AICPA Statement on Standards Review</option>
                      <option value="AGREED_UPON_PROCEDURES">Agreed-Upon Procedures (AUP)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Firm Registered Address</label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div>Signing Partner Email: <span className="font-bold">{userSession.email || EMPTY_DISPLAY}</span></div>
                  <div>Verified Facts in Workspace: <span className="font-bold">{hasFacts ? `${facts.length} Verified Facts` : 'None'}</span></div>
                  <div>Consolidated Scope: <span className="font-bold">{entities.length} Group Entities Registered</span></div>
                </div>
              </div>
            )}

            {/* STEP 3: COMPILATION & MULTI-FORMAT EXPORT */}
            {step === 3 && (
              <div className="space-y-6 py-2">
                {!isCompiling && !isCompleted && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Compile Official Audit Package</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Generates certified audit deliverables under <strong>{customFirmName}</strong> letterhead with digital sign-off by <strong>{customPartnerName}</strong>.
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
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Compile Deliverable Package Now</span>
                    </button>
                  </div>
                )}

                {isCompiling && (
                  <div className="space-y-4 text-center py-6">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    <h3 className="text-sm font-extrabold text-slate-900">Executing ReportingEngine & Gated Fact Aggregation…</h3>
                  </div>
                )}

                {isCompleted && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-extrabold text-emerald-950">
                        Deliverable Successfully Compiled & Certified
                      </h3>
                      <p className="text-xs text-emerald-800">
                        {customFirmName} • Certified by {customPartnerName} ({customLicense})
                      </p>
                    </div>

                    {/* Multi-Format Export Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* Option 1: PDF / Print */}
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="p-4 bg-white rounded-xl border border-emerald-300 hover:border-emerald-500 shadow-xs flex items-center gap-3 text-left cursor-pointer group transition-all"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Print / Save as PDF</h4>
                          <p className="text-[11px] text-slate-500">Official letterhead & signature</p>
                        </div>
                      </button>

                      {/* Option 2: Lead Schedules CSV */}
                      <button
                        onClick={() => handleExportCsv('lead-schedules')}
                        className="p-4 bg-white rounded-xl border border-emerald-300 hover:border-emerald-500 shadow-xs flex items-center gap-3 text-left cursor-pointer group transition-all"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Export Lead Schedules (.CSV)</h4>
                          <p className="text-[11px] text-slate-500">Excel balance sheet schedules</p>
                        </div>
                      </button>

                      {/* Option 3: Working Papers Binder CSV */}
                      <button
                        onClick={() => handleExportCsv('working-papers')}
                        className="p-4 bg-white rounded-xl border border-emerald-300 hover:border-emerald-500 shadow-xs flex items-center gap-3 text-left cursor-pointer group transition-all"
                      >
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Audit Working Papers (.CSV)</h4>
                          <p className="text-[11px] text-slate-500">Full quote & coordinate binder</p>
                        </div>
                      </button>

                      {/* Option 4: Full JSON */}
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(compiledReport, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `audit_report_${selectedWorkspaceId || 'workspace'}.json`;
                          a.click();
                        }}
                        className="p-4 bg-white rounded-xl border border-emerald-300 hover:border-emerald-500 shadow-xs flex items-center gap-3 text-left cursor-pointer group transition-all"
                      >
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Machine-Readable JSON</h4>
                          <p className="text-[11px] text-slate-500">ERP & regulator data package</p>
                        </div>
                      </button>
                    </div>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{step === 3 ? 'Review' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Modal */}
      {showPrintModal && (
        <ExecutiveReportPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          report={compiledReport}
          companyName={selectedCompany?.name || 'Reporting Entity'}
          firmBranding={{
            firmName: customFirmName,
            partnerName: customPartnerName,
            licenseNumber: customLicense,
            firmAddress: customAddress,
            opinionType: customOpinion
          }}
          facts={facts}
          currency={activeCurrency}
        />
      )}
    </>
  );
};
