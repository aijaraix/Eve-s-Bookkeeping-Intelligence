import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { StatementLinePresentation, SourceToPixelMetadata } from '../../types/presentationModels';
import { ChevronRight, ChevronDown, FileSearch, ShieldCheck, AlertCircle } from 'lucide-react';

export interface EveFinancialTableProps {
  title: string;
  periods: string[];
  lines: StatementLinePresentation[];
  currency?: string;
  scale?: string;
  entityName?: string;
  statementType?: string;
  onInspectFact?: (metadata: SourceToPixelMetadata) => void;
  className?: string;
}

export const EveFinancialTable: React.FC<EveFinancialTableProps> = ({
  title,
  periods,
  lines,
  currency = 'USD',
  scale = 'In Millions',
  entityName,
  statementType,
  onInspectFact,
  className
}) => {
  const [collapsedHeaders, setCollapsedHeaders] = useState<Record<string, boolean>>({});

  const toggleHeader = (id: string) => {
    setCollapsedHeaders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden', className)}>
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            {statementType && (
              <span className="text-xs font-normal text-slate-500 uppercase tracking-wider bg-slate-200/60 px-2 py-0.5 rounded">
                {statementType}
              </span>
            )}
          </h3>
          {entityName && (
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Entity Scope: <span className="font-semibold text-slate-700">{entityName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
            Currency: <strong className="text-slate-700">{currency}</strong>
          </span>
          <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
            Scale: <strong className="text-slate-700">{scale}</strong>
          </span>
        </div>
      </div>

      {/* Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-5 w-1/2">Financial Statement Item</th>
              {periods.map((p) => (
                <th key={p} className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                  {p}
                </th>
              ))}
              {periods.length >= 2 && (
                <>
                  <th className="py-3 px-4 text-right font-mono text-slate-600">Variance ($)</th>
                  <th className="py-3 px-4 text-right font-mono text-slate-600">Change (%)</th>
                </>
              )}
              <th className="py-3 px-4 text-center w-24">Lineage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={periods.length + 4}
                  className="py-12 text-center text-slate-400 italic text-sm"
                >
                  No verified line items extracted for this period. Upload a filing to extract statements.
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const isHeader = line.isHeader;
                const isTotal = line.isTotal;
                const isSubtotal = line.isSubtotal;

                // Indentation calculation
                const indentClass =
                  line.level === 0
                    ? ''
                    : line.level === 1
                    ? 'pl-8'
                    : line.level === 2
                    ? 'pl-12'
                    : 'pl-16';

                return (
                  <tr
                    key={line.id}
                    className={cn(
                      'transition-colors hover:bg-slate-50/80 group',
                      isHeader && 'bg-slate-50/60 font-semibold text-slate-900 border-t border-slate-200',
                      isTotal && 'font-bold text-slate-950 bg-slate-50/40 border-t-2 border-slate-900 border-b-4 border-double border-slate-900',
                      isSubtotal && 'font-semibold text-slate-900 border-t border-slate-300'
                    )}
                  >
                    {/* Line Label */}
                    <td className={cn('py-2.5 px-5', indentClass)}>
                      <div className="flex items-center gap-2">
                        {isHeader && (
                          <button
                            type="button"
                            onClick={() => toggleHeader(line.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {collapsedHeaders[line.id] ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <span className={cn(isHeader && 'tracking-tight', isTotal && 'text-base')}>
                          {line.label}
                        </span>
                        {line.sourceDocName && (
                          <span
                            className="hidden group-hover:inline-block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50"
                            title={`Extracted from ${line.sourceDocName} p.${line.sourcePage || 1}`}
                          >
                            p.{line.sourcePage || 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Period Columns */}
                    {periods.map((p) => {
                      const val = line.values[p];
                      const formatted = line.formattedValues[p] ?? (val !== null && val !== undefined ? val.toLocaleString() : '—');
                      const isClickable = Boolean(onInspectFact && val !== null && val !== undefined && !isHeader);

                      return (
                        <td
                          key={p}
                          className={cn(
                            'py-2.5 px-4 text-right font-mono text-sm whitespace-nowrap',
                            isTotal && 'font-bold text-slate-950',
                            isSubtotal && 'font-semibold text-slate-900',
                            isClickable && 'cursor-pointer group-hover/val:text-indigo-600'
                          )}
                          // Source-to-Pixel Lineage Dataset Attributes (Phase 35)
                          data-fact-lineage-id={line.factLineageId || undefined}
                          data-render-id={line.renderId || undefined}
                          data-canonical-metric={line.canonicalMetric || undefined}
                          data-period={p}
                          data-currency={line.currency || currency}
                          data-scale={line.scale || scale}
                          data-provenance-status={line.verificationStatus}
                          onClick={() => {
                            if (isClickable && onInspectFact) {
                              onInspectFact({
                                factLineageId: line.factLineageId,
                                renderId: line.renderId,
                                canonicalMetric: line.canonicalMetric,
                                period: p,
                                currency: line.currency || currency,
                                scale: line.scale || scale,
                                provenanceStatus: line.verificationStatus,
                                sourceDocName: line.sourceDocName,
                                sourcePage: line.sourcePage,
                                sourceRawValue: val ?? undefined
                              });
                            }
                          }}
                        >
                          {isHeader ? '' : (
                            <span
                              className={cn(
                                'inline-block px-1.5 py-0.5 rounded transition-colors',
                                isClickable && 'hover:bg-indigo-50 hover:text-indigo-700 hover:underline'
                              )}
                              title={isClickable ? 'Click to inspect source proof in SEC filing' : undefined}
                            >
                              {formatted}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Variance Columns */}
                    {periods.length >= 2 && (
                      <>
                        <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-600">
                          {isHeader || line.variance === undefined
                            ? ''
                            : line.variance > 0
                            ? `+${line.variance.toLocaleString()}`
                            : line.variance.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs">
                          {isHeader || line.variancePct === undefined ? (
                            ''
                          ) : (
                            <span
                              className={cn(
                                'font-medium',
                                line.variancePct > 0 ? 'text-emerald-700' : line.variancePct < 0 ? 'text-rose-700' : 'text-slate-500'
                              )}
                            >
                              {line.variancePct > 0 ? `+${line.variancePct.toFixed(1)}%` : `${line.variancePct.toFixed(1)}%`}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Lineage Status Pill */}
                    <td className="py-2.5 px-4 text-center">
                      {!isHeader && (
                        <div className="flex items-center justify-center gap-1">
                          {line.verificationStatus === 'verified' && (
                            <span
                              className="text-emerald-600 bg-emerald-50 p-1 rounded-full"
                              title="Verified by Veritas SHA-256 Engine"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {line.verificationStatus === 'review_required' && (
                            <span
                              className="text-amber-600 bg-amber-50 p-1 rounded-full"
                              title="Flagged by Sentinel for review"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {onInspectFact && (
                            <button
                              type="button"
                              onClick={() => {
                                onInspectFact({
                                  factLineageId: line.factLineageId,
                                  renderId: line.renderId,
                                  canonicalMetric: line.canonicalMetric,
                                  currency: line.currency || currency,
                                  scale: line.scale || scale,
                                  sourceDocName: line.sourceDocName,
                                  sourcePage: line.sourcePage
                                });
                              }}
                              className="text-slate-300 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                              title="Inspect Full Lineage"
                            >
                              <FileSearch className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
