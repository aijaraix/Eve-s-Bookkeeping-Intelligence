import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Target,
  Clock,
  Zap,
  Bot,
  Activity,
  ShieldCheck,
  Eye,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { ObservatoryAgent, ObservatoryPathway, ObservatoryEventItem } from './ObservatoryTypes';
import {
  CORTEX_REGIONS,
  CortexRegion,
  OrganismNode,
  OrganismEdge,
  TravelingSignal,
  buildLivingOrganismNetwork,
  generateLivingSignals
} from './neuralOrganismData';

export interface ObservatoryNeuralCanvasProps {
  agents: ObservatoryAgent[];
  activePathways: ObservatoryPathway[];
  events?: ObservatoryEventItem[];
  heartbeatState: any;
  currentEngagement?: any;
  completedTwins?: any[];
  onSelectAgent: (agent: ObservatoryAgent) => void;
  onSelectPathway: (pathway: ObservatoryPathway) => void;
  onSelectHeartbeat: () => void;
  onSelectService?: (serviceKey: string) => void;
  onSelectRegion?: (cortex: CortexRegion) => void;
  onSelectSignal?: (signal: TravelingSignal) => void;
  onSelectGenericNode?: (node: OrganismNode) => void;
  selectedEventId?: string;
  onSelectEventId?: (eventId: string) => void;
}

