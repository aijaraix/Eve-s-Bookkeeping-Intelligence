import React, { useState } from 'react';
import {
  Search,
  Plus,
  ExternalLink,
  ArrowUpRight,
  Building2,
  GitBranch,
  Network,
  Globe,
  CheckCircle2,
  DollarSign,
  Layers,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Filter
} from 'lucide-react';
import { ActiveView, CorporateEntity } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

interface CompaniesViewProps {
  onSelectView?: (view: ActiveView) => void;
  onSelectCompany?: (companyId: string) => void;
  onOpenUpload?: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  onSelectView,
  onSelectCompany,
  onOpenUpload
}) => {
  const {
    companies,
    projects,
    entities,
    relationships,
    selectedWorkspaceId,
    activeScope,
    setActiveScope,
    addEntity,
    removeEntity,
    activeCurrency,
    setActiveCurrency
  } = usePractice();

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'suppliers' | 'eliminations' | 'directory'>('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<'ALL' | 'SUBSIDIARY' | 'SUPPLIER'>('ALL');

  // New Entity Form State
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formJurisdiction, setFormJurisdiction] = useState('United States');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formType, setFormType] = useState<CorporateEntity['entityType']>('SUBSIDIARY');
  const [formOwnership, setFormOwnership] = useState<number>(100);
  const [formTaxId, setFormTaxId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSpend, setFormSpend] = useState<string>('');
  const [formRisk, setFormRisk] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL_SINGLE_SOURCE'>('LOW');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentEntity = entities.find((e) => e.entityType === 'PARENT') || entities[0];
  const subsidiaries = entities.filter((e) => e.entityType === 'SUBSIDIARY' || e.entityType === 'JOINT_VENTURE' || e.entityType === 'OPERATING_UNIT');
  const suppliers = entities.filter((e) => e.entityType === 'SUPPLIER' || e.entityType === 'VENDOR');

  const filteredEntities = entities.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.taxId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (entityTypeFilter === 'ALL') return matchSearch;
    if (entityTypeFilter === 'SUBSIDIARY') return matchSearch && (e.entityType === 'SUBSIDIARY' || e.entityType === 'PARENT');
    if (entityTypeFilter === 'SUPPLIER') return matchSearch && (e.entityType === 'SUPPLIER' || e.entityType === 'VENDOR');
    return matchSearch;
  });

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    try {
      await addEntity({
        name: formName.trim(),
        legalName: formLegalName.trim() || formName.trim(),
        jurisdiction: formJurisdiction.trim(),
        reportingCurrency: formCurrency,
        entityType: formType,
        ownershipPercentage: formType === 'SUPPLIER' || formType === 'VENDOR' ? 0 : Number(formOwnership) || 100,
        scope: formType === 'SUPPLIER' || formType === 'VENDOR' ? 'Unconsolidated Vendor' : 'Subsidiary',
        taxId: formTaxId.trim() || undefined,
        category: formCategory.trim() || undefined,
        spendOrRevenue: formSpend ? Number(formSpend) : undefined,
        criticalityRisk: formType === 'SUPPLIER' || formType === 'VENDOR' ? formRisk : undefined,
        notes: formNotes.trim() || undefined
      });
      setShowAddModal(false);
      setFormName('');
      setFormLegalName('');
      setFormTaxId('');
      setFormCategory('');
      setFormSpend('');
      setFormNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (num == null) return EMPTY_DISPLAY;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Multi-Entity Corporate Group & Supply Chain Network
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {entities.length} Registered Nodes
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Audited enterprise group architecture: parent consolidation, operating subsidiaries, and global tier-1 supply chain exposure.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Scope Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Active Scope:</span>
            <span className="font-extrabold text-blue-700">
              {activeScope === 'CONSOLIDATED'
                ? 'Consolidated Group (100%)'
                : (entities.find((e) => e.id === activeScope)?.name || 'Custom Scope')}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Legal Entity / Supplier</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 font-extrabold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'hierarchy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Corporate Group Hierarchy ({subsidiaries.length + (parentEntity ? 1 : 0)})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 font-extrabold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Tier-1 Critical Suppliers & Infrastructure ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('eliminations')}
          className={`pb-3 font-extrabold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'eliminations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Intercompany Elimination Matrix ({relationships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 font-extrabold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Client Workspaces Directory ({companies.length})</span>
        </button>
      </div>

      {/* TAB 1: CORPORATE GROUP HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Quick Scope Switcher Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Audit Scope Switcher:</span>
              <button
                onClick={() => setActiveScope('CONSOLIDATED')}
                className={`px-3 py-1 text-xs rounded-lg font-extrabold transition-all cursor-pointer ${
                  activeScope === 'CONSOLIDATED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Entire Consolidated Group (100%)
              </button>
              {parentEntity && (
                <button
                  onClick={() => setActiveScope(parentEntity.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-extrabold transition-all cursor-pointer ${
                    activeScope === parentEntity.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {parentEntity.name} (Parent Only)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Base Audit Currency:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {['USD', 'EUR', 'GBP', 'JPY', 'PLN'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setActiveCurrency(curr)}
                    className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                      activeCurrency === curr
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hierarchical View: Parent Card */}
          {parentEntity && (
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                    {parentEntity.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                        Ultimate Holding / Parent Company
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {parentEntity.jurisdiction}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Consolidation: 100% Full
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{parentEntity.name}</h3>
                    <p className="text-xs text-slate-500">{parentEntity.legalName} • Reporting Currency: {parentEntity.reportingCurrency} • Tax ID: {parentEntity.taxId || EMPTY_DISPLAY}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveScope(parentEntity.id);
                      onSelectView?.('financials-dashboard');
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Inspect Standalone Financials</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {parentEntity.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">Consolidation Notes: </span>
                  {parentEntity.notes}
                </div>
              )}
            </div>
          )}

          {/* Subsidiaries Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                Operating Subsidiaries & Controlled Legal Entities ({subsidiaries.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">Consolidation method audited according to IFRS 10 / US GAAP ASC 810</span>
            </div>

            {subsidiaries.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No direct operating subsidiaries registered for this corporate group yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subsidiaries.map((sub) => {
                  const isInspecting = activeScope === sub.id;
                  const rel = relationships.find((r) => r.childEntityId === sub.id);
                  return (
                    <div
                      key={sub.id}
                      className={`bg-white p-5 rounded-2xl border transition-all ${
                        isInspecting
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {sub.entityType}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {sub.jurisdiction}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700">
                              {sub.ownershipPercentage}% Ownership
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900 mt-2">{sub.name}</h4>
                          <p className="text-[11px] text-slate-400">{sub.legalName}</p>
                        </div>

                        <button
                          onClick={() => removeEntity(sub.id)}
                          title="Remove Subsidiary"
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Functional Currency</span>
                          <p className="font-extrabold text-slate-800">{sub.reportingCurrency}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Consolidation Method</span>
                          <p className="font-extrabold text-slate-800">{rel?.consolidationMethod || 'FULL'}</p>
                        </div>
                        {sub.taxId && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 uppercase">Tax ID / Legal Registration</span>
                            <p className="font-mono text-slate-700 font-bold">{sub.taxId}</p>
                          </div>
                        )}
                      </div>

                      {rel?.intercompanyNotes && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                          <span className="font-bold text-slate-700">Intercompany: </span>
                          {rel.intercompanyNotes}
                        </div>
                      )}

                      <div className="mt-4 pt-2 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setActiveScope(sub.id);
                            onSelectView?.('financials-dashboard');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isInspecting
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                          }`}
                        >
                          {isInspecting ? 'Active Inspection Scope' : 'Set as Scope & View Financials'}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        {rel?.annualTransactionVolume && (
                          <span className="text-[11px] font-bold text-slate-500">
                            Vol: {formatNumber(rel.annualTransactionVolume)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TIER-1 CRITICAL SUPPLIERS & INFRASTRUCTURE */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <span className="font-bold">Global Supply Chain & Vendor Risk Management</span>
              <p className="text-amber-800">
                Critical single-source suppliers and infrastructure vendors require disclosure in financial notes (ASC 275 / IFRS 7 risks and uncertainties). Track annual capital spend and dependencies here.
              </p>
            </div>
          </div>

          {suppliers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No Tier-1 infrastructure providers or supply chain partners recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((supp) => {
                const rel = relationships.find((r) => r.childEntityId === supp.id);
                const isCritical = supp.criticalityRisk === 'CRITICAL_SINGLE_SOURCE' || supp.criticalityRisk === 'HIGH';

                return (
                  <div
                    key={supp.id}
                    className={`bg-white p-5 rounded-2xl border transition-all ${
                      isCritical
                        ? 'border-amber-200 hover:border-amber-400'
                        : 'border-slate-200 hover:border-slate-300'
                    } shadow-2xs`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {supp.category || 'Supply Chain Partner'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            {supp.jurisdiction}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              supp.criticalityRisk === 'CRITICAL_SINGLE_SOURCE'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : supp.criticalityRisk === 'HIGH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {supp.criticalityRisk?.replace(/_/g, ' ') || 'MODERATE RISK'}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-2">{supp.name}</h4>
                        <p className="text-[11px] text-slate-400">{supp.legalName}</p>
                      </div>

                      <button
                        onClick={() => removeEntity(supp.id)}
                        title="Remove Supplier"
                        className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Annual Procurement Spend</span>
                        <p className="font-extrabold text-slate-900">
                          {formatNumber(supp.spendOrRevenue || rel?.annualTransactionVolume)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Settlement Currency</span>
                        <p className="font-extrabold text-slate-800">{supp.reportingCurrency}</p>
                      </div>
                    </div>

                    {supp.notes && (
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                        <span className="font-bold text-slate-700">Audit Finding / Exposure: </span>
                        {supp.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERCOMPANY ELIMINATION MATRIX */}
      {activeTab === 'eliminations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Intercompany Cross-Charges & Consolidation Eliminations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every transaction between group entities must cancel out in consolidated balances to prevent double-counting.
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
              {relationships.length} Audit Eliminations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Origin / Parent Entity</th>
                  <th className="px-4 py-3">Counterparty / Subsidiary</th>
                  <th className="px-4 py-3">Relationship Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Annual Volume</th>
                  <th className="px-4 py-3">Intercompany Agreement & Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {relationships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No intercompany transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  relationships.map((rel) => {
                    const parent = entities.find((e) => e.id === rel.parentEntityId);
                    const child = entities.find((e) => e.id === rel.childEntityId);

                    return (
                      <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {parent?.name || rel.parentEntityId}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {child?.name || rel.childEntityId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            {rel.relationshipType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {rel.consolidationMethod}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900">
                          {formatNumber(rel.annualTransactionVolume)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {rel.intercompanyNotes || EMPTY_DISPLAY}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CLIENT WORKSPACES DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-60 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client Engagement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {companies
              .filter((c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.country.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((c) => {
                const compProjects = projects.filter((p) => p.companyId === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCompany?.(c.id);
                      onSelectView?.('financials-dashboard');
                    }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                            {c.name}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.country || EMPTY_DISPLAY} • {c.reporting} ({c.ticker || EMPTY_DISPLAY})</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>Revenue: <span className="font-bold text-slate-700">{c.revenue}</span></div>
                      <div>Currency: <span className="font-bold text-slate-700">{c.currency || EMPTY_DISPLAY}</span></div>
                      <div>Active Engagements: <span className="font-bold text-blue-600">{compProjects.length} Project(s)</span></div>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Health {c.healthScore}
                      </span>
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        Enter Workspace <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ADD LEGAL ENTITY / SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Register Corporate Legal Entity / Supplier
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Entity / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple Operations Europe Ltd or Ericsson Radio AB"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    placeholder="Official statutory registered title"
                    value={formLegalName}
                    onChange={(e) => setFormLegalName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entity Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option value="SUBSIDIARY">Operating Subsidiary</option>
                    <option value="JOINT_VENTURE">Joint Venture</option>
                    <option value="OPERATING_UNIT">Regional Operating Unit</option>
                    <option value="SUPPLIER">Tier-1 Critical Supplier</option>
                    <option value="VENDOR">Infrastructure Vendor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jurisdiction / Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ireland, Germany, Taiwan"
                    value={formJurisdiction}
                    onChange={(e) => setFormJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Functional Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="PLN">PLN (zł)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="CHF">CHF (Fr)</option>
                  </select>
                </div>

                {formType !== 'SUPPLIER' && formType !== 'VENDOR' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ownership Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formOwnership}
                      onChange={(e) => setFormOwnership(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Criticality Risk</label>
                    <select
                      value={formRisk}
                      onChange={(e) => setFormRisk(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MODERATE">Moderate Risk</option>
                      <option value="HIGH">High Dependency</option>
                      <option value="CRITICAL_SINGLE_SOURCE">Critical Single Source</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax ID / Business Reg</label>
                  <input
                    type="text"
                    placeholder="e.g. IE-9948201 or EIN"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Annual Volume / Spend ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000000"
                    value={formSpend}
                    onChange={(e) => setFormSpend(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Audit Notes & Disclosures</label>
                  <textarea
                    rows={2}
                    placeholder="Intercompany agreement terms, transfer pricing, or single-source supply disclosures..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
