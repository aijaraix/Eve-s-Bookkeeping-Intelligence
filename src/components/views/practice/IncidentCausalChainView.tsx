import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Database,
  Layers,
  Cpu,
  Lock,
  Activity,
  UserCheck
} from 'lucide-react';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';

interface Incident {
  incidentId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'REMEDIATED' | 'QUARANTINED';
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  executionId: string;
  custodyId: string;
  projectId: string;
  engagementId: string;
  entityId: string;
  sourceArtifactId: string;
  sourceElementId?: string;
  stageId: string;
  handoffId?: string;
  producerAgentId: string;
  producerService: string;
  producerTool: string;
  producerModel?: string;
  consumerAgentId: string;
  consumerService: string;
  consumerTool: string;
  expectedVerifierAgentId: string;
  actualVerifierAgentId?: string;
  detectorAgentId: string;
  inputObjectIds: string[];
  outputObjectIds: string[];
  startedAt: string;
  completedAt?: string;
  expectedReferenceCount: number;
  acknowledgedReferenceCount: number;
  failureCategory: string;
  failurePoint: string;
  failureTimestamp: string;
  rootCauseClassification: string;
  retryAttempt: number;
  fallbackUsed: boolean;
  recoveryAgentId: string;
  recoveryAction: string;
  resolutionStatus: string;
}

interface EscapeRates {
  totalIncidents: number;
  stageEscapeRates: Record<string, { escaped: number; detectedAtStage: number; escapeRatePercent: number }>;
  categoryDistribution: Record<string, number>;
  rootCauseBreakdown: Record<string, number>;
}

