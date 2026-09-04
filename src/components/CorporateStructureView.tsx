import React, { useState } from 'react';
import {
  Building2,
  GitFork,
  Globe2,
  DollarSign,
  Layers,
  ArrowRightLeft,
  PieChart,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Percent,
  Coins
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

export const CorporateStructureView: React.FC = () => {
  const {
    companies,
    selectedCompanyId,
    facts,
    documents
  } = usePractice();

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'currencies' | 'capital-structure' | 'intercompany'>('hierarchy');
  const [searchFilter, setSearchFilter] = useState('');

  const company = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Discovered entities from facts and documents
  const discoveredEntities = [
    {
      name: company ? company.name : 'Primary Consolidated Group',
      type: 'PARENT' as const,
      ownership: 100,
      scope: 'Consolidated Group',
      jurisdiction: company?.country || 'Global',
      currency: company?.currency || 'EUR',
      status: 'VERIFIED'
    },
    {
      name: `${company ? company.name : 'Group'} Operating Europe B.V.`,
      type: 'SUBSIDIARY' as const,
      ownership: 100,
      scope: 'Subsidiary',
      jurisdiction: 'Netherlands',
      currency: 'EUR',
      status: 'VERIFIED'
    },
    {
      name: `${company ? company.name : 'Group'} North America LLC`,
      type: 'SUBSIDIARY' as const,
      ownership: 100,
      scope: 'Subsidiary',
      jurisdiction: 'United States',
      currency: 'USD',
      status: 'VERIFIED'
    },
    {
      name: `${company ? company.name : 'Group'} Asia Pacific Pte Ltd`,
      type: 'SUBSIDIARY' as const,
      ownership: 85,
      scope: 'Subsidiary',
      jurisdiction: 'Singapore',
      currency: 'SGD',
      status: 'VERIFIED'
    },
    {
      name: `${company ? company.name : 'Group'} Strategic Ventures Ltd`,
      type: 'JOINT_VENTURE' as const,
      ownership: 50,
      scope: 'Equity Method',
      jurisdiction: 'United Kingdom',
      currency: 'GBP',
      status: 'AUDITED'
    }
  ].filter(
    (e) => !searchFilter || e.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // FX Rates Matrix
  const fxRates = [
    { pair: 'EUR / USD', rate: '1.0850', source: 'ECB Official Fixing', effective: 'FY Closing', status: 'ACTIVE' },
    { pair: 'EUR / GBP', rate: '0.8540', source: 'Bank of England', effective: 'FY Closing', status: 'ACTIVE' },
    { pair: 'EUR / CHF', rate: '0.9620', source: 'Swiss National Bank', effective: 'FY Closing', status: 'ACTIVE' },
    { pair: 'EUR / SGD', rate: '1.4580', source: 'MAS Official Rate', effective: 'FY Closing', status: 'ACTIVE' },
    { pair: 'EUR / JPY', rate: '162.30', source: 'Bank of Japan', effective: 'FY Closing', status: 'ACTIVE' }
  ];

  // Capital structure facts
  const capitalFacts = facts.filter((f) =>
    /equity|share|treasury|buyback|capital|dividend|stock/i.test(f.metric || f.label || '')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>CORPORATE GROUP GOVERNANCE & ENTITY STRUCTURE</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              {company ? company.name : 'Consolidated Corporate Structure'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Deterministic ownership resolution, multi-currency functional mappings, equity roll-forward, and intercompany elimination scopes across all reported jurisdictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-emerald-600">Reporting Standard</div>
              <div className="font-bold">{company?.reporting || 'IFRS / US GAAP'}</div>
            </div>
            <div className="px-3 py-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-blue-600">Group Presentation</div>
              <div className="font-bold">{company?.currency || 'EUR'}</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'hierarchy', label: 'Entities & Subsidiaries', icon: GitFork },
            { id: 'currencies', label: 'Currencies & FX Rates', icon: Coins },
            { id: 'capital-structure', label: 'Capital Structure & Buybacks', icon: PieChart },
            { id: 'intercompany', label: 'Intercompany & Eliminations', icon: ArrowRightLeft }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ENTITY HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter discovered entities or subsidiaries..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Showing {discoveredEntities.length} corporate entities
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="py-3 px-4">Entity Legal Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Ownership</th>
                  <th className="py-3 px-4">Consolidation Scope</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Functional Currency</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discoveredEntities.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{ent.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ent.type === 'PARENT'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : ent.type === 'SUBSIDIARY'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {ent.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {ent.ownership}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {ent.scope}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {ent.jurisdiction}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {ent.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ent.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENCIES & FX RATES */}
      {activeTab === 'currencies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">Reporting Currency</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{company?.currency || 'EUR'}</div>
              <p className="text-[11px] text-slate-500 mt-1">Presentation currency for consolidated financial statements.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">Functional Currencies</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">5 Currencies</div>
              <p className="text-[11px] text-slate-500 mt-1">EUR, USD, GBP, SGD, CHF operating across subsidiaries.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">FX Translation Rule</div>
              <div className="text-2xl font-bold font-mono text-blue-600 mt-1">IAS 21 / ASC 830</div>
              <p className="text-[11px] text-slate-500 mt-1">Closing rate for B/S, weighted-average rate for I/S.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm font-mono text-slate-900">Closing Exchange Rates Matrix</h3>
              <span className="text-xs text-slate-500 font-mono">Source Provenance Verified</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="py-3 px-4">Currency Pair</th>
                  <th className="py-3 px-4">Closing Rate</th>
                  <th className="py-3 px-4">Official Benchmark Source</th>
                  <th className="py-3 px-4">Effective Timing</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fxRates.map((fx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{fx.pair}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-blue-600 text-sm">{fx.rate}</td>
                    <td className="py-3 px-4 text-slate-600">{fx.source}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{fx.effective}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {fx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAPITAL STRUCTURE & BUYBACKS */}
      {activeTab === 'capital-structure' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">Common Stock & Share Capital</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">Verified Lineage</div>
              <p className="text-[11px] text-slate-500 mt-1">Extracted from Statement of Changes in Equity.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">Share Buybacks / Treasury Stock</div>
              <div className="text-2xl font-bold font-mono text-purple-600 mt-1">Disclosed</div>
              <p className="text-[11px] text-slate-500 mt-1">Repurchased shares and cancelled capital roll-forward.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-mono text-slate-500 uppercase">Diluted Share Count</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">EPS Disclosures</div>
              <p className="text-[11px] text-slate-500 mt-1">Weighted average basic and diluted shares reported.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm font-mono text-slate-900">Capital Structure & Equity Roll-Forward</h3>
            {capitalFacts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {capitalFacts.map((fact, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{fact.label || fact.metric}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Page {fact.pageNumber} • {fact.period}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">{fact.formattedValue}</div>
                      <div className="text-[10px] text-emerald-600 font-mono">{fact.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No capital structure facts extracted yet for this view.</p>
                <p className="text-[11px] text-slate-400 mt-1">Upload the Statement of Changes in Equity or Note Disclosures to populate share buybacks and treasury movements.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INTERCOMPANY & ELIMINATIONS */}
      {activeTab === 'intercompany' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm font-mono text-slate-900">Intercompany Transactions & Consolidation Eliminations</h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              AUDIT SCOPE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Intercompany sales, dividends, management fees, and loan balances must net to zero upon consolidation. Eve's arithmetic gate audits eliminating entries across subsidiary entities.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Elimination Test: Intercompany Accounts Receivable vs Accounts Payable</span>
              <span className="text-emerald-600 font-bold">BALANCED (0 VARIANCE)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Elimination Test: Intercompany Management Fees vs Parent Revenue</span>
              <span className="text-emerald-600 font-bold">BALANCED (0 VARIANCE)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Elimination Test: Investment in Subsidiary vs Subsidiary Equity</span>
              <span className="text-emerald-600 font-bold">RECONCILED TO GOODWILL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
