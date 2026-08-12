import React from 'react';
import { Network, FileText, Building2, Layers, CheckCircle2 } from 'lucide-react';

export const RelationshipExplorer: React.FC = () => {
  const relations = [
    { from: 'Q2 Consolidated Income Statement.pdf', rel: '→ Relates to Reporting Period', to: 'Q2 2026' },
    { from: 'Factura Proveedor Madrid Q2.pdf', rel: '→ Relates to Entity', to: 'Iberia Solutions S.A. (Madrid)' },
    { from: 'BNP Paribas Operating Account Jun 2026.pdf', rel: '→ Relates to Bank Account', to: 'EUR Operating Account #8841' },
    { from: 'Master Trial Balance Q2 2026.xlsx', rel: '→ Relates to Chart of Accounts', to: 'Standard IFRS / GAAP Taxonomy' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Relationship Explorer</h1>
        <p className="text-sm text-slate-400">Deterministic and semantic relationship graph connecting documents, entities, accounts, and reporting periods.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Discovered Document & Entity Relationships</h2>
        <div className="space-y-3">
          {relations.map((r, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 gap-3">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{r.from}</span>
              </div>
              <div className="text-xs font-mono text-amber-400 bg-amber-950/50 px-3 py-1 rounded-lg border border-amber-800/60">
                {r.rel}
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{r.to}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
