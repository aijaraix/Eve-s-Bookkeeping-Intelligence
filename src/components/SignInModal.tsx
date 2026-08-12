import React, { useState, useEffect } from 'react';
import { Mail, Lock, Sparkles, X, ShieldCheck, ArrowRight, CheckCircle2, User, Eye, EyeOff, KeyRound, Check, Loader2 } from 'lucide-react';
import { EvesLogo } from './EvesLogo';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from '../firebase';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
  onSignIn: (email: string) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onSignIn,
}) => {
  const [mode, setMode] = useState<'google' | 'email'>('google');
  const [emailTabMode, setEmailTabMode] = useState<'signin' | 'register'>('signin');
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailInput, setEmailInput] = useState(currentUserEmail || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Check for Google OAuth redirect result and listen to Auth state changes on mount
  useEffect(() => {
    if (isOpen) {
      // 1. Listen for background auth state changes (e.g. from popups or redirects finishing)
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email) {
          onSignIn(user.email.toLowerCase());
          setSuccessMsg(`Signed in as ${user.email}`);
          setTimeout(() => onClose(), 600);
        }
      });

      // 2. Process redirect result if coming back from OAuth redirect
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user && result.user.email) {
            onSignIn(result.user.email.toLowerCase());
            setSuccessMsg(`Signed in with Google as ${result.user.email}`);
            setTimeout(() => onClose(), 600);
          }
        })
        .catch((err) => {
          console.warn("Firebase OAuth redirect result error:", err);
          if (err?.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            setErrorMsg(`Domain '${domain}' is not authorized in Firebase Console. Please add '${domain}' under Firebase Console > Authentication > Settings > Authorized Domains.`);
          }
        });

      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        onSignIn(result.user.email.toLowerCase());
        setSuccessMsg(`Signed in with Google as ${result.user.email}`);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: any) {
      console.warn("Firebase Google popup error:", err);
      // Check if user actually got logged in
      if (auth.currentUser && auth.currentUser.email) {
        onSignIn(auth.currentUser.email.toLowerCase());
        setSuccessMsg(`Signed in as ${auth.currentUser.email}`);
        setTimeout(() => onClose(), 600);
        return;
      }
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setErrorMsg(`Domain '${domain}' is not authorized for Google OAuth in Firebase Console. Please add '${domain}' to Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (code === 'auth/argument-error') {
        // Session or provider parameters needed re-initialization
        setErrorMsg('Sign-in session ready. Please click "Sign in with Google" again.');
      } else if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Fallback to signInWithRedirect if popup is blocked
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.warn("Firebase Google redirect error:", redirectErr);
          setErrorMsg('Sign-in popup was blocked or closed. Please allow popups or switch to the Email / Password tab.');
        }
      } else if (msg.includes('closing') || msg.includes('closed') || msg.includes('database')) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (_redErr) {
          setErrorMsg('Mobile browser storage busy. Please try again or switch to the Email / Password tab.');
        }
      } else {
        const cleanMsg = msg.replace(/^Firebase:\s*/i, '').replace(/\(auth\/[^)]+\)\.?/i, '').trim();
        setErrorMsg(cleanMsg || 'Google Sign-In failed. Please try again or switch to Email / Password tab.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid work or corporate email address.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCred = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      if (userCred.user && userCred.user.email) {
        setSuccessMsg('Firebase Authentication successful!');
        onSignIn(userCred.user.email.toLowerCase());
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      console.error("Firebase Email Sign-In error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Please verify your credentials or create a new account.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Firebase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please provide your First Name and Last Name.');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCred = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      if (userCred.user && userCred.user.email) {
        setSuccessMsg('Account created with Firebase Authentication!');
        setTimeout(() => {
          onSignIn(userCred.user.email!.toLowerCase());
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error("Firebase Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered in Firebase. Try signing in instead.');
      } else {
        setErrorMsg(err.message || 'Firebase Registration error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setSuccessMsg(`Firebase password reset link sent to ${resetEmail}.`);
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      console.error("Firebase Password Reset error:", err);
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-neutral-900 space-y-6 relative overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <EvesLogo variant="emblem" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-neutral-900 leading-tight">EVE's Bookkeeping</h2>
            <p className="text-[11px] text-neutral-500 font-mono font-bold">Firebase Authorized Access</p>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-2xl bg-neutral-100 p-1 border border-neutral-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('google'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'google' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setMode('email'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'email' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email / Password</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* GOOGLE OAUTH MODE - CLEAN & PRIVATE */}
        {mode === 'google' && (
          <div className="space-y-5 text-center py-2">
            <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl text-xs text-blue-900 space-y-1.5 text-left">
              <p className="font-extrabold flex items-center gap-1.5 text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Firebase OAuth 2.0 Authorization</span>
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Authenticates via Firebase Auth project (gen-lang-client-0854816255). Secure token generation and workspace access.
              </p>
            </div>

            {/* Main Google Sign In Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleFirebaseGoogleSignIn}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold py-3.5 px-4 rounded-2xl border-2 border-neutral-300 hover:border-neutral-900 shadow-sm transition flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                {isLoading ? 'Authorizing with Firebase...' : 'Sign in with Google'}
              </span>
            </button>

            <span className="text-[11px] text-neutral-400 font-mono font-medium block">
              Powered by Firebase Authentication
            </span>
          </div>
        )}

        {/* EMAIL / PASSWORD MODE */}
        {mode === 'email' && (
          <div className="space-y-4">
            {/* Sub-toggle: Sign In vs Create Account */}
            <div className="flex border-b border-neutral-200 text-xs font-bold text-neutral-500 pb-2">
              <button
                type="button"
                onClick={() => { setEmailTabMode('signin'); setErrorMsg(''); setShowForgotPassword(false); }}
                className={`pb-2 border-b-2 font-bold px-1 transition cursor-pointer mr-4 ${
                  emailTabMode === 'signin' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setEmailTabMode('register'); setErrorMsg(''); setShowForgotPassword(false); }}
                className={`pb-2 border-b-2 font-bold px-1 transition cursor-pointer ${
                  emailTabMode === 'register' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* FORGOT PASSWORD MODAL/VIEW */}
            {showForgotPassword ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-1">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
                  Enter your registered work email address and Firebase will send you a password reset verification link.
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="e.g. user@company.com"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send Reset Link</span>
                  </button>
                </div>
              </form>
            ) : emailTabMode === 'signin' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Corporate / Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="e.g. user@firm.com"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-10 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* CREATE ACCOUNT / REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-800">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Steve"
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-800">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="e.g. Stein"
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-800">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="e.g. steve@firm.com"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-800">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-10 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-800">Reconfirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={e => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-10 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Account & Register</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

