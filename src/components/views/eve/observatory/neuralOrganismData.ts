import Graph from 'graphology';
import { ObservatoryAgent, ObservatoryPathway, ObservatoryEventItem } from './ObservatoryTypes';

export interface CortexRegion {
  id: string;
  name: string;
  shortName: string;
  description: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  agentIds: string[];
  satelliteIds: string[];
  functions: string[];
}

export interface OrganismNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'HERMES_CORE' | 'AGENT' | 'SATELLITE' | 'CORTEX_CENTER' | 'EXTERNAL' | 'MEMORY' | 'MODEL' | 'INFRASTRUCTURE' | 'DELIVERABLE';
  cortexId: string;
  x: number;
  y: number;
  size: number;
  baseColor: string;
  activeColor: string;
  agentData?: ObservatoryAgent;
  operationalStatus?: 'AVAILABLE' | 'WORKING' | 'IDLE' | 'REVIEWING' | 'FAILED';
  meta?: Record<string, any>;
}

export interface OrganismEdge {
  id: string;
  source: string;
  target: string;
  c1x: number; // Bezier control point 1
  c1y: number;
  c2x: number; // Bezier control point 2
  c2y: number;
  kind: 'AXON_CORE' | 'INTER_CORTEX' | 'INTRA_CORTEX' | 'SYNAPTIC_WEB' | 'EXTERNAL_BRIDGE';
  baseAlpha: number;
  activeAlpha: number;
  color: string;
  isIlluminated?: boolean;
  activeEvent?: ObservatoryEventItem;
}

export interface TravelingSignal {
  id: string;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
  executionMode: 'FULL_PRACTICE' | 'FAST_REGRESSION' | 'REAL_OPERATION';
  eventPayload?: ObservatoryEventItem;
  label: string;
  timestamp: number;
}

