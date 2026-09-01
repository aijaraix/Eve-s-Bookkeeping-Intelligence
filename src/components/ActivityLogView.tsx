import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const ActivityLogView: React.FC = () => {
  const { auditLogs, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Trail & Security Activity Log</h2>
        <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY}</p>
      </div>
      {auditLogs.length === 0 ? (
        <EmptyExtractionState title="No activity yet" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">TIMESTAMP</th>
                <th className="py-3 px-6">ACTOR</th>
                <th className="py-3 px-6">ACTION</th>
                <th className="py-3 px-6">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="border-t border-slate-100">
                  <td className="py-3 px-6 text-slate-400">{log.timestamp || log.createdAt || EMPTY_DISPLAY}</td>
                  <td className="py-3 px-6 font-bold">{log.actor || log.user || log.agent || EMPTY_DISPLAY}</td>
                  <td className="py-3 px-6 text-blue-600 font-bold">{log.action || EMPTY_DISPLAY}</td>
                  <td className="py-3 px-6 text-slate-600">{log.details || log.detail || EMPTY_DISPLAY}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
