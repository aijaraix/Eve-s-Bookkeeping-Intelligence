import React from 'react';
import { Workspace } from '../types';
import { EvesLogo } from './EvesLogo';
import { Building2, FileText, BarChart3, Network, CheckSquare, ShieldCheck, MessageSquareText, Download, LogOut, LogIn, PlusCircle, Sparkles, Bot, FolderKanban, X, UserCheck, Globe, Coins } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace) => void;
  onNewWorkspace: () => void;
  onCloseProject: () => void;
  onLogout: () => void;
  userEmail: string | null;
  onOpenSignIn: () => void;
  globalCurrency: string;
  setGlobalCurrency: (currency: string) => void;
  globalLanguage: string;
  setGlobalLanguage: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  onNewWorkspace,
  onCloseProject,
  onLogout,
  userEmail,
  onOpenSignIn,
  globalCurrency,
  setGlobalCurrency,
  globalLanguage,
  setGlobalLanguage,
}) => {
  // Project-specific view IDs
  const isGlobalView = currentView === 'landing' || currentView === 'projects' || currentView === 'evolution';

  const projectNavItems = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'financial', label: 'Financials & Analytics', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'relationships', label: 'Relationships', icon: Network },
    { id: 'review', label: 'Review Center', icon: CheckSquare },
    { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
    { id: 'chat', label: 'Ask EVE AI', icon: MessageSquareText },
    { id: 'reports', label: 'Reports & Export', icon: Download },
  ];

  return (
    <header className="bg-white text-neutral-900 border-b border-neutral-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-6">
            <EvesLogo variant="horizontal" size="md" onClick={() => setCurrentView('projects')} />

            {/* Global Nav Links (Project Library) */}
            <div className="hidden md:flex items-center space-x-2 border-l border-neutral-200 pl-6">
              <button
                onClick={() => setCurrentView('projects')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                  currentView === 'projects'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                <span>Project Library ({workspaces.length})</span>
              </button>
            </div>
          </div>

          {/* Right Header Section: Currency, Language, Active Project indicator & User Sign In Gating */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Global Currency & Language Selectors */}
            <div className="hidden lg:flex items-center space-x-2 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
              <div className="flex items-center space-x-1 pl-1 text-neutral-600">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={globalCurrency}
                  onChange={(e) => setGlobalCurrency(e.target.value)}
                  className="bg-white text-xs font-mono font-bold text-neutral-900 border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none focus:border-neutral-900 cursor-pointer shadow-2xs"
                  title="Global Currency Toggle"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 pl-1 text-neutral-600 border-l border-neutral-200">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={globalLanguage}
                  onChange={(e) => setGlobalLanguage(e.target.value)}
                  className="bg-white text-xs font-semibold text-neutral-900 border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none focus:border-neutral-900 cursor-pointer shadow-2xs"
                  title="Global Language Switcher"
                >
                  <option value="en">EN (English)</option>
                  <option value="es">ES (Español)</option>
                  <option value="de">DE (Deutsch)</option>
                  <option value="fr">FR (Français)</option>
                  <option value="ja">JA (日本語)</option>
                  <option value="pt">PT (Português)</option>
                  <option value="zh">ZH (中文)</option>
                  <option value="it">IT (Italiano)</option>
                </select>
              </div>
            </div>

            {!isGlobalView && activeWorkspace ? (
              <div className="flex items-center space-x-3 bg-neutral-50 px-3.5 py-1.5 rounded-xl border border-neutral-300">
                <div className="text-xs">
                  <span className="text-neutral-500 text-[10px] uppercase font-bold block">Active Entity:</span>
                  <span className="font-bold text-neutral-900 truncate max-w-[160px] inline-block">{activeWorkspace.name}</span>
                </div>
                
                <button
                  onClick={onCloseProject}
                  className="p-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition"
                  title="Close Project & Return to Library"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onNewWorkspace}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Upload & New Audit</span>
              </button>
            )}

            {/* User Account / Sign In Control */}
            {userEmail ? (
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase leading-none">CPA Auditor:</span>
                  <span className="font-mono text-neutral-800 text-[11px] truncate max-w-[140px] inline-block">{userEmail}</span>
                </div>
                <button
                  onClick={onOpenSignIn}
                  className="p-1 text-neutral-500 hover:text-neutral-900 transition"
                  title="Switch Account"
                >
                  <LogIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-1 text-neutral-500 hover:text-rose-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSignIn}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Nav Row: Project Tabs (ONLY when inside a project) */}
        {!isGlobalView && activeWorkspace && (
          <div className="flex space-x-1 overflow-x-auto py-2.5 scrollbar-none border-t border-neutral-200">
            {projectNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};