export const CORTEX_REGIONS: CortexRegion[] = [
  {
    id: 'cortex-hermes',
    name: 'Region 1 — Hermes Orchestration Cortex',
    shortName: 'Orchestration Cortex',
    description: 'Central neural nucleus managing scheduler, continuous curriculum, agent organization, and quality gates.',
    x: 0,
    y: 0,
    radius: 95,
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    agentIds: ['eve-hermes'],
    satelliteIds: ['sat-scheduler', 'sat-customer-queue', 'sat-recovery'],
    functions: ['Autonomous Scheduling', 'Execution Locks', 'Swarm Coordination', 'Customer Preemption']
  },
  {
    id: 'cortex-financial',
    name: 'Region 2 — Financial Accounting Cortex',
    shortName: 'Financial Accounting Cortex',
    description: 'Financial statement compilation, mathematical identity balancing, multi-currency translation, and intercompany eliminations.',
    x: -300,
    y: -170,
    radius: 120,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.22)',
    agentIds: ['eve-ledger', 'eve-euclid', 'eve-mercury', 'eve-atlas'],
    satelliteIds: ['sat-balance-sheet-gate', 'sat-cash-flow-engine'],
    functions: ['Trial Balance', 'Income Statement', 'Balance Sheet Identity', 'Cash Flow Direct/Indirect', 'Consolidation']
  },
  {
    id: 'cortex-evidence',
    name: 'Region 3 — Evidence & Forensic Cortex',
    shortName: 'Evidence & Forensic Cortex',
    description: 'Source evidence provenance, physical spreadsheet cell lineage, and mathematical anomaly detection.',
    x: -420,
    y: 40,
    radius: 110,
    color: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.22)',
    agentIds: ['eve-veritas', 'eve-argus'],
    satelliteIds: ['sat-fact-registry', 'sat-cell-provenance'],
    functions: ['Document Ingestion', 'Cell-Level Lineage', 'Audit Provenance', 'Anomaly Detection']
  },
  {
    id: 'cortex-technical',
    name: 'Region 4 — Technical Accounting Cortex',
    shortName: 'Technical Accounting Cortex',
    description: 'US-GAAP & IFRS policy interpretations, multilingual taxonomy mapping, and disclosure compliance.',
    x: -280,
    y: 220,
    radius: 105,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.22)',
    agentIds: ['eve-athena', 'eve-lexicon'],
    satelliteIds: ['sat-gaap-taxonomy', 'sat-ifrs-codification'],
    functions: ['Technical Disclosures', 'ASC / IFRS Mapping', 'Policy Memos', 'Multilingual Audit Rules']
  },
  {
    id: 'cortex-client',
    name: 'Region 5 — Client Communication Cortex',
    shortName: 'Client Communication Cortex',
    description: 'PBC scheduling, missing evidence requests, synthetic persona interactions, and client clarification channels.',
    x: 300,
    y: -170,
    radius: 110,
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.22)',
    agentIds: ['eve-clara'],
    satelliteIds: ['sat-pbc-channel', 'sat-synthetic-cfo'],
    functions: ['PBC Generation', 'Client Inquiries', 'Evidence Clarification', 'Persona Liaison']
  },
  {
    id: 'cortex-quality',
    name: 'Region 6 — Quality & Review Cortex',
    shortName: 'Quality & Review Cortex',
    description: 'Fail-closed quality gates, concurring partner review notes, and independent partner sign-off.',
    x: 420,
    y: 40,
    radius: 110,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    agentIds: ['eve-sentinel', 'eve-quinn'],
    satelliteIds: ['sat-quality-gates', 'sat-partner-signoff'],
    functions: ['Fail-Closed Gates', 'Concurring Review Notes', 'Sign-Off Attestation', 'Independence Checks']
  },
  {
    id: 'cortex-reporting',
    name: 'Region 7 — Reporting / Output Cortex',
    shortName: 'Reporting / Output Cortex',
    description: 'Production Report Factory synthesizing verified multi-format deliverable artifacts (PDF, XLSX, CSV, JSON).',
    x: 280,
    y: 220,
    radius: 110,
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.22)',
    agentIds: ['eve-scribe'],
    satelliteIds: ['sat-pdf-factory', 'sat-xlsx-engine', 'sat-json-audit-pkg'],
    functions: ['Executive Audit Report (PDF)', 'Lead Schedules (CSV)', 'Workbooks (XLSX)', 'Minerva Package (JSON)']
  },
  {
    id: 'cortex-learning',
    name: 'Region 8 — Learning & Evolution Cortex',
    shortName: 'Learning & Evolution Cortex',
    description: 'Minerva 3-layer truth attestation, competency measurement, defect analysis, and Darwin capability proposals.',
    x: 0,
    y: 310,
    radius: 115,
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.22)',
    agentIds: ['eve-minerva', 'eve-darwin'],
    satelliteIds: ['sat-truth-attestation', 'sat-capability-requests'],
    functions: ['Minerva Truth Verification', 'Operational Competency', 'Defect Root Cause', 'Darwin Proposals']
  },
  {
    id: 'cortex-intelligence',
    name: 'Region 9 — Intelligence / Model Cortex',
    shortName: 'Intelligence / Model Cortex',
    description: 'Deterministic math engine and least-cost model routing tiers (Tier 0 to Tier 4).',
    x: -80,
    y: -300,
    radius: 105,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.22)',
    agentIds: [],
    satelliteIds: ['mod-tier0-det', 'mod-tier1-qwen', 'mod-tier2-flash', 'mod-tier3-pro'],
    functions: ['Tier 0 Deterministic Math', 'Tier 1 Local Qwen (15ms)', 'Tier 2 Cloud Economical', 'Tier 3 Cloud Strong']
  },
  {
    id: 'cortex-memory',
    name: 'Region 10 — Memory Systems',
    shortName: 'Memory Systems Cortex',
    description: 'Zero-leakage isolated memory regions across Working, Episodic, Semantic, Procedural, and Firm Shared.',
    x: 140,
    y: -310,
    radius: 105,
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.22)',
    agentIds: [],
    satelliteIds: ['mem-working', 'mem-episodic', 'mem-firm-shared', 'mem-engagement-twin'],
    functions: ['Isolated Working Memory', 'Episodic Case History', 'Firm Audit Standards', 'Engagement Twins']
  },
  {
    id: 'cortex-external',
    name: 'Region 11 — External World',
    shortName: 'External World Ingress',
    description: 'Client document ingress, SEC EDGAR public filings, and regulatory standard feeds.',
    x: -560,
    y: -80,
    radius: 95,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.22)',
    agentIds: [],
    satelliteIds: ['ext-synthetic-client', 'ext-sec-edgar', 'ext-pbc-upload'],
    functions: ['Audited Financial Workbooks', 'EDGAR Form 10-K / 10-Q', 'PBC Document Portal', 'Regulatory Standards']
  },
  {
    id: 'cortex-infrastructure',
    name: 'Region 12 — Infrastructure Nervous System',
    shortName: 'Infrastructure Services',
    description: 'Local and cloud infrastructure services powering ingestion, inference, and persistence.',
    x: 560,
    y: -80,
    radius: 95,
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.22)',
    agentIds: [],
    satelliteIds: ['inf-worker', 'inf-ollama', 'inf-openclaw', 'inf-storage'],
    functions: ['Extraction Worker (8080)', 'Local Ollama AI (11434)', 'OpenClaw Gateway (18789)', 'Durable Disk Store']
  }
];

