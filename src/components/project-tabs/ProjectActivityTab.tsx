import React, { useMemo } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import { Clock, Filter, User, Sparkles, FileText } from 'lucide-react';

interface ProjectActivityTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

export const ProjectActivityTab: React.FC<ProjectActivityTabProps> = ({
  workspace,
  documents
}) => {
  const activityTrail = useMemo(() => {
    return (documents || []).map((doc) => ({
      time: doc.createdAt || '',
      actor: (doc as any).uploadedBy || workspace.userEmail || 'Authenticated user',
      role: 'User',
      action: 'Uploaded source file',
      object: doc.originalName || doc.filename,
      oldVal: '—',
      newVal: doc.status || 'Queued',
      reason: doc.summary || 'Document upload'
    }));
  }, [documents, workspace.userEmail]);

  return (
    <div className="space-y-6 pt-2">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-black text-slate-900 uppercase text-[10px]">Activity</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">{activityTrail.length} recorded event(s)</span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        {activityTrail.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold">No activity recorded.</p>
            <p className="text-slate-400">Uploads and extraction events will appear here. Names are not invented.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-2">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-2 font-mono">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activityTrail.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{act.time || '—'}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{act.actor}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-800">{act.action}</td>
                    <td className="py-3 px-3 text-slate-900 font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {act.object}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-600">{act.newVal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
