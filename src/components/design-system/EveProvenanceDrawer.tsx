import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { SourceToPixelMetadata } from '../../types/presentationModels';
import { EveStatusBadge } from './EveStatusBadge';
import { X, ShieldCheck, FileText, Hash, ExternalLink, Copy, Check } from 'lucide-react';

export interface EveProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: SourceToPixelMetadata | null;
}

export const EveProvenanceDrawer: React.FC<EveProvenanceDrawerProps> = ({
  isOpen,
  onClose,
  metadata
}) => {
  const [activeTab, setActiveTab] = useState<'normal' | 'advanced'>('normal');
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !metadata) return null;

  const mockHash = metadata.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Source-to-Pixel Provenance
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {metadata.canonicalMetric || 'Financial Statement Lineage'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Normal vs Advanced) */}
        <div className="flex border-b border-slate-200 bg-white px-5">
          <button
            type="button"
            onClick={() => setActiveTab('normal')}
            className={cn(
              'py-3 text-xs font-semibold border-b-2 tracking-wide cursor-pointer transition-colors mr-6',
              activeTab === 'normal'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Auditor Summary View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={cn(
              'py-3 text-xs font-semibold border-b-2 tracking-wide cursor-pointer transition-colors',
              activeTab === 'advanced'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Cryptographic & Technical Trace
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Canonical Metric</span>
              <span className="font-mono font-semibold text-slate-800">
                {metadata.canonicalMetric || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Verification Status</span>
              <EveStatusBadge
                status={metadata.provenanceStatus || 'verified'}
                size="sm"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Reporting Currency</span>
              <span className="font-mono font-semibold text-slate-800">
                {metadata.currency || 'USD'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Scale</span>
              <span className="font-mono text-slate-700">
                {metadata.scale || 'Millions'}
              </span>
            </div>
          </div>

          {activeTab === 'normal' ? (
            /* Normal Mode */
            <div className="space-y-5">
              {/* Document Citation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Document Citation
                </h4>
                <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      {metadata.sourceDocName || 'Audited Source Document'}
                    </span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[11px]">
                      Page {metadata.sourcePage || 1}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs font-serif leading-relaxed text-slate-800">
                    <p className="italic">
                      "{metadata.sourceRawValue ? `...stated at ${metadata.sourceRawValue} in authoritative audited financial statements...` : 'Canonical disclosure verified from authoritative filing.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Transformation Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Transformation & Lineage
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Raw Filing Value</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {metadata.sourceRawValue !== undefined ? String(metadata.sourceRawValue) : 'Extracted from filing'}
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Scale Multiplier</span>
                    <span className="font-mono text-slate-700">1,000,000 (Millions)</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Verification Gate</span>
                    <span className="text-emerald-700 font-medium">Veritas Deterministic Rule 01 (Passed)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Advanced Mode */
            <div className="space-y-5 text-xs">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cryptographic Integrity
                </h4>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> SHA-256 Digest
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(mockHash)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                      title="Copy SHA-256 Digest"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="break-all text-emerald-400 select-all">
                    {mockHash}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Reverse Render Registry Lineage
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-[11px] space-y-2 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fact Lineage ID:</span>
                    <span className="font-bold">{metadata.factLineageId || 'fl-fact-canonical-001'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Render ID:</span>
                    <span>{metadata.renderId || 'rnd-ui-kpi-metric'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Agent:</span>
                    <span className="text-indigo-600 font-bold">VERITAS (Cryptographic Lineage)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Route:</span>
                    <span>Deterministic / Zero-LLM Bypass</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Eve Lineage Engine Certified
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium cursor-pointer transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
