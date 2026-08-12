import React, { useState, useEffect } from 'react';
import { Search, Building2, FolderKanban, FileText, AlertCircle, ArrowRight, X } from 'lucide-react';
import { Workspace, DocumentRecord } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  documents: DocumentRecord[];
  onSelectWorkspace: (ws: Workspace) => void;
  onNavigate: (view: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  documents,
  onSelectWorkspace,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredWorkspaces = workspaces.filter(
    w => w.name.toLowerCase().includes(query.toLowerCase()) || (w.country && w.country.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredDocs = documents.filter(
    d => d.filename.toLowerCase().includes(query.toLowerCase()) || (d.category && d.category.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, projects, documents, or audit findings..."
            className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-medium"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {/* Projects & Workspaces */}
          <div>
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2 flex items-center justify-between">
              <span>Projects & Workspaces ({filteredWorkspaces.length})</span>
              <span className="text-[10px] text-neutral-400 font-normal">Jump to project overview</span>
            </div>
            {filteredWorkspaces.length === 0 ? (
              <p className="text-xs text-neutral-400 italic px-2">No matching projects found</p>
            ) : (
              <div className="space-y-1">
                {filteredWorkspaces.map(ws => (
                  <div
                    key={ws.id}
                    onClick={() => {
                      onSelectWorkspace(ws);
                      onNavigate('overview');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 cursor-pointer group transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition">
                          {ws.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          {ws.country || 'Global Entity'} • Code: {ws.code || 'AUDIT'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingested Documents */}
          <div>
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2">
              <span>Documents ({filteredDocs.length})</span>
            </div>
            {filteredDocs.length === 0 ? (
              <p className="text-xs text-neutral-400 italic px-2">No matching documents found</p>
            ) : (
              <div className="space-y-1">
                {filteredDocs.slice(0, 5).map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onNavigate('documents');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 cursor-pointer group transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-900 truncate max-w-sm">
                          {doc.filename}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {doc.category || 'Financial Statement'} • SHA-256 Verified • {doc.status || 'Processed'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Audited
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Nav Shortcut */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 px-2">
            <span>Press <kbd className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 text-[10px] text-neutral-700">ESC</kbd> to close</span>
            <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => { onNavigate('companies'); onClose(); }}>
              Browse All Companies →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
