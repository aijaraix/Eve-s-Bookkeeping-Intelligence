import React, { useState } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { EveEmptyState } from '../../design-system/EveEmptyState';
import { PracticeClientSummary, OrganizationCategory } from '../../../types/presentationModels';
import { Building2, Search, Filter, ArrowRight, ShieldCheck, UploadCloud } from 'lucide-react';

export interface PracticeClientsViewProps {
  clients: PracticeClientSummary[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  onNavigate: (viewId: string) => void;
  onOpenUpload: () => void;
}

export const PracticeClientsView: React.FC<PracticeClientsViewProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onNavigate,
  onOpenUpload
}) => {
  const [activeCategory, setActiveCategory] = useState<OrganizationCategory | 'ALL'>('REAL_CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((c) => {
    const matchesCategory = activeCategory === 'ALL' || c.category === activeCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Practice Management"
        title="Client Portfolio & Organizations"
        description="Certified corporate clients and sealed curriculum benchmark fixtures with strict multi-tenant isolation."
        actions={
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Intake Client Filing</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['REAL_CUSTOMER', 'ACADEMY_CASE', 'ALL'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'REAL_CUSTOMER' && 'Production Clients'}
              {cat === 'ACADEMY_CASE' && 'Academy Curriculum Cases'}
              {cat === 'ALL' && 'All Records'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter clients..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-400 text-slate-900"
          />
        </div>
      </div>

      {/* Clients Table */}
      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Organizations List</EveCardTitle>
          <span className="text-xs text-slate-400 font-mono">
            {filteredClients.length} Organization{filteredClients.length === 1 ? '' : 's'}
          </span>
        </EveCardHeader>
        <EveCardContent className="p-0">
          {filteredClients.length === 0 ? (
            <EveEmptyState
              title="No Organizations Found"
              description="No client organizations match the selected filter criteria."
              actionLabel="Upload New Client Filing"
              onAction={onOpenUpload}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Client Organization</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Industry / Scope</th>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4">Attestation Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredClients.map((client) => {
                    const isSelected = client.id === selectedClientId;

                    return (
                      <tr
                        key={client.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/30 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{client.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{client.jurisdiction}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                              client.category === 'REAL_CUSTOMER'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {client.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-600">
                          {client.industry}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {client.reportingCurrency}
                        </td>

                        <td className="py-3 px-4">
                          <EveStatusBadge
                            status={client.openReviewItemsCount > 0 ? 'review_required' : 'clean'}
                            size="sm"
                          />
                        </td>

                        <td className="py-3 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectClient(client.id);
                              onNavigate('engagement-overview');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <span>Open Engagement</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </EveCardContent>
      </EveCard>
    </div>
  );
};
