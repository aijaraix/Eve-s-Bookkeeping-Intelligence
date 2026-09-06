import React from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { DEMO_USERS } from './LoginModal';

export const UsersTeamsView: React.FC = () => {
  const { userSession } = usePractice();
  const users = [
    userSession,
    ...DEMO_USERS.filter((u) => u.email !== userSession.email).slice(0, 2)
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Users, Roles & Team Access Control</h2>
          <p className="text-xs text-slate-500 mt-1">Authenticated practice users — not a financial fact source</p>
        </div>
        <button className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <UserPlus className="w-3.5 h-3.5" />
          Invite Team Member
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {users.map((u) => (
          <div key={u.email} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900">{u.name}</span>
            <p className="text-xs text-slate-500">{u.email}</p>
            <span className="font-bold text-blue-600 text-xs flex items-center gap-1">
              <Shield className="w-3 h-3" /> {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
