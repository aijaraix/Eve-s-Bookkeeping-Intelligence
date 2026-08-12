import React, { useState } from 'react';
import { ExtractedFact } from '../types';
import {
  X,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { SourceProvenanceModal } from './SourceProvenanceModal';

interface FactRegistryModalProps {
  facts: ExtractedFact[];
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FactRegistryModal: React.FC<FactRegistryModalProps> = ({
  facts,
  companyName,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statementFilter, setStatementFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedFactForProvenance, setSelectedFactForProvenance] = useState<ExtractedFact | null>(null);

  if (!isOpen) return null;

  const filteredFacts = facts.filter((fact) => {
    const searchLower = searchTerm.toLowerCase();
    const labelMatch =
      (fact.labelOriginal || '').toLowerCase().includes(searchLower) ||
      (fact.labelNormalized || '').toLowerCase().includes(searchLower) ||
      (fact.canonicalMetric || '').toLowerCase().includes(searchLower) ||
      (fact.sourceText || '').toLowerCase().includes(searchLower) ||
      (fact.segment || '').toLowerCase().includes(searchLower) ||
      (fact.geography || '').toLowerCase().includes(searchLower);

    if (!labelMatch) return false;

    if (statementFilter !== 'ALL') {
      const stmtName = (fact.statementName || fact.statement_type || fact.statementType || '').toLowerCase();
      if (statementFilter === 'income' && !stmtName.includes('income') && !stmtName.includes('profit')) return false;
      if (statementFilter === 'balance' && !stmtName.includes('balance') && !stmtName.includes('position')) return false;
      if (statementFilter === 'cash' && !stmtName.includes('cash')) return false;
      if (statementFilter === 'equity' && !stmtName.includes('equity') && !stmtName.includes('changes')) return false;
      if (statementFilter === 'segment' && !stmtName.includes('segment') && !fact.segment) return false;
      if (statementFilter === 'geography' && !stmtName.includes('geograph') && !fact.geography) return false;
      if (statementFilter === 'notes' && !stmtName.includes('note')) return false;
    }

    if (statusFilter !== 'ALL') {
      const status = (fact.verificationStatus || fact.status || '').toLowerCase();
      if (statusFilter === 'verified' && !status.includes('verif') && !status.includes('appr') && !status.includes('valid')) return false;
      if (statusFilter === 'unverified' && (status.includes('verif') || status.includes('appr') || status.includes('valid'))) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Fact ID',
      'Canonical Metric',
      'Original Label',
      'Normalized Label',
      'Raw Value',
      'Normalized Value',
      'Currency',
      'Scale',
      'Statement',
      'Page',
      'Segment',
      'Geography',
      'Verification Status',
      'Confidence'
    ];

    const rows = filteredFacts.map((f) => [
      f.id || f.fact_id || '',
      f.canonicalMetric || f.canonical_metric || '',
      `"${(f.labelOriginal || '').replace(/"/g, '""')}"`,
      `"${(f.labelNormalized || '').replace(/"/g, '""')}"`,
      `"${(f.valueOriginal || f.rawValue || '').replace(/"/g, '""')}"`,
      f.normalizedValue !== undefined ? f.normalizedValue : f.normalized_value || '',
      f.currencyOriginal || f.currency || 'EUR',
      f.unitScale || f.scale || 'Units',
      `"${(f.statementName || f.statement_type || '').replace(/"/g, '""')}"`,
      f.pageNumber || f.source_page || 1,
      `"${(f.segment || '').replace(/"/g, '""')}"`,
      `"${(f.geography || '').replace(/"/g, '""')}"`,
      f.verificationStatus || f.status || 'VERIFIED',
      f.confidence || 0.98
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${companyName.replace(/\s+/g, '_')}_Fact_Registry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Complete Fact Registry — {companyName}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                    {facts.length} Structured Facts
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Full material financial disclosure registry extracted from primary filings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search facts by label, metric, segment, region, or source text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <span className="text-slate-400 px-2 font-medium text-[11px] uppercase tracking-wider">
                  Statement:
                </span>
                <button
                  onClick={() => setStatementFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statementFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({facts.length})
                </button>
                <button
                  onClick={() => setStatementFilter('income')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statementFilter === 'income'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setStatementFilter('balance')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statementFilter === 'balance'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Balance Sheet
                </button>
                <button
                  onClick={() => setStatementFilter('cash')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statementFilter === 'cash'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cash Flow
                </button>
                <button
                  onClick={() => setStatementFilter('segment')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statementFilter === 'segment'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Segments
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white">
            {filteredFacts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium text-sm">
                  No facts match your search or filter criteria.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing filters or typing a different keyword.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Canonical Metric / Label</th>
                    <th className="py-3 px-4">Raw Value (Source)</th>
                    <th className="py-3 px-4">Normalized Value</th>
                    <th className="py-3 px-4">Statement / Section</th>
                    <th className="py-3 px-4">Page &amp; Table</th>
                    <th className="py-3 px-4">Segment / Region</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredFacts.map((fact, idx) => {
                    const normVal =
                      typeof fact.normalizedValue === 'number'
                        ? fact.normalizedValue
                        : typeof fact.normalized_value === 'number'
                        ? fact.normalized_value
                        : parseFloat(String(fact.valueFunctional || '0'));

                    const statusStr = (fact.verificationStatus || fact.status || 'VERIFIED').toUpperCase();
                    const isVerified = statusStr.includes('VERIF') || statusStr.includes('APPR') || statusStr.includes('VALID');

                    return (
                      <tr
                        key={fact.id || fact.fact_id || idx}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {fact.labelNormalized || fact.canonicalMetric || fact.labelOriginal}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {fact.labelOriginal}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {fact.valueOriginal || fact.rawValue || fact.raw_value || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-indigo-950">
                          {fact.currencyOriginal || fact.currency || 'EUR'}{' '}
                          {isNaN(normVal) ? '—' : normVal.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {fact.statementName || fact.statement_type || fact.statementSection || 'Financial Statement'}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            P.{fact.pageNumber || fact.source_page || 1}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">
                            {fact.tableName || fact.source_table || 'Table'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {fact.segment ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 mb-0.5">
                              {fact.segment}
                            </span>
                          ) : fact.geography ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mb-0.5">
                              {fact.geography}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Consolidated</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isVerified ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedFactForProvenance(fact)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-100 transition-colors"
                          >
                            Provenance <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{filteredFacts.length}</strong> of <strong>{facts.length}</strong> material facts
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              Done Inspecting
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Source Provenance Modal */}
      <SourceProvenanceModal
        fact={selectedFactForProvenance}
        isOpen={!!selectedFactForProvenance}
        onClose={() => setSelectedFactForProvenance(null)}
      />
    </>
  );
};
