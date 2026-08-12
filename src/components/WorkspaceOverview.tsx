import React from 'react';
import { Workspace, DocumentRecord, FinancialSummary } from '../types';
import { ProjectDetailDashboard } from './ProjectDetailDashboard';

interface WorkspaceOverviewProps {
  workspace: Workspace;
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
  onNavigate: (view: string) => void;
  ingestionStatus?: {
    isIngesting: boolean;
    progress: number;
    stepName: string;
    error: string | null;
  };
  matchingWorkspace?: Workspace | null;
  extractedName?: string;
  onConfirmAttach?: (workspaceId: string) => void;
  onCreateNewWorkspace?: () => void;
  onDismissMatchPrompt?: () => void;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  workspace,
  documents,
  summary,
  onNavigate,
}) => {
  return (
    <ProjectDetailDashboard
      workspace={workspace}
      documents={documents}
      summary={summary}
      onNavigate={onNavigate}
      onBackToProjects={() => onNavigate('projects')}
    />
  );
};
