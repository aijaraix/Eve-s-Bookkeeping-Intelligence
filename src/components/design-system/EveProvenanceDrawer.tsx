import { actionAttributes } from '../../academy/uiActionRegistry';
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

  const recordedHash = metadata.sha256Hash || metadata.sourceCoordinate?.sourceSha256 || 'Hash not recorded';
  const coordinate = metadata.sourceCoordinate || metadata.sourceCoordinates?.[0];
  const sourceLocator = metadata.sourceLocationLabel || (coordinate?.sourceType === 'SPREADSHEET'
    ? `${coordinate.sheetName || 'Sheet'}!${coordinate.cellAddress || coordinate.rangeAddress || 'cell not recorded'}`
    : coordinate?.sourceType === 'CSV'
      ? `Row ${coordinate.rowIndex}${coordinate.columnIndex ? ` · Column ${coordinate.columnIndex}` : ''}`
      : coordinate?.sourceType === 'PDF'
        ? `Page ${coordinate.pageNumber}`
        : metadata.sourcePage ? `Page ${metadata.sourcePage}` : 'not recorded');

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
            {...actionAttributes('evidence.close')} onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Normal vs Advanced) */}
        <div className="flex border-b border-slate-200 bg-white px-5">
          <button
            type="button"
            {...actionAttributes('evidence.summary')} onClick={() => setActiveTab('normal')}
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
            {...actionAttributes('evidence.technical')} onClick={() => setActiveTab('advanced')}
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
                status={metadata.provenanceStatus || 'review_required'}
                size="sm"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Reporting Currency</span>
              <span className="font-mono font-semibold text-slate-800">
                {metadata.currency || 'Not recorded'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Scale</span>
              <span className="font-mono text-slate-700">
                {metadata.scale || 'Not recorded'}
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
                      {metadata.sourceDocName || 'Source document not recorded'}
                    </span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[11px]">
                      Source locator: {sourceLocator}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs font-serif leading-relaxed text-slate-800">
                    <p className="italic">
                      {metadata.sourceText || 'No source quotation is recorded for this reference.'}
                    </p>
                  </div>
                  {coordinate?.sourceType === 'SPREADSHEET' && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
                      <span className="text-slate-500">Workbook</span><span>{coordinate.workbookName || metadata.sourceDocName || 'Not recorded'}</span>
                      <span className="text-slate-500">Sheet / Cell</span><span>{coordinate.sheetName || 'Sheet'}!{coordinate.cellAddress || coordinate.rangeAddress || 'Not recorded'}</span>
                      <span className="text-slate-500">Formula</span><span>{coordinate.formula || 'Literal value'}</span>
                      <span className="text-slate-500">Cached / parsed value</span><span>{coordinate.cachedValue !== undefined && coordinate.cachedValue !== null ? String(coordinate.cachedValue) : 'Not recorded'}</span>
                      <span className="text-slate-500">Number format</span><span>{coordinate.numberFormat || 'Not recorded'}</span>
                      <span className="text-slate-500">Provenance ID</span><span className="break-all">{metadata.sourceProvenanceId || 'Not recorded'}</span>
                    </div>
                  )}
                  {coordinate?.sourceType === 'IMAGE' && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-teal-50/60 border border-teal-100 rounded-lg p-3">
                      <span className="text-slate-500">Image / Page</span><span>{coordinate.imageWidth}×{coordinate.imageHeight}{coordinate.pageNumber ? ` · page ${coordinate.pageNumber}` : ''}</span>
                      <span className="text-slate-500">OCR region</span><span>{coordinate.ocrRegionId || 'Not recorded'}</span>
                      <span className="text-slate-500">Bounding box</span><span>x={Number(coordinate.boundingBox?.x || 0).toFixed(4)} y={Number(coordinate.boundingBox?.y || 0).toFixed(4)} w={Number(coordinate.boundingBox?.width || 0).toFixed(4)} h={Number(coordinate.boundingBox?.height || 0).toFixed(4)} {coordinate.boundingBox?.unit || ''}</span>
                      <span className="text-slate-500">OCR text</span><span>{coordinate.rawLiteral || metadata.sourceText || 'Not recorded'}</span>
                      <span className="text-slate-500">Confidence</span><span>{typeof coordinate.confidence === 'number' ? `${(coordinate.confidence * 100).toFixed(2)}%` : 'Not recorded'}</span>
                      <span className="text-slate-500">OCR engine</span><span>{coordinate.extractionMethod || metadata.sourceExtractionMethod || 'Not recorded'}</span>
                      <span className="text-slate-500">Engine version</span><span>{coordinate.extractionVersion || metadata.sourceExtractionVersion || 'Not recorded'}</span>
                      <span className="text-slate-500">Provenance ID</span><span className="break-all">{metadata.sourceProvenanceId || 'Not recorded'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transformation Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Transformation & Lineage
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Raw Source Value</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {metadata.sourceRawValue !== undefined ? String(metadata.sourceRawValue) : 'Extracted from filing'}
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Scale Multiplier</span>
                    <span className="font-mono text-slate-700">{metadata.scale || 'Not recorded'}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">Verification Gate</span>
                    <span className="text-emerald-700 font-medium">Not established by this reference</span>
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
                      onClick={() => copyToClipboard(recordedHash)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                      title="Copy SHA-256 Digest"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="break-all text-emerald-400 select-all">
                    {recordedHash}
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
                    <span className="font-bold">{metadata.factLineageId || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Render ID:</span>
                    <span>{metadata.renderId || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Agent:</span>
                    <span className="text-indigo-600 font-bold">Not recorded</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Route:</span>
                    <span>Not recorded</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Source evidence reference; review required
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
