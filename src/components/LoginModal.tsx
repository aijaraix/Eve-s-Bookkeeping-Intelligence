import React, { useState } from 'react';
import { Shield, KeyRound, Lock, User, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  currentSession: UserSession | null;
}

export const DEMO_USERS: Array<Omit<UserSession, 'isAuthenticated'>> = [
  {
    id: 'user-cpa-1',
    email: 'stevestein4454@gmail.com',
    name: 'Steve Stein, CPA',
    role: 'CPA Lead Partner',
    organization: 'Stein & Associates Audit LLP',
    pinCode: '1234'
  },
  {
    id: 'user-cpa-2',
    email: 'sarah.jenkins@unilever-audit.com',
    name: 'Sarah Jenkins',
    role: 'Senior Audit Manager',
    organization: 'Unilever Global Financial Reporting',
    pinCode: '9999'
  },
  {
    id: 'user-cpa-3',
    email: 'reviewer@aicpa-studio.com',
    name: 'Audit Reviewer',
    role: 'Guest Reviewer',
    organization: 'External Oversight Board',
    pinCode: '0000'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentSession
}) => {
  const [authMode, setAuthMode] = useState<'PIN' | 'EMAIL'>('PIN');
  const [pinInput, setPinInput] = useState('');
  const [emailInput, setEmailInput] = useState('stevestein4454@gmail.com');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickPinLogin = (pinToUse?: string) => {
    const targetPin = pinToUse || pinInput;
    if (!targetPin) {
      // Default dev bypass
      const defaultUser = DEMO_USERS[0];
      onLoginSuccess({ ...defaultUser, isAuthenticated: true });
      setErrorMsg(null);
      onClose();
      return;
    }

    const matchedUser = DEMO_USERS.find(u => u.pinCode === targetPin) || DEMO_USERS[0];
    onLoginSuccess({
      ...matchedUser,
      isAuthenticated: true
    });
    setErrorMsg(null);
    onClose();
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    const matched = DEMO_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase()) || {
      id: 'custom-user',
      email: emailInput,
      name: (emailInput || '').split('@')[0].toUpperCase() + ' (CPA)',
      role: 'CPA Lead Partner' as const,
      organization: 'Audit Intelligence Workspace'
    };

    onLoginSuccess({
      ...matched,
      isAuthenticated: true
    });
    setErrorMsg(null);
    onClose();
  };

  const handleSelectDemoUser = (user: typeof DEMO_USERS[0]) => {
    setEmailInput(user.email);
    setPinInput(user.pinCode || '1234');
    onLoginSuccess({
      ...user,
      isAuthenticated: true
    });
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">AI CPA Studio Sign In</h2>
              <p className="text-xs text-blue-100 font-mono">Development Access & PIN Bypass Enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => { setAuthMode('PIN'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                authMode === 'PIN' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
              Quick PIN / Dev Bypass
            </button>
            <button
              onClick={() => { setAuthMode('EMAIL'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                authMode === 'EMAIL' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />
              Email & Password
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PIN / Quick Bypass Form */}
          {authMode === 'PIN' ? (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Instant Building Access
                </div>
                <p className="text-blue-800/80 leading-relaxed">
                  During development, enter PIN <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-blue-700 font-bold">1234</code> or click the button below to sign in instantly as CPA Lead Partner.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter 4-Digit Security PIN:
                </label>
                <div className="flex gap-2 justify-between">
                  {['1', '2', '3', '4'].map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={pinInput[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newPin = pinInput.substring(0, idx) + val + pinInput.substring(idx + 1);
                        setPinInput(newPin);
                        if (newPin.length === 4) {
                          handleQuickPinLogin(newPin);
                        }
                      }}
                      placeholder={digit}
                      className="w-16 h-12 text-center text-lg font-mono font-bold text-blue-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleQuickPinLogin(pinInput || '1234')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In with PIN (or Auto-Bypass)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Email & Password Form */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPA / User Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@audit-firm.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authorize & Enter Studio</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Select Demo Accounts */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Select Preset Roles:
            </span>
            <div className="space-y-1.5">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectDemoUser(user)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{user.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{user.role} — {user.organization}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    PIN: {user.pinCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
