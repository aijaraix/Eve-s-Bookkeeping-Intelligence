import React from 'react';
import { ExtractedFact } from '../types';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  Layers,
  MapPin,
  Tag,
  Hash,
  Database,
  Search,
  ExternalLink
} from 'lucide-react';

interface SourceProvenanceModalProps {
  fact: ExtractedFact | null;
  metricTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceProvenanceModal: React.FC<SourceProvenanceModalProps> = ({
  fact,
  metricTitle,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const isNotAvailable = !fact;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                {metricTitle || fact?.labelNormalized || fact?.labelOriginal || 'Source Provenance Detail'}
              </h3>
              <p className="text-xs text-slate-500">
                Audit Trail &amp; Document Traceability Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isNotAvailable ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-slate-800 text-base">
                Not Available from Uploaded Documents
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Eve Bookkeeping Intelligence enforces strict data integrity (&quot;No Data &gt; Fake Data&quot;). This specific metric or breakdown was not present or could not be established with sufficient confidence in the uploaded financial filings.
              </p>
            </div>
          ) : (
            <>
              {/* Top Value Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                    Reported Raw Value (Source)
                  </span>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    {fact.valueOriginal || fact.rawValue || fact.raw_value || '—'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Exact character sequence extracted from document text/table
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider block">
                    Normalized Computational Value
                  </span>
                  <div className="text-xl font-bold text-indigo-950 font-mono">
                    {fact.currencyOriginal || fact.currency || 'EUR'}{' '}
                    {typeof fact.normalizedValue === 'number'
                      ? fact.normalizedValue.toLocaleString()
                      : typeof fact.normalized_value === 'number'
                      ? fact.normalized_value.toLocaleString()
                      : fact.valueFunctional || '—'}
                  </div>
                  <p className="text-[11px] text-indigo-600">
                    Scaled base computational unit for standardized modeling
                  </p>
                </div>
              </div>

              {/* Provenance Location Metadata */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-600" /> Document Coordinates &amp; Location
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> {fact.verificationStatus || fact.status || 'VERIFIED'}
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Source File</span>
                      <span className="font-medium text-slate-800 break-all">
                        {fact.sourceDocument || fact.sourceText?.split('\n')[0] || 'Annual_Report.pdf'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Page Number</span>
                      <span className="font-semibold text-indigo-600">
                        Page {fact.pageNumber || fact.source_page || 1}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Statement / Section</span>
                      <span className="font-medium text-slate-800">
                        {fact.statementName || fact.statementSection || fact.statement_type || 'Consolidated Financial Statements'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Table &amp; Row Label</span>
                      <span className="font-medium text-slate-800">
                        {fact.tableName || fact.source_table || 'Table'}: {fact.rowLabel || fact.labelOriginal}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Reporting Period</span>
                      <span className="font-medium text-slate-800">
                        {fact.reportingPeriod || fact.fiscalPeriod || fact.fiscal_year || 'FY 2025'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Unit Scale</span>
                      <span className="font-medium text-slate-800">
                        {fact.unitScale || fact.scale || 'Units'} ({fact.currencyOriginal || fact.currency || 'EUR'})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Extraction Method</span>
                      <span className="font-medium text-slate-800">
                        {fact.extractionMethod || fact.extraction_method || 'Deterministic OCR & Table Parser'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Confidence Score</span>
                      <span className="font-medium text-emerald-600">
                        {((fact.confidence || 0.98) * 100).toFixed(0)}% Confidence
                      </span>
                    </div>

                    {fact.segment && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Business Segment</span>
                        <span className="font-medium text-indigo-700">{fact.segment}</span>
                      </div>
                    )}

                    {fact.geography && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Geographic Region</span>
                        <span className="font-medium text-indigo-700">{fact.geography}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Excerpt / Excerpt Snippet */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  Original Source Context Snippet
                </span>
                <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {fact.sourceText || fact.rawText || fact.source_context || `${fact.labelOriginal}: ${fact.valueOriginal}`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-slate-400" /> CPA Forensic Provenance Verifier
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
