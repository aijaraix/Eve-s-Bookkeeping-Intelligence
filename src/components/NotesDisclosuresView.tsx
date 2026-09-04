import React, { useState } from 'react';
import { BookOpen, Search, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

const notesList = [
  {
    number: 'Note 1',
    title: 'Accounting Policies & Basis of Preparation',
    category: 'General',
    page: 92,
    snippet: 'The consolidated financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the IASB.',
    status: 'Verified',
  },
  {
    number: 'Note 3',
    title: 'Gross Turnover & Segmental Reporting',
    category: 'Revenue',
    page: 98,
    snippet: 'Turnover comprises Beauty & Wellbeing (€13,105M), Personal Care (€14,210M), Home Care (€12,850M), Nutrition (€13,420M), and Ice Cream (€7,227M). Total: €60,812M.',
    status: 'Verified',
  },
  {
    number: 'Note 10',
    title: 'Property, Plant and Equipment (PPE)',
    category: 'Balance Sheet',
    page: 100,
    snippet: 'Additions during 2024 were €1,720M. Depreciation charged to operating profit was €1,450M.',
    status: 'Verified',
  },
  {
    number: 'Note 15',
    title: 'Lease Liabilities & Capitalized Obligations',
    category: 'Liabilities',
    page: 101,
    snippet: 'Total lease liabilities amounted to €2,410M for the prior comparative year (FY2023 restated from €2,396M following IFRS 16 scope revision).',
    status: 'Flagged (Discrepancy Verified)',
  },
  {
    number: 'Note 17',
    title: 'Financial Instruments & Net Debt',
    category: 'Financing',
    page: 103,
    snippet: 'Total financial liabilities were €27,400M offset by cash and cash equivalents of €4,680M yielding net debt of €22,720M.',
    status: 'Verified',
  },
];

export const NotesDisclosuresView: React.FC = () => {
  const { setIsCopilotOpen } = usePractice();
  const [selectedNote, setSelectedNote] = useState(notesList[3]);

  return (
    <div id="notes-disclosures-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Notes & Statutory Disclosures</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Footnotes extracted and normalized across accounting policies, debt covenants, and segmentations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Navigation List */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
            Extracted Footnotes ({notesList.length})
          </div>
          {notesList.map((n) => (
            <button
              key={n.number}
              onClick={() => setSelectedNote(n)}
              className={`w-full text-left p-3 rounded-lg border text-xs transition cursor-pointer ${
                selectedNote.number === n.number
                  ? 'bg-slate-800 border-cyan-500 text-white'
                  : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">{n.number}</span>
                <span className="text-[10px] text-slate-500 font-mono">p. {n.page}</span>
              </div>
              <div className="font-semibold text-slate-200 mt-1">{n.title}</div>
            </button>
          ))}
        </div>

        {/* Selected Note Content */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedNote.number}</span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedNote.title}</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
                Category: {selectedNote.category} • Page {selectedNote.page}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-serif text-sm leading-relaxed text-slate-200">
              {selectedNote.snippet}
            </div>

            <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Hermes Swarm Reconciliation: </span>
              <span className="text-emerald-400 font-semibold">{selectedNote.status}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-400">Want deeper forensic evaluation of this disclosure?</span>
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze with Eve Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
