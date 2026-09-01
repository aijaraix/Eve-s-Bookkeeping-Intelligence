import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, FileText, Download, Filter } from 'lucide-react';

export const AuditFindingsView: React.FC = () => {
  const findings = [
    {
      id: 'FIND-001',
      title: 'Discontinued Operations Disclosure Distinction',
      severity: 'LOW',
      status: 'RESOLVED',
      category: 'IFRS Disclosure',
      detail: 'Verified that €59.60B legacy gross turnover includes discontinued ice cream operations, whereas continuing operations revenue is correctly reported at €50.503B.',
      paper: 'WP-2025-DISC-01'
    },
    {
      id: 'FIND-002',
      title: 'Foreign Exchange Translation Sensitivity',
      severity: 'MEDIUM',
      status: 'UNDER REVIEW',
      category: 'Currency Impact',
      detail: 'Euro translation volatility on Latin American subsidiaries impacts constant currency growth by -1.2%. Note 15 disclosure confirmed.',
      paper: 'WP-2025-FX-04'
    },
    {
      id: 'FIND-003',
      title: 'Pension Asset Valuation Discount Rate',
      severity: 'LOW',
      status: 'PASSED',
      category: 'Actuarial Valuation',
      detail: 'UK defined benefit pension scheme discount rate of 4.8% aligns with iBoxx AA sterling corporate bond yield benchmark.',
      paper: 'WP-2025-PEN-02'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Findings & Risk Register</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 Critical Material Exceptions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC FY2025 Audit Workpapers & Exception Tracking
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Export Risk Register</span>
        </button>
      </div>

      {/* Findings Cards */}
      <div className="space-y-4">
        {findings.map((f) => (
          <div key={f.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">{f.id}</span>
                <h3 className="text-sm font-extrabold text-slate-900">{f.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  f.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
                  f.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {f.severity} RISK
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {f.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">{f.detail}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div>Category: <span className="font-bold text-slate-800">{f.category}</span></div>
              <div>Audit Working Paper: <span className="font-bold text-blue-600">{f.paper}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
