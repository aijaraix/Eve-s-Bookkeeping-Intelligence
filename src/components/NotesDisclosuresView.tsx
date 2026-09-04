import React, { useState } from 'react';
import {
  FileText,
  Search,
  BookOpen,
  Scale,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Building2
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

interface NotesDisclosuresViewProps {
  onInspectMetric?: (metricName: string) => void;
}

export const NotesDisclosuresView: React.FC<NotesDisclosuresViewProps> = ({ onInspectMetric }) => {
  const { companies, selectedCompanyId, facts, documents } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const disclosures = [
    {
      id: 'NOTE-1',
      title: 'Note 1: Significant Accounting Policies',
      category: 'POLICIES',
      page: 84,
      summary: 'Adoption of IFRS standards, revenue recognition timing (IFRS 15 over-time vs point-in-time), and foreign currency translation methods.',
      status: 'VERIFIED'
    },
    {
      id: 'NOTE-3',
      title: 'Note 3: Segment Reporting & Geography',
      category: 'SEGMENTS',
      page: 92,
      summary: 'Disaggregated revenue and operating profit across Europe, North America, and Asia-Pacific. Reconciliation to consolidated operating profit.',
      status: 'VERIFIED'
    },
    {
      id: 'NOTE-12',
      title: 'Note 12: Financial Debt & Maturity Profile',
      category: 'DEBT',
      page: 118,
      summary: 'Bonds, credit facilities, interest rate hedging, and contractual undiscounted cash flow maturities over the next 5 fiscal years.',
      status: 'AUDITED'
    },
    {
      id: 'NOTE-18',
      title: 'Note 18: Effective Income Tax Rate Reconciliation',
      category: 'TAX',
      page: 134,
      summary: 'Reconciliation of the statutory rate to the effective rate, deferred tax assets on loss carryforwards, and uncertain tax positions.',
      status: 'VERIFIED'
    },
    {
      id: 'NOTE-24',
      title: 'Note 24: Commitments, Contingencies & Legal Matters',
      category: 'LEGAL',
      page: 148,
      summary: 'Outstanding litigation claims, environmental remediation guarantees, and capital expenditure commitments contracted for.',
      status: 'REVIEWED'
    },
    {
      id: 'NOTE-31',
      title: 'Note 31: Share Capital & Treasury Share Buybacks',
      category: 'EQUITY',
      page: 162,
      summary: 'Authorized capital, par value per share, buyback program authorizations, repurchased shares held in treasury, and cancellation records.',
      status: 'VERIFIED'
    }
  ].filter((d) => {
    const matchesSearch = !searchTerm || d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>FINANCIAL WORKBENCH — NOTES & DISCLOSURES</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              Notes to the Consolidated Financial Statements
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Forensic disclosure auditing, accounting policy notes, segment breakdowns, debt maturities, and tax reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold">
              {disclosures.length} Notes Indexed
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search note disclosures, policies, debt schedules, or buyback notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'POLICIES', 'SEGMENTS', 'DEBT', 'TAX', 'EQUITY', 'LEGAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disclosures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disclosures.map((note) => (
          <div
            key={note.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  {note.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {note.title}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Page {note.page}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {note.summary}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{note.status}</span>
              </span>
              <button
                onClick={() => onInspectMetric && onInspectMetric(note.id)}
                className="text-[11px] font-mono font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Source Lineage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
