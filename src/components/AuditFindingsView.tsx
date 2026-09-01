import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const AuditFindingsView: React.FC = () => {
  const { findings, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Findings & Risk Register</h2>
        <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • /api/findings</p>
      </div>
      {findings.length === 0 ? (
        <EmptyExtractionState title="No findings" detail="Findings appear only after extraction writes them. 59.6B discontinued-ops commentary is not preloaded." />
      ) : (
        <div className="space-y-4">
          {findings.map((f: any) => (
            <div key={f.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">{f.title || f.id}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{f.status || f.risk}</span>
              </div>
              <p className="text-xs text-slate-600">{f.detail || f.nextAction || f.aiRecommendation || EMPTY_DISPLAY}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
