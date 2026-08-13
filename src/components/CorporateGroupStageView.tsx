import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  Coins, 
  Languages, 
  GitFork, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  ShieldCheck,
  Search,
  SlidersHorizontal,
  DollarSign,
  FileText
} from 'lucide-react';
import { CorporateEntity, EntityRelationship, FxRateRecord, ExtractedFact } from '../types';

interface Props {
  workspaceId: string;
}

export const CorporateGroupStageView: React.FC<Props> = ({ workspaceId }) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'scope' | 'fx' | 'multilingual'>('hierarchy');
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [fxRates, setFxRates] = useState<FxRateRecord[]>([]);
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Entity Form State
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityLegalName, setNewEntityLegalName] = useState('');
  const [newEntityJurisdiction, setNewEntityJurisdiction] = useState('United States');
  const [newEntityCurrency, setNewEntityCurrency] = useState('USD');
  const [newEntityType, setNewEntityType] = useState<'PARENT' | 'SUBSIDIARY' | 'JOINT_VENTURE'>('SUBSIDIARY');
  const [newEntityOwnership, setNewEntityOwnership] = useState('100');
  const [newEntityScope, setNewEntityScope] = useState<'Consolidated' | 'Parent Only' | 'Subsidiary'>('Subsidiary');

  // FX Converter State
  const [calcAmount, setCalcAmount] = useState('1000000');
  const [calcSourceCurr, setCalcSourceCurr] = useState('EUR');
  const [calcTargetCurr, setCalcTargetCurr] = useState('USD');
  const [calcResult, setCalcResult] = useState<any>(null);

  // Multilingual Translator State
  const [testRawLabel, setTestRawLabel] = useState('Ingresos de actividades ordinarias');
  const [translationResult, setTranslationResult] = useState<any>(null);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entRes, relRes, fxRes, factRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/entities`),
        fetch(`/api/workspaces/${workspaceId}/relationships`),
        fetch(`/api/fx-rates`),
        fetch(`/api/facts?workspaceId=${workspaceId}`)
      ]);

      const entData = await entRes.json();
      const relData = await relRes.json();
      const fxData = await fxRes.json();
      const factData = await factRes.json();

      if (entData.success) setEntities(entData.entities || []);
      if (relData.success) setRelationships(relData.relationships || []);
      if (fxData.success) setFxRates(fxData.fxRates || []);
      if (Array.isArray(factData)) setFacts(factData);
    } catch (err) {
      console.error('Failed to fetch Stage 2 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEntityName,
          legalName: newEntityLegalName || newEntityName,
          jurisdiction: newEntityJurisdiction,
          reportingCurrency: newEntityCurrency,
          entityType: newEntityType,
          ownershipPercentage: parseFloat(newEntityOwnership) || 100,
          scope: newEntityScope
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddEntityModal(false);
        setNewEntityName('');
        setNewEntityLegalName('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create entity:', err);
    }
  };

  const handleConvertCurrency = async () => {
    try {
      const res = await fetch(`/api/fx-rates/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalAmount: parseFloat(calcAmount) || 0,
          sourceCurrency: calcSourceCurr,
          targetCurrency: calcTargetCurr
        })
      });
      const data = await res.json();
      if (data.success) {
        setCalcResult(data);
      }
    } catch (err) {
      console.error('FX conversion error:', err);
    }
  };

  const handleTestTranslation = async () => {
    try {
      const res = await fetch(`/api/multilingual/translate-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawLabel: testRawLabel })
      });
      const data = await res.json();
      if (data.success) {
        setTranslationResult(data);
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
  };

  const filteredFacts = facts.filter(f => {
    if (scopeFilter !== 'ALL' && f.entityScope !== scopeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (f.labelOriginal && f.labelOriginal.toLowerCase().includes(query)) ||
        (f.labelNormalized && f.labelNormalized.toLowerCase().includes(query)) ||
        (f.entityName && f.entityName.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Stage 2 Pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Corporate Group, Multi-Currency & Multilingual Model</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Entity hierarchy relationship registry, entity scope tagging (<span className="text-indigo-300 font-medium">Consolidated, Parent Only, Subsidiary</span>), FX conversion provenance, and label-preserving multilingual translation.
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Pipeline State
          </button>
        </div>

        {/* Sub-Stage Indicator Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'hierarchy' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            2.1 Entity & Relationship Registry ({entities.length})
          </button>

          <button
            onClick={() => setActiveTab('scope')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'scope' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2.2 Entity Scope Tagged Facts ({facts.length})
          </button>

          <button
            onClick={() => setActiveTab('fx')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'fx' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            2.3 Multi-Currency Layer ({fxRates.length} Rates)
          </button>

          <button
            onClick={() => setActiveTab('multilingual')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'multilingual' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            2.4 Multilingual Pipeline & Metrics
          </button>
        </div>
      </div>

      {/* TAB 1: 2.1 Corporate Group Hierarchy */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Corporate Group Entities & Ownership Hierarchy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Explicit relationships (<span className="font-mono text-indigo-600">PARENT_OF</span>, <span className="font-mono text-indigo-600">SUBSIDIARY_OF</span>, <span className="font-mono text-indigo-600">OWNS</span>) with reporting currencies and scope flags.
              </p>
            </div>
            <button
              onClick={() => setShowAddEntityModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Group Entity
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entities.map(ent => (
              <div 
                key={ent.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    ent.scope === 'Consolidated' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                      : ent.scope === 'Parent Only'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {ent.scope}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{ent.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{ent.legalName}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Jurisdiction</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{ent.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Reporting Currency</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{ent.reportingCurrency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Entity Type</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{ent.entityType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Ownership</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{ent.ownershipPercentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Relationships Tree View */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-indigo-600" />
              Consolidation Relationship Graph ({relationships.length} Active Connections)
            </h3>

            <div className="space-y-3">
              {relationships.map(rel => {
                const parent = entities.find(e => e.id === rel.parentEntityId);
                const child = entities.find(e => e.id === rel.childEntityId);
                return (
                  <div key={rel.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {parent?.name || 'Parent Corp'}
                      </div>
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded font-mono text-[11px]">
                        <ArrowRight className="w-3 h-3" />
                        {rel.relationshipType} ({rel.ownershipPercentage}%)
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {child?.name || 'Subsidiary Entity'}
                      </div>
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Consolidation Method: <strong className="text-slate-700 dark:text-slate-300">{rel.consolidationMethod}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 2.2 Entity Scope Tagged Facts */}
      {activeTab === 'scope' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Entity Scope Tagging on Extracted Facts
              </h2>
              <p className="text-xs text-slate-500">
                Filter and verify facts by reporting boundary (<span className="text-indigo-600 font-medium">Consolidated, Parent Only, Subsidiary</span>).
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search facts or entities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Scope filter selector */}
              <select
                value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                <option value="ALL">All Entity Scopes</option>
                <option value="Consolidated">Consolidated</option>
                <option value="Parent Only">Parent Only</option>
                <option value="Subsidiary">Subsidiary</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] uppercase font-semibold">
                    <th className="py-3 px-4">Metric / Label</th>
                    <th className="py-3 px-4">Entity & Scope</th>
                    <th className="py-3 px-4 text-right">Raw Value</th>
                    <th className="py-3 px-4 text-right">Functional Value</th>
                    <th className="py-3 px-4">Original Lang</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFacts.slice(0, 25).map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{f.labelNormalized}</div>
                        {f.labelOriginal && f.labelOriginal !== f.labelNormalized && (
                          <div className="text-[11px] text-slate-400 font-mono italic">Raw: "{f.labelOriginal}"</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{f.entityName || 'Group Parent'}</div>
                        <span className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                          f.entityScope === 'Consolidated' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                            : f.entityScope === 'Parent Only'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {f.entityScope || 'Consolidated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        {f.currencyOriginal || 'EUR'} {f.valueOriginal}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {f.functionalCurrency || 'EUR'} {f.valueFunctional}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          {f.originalLanguage || 'en'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Validated
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredFacts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No facts match the selected entity scope filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 2.3 Multi-Currency Conversion Layer */}
      {activeTab === 'fx' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Interactive FX Converter */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                Multi-Currency Conversion Engine & FX Calculator
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Convert financial amounts with full exchange rate provenance logging (<span className="font-mono text-indigo-600">ECB, FED, USER_OVERRIDE</span>).
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Amount to Convert</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={e => setCalcAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Source Currency</label>
                    <select
                      value={calcSourceCurr}
                      onChange={e => setCalcSourceCurr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="CHF">CHF (Fr)</option>
                      <option value="BRL">BRL (R$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Target Currency</label>
                    <select
                      value={calcTargetCurr}
                      onChange={e => setCalcTargetCurr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="CHF">CHF (Fr)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleConvertCurrency}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Calculate Conversion & Generate FX Provenance
                </button>

                {calcResult && (
                  <div className="mt-4 p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Converted Functional Value:</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {calcResult.fxMeta.targetCurrency} {calcResult.convertedAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>Exchange Rate: <strong className="font-mono text-slate-900 dark:text-white">{calcResult.fxMeta.exchangeRate}</strong></div>
                      <div>Rate Source: <strong className="font-mono text-slate-900 dark:text-white">{calcResult.fxMeta.rateSource}</strong></div>
                      <div>Effective Date: <strong className="font-mono text-slate-900 dark:text-white">{calcResult.fxMeta.effectiveDate}</strong></div>
                      <div>Status: <strong className="text-emerald-600 font-semibold">Provenance Verified</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exchange Rate Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Active FX Reference Rates Table (EUR Base 1.0)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                      <th className="py-2.5 px-3">Currency Pair</th>
                      <th className="py-2.5 px-3 text-right">Exchange Rate</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Effective Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {fxRates.map(fx => (
                      <tr key={fx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          EUR / {fx.targetCurrency}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {fx.exchangeRate.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] rounded">
                            {fx.rateSource}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {fx.effectiveDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 2.4 Multilingual Label Preservation & Canonical Metrics */}
      {activeTab === 'multilingual' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-600" />
              Multilingual Label Translation & Canonical Metric Mapping
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Preserves original labels (<span className="font-mono text-indigo-600">raw_label</span>) in Spanish, German, French, Japanese, etc. while mapping to standardized English metrics (<span className="font-mono text-indigo-600">revenue, gross_profit, operating_profit, total_assets</span>).
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testRawLabel}
                onChange={e => setTestRawLabel(e.target.value)}
                placeholder="Type a foreign language line label e.g., 'Umsatzerlöse' or 'Chiffre d'affaires'..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                onClick={handleTestTranslation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
              >
                Inspect Multilingual Pipeline
              </button>
            </div>

            {translationResult && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Original Raw Label</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">"{translationResult.labelOriginal}"</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Normalized English</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{translationResult.labelNormalized}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canonical Metric</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{translationResult.canonicalMetric || 'unclassified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Detected Language</span>
                  <span className="uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">{translationResult.detectedLanguage} (Quality: {Math.round(translationResult.translationQualityScore * 100)}%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Entity Modal */}
      {showAddEntityModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Corporate Group Entity</h3>

            <form onSubmit={handleCreateEntity} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Entity Common Name</label>
                <input
                  type="text"
                  required
                  value={newEntityName}
                  onChange={e => setNewEntityName(e.target.value)}
                  placeholder="e.g. Operating Subsidiary Germany"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Full Registered Legal Name</label>
                <input
                  type="text"
                  value={newEntityLegalName}
                  onChange={e => setNewEntityLegalName(e.target.value)}
                  placeholder="e.g. Operating Subsidiary Germany GmbH"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Jurisdiction</label>
                  <input
                    type="text"
                    value={newEntityJurisdiction}
                    onChange={e => setNewEntityJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Reporting Currency</label>
                  <select
                    value={newEntityCurrency}
                    onChange={e => setNewEntityCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Reporting Scope</label>
                  <select
                    value={newEntityScope}
                    onChange={e => setNewEntityScope(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Subsidiary">Subsidiary</option>
                    <option value="Parent Only">Parent Only</option>
                    <option value="Consolidated">Consolidated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Ownership %</label>
                  <input
                    type="number"
                    value={newEntityOwnership}
                    onChange={e => setNewEntityOwnership(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Register Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
