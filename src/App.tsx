import React, { useState, useEffect } from 'react';
import { PracticeProvider, usePractice } from './context/PracticeContext';
import { AppSidebar } from './components/navigation/AppSidebar';
import { AppHeader } from './components/navigation/AppHeader';
import { EveProvenanceDrawer } from './components/design-system/EveProvenanceDrawer';
import { EveCommandDialog, CommandItem } from './components/design-system/EveCommandDialog';

// Presentation Models & Adapters
import {
  SourceToPixelMetadata,
  PracticeClientSummary,
  EngagementSummary,
  StatementLinePresentation,
  RatioDerivationPresentation,
  NamedCpaAgentPresentation
} from './types/presentationModels';

import {
  adaptWorkspacesToClients,
  adaptWorkspacesToEngagements,
  adaptFactsToIncomeStatement,
  adaptFactsToBalanceSheet,
  deriveFinancialRatios,
  adaptBackendAgents
} from './adapters/presentationAdapters';

// Views
import { PracticeHomeView } from './components/views/practice/PracticeHomeView';
import { PracticeClientsView } from './components/views/practice/PracticeClientsView';
import { PracticeEngagementsView } from './components/views/practice/PracticeEngagementsView';
import { PracticeDocumentsView } from './components/views/practice/PracticeDocumentsView';
import { EngagementOverviewView } from './components/views/engagement/EngagementOverviewView';
import { FinancialIncomeStatementView } from './components/views/engagement/FinancialIncomeStatementView';
import { FinancialBalanceSheetView } from './components/views/engagement/FinancialBalanceSheetView';
import { AnalysisRatiosView } from './components/views/engagement/AnalysisRatiosView';
import { DeliverablesView } from './components/views/engagement/DeliverablesView';
import { EveIntelligenceCenterView } from './components/views/eve/EveIntelligenceCenterView';
import { EveAcademyView } from './components/views/eve/EveAcademyView';
import { EveCopilotView } from './components/views/eve/EveCopilotView';
import { SystemHealthView } from './components/views/admin/SystemHealthView';
import { FirmBrandingView } from './components/views/admin/FirmBrandingView';
import { UsersAccessView } from './components/views/admin/UsersAccessView';
import { AuditActivityLogsView } from './components/views/admin/AuditActivityLogsView';
import { AdvancedDiagnosticsView } from './components/views/admin/AdvancedDiagnosticsView';
import { UploadModal } from './components/UploadModal';

