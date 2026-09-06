import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Search, Building2, Briefcase, FileText, CheckSquare, Sparkles, X, ArrowRight } from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'Clients' | 'Engagements' | 'Documents' | 'Metrics' | 'Views';
  title: string;
  subtitle?: string;
  action: () => void;
}

export interface EveCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export const EveCommandDialog: React.FC<EveCommandDialogProps> = ({
  isOpen,
  onClose,
  items
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-xs px-4">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, client, metric, or engagement..."
            className="w-full text-sm text-slate-900 bg-transparent placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 text-xs">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No matching items found for "{query}".
            </div>
          ) : (
            filteredItems.map((item) => {
              let Icon = FileText;
              if (item.category === 'Clients') Icon = Building2;
              if (item.category === 'Engagements') Icon = Briefcase;
              if (item.category === 'Metrics') Icon = Sparkles;
              if (item.category === 'Views') Icon = ArrowRight;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 group cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 block truncate group-hover:text-indigo-600">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with arrows, select with Enter</span>
          <span className="font-mono">Eve Command Engine</span>
        </div>
      </div>
    </div>
  );
};
