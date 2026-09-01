import React from 'react';
import { Users, UserPlus, Shield, CheckCircle2 } from 'lucide-react';

export const UsersTeamsView: React.FC = () => {
  const users = [
    { name: 'Steve Stein, CPA', email: 'stevestein4454@gmail.com', role: 'Lead CPA Partner', org: 'Eve CPA & Advisory', status: 'ACTIVE' },
    { name: 'Sarah Jenkins', email: 's.jenkins@evecpa.com', role: 'Senior Audit Manager', org: 'Eve CPA & Advisory', status: 'ACTIVE' },
    { name: 'Audit Reviewer', email: 'reviewer@client.com', role: 'Guest Reviewer', org: 'Unilever Audit Committee', status: 'INVITED' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Users, Roles & Team Access Control</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit Team Members & Granular Permission Management
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {users.map((u, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{u.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {u.status}
              </span>
            </div>

            <p className="text-xs text-slate-500">{u.email}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-blue-600 flex items-center gap-1">
                <Shield className="w-3 h-3" /> {u.role}
              </span>
              <span className="text-slate-400">{u.org}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