export const SATELLITE_DEFINITIONS: Record<string, { label: string; sublabel: string; cortexId: string; type: OrganismNode['type']; relX: number; relY: number; size: number; baseColor: string }> = {
  // Hermes satellites
  'sat-scheduler': { label: 'Scheduler', sublabel: 'Autonomous Gates', cortexId: 'cortex-hermes', type: 'SATELLITE', relX: 0, relY: -55, size: 9, baseColor: '#818cf8' },
  'sat-customer-queue': { label: 'Customer Queue', sublabel: 'Priority Preempt', cortexId: 'cortex-hermes', type: 'SATELLITE', relX: -50, relY: 45, size: 8, baseColor: '#38bdf8' },
  'sat-recovery': { label: 'Recovery Controller', sublabel: 'Self-Healing', cortexId: 'cortex-hermes', type: 'SATELLITE', relX: 50, relY: 45, size: 8, baseColor: '#a78bfa' },

  // Financial satellites
  'sat-balance-sheet-gate': { label: 'BS Reconciliation', sublabel: 'Assets = L + E', cortexId: 'cortex-financial', type: 'SATELLITE', relX: -40, relY: -50, size: 8, baseColor: '#34d399' },
  'sat-cash-flow-engine': { label: 'Cash Flow Tie-Out', sublabel: 'Direct / Indirect', cortexId: 'cortex-financial', type: 'SATELLITE', relX: 50, relY: 50, size: 8, baseColor: '#2dd4bf' },

  // Evidence satellites
  'sat-fact-registry': { label: 'Canonical Facts', sublabel: 'Typed Facts (10)', cortexId: 'cortex-evidence', type: 'SATELLITE', relX: -40, relY: -45, size: 8, baseColor: '#38bdf8' },
  'sat-cell-provenance': { label: 'Cell Provenance', sublabel: 'Workbook Lineage', cortexId: 'cortex-evidence', type: 'SATELLITE', relX: 45, relY: 40, size: 8, baseColor: '#7dd3fc' },

  // Technical satellites
  'sat-gaap-taxonomy': { label: 'US-GAAP Codification', sublabel: 'ASC 606 / 842', cortexId: 'cortex-technical', type: 'SATELLITE', relX: -40, relY: 45, size: 8, baseColor: '#c084fc' },
  'sat-ifrs-codification': { label: 'IFRS Standards', sublabel: 'IAS 1 / IFRS 15', cortexId: 'cortex-technical', type: 'SATELLITE', relX: 40, relY: 45, size: 8, baseColor: '#e879f9' },

  // Client satellites
  'sat-pbc-channel': { label: 'PBC Channel', sublabel: 'v2.0 Formal', cortexId: 'cortex-client', type: 'SATELLITE', relX: -40, relY: -45, size: 8, baseColor: '#fb7185' },
  'sat-synthetic-cfo': { label: 'Synthetic Persona', sublabel: 'CFO / VP Finance', cortexId: 'cortex-client', type: 'SATELLITE', relX: 45, relY: 40, size: 8, baseColor: '#fda4af' },

  // Quality satellites
  'sat-quality-gates': { label: 'Quality Gates (6)', cortexId: 'cortex-quality', sublabel: 'Fail-Closed Guard', type: 'SATELLITE', relX: -40, relY: -45, size: 8, baseColor: '#fbbf24' },
  'sat-partner-signoff': { label: 'Concurring Sign-Off', sublabel: 'Quinn Independent', cortexId: 'cortex-quality', type: 'SATELLITE', relX: 40, relY: 45, size: 8, baseColor: '#fcd34d' },

  // Reporting satellites
  'sat-pdf-factory': { label: 'PDF Audit Report', sublabel: 'Certified Artifact', cortexId: 'cortex-reporting', type: 'DELIVERABLE', relX: -40, relY: -40, size: 8, baseColor: '#4ade80' },
  'sat-xlsx-engine': { label: 'XLSX Workbook', sublabel: 'Audited Financials', cortexId: 'cortex-reporting', type: 'DELIVERABLE', relX: 40, relY: -40, size: 8, baseColor: '#86efac' },
  'sat-json-audit-pkg': { label: 'JSON Audit Package', sublabel: 'SHA-256 Provenance', cortexId: 'cortex-reporting', type: 'DELIVERABLE', relX: 0, relY: 45, size: 8, baseColor: '#a7f3d0' },

  // Learning satellites
  'sat-truth-attestation': { label: '3-Layer Truth', sublabel: 'Minerva Attest', cortexId: 'cortex-learning', type: 'SATELLITE', relX: -45, relY: 35, size: 8, baseColor: '#f472b6' },
  'sat-capability-requests': { label: 'Darwin Proposals', sublabel: 'Adaptive Evolution', cortexId: 'cortex-learning', type: 'SATELLITE', relX: 45, relY: 35, size: 8, baseColor: '#f9a8d4' },

  // Intelligence satellites
  'mod-tier0-det': { label: 'Tier 0: Deterministic', sublabel: 'Euclid / Scribe (0ms)', cortexId: 'cortex-intelligence', type: 'MODEL', relX: -55, relY: -25, size: 8, baseColor: '#34d399' },
  'mod-tier1-qwen': { label: 'Tier 1: Qwen 3.5', sublabel: 'Local Ollama (15ms)', cortexId: 'cortex-intelligence', type: 'MODEL', relX: -20, relY: 30, size: 8, baseColor: '#818cf8' },
  'mod-tier2-flash': { label: 'Tier 2: Economical', sublabel: 'Gemini Flash Cloud', cortexId: 'cortex-intelligence', type: 'MODEL', relX: 25, relY: 30, size: 7, baseColor: '#60a5fa' },
  'mod-tier3-pro': { label: 'Tier 3: Strong Cloud', sublabel: 'Gemini Pro Cloud', cortexId: 'cortex-intelligence', type: 'MODEL', relX: 55, relY: -25, size: 7, baseColor: '#93c5fd' },

  // Memory satellites
  'mem-working': { label: 'Working Memory', sublabel: 'Active Workspace', cortexId: 'cortex-memory', type: 'MEMORY', relX: -35, relY: -25, size: 8, baseColor: '#c084fc' },
  'mem-episodic': { label: 'Episodic Memory', sublabel: 'Sealed Cases', cortexId: 'cortex-memory', type: 'MEMORY', relX: 35, relY: -25, size: 8, baseColor: '#a855f7' },
  'mem-firm-shared': { label: 'Firm Shared Memory', sublabel: 'Zero Leakage', cortexId: 'cortex-memory', type: 'MEMORY', relX: -25, relY: 30, size: 7, baseColor: '#e879f9' },
  'mem-engagement-twin': { label: 'Engagement Twins', sublabel: 'Deterministic Replay', cortexId: 'cortex-memory', type: 'MEMORY', relX: 35, relY: 30, size: 7, baseColor: '#f472b6' },

  // External World satellites
  'ext-synthetic-client': { label: 'Synthetic Client', sublabel: 'Kenji Sato / Maria v.B.', cortexId: 'cortex-external', type: 'EXTERNAL', relX: -20, relY: -35, size: 9, baseColor: '#22d3ee' },
  'ext-sec-edgar': { label: 'SEC EDGAR / IFRS', sublabel: 'Public Regulatory', cortexId: 'cortex-external', type: 'EXTERNAL', relX: 25, relY: -30, size: 8, baseColor: '#67e8f9' },
  'ext-pbc-upload': { label: 'Workpaper Ingress', sublabel: 'XLSX / PDF Upload', cortexId: 'cortex-external', type: 'EXTERNAL', relX: 0, relY: 35, size: 8, baseColor: '#a5f3fc' },

  // Infrastructure satellites
  'inf-worker': { label: 'Extraction Worker', sublabel: 'Port 8080 Active', cortexId: 'cortex-infrastructure', type: 'INFRASTRUCTURE', relX: -30, relY: -30, size: 9, baseColor: '#94a3b8' },
  'inf-ollama': { label: 'Local Ollama AI', sublabel: 'Port 11434 Active', cortexId: 'cortex-infrastructure', type: 'INFRASTRUCTURE', relX: 30, relY: -30, size: 9, baseColor: '#cbd5e1' },
  'inf-openclaw': { label: 'OpenClaw Gateway', sublabel: 'Port 18789 Active', cortexId: 'cortex-infrastructure', type: 'INFRASTRUCTURE', relX: -25, relY: 30, size: 8, baseColor: '#64748b' },
  'inf-storage': { label: 'Durable Disk', sublabel: '755 GB Available', cortexId: 'cortex-infrastructure', type: 'INFRASTRUCTURE', relX: 30, relY: 30, size: 8, baseColor: '#475569' }
};