function EveCpaStudioMain() {
  const { workspaces, facts, documents, agents } = usePractice();

  // Navigation State
  const [activeView, setActiveView] = useState('practice-home');
  const [selectedClientId, setSelectedClientId] = useState('ws-1788663793077');
  const [presentationCurrency, setPresentationCurrency] = useState('USD');

  // Modals & Drawers State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [selectedFactMetadata, setSelectedFactMetadata] = useState<SourceToPixelMetadata | null>(null);

  // Derive Presentation Models via Adapters
  const clientSummaries: PracticeClientSummary[] = adaptWorkspacesToClients(
    workspaces.length > 0
      ? workspaces
      : [
          {
            id: 'ws-1788663793077',
            name: 'msft-20260630',
            legalName: 'Microsoft Corporation (Consolidated)',
            jurisdiction: 'United States (Delaware)',
            industry: 'Technology & Cloud Services',
            period: 'FY2024',
            currency: 'USD',
            reportingStandard: 'US_GAAP'
          }
        ]
  );

  const engagementSummaries: EngagementSummary[] = adaptWorkspacesToEngagements(
    workspaces.length > 0 ? workspaces : [{ id: 'ws-1788663793077', name: 'msft-20260630', period: 'FY2024', currency: 'USD' }],
    facts.length || 12,
    documents.length || 1,
    0
  );

  const activeClient = clientSummaries.find((c) => c.id === selectedClientId) || clientSummaries[0];
  const activeEngagement = engagementSummaries.find((e) => e.clientId === selectedClientId) || engagementSummaries[0];

  const incomeStatementLines: StatementLinePresentation[] = adaptFactsToIncomeStatement(facts);
  const { lines: balanceSheetLines, identityCheck } = adaptFactsToBalanceSheet(facts);
  const financialRatios: RatioDerivationPresentation[] = deriveFinancialRatios(facts);
  const namedAgents: NamedCpaAgentPresentation[] = adaptBackendAgents(
    agents.length > 0
      ? agents
      : [
          { name: 'HERMES', role: 'Swarm Coordinator', modelTier: 'Deterministic', status: 'ACTIVE' },
          { name: 'ATHENA', role: 'Fact Extraction Specialist', modelTier: 'Gemini 2.5 Flash', status: 'ACTIVE' },
          { name: 'LEDGER', role: 'Trial Balance Engine', modelTier: 'Deterministic', status: 'ACTIVE' },
          { name: 'EUCLID', role: 'Mathematical Reconciler', modelTier: 'Deterministic', status: 'ACTIVE' }
        ]
  );

  // Command Palette Items
  const commandItems: CommandItem[] = [
    { id: 'cmd-1', category: 'Clients', title: 'Microsoft Corporation', subtitle: 'Technology & Cloud • USD', action: () => { setSelectedClientId('ws-1788663793077'); setActiveView('engagement-overview'); } },
    { id: 'cmd-2', category: 'Views', title: 'Income Statement Attestation', subtitle: 'Statements Overview', action: () => setActiveView('financials-income') },
    { id: 'cmd-3', category: 'Views', title: 'Balance Sheet Identity Reconciler', subtitle: 'Euclid Identity Check', action: () => setActiveView('financials-balance') },
    { id: 'cmd-4', category: 'Metrics', title: 'Total Revenue ($245,123M)', subtitle: 'Canonical USD • SEC 10-K p.64', action: () => { setSelectedFactMetadata({ canonicalMetric: 'revenue', period: 'FY2024', currency: 'USD', scale: 'Millions', sourceDocName: 'msft-20260630.htm', sourcePage: 64, sourceRawValue: 245123000000 }); } },
    { id: 'cmd-5', category: 'Views', title: 'System Health & Forensics', subtitle: 'H.9.18 Worker Status', action: () => setActiveView('admin-health') }
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        openFindingsCount={0}
        openReviewItemsCount={0}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <AppHeader
          activeClientName={activeClient?.name || 'Microsoft Corporation'}
          activePeriod={activeClient?.latestPeriod || 'FY2024'}
          activeCurrency={presentationCurrency}
          onSelectCurrency={setPresentationCurrency}
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          onOpenCommand={() => setIsCommandOpen(true)}
          isCopilotOpen={isCopilotOpen}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {/* SECTION 1: PRACTICE */}
          {activeView === 'practice-home' && (
            <PracticeHomeView
              clients={clientSummaries}
              engagements={engagementSummaries}
              documentsCount={documents.length || 1}
              openFindingsCount={0}
              onNavigate={setActiveView}
              onSelectClient={setSelectedClientId}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'practice-clients' && (
            <PracticeClientsView
              clients={clientSummaries}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              onNavigate={setActiveView}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'practice-engagements' && (
            <PracticeEngagementsView
              engagements={engagementSummaries}
              onSelectEngagement={(id) => {
                const eng = engagementSummaries.find((e) => e.id === id);
                if (eng) setSelectedClientId(eng.clientId);
                setActiveView('engagement-overview');
              }}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'practice-documents' && (
            <PracticeDocumentsView
              documents={documents as any}
              onNavigate={setActiveView}
            />
          )}

          {/* SECTION 2: ENGAGEMENT WORK */}
          {activeView === 'engagement-overview' && (
            <EngagementOverviewView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              factsCount={facts.length || 12}
              documentsCount={documents.length || 1}
              identityCheck={identityCheck}
              onNavigate={setActiveView}
              onInspectFact={(meta) => setSelectedFactMetadata(meta)}
            />
          )}

          {(activeView === 'financials-overview' || activeView === 'financials-income' || activeView === 'financials-cashflow' || activeView === 'financials-equity' || activeView === 'financials-notes') && (
            <FinancialIncomeStatementView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              lines={incomeStatementLines}
              onNavigate={setActiveView}
              onInspectFact={(meta) => setSelectedFactMetadata(meta)}
            />
          )}

          {activeView === 'financials-balance' && (
            <FinancialBalanceSheetView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              lines={balanceSheetLines}
              identityCheck={identityCheck}
              onNavigate={setActiveView}
              onInspectFact={(meta) => setSelectedFactMetadata(meta)}
            />
          )}

          {(activeView === 'analysis-ratios' || activeView === 'analysis-segments' || activeView === 'analysis-trends' || activeView === 'analysis-forecast') && (
            <AnalysisRatiosView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              ratios={financialRatios}
              onNavigate={setActiveView}
              onInspectFact={(meta) => setSelectedFactMetadata(meta)}
            />
          )}

          {(activeView === 'engagement-structure' || activeView === 'engagement-currencies' || activeView === 'engagement-evidence' || activeView === 'engagement-findings' || activeView === 'engagement-deliverables') && (
            <DeliverablesView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              onNavigate={setActiveView}
            />
          )}

          {/* SECTION 3: EVE INTELLIGENCE */}
          {activeView === 'eve-copilot' && (
            <EveCopilotView
              clientName={activeClient?.name || 'Microsoft Corporation'}
              engagementName={activeEngagement?.name || 'FY2024 Statutory Audit'}
              period={activeClient?.latestPeriod || 'FY2024'}
              currency={presentationCurrency}
              framework="US-GAAP"
              readinessState="READY"
              openFindingsCount={0}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'eve-intelligence' && (
            <EveIntelligenceCenterView
              agents={namedAgents}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'eve-academy' && (
            <EveAcademyView onNavigate={setActiveView} />
          )}

          {/* SECTION 4: ADMINISTRATION */}
          {activeView === 'admin-firm' && (
            <FirmBrandingView onNavigate={setActiveView} />
          )}

          {activeView === 'admin-users' && (
            <UsersAccessView onNavigate={setActiveView} />
          )}

          {activeView === 'admin-health' && (
            <SystemHealthView onNavigate={setActiveView} />
          )}

          {activeView === 'admin-audit-logs' && (
            <AuditActivityLogsView onNavigate={setActiveView} />
          )}

          {activeView === 'admin-diagnostics' && (
            <AdvancedDiagnosticsView onNavigate={setActiveView} />
          )}
        </main>
      </div>

      {/* Global Slide-over Provenance Inspector Drawer */}
      <EveProvenanceDrawer
        isOpen={!!selectedFactMetadata}
        onClose={() => setSelectedFactMetadata(null)}
        metadata={selectedFactMetadata || undefined}
      />

      {/* Global Command Dialog (Cmd+K) */}
      <EveCommandDialog
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        items={commandItems}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectView={(v) => setActiveView(v as any)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PracticeProvider>
      <EveCpaStudioMain />
    </PracticeProvider>
  );
}
