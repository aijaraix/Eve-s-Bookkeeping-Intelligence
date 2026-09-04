import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const ForecastView: React.FC = () => {
  const { hasFacts, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Financial Projections & Scenario Engine</h2>
        <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • forecasts are not invented from demo Unilever figures</p>
      </div>
      <EmptyExtractionState
        title={hasFacts ? 'Forecast not extracted' : 'Not extracted'}
        detail="This view does not project revenue. Upload documents if you need extracted actuals; predictive figures are not synthesized."
      />
    </div>
  );
};
