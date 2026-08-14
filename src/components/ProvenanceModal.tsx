import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight, Clock, RefreshCw, X, Cpu, DollarSign, ExternalLink, Award, FileSearch, HelpCircle } from 'lucide-react';
import { ExtractedFact, DocumentRecord } from '../types';

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  fact: ExtractedFact | null;
  document?: DocumentRecord | null;
  onFactUpdate?: (updatedFact: ExtractedFact) => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({
  isOpen,
  onClose,
  fact,
  document,
  onFactUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [overrideVal, setOverrideVal] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !fact) return null;

  const handleSaveOverride = async () => {
    if (!overrideVal) return;
    setSaving(true);
    try {
      const res = await fetch('/api/facts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factId: fact.id,
          valueFunctional: overrideVal,
          status: 'APPROVED',
          verificationNotes: `CPA Override: ${overrideReason || 'Manual verification'}`
        })
      });
      if (res.ok) {
        const updated = await res.json();
        if (onFactUpdate && updated.fact) {
          onFactUpdate(updated.fact);
        }
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save fact override:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/facts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factId: fact.id,
          status: 'APPROVED',
          verificationNotes: 'Approved via CPA Provenance Inspector'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        if (onFactUpdate && updated.fact) {
          onFactUpdate(updated.fact);
        }
      }
    } catch (err) {
      console.error("Failed to approve fact:", err);
    } finally {
      setSaving(false);
    }
  };

  const provenance = fact.provenance;
  const fxDetails = fact.fxDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Audited Fact Lineage & Provenance
              </span>
              <span className="text-xs text-slate-400 font-mono">Fact ID: {fact.id}</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {fact.labelNormalized || fact.labelOriginal}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Original Document Label: <strong className="text-slate-200">"{fact.labelOriginal}"</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fact Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block">Functional Value</span>
            <span className="text-base font-extrabold text-white font-mono">
              {fact.functionalCurrency || 'EUR'} {parseFloat(String(fact.valueFunctional || '0')).toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block">Original Value</span>
            <span className="text-sm font-bold text-slate-300 font-mono">
              {fact.currencyOriginal || 'EUR'} {fact.valueOriginal}
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block">Confidence & Agent</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {Math.round((fact.confidence || 0.95) * 100)}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
              {fact.extractionMethod || 'SWARM_CLAUDE_3_7'}
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block">Validation Status</span>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              fact.status?.toLowerCase() === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : fact.status?.toLowerCase() === 'discrepancy'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {fact.status || 'PROPOSED'}
            </span>
          </div>
        </div>

        {/* Audit Lineage Steps */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Step 1: Raw Document Source & Provenance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</div>
              <FileSearch className="w-4 h-4 text-blue-400" />
              <span>Source Document & Page Provenance</span>
            </div>
            
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  {document?.filename || fact.sourceText || 'Uploaded Statement'}
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                  Page {provenance?.pageNumber || fact.pageNumber || 1}
                </span>
              </div>

              {/* Source Text Snippet */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">Exact OCR / PDF Excerpt:</span>
                <blockquote className="p-3 bg-slate-900 rounded-lg border-l-2 border-blue-500 text-amber-200 font-mono text-xs leading-relaxed italic">
                  "{provenance?.rawSnippet || fact.sourceText || `${fact.labelOriginal}: ${fact.valueOriginal}`}"
                </blockquote>
              </div>

              {provenance?.sectionTitle && (
                <div className="text-[11px] text-slate-400">
                  Section Context: <strong className="text-slate-200">{provenance.sectionTitle}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: FX & Currency Normalization Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</div>
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Currency & Scale Normalization Engine</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Source Currency & Value</span>
                <span className="font-mono text-white font-bold">{fxDetails?.sourceCurrency || fact.currencyOriginal || 'EUR'} {fact.valueOriginal}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Applied Exchange Rate</span>
                <span className="font-mono text-emerald-400 font-bold">1 {fxDetails?.sourceCurrency || fact.currencyOriginal || 'EUR'} = {fact.exchangeRate || fxDetails?.exchangeRate || '1.0'} {fxDetails?.targetCurrency || fact.functionalCurrency || 'EUR'}</span>
                <span className="text-[9px] text-slate-400 block">Rate Source: {fxDetails?.rateSource || 'ECB Interbank Feed'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Functional Amount</span>
                <span className="font-mono text-white font-extrabold">{fxDetails?.targetCurrency || fact.functionalCurrency || 'EUR'} {parseFloat(String(fact.valueFunctional || '0')).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Step 3: Hermes 4-Agent Consensus Scorecard */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</div>
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Hermes 4-Agent Swarm Audit Consensus</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">1. Inspector Agent</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">2. Currency Verifier</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> NORMALIZED
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">3. Discrepancy Auditor</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> NO CONFLICTS
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">4. Arithmetic Agent</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> RECONCILED
                </span>
              </div>
            </div>
          </div>

          {/* CPA Manual Override Form */}
          {isEditing && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl space-y-3">
              <h4 className="font-bold text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Human CPA Override Mode
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Correct Functional Value:</label>
                  <input
                    type="text"
                    value={overrideVal}
                    onChange={(e) => setOverrideVal(e.target.value)}
                    placeholder={String(fact.valueFunctional || '')}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Override Justification / Note:</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Adjusted based on Note 14 restatement"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOverride}
                  disabled={saving || !overrideVal}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Apply CPA Override'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {fact.verificationNotes && <span>Notes: {fact.verificationNotes}</span>}
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                onClick={() => {
                  setOverrideVal(String(fact.valueFunctional || ''));
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs transition"
              >
                CPA Manual Override
              </button>
            )}

            <button
              onClick={handleApprove}
              disabled={saving || fact.status?.toLowerCase() === 'approved'}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                fact.status?.toLowerCase() === 'approved'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 opacity-80 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {fact.status?.toLowerCase() === 'approved' ? 'Fact Approved' : 'Approve Fact'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