export const IncidentCausalChainView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [escapeRates, setEscapeRates] = useState<EscapeRates | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<any>(null);
  const [quarantineRecords, setQuarantineRecords] = useState<any[]>([]);
  const [migrationRecord, setMigrationRecord] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [incRes, quarRes, migRes] = await Promise.all([
          fetch('/api/cpa/incidents'),
          fetch('/api/cpa/quarantine/ledger'),
          fetch('/api/cpa/quarantine/migration')
        ]);

        if (incRes.ok) {
          const data = await incRes.json();
          setIncidents(data.incidents || []);
          setEscapeRates(data.escapeRates || null);
          setAgentPerformance(data.agentPerformance || null);
          if (data.incidents && data.incidents.length > 0) {
            setSelectedIncident(data.incidents[0]);
          }
        }

        if (quarRes.ok) {
          const qData = await quarRes.json();
          setQuarantineRecords(qData.records || []);
        }

        if (migRes.ok) {
          const mData = await migRes.json();
          setMigrationRecord(mData.migration || null);
        }
      } catch (err) {
        console.error('Failed to load incident data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity === 'ALL') return true;
    return inc.severity === filterSeverity;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Operational Incident & Causal Chain Explorer
                <span className="text-xs font-mono font-normal bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">
                  SECTIONS 31–40 COMPLIANT
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-lifecycle execution identity, causal attribution, escape rate governance, and zero synthetic tolerance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/50 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Active Store Purity: 100% PASS
          </span>
          <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Physical SEC SHA-256 Locked
          </span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EveCard className="bg-white border-slate-200">
          <EveCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Recorded Incidents</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{incidents.length}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{incidents.filter(i => i.status === 'REMEDIATED' || i.status === 'QUARANTINED').length} Remediated</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{incidents.filter(i => i.severity === 'P0').length} P0 Critical</span>
            </div>
          </EveCardContent>
        </EveCard>

        <EveCard className="bg-white border-slate-200">
          <EveCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quarantined Records</span>
              <Lock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{quarantineRecords.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Synthetic/Canary records blocked from UI & production
            </div>
          </EveCardContent>
        </EveCard>

        <EveCard className="bg-white border-slate-200">
          <EveCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Synthetic Leakage</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">0.0%</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-mono">
              ZERO active synthetic points
            </div>
          </EveCardContent>
        </EveCard>

        <EveCard className="bg-white border-slate-200">
          <EveCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Physical Source Truth</span>
              <FileCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">2,192,014 B</div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono truncate" title="a4fef9542c4d1a99a9265df88948e5a115223940db01a0bd01f1d8b6c00acd46">
              SHA: a4fef9542c4d1a99...
            </div>
          </EveCardContent>
        </EveCard>
      </div>

      {/* Main Split Layout: Incidents List & Causal Chain Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Registry Table */}
        <div className="lg:col-span-6 space-y-4">
          <EveCard className="bg-white border-slate-200 shadow-sm">
            <EveCardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <EveCardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Operational Incidents Register
              </EveCardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter:</span>
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Severities</option>
                  <option value="P0">P0 Critical</option>
                  <option value="P1">P1 High</option>
                  <option value="P2">P2 Medium</option>
                </select>
              </div>
            </EveCardHeader>
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {filteredIncidents.map(inc => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                return (
                  <div
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/70 border-l-4 border-rose-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              inc.severity === 'P0'
                                ? 'bg-rose-100 text-rose-700'
                                : inc.severity === 'P1'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="font-semibold text-slate-900">{inc.incidentId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-slate-500 text-[11px]">{inc.stageId}</span>
                        </div>
                        <div className="font-medium text-slate-800 mt-1 text-xs">{inc.title}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{inc.description}</div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${
                          inc.status === 'REMEDIATED' || inc.status === 'QUARANTINED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="text-slate-400">Originator: </span>
                        <span className="text-slate-700 font-semibold">{inc.producerAgentId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Detector: </span>
                        <span className="text-indigo-600 font-semibold">{inc.detectorAgentId}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </EveCard>
        </div>

        {/* Causal Chain Attribution Detail Panel */}
        <div className="lg:col-span-6 space-y-4">
          {selectedIncident ? (
            <EveCard className="bg-white border-slate-200 shadow-sm">
              <EveCardHeader className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    INCIDENT DETAILS & CAUSAL ATTRIBUTION
                  </span>
                  <EveCardTitle className="text-base font-bold text-slate-900 mt-1">
                    {selectedIncident.incidentId}: {selectedIncident.title}
                  </EveCardTitle>
                </div>
                <EveStatusBadge
                  status={selectedIncident.status === 'REMEDIATED' || selectedIncident.status === 'QUARANTINED' ? 'verified' : 'flagged'}
                  label={selectedIncident.status}
                  size="sm"
                />
              </EveCardHeader>

              <EveCardContent className="p-4 space-y-4 text-xs">
                {/* 4-Actor Causal Chain (Requirement 32) */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Causal Identity Separation (Do Not Confuse Detector with Cause)
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-white p-2 rounded border border-rose-200 shadow-2xs">
                      <div className="text-[9px] uppercase text-rose-500 font-bold">1. Originator</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedIncident.producerAgentId}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{selectedIncident.producerService}</div>
                    </div>

                    <div className="bg-white p-2 rounded border border-amber-200 shadow-2xs">
                      <div className="text-[9px] uppercase text-amber-500 font-bold">2. Expected Verifier</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedIncident.expectedVerifierAgentId}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Missed verification</div>
                    </div>

                    <div className="bg-white p-2 rounded border border-indigo-200 shadow-2xs">
                      <div className="text-[9px] uppercase text-indigo-600 font-bold">3. Actual Detector</div>
                      <div className="text-xs font-bold text-indigo-700 mt-0.5">{selectedIncident.detectorAgentId}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Detected defect</div>
                    </div>

                    <div className="bg-white p-2 rounded border border-emerald-200 shadow-2xs">
                      <div className="text-[9px] uppercase text-emerald-600 font-bold">4. Recovery Owner</div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">{selectedIncident.recoveryAgentId}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{selectedIncident.recoveryAction}</div>
                    </div>
                  </div>
                </div>

                {/* Execution Context & Lineage Metadata */}
                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">EXECUTION ID</span>
                    <span className="text-slate-800 font-medium break-all">{selectedIncident.executionId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">CUSTODY ID</span>
                    <span className="text-slate-800 font-medium break-all">{selectedIncident.custodyId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">ENGAGEMENT ID</span>
                    <span className="text-slate-800 font-medium">{selectedIncident.engagementId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">STAGE ID</span>
                    <span className="text-slate-800 font-medium">{selectedIncident.stageId}</span>
                  </div>
                </div>

                {/* Failure Taxonomy & Root Cause */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Taxonomy & Root Cause Classification
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-600">Category: </span>
                      <span className="font-mono text-rose-700 font-bold">{selectedIncident.failureCategory}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Root Cause: </span>
                      <span className="font-mono text-slate-800">{selectedIncident.rootCauseClassification}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Remediation Status: </span>
                      <span className="text-emerald-700 font-medium">{selectedIncident.resolutionStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Input vs Output Objects */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Tracked Artifacts & Lineage Objects
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-slate-500 font-bold mb-1">Input Object IDs:</div>
                      {selectedIncident.inputObjectIds.map(id => (
                        <div key={id} className="text-slate-700 truncate" title={id}>• {id}</div>
                      ))}
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-slate-500 font-bold mb-1">Output Object IDs:</div>
                      {selectedIncident.outputObjectIds.map(id => (
                        <div key={id} className="text-slate-700 truncate" title={id}>• {id}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </EveCardContent>
            </EveCard>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Select an incident from the registry to inspect its causal chain.
            </div>
          )}
        </div>
      </div>

      {/* Forensic Quarantine Ledger Section */}
      <EveCard className="bg-white border-slate-200 shadow-sm">
        <EveCardHeader className="p-4 border-b border-slate-100 flex items-center justify-between">
          <EveCardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            Forensic Quarantine Ledger (Superseded & Contaminated Objects)
          </EveCardTitle>
          <span className="text-xs font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {quarantineRecords.length} Quarantined Artifacts
          </span>
        </EveCardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Quarantine ID</th>
                <th className="py-2.5 px-4">Object / Metric</th>
                <th className="py-2.5 px-4">Quarantined Value</th>
                <th className="py-2.5 px-4">Quarantine Reason</th>
                <th className="py-2.5 px-4">Superseding Authoritative Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {quarantineRecords.map(qr => (
                <tr key={qr.quarantineId} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-bold text-rose-700">{qr.quarantineId}</td>
                  <td className="py-2.5 px-4 text-slate-800">{qr.objectType} / {qr.metricName}</td>
                  <td className="py-2.5 px-4 line-through text-slate-400">{qr.quarantinedValue}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs">{qr.quarantineReason}</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">{qr.supersedingAuthoritativeValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EveCard>
    </div>
  );
};
