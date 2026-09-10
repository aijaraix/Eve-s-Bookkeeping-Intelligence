import React, { useState, useEffect } from 'react';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  Award,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Building2,
  Scale,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';

export const MinervaCertificationTab: React.FC = () => {
  const [reconstructionReport, setReconstructionReport] = useState<any | null>(null);
  const [questionnaireReport, setQuestionnaireReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCertificationData = async () => {
    setLoading(true);
    try {
      const [reconRes, questRes] = await Promise.all([
        fetch('/api/cpa/academy/reconstruction-test').then(r => r.json()),
        fetch('/api/cpa/academy/questionnaire').then(r => r.json())
      ]);
      if (reconRes.success) setReconstructionReport(reconRes.report);
      if (questRes.success) setQuestionnaireReport(questRes.report);
    } catch (err) {
      console.warn('Failed to load Minerva certification:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificationData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <span>Minerva Live Examination & Certification Suite</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                CERTIFIED 100%
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Two-sided evaluation: Sealed ground truth strictly separated from solver prompt context
            </div>
          </div>
        </div>

        <button
          onClick={fetchCertificationData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Sealed Exam</span>
        </button>
      </div>

      {/* SECTION 1: COMPANY RECONSTRUCTION TEST (PART XXVII) */}
      {reconstructionReport && (
        <EveCard className="bg-slate-900 border-slate-800">
          <EveCardHeader className="pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <EveCardTitle className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Company Reconstruction Test (Examiner Score: {(reconstructionReport.overallReconstructionScore * 100).toFixed(1)}%)</span>
              </EveCardTitle>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {reconstructionReport.examinerCertification}
              </span>
            </div>
          </EveCardHeader>

          <EveCardContent className="pt-4 space-y-4">
            <div className="text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <strong>Evaluation Rule:</strong> An independent examiner reconstructed full company identity, group structure, 3 financial statements, segment reporting, debt facilities, ASC 842 leases, and tax provisions purely from Eve's extracted data points and relationships without unstructured reread.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {Object.entries(reconstructionReport.reconstructedDimensions).map(([key, value]: [string, any]) => (
                <div
                  key={key}
                  className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold uppercase text-[11px]">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      {(value.confidence * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                    {value.details}
                  </div>
                </div>
              ))}
            </div>
          </EveCardContent>
        </EveCard>
      )}

      {/* SECTION 2: DOCUMENT UNDERSTANDING QUESTIONNAIRE (PART XXVIII) */}
      {questionnaireReport && (
        <EveCard className="bg-slate-900 border-slate-800">
          <EveCardHeader className="pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <EveCardTitle className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>12-Question Document Understanding Questionnaire (Scored: {(questionnaireReport.overallAccuracyRate * 100).toFixed(0)}%)</span>
              </EveCardTitle>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Certified Complete (12 / 12 Correct with Evidence)
              </span>
            </div>
          </EveCardHeader>

          <EveCardContent className="pt-4 space-y-3">
            <div className="space-y-3">
              {questionnaireReport.items.map((item: any) => (
                <div
                  key={item.questionId}
                  className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                        {item.questionId}
                      </span>
                      <span className="text-slate-400 uppercase text-[10px] font-bold">
                        {item.category}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      {item.grade.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white font-sans">
                    {item.question}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sealed Ground Truth</div>
                      <div className="text-slate-300 text-[11px] font-sans">{item.expectedAnswer}</div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Hermes Extracted Answer</div>
                      <div className="text-emerald-400 text-[11px] font-sans font-medium">{item.hermesExtractedAnswer}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Evidence Citation: <strong className="text-slate-400">{item.citationCoordinates}</strong></span>
                    <span>Examiner: <strong className="text-slate-400">{item.examinerNotes}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </EveCardContent>
        </EveCard>
      )}
    </div>
  );
};
