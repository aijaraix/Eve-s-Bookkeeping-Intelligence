import React, { useState } from 'react';
import { Users, Mail, Phone, ShieldCheck, UserCheck, Plus } from 'lucide-react';

export const UsersTeamsView: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar: string;
    badge: string;
  }>>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Senior CPA Associate');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    setTeamMembers([...teamMembers, {
      name,
      role,
      email,
      phone: '+1 (555) 019-2831',
      avatar: initials || 'US',
      badge: role.includes('Partner') ? 'Signing Partner' : 'Engagement Team'
    }]);
    setName('');
    setEmail('');
    setShowInviteModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Users & Engagement Teams</h1>
          <p className="text-xs text-neutral-500 mt-1">Audit partners, field seniors, specialists, and role-based permissions matrix.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#0b1739] text-white hover:bg-[#12224d] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-neutral-900">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@cpa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Engagement Partner">Engagement Partner</option>
                  <option value="Senior Audit Manager">Senior Audit Manager</option>
                  <option value="Senior CPA Associate">Senior CPA Associate</option>
                  <option value="IT Audit Specialist">IT Audit Specialist</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200/80 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900">No Custom Team Members Invited</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              You are currently logged in as the master workspace administrator. Click "Invite Team Member" to grant engagement access to audit managers and specialists.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite First Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((m, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {m.avatar}
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-sm">{m.name}</h3>
                  <p className="text-xs text-neutral-500">{m.role}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-neutral-600 pt-3 border-t border-neutral-100 font-mono">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{m.phone}</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {m.badge}
                </span>
                <span className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">Manage Roles →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

