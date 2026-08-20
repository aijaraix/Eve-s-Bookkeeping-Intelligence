import React, { useState, useEffect, useCallback } from 'react';
import { Workspace, DocumentRecord, ExtractedFact, FinancialSummary } from './types';
import { auth, onAuthStateChanged, signOut } from './firebase';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { GlobalOverviewDashboard } from './components/GlobalOverviewDashboard';
import { CompanyDirectoryView } from './components/CompanyDirectoryView';
import { WorkflowCenterView } from './components/WorkflowCenterView';
import { UsersTeamsView } from './components/UsersTeamsView';
import { ActivityLogView } from './components/ActivityLogView';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { LandingUpload } from './components/LandingUpload';
import { ProjectLibrary } from './components/ProjectLibrary';
import { ProjectDetailDashboard } from './components/ProjectDetailDashboard';
import { ProjectAuthModal } from './components/ProjectAuthModal';
import { SignInModal } from './components/SignInModal';
import { WorkspaceOverview } from './components/WorkspaceOverview';
import { FinancialOverview } from './components/FinancialOverview';
import { IncomeStatementView } from './components/IncomeStatementView';
import { BalanceSheetView } from './components/BalanceSheetView';
import { CashSummaryView } from './components/CashSummaryView';
import { DocumentExplorer } from './components/DocumentExplorer';
import { RelationshipExplorer } from './components/RelationshipExplorer';
import { ReviewCenter } from './components/ReviewCenter';
import { DataQualityDashboard } from './components/DataQualityDashboard';
import { AskAICPA } from './components/AskAICPA';
import { ReportsExport } from './components/ReportsExport';
import { AIDeliverablesView } from './components/AIDeliverablesView';
import { SettingsView } from './components/SettingsView';
import { HermesEvolutionLab } from './components/HermesEvolutionLab';
import { LineItemDrillDownModal } from './components/LineItemDrillDownModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { EvesLogo } from './components/EvesLogo';
import { FloatingEveChat } from './components/FloatingEveChat';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { AuditFindingsView } from './components/AuditFindingsView';
import { SwarmDashboard } from './components/SwarmDashboard';
import { StagedHoldingModal } from './components/StagedHoldingModal';
import { ExtractionProgressModal } from './components/ExtractionProgressModal';
import { LiveWalkthroughPill } from './components/LiveWalkthroughPill';
import { SystemGuideView } from './components/SystemGuideView';
import { SystemDiagnosticsView } from './components/SystemDiagnosticsView';
import { ReviewerModeView } from './components/ReviewerModeView';
import { CorporateGroupStageView } from './components/CorporateGroupStageView';
import { UnboundedRegistryStageView } from './components/UnboundedRegistryStageView';
import { DeliverablesStageView } from './components/DeliverablesStageView';
import { TenantRegressionStageView } from './components/TenantRegressionStageView';

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  const [stagedHoldingResult, setStagedHoldingResult] = useState<{
    isOpen: boolean;
    workspace: Workspace | null;
    extractedName: string;
    docCount: number;
    factsCount: number;
  } | null>(null);

  // Global Currency & Language Controls
  const [globalCurrency, setGlobalCurrency] = useState<string>('EUR');
  const [globalLanguage, setGlobalLanguage] = useState<string>('en');

  // Mobile Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Drill-Down Modal State
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    lineItemName: string;
    amountEUR: number;
  }>({
    isOpen: false,
    lineItemName: '',
    amountEUR: 0,
  });

  // Currency Symbol Map (display formatting only - backend performs accounting conversion)
  const fxMap: Record<string, { multiplier: number; symbol: string }> = {
    EUR: { multiplier: 1.0, symbol: '€' },
    USD: { multiplier: 1.0, symbol: '$' },
    GBP: { multiplier: 1.0, symbol: '£' },
    JPY: { multiplier: 1.0, symbol: '¥' },
    BRL: { multiplier: 1.0, symbol: 'R$' },
    CHF: { multiplier: 1.0, symbol: 'Fr ' },
    CAD: { multiplier: 1.0, symbol: 'CA$' },
    AUD: { multiplier: 1.0, symbol: 'A$' },
    CNY: { multiplier: 1.0, symbol: '¥' },
  };

  const currentFx = fxMap[globalCurrency] || { multiplier: 1.0, symbol: '€' };

  const handleOpenDrillDown = (lineItemName: string, amountEUR: number) => {
    setDrillDownModal({
      isOpen: true,
      lineItemName,
      amountEUR,
    });
  };

  // User auth state
  const initialSavedEmail = localStorage.getItem('eve_user_email');
  const [userEmail, setUserEmail] = useState<string | null>(initialSavedEmail || null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [currentView, setCurrentView] = useState(initialSavedEmail ? 'overview' : 'landing');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Role-based Navigation Mode
  const [activeRole, setActiveRole] = useState<'customer' | 'reviewer' | 'admin'>('customer');

  // Submission / Ingestion State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [matchingWorkspace, setMatchingWorkspace] = useState<Workspace | null>(null);
  const [extractedName, setExtractedName] = useState<string>('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingInstructions, setPendingInstructions] = useState('');
  const [pendingDriveUrl, setPendingDriveUrl] = useState('');
  const [ingestionStatus, setIngestionStatus] = useState<{
    isIngesting: boolean;
    progress: number;
    stepName: string;
    stepNumber: number;
    error: string | null;
    result?: {
      workspace: Workspace | null;
      extractedName: string;
      docCount: number;
      factsCount: number;
    } | null;
  }>({
    isIngesting: false,
    progress: 0,
    stepName: '',
    stepNumber: 0,
    error: null,
    result: null
  });

  const [activeQueueJob, setActiveQueueJob] = useState<any | null>(null);

  const pollQueueJobs = useCallback(async () => {
    try {
      const wsId = activeWorkspace?.id;
      const url = wsId ? `/api/queue/jobs?workspaceId=${wsId}` : '/api/queue/jobs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const jobs: any[] = data.jobs || [];
        if (jobs.length > 0) {
          // Priority 1: Job currently active or queued
          const activeJob = jobs.find(j => j.status === 'PROCESSING' || j.status === 'QUEUED' || j.status === 'WAITING_FOR_AI_CAPACITY');
          const latestJob = activeJob || jobs[0];

          if (latestJob) {
            setActiveQueueJob(latestJob);

            if (latestJob.status === 'PROCESSING' || latestJob.status === 'QUEUED' || latestJob.status === 'WAITING_FOR_AI_CAPACITY') {
              setIngestionStatus(prev => ({
                ...prev,
                isIngesting: prev.isIngesting, // Preserve user close/dismiss preference
                progress: latestJob.progress || 10,
                stepName: latestJob.status === 'WAITING_FOR_AI_CAPACITY'
                  ? 'AI Analysis Temporarily Paused (Waiting for Capacity)'
                  : (latestJob.currentStage || 'Server Background Extraction Active...'),
                stepNumber: Math.min(6, Math.ceil((latestJob.progress || 10) / 16)),
                error: latestJob.status === 'WAITING_FOR_AI_CAPACITY'
                  ? (latestJob.error || 'AI model capacity temporarily busy. Retrying automatically.')
                  : null
              }));
            } else if (
              latestJob.status === 'COMPLETED' ||
              latestJob.status === 'COMPLETED_WITH_WARNINGS' ||
              latestJob.status === 'REVIEW_REQUIRED'
            ) {
              setIngestionStatus(prev => {
                return {
                  ...prev,
                  isIngesting: prev.isIngesting,
                  progress: 100,
                  stepName: latestJob.currentStage || 'Extraction Complete!',
                  stepNumber: 6,
                  result: {
                    workspace: activeWorkspace,
                    extractedName: latestJob.documentTitle || activeWorkspace?.name || 'Workspace',
                    docCount: 1,
                    factsCount: latestJob.result?.facts?.length || 0
                  }
                };
              });
            } else if (latestJob.status === 'STALLED' || latestJob.status === 'FAILED') {
              setIngestionStatus(prev => ({
                ...prev,
                isIngesting: prev.isIngesting,
                error: latestJob.lastError || latestJob.error || 'Ingestion thread stalled or failed.'
              }));
            }
          }

        }
      }
    } catch (err) {
      // Quietly ignore transient network poll errors
    }
  }, [activeWorkspace?.id, activeWorkspace?.name]);

  useEffect(() => {
    pollQueueJobs();
    const interval = setInterval(() => {
      pollQueueJobs();
    }, 1500);
    return () => clearInterval(interval);
  }, [pollQueueJobs]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        setUserEmail(email);
        localStorage.setItem('eve_user_email', email);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [userEmail]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchWorkspaceData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (userEmail) headers['X-User-Email'] = userEmail;

        const [docRes, factRes, sumRes] = await Promise.all([
          fetch(`/api/documents?workspaceId=${activeWorkspace.id}`, { headers }).catch(() => null),
          fetch(`/api/facts?workspaceId=${activeWorkspace.id}`, { headers }).catch(() => null),
          fetch(`/api/financial/summary?workspaceId=${activeWorkspace.id}`, { headers }).catch(() => null)
        ]);

        const docData = docRes && docRes.ok ? await docRes.json().catch(() => []) : [];
        const factData = factRes && factRes.ok ? await factRes.json().catch(() => []) : [];
        const sumData = sumRes && sumRes.ok ? await sumRes.json().catch(() => null) : null;

        if (Array.isArray(docData)) {
          const uniqueDocs = Array.from(new Map(docData.map((d: any) => [d.id, d])).values());
          setDocuments(uniqueDocs as DocumentRecord[]);
        }
        if (Array.isArray(factData)) setFacts(factData);
        if (sumData) setSummary(sumData);
      } catch (err) {
        console.error("Failed to fetch workspace specific data", err);
      }
    };
    fetchWorkspaceData();
  }, [activeWorkspace?.id, userEmail]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signout error:", err);
    }
    localStorage.removeItem('eve_user_email');
    setUserEmail(null);
    setCurrentView('landing');
  };

  const fetchInitialData = async (userEmailOverride?: string) => {
    try {
      const targetEmail = userEmailOverride !== undefined ? userEmailOverride : userEmail;
      const headers: Record<string, string> = {};
      if (targetEmail) headers['X-User-Email'] = targetEmail;

      const wsRes = await fetch('/api/workspaces', { headers }).catch(() => null);
      const wsData = wsRes && wsRes.ok ? await wsRes.json().catch(() => []) : [];

      let targetWs = activeWorkspace;
      if (Array.isArray(wsData) && wsData.length > 0) {
        setWorkspaces(wsData);
        if (!targetWs || !wsData.some(w => w.id === targetWs?.id)) {
          targetWs = wsData[0];
        } else {
          targetWs = wsData.find(w => w.id === targetWs?.id) || targetWs;
        }
        setActiveWorkspace(targetWs);
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setDocuments([]);
        setFacts([]);
        setSummary(null);
        targetWs = null;
      }

      const targetWsId = targetWs?.id || (Array.isArray(wsData) && wsData[0]?.id) || '';
      const queryParam = targetWsId ? `?workspaceId=${targetWsId}` : '';

      const [docRes, factRes, sumRes] = await Promise.all([
        fetch(`/api/documents${queryParam}`, { headers }).catch(() => null),
        fetch(`/api/facts${queryParam}`, { headers }).catch(() => null),
        fetch(`/api/financial/summary${queryParam}`, { headers }).catch(() => null)
      ]);

      const docData = docRes && docRes.ok ? await docRes.json().catch(() => []) : [];
      const factData = factRes && factRes.ok ? await factRes.json().catch(() => []) : [];
      const sumData = sumRes && sumRes.ok ? await sumRes.json().catch(() => null) : null;

      if (Array.isArray(docData)) setDocuments(docData);
      if (Array.isArray(factData)) setFacts(factData);
      if (sumData) setSummary(sumData);

      return wsData;
    } catch (err) {
      console.error("Failed to load initial data", err);
      return [];
    }
  };

  const handleSignIn = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    setUserEmail(cleanEmail);
    localStorage.setItem('eve_user_email', cleanEmail);

    // Bind any pending staged or active workspace to this email
    const targetWsId = stagedHoldingResult?.workspace?.id || ingestionStatus?.result?.workspace?.id || activeWorkspace?.id;
    if (targetWsId) {
      try {
        await fetch(`/api/workspaces/${targetWsId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': cleanEmail
          },
          body: JSON.stringify({ userEmail: cleanEmail })
        });
      } catch (e) {
        console.error("Failed to bind workspace user email on signin:", e);
      }
    }

    const fetchedWorkspaces = await fetchInitialData(cleanEmail);
    if (targetWsId && Array.isArray(fetchedWorkspaces)) {
      const boundWs = fetchedWorkspaces.find((w: Workspace) => w.id === targetWsId);
      if (boundWs) {
        setActiveWorkspace(boundWs);
      }
    }

    // Always navigate to project_detail when signing in from homepage/landing
    if (currentView === 'landing') {
      setCurrentView('project_detail');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resStr = reader.result as string;
        const b64 = resStr.includes(',') ? resStr.split(',')[1] : resStr;
        resolve(b64);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const processFileUpload = async (
    files: File[],
    instructions: string,
    driveUrl?: string,
    uploadIntent?: 'CREATE_NEW_INTAKE' | 'ATTACH_TO_EXISTING_PROJECT',
    workspaceId?: string
  ) => {
    setPendingFiles(files || []);
    setPendingInstructions(instructions || '');
    setPendingDriveUrl(driveUrl || '');

    setIsUploadModalOpen(false);
    setMatchingWorkspace(null);

    setIngestionStatus({
      isIngesting: true,
      progress: 10,
      stepNumber: 1,
      stepName: 'Uploading & Hash Verification (SHA-256)...',
      error: null,
      result: null
    });

    try {
      const totalFilesList: (File | null)[] = files && files.length > 0 ? files : [null];
      let lastData: any = null;
      let currentWorkspaceId = workspaceId;

      for (let i = 0; i < totalFilesList.length; i++) {
        const fileItem = totalFilesList[i];

        if (fileItem && fileItem.size > 25 * 1024 * 1024) {
          throw new Error(`File "${fileItem.name}" exceeds maximum upload payload limit (25MB). Please upload smaller files or use a Google Drive link.`);
        }

        setIngestionStatus({
          isIngesting: true,
          progress: Math.min(90, 10 + Math.round((i / totalFilesList.length) * 80)),
          stepNumber: 1,
          stepName: totalFilesList.length > 1
            ? `Uploading document ${i + 1} of ${totalFilesList.length}: ${fileItem?.name || 'Document'}...`
            : 'Uploading & Hash Verification (SHA-256)...',
          error: null,
          result: null
        });

        let res: Response | null = null;
        let lastError: any = null;

        // Attempt 1: Multipart FormData with fresh construction per attempt
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const formData = new FormData();
            if (fileItem) formData.append('files', fileItem);
            if (i === 0) {
              if (instructions) formData.append('description', instructions);
              if (driveUrl) formData.append('driveUrl', driveUrl);
            }
            if (userEmail) formData.append('userEmail', userEmail);
            if (uploadIntent) formData.append('uploadIntent', uploadIntent);
            if (currentWorkspaceId) formData.append('workspaceId', currentWorkspaceId);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
            const attemptRes = await fetch('/api/documents/upload', {
              method: 'POST',
              body: formData,
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (attemptRes && attemptRes.ok) {
              res = attemptRes;
              break;
            } else if (attemptRes) {
              res = attemptRes;
              if (attemptRes.status >= 500 && attempt < 3) {
                console.warn(`[Upload Attempt ${attempt}/3 got server status ${attemptRes.status}], retrying...`);
                await new Promise(r => setTimeout(r, 1000 * attempt));
              } else {
                // For non-5xx response codes (e.g. 413 Payload Too Large, 400 Bad Request), stop retrying
                break;
              }
            }
          } catch (fetchErr: any) {
            lastError = fetchErr;
            console.warn(`[Upload Attempt ${attempt}/3 failed]:`, fetchErr);
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
            }
          }
        }

        // Attempt 2: If multipart FormData connection failed, attempt JSON payload upload fallback (for small files or text/link submissions)
        const isSmallOrNoFile = !fileItem || fileItem.size < 10 * 1024 * 1024;
        if (!res && isSmallOrNoFile) {
          try {
            console.log("[Document Ingestion] FormData connection failed, attempting JSON upload fallback...");
            const base64Str = fileItem ? await fileToBase64(fileItem) : undefined;
            const jsonBody = {
              files: fileItem ? [{ name: fileItem.name, mimeType: fileItem.type || 'application/pdf', base64: base64Str }] : [],
              description: i === 0 ? instructions : undefined,
              driveUrl: i === 0 ? driveUrl : undefined,
              userEmail,
              uploadIntent,
              workspaceId: currentWorkspaceId
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);
            const jsonRes = await fetch('/api/documents/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jsonBody),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (jsonRes) {
              res = jsonRes;
            }
          } catch (fallbackErr: any) {
            console.warn("[Document Ingestion] Base64 JSON upload fallback also failed:", fallbackErr);
            if (!lastError) lastError = fallbackErr;
          }
        }

        if (!res) {
          const isLarge = fileItem && fileItem.size > 15 * 1024 * 1024;
          const sizeMb = fileItem ? Math.round(fileItem.size / (1024 * 1024)) : 0;
          throw new Error(`Upload connection error: Unable to reach processing server (${lastError?.message || 'Failed to fetch'}).` + (isLarge ? ` The file "${fileItem?.name}" is ${sizeMb}MB. Try uploading via Google Drive link or check your network connection.` : ` Please check your network connection and try again.`));
        }

        const contentType = res.headers.get('content-type') || '';
        if (res.status === 413 || (contentType && !contentType.includes('application/json'))) {
          const errText = await res.text().catch(() => '');
          if (res.status === 413 || errText.toLowerCase().includes('413') || errText.toLowerCase().includes('payload too large')) {
            throw new Error(`Uploaded file exceeds the maximum size limit allowed by the server. Please try uploading a smaller file or use a Google Drive link.`);
          }
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}: ${errText.slice(0, 100) || res.statusText}`);
          }
        }

        let data: any = {};
        try {
          data = await res.json();
        } catch (jsonErr: any) {
          if (!res.ok) {
            throw new Error(`Server error (${res.status}): Failed to parse response`);
          }
        }

        if (!res.ok) {
          throw new Error(data.error || `Upload server error (${res.status})`);
        }

        lastData = data;

        if (data.workspace?.id) {
          currentWorkspaceId = data.workspace.id;
          setActiveWorkspace(data.workspace);
          if (userEmail) {
            setCurrentView('project_detail');
          }
        }

        if (data.requiresConfirmation && data.existingWorkspace && i === 0) {
          setMatchingWorkspace(data.existingWorkspace);
          setExtractedName(data.extractedInfo?.name || '');
          setPendingFiles(files || []);
          setPendingInstructions(instructions);
          setPendingDriveUrl(driveUrl || '');
          setIsAuthModalOpen(true);
          setIngestionStatus({
            isIngesting: false,
            progress: 0,
            stepNumber: 0,
            stepName: '',
            error: null,
            result: null
          });
          return;
        }
      }

      const data = lastData || {};

      if (data.workspace) {
        setActiveWorkspace(data.workspace);
        if (userEmail) {
          setCurrentView('project_detail');
        }
      }

      await fetchInitialData();
      await pollQueueJobs();

      const extractedEntityName = data.extractedInfo?.name || data.workspace?.name || 'Uploaded Financial Document';
      const docCount = data.documents?.length || (files ? files.length : 1);
      const factsCount = typeof data.factsCount === 'number'
        ? data.factsCount
        : (data.facts?.length || data.documents?.reduce((sum: number, d: any) => sum + (d.extractedFactsCount || 0), 0) || 0);

      // Show Staged Holding Modal ONLY if the user is NOT logged in!
      if (!userEmail) {
        setStagedHoldingResult({
          isOpen: true,
          workspace: data.workspace || null,
          extractedName: extractedEntityName,
          docCount,
          factsCount,
        });
      } else {
        if (data.workspace) {
          setCurrentView('project_detail');
        }
        // Automatically open the Live Extraction Walkthrough modal immediately after upload
        setIngestionStatus(prev => ({
          ...prev,
          isIngesting: true,
          progress: prev.progress || 15,
          stepName: 'Server Background Multi-Agent Ingestion Active...',
          stepNumber: 2,
          result: {
            workspace: data.workspace || null,
            extractedName: extractedEntityName,
            docCount,
            factsCount,
          }
        }));
      }

    } catch (err: any) {
      console.error("File upload error:", err);
      setIngestionStatus({
        isIngesting: false,
        progress: 0,
        stepNumber: 0,
        stepName: 'Ingestion Error',
        error: err?.message || 'Error processing document upload.',
        result: null
      });
      await fetchInitialData();
    }
  };

  const handleConfirmHoldingAccount = async (email: string) => {
    await handleSignIn(email);
    setStagedHoldingResult(null);
    setCurrentView('project_detail');
  };

  const handleLandingSubmitClick = (files: File[], instructions: string, driveUrl?: string, confirmAttach?: boolean, workspaceId?: string) => {
    processFileUpload(files, instructions, driveUrl, confirmAttach ? 'ATTACH_TO_EXISTING_PROJECT' : undefined, workspaceId);
  };

  const handleConfirmAttach = (workspaceId: string) => {
    processFileUpload(pendingFiles, pendingInstructions, pendingDriveUrl, 'ATTACH_TO_EXISTING_PROJECT', workspaceId);
  };

  const handleCreateNewWorkspace = () => {
    processFileUpload(pendingFiles, pendingInstructions, pendingDriveUrl, 'CREATE_NEW_INTAKE');
  };

  const handleRenameWorkspace = async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      const updated = await res.json();
      setWorkspaces(prev => prev.map(w => w.id === id ? updated : w));
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(updated);
      }
    } catch (err) {
      console.error("Failed to rename workspace", err);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    try {
      await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE'
      });
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(remaining[0] || null);
      }
      await fetchInitialData();
    } catch (err) {
      console.error("Failed to delete workspace", err);
    }
  };

  const handleResetData = async () => {
    await fetch('/api/reset', { method: 'POST' });
    setWorkspaces([]);
    setActiveWorkspace(null);
    setDocuments([]);
    setFacts([]);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem('eve_user_email');
    setCurrentView('overview');
  };

  const handleSelectProject = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setCurrentView('project_detail');
  };

  const handleUpdateFactStatus = async (id: string, status: string) => {
    await fetch(`/api/facts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setFacts(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  // If on Landing page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <LandingUpload
          existingWorkspaces={workspaces}
          onSubmitClick={handleLandingSubmitClick}
          onResetData={handleResetData}
          userEmail={userEmail}
          onOpenSignIn={() => setIsSignInOpen(true)}
          onSignOut={handleSignOut}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onGoToDashboard={() => setCurrentView('overview')}
        />
        <SignInModal
          isOpen={isSignInOpen}
          onClose={() => setIsSignInOpen(false)}
          currentUserEmail={userEmail}
          onSignIn={handleSignIn}
        />
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          workspaces={workspaces}
          documents={documents}
          userEmail={userEmail}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 font-sans flex overflow-hidden">
      
      {/* 1. Left Dark Navy Sidebar Navigation */}
      <AppSidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectProject}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onSignOut={handleSignOut}
        documents={documents}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
      />

      {/* 2. Main Application Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <AppHeader
          currentView={currentView}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNewProject={() => setIsUploadModalOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          userEmail={userEmail}
          onOpenSignIn={() => setIsSignInOpen(true)}
          globalCurrency={globalCurrency}
          setGlobalCurrency={setGlobalCurrency}
          globalLanguage={globalLanguage}
          setGlobalLanguage={setGlobalLanguage}
          activeWorkspace={activeWorkspace}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          activeQueueJob={activeQueueJob}
          onOpenQueueModal={() => setIngestionStatus(prev => ({ ...prev, isIngesting: true }))}
        />

        {/* Dynamic View Content Stage */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto">
          {currentView === 'overview' && (
            <GlobalOverviewDashboard
              workspaces={workspaces}
              documents={documents}
              summary={summary}
              onNavigate={setCurrentView}
              onSelectWorkspace={handleSelectProject}
              activeQueueJob={activeQueueJob}
              onOpenQueueModal={() => setIngestionStatus(prev => ({ ...prev, isIngesting: true }))}
            />
          )}

          {(currentView === 'corporate' || currentView === 'stage2' || currentView === 'entities') && (
            <CorporateGroupStageView
              workspaceId={activeWorkspace?.id || workspaces[0]?.id || ''}
            />
          )}

          {(currentView === 'unbounded-registry' || currentView === 'stage3' || currentView === 'facts-registry') && (
            <UnboundedRegistryStageView
              workspaceId={activeWorkspace?.id || workspaces[0]?.id || ''}
            />
          )}

          {(currentView === 'deliverables-stage' || currentView === 'stage4' || currentView === 'lead-schedules') && (
            <DeliverablesStageView
              workspaceId={activeWorkspace?.id || workspaces[0]?.id || ''}
            />
          )}

          {(currentView === 'tenant-regression' || currentView === 'stage5' || currentView === 'security') && (
            <TenantRegressionStageView
              workspaceId={activeWorkspace?.id || workspaces[0]?.id || ''}
            />
          )}

          {currentView === 'projects' && (
            <ProjectLibrary
              workspaces={workspaces}
              documents={documents}
              summary={summary}
              onSelectProject={handleSelectProject}
              onNewProjectClick={() => setIsUploadModalOpen(true)}
              onRenameProject={handleRenameWorkspace}
              onDeleteProject={handleDeleteWorkspace}
              userEmail={userEmail}
              onSubmitUpload={handleLandingSubmitClick}
              onResetData={handleResetData}
              activeQueueJob={activeQueueJob}
              onOpenQueueModal={() => setIngestionStatus(prev => ({ ...prev, isIngesting: true }))}
            />
          )}

          {(currentView === 'project_detail' || currentView === 'workspace_detail') && (
            <ProjectDetailDashboard
              workspace={activeWorkspace || workspaces[0] || { id: 'ws-1', name: 'Corporate Client', code: 'WS-01', currency: 'USD', country: 'United States', createdAt: '2026-01-01' }}
              documents={documents.filter(d => activeWorkspace ? d.workspaceId === activeWorkspace.id : true)}
              summary={summary}
              onNavigate={setCurrentView}
              onBackToProjects={() => setCurrentView('projects')}
              activeQueueJob={activeQueueJob}
              onOpenQueueModal={() => setIngestionStatus(prev => ({ ...prev, isIngesting: true }))}
            />
          )}

          {currentView === 'companies' && (
            <CompanyDirectoryView
              workspaces={workspaces}
              documents={documents}
              onSelectWorkspace={handleSelectProject}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'documents' && (
            <DocumentExplorer
              documents={documents}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              workspaces={workspaces}
            />
          )}

          {(currentView === 'financials' || currentView === 'financial' || currentView.startsWith('financials:')) && (
            <FinancialOverview
              summary={summary}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectProject}
              subView={currentView}
              onNavigateSubView={setCurrentView}
              onDrillDown={() => setCurrentView('financials:income')}
            />
          )}

          {currentView === 'income' && (
            <FinancialOverview
              summary={summary}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectProject}
              subView="financials:income"
              onNavigateSubView={setCurrentView}
              onDrillDown={(line, amount) => handleOpenDrillDown(line, amount || 10250000000)}
            />
          )}

          {currentView === 'balance' && (
            <FinancialOverview
              summary={summary}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectProject}
              subView="financials:balance"
              onNavigateSubView={setCurrentView}
            />
          )}

          {currentView === 'cash' && (
            <FinancialOverview
              summary={summary}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectProject}
              subView="financials:cash"
              onNavigateSubView={setCurrentView}
            />
          )}

          {currentView === 'findings' && (
            <AuditFindingsView
              facts={facts}
              documents={documents}
              summary={summary}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onUpdateStatus={handleUpdateFactStatus}
              onNavigate={setCurrentView}
            />
          )}

          {(currentView === 'review' || currentView === 'reviewer' || currentView.startsWith('review') || currentView.startsWith('system-review')) && (
            <ReviewerModeView
              activeWorkspace={activeWorkspace}
              onNavigate={setCurrentView}
            />
          )}

          {(currentView === 'reports' || currentView === 'deliverables') && (
            <AIDeliverablesView summary={summary} />
          )}

          {(currentView === 'insights' || currentView === 'chat') && (
            <AskAICPA activeWorkspace={activeWorkspace} />
          )}

          {currentView === 'workflow' && (
            <WorkflowCenterView workspaces={workspaces} onNavigate={setCurrentView} />
          )}

          {currentView === 'teams' && (
            <UsersTeamsView />
          )}

          {currentView === 'activity' && (
            <ActivityLogView documents={documents} />
          )}

          {currentView === 'evolution' && (
            <HermesEvolutionLab />
          )}

          {currentView === 'quality' && (
            <DataQualityDashboard summary={summary} activeWorkspace={activeWorkspace} />
          )}

          {(currentView === 'swarm' || currentView === 'inspector') && (
            <SwarmDashboard
              workspace={activeWorkspace}
              documents={documents}
              facts={facts}
              onRefreshWorkspaceData={fetchInitialData}
            />
          )}

          {currentView === 'relationships' && (
            <RelationshipExplorer />
          )}

          {(currentView === 'system_guide' || currentView === 'how_to') && (
            <SystemGuideView onNavigate={setCurrentView} />
          )}

          {(currentView === 'system-diagnostics' || currentView === 'diagnostics') && (
            <SystemDiagnosticsView activeWorkspace={activeWorkspace} />
          )}

          {currentView === 'settings' && (
            <SettingsView onNavigate={setCurrentView} />
          )}
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-neutral-200 py-4 px-6 text-xs text-neutral-500 mt-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-mono font-medium">
            © {new Date().getFullYear()} Eve's Bookkeeping Platform • Financial Intelligence System
          </p>
          <div className="flex items-center space-x-3 font-semibold text-neutral-600">
            <span>Verified Fact Lineage</span>
            <span>•</span>
            <span>Hermes Consensus Ingestion</span>
          </div>
        </footer>

      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        workspaces={workspaces}
        documents={documents}
        onSelectWorkspace={handleSelectProject}
        onNavigate={setCurrentView}
      />

      <ProjectAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        existingWorkspace={matchingWorkspace}
        extractedName={extractedName}
        onConfirmAttach={handleConfirmAttach}
        onCreateNewWorkspace={handleCreateNewWorkspace}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        currentUserEmail={userEmail}
        onSignIn={handleSignIn}
      />

      <StagedHoldingModal
        isOpen={!!stagedHoldingResult?.isOpen}
        onClose={() => setStagedHoldingResult(null)}
        workspace={stagedHoldingResult?.workspace || null}
        extractedName={stagedHoldingResult?.extractedName || ''}
        docCount={stagedHoldingResult?.docCount || 1}
        factsCount={stagedHoldingResult?.factsCount ?? 0}
        currentUserEmail={userEmail}
        onConfirmAccount={handleConfirmHoldingAccount}
      />

      <ExtractionProgressModal
        isOpen={ingestionStatus.isIngesting}
        progress={ingestionStatus.progress}
        stepName={ingestionStatus.stepName}
        stepNumber={ingestionStatus.stepNumber}
        error={ingestionStatus.error}
        job={activeQueueJob}
        result={ingestionStatus.result}
        userEmail={userEmail}
        onClose={() => setIngestionStatus(prev => ({ ...prev, isIngesting: false }))}
        onViewProject={(ws) => {
          setIngestionStatus(prev => ({ ...prev, isIngesting: false }));
          if (ws) {
            setActiveWorkspace(ws);
            setCurrentView('project_detail');
          } else {
            setCurrentView('overview');
          }
        }}
        onOpenSignIn={() => {
          setIngestionStatus(prev => ({ ...prev, isIngesting: false }));
          setIsSignInOpen(true);
        }}
      />

      <LineItemDrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
        lineItemName={drillDownModal.lineItemName}
        amountEUR={drillDownModal.amountEUR}
        currencyMode={globalCurrency}
        currencySymbol={currentFx.symbol}
        fxMultiplier={currentFx.multiplier}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        workspaces={workspaces}
        documents={documents}
        userEmail={userEmail}
      />

      {/* Persistent Floating Live Walkthrough Pill */}
      {!ingestionStatus.isIngesting && activeQueueJob && (activeQueueJob.status === 'PROCESSING' || activeQueueJob.status === 'QUEUED' || activeQueueJob.status === 'WAITING_FOR_AI_CAPACITY') && (
        <LiveWalkthroughPill
          job={activeQueueJob}
          onOpenWalkthrough={() => setIngestionStatus(prev => ({ ...prev, isIngesting: true }))}
        />
      )}

      {/* Floating Eve AI Assistant Copilot */}
      <FloatingEveChat
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenNewProjectModal={() => setIsUploadModalOpen(true)}
        onSubmitUpload={handleLandingSubmitClick}
      />

      {/* Dedicated Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSubmitUpload={handleLandingSubmitClick}
      />

    </div>
  );
}
