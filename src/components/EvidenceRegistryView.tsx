import React, { useState } from 'react';
import {
  FileSearch,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  ExternalLink,
  Filter,
  ShieldCheck,
  Hash,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { ExtractedFact } from '../types';

interface EvidenceRegistryViewProps {
  onInspectFact?: (fact: ExtractedFact) => void;
}

export const EvidenceRegistryView: React.FC<EvidenceRegistryViewProps> = ({ onInspectFact }) => {
  const { facts, selectedCompanyId, companies, documents } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'VERIFIED' | 'PENDING'>('ALL');

  const filteredFacts = facts.filter((f) => {
    const matchesSearch =
      !searchTerm ||
      (f.metric && f.metric.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.label && f.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.canonicalMetric && f.canonicalMetric.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.sourceDocumentName && f.sourceDocumentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONFIRMED' && (f.status === 'CONFIRMED' || f.status === 'APPROVED')) ||
      (statusFilter === 'VERIFIED' && f.evidenceStatus === 'CONFIRMED') ||
      (statusFilter === 'PENDING' && (f.status === 'PENDING_REVIEW' || f.evidenceStatus === 'UNCONFIRMED'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AUDIT & DELIVERABLES — FORENSIC EVIDENCE REGISTRY</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              Fact & Lineage Evidence Registry
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable digital audit trail. Every number traces directly to source document SHA-256 hashes, physical page numbers, and exact text coordinates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-mono">
              <span className="text-[10px] text-emerald-600 uppercase block font-bold">Total Verified Facts</span>
              <span className="font-bold">{facts.length} Facts</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facts by canonical metric, line item label, document, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'CONFIRMED', 'VERIFIED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
            <tr>
              <th className="py-3.5 px-4">Canonical Metric & Line Item</th>
              <th className="py-3.5 px-4">Normalized Value</th>
              <th className="py-3.5 px-4">Period</th>
              <th className="py-3.5 px-4">Source Document</th>
              <th className="py-3.5 px-4">Page #</th>
              <th className="py-3.5 px-4 text-center">Confidence</th>
              <th className="py-3.5 px-4 text-center">Audit Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFacts.length > 0 ? (
              filteredFacts.map((fact, idx) => (
                <tr
                  key={fact.id || idx}
                  onClick={() => onInspectFact && onInspectFact(fact)}
                  className="hover:bg-blue-50/60 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{fact.label || fact.metric}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {fact.canonicalMetric || fact.metric}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {fact.formattedValue || (fact.normalizedValue ? String(fact.normalizedValue) : '—')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {fact.period || 'FY2024'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]" title={fact.sourceDocumentName}>
                    {fact.sourceDocumentName || 'Source Filing'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    p. {fact.pageNumber || 1}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] font-bold text-slate-700">
                    {fact.confidence ? `${Math.round(fact.confidence * 100)}%` : '100%'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{fact.status || 'CONFIRMED'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectFact && onInspectFact(fact);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-mono font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono text-xs">
                  {facts.length === 0
                    ? 'No facts extracted yet. Upload financial statements to populate the evidence registry.'
                    : 'No facts matched the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
