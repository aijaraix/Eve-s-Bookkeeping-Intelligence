import React from 'react';
import { cn } from '../../lib/utils';
import {
  Search,
  UploadCloud,
  Bot,
  Globe2,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  User,
  ShieldCheck,
  Sparkles,
  Command
} from 'lucide-react';

export interface AppHeaderProps {
  activeClientName: string;
  activePeriod: string;
  activeCurrency: string;
  presentationCurrencies?: string[];
  onSelectCurrency?: (currency: string) => void;
  onOpenUpload?: () => void;
  onToggleCopilot?: () => void;
  onOpenCommand?: () => void;
  isCopilotOpen?: boolean;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeClientName,
  activePeriod,
  activeCurrency = 'USD',
  presentationCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY'],
  onSelectCurrency,
  onOpenUpload,
  onToggleCopilot,
  onOpenCommand,
  isCopilotOpen = false,
  className
}) => {
  return (
    <header
      className={cn(
        'h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-4 select-none shrink-0 z-10',
        className
      )}
    >
      {/* Left: Context Quick Selectors */}
      <div className="flex items-center gap-2 text-xs">
        {/* Client & Period Pills */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/80 font-medium text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[140px] sm:max-w-[180px] font-semibold">
            {activeClientName || 'Microsoft Corporation'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono text-[11px]">{activePeriod || 'FY2024'}</span>
        </div>

        {/* Presentation Currency Selector */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]">
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Curr:</span>
          <select
            value={activeCurrency}
            onChange={(e) => onSelectCurrency && onSelectCurrency(e.target.value)}
            className="bg-transparent font-bold text-slate-900 border-none outline-hidden cursor-pointer"
          >
            {presentationCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Search / Command Trigger */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search client, metric, document, or command...</span>
          </div>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Upload Button */}
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Intake / Upload</span>
          </button>
        )}

        {/* Copilot Toggle Button */}
        {onToggleCopilot && (
          <button
            type="button"
            onClick={onToggleCopilot}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
              isCopilotOpen
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            )}
            title="Toggle Eve Audit Copilot Workbench"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Copilot</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-700">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
            SS
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-semibold text-slate-900 leading-tight">Steve Stein, CPA</div>
            <div className="text-[10px] text-slate-400">Lead Audit Partner</div>
          </div>
        </div>
      </div>
    </header>
  );
};