export const AGENT_LAYOUT_OFFSETS: Record<string, { relX: number; relY: number; size: number; baseColor: string }> = {
  'eve-hermes': { relX: 0, relY: 5, size: 24, baseColor: '#6366f1' },
  // Financial
  'eve-ledger': { relX: -35, relY: 0, size: 16, baseColor: '#10b981' },
  'eve-euclid': { relX: 30, relY: -20, size: 15, baseColor: '#14b8a6' },
  'eve-mercury': { relX: -10, relY: 40, size: 14, baseColor: '#059669' },
  'eve-atlas': { relX: 40, relY: 35, size: 14, baseColor: '#0d9488' },
  // Evidence
  'eve-veritas': { relX: -20, relY: -10, size: 16, baseColor: '#0ea5e9' },
  'eve-argus': { relX: 25, relY: 20, size: 15, baseColor: '#0284c7' },
  // Technical
  'eve-athena': { relX: -20, relY: -15, size: 16, baseColor: '#a855f7' },
  'eve-lexicon': { relX: 25, relY: 15, size: 14, baseColor: '#9333ea' },
  // Client
  'eve-clara': { relX: 0, relY: 0, size: 17, baseColor: '#f43f5e' },
  // Quality
  'eve-sentinel': { relX: -20, relY: 0, size: 16, baseColor: '#f59e0b' },
  'eve-quinn': { relX: 30, relY: 0, size: 17, baseColor: '#d97706' },
  // Reporting
  'eve-scribe': { relX: 0, relY: 0, size: 17, baseColor: '#22c55e' },
  // Learning
  'eve-minerva': { relX: -25, relY: -10, size: 16, baseColor: '#ec4899' },
  'eve-darwin': { relX: 25, relY: 10, size: 15, baseColor: '#db2777' }
};

