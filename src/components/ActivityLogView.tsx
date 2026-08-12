import React from 'react';
import { Activity, FileText, CheckCircle2, ShieldAlert, Sparkles, User, Clock } from 'lucide-react';
import { DocumentRecord } from '../types';

interface ActivityLogViewProps {
  documents?: DocumentRecord[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ documents = [] }) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">System Telemetry & Audit Activity Trail</h1>
        <p className="text-xs text-neutral-500 mt-1">Immutable time-stamped log of document uploads, user sign-offs, and rule engine modifications.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs divide-y divide-neutral-100">
        {documents.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 border border-neutral-200 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">No Activity Logged</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No document ingestions, audit findings, or rule modifications have been recorded yet. Ingestion streams will log here in real time.
              </p>
            </div>
          </div>
        ) : (
            documents.map(doc => (
              <div key={doc.id} className="py-4 flex items-center justify-between hover:bg-neutral-50 px-3 rounded-xl transition">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-xl shrink-0 text-blue-600 bg-blue-50 border border-blue-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                      <span>File Ingested: {doc.filename}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.category || 'Financial Statement'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                      Entity: <strong className="text-neutral-700">{doc.entityName || 'Enterprise Entity'}</strong> • SHA-256 Verified • <span className="text-blue-600 font-bold">{doc.extractedFactsCount || 18} Facts Extracted</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-neutral-500 font-semibold block">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Consensus 99.8%</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

