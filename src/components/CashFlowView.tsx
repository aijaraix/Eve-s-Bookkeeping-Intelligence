import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { formatCurrency } from '../utils/financialFormatter';
import { CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

const cashFlowItems = [
  { id: 'cf_ops_header', label: 'Cash flows from operating activities', isHeader: true, values: {} },
  { id: 'cf_pbt', label: 'Profit before tax', isHeader: false, values: { '2022': 10338, '2023': 9343, '2024': 9898 }, note: 'P&L' },
  { id: 'cf_depr', label: 'Depreciation, amortisation and impairment', isHeader: false, values: { '2022': 1845, '2023': 1910, '2024': 1950 }, note: 'Note 9/10' },
  { id: 'cf_wc', label: 'Decrease / (increase) in working capital', isHeader: false, values: { '2022': -640, '2023': 450, '2024': -320 }, note: 'Note 14' },
  { id: 'cf_tax_paid', label: 'Tax paid', isHeader: false, values: { '2022': -2120, '2023': -2180, '2024': -2250 }, note: 'Note 8' },
  { id: 'cf_net_ops', label: 'Net cash flow from operating activities', isHeader: false, isTotal: true, values: { '2022': 9423, '2023': 9523, '2024': 9278 } },
  { id: 'cf_inv_header', label: 'Cash flows from investing activities', isHeader: true, values: {} },
  { id: 'cf_capex', label: 'Capital expenditure on property, plant & equipment', isHeader: false, values: { '2022': -1610, '2023': -1680, '2024': -1720 }, note: 'Note 10' },
  { id: 'cf_acq', label: 'Acquisitions of group companies and businesses', isHeader: false, values: { '2022': -490, '2023': -210, '2024': -350 }, note: 'Note 21' },
  { id: 'cf_net_inv', label: 'Net cash used in investing activities', isHeader: false, isTotal: true, values: { '2022': -2100, '2023': -1890, '2024': -2070 } },
  { id: 'cf_fin_header', label: 'Cash flows from financing activities', isHeader: true, values: {} },
  { id: 'cf_div', label: 'Dividends paid to shareholders', isHeader: false, values: { '2022': -4430, '2023': -4460, '2024': -4510 }, note: 'Note 18' },
  { id: 'cf_shares', label: 'Repurchase of shares / treasury', isHeader: false, values: { '2022': -1500, '2023': -1500, '2024': -1500 }, note: 'Note 19' },
  { id: 'cf_net_fin', label: 'Net cash used in financing activities', isHeader: false, isTotal: true, values: { '2022': -6890, '2023': -7810, '2024': -6678 } },
  { id: 'cf_net_change', label: 'Net increase / (decrease) in cash & cash equivalents', isHeader: false, isTotal: true, values: { '2022': 433, '2023': -177, '2024': 530 } },
];

export const CashFlowView: React.FC = () => {
  const { selectedCompany } = usePractice();

  return (
    <div id="cash-flow-view" className="space-y-6">
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Consolidated Cash Flow Statement</h1>
          <p className="text-xs text-slate-400 mt-1">
            IAS 7 Statement of Cash Flows ({selectedCompany.currency} in {selectedCompany.scale}).
          </p>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="font-semibold text-white">Free Cash Flow (FY2024): </span>
            <span className="font-mono font-bold text-emerald-400">€7,558M</span>
            <span className="text-[11px] text-slate-400 ml-1.5">(Operating Cash - Capex)</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Activity Caption</th>
              <th className="py-3 px-3 text-center font-semibold w-24">Note</th>
              <th className="py-3 px-3 text-right font-semibold">FY2022</th>
              <th className="py-3 px-3 text-right font-semibold">FY2023</th>
              <th className="py-3 px-4 text-right font-semibold text-white">FY2024 (Audited)</th>
              <th className="py-3 px-4 text-center font-semibold w-32">Integrity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {cashFlowItems.map((item) => {
              if (item.isHeader) {
                return (
                  <tr key={item.id} className="bg-slate-950/40 text-cyan-400 font-semibold font-mono text-[11px]">
                    <td colSpan={6} className="py-2.5 px-4 uppercase tracking-wider">
                      {item.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/60 transition ${
                    item.isTotal ? 'bg-slate-850/50 font-semibold text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4">{item.label}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">
                    {item.note || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {formatCurrency(item.values['2022'], selectedCompany.currency, selectedCompany.scale)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {formatCurrency(item.values['2023'], selectedCompany.currency, selectedCompany.scale)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatCurrency(item.values['2024'], selectedCompany.currency, selectedCompany.scale)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>100%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