/**
 * Builds the complete Graphology graph topology and computed visual edges
 */
export function buildLivingOrganismNetwork(
  agents: ObservatoryAgent[] = [],
  activePathways: ObservatoryPathway[] = [],
  recentEvents: ObservatoryEventItem[] = []
): {
  graph: Graph;
  nodes: OrganismNode[];
  edges: OrganismEdge[];
  nodeMap: Map<string, OrganismNode>;
} {
  const graph = new Graph({ multi: true, type: 'directed' });
  const nodes: OrganismNode[] = [];
  const edges: OrganismEdge[] = [];
  const nodeMap = new Map<string, OrganismNode>();

  const agentMap = new Map<string, ObservatoryAgent>();
  for (const a of agents) {
    agentMap.set(a.agentId, a);
  }

  // 1. Create Cortex Center Reference Nodes
  for (const cortex of CORTEX_REGIONS) {
    const cortexNode: OrganismNode = {
      id: cortex.id,
      label: cortex.shortName,
      type: 'CORTEX_CENTER',
      cortexId: cortex.id,
      x: cortex.x,
      y: cortex.y,
      size: cortex.id === 'cortex-hermes' ? 32 : 14,
      baseColor: cortex.color,
      activeColor: '#ffffff',
      meta: { cortex }
    };
    nodes.push(cortexNode);
    nodeMap.set(cortexNode.id, cortexNode);
    if (!graph.hasNode(cortexNode.id)) {
      graph.addNode(cortexNode.id, cortexNode);
    }
  }

  // 2. Create Agent Nodes
  for (const cortex of CORTEX_REGIONS) {
    for (const agentId of cortex.agentIds) {
      const liveAgent = agentMap.get(agentId);
      const layout = AGENT_LAYOUT_OFFSETS[agentId] || { relX: 0, relY: 0, size: 14, baseColor: cortex.color };
      const absX = cortex.x + layout.relX;
      const absY = cortex.y + layout.relY;

      const agentNode: OrganismNode = {
        id: agentId,
        label: liveAgent?.name || agentId.replace('eve-', '').toUpperCase(),
        sublabel: liveAgent?.role || 'CPA Specialist',
        type: agentId === 'eve-hermes' ? 'HERMES_CORE' : 'AGENT',
        cortexId: cortex.id,
        x: absX,
        y: absY,
        size: layout.size,
        baseColor: layout.baseColor,
        activeColor: '#38bdf8',
        agentData: liveAgent,
        operationalStatus: liveAgent?.operationalStatus || 'AVAILABLE',
        meta: { charter: liveAgent?.charter, competency: liveAgent?.competencyScores }
      };

      nodes.push(agentNode);
      nodeMap.set(agentNode.id, agentNode);
      if (!graph.hasNode(agentNode.id)) {
        graph.addNode(agentNode.id, agentNode);
      }
    }
  }

  // 3. Create Satellite Nodes
  for (const [satId, satDef] of Object.entries(SATELLITE_DEFINITIONS)) {
    const parentCortex = CORTEX_REGIONS.find(c => c.id === satDef.cortexId);
    if (!parentCortex) continue;

    const absX = parentCortex.x + satDef.relX;
    const absY = parentCortex.y + satDef.relY;

    const satNode: OrganismNode = {
      id: satId,
      label: satDef.label,
      sublabel: satDef.sublabel,
      type: satDef.type,
      cortexId: satDef.cortexId,
      x: absX,
      y: absY,
      size: satDef.size,
      baseColor: satDef.baseColor,
      activeColor: '#ffffff',
      meta: { cortex: parentCortex.name }
    };

    nodes.push(satNode);
    nodeMap.set(satNode.id, satNode);
    if (!graph.hasNode(satNode.id)) {
      graph.addNode(satNode.id, satNode);
    }
  }

  // Helper to add a curved filament edge
  const addFilament = (
    srcId: string,
    tgtId: string,
    kind: OrganismEdge['kind'],
    color: string,
    baseAlpha = 0.12,
    curvature = 0.2
  ) => {
    const src = nodeMap.get(srcId);
    const tgt = nodeMap.get(tgtId);
    if (!src || !tgt) return;

    const edgeId = `edge-${srcId}-${tgtId}-${edges.length}`;
    const midX = (src.x + tgt.x) / 2;
    const midY = (src.y + tgt.y) / 2;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;

    // Perpendicular vector for organic Bezier curvature
    const perpX = -dy * curvature;
    const perpY = dx * curvature;

    const c1x = midX + perpX;
    const c1y = midY + perpY;
    const c2x = midX + perpX * 0.8;
    const c2y = midY + perpY * 0.8;

    const edge: OrganismEdge = {
      id: edgeId,
      source: srcId,
      target: tgtId,
      c1x,
      c1y,
      c2x,
      c2y,
      kind,
      baseAlpha,
      activeAlpha: 0.85,
      color,
      isIlluminated: false
    };

    edges.push(edge);
    if (graph.hasNode(srcId) && graph.hasNode(tgtId)) {
      graph.addEdgeWithKey(edgeId, srcId, tgtId, edge);
    }
  };

  // 4. Primary Axon Filaments: Connect Hermes Core to each functional cortex & its lead agent
  const hermesId = 'eve-hermes';
  for (const cortex of CORTEX_REGIONS) {
    if (cortex.id === 'cortex-hermes') continue;
    // Core axon to cortex center
    addFilament(hermesId, cortex.id, 'AXON_CORE', cortex.color, 0.25, 0.15);
    // Axon to primary agent in cortex
    if (cortex.agentIds.length > 0) {
      addFilament(hermesId, cortex.agentIds[0], 'AXON_CORE', cortex.color, 0.32, -0.12);
    }
  }

  // 5. Connect satellites to their cortex centers and parent agents
  for (const [satId, satDef] of Object.entries(SATELLITE_DEFINITIONS)) {
    const cortex = CORTEX_REGIONS.find(c => c.id === satDef.cortexId);
    if (!cortex) continue;
    addFilament(satId, cortex.id, 'INTRA_CORTEX', satDef.baseColor, 0.28, 0.1);
    if (cortex.agentIds.length > 0) {
      addFilament(cortex.agentIds[0], satId, 'INTRA_CORTEX', satDef.baseColor, 0.32, -0.15);
    }
  }

  // 6. Connect intra-cortex agents (e.g. Ledger <-> Euclid, Athena <-> Lexicon, Sentinel <-> Quinn)
  const intraCortexPairs = [
    ['eve-ledger', 'eve-euclid'],
    ['eve-ledger', 'eve-mercury'],
    ['eve-ledger', 'eve-atlas'],
    ['eve-euclid', 'eve-mercury'],
    ['eve-veritas', 'eve-argus'],
    ['eve-athena', 'eve-lexicon'],
    ['eve-sentinel', 'eve-quinn'],
    ['eve-minerva', 'eve-darwin']
  ];
  for (const [a1, a2] of intraCortexPairs) {
    addFilament(a1, a2, 'INTRA_CORTEX', '#38bdf8', 0.38, 0.25);
  }

  // 7. Functional Inter-Cortex Synaptic Bridges (The Real Audit Pipeline)
  const interCortexBridges: Array<[string, string, string]> = [
    // External Ingress -> Intake / Worker -> Financial & Evidence
    ['ext-synthetic-client', 'inf-worker', '#06b6d4'],
    ['inf-worker', 'eve-ledger', '#10b981'],
    ['inf-worker', 'eve-veritas', '#0ea5e9'],
    ['eve-ledger', 'eve-veritas', '#0ea5e9'],
    ['eve-veritas', 'eve-euclid', '#14b8a6'],
    ['eve-euclid', 'sat-balance-sheet-gate', '#34d399'],

    // Evidence & Financial -> Client Clarification (PBC)
    ['eve-veritas', 'eve-clara', '#f43f5e'],
    ['eve-clara', 'sat-pbc-channel', '#f43f5e'],
    ['sat-pbc-channel', 'ext-synthetic-client', '#f43f5e'],
    ['ext-synthetic-client', 'eve-clara', '#f43f5e'],

    // Technical Standards & Partner Review
    ['eve-ledger', 'eve-athena', '#a855f7'],
    ['eve-athena', 'eve-quinn', '#f59e0b'],
    ['eve-quinn', 'eve-sentinel', '#f59e0b'],
    ['eve-quinn', 'eve-hermes', '#d97706'],

    // Quality Clearance -> Report Factory
    ['eve-sentinel', 'eve-scribe', '#22c55e'],
    ['eve-quinn', 'eve-scribe', '#22c55e'],
    ['eve-scribe', 'sat-pdf-factory', '#4ade80'],
    ['eve-scribe', 'sat-xlsx-engine', '#86efac'],
    ['eve-scribe', 'sat-json-audit-pkg', '#a7f3d0'],

    // Reports -> Minerva 3-Layer Truth Evaluation & Darwin Evolution
    ['sat-json-audit-pkg', 'eve-minerva', '#ec4899'],
    ['eve-minerva', 'eve-darwin', '#ec4899'],
    ['eve-minerva', 'eve-hermes', '#f472b6'],

    // Model routing inter-connects
    ['eve-ledger', 'mod-tier0-det', '#34d399'],
    ['eve-veritas', 'mod-tier1-qwen', '#818cf8'],
    ['eve-athena', 'mod-tier2-flash', '#60a5fa'],
    ['eve-quinn', 'mod-tier3-pro', '#93c5fd'],

    // Memory inter-connects
    ['eve-hermes', 'mem-working', '#c084fc'],
    ['eve-hermes', 'mem-episodic', '#a855f7'],
    ['eve-minerva', 'mem-engagement-twin', '#f472b6']
  ];

  for (const [src, tgt, col] of interCortexBridges) {
    addFilament(src, tgt, 'INTER_CORTEX', col, 0.35, 0.18);
    addFilament(tgt, src, 'INTER_CORTEX', col, 0.18, -0.18);
  }

  // 8. Generate dense organic micro-filaments (neural mesh / synaptic web)
  // Connect neighboring cortices with multi-strand spline bundles
  const adjacentCortices: Array<[string, string]> = [
    ['cortex-external', 'cortex-financial'],
    ['cortex-external', 'cortex-evidence'],
    ['cortex-financial', 'cortex-evidence'],
    ['cortex-evidence', 'cortex-technical'],
    ['cortex-financial', 'cortex-intelligence'],
    ['cortex-intelligence', 'cortex-memory'],
    ['cortex-memory', 'cortex-client'],
    ['cortex-client', 'cortex-quality'],
    ['cortex-quality', 'cortex-reporting'],
    ['cortex-reporting', 'cortex-learning'],
    ['cortex-technical', 'cortex-learning'],
    ['cortex-quality', 'cortex-infrastructure'],
    ['cortex-reporting', 'cortex-infrastructure']
  ];

  for (const [c1Id, c2Id] of adjacentCortices) {
    const c1 = CORTEX_REGIONS.find(c => c.id === c1Id);
    const c2 = CORTEX_REGIONS.find(c => c.id === c2Id);
    if (!c1 || !c2) continue;

    // 3 parallel curved strands per adjacent pair
    for (let i = -1; i <= 1; i++) {
      addFilament(c1.id, c2.id, 'SYNAPTIC_WEB', c1.color, 0.08, 0.15 + i * 0.08);
    }
  }

  // 9. Match real active pathways and illuminate them
  for (const pw of activePathways) {
    const matchingEdge = edges.find(
      e => (e.source === pw.sourceAgentId && e.target === pw.targetAgentId) ||
           (e.source === pw.targetAgentId && e.target === pw.sourceAgentId)
    );
    if (matchingEdge) {
      matchingEdge.isIlluminated = true;
      matchingEdge.baseAlpha = 0.85;
    }
  }

  // 10. Match recent events to illuminate recently used pathways
  const recentCutoff = Date.now() - 60000; // within last 60 seconds
  for (const evt of recentEvents) {
    if (new Date(evt.timestamp).getTime() > recentCutoff) {
      const srcNode = evt.sourceId;
      const tgtNode = evt.targetId;
      if (srcNode && tgtNode) {
        const edge = edges.find(
          e => (e.source === srcNode && e.target === tgtNode) ||
               (e.source === tgtNode && e.target === srcNode)
        );
        if (edge) {
          edge.isIlluminated = true;
          edge.activeEvent = evt;
        }
      }
    }
  }

  return { graph, nodes, edges, nodeMap };
}

