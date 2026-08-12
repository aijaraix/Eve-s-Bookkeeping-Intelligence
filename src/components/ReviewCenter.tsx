import React, { useState } from 'react';
import { ExtractedFact, DocumentRecord } from '../types';
import { CheckSquare, AlertTriangle, Check, X, ShieldAlert, FileSearch, ShieldCheck } from 'lucide-react';
import { ProvenanceModal } from './ProvenanceModal';

interface ReviewCenterProps {
  facts: ExtractedFact[];
  documents?: DocumentRecord[];
  onUpdateStatus: (id: string, status: string) => void;
  onRefreshData?: () => void;
}

export const ReviewCenter: React.FC<ReviewCenterProps> = ({ facts, documents = [], onUpdateStatus, onRefreshData }) => {
  const [filter, setFilter] = useState('all');
  const [selectedFact, setSelectedFact] = useState<ExtractedFact | null>(null);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);

  const pendingFacts = facts.filter(f => filter === 'all' ? true : f.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
            AUDIT GOVERNANCE & CONTROL
          </span>
          <h1 className="text-2xl font-extrabold text-neutral-900 mt-1">Review & Control Center</h1>
          <p className="text-xs text-neutral-500 mt-1">Examine uncertain extractions, approve proposed facts, and inspect original PDF source text & FX rates in the Provenance Inspector.</p>
        </div>
        <div className="flex space-x-2">
          {['all', 'proposed', 'approved', 'rejected', 'discrepancy'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                filter === s ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                <th className="py-4 px-6">Fact Label</th>
                <th className="py-4 px-6">Original Value</th>
                <th className="py-4 px-6">Functional Amount</th>
                <th className="py-4 px-6">Confidence</th>
                <th className="py-4 px-6">Extraction Method</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Audit Provenance & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-800">
              {pendingFacts.map(fact => (
                <tr key={fact.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-neutral-900">
                    <div>{fact.labelNormalized || fact.labelOriginal}</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Original: "{fact.labelOriginal}"</div>
                  </td>
                  <td className="py-4 px-6 font-mono text-neutral-700">{fact.valueOriginal} {fact.currencyOriginal || 'EUR'}</td>
                  <td className="py-4 px-6 font-mono text-emerald-800 font-bold">{fact.functionalCurrency || 'EUR'} {parseFloat(fact.valueFunctional || '0').toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className="text-neutral-900 font-mono font-bold">{Math.round((fact.confidence || 0.95) * 100)}%</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-neutral-500 font-medium font-mono">{fact.extractionMethod || 'SWARM_CLAUDE_3_7'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      fact.status?.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                      fact.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-300' :
                      fact.status?.toLowerCase() === 'discrepancy' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {fact.status || 'PROPOSED'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedFact(fact);
                        setIsProvenanceOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg border border-blue-200 transition cursor-pointer inline-flex items-center gap-1"
                      title="Inspect PDF Source Text & FX Lineage"
                    >
                      <FileSearch className="w-3.5 h-3.5" /> Trace Lineage
                    </button>
                    <button
                      onClick={() => onUpdateStatus(fact.id, 'approved')}
                      className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-700 hover:text-white rounded-lg transition cursor-pointer inline-block"
                      title="Approve Fact"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateStatus(fact.id, 'rejected')}
                      className="p-1.5 bg-rose-100 text-rose-800 hover:bg-rose-700 hover:text-white rounded-lg transition cursor-pointer inline-block"
                      title="Reject Fact"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
        fact={selectedFact}
        document={documents.find(d => d.id === selectedFact?.documentId)}
        onFactUpdate={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
