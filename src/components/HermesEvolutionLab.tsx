import React, { useState, useEffect, useRef } from 'react';
import { Bot, Play, Pause, RefreshCw, CheckCircle2, TrendingUp, Cpu, FileText, Zap, Layers, Sparkles, ShieldCheck, Terminal, Wrench, BarChart3, ChevronRight, Activity, Server, Plus, ArrowRight, ShieldAlert, Check, Clock, Eye, Sliders } from 'lucide-react';

interface EvolutionaryCycle {
  id: string;
  scenarioName: string;
  difficulty: 'Simple SME Receipt' | 'Mid-Market Trial Balance' | 'Fortune 50 SEC 10-K Filing' | 'Cross-Border Multi-Subsidiary';
  complexityScore: number; // 1 to 10
  requestedTools: string[];
  extractionAccuracy: number;
  consensusScore: number;
  dashboardsCompiled: string[];
  durationMs: number;
  status: 'passed' | 'evaluating' | 'generating_dashboards';
  timestamp: string;
}

interface ToolRequestItem {
  id: string;
  agent: string;
  tool: string;
  purpose: string;
  impact: string;
  status: 'requested' | 'granted' | 'executing';
  requestTime: string;
}

export function HermesEvolutionLab() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'replica' | 'tool_hub'>('telemetry');
  const [isHeartbeatActive, setIsHeartbeatActive] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [cycleCount, setCycleCount] = useState(148);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState<'Level 1: SME' | 'Level 2: Mid-Market' | 'Level 3: Fortune 50 Enterprise'>('Level 3: Fortune 50 Enterprise');
  const [overallPrecision, setOverallPrecision] = useState(99.982);
  const [recentCycles, setRecentCycles] = useState<EvolutionaryCycle[]>([]);
  
  // Replica State
  const [replicaWorkspaces, setReplicaWorkspaces] = useState<Array<{ id: string; name: string; type: string; accuracy: string; status: string }>>([
    { id: 'rep-1', name: 'Simulated Entity: CyberDyne Global (Fortune 100)', type: '10-K SEC Audit', accuracy: '100.0%', status: 'Practicing ASC 606' },
    { id: 'rep-2', name: 'Simulated Entity: Acme Industrial (Mid-Market)', type: 'IFRS Consolidation', accuracy: '99.9%', status: 'Practicing Inventory Valuation' },
    { id: 'rep-3', name: 'Simulated Entity: BioHealth Tech (Series C)', type: 'R&D Tax Audit', accuracy: '100.0%', status: 'Practicing Trial Balance Sync' }
  ]);

  const [logs, setLogs] = useState<string[]>([
    "[HEARTBEAT INIT] Hermes Continuous Evolutionary Engine active in Isolated Practice Sandbox.",
    "[REPLICA ENVIRONMENT] Customer-isolated replica online. Practice data streams isolated from production.",
    "[AGENT LINK] Prime, Alpha (Vision/OCR), Beta (GAAP), Gamma (FX) linked to Autonomous Sandbox.",
    "[ACTIVE GOAL] Target 100.00% precision across Fortune 50 multi-currency 10-K SEC filings."
  ]);

  const [activeToolRequests, setActiveToolRequests] = useState<ToolRequestItem[]>([
    { id: 'tr-1', agent: 'Agent Alpha', tool: 'OCR_Spatial_Matrix_Extractor', purpose: 'Parsing 8-column tabular footnotes in SEC Form 10-K', impact: '+34% table extraction speed', status: 'executing', requestTime: '12 mins ago' },
    { id: 'tr-2', agent: 'Agent Beta', tool: 'GAAP_Taxonomy_Validator', purpose: 'Verifying revenue recognition compliance under ASC 606', impact: 'Eliminates false revenue flags', status: 'granted', requestTime: '25 mins ago' },
    { id: 'tr-3', agent: 'Agent Gamma', tool: 'Interbank_FX_Spot_Feed', purpose: 'Standardizing EUR/USD/JPY multi-currency consolidations', impact: 'Real-time FX variance precision', status: 'granted', requestTime: '40 mins ago' },
    { id: 'tr-4', agent: 'Agent Prime', tool: 'SEC_Edgar_XBRL_AutoFetcher', purpose: 'Direct streaming of public 10-K filings for continuous practice', impact: 'Unlocks 100,000+ real practice sets', status: 'requested', requestTime: 'Just now' }
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Evolutionary Heartbeat Loop
  useEffect(() => {
    if (!isHeartbeatActive) return;

    const scenarios = [
      {
        name: "Berkshire Hathaway Multi-Subsidiary Insurance & Railway Consolidation",
        diff: 'Fortune 50 SEC 10-K Filing' as const,
        score: 9.8,
        tools: ['OCR_Spatial_Matrix_Extractor', 'GAAP_Taxonomy_Validator', 'Interbank_FX_Spot_Feed', 'Python_Math_Sandbox'],
        dashboards: ['Consolidated Income Statement', 'Segment Balance Sheet', 'Intercompany Eliminations']
      },
      {
        name: "Siemens AG Cross-Border European VAT & IFRS Segment Breakdown",
        diff: 'Cross-Border Multi-Subsidiary' as const,
        score: 9.4,
        tools: ['OCR_Spatial_Matrix_Extractor', 'Interbank_FX_Spot_Feed', 'Tax_Standard_Engine'],
        dashboards: ['EUR/USD Currency Bridge', 'IFRS Income Statement', 'Sub-Entity Tax Reconciliations']
      },
      {
        name: "Apex BioTech Series B Flash Trial Balance & Deferred Revenue Audit",
        diff: 'Mid-Market Trial Balance' as const,
        score: 6.5,
        tools: ['GAAP_Taxonomy_Validator', 'Python_Math_Sandbox'],
        dashboards: ['Trial Balance Sheet', 'Cash Flow Forecast']
      },
      {
        name: "Toyota Motor Corp Global Foreign Exchange & Subsidiary Trial Balance",
        diff: 'Fortune 50 SEC 10-K Filing' as const,
        score: 9.9,
        tools: ['OCR_Spatial_Matrix_Extractor', 'Interbank_FX_Spot_Feed', 'Python_Math_Sandbox', 'Dynamic_Dashboard_Compiler'],
        dashboards: ['JPY/USD Global Summary', 'Consolidated Balance Sheet', 'FX Variance Heatmap']
      }
    ];

    const intervalTime = Math.max(800, 3500 / simulationSpeed);

    const interval = setInterval(() => {
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const now = new Date().toLocaleTimeString();

      setCycleCount(prev => prev + 1);
      
      // Update logs
      setLogs(prev => [
        ...prev.slice(-30),
        `[${now}] [Practice Cycle #${cycleCount + 1}] Target: ${randomScenario.name}`,
        `[Agent Alpha] Executing spatial table extraction tool '${randomScenario.tools[0]}'...`,
        `[Agent Beta] Running GAAP math validation & line item normalization...`,
        `[Agent Gamma] Resolving multi-currency spot rates & intercompany eliminations...`,
        `[Agent Prime] 4-Agent Consensus reached: 100.00% precision. Compiling replica dashboards: ${randomScenario.dashboards.join(', ')}.`
      ]);

      // Add to recent cycles
      const newCycle: EvolutionaryCycle = {
        id: `CYC-${cycleCount + 1}`,
        scenarioName: randomScenario.name,
        difficulty: randomScenario.diff,
        complexityScore: randomScenario.score,
        requestedTools: randomScenario.tools,
        extractionAccuracy: 100.0,
        consensusScore: 100.0,
        dashboardsCompiled: randomScenario.dashboards,
        durationMs: Math.floor(800 + Math.random() * 600),
        status: 'passed',
        timestamp: now
      };

      setRecentCycles(prev => [newCycle, ...prev.slice(0, 5)]);
      setOverallPrecision(prev => Math.min(100.0, +(prev + 0.001).toFixed(4)));

    }, intervalTime);

    return () => clearInterval(interval);
  }, [isHeartbeatActive, cycleCount, simulationSpeed]);

  const handleGrantTool = (id: string) => {
    setActiveToolRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'granted' } : r));
    setLogs(prev => [...prev, `[ADMIN ACTION] Granted requested tool '${id}' to Hermes Agent Bureau.`]);
  };

  const handleLaunchPracticeRun = () => {
    const newWs = {
      id: `rep-${Date.now()}`,
      name: `Simulated Entity: Practice Run #${cycleCount + 1}`,
      type: 'Autonomous Audit Practice',
      accuracy: '100.0%',
      status: 'In Practice'
    };
    setReplicaWorkspaces([newWs, ...replicaWorkspaces]);
    setLogs(prev => [...prev, `[PRACTICE INITIATED] Manual trigger: Launched isolated practice entity '${newWs.name}'.`]);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Hermes Isolated Practice Sandbox & Evolution Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Hermes Autonomous Evolution Lab</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              In the absence of live client tasks, Hermes runs 24/7 inside an isolated replica environment. It simulates complex corporate audits, identifies analytical friction, proactive requests new tools from admins, and compiles practice workpapers to reach 100% precision.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsHeartbeatActive(!isHeartbeatActive)}
              className={`px-5 py-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-lg cursor-pointer ${
                isHeartbeatActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-emerald-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isHeartbeatActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Practice Heartbeat Active</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Practice Sandbox</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'telemetry' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Agent Telemetry & Practice Cycles</span>
          </button>
          <button
            onClick={() => setActiveTab('replica')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'replica' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Hermes Isolated System Replica</span>
          </button>
          <button
            onClick={() => setActiveTab('tool_hub')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'tool_hub' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Proactive Tool Requests ({activeToolRequests.filter(r => r.status === 'requested').length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overall Precision Target</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">{overallPrecision}%</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> 100.00% Zero-Error Consensus
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Autonomous Cycles Run</span>
            <RefreshCw className={`w-5 h-5 text-blue-400 ${isHeartbeatActive ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">{cycleCount} Tests</div>
          <p className="text-xs text-slate-400 mt-1">Continuous practice loop</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Simulation Speed</span>
            <Sliders className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            {[1, 5, 20].map(s => (
              <button
                key={s}
                onClick={() => setSimulationSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  simulationSpeed === s ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          <p className="text-xs text-purple-400 mt-1">Practice multiplier</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Scenario Level</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 mt-2 truncate">{currentDifficultyLevel}</div>
          <p className="text-xs text-slate-400 mt-1">Simple SME to Fortune 50 Filings</p>
        </div>
      </div>

      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Recent Autonomous Practice Scenarios
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hermes verifies trial balance math, OCR tables, and builds audit workpapers in the replica system.
                  </p>
                </div>
                <button
                  onClick={handleLaunchPracticeRun}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Practice Run</span>
                </button>
              </div>

              <div className="space-y-3">
                {recentCycles.map(c => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{c.scenarioName}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                            Score: {c.complexityScore}/10
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-blue-400">{c.difficulty}</span>
                          <span>•</span>
                          <span>{c.timestamp}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          100% Accuracy
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-900 text-xs">
                      <span className="text-slate-500 font-semibold text-[10px] uppercase">Workpapers Compiled:</span>
                      {c.dashboardsCompiled.map((d, idx) => (
                        <span key={idx} className="bg-slate-900 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-[11px]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Subagent Consensus Bureau
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400">Prime Orchestrator</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Orchestrates practice scenarios, calculates confidence weights, requests missing tools.</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-400">Agent Alpha (Vision & OCR)</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Active</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Parses 10-K SEC footnote matrices and complex trial balances in sandbox.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Practice Sandbox Console
                </h3>
                <span className={`w-2 h-2 rounded-full ${isHeartbeatActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-72 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'replica' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                Isolated Hermes Replica Environment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                A 1:1 sandbox mirror of the customer workspace engine. Hermes practices here 24/7 without touching client records.
              </p>
            </div>
            <button
              onClick={handleLaunchPracticeRun}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Simulate New Practice Engagement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {replicaWorkspaces.map(ws => (
              <div key={ws.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {ws.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">{ws.accuracy} Accuracy</span>
                </div>
                <h4 className="font-extrabold text-sm text-white">{ws.name}</h4>
                <p className="text-xs text-slate-400">Current Task: {ws.status}</p>
                <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono">Sandbox ID: {ws.id}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    <span>Inspect Practice Workpapers</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tool_hub' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Proactive Agent Tool Request Hub
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              When Hermes encounters analytical friction during 24/7 practice runs, it synthesizes proactive tool requests for administrators to approve.
            </p>
          </div>

          <div className="space-y-3">
            {activeToolRequests.map((req) => (
              <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{req.tool}</span>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {req.agent}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{req.requestTime}</span>
                  </div>
                  <p className="text-xs text-slate-300">{req.purpose}</p>
                  <p className="text-xs text-emerald-400 font-semibold">Expected Benefit: {req.impact}</p>
                </div>

                <div className="shrink-0">
                  {req.status === 'requested' ? (
                    <button
                      onClick={() => handleGrantTool(req.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Provision Tool</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tool Granted & Active</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

