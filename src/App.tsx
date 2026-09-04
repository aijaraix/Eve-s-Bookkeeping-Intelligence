import React from 'react';
import { PracticeProvider, usePractice } from './context/PracticeContext';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { OverviewView } from './components/OverviewView';
import { IncomeStatementView } from './components/IncomeStatementView';
import { BalanceSheetView } from './components/BalanceSheetView';
import { CashFlowView } from './components/CashFlowView';
import { NotesDisclosuresView } from './components/NotesDisclosuresView';
import { HermesSwarmView } from './components/HermesSwarmView';
import { AuditFindingsView } from './components/AuditFindingsView';
import { EvidenceRegistryView } from './components/EvidenceRegistryView';
import { AIDeliverablesView } from './components/AIDeliverablesView';
import { DocumentsView } from './components/DocumentsView';
import { WorkerDiagnosticsView } from './components/WorkerDiagnosticsView';
import { EveAuditCopilotDrawer } from './components/EveAuditCopilotDrawer';
import { UploadModal } from './components/UploadModal';
import { ReportWizardModal } from './components/ReportWizardModal';

const MainContent: React.FC = () => {
  const { currentView } = usePractice();

  return (
    <main id="main-content" className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {currentView === 'overview' && <OverviewView />}
      {currentView === 'income_statement' && <IncomeStatementView />}
      {currentView === 'balance_sheet' && <BalanceSheetView />}
      {currentView === 'cash_flow' && <CashFlowView />}
      {currentView === 'notes_disclosures' && <NotesDisclosuresView />}
      {currentView === 'hermes_swarm' && <HermesSwarmView />}
      {currentView === 'audit_findings' && <AuditFindingsView />}
      {currentView === 'evidence_registry' && <EvidenceRegistryView />}
      {currentView === 'deliverables' && <AIDeliverablesView />}
      {currentView === 'documents' && <DocumentsView />}
      {currentView === 'diagnostics' && <WorkerDiagnosticsView />}
    </main>
  );
};

export function App() {
  return (
    <PracticeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
        <AppHeader />
        <div className="flex-1 flex overflow-hidden">
          <AppSidebar />
          <MainContent />
        </div>
        <EveAuditCopilotDrawer />
        <UploadModal />
        <ReportWizardModal />
      </div>
    </PracticeProvider>
  );
}

export default App;
