import React, { useState } from 'react';
import {
  Sliders,
  Building,
  ShieldCheck,
  Cpu,
  Bell,
  Key,
  Database,
  Sparkles,
  Globe,
  Lock,
  Save,
  Info,
  Check,
  RefreshCw,
  Zap,
  UserCheck,
  Smartphone,
  Mail,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  onNavigate?: (view: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'accounting' | 'ai' | 'security' | 'integrations' | 'notifications'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerComingSoon = (featureName?: string) => {
    const msg = featureName
      ? `Coming Soon — "${featureName}" will be customizable in an upcoming release.`
      : 'Coming Soon — Settings modification is disabled in this preview environment.';
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const tabs = [
    { id: 'general', label: 'Organization & Firm', icon: Building },
    { id: 'accounting', label: 'Accounting & Compliance', icon: Database },
    { id: 'ai', label: 'AI & Copilot Rules', icon: Sparkles },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'integrations', label: 'Integrations & APIs', icon: Zap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification for Coming Soon */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b1739] text-white border border-indigo-500/40 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-300">Feature Status</p>
            <p className="text-xs font-medium text-slate-200 mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0b1739] via-[#12224d] to-[#1e2e5c] rounded-2xl p-6 text-white shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-300 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-mono font-semibold">
              <Sliders className="w-3.5 h-3.5" />
              <span>System Configuration Hub</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Platform Settings & Controls</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Configure firm-wide defaults, accounting standards, AI copilot parameters, and security policies.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => triggerComingSoon('Reset Settings')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              onClick={() => triggerComingSoon('Save Configuration')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Info Banner inside Hero */}
        <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center space-x-2 text-[11px] text-amber-200 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Preview Note:</strong> Interactive setting options below are currently in preview mode. Click any control to test interactions — all changes will display a "Coming Soon" status message.
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#0b1739] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization & Firm */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Firm Profile & Identity</h3>
                  <p className="text-xs text-slate-500">Official practice details for client reports and deliverables.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  Coming Soon
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Firm Name</label>
                  <input
                    type="text"
                    defaultValue="Eve's Bookkeeping & Advisory Services LLC"
                    onClick={() => triggerComingSoon('Firm Name')}
                    readOnly
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / EIN</label>
                  <input
                    type="text"
                    defaultValue="XX-XXX9842"
                    onClick={() => triggerComingSoon('Tax ID')}
                    readOnly
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Office Location</label>
                  <input
                    type="text"
                    defaultValue="New York, NY 10001 • United States"
                    onClick={() => triggerComingSoon('Office Location')}
                    readOnly
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact Email</label>
                  <input
                    type="email"
                    defaultValue="admin@evesbookkeeping.com"
                    onClick={() => triggerComingSoon('Contact Email')}
                    readOnly
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Regional & Localization Preferences</h3>
                  <p className="text-xs text-slate-500">Default currencies, number formatting, and reporting timezone.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  Coming Soon
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
                  <select
                    onChange={() => triggerComingSoon('Base Currency')}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Format</label>
                  <select
                    onChange={() => triggerComingSoon('Date Format')}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Timezone</label>
                  <select
                    onChange={() => triggerComingSoon('Timezone')}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="EST">Eastern Time (US & Canada)</option>
                    <option value="CST">Central Time (US & Canada)</option>
                    <option value="PST">Pacific Time (US & Canada)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">License & Subscriptions</h3>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">Enterprise Audit Tier</span>
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-600">Unlimited engagements, Hermes AI copilot, and automated report generation.</p>
                <div className="text-[10px] text-indigo-700 font-medium pt-1">Renews: Dec 31, 2026</div>
              </div>
              <button
                onClick={() => triggerComingSoon('Manage Billing')}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                Manage Billing & Seats
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brand Customization</h3>
              <p className="text-xs text-slate-500">Upload your firm logo and primary brand colors for executive deliverables.</p>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Building className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-semibold text-slate-700">Drag & Drop Firm Logo</p>
                <button
                  onClick={() => triggerComingSoon('Upload Firm Logo')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                >
                  Browse Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Accounting & Compliance */}
      {activeTab === 'accounting' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Accounting Frameworks & Rules</h3>
              <p className="text-xs text-slate-500">Define global GAAP, IFRS, and materiality calculation thresholds.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Default Accounting Standard</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-md">Enforced</span>
              </div>
              <p className="text-xs text-slate-600">Choose the primary accounting framework applied during automated trial balance reconciliation.</p>
              <div className="space-y-2 pt-1">
                <label
                  onClick={() => triggerComingSoon('US GAAP Standard')}
                  className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
                >
                  <input type="radio" name="framework" defaultChecked readOnly className="accent-indigo-600" />
                  <span>US GAAP (Financial Accounting Standards Board - FASB)</span>
                </label>
                <label
                  onClick={() => triggerComingSoon('IFRS Standard')}
                  className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
                >
                  <input type="radio" name="framework" readOnly className="accent-indigo-600" />
                  <span>IFRS (International Financial Reporting Standards)</span>
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Planning Materiality Threshold</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-md border border-indigo-200">
                  Auto-Calculated
                </span>
              </div>
              <p className="text-xs text-slate-600">Base percentage applied to total revenues or gross assets to flag material misstatements.</p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Revenue Benchmark (% of Gross Revenue):</span>
                  <span className="font-mono text-indigo-600">1.50%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.25"
                  defaultValue="1.5"
                  onChange={() => triggerComingSoon('Materiality Percentage')}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Fiscal Year End Month</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600">Default fiscal year closing period for newly onboarded client entities.</p>
              <select
                onChange={() => triggerComingSoon('Fiscal Year End')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="12">December 31 (Calendar Year)</option>
                <option value="3">March 31 (Q1 Fiscal)</option>
                <option value="6">June 30 (Mid Year)</option>
                <option value="9">September 30 (Q3 Fiscal)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Multi-Entity Consolidation</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600">Automated intercompany elimination rules and currency conversion.</p>
              <button
                onClick={() => triggerComingSoon('Configure Elimination Rules')}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition cursor-pointer"
              >
                Configure Elimination Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI & Copilot Rules */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Hermes AI & CPA Rule Settings</span>
              </h3>
              <p className="text-xs text-slate-500">Fine-tune automated reasoning, verification strictness, and document extraction.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">Automatic Anomaly Detection</p>
                <p className="text-xs text-slate-500 mt-0.5">Scan journal entries for Benford's Law deviations, weekend postings, and unusual round-dollar amounts.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('Automatic Anomaly Detection')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">Auto-Draft Deliverable Narratives</p>
                <p className="text-xs text-slate-500 mt-0.5">Allow Hermes to generate executive commentary and variance analysis drafts automatically.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('Auto-Draft Narratives')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">Strict CPA Rule Verification</p>
                <p className="text-xs text-slate-500 mt-0.5">Require mandatory audit trail citations for all AI-generated findings before publishing.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('Strict Verification')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Model Sensitivity Level</p>
                  <p className="text-xs text-slate-500 mt-0.5">Adjust confidence threshold required for flagging potential audit risks.</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 font-mono">Balanced (75% Confidence)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerComingSoon('Conservative Model')}
                  className="py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Conservative (90%)
                </button>
                <button
                  onClick={() => triggerComingSoon('Balanced Model')}
                  className="py-2 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 cursor-pointer"
                >
                  Balanced (75%)
                </button>
                <button
                  onClick={() => triggerComingSoon('Aggressive Model')}
                  className="py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Comprehensive (50%)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Access */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Security, Compliance & Access Control</span>
              </h3>
              <p className="text-xs text-slate-500">SOC 2 Type II audit logging, MFA enforcement, and document encryption standards.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Enforce Multi-Factor Authentication (MFA)</span>
              </div>
              <p className="text-xs text-slate-500">Require TOTP or Hardware Key verification for all engagement team members.</p>
              <button
                onClick={() => triggerComingSoon('MFA Policy')}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
              >
                Configure MFA Policy
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Session Inactivity Timeout</span>
              </div>
              <p className="text-xs text-slate-500">Automatically lock active sessions after period of inactivity.</p>
              <select
                onChange={() => triggerComingSoon('Session Timeout')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="60">1 Hour</option>
                <option value="240">4 Hours</option>
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SHA-256 Checksum Verification</span>
              </div>
              <p className="text-xs text-slate-500">Verify hash integrity for all uploaded PDFs and Excel workbooks.</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-700 font-medium">Status: Active</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">ENFORCED</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Data Retention Policy</span>
              </div>
              <p className="text-xs text-slate-500">Specify workpaper retention lifecycle before archival or purging.</p>
              <select
                onChange={() => triggerComingSoon('Data Retention')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="7">7 Years (PCAOB Standard)</option>
                <option value="10">10 Years (Tax & Corporate)</option>
                <option value="indefinite">Indefinite Retention</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Integrations & APIs */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>External Software Bridges & API Connectors</span>
              </h3>
              <p className="text-xs text-slate-500">Sync ledgers automatically from QuickBooks, Xero, NetSuite, and Excel.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  QBO
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">QuickBooks Online Sync</p>
                  <p className="text-[11px] text-slate-500">Direct OAuth2 API bridge for chart of accounts & transactions.</p>
                </div>
              </div>
              <button
                onClick={() => triggerComingSoon('QuickBooks Integration')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shrink-0"
              >
                Connect
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                  XERO
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Xero Accounting Bridge</p>
                  <p className="text-[11px] text-slate-500">Real-time ledger fetching and trial balance imports.</p>
                </div>
              </div>
              <button
                onClick={() => triggerComingSoon('Xero Integration')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shrink-0"
              >
                Connect
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0">
                  NS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Oracle NetSuite ERP</p>
                  <p className="text-[11px] text-slate-500">Enterprise SOAP/REST API connection for multi-entity ledgers.</p>
                </div>
              </div>
              <button
                onClick={() => triggerComingSoon('NetSuite ERP Integration')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shrink-0"
              >
                Configure
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                  API
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Developer Webhooks & API Keys</p>
                  <p className="text-[11px] text-slate-500">REST API keys for custom data ingestion and event triggers.</p>
                </div>
              </div>
              <button
                onClick={() => triggerComingSoon('Developer API Keys')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer shrink-0"
              >
                Manage Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Alerts, Emails & Team Notifications</span>
              </h3>
              <p className="text-xs text-slate-500">Configure real-time audit alerts, partner sign-off notifications, and weekly digests.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">High-Risk Anomaly Immediate Email Alert</p>
                <p className="text-xs text-slate-500 mt-0.5">Send instant notifications when material weaknesses or Fraud alerts are flagged.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('High-Risk Email Alert')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">Weekly Executive Audit Digest</p>
                <p className="text-xs text-slate-500 mt-0.5">Receive a Monday morning summary of project progress, findings, and deliverable status.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('Weekly Executive Digest')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-bold text-slate-900">Deliverable Approval Request Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Alert managing partners when AI deliverables transition to "Awaiting Approval" status.</p>
              </div>
              <button
                onClick={() => triggerComingSoon('Approval Request Notifications')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