/**
 * Creates live traveling signals from real active pathways and recent events
 */
export function generateLivingSignals(
  activePathways: ObservatoryPathway[] = [],
  recentEvents: ObservatoryEventItem[] = [],
  edges: OrganismEdge[] = []
): TravelingSignal[] {
  const signals: TravelingSignal[] = [];

  // 1. Signals from active pathways
  for (const pw of activePathways) {
    const edge = edges.find(
      e => (e.source === pw.sourceAgentId && e.target === pw.targetAgentId)
    );
    if (edge) {
      signals.push({
        id: `sig-pw-${pw.id}`,
        edgeId: edge.id,
        sourceNodeId: pw.sourceAgentId,
        targetNodeId: pw.targetAgentId,
        progress: (Date.now() % 3000) / 3000,
        speed: 0.008,
        color: '#38bdf8',
        size: 5.5,
        executionMode: 'FULL_PRACTICE',
        label: pw.signalType,
        timestamp: new Date(pw.timestamp).getTime()
      });
    }
  }

  // 2. Signals from recent real events (last 45 seconds)
  const now = Date.now();
  const recentEventsFiltered = recentEvents.filter(
    e => now - new Date(e.timestamp).getTime() < 45000 && e.sourceId && e.targetId
  );

  for (const evt of recentEventsFiltered.slice(0, 10)) {
    const edge = edges.find(
      e => (e.source === evt.sourceId && e.target === evt.targetId) ||
           (e.source === evt.targetId && e.target === evt.sourceId)
    );
    if (edge) {
      const isFastRegression = evt.executionMode === 'FAST_REGRESSION' || evt.eventReality === 'FAST_REGRESSION';
      const eventTime = new Date(evt.timestamp).getTime();
      const elapsed = (now - eventTime) % 2500;
      signals.push({
        id: `sig-evt-${evt.eventId}`,
        edgeId: edge.id,
        sourceNodeId: evt.sourceId,
        targetNodeId: evt.targetId || edge.target,
        progress: elapsed / 2500,
        speed: isFastRegression ? 0.015 : 0.007,
        color: isFastRegression ? '#06b6d4' : (evt.severity === 'ERROR' ? '#ef4444' : '#10b981'),
        size: isFastRegression ? 4.0 : 6.0,
        executionMode: isFastRegression ? 'FAST_REGRESSION' : 'FULL_PRACTICE',
        eventPayload: evt,
        label: evt.summary.length > 25 ? evt.summary.substring(0, 25) + '…' : evt.summary,
        timestamp: eventTime
      });
    }
  }

  return signals;
}
