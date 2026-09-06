import React, { useState, useEffect, useRef } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardContent } from '../../design-system/EveCard';
import {
  Activity,
  GraduationCap,
  Layers,
  BookOpen,
  Award,
  Sparkles,
  History as HistoryIcon,
  RefreshCw,
  Zap,
  Radio,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

import { ObservatoryStateData, ObservatoryAgent, ObservatoryPathway, ObservatoryEventItem } from './observatory/ObservatoryTypes';
import { ObservatoryNeuralCanvas } from './observatory/ObservatoryNeuralCanvas';
import { ObservatoryTimeline } from './observatory/ObservatoryTimeline';
import { ObservatoryInspectorDrawer } from './observatory/ObservatoryInspectorDrawer';
import { ObservatoryEngagementView } from './observatory/ObservatoryEngagementView';
import { ObservatorySystemView } from './observatory/ObservatorySystemView';
import { AcademyCasesTab } from './observatory/AcademyCasesTab';
import { EngagementTwinsTab } from './observatory/EngagementTwinsTab';
import { CurriculumTab } from './observatory/CurriculumTab';
import { AgentCompetencyTab } from './observatory/AgentCompetencyTab';
import { EvolutionRequestsTab } from './observatory/EvolutionRequestsTab';
import { HistoryAuditTab } from './observatory/HistoryAuditTab';

export interface EveAcademyViewProps {
  onNavigate: (viewId: string) => void;
}

export const EveAcademyView: React.FC<EveAcademyViewProps> = ({ onNavigate }) => {
  // Primary Tabs
  const [activeTab, setActiveTab] = useState<
    'OBSERVATORY' | 'CASES' | 'TWINS' | 'CURRICULUM' | 'COMPETENCY' | 'EVOLUTION' | 'HISTORY'
  >('OBSERVATORY');

  // Live Observatory Sub-modes
  const [observatoryMode, setObservatoryMode] = useState<'LIVE' | 'ENGAGEMENT' | 'SYSTEM'>('LIVE');

  // Data State
  const [stateData, setStateData] = useState<ObservatoryStateData | null>(null);
  const [twinsData, setTwinsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLivePolling, setIsLivePolling] = useState(true);

  // Inspector Drawer State
  const [inspectorSelection, setInspectorSelection] = useState<{
    type: 'AGENT' | 'PATHWAY' | 'HEARTBEAT' | 'EVENT' | 'SERVICE';
    data: any;
  } | null>(null);

  // Polling ref to avoid overlaps
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchObservatoryState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [stateRes, twinsRes] = await Promise.all([
        fetch('/api/cpa/observatory/state').then((r) => r.json()),
        fetch('/api/cpa/observatory/twins').then((r) => r.json())
      ]);

      if (stateRes.success && stateRes.state) {
        setStateData(stateRes.state);
      }
      if (twinsRes.success && twinsRes.twins) {
        setTwinsData(twinsRes.twins);
      }
    } catch (err) {
      console.warn('Observatory state poll error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservatoryState(false);

    if (isLivePolling) {
      pollingRef.current = setInterval(() => {
        fetchObservatoryState(true);
      }, 4000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isLivePolling]);

  const activeTwin = twinsData[0] || stateData?.currentEngagement || {
    engagementId: 'eng-sim-canary-01',
    clientName: 'AeroTech Dynamics GmbH',
    currentStage: 'EVIDENCE_REVIEW',
    materiality: {
      overallMateriality: 2500000,
      performanceMateriality: 1875000,
      clearlyTrivialThreshold: 125000
    },
    persona: {
      name: 'Maria von Braun',
      title: 'Chief Financial Officer',
      companyName: 'AeroTech Dynamics GmbH',
      responsiveness: 'COOPERATIVE',
      privateInstructions: 'Withhold lease schedule until Clara requests detailed IFRS 16 support.'
    },
    pbcRequests: [
      {
        requestId: 'PBC-REQ-2026-001',
        description: 'Facility Lease Agreement & IFRS 16 Amortization Schedule',
        status: 'CLEARED',
        requestCategory: 'LEASES',
        followUpCount: 1
      }
    ],
    reviewNotes: [
      {
        reviewNoteId: 'RN-2026-001',
        description: 'Footnote Disclosure on Discount Rate Assumption Sensitivity Analysis',
        status: 'CLEARED',
        assignedTo: 'ATHENA',
        clearedBy: 'QUINN'
      }
    ]
  };

  const heartbeat = stateData?.heartbeat || {
    heartbeatSequence: 584,
    academyState: 'RUNNING',
    currentCaseId: 'ACADEMY-CANARY-01',
    currentStage: 'EVIDENCE_REVIEW',
    customerQueueState: { pendingJobs: 0, preemptingBackground: false },
    resourceSnapshot: {
      cpuCores: 4,
      ramFreeMb: 3317,
      ramTotalMb: 4096,
      diskFreeGb: 755,
      hardwareProfile: '4 vCPU, 16 GB RAM'
    },
    servicesHealth: {
      ollamaLocalAI: { verified: true, latencyMs: 15 },
      extractionWorker: { verified: true, latencyMs: 459 },
      openClawGateway: { verified: true },
      hermesAgent: { verified: true }
    }
  };

  const agents = stateData?.agents || [];
  const pathways = stateData?.activePathways || [];
  const events = stateData?.recentEvents || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Section Header */}
      <EvePageHeader
        category="Eve Intelligence"
        title="Hermes Academy & Neural Operations Observatory"
        description="Live, non-intrusive window into Eve's autonomous CPA learning organization, continuous curriculum, and persistent engagement twins."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLivePolling(!isLivePolling)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                isLivePolling
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLivePolling ? 'animate-pulse' : ''}`} />
              <span>{isLivePolling ? 'Live Telemetry Active' : 'Polling Paused'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchObservatoryState(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 7-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 font-mono text-xs">
        {[
          { id: 'OBSERVATORY', label: 'Live Observatory', icon: Activity },
          { id: 'CASES', label: 'Academy Cases', icon: GraduationCap },
          { id: 'TWINS', label: 'Engagement Twins', icon: Layers },
          { id: 'CURRICULUM', label: 'Curriculum', icon: BookOpen },
          { id: 'COMPETENCY', label: 'Agent Competency', icon: Award },
          { id: 'EVOLUTION', label: 'Evolution & Requests', icon: Sparkles },
          { id: 'HISTORY', label: 'History Ledger', icon: HistoryIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500 shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: LIVE OBSERVATORY */}
      {activeTab === 'OBSERVATORY' && (
        <div className="space-y-6">
          {/* Sub-mode selector & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 text-white p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-2">Observatory Mode:</span>
              {[
                { id: 'LIVE', label: 'Live Neural Network' },
                { id: 'ENGAGEMENT', label: 'Engagement Lifecycle (16 Stages)' },
                { id: 'SYSTEM', label: 'System Hardware & Services' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setObservatoryMode(mode.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    observatoryMode === mode.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div
                onClick={() => setInspectorSelection({ type: 'HEARTBEAT', data: heartbeat })}
                className="flex items-center gap-2 cursor-pointer hover:text-emerald-400 transition-colors"
              >
                <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Heartbeat #{heartbeat.heartbeatSequence}</span>
              </div>
              <span>•</span>
              <div className="text-slate-300">
                Active Agents: <strong className="text-white">{agents.filter(a => a.operationalStatus === 'WORKING').length} / {agents.length || 15}</strong>
              </div>
            </div>
          </div>

          {/* Sub-view: LIVE NEURAL CANVAS & TIMELINE */}
          {observatoryMode === 'LIVE' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Canvas (2 Columns on large screens) */}
              <div className="xl:col-span-2">
                <ObservatoryNeuralCanvas
                  agents={agents}
                  activePathways={pathways}
                  heartbeatState={heartbeat}
                  currentEngagement={activeTwin}
                  onSelectAgent={(agent) => setInspectorSelection({ type: 'AGENT', data: agent })}
                  onSelectPathway={(pw) => setInspectorSelection({ type: 'PATHWAY', data: pw })}
                  onSelectHeartbeat={() => setInspectorSelection({ type: 'HEARTBEAT', data: heartbeat })}
                  onSelectService={(svc) => setInspectorSelection({ type: 'SERVICE', data: { serviceKey: svc } })}
                />
              </div>

              {/* Timeline (1 Column) */}
              <div className="h-[650px]">
                <ObservatoryTimeline
                  events={events}
                  onSelectEvent={(evt) => setInspectorSelection({ type: 'EVENT', data: evt })}
                  selectedEventId={inspectorSelection?.type === 'EVENT' ? inspectorSelection.data?.eventId : undefined}
                  onRefresh={() => fetchObservatoryState(true)}
                  isPolling={isLivePolling}
                />
              </div>
            </div>
          )}

          {/* Sub-view: ENGAGEMENT 16-STAGE LIFECYCLE */}
          {observatoryMode === 'ENGAGEMENT' && (
            <ObservatoryEngagementView
              twin={activeTwin}
            />
          )}

          {/* Sub-view: SYSTEM & HARDWARE */}
          {observatoryMode === 'SYSTEM' && (
            <ObservatorySystemView
              servicesHealth={heartbeat.servicesHealth}
              resourceSnapshot={heartbeat.resourceSnapshot}
              customerQueue={heartbeat.customerQueueState}
              onNavigateToAdmin={onNavigate}
              onRefresh={() => fetchObservatoryState(false)}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT 2: ACADEMY CASES */}
      {activeTab === 'CASES' && (
        <AcademyCasesTab
          cases={[]}
          currentCaseId={heartbeat.currentCaseId || 'ACADEMY-CANARY-01'}
          onOpenTwin={(twinId) => {
            setActiveTab('TWINS');
          }}
        />
      )}

      {/* TAB CONTENT 3: ENGAGEMENT TWINS */}
      {activeTab === 'TWINS' && (
        <EngagementTwinsTab
          twin={activeTwin}
        />
      )}

      {/* TAB CONTENT 4: CURRICULUM */}
      {activeTab === 'CURRICULUM' && (
        <CurriculumTab
          coverage={stateData?.coverage}
        />
      )}

      {/* TAB CONTENT 5: AGENT COMPETENCY */}
      {activeTab === 'COMPETENCY' && (
        <AgentCompetencyTab
          agents={agents}
          onSelectAgent={(agent) => setInspectorSelection({ type: 'AGENT', data: agent })}
        />
      )}

      {/* TAB CONTENT 6: EVOLUTION & REQUESTS */}
      {activeTab === 'EVOLUTION' && (
        <EvolutionRequestsTab
          proposals={stateData?.evolutionProposals || []}
          capabilityRequests={stateData?.capabilityRequests || []}
          incidents={stateData?.incidents || []}
        />
      )}

      {/* TAB CONTENT 7: HISTORY LEDGER */}
      {activeTab === 'HISTORY' && (
        <HistoryAuditTab
          events={events}
          onSelectEvent={(evt) => setInspectorSelection({ type: 'EVENT', data: evt })}
        />
      )}

      {/* SIDE INSPECTOR DRAWER */}
      <ObservatoryInspectorDrawer
        selection={inspectorSelection}
        onClose={() => setInspectorSelection(null)}
        onNavigateToTwin={(twinId) => {
          setInspectorSelection(null);
          setActiveTab('TWINS');
        }}
      />
    </div>
  );
};