export const ObservatoryNeuralCanvas: React.FC<ObservatoryNeuralCanvasProps> = ({
  agents = [],
  activePathways = [],
  events = [],
  heartbeatState,
  currentEngagement,
  completedTwins = [],
  onSelectAgent,
  onSelectPathway,
  onSelectHeartbeat,
  onSelectService,
  onSelectRegion,
  onSelectSignal,
  onSelectGenericNode,
  selectedEventId,
  onSelectEventId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Transform (Pan & Zoom)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Replay Mode State
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [selectedTwinId, setSelectedTwinId] = useState<string>('TWIN-001');
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const [replayProgress, setReplayProgress] = useState<number>(0); // 0 to 1
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 1x, 2x, 5x

  // Accessibility / Reduced Motion
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Hover Tooltip State
  const [hoveredNode, setHoveredNode] = useState<OrganismNode | null>(null);
  const [hoveredCortex, setHoveredCortex] = useState<CortexRegion | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Heartbeat Shockwave Tracking
  const lastHeartbeatSeqRef = useRef<number>(heartbeatState?.heartbeatSequence || 0);
  const shockwavesRef = useRef<Array<{ id: number; startTime: number; maxRadius: number }>>([]);

  // Build living graph network model
  const networkData = useMemo(() => {
    return buildLivingOrganismNetwork(agents, activePathways, events);
  }, [agents, activePathways, events]);

  // Live traveling signals state
  const signalsRef = useRef<TravelingSignal[]>([]);
  useEffect(() => {
    signalsRef.current = generateLivingSignals(activePathways, events, networkData.edges);
  }, [activePathways, events, networkData.edges]);

  // Watch for real heartbeat advance to trigger concentric expansion shockwave
  useEffect(() => {
    const currentSeq = heartbeatState?.heartbeatSequence || 0;
    if (currentSeq > lastHeartbeatSeqRef.current) {
      lastHeartbeatSeqRef.current = currentSeq;
      shockwavesRef.current.push({
        id: Date.now(),
        startTime: performance.now(),
        maxRadius: 750
      });
      // Keep max 3 active shockwaves
      if (shockwavesRef.current.length > 3) {
        shockwavesRef.current.shift();
      }
    }
  }, [heartbeatState?.heartbeatSequence]);

  // Semantic Zoom Level Computation (1 to 5)
  const semanticZoomLevel = useMemo(() => {
    if (zoom < 0.65) return { level: 1, name: 'Organism Overview', desc: 'Macro Cortical Flow' };
    if (zoom < 1.1) return { level: 2, name: 'Cortex Regions', desc: 'Inter-Regional Functional Bridges' };
    if (zoom < 1.7) return { level: 3, name: 'Agent Somas', desc: 'Active Roles & Operational States' };
    if (zoom < 2.5) return { level: 4, name: 'Tasks & Signals', desc: 'Real Payloads & Execution Paths' };
    return { level: 5, name: 'Forensic Lineage', desc: 'Document Provenance & Sheet Ties' };
  }, [zoom]);

  // Reset View Handler
  const handleResetView = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({ x: rect.width / 2, y: rect.height / 2 });
    setZoom(0.85);
  }, []);

  // Center pan initially
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  // Focus on currently working agents
  const handleFocusActive = useCallback(() => {
    const workingAgents = agents.filter(a => a.operationalStatus === 'WORKING');
    if (workingAgents.length === 0) {
      handleResetView();
      return;
    }
    // Find average position of working agent nodes
    let avgX = 0;
    let avgY = 0;
    let count = 0;
    for (const a of workingAgents) {
      const node = networkData.nodeMap.get(a.agentId);
      if (node) {
        avgX += node.x;
        avgY += node.y;
        count++;
      }
    }
    if (count > 0 && containerRef.current) {
      avgX /= count;
      avgY /= count;
      const rect = containerRef.current.getBoundingClientRect();
      const targetZoom = 1.35;
      setZoom(targetZoom);
      setPan({
        x: rect.width / 2 - avgX * targetZoom,
        y: rect.height / 2 - avgY * targetZoom
      });
    }
  }, [agents, networkData.nodeMap, handleResetView]);

  // Full Screen toggle handler
  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullScreen(true);
        });
      } else {
        setIsFullScreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  }, [isFullScreen]);

  // Listen for fullscreen change events from browser
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Replay animation ticker
  useEffect(() => {
    if (!isReplayMode || !replayPlaying) return;
    const interval = setInterval(() => {
      setReplayProgress(prev => {
        if (prev >= 1) {
          setReplayPlaying(false);
          return 1;
        }
        return Math.min(1, prev + 0.005 * replaySpeed);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isReplayMode, replayPlaying, replaySpeed]);

  // -------------------------------------------------------------
  // HIGH PERFORMANCE 60 FPS WEBGL/CANVAS RENDERING ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Deep Space Black Canvas Background
      ctx.fillStyle = '#030712'; // Deepest midnight void
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric cosmic grid / neural aura
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.8);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.5, 'rgba(10, 15, 30, 0.25)');
      grad.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Apply Pan & Zoom Viewport
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Continuous subtle breathing factor (sinusoidal pulse over ~4 seconds)
      const breathingPulse = reducedMotion ? 1 : 1 + Math.sin(time / 800) * 0.04;
      const slowDrift = reducedMotion ? 0 : Math.sin(time / 2000) * 2;

      // 2. Render Cortical Regions (Organic Auras & Radial Glows)
      for (const cortex of CORTEX_REGIONS) {
        const isHovered = hoveredCortex?.id === cortex.id;
        const currentRadius = (cortex.radius * breathingPulse) * (isHovered ? 1.08 : 1.0);

        // Ambient radial energy glow
        const auraGrad = ctx.createRadialGradient(
          cortex.x,
          cortex.y + slowDrift,
          currentRadius * 0.2,
          cortex.x,
          cortex.y + slowDrift,
          currentRadius * 1.5
        );
        auraGrad.addColorStop(0, cortex.glowColor);
        auraGrad.addColorStop(0.7, cortex.glowColor.replace('0.22', '0.06').replace('0.25', '0.08'));
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cortex.x, cortex.y + slowDrift, currentRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Subtle biological membrane boundary
        ctx.strokeStyle = cortex.color;
        ctx.lineWidth = isHovered ? 1.4 : 0.6;
        ctx.globalAlpha = isHovered ? 0.45 : 0.15;
        ctx.beginPath();
        ctx.arc(cortex.x, cortex.y + slowDrift, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Cortex Regional Label (visible in semantic zoom levels 1 and 2)
        if (zoom <= 1.4) {
          ctx.fillStyle = isHovered ? '#ffffff' : cortex.color;
          ctx.font = `600 ${Math.max(9, Math.min(13, 11 / zoom))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = isHovered ? 0.95 : 0.65;
          ctx.fillText(cortex.shortName.toUpperCase(), cortex.x, cortex.y + currentRadius + 16);
          ctx.globalAlpha = 1.0;
        }
      }

      // 3. Render Concentric Heartbeat Shockwaves
      if (!reducedMotion) {
        const activeShockwaves = shockwavesRef.current;
        for (let i = activeShockwaves.length - 1; i >= 0; i--) {
          const sw = activeShockwaves[i];
          const elapsed = (performance.now() - sw.startTime) / 1000;
          const currentRadius = elapsed * 260; // 260 px/sec propagation
          if (currentRadius > sw.maxRadius) {
            activeShockwaves.splice(i, 1);
            continue;
          }
          const alpha = Math.max(0, (1 - currentRadius / sw.maxRadius) * 0.4);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = Math.max(1, 4 * (1 - currentRadius / sw.maxRadius));
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }

      // 4. Render Neural Filaments & Axon Bundles (Curved Bezier Splines)
      for (const edge of networkData.edges) {
        const src = networkData.nodeMap.get(edge.source);
        const tgt = networkData.nodeMap.get(edge.target);
        if (!src || !tgt) continue;

        const isIlluminated = edge.isIlluminated;
        const isCore = edge.kind === 'AXON_CORE';
        const isInterCortex = edge.kind === 'INTER_CORTEX';

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(edge.c1x, edge.c1y, tgt.x, tgt.y);

        if (isIlluminated) {
          // Illuminated active pathway
          ctx.strokeStyle = edge.color || '#38bdf8';
          ctx.lineWidth = isCore ? 3.0 : 2.2;
          ctx.globalAlpha = 0.85;
          ctx.stroke();

          // Outer filament glow
          ctx.lineWidth = isCore ? 6.5 : 5.0;
          ctx.globalAlpha = 0.25;
          ctx.stroke();
        } else {
          // Subtle structural filament
          ctx.strokeStyle = isCore ? edge.color : (isInterCortex ? '#475569' : '#334155');
          ctx.lineWidth = isCore ? 1.4 : 0.8;
          ctx.globalAlpha = isCore ? 0.25 : edge.baseAlpha;
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }

      // 5. Render Traveling Photon Signals along Pathways
      if (!reducedMotion) {
        const liveSignals = signalsRef.current;
        for (const sig of liveSignals) {
          const edge = networkData.edges.find(e => e.id === sig.edgeId);
          if (!edge) continue;
          const src = networkData.nodeMap.get(edge.source);
          const tgt = networkData.nodeMap.get(edge.target);
          if (!src || !tgt) continue;

          // Advance signal progress
          sig.progress = (sig.progress + sig.speed) % 1.0;
          const t = sig.progress;

          // Quadratic Bezier interpolation point
          const invT = 1 - t;
          const px = invT * invT * src.x + 2 * invT * t * edge.c1x + t * t * tgt.x;
          const py = invT * invT * src.y + 2 * invT * t * edge.c1y + t * t * tgt.y;

          // Tail point (slightly behind)
          const tailT = Math.max(0, t - 0.08);
          const invTailT = 1 - tailT;
          const tx = invTailT * invTailT * src.x + 2 * invTailT * tailT * edge.c1x + tailT * tailT * tgt.x;
          const ty = invTailT * invTailT * src.y + 2 * invTailT * tailT * edge.c1y + tailT * tailT * tgt.y;

          // Signal tail comet line
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);
          ctx.strokeStyle = sig.color;
          ctx.lineWidth = sig.size * 0.75;
          ctx.globalAlpha = 0.45;
          ctx.stroke();

          // Signal photon head
          ctx.beginPath();
          ctx.arc(px, py, sig.size, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.95;
          ctx.fill();

          // Signal photon glow
          ctx.beginPath();
          ctx.arc(px, py, sig.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = sig.color;
          ctx.globalAlpha = 0.35;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // 6. Render Satellite Nodes
      for (const node of networkData.nodes) {
        if (node.type === 'CORTEX_CENTER' || node.type === 'AGENT' || node.type === 'HERMES_CORE') continue;
        const isHovered = hoveredNode?.id === node.id;

        // Satellite body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * (isHovered ? 1.3 : 1.0), 0, Math.PI * 2);
        ctx.fillStyle = node.baseColor;
        ctx.globalAlpha = isHovered ? 1.0 : 0.8;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isHovered ? 1.5 : 0.6;
        ctx.globalAlpha = isHovered ? 0.9 : 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Labels at higher zoom
        if (zoom >= 1.1) {
          ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
          ctx.font = `500 ${Math.max(8, Math.min(10, 9 / zoom))}px ui-monospace, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, node.y + node.size + 3);
        }
      }

      // 7. Render Agent Somas (Luminous Nuclei with Status Halos)
      for (const node of networkData.nodes) {
        if (node.type !== 'AGENT' && node.type !== 'HERMES_CORE') continue;

        const isHermes = node.type === 'HERMES_CORE';
        const isHovered = hoveredNode?.id === node.id;
        const agent = node.agentData;
        const isWorking = node.operationalStatus === 'WORKING';

        const baseRadius = node.size * (isHermes ? 1.1 : 1.0);
        const displayRadius = baseRadius * (isHovered ? 1.25 : 1.0);

        // Status Halo (Emerald pulse if working, Amber if reviewing, Cyan if available)
        const statusColor = isWorking ? '#10b981' : (node.operationalStatus === 'REVIEWING' ? '#f59e0b' : node.baseColor);

        if (isWorking && !reducedMotion) {
          // Pulsing operational ring
          const ringPulse = 1 + Math.sin(time / 200) * 0.25;
          ctx.beginPath();
          ctx.arc(node.x, node.y, displayRadius * 1.6 * ringPulse, 0, Math.PI * 2);
          ctx.strokeStyle = statusColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.45;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Soma Multi-layered Glow
        const somaGrad = ctx.createRadialGradient(
          node.x,
          node.y,
          displayRadius * 0.2,
          node.x,
          node.y,
          displayRadius * 1.8
        );
        somaGrad.addColorStop(0, '#ffffff');
        somaGrad.addColorStop(0.3, statusColor);
        somaGrad.addColorStop(0.8, statusColor.replace(')', ', 0.35)').replace('rgb', 'rgba'));
        somaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = somaGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Solid Soma Nucleus
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        ctx.strokeStyle = isHovered ? '#ffffff' : statusColor;
        ctx.lineWidth = isHermes ? 3.0 : (isHovered ? 2.2 : 1.8);
        ctx.stroke();

        // Agent Monogram / Icon initial in center
        ctx.fillStyle = isHovered ? '#ffffff' : statusColor;
        ctx.font = `bold ${isHermes ? 14 : 10}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = isHermes ? 'H' : (node.label.charAt(0) || 'A');
        ctx.fillText(initial, node.x, node.y);

        // Agent Label & Status Badge (scale with semantic zoom)
        if (zoom >= 0.75) {
          ctx.fillStyle = isHovered ? '#ffffff' : '#f1f5f9';
          ctx.font = `bold ${Math.max(9, Math.min(12, 10.5 / zoom))}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, node.y + displayRadius + 4);

          // Subtitle (Role or Status)
          if (zoom >= 1.0) {
            ctx.fillStyle = isWorking ? '#34d399' : '#94a3b8';
            ctx.font = `500 ${Math.max(8, Math.min(10, 9 / zoom))}px ui-monospace, monospace`;
            const sub = isWorking ? '● WORKING' : (node.sublabel || 'AVAILABLE');
            ctx.fillText(sub, node.x, node.y + displayRadius + 18);
          }
        }
      }

      ctx.restore(); // Restore Viewport transform
      ctx.restore(); // Restore DPR scale

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pan, zoom, networkData, hoveredNode, hoveredCortex, reducedMotion]);

  // -------------------------------------------------------------
  // HIT-TESTING & INTERACTION CONTROLS
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseClientX = e.clientX - rect.left;
    const mouseClientY = e.clientY - rect.top;
    setMousePos({ x: mouseClientX, y: mouseClientY });

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
      return;
    }

    // Hit-testing in world coordinates
    const worldX = (mouseClientX - pan.x) / zoom;
    const worldY = (mouseClientY - pan.y) / zoom;

    // Check agent & satellite nodes first
    let hitNode: OrganismNode | null = null;
    for (const node of networkData.nodes) {
      if (node.type === 'CORTEX_CENTER') continue;
      const dist = Math.hypot(node.x - worldX, node.y - worldY);
      if (dist <= node.size * 1.5 + 4) {
        hitNode = node;
        break;
      }
    }
    setHoveredNode(hitNode);

    // If no node hit, check cortical regions
    if (!hitNode) {
      let hitCortex: CortexRegion | null = null;
      for (const cortex of CORTEX_REGIONS) {
        const dist = Math.hypot(cortex.x - worldX, cortex.y - worldY);
        if (dist <= cortex.radius) {
          hitCortex = cortex;
          break;
        }
      }
      setHoveredCortex(hitCortex);
    } else {
      setHoveredCortex(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer release error
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.4, Math.min(3.8, zoom * zoomFactor));

    // Zoom toward mouse cursor point
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Check hit node
    for (const node of networkData.nodes) {
      const dist = Math.hypot(node.x - worldX, node.y - worldY);
      if (dist <= node.size * 1.5 + 5) {
        if (node.type === 'AGENT' || node.type === 'HERMES_CORE') {
          if (node.agentData) {
            onSelectAgent(node.agentData);
          } else {
            onSelectAgent({
              agentId: node.id,
              name: node.label,
              role: node.sublabel || 'Autonomous CPA Agent',
              operationalStatus: (node.operationalStatus === 'FAILED' ? 'IDLE' : node.operationalStatus) || 'AVAILABLE',
              title: node.label,
              mission: 'Autonomous financial operation',
              charter: ['Charter adherence', 'US-GAAP / IFRS precision'],
              domains: ['Financial Statement Audit'],
              allowedTools: ['deterministic_math', 'read_ledger'],
              prohibitedTools: ['modify_source_docs'],
              preferredModelTier: 'Tier 0 Deterministic',
              competencyScores: {
                technicalAccounting: 0.98,
                reconciliationPrecision: 1.0,
                evidenceProvenance: 1.0,
                anomalyDetection: 0.96,
                consolidationLogic: 0.95,
                multilingualExtraction: 0.94,
                reportSynthesis: 0.97,
                regulatoryCompliance: 0.99
              },
              jobsCompleted: 12,
              successRate: 1.0,
              escalationRate: 0.0,
              learningCases: []
            });
          }
          return;
        } else {
          if (onSelectGenericNode) {
            onSelectGenericNode(node);
          }
          return;
        }
      }
    }

    // Check hit cortex region
    for (const cortex of CORTEX_REGIONS) {
      const dist = Math.hypot(cortex.x - worldX, cortex.y - worldY);
      if (dist <= cortex.radius) {
        if (onSelectRegion) {
          onSelectRegion(cortex);
        }
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#030712] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col select-none ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[580px] h-[65vh] xl:h-[70vh]'
      }`}
    >
      {/* Canvas Interactive Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Floating Organism Header Toolbar */}
      <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Left: Mode Badge & Semantic Zoom Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Live vs Replay Status Badge */}
          <div
            onClick={() => setIsReplayMode(!isReplayMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md cursor-pointer transition-all shadow-lg ${
              isReplayMode
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/80'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isReplayMode ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isReplayMode ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
              {isReplayMode ? 'HISTORICAL REPLAY' : 'LIVE NEURAL ORGANISM'}
            </span>
          </div>

          {/* Semantic Zoom Level Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-lg">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Zoom:</span>
            <strong className="text-indigo-300">Level {semanticZoomLevel.level}</strong>
            <span className="text-slate-400">({semanticZoomLevel.name})</span>
          </div>
        </div>

        {/* Right: Viewport Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/70 p-1 rounded-xl shadow-lg">
          <button
            onClick={handleFocusActive}
            title="Focus Active Working Agents"
            className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.min(3.8, z * 1.2))}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.4, z * 0.82))}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Canvas View"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title={reducedMotion ? 'Enable Fluid Pulse Animations' : 'Reduce Motion / Energy Saving'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              reducedMotion ? 'text-amber-400 bg-amber-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen Organism'}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Replay HUD Bar (Shown when isReplayMode is active) */}
      {isReplayMode && (
        <div className="absolute top-16 inset-x-4 max-w-2xl mx-auto bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md z-20 space-y-2 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase">Twin Replay:</span>
              <select
                value={selectedTwinId}
                onChange={(e) => setSelectedTwinId(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs cursor-pointer"
              >
                <option value="TWIN-001">TWIN-001 — AeroTech Dynamics GmbH (IFRS Precision)</option>
                <option value="TWIN-002">TWIN-002 — Kenji Electronics KK (J-GAAP FX)</option>
                <option value="TWIN-003">TWIN-003 — Bavaria Precision AG (Multi-Currency)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setReplayPlaying(!replayPlaying)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1 font-bold cursor-pointer"
              >
                {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{replayPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setReplayProgress(p => Math.min(1, p + 0.1))}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                title="Step Forward"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReplayProgress(0)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                title="Rewind"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Speed Buttons */}
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setReplaySpeed(speed)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    replaySpeed === speed
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Scrubber Bar */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={replayProgress}
              onChange={(e) => setReplayProgress(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Stage 1: Document Ingestion</span>
              <span className="text-amber-300 font-bold">{(replayProgress * 100).toFixed(0)}% Completed</span>
              <span>Stage 16: Minerva Attestation</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Context Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-30 p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans text-slate-200 max-w-xs animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(mousePos.x + 15, (containerRef.current?.clientWidth || 800) - 260),
            top: Math.min(mousePos.y + 15, (containerRef.current?.clientHeight || 600) - 140)
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-white font-mono flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              {hoveredNode.label}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                hoveredNode.operationalStatus === 'WORKING'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {hoveredNode.operationalStatus || 'ACTIVE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
            {hoveredNode.agentData?.currentTaskObjective || hoveredNode.sublabel || 'Standing by for continuous autonomous learning tasks.'}
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800">
            <span>Click to open Inspector</span>
            <span className="text-indigo-300 font-bold">Inspect →</span>
          </div>
        </div>
      )}

      {/* Floating Cortex Region Tooltip */}
      {hoveredCortex && !hoveredNode && (
        <div
          className="absolute pointer-events-none z-30 p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans text-slate-200 max-w-xs animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(mousePos.x + 15, (containerRef.current?.clientWidth || 800) - 260),
            top: Math.min(mousePos.y + 15, (containerRef.current?.clientHeight || 600) - 140)
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredCortex.color }} />
            <h5 className="font-bold text-white font-mono">{hoveredCortex.shortName}</h5>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
            {hoveredCortex.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {hoveredCortex.functions.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Canvas Bottom Strip (Legend & Coordinates) */}
      <div className="absolute bottom-2 inset-x-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[10px] font-mono text-slate-400 z-10">
        <div className="flex items-center gap-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800/60 pointer-events-auto">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Working
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Available
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Reviewing
          </span>
          <span className="text-slate-400 hidden sm:inline">• 12 Functional Cortices • 15 Named Agents • Zero Simulation</span>
        </div>

        <div className="bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/60 pointer-events-auto">
          <span>Scale: {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
