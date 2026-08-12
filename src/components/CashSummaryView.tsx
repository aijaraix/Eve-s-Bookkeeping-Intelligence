import React from 'react';
import { FinancialSummary } from '../types';

interface CashSummaryProps {
  summary: FinancialSummary | null;
  onDrillDown?: (line: string, amountEUR?: number) => void;
}

export const CashSummaryView: React.FC<CashSummaryProps> = ({ summary, onDrillDown }) => {
  const handleCardClick = (title: string, amount: number) => {
    if (onDrillDown) {
      onDrillDown(title, amount);
    }
  };

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
          LIQUIDITY & TREASURY AUDIT
        </span>
        <h1 className="text-2xl font-extrabold text-neutral-900 mt-1">Cash Flow & Liquidity Summary</h1>
        <p className="text-xs text-neutral-500 mt-1">Opening cash, operational inflows, CapEx outflows, and closing treasury balances reconciled across central bank accounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleCardClick('Opening Cash Treasury Balance', 6850000000)}
          className="bg-white border border-neutral-200 hover:border-neutral-900 rounded-2xl p-5 shadow-xs cursor-pointer transition"
        >
          <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Opening Cash (Q1 2026)</span>
          <p className="text-xl font-extrabold font-mono text-neutral-900 mt-2">€6,850,000,000.00</p>
          <span className="text-[10px] text-neutral-500 mt-1 block">Central Bank Accounts</span>
        </div>

        <div
          onClick={() => handleCardClick('Operating Cash Inflows', 3240000000)}
          className="bg-white border border-neutral-200 hover:border-neutral-900 rounded-2xl p-5 shadow-xs cursor-pointer transition"
        >
          <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Operating Inflows</span>
          <p className="text-xl font-extrabold font-mono text-emerald-700 mt-2">+€3,240,000,000.00</p>
          <span className="text-[10px] text-emerald-800 font-bold mt-1 block">Customer Service Receipts</span>
        </div>

        <div
          onClick={() => handleCardClick('CapEx & Debt Service Outflows', 2850000000)}
          className="bg-white border border-neutral-200 hover:border-neutral-900 rounded-2xl p-5 shadow-xs cursor-pointer transition"
        >
          <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">CapEx & Interest Outflows</span>
          <p className="text-xl font-extrabold font-mono text-rose-700 mt-2">-€2,850,000,000.00</p>
          <span className="text-[10px] text-rose-800 font-bold mt-1 block">5G Rollout & Bond Coupons</span>
        </div>

        <div
          onClick={() => handleCardClick('Closing Cash Treasury Balance', 7240000000)}
          className="bg-neutral-900 text-white rounded-2xl p-5 shadow-xs cursor-pointer transition"
        >
          <span className="text-xs text-neutral-300 uppercase font-bold tracking-wider">Closing Cash (Q2 2026)</span>
          <p className="text-xl font-extrabold font-mono text-emerald-400 mt-2">€7,240,000,000.00</p>
          <span className="text-[10px] text-neutral-300 mt-1 block">+€390M Net Generation</span>
        </div>
      </div>
    </div>
  );
};
