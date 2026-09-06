import React from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveFinancialTable } from '../../design-system/EveFinancialTable';
import { StatementLinePresentation, SourceToPixelMetadata } from '../../../types/presentationModels';
import { ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';

export interface FinancialIncomeStatementViewProps {
  clientName: string;
  engagementName: string;
  period: string;
  currency: string;
  framework: string;
  readinessState: string;
  openFindingsCount: number;
  lines: StatementLinePresentation[];
  onNavigate: (viewId: string) => void;
  onInspectFact: (metadata: SourceToPixelMetadata) => void;
}

export const FinancialIncomeStatementView: React.FC<FinancialIncomeStatementViewProps> = ({
  clientName,
  engagementName,
  period,
  currency = 'USD',
  framework = 'US-GAAP',
  readinessState = 'READY',
  openFindingsCount = 0,
  lines,
  onNavigate,
  onInspectFact
}) => {
  return (
    <div className="space-y-0">
      <EveEngagementHeader
        clientName={clientName}
        engagementName={engagementName}
        period={period}
        currency={currency}
        framework={framework}
        readinessState={readinessState}
        openFindingsCount={openFindingsCount}
        onSwitchEngagement={() => onNavigate('practice-engagements')}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <EvePageHeader
          category="Financial Statements"
          title="Consolidated Statement of Income"
          description="Audited revenues, operating expenses, and net income extracted from SEC Form 10-K with source-to-pixel provenance."
        />

        <EveFinancialTable
          title="Consolidated Statements of Operations"
          statementType="INCOME STATEMENT"
          entityName={clientName}
          periods={[period]}
          lines={lines}
          currency={currency}
          scale="In Millions"
          onInspectFact={onInspectFact}
        />
      </div>
    </div>
  );
};
