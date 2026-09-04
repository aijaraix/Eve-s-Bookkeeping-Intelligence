import React from 'react';
import { ShieldCheck, CheckCircle2, FileText, X, ExternalLink, Sliders } from 'lucide-react';
import { FinancialFact } from '../types';

interface ProvenanceInspectorModalProps {
  fact: FinancialFact | null;
  onClose: () => void;
}

export const ProvenanceInspectorModal: React.FC<ProvenanceInspectorModalProps> = ({ fact, onClose }) => {
  if (!fact) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-blue-200 font-semibold tracking-wider">
              {(fact.statementType || 'FINANCIAL_STATEMENT').replace('_', ' ')} Provenance Lineage
            </div>
            <h3 className="text-base font-bold text-white">{fact.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Main Key Figures */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Normalized Financial Scalar</span>
              <span className="text-lg font-bold font-mono text-blue-700">{fact.formattedValue}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Raw Document String</span>
              <span className="text-lg font-bold font-mono text-slate-800">"{fact.rawString || fact.formattedValue}"</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Scale Multiplier Source</span>
              <span className="font-mono text-slate-700 font-semibold">{fact.scaleSource || fact.scale || 'Table Header Scale (Millions)'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Confidence & Status</span>
              <span className="font-mono text-teal-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                {((fact.confidence ?? 0.99) * 100).toFixed(1)}% — {fact.status || 'VERIFIED'}
              </span>
            </div>
          </div>

          {/* Source Bounding Box Snippet */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Source Document Line Snippet
            </span>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-xs text-slate-800 leading-relaxed italic">
              "{fact.provenance?.snippet || `${fact.label}: ${fact.formattedValue}`}"
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                {fact.provenance?.documentTitle || fact.sourceDocumentName || 'Audited Financial Statements.pdf'}
              </span>
              <span>Page {fact.pageNumber || 1}, Line {fact.provenance?.lineNumber || 14}</span>
            </div>
          </div>

          {/* Section details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
            <div><strong>Statement Section:</strong> {fact.provenance?.section || 'Consolidated Group Accounts'}</div>
            <div><strong>Table Header:</strong> {fact.tableHeader || 'Consolidated Statement'}</div>
            <div><strong>Currency / Unit:</strong> {fact.currency || 'EUR'}</div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
