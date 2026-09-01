import React from 'react';
import { Clock, ShieldCheck, FileText, User, Filter, Download } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const logs = [
    { time: '13:20:14 Today', user: 'Steve Stein, CPA', action: 'Verified Financial Fact', detail: 'Turnover €50,503M approved against Note 2 (PDF Page 142).', category: 'VERIFICATION' },
    { time: '12:44:10 Today', user: 'System Agent', action: 'Ingested PDF Document', detail: 'Unilever_Annual_Report_and_Accounts_2025.pdf (184 pages).', category: 'INGESTION' },
    { time: '11:15:00 Today', user: 'Sarah Jenkins', action: 'Identity Reconciled', detail: 'Assets = Liabilities + Equity identity checked ($0 variance).', category: 'RECONCILIATION' },
    { time: '09:30:22 Today', user: 'Steve Stein, CPA', action: 'User Sign In', detail: 'Authenticated via Dev Mode Quick PIN (Lead CPA Partner).', category: 'AUTH' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Trail & Security Activity Log</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Immutable Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete Audit History & System Telemetry Log for Unilever PLC
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            SYSTEM TELEMETRY & EVENT LOG
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">TIMESTAMP</th>
                <th className="py-3 px-6">ACTOR</th>
                <th className="py-3 px-6">ACTION</th>
                <th className="py-3 px-6">DETAILS</th>
                <th className="py-3 px-6 text-right">CATEGORY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 cursor-pointer">
                  <td className="py-3.5 px-6 text-slate-400">{log.time}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{log.user}</td>
                  <td className="py-3.5 px-6 text-blue-600 font-bold">{log.action}</td>
                  <td className="py-3.5 px-6 text-slate-600">{log.detail}</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {log.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
