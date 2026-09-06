import React from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { Users, Shield } from 'lucide-react';

export interface UsersAccessViewProps {
  onNavigate: (viewId: string) => void;
}

export const UsersAccessView: React.FC<UsersAccessViewProps> = () => {
  const users = [
    { name: 'Steve Stein, CPA', email: 'stevestein4454@gmail.com', role: 'Lead Audit Partner', status: 'ACTIVE' },
    { name: 'Hermes Swarm Agent Daemon', email: 'agent-hermes@eve.internal', role: 'Autonomous CPA Agent', status: 'ACTIVE' },
    { name: 'Minerva Examiner', email: 'agent-minerva@eve.internal', role: 'Quality Assurance & Evaluation', status: 'ACTIVE' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <EvePageHeader
        category="Administration"
        title="Users, Roles & Access Control"
        description="Role-based access control (RBAC) across engagement teams, review partners, and autonomous agent service accounts."
      />

      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Authorized Engagement Personnel</EveCardTitle>
        </EveCardHeader>
        <EveCardContent className="p-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">User / Agent</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Access Level</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-3 px-5 font-semibold text-slate-900">
                    <div>{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">{u.role}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">FULL_SIGNING_AUTHORITY</td>
                  <td className="py-3 px-5 text-right">
                    <EveStatusBadge status="clean" label={u.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
