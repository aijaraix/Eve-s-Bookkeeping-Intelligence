import { actionAttributes } from './academy/uiActionRegistry';
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
import { RecordedEngagementEvidenceView } from './components/views/engagement/RecordedEngagementEvidenceView';
import { DeliverablesView } from './components/views/engagement/DeliverablesView';
import { EveIntelligenceCenterView } from './components/views/eve/EveIntelligenceCenterView';
import { EveAcademyView } from './components/views/eve/EveAcademyView';
import { EveUniversityView } from './components/views/eve/EveUniversityView';
import { EveCopilotView } from './components/views/eve/EveCopilotView';
import { SystemHealthView } from './components/views/admin/SystemHealthView';
import { FirmBrandingView } from './components/views/admin/FirmBrandingView';
import { UsersAccessView } from './components/views/admin/UsersAccessView';
import { AuditActivityLogsView } from './components/views/admin/AuditActivityLogsView';
import { AdvancedDiagnosticsView } from './components/views/admin/AdvancedDiagnosticsView';
import { UploadModal } from './components/UploadModal';

function EveCpaStudioMain() {
  const { workspaces, facts, documents, agents, selectedCompanyId, setSelectedCompanyId, selectedWorkspaceId, dataState, dataError, lastSuccessfulRead, selectedPeriod, setSelectedPeriod, engagementDetail } = usePractice();

  // Navigation State
  const [activeView, setActiveView] = useState(new URLSearchParams(window.location.search).get('view') || 'practice-home');
  const selectedClientId = selectedCompanyId;
  const [presentationCurrency, setPresentationCurrency] = useState('USD');

  // Modals & Drawers State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [selectedFactMetadata, setSelectedFactMetadata] = useState<SourceToPixelMetadata | null>(null);

  useEffect(() => { setSelectedFactMetadata(null); }, [selectedCompanyId, selectedPeriod]);

  // Derive Presentation Models via Authoritative Adapters
  const clientSummaries: PracticeClientSummary[] = adaptWorkspacesToClients(workspaces);

  const engagementSummaries: EngagementSummary[] = adaptWorkspacesToEngagements(
    workspaces,
    facts.length,
    documents.length,
    0
  );

  const handleSelectClient = setSelectedCompanyId;

  const activeClient = clientSummaries.find((c) => c.id === selectedClientId) || null;
  const activeEngagement = engagementSummaries.find((e) => e.clientId === selectedClientId) || null;

  const displayCurrency = activeClient?.reportingCurrency || presentationCurrency;
  const eligibleFacts = facts.filter((f: any) => String(f.status).toUpperCase() === 'APPROVED' &&
    String(f.verificationStatus || f.verification_status).toUpperCase() === 'VERIFIED' &&
    String(f.evidenceStatus || f.evidence_status).toUpperCase() === 'CONFIRMED');
  const incomeStatementLines: StatementLinePresentation[] = adaptFactsToIncomeStatement(eligibleFacts, selectedPeriod, displayCurrency);
  const { lines: balanceSheetLines, identityCheck } = adaptFactsToBalanceSheet(eligibleFacts, selectedPeriod, displayCurrency);
  const financialRatios: RatioDerivationPresentation[] = deriveFinancialRatios(eligibleFacts, selectedPeriod, displayCurrency);
  const namedAgents = adaptBackendAgents(agents);

  // Command Palette Items built dynamically from authoritative state
  const commandItems: CommandItem[] = [
    ...clientSummaries.map((c) => ({
      id: `cmd-client-${c.id}`,
      category: 'Clients' as const,
      title: c.name,
      subtitle: `${c.industry} • ${c.reportingCurrency}`,
      action: () => {
        handleSelectClient(c.id);
        setActiveView('engagement-overview');
      }
    })),
    { id: 'cmd-2', category: 'Views' as const, title: 'Income Statement Attestation', subtitle: 'Statements Overview', action: () => setActiveView('financials-income') },
    { id: 'cmd-3', category: 'Views' as const, title: 'Balance Sheet Identity Reconciler', subtitle: 'Euclid Identity Check', action: () => setActiveView('financials-balance') },
    { id: 'cmd-4', category: 'Views' as const, title: 'System Health & Forensics', subtitle: 'Autonomous Worker Status', action: () => setActiveView('admin-health') }
  ];

  return (
    <div data-eve-view={activeView} data-eve-workspace-id={selectedWorkspaceId || ''} className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        openFindingsCount={activeEngagement?.openFindingsCount || 0}
        openReviewItemsCount={0}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <AppHeader
          activeClientName={activeClient?.name || 'No Engagement Selected'}
          activePeriod={activeClient?.latestPeriod || '—'}
          activeCurrency={activeClient?.reportingCurrency || presentationCurrency}
          onSelectCurrency={() => { /* Source currency requires a recorded FX conversion before changing. */ }}
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          onOpenCommand={() => setIsCommandOpen(true)}
          isCopilotOpen={isCopilotOpen}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <div role={dataError ? 'alert' : 'status'} className="px-6 py-2 text-xs border-b bg-white">
            API: same-origin authenticated session · {dataState} · Workspace: {selectedWorkspaceId || 'none'}
            {lastSuccessfulRead && <span> · Last read: {lastSuccessfulRead}</span>}
            {dataError && <p className="text-red-700">{dataError}</p>}
          </div>
          {engagementDetail && <section className="px-6 py-3 text-xs bg-white border-b space-y-2" aria-label="Recorded evidence and review state">
            <div className="flex flex-wrap gap-4">
              <span>Raw extracted rows: {engagementDetail.measurements?.rawExtractedRows ?? 'Not measured'}</span>
              <span>Eligible rows: {engagementDetail.measurements?.eligibleRows ?? 'Not measured'}</span>
              <span>Unique eligible IDs: {engagementDetail.measurements?.uniqueEligibleFactIds ?? 'Not measured'}</span>
              <span>Evidence occurrences: {engagementDetail.measurements?.evidenceOccurrences ?? 'Not measured'}</span>
              <span>Source documents: {engagementDetail.measurements?.sourceDocumentCount ?? 'Not measured'}</span>
            </div>
            <p>AI-prepared draft · Professional approval is required for issuance. Financial tables show eligible evidence for the selected period.</p>
            {engagementDetail.periods?.length > 0 && <label>Reporting period <select {...actionAttributes('period.select')} value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="border rounded ml-2 p-1">
              {[...new Set([selectedPeriod, ...engagementDetail.periods].filter(Boolean))].map((p: string) => <option key={p}>{p}</option>)}
            </select></label>}
            {engagementDetail.continuation && <details><summary {...actionAttributes('evidence.processing')} className="cursor-pointer">Recorded processing and review evidence</summary>
              <p>Status: {engagementDetail.continuation.status} · Job: {engagementDetail.continuation.jobId} · Attempt: {engagementDetail.continuation.jobAttempt ?? 'Not recorded'}</p>
              <pre className="whitespace-pre-wrap break-words max-h-72 overflow-auto mt-2">{JSON.stringify({ specialistSummary: engagementDetail.continuation.specialistSummary, systemFindings: engagementDetail.continuation.systemFindings, reviewFindings: engagementDetail.continuation.reviewFindings, internalTruthAudit: engagementDetail.continuation.internalTruthAudit, minervaLiveValidation: engagementDetail.continuation.minervaLiveValidation }, null, 2)}</pre>
            </details>}
          </section>}
          {/* SECTION 1: PRACTICE */}
          {activeView === 'practice-home' && (
            <PracticeHomeView
              clients={clientSummaries}
              engagements={engagementSummaries}
              documentsCount={documents.length}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              onNavigate={setActiveView}
              onSelectClient={handleSelectClient}
              onOpenUpload={() => setIsUploadOpen(true)}
              onInspectFact={(meta) => {
                const fact = facts.find(f => f.id === meta.factLineageId);
                const doc = documents.find(d => d.id === fact?.documentId);
                setSelectedFactMetadata({ ...meta, sourceText: fact?.sourceText, documentId: doc?.id,
                  sha256Hash: doc?.sha256, sourceDocName: doc?.filename || meta.sourceDocName });
              }}
            />
          )}

          {activeView === 'practice-clients' && (
            <PracticeClientsView
              clients={clientSummaries}
              selectedClientId={selectedClientId}
              onSelectClient={handleSelectClient}
              onNavigate={setActiveView}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'practice-engagements' && (
            <PracticeEngagementsView
              engagements={engagementSummaries}
              onSelectEngagement={(id) => {
                const eng = engagementSummaries.find((e) => e.id === id);
                if (eng) handleSelectClient(eng.clientId);
                setActiveView('engagement-overview');
              }}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'practice-documents' && (
            <PracticeDocumentsView
              documents={documents as any}
              onNavigate={setActiveView}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {/* SECTION 2: ENGAGEMENT WORK */}
          {activeView === 'engagement-overview' && (
            <EngagementOverviewView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              factsCount={facts.length}
              documentsCount={documents.length}
              identityCheck={identityCheck}
              incomeStatementLines={incomeStatementLines}
              balanceSheetLines={balanceSheetLines}
              onNavigate={setActiveView}
              onInspectFact={(meta) => {
                const fact = facts.find(f => f.id === meta.factLineageId);
                const doc = documents.find(d => d.id === fact?.documentId);
                setSelectedFactMetadata({ ...meta, sourceText: fact?.sourceText, documentId: doc?.id,
                  sha256Hash: doc?.sha256, sourceDocName: doc?.filename || meta.sourceDocName });
              }}
            />
          )}

          {(activeView === 'financials-overview' || activeView === 'financials-income' || activeView === 'financials-cashflow' || activeView === 'financials-equity' || activeView === 'financials-notes') && (
            <FinancialIncomeStatementView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              lines={incomeStatementLines}
              onNavigate={setActiveView}
              onInspectFact={(meta) => {
                const fact = facts.find(f => f.id === meta.factLineageId);
                const doc = documents.find(d => d.id === fact?.documentId);
                setSelectedFactMetadata({ ...meta, sourceText: fact?.sourceText, documentId: doc?.id,
                  sha256Hash: doc?.sha256, sourceDocName: doc?.filename || meta.sourceDocName });
              }}
            />
          )}

          {activeView === 'financials-balance' && (
            <FinancialBalanceSheetView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              lines={balanceSheetLines}
              identityCheck={identityCheck}
              onNavigate={setActiveView}
              onInspectFact={(meta) => {
                const fact = facts.find(f => f.id === meta.factLineageId);
                const doc = documents.find(d => d.id === fact?.documentId);
                setSelectedFactMetadata({ ...meta, sourceText: fact?.sourceText, documentId: doc?.id,
                  sha256Hash: doc?.sha256, sourceDocName: doc?.filename || meta.sourceDocName });
              }}
            />
          )}

          {(activeView === 'analysis-ratios' || activeView === 'analysis-segments' || activeView === 'analysis-trends' || activeView === 'analysis-forecast') && (
            <AnalysisRatiosView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              ratios={financialRatios}
              onNavigate={setActiveView}
              onInspectFact={(meta) => {
                const fact = facts.find(f => f.id === meta.factLineageId);
                const doc = documents.find(d => d.id === fact?.documentId);
                setSelectedFactMetadata({ ...meta, sourceText: fact?.sourceText, documentId: doc?.id,
                  sha256Hash: doc?.sha256, sourceDocName: doc?.filename || meta.sourceDocName });
              }}
            />
          )}

          {(activeView === 'engagement-evidence' || activeView === 'engagement-findings') && <RecordedEngagementEvidenceView detail={engagementDetail} period={selectedPeriod || ''} findingsOnly={activeView === 'engagement-findings'} />}
          {(activeView === 'engagement-structure' || activeView === 'engagement-currencies' || activeView === 'engagement-deliverables') && (
            <DeliverablesView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              onNavigate={setActiveView}
            />
          )}

          {/* SECTION 3: EVE INTELLIGENCE */}
          {activeView === 'eve-copilot' && (
            <EveCopilotView
              clientName={activeClient?.name || 'No Engagement Selected'}
              engagementName={activeEngagement?.name || 'Attestation & Review'}
              period={selectedPeriod || activeClient?.latestPeriod || '—'}
              currency={activeClient?.reportingCurrency || presentationCurrency}
              framework={activeEngagement?.framework || 'US-GAAP'}
              readinessState={activeEngagement?.readinessState || 'DATA_VERIFICATION_REQUIRED'}
              openFindingsCount={activeEngagement?.openFindingsCount || 0}
              workspaceId={activeClient?.id}
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

          {activeView === 'eve-university' && <EveUniversityView />}

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
