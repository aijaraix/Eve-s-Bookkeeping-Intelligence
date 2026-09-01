import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const SegmentAnalysisView: React.FC = () => {
  const { financialFacts, hasFacts, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const segmentData = financialFacts
    .filter((f) => f.statementType === 'SEGMENT')
    .map((f, idx) => ({
      name: f.label,
      turnover: Math.abs(f.value) / 1_000_000,
      color: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][idx % 5]
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Business Unit & Segment Breakdown</h2>
        <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • segment facts only</p>
      </div>
      {!hasFacts || segmentData.length === 0 ? (
        <EmptyExtractionState title="Segment analysis not extracted" />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase">TURNOVER BY SEGMENT</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="turnover" radius={[8, 8, 0, 0]}>
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
