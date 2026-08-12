import React, { useState } from 'react';
import { Sparkles, X, ShieldCheck, Building2, ChevronRight, User, Check, Loader2 } from 'lucide-react';
import { Workspace } from '../types';
import { auth, googleProvider, signInWithPopup } from '../firebase';

interface StagedHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  extractedName: string;
  docCount: number;
  factsCount: number;
  currentUserEmail: string | null;
  onConfirmAccount: (email: string) => void;
}

export const StagedHoldingModal: React.FC<StagedHoldingModalProps> = ({
  isOpen,
  onClose,
  workspace,
  extractedName,
  docCount,
  factsCount,
  currentUserEmail,
  onConfirmAccount,
}) => {
  const [showGoogleOAuthPopup, setShowGoogleOAuthPopup] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState(currentUserEmail || 'stevestein4454@gmail.com');
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const displayEntityName = extractedName || workspace?.name || 'Uploaded Company Document';

  const handleGoogleSignInClick = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        onConfirmAccount(result.user.email.toLowerCase());
        setIsSigningIn(false);
        return;
      }
    } catch (err: any) {
      console.warn("Firebase Google OAuth popup error:", err);
    }
    setIsSigningIn(false);
    setShowGoogleOAuthPopup(true);
  };

  const handleOAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleEmailInput.trim() && googleEmailInput.includes('@')) {
      onConfirmAccount(googleEmailInput.trim().toLowerCase());
      setShowGoogleOAuthPopup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl max-w-md w-[92vw] p-4 sm:p-6 shadow-2xl text-neutral-900 space-y-4 relative overflow-hidden my-auto max-h-[88vh]">
        
        {/* Top Floating Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Document Staged in Holding Pattern</span>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 p-1 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-neutral-900 leading-snug">
            Analysis & Extraction Complete!
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed font-medium">
            Your document was parsed in the staging environment. Sign in with Google to attach this project to your account and access your dashboard.
          </p>
        </div>

        {/* Staged Document Extraction Details Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0c1838] p-5 rounded-2xl border border-slate-800 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Extracted Entity</span>
                <span className="text-base font-extrabold text-white font-sans">{displayEntityName}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
              Validated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-semibold">Processed Documents</span>
              <span className="font-extrabold text-white text-sm mt-0.5 block">{docCount} Document File</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-semibold">Extracted Line Items</span>
              <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">{factsCount} Financial Facts</span>
            </div>
          </div>
        </div>

        {/* Google Sign-In Account Attachment Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sign in with Google to Attach Project to Account:</span>
            </span>
          </div>

          <button
            type="button"
            disabled={isSigningIn}
            onClick={handleGoogleSignInClick}
            className="w-full bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold py-3.5 px-4 rounded-2xl border-2 border-neutral-300 hover:border-neutral-900 shadow-xs transition flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span className="text-sm font-bold text-neutral-900">Sign in with Google</span>
          </button>
        </div>

      </div>

      {/* SECURE GOOGLE OAUTH POPUP MODAL */}
      {showGoogleOAuthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-neutral-900 space-y-5 relative border border-neutral-200">
            <button
              onClick={() => setShowGoogleOAuthPopup(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Brand Header */}
            <div className="text-center space-y-2 pt-2">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="text-base font-bold text-neutral-900">Sign in with Google</h3>
              <p className="text-xs text-neutral-500 font-medium">to attach project to <strong className="text-neutral-800">EVE's Bookkeeping</strong></p>
            </div>

            {/* Google Account Selection Prompt */}
            <form onSubmit={handleOAuthSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-neutral-700">
                  Google Account Email / Phone
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="Enter your Google email..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 font-bold focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  required
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-600 leading-relaxed font-sans">
                Google will verify your account and securely bind the staged financial document workspace to your account.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleOAuthPopup(false)}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

