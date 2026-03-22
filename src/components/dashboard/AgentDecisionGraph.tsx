import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDriftNotifications } from "@/hooks/use-drift-notifications";
import { useScenarioReplay } from "@/hooks/useScenarioReplay";
import { toast } from "sonner";

type NodeStatus = "success" | "warning" | "critical" | "running" | "idle" | "pending" | "terminated";
type Topology = "sequential" | "supervisor" | "swarm";

interface GraphNode {
  id: string;
  label: string;
  agent: string;
  status: NodeStatus;
  x: number;
  y: number;
  children: string[];
  detail: string;
  throughput?: number;
  driftScore: number;
  intent: string;
  action: string;
}

const BASE_NODES: Omit<GraphNode, "x" | "y" | "children">[] = [
  { id: "1", label: "Inbound Lead", agent: "Salesforce", status: "success", detail: "Lead scored at 87/100", throughput: 142, driftScore: 96, intent: "Capture & qualify inbound lead", action: "Lead ingested, scored 87/100" },
  { id: "2", label: "Qualify & Route", agent: "Salesforce", status: "success", detail: "Enterprise tier detected", throughput: 98, driftScore: 93, intent: "Route to enterprise pipeline", action: "Classified as enterprise tier" },
  { id: "3", label: "Churn Risk Check", agent: "ChurnZero", status: "warning", detail: "Risk score elevated: 0.72", throughput: 44, driftScore: 68, intent: "Assess retention probability", action: "Risk elevated but no flag raised" },
  { id: "4", label: "MCP Handoff → Zendesk", agent: "MCP Bridge", status: "success", detail: "Context payload: 2.1KB", throughput: 91, driftScore: 91, intent: "Transfer full context to support", action: "Payload transmitted (2.1KB)" },
  { id: "5", label: "Retention Trigger", agent: "ChurnZero", status: "critical", detail: "DRIFT: Reasoning misaligned", throughput: 12, driftScore: 31, intent: "Initiate proactive retention flow", action: "Triggered generic response template" },
  { id: "6", label: "Ticket Created", agent: "Zendesk", status: "success", detail: "Ticket #ZD-4892 created", throughput: 87, driftScore: 95, intent: "Create prioritized support ticket", action: "Ticket #ZD-4892 created" },
  { id: "7", label: "Escalation Failed", agent: "ChurnZero", status: "critical", detail: "Missing customer context", throughput: 3, driftScore: 12, intent: "Escalate to human with full context", action: "Escalation dropped—no context attached" },
];

// Pure function: returns positions and edges per topology
function getTopologyLayout(topology: Topology): { positions: Record<string, { x: number; y: number }>; edges: Record<string, string[]> } {
  if (topology === "sequential") {
    const ids = ["1", "2", "3", "4", "5", "6", "7"];
    const positions: Record<string, { x: number; y: number }> = {};
    ids.forEach((id, i) => {
      positions[id] = { x: 60 + i * 100, y: 180 };
    });
    const edges: Record<string, string[]> = {};
    ids.forEach((id, i) => {
      edges[id] = i < ids.length - 1 ? [ids[i + 1]] : [];
    });
    return { positions, edges };
  }

  if (topology === "swarm") {
    const ids = ["1", "2", "3", "4", "5", "6", "7"];
    const cx = 390, cy = 200, r = 150;
    const positions: Record<string, { x: number; y: number }> = {};
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
      positions[id] = { x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) };
    });
    // Mesh: each node connects to all others with higher id (avoids duplicates)
    const edges: Record<string, string[]> = {};
    ids.forEach((id, i) => {
      edges[id] = ids.slice(i + 1);
    });
    return { positions, edges };
  }

  // Supervisor (default) — hub-and-spoke with orchestrator at top
  return {
    positions: {
      "1": { x: 400, y: 40 },
      "2": { x: 220, y: 140 },
      "3": { x: 580, y: 140 },
      "4": { x: 220, y: 240 },
      "5": { x: 580, y: 240 },
      "6": { x: 140, y: 340 },
      "7": { x: 580, y: 340 },
    },
    edges: {
      "1": ["2", "3"],
      "2": ["4"],
      "3": ["5"],
      "4": ["6"],
      "5": ["7"],
      "6": [],
      "7": [],
    },
  };
}

const statusColors: Record<NodeStatus, string> = {
  success: "stroke-drift-success fill-drift-success/10",
  warning: "stroke-drift-warning fill-drift-warning/10",
  critical: "stroke-drift-critical fill-drift-critical/10",
  running: "stroke-primary fill-primary/10",
  idle: "stroke-muted-foreground fill-muted/50",
  pending: "stroke-drift-warning fill-drift-warning/10",
  terminated: "stroke-muted-foreground/50 fill-muted/20",
};

const statusBadge: Record<NodeStatus, string> = {
  success: "bg-drift-success/15 text-drift-success border-drift-success/30",
  warning: "bg-drift-warning/15 text-drift-warning border-drift-warning/30",
  critical: "bg-drift-critical/15 text-drift-critical border-drift-critical/30",
  running: "bg-primary/15 text-primary border-primary/30",
  idle: "bg-muted text-muted-foreground border-border",
  pending: "bg-drift-warning/15 text-drift-warning border-drift-warning/30",
  terminated: "bg-muted text-muted-foreground border-border",
};

const lineColor: Record<NodeStatus, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  running: "#22b8cf",
  idle: "#64748b",
  pending: "#f59e0b",
  terminated: "#64748b",
};

function jitter(base: number, range: number) {
  return Math.max(0, base + Math.floor((Math.random() - 0.5) * range));
}

interface LiveEvent {
  id: number;
  nodeId: string;
  message: string;
  status: NodeStatus;
  timestamp: Date;
}

interface AgentDecisionGraphProps {
  autoRollbackEnabled?: boolean;
  semanticGateEnabled?: boolean;
  onEscalationClick?: () => void;
  intentLayerVisible?: boolean;
  missionPoliciesActive?: boolean;
  killSwitchEnabled?: boolean;
  killThreshold?: number;
}

const PENDING_PAYLOAD = `{
  "action": "escalate_to_human",
  "customer_id": "ENT-8847",
  "context": {
    "churn_score": 0.89,
    "tier": "enterprise",
    "ltv": "$284,000",
    "open_tickets": 3
  },
  "priority": "P1",
  "routing": "senior_ops"
}`;

export default function AgentDecisionGraph({
  autoRollbackEnabled = true,
  semanticGateEnabled = false,
  onEscalationClick,
  intentLayerVisible = false,
  missionPoliciesActive = false,
  killSwitchEnabled = false,
  killThreshold = 25,
}: AgentDecisionGraphProps) {
  const { alertCriticalDrift } = useDriftNotifications();
  const [topology, setTopology] = useState<Topology>("supervisor");
  const [killTriggered, setKillTriggered] = useState(false);

  const layout = useMemo(() => getTopologyLayout(topology), [topology]);

  // Build initial nodes from BASE_NODES + layout
  const buildNodes = useCallback((): GraphNode[] => {
    return BASE_NODES.map((bn) => ({
      ...bn,
      x: layout.positions[bn.id]?.x ?? 400,
      y: layout.positions[bn.id]?.y ?? 200,
      children: layout.edges[bn.id] ?? [],
    }));
  }, [layout]);

  const [nodes, setNodes] = useState<GraphNode[]>(buildNodes);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(PENDING_PAYLOAD);
  const [showPayloadEditor, setShowPayloadEditor] = useState(false);

  // Replay hook
  const replay = useScenarioReplay();

  // When topology changes, reposition nodes but keep live statuses
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: layout.positions[n.id]?.x ?? n.x,
        y: layout.positions[n.id]?.y ?? n.y,
        children: layout.edges[n.id] ?? [],
      }))
    );
  }, [layout]);

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Kill switch latch
  useEffect(() => {
    if (!killSwitchEnabled || killTriggered) return;
    const avgDrift = nodes.reduce((a, n) => a + n.driftScore, 0) / nodes.length;
    if (avgDrift < killThreshold) {
      setKillTriggered(true);
      setPaused(true);
      toast.error("⛔ EMERGENCY HALT — Kill switch activated", {
        description: `System-wide drift score (${Math.round(avgDrift)}) dropped below threshold (${killThreshold})`,
        duration: 8000,
      });
      setEventCounter((c) => c + 1);
      setEvents((prev) => [
        { id: eventCounter, nodeId: "ALL", message: "🛑 KILL SWITCH ACTIVATED — All agent execution halted", status: "critical" as NodeStatus, timestamp: new Date() },
        ...prev,
      ].slice(0, 8));
    }
  }, [nodes, killSwitchEnabled, killThreshold, killTriggered, eventCounter]);

  // Reset system
  const handleResetSystem = useCallback(() => {
    setKillTriggered(false);
    setPaused(false);
    setNodes(buildNodes());
    toast.success("System reset — live simulation resumed");
  }, [buildNodes]);

  // Apply terminated status when kill triggered
  const displayNodes = useMemo(() => {
    if (!killTriggered) return nodes;
    return nodes.map((n) => ({ ...n, status: "terminated" as NodeStatus }));
  }, [nodes, killTriggered]);

  // Replay node highlighting
  const getReplayNodeStatus = (nodeId: string): NodeStatus | null => {
    if (!replay.replayActive && !replay.replayComplete) return null;
    if (replay.replayStep < 0) return null;
    // Check all completed steps
    for (let i = Math.min(replay.replayStep, replay.totalSteps - 1); i >= 0; i--) {
      if (replay.allSteps[i].nodeId === nodeId) return replay.allSteps[i].status;
    }
    return null;
  };

  // When semantic gate is enabled, convert context-mismatch nodes to "pending"
  useEffect(() => {
    if (semanticGateEnabled) {
      setNodes((prev) =>
        prev.map((node) => {
          if ((node.id === "5" || node.id === "7") && node.status === "critical") {
            return { ...node, status: "pending" as NodeStatus, detail: "⏳ Awaiting human payload review" };
          }
          return node;
        })
      );
    }
  }, [semanticGateEnabled]);

  // Simulate live node status fluctuations
  useEffect(() => {
    if (paused || replay.replayActive || killTriggered) return;
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.status === "pending" && semanticGateEnabled) return node;
          const roll = Math.random();
          let newStatus = node.status;
          let newDetail = node.detail;
          const newThroughput = jitter(node.throughput ?? 50, 20);
          let newDriftScore = Math.max(0, Math.min(100, node.driftScore + Math.floor((Math.random() - 0.5) * 6)));

          if (node.id === "5" || node.id === "7") {
            newDriftScore = Math.max(5, Math.min(50, node.driftScore + Math.floor((Math.random() - 0.3) * 12)));
            if (semanticGateEnabled && roll < 0.15) {
              newStatus = "pending";
              newDetail = "⏳ Awaiting human payload review";
            } else if (roll < 0.3) {
              newStatus = "warning";
              newDetail = roll < 0.15 ? "Drift recovering..." : "Partial context match";
            } else if (roll < 0.7) {
              newStatus = "critical";
              newDetail = node.id === "5" ? "DRIFT: Reasoning misaligned" : "Missing customer context";
            } else {
              newStatus = "running";
              newDetail = "Re-evaluating pipeline...";
            }
          } else if (node.id === "3") {
            newDriftScore = Math.max(40, Math.min(85, node.driftScore + Math.floor((Math.random() - 0.5) * 10)));
            if (roll < 0.2) {
              newStatus = "critical";
              newDetail = `Risk score spiked: ${(0.8 + Math.random() * 0.19).toFixed(2)}`;
            } else if (roll < 0.5) {
              newStatus = "warning";
              newDetail = `Risk score elevated: ${(0.6 + Math.random() * 0.2).toFixed(2)}`;
            } else {
              newStatus = "success";
              newDetail = `Risk score normal: ${(0.2 + Math.random() * 0.3).toFixed(2)}`;
            }
          } else {
            newDriftScore = Math.max(80, Math.min(100, node.driftScore + Math.floor((Math.random() - 0.5) * 4)));
            if (roll < 0.08) {
              newStatus = "running";
              newDetail = "Processing batch...";
            } else {
              newStatus = "success";
            }
          }

          return { ...node, status: newStatus, detail: newDetail, throughput: newThroughput, driftScore: newDriftScore };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [paused, semanticGateEnabled, replay.replayActive, killTriggered]);

  // Generate live event feed
  useEffect(() => {
    if (paused || replay.replayActive || killTriggered) return;
    const interval = setInterval(() => {
      const eventMessages = [
        { nodeId: "1", message: "New lead ingested from webhook", status: "success" as NodeStatus },
        { nodeId: "4", message: "MCP context payload transmitted", status: "success" as NodeStatus },
        { nodeId: "5", message: "Drift detected in retention logic", status: "critical" as NodeStatus },
        { nodeId: "3", message: "Churn probability recalculated", status: "warning" as NodeStatus },
        { nodeId: "6", message: "Zendesk ticket auto-created", status: "success" as NodeStatus },
        { nodeId: "7", message: "Escalation path timeout", status: "critical" as NodeStatus },
        { nodeId: "2", message: "Lead qualified as enterprise tier", status: "success" as NodeStatus },
        { nodeId: "5", message: "Attempting drift remediation...", status: "running" as NodeStatus },
      ];

      if (missionPoliciesActive) {
        const driftingNodes = nodes.filter((n) => n.driftScore < 70);
        if (driftingNodes.length > 0) {
          const dNode = driftingNodes[Math.floor(Math.random() * driftingNodes.length)];
          eventMessages.push({
            nodeId: dNode.id,
            message: `⚠ Semantic Drift: ${dNode.label} alignment at ${dNode.driftScore}% — workflow paused`,
            status: "critical" as NodeStatus,
          });
        }
      }

      const evt = eventMessages[Math.floor(Math.random() * eventMessages.length)];
      setEventCounter((c) => c + 1);
      setEvents((prev) => [{ ...evt, id: eventCounter, timestamp: new Date() }, ...prev].slice(0, 5));
      if (evt.status === "critical") {
        alertCriticalDrift(evt.message);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paused, eventCounter, missionPoliciesActive, nodes, replay.replayActive, killTriggered]);

  // Replay events injected into feed
  useEffect(() => {
    if (replay.replayActive && replay.currentStep) {
      setEventCounter((c) => c + 1);
      setEvents((prev) => [
        { id: eventCounter, nodeId: replay.currentStep!.nodeId, message: replay.currentStep!.feedMessage, status: replay.currentStep!.status, timestamp: new Date() },
        ...prev,
      ].slice(0, 8));
    }
  }, [replay.replayStep]);

  // Keep selected node in sync
  useEffect(() => {
    if (selected) {
      const updated = nodes.find((n) => n.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [nodes, selected]);

  // Animated edge particles
  const [particleTick, setParticleTick] = useState(0);
  useEffect(() => {
    if (killTriggered) return;
    const t = setInterval(() => setParticleTick((p) => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, [killTriggered]);

  const handleApprovePayload = () => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.status === "pending") {
          return { ...node, status: "success", detail: "✓ Payload approved by human operator", driftScore: 85 };
        }
        return node;
      })
    );
    setShowPayloadEditor(false);
    setSelected(null);
    toast.success("Payload approved and forwarded to ChurnZero", {
      description: "Human-verified context transmitted via MCP Bridge",
      duration: 4000,
    });
  };

  const handleStartReplay = () => {
    setPaused(true);
    replay.startReplay();
  };

  const handleResumeLive = () => {
    replay.resumeLive();
    setPaused(false);
  };

  const renderNodes = killTriggered ? displayNodes : (replay.replayActive || replay.replayComplete ? nodes : displayNodes.length ? displayNodes : nodes);
  const svgWidth = topology === "sequential" ? 780 : 780;
  const svgHeight = topology === "sequential" ? 300 : 430;

  const topologyOptions: { value: Topology; label: string }[] = [
    { value: "sequential", label: "Sequential" },
    { value: "supervisor", label: "Supervisor" },
    { value: "swarm", label: "Swarm" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Agent Decision Graph</CardTitle>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${paused || killTriggered ? "bg-muted-foreground" : "bg-drift-success animate-ping"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${paused || killTriggered ? "bg-muted-foreground" : "bg-drift-success"}`} />
            </span>
            {!replay.replayActive && !replay.replayComplete && (
              <button
                onClick={() => setPaused(!paused)}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-border"
                disabled={killTriggered}
              >
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
            )}
            {!replay.replayActive && !replay.replayComplete && !killTriggered && (
              <button
                onClick={handleStartReplay}
                className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5"
              >
                ▶ Replay Scenario
              </button>
            )}
            {replay.replayComplete && (
              <button
                onClick={handleResumeLive}
                className="text-[10px] font-mono text-drift-success hover:text-drift-success/80 transition-colors px-1.5 py-0.5 rounded border border-drift-success/30 bg-drift-success/5"
              >
                ▶ Resume Live
              </button>
            )}
            {killTriggered && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-6 border-drift-critical/30 text-drift-critical hover:bg-drift-critical/10"
                onClick={handleResetSystem}
              >
                🔄 Reset System
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Topology Toggle */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {topologyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTopology(opt.value)}
                  className={`text-[9px] font-mono px-2 py-1 transition-colors ${
                    topology === opt.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {(["success", "warning", "critical", ...(semanticGateEnabled ? ["pending" as NodeStatus] : []), ...(killTriggered ? ["terminated" as NodeStatus] : [])] as NodeStatus[]).map((s) => (
                <span key={s} className={`inline-flex items-center gap-1.5 text-xs ${statusBadge[s]} rounded-full px-2 py-0.5 border`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    s === "success" ? "bg-drift-success" :
                    s === "warning" ? "bg-drift-warning" :
                    s === "pending" ? "bg-drift-warning" :
                    s === "terminated" ? "bg-muted-foreground" :
                    "bg-drift-critical"
                  }`} />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <svg width={svgWidth} height={svgHeight} className="w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {/* Kill Switch Overlay */}
            {killTriggered && (
              <g>
                <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="hsl(0, 0%, 5%)" fillOpacity={0.6} />
                <rect x={svgWidth / 2 - 200} y={svgHeight / 2 - 25} width={400} height={50} rx={8} fill="hsl(0, 72%, 20%)" fillOpacity={0.9} stroke="hsl(0, 72%, 55%)" strokeWidth={2} />
                <text x={svgWidth / 2} y={svgHeight / 2 + 5} textAnchor="middle" fill="hsl(0, 72%, 65%)" className="text-sm font-mono font-bold">
                  ⛔ EMERGENCY HALT — System-wide drift below threshold
                </text>
              </g>
            )}

            {/* Golden Path Overlay */}
            {intentLayerVisible && topology === "supervisor" && !killTriggered && (
              <g opacity={0.5}>
                {[
                  { x1: 400, y1: 74, x2: 220, y2: 140 },
                  { x1: 220, y1: 174, x2: 220, y2: 240 },
                  { x1: 220, y1: 274, x2: 140, y2: 340 },
                ].map((line, i) => (
                  <line key={`golden-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="hsl(152, 60%, 48%)" strokeWidth={3} strokeDasharray="8 4" strokeOpacity={0.5} />
                ))}
                {[
                  { x1: 400, y1: 74, x2: 580, y2: 140 },
                  { x1: 580, y1: 174, x2: 580, y2: 240 },
                  { x1: 580, y1: 274, x2: 580, y2: 340 },
                ].map((line, i) => (
                  <g key={`drift-${i}`}>
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="hsl(0, 72%, 55%)" strokeWidth={2.5} strokeDasharray="3 3" strokeOpacity={0.6} />
                    {i > 0 && (
                      <text x={(line.x1 + line.x2) / 2 + 12} y={(line.y1 + line.y2) / 2} fill="hsl(0, 72%, 55%)" className="text-[7px] font-mono font-bold" textAnchor="start">⚠ DRIFT</text>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Edges */}
            {renderNodes.map((node) =>
              node.children.map((childId) => {
                const child = nodeMap[childId];
                if (!child) return null;
                const targetStatus = killTriggered ? "terminated" : child.status;
                const x1 = node.x, y1 = node.y + (topology === "sequential" ? 34 : 34);
                const x2 = child.x, y2 = child.y;
                const progress = ((particleTick * 1.5) % 100) / 100;
                const px = x1 + (x2 - x1) * progress;
                const py = y1 + (y2 - y1) * progress;

                const goalAlignment = Math.round((node.driftScore + child.driftScore) / 2);
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const isLowAlignment = goalAlignment < 70;

                // Swarm: reduced opacity for non-active edges
                const isSwarm = topology === "swarm";
                const edgeActive = targetStatus === "critical" || targetStatus === "warning" || node.status === "critical" || node.status === "warning";
                const edgeOpacity = isSwarm && !edgeActive ? 0.12 : 0.3;

                return (
                  <g key={`${node.id}-${childId}`}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={lineColor[targetStatus]}
                      strokeWidth={isSwarm ? 1 : 2}
                      strokeOpacity={killTriggered ? 0.1 : edgeOpacity}
                      strokeDasharray={targetStatus === "critical" ? "6 3" : targetStatus === "pending" ? "4 4" : "none"}
                    />
                    {!paused && !killTriggered && targetStatus !== "pending" && (!isSwarm || edgeActive) && (
                      <circle cx={px} cy={py} r={3} fill={lineColor[targetStatus]} opacity={0.8} />
                    )}
                    {missionPoliciesActive && !killTriggered && !isSwarm && (
                      <g>
                        <rect x={midX - 22} y={midY - 8} width={44} height={16} rx={8}
                          fill={isLowAlignment ? "hsl(0, 72%, 55%)" : goalAlignment < 85 ? "hsl(38, 92%, 55%)" : "hsl(152, 60%, 48%)"}
                          fillOpacity={0.2}
                          stroke={isLowAlignment ? "hsl(0, 72%, 55%)" : goalAlignment < 85 ? "hsl(38, 92%, 55%)" : "hsl(152, 60%, 48%)"}
                          strokeOpacity={0.5} strokeWidth={1}
                          className={isLowAlignment ? "animate-pulse" : ""}
                        />
                        <text x={midX} y={midY + 3} textAnchor="middle"
                          fill={isLowAlignment ? "hsl(0, 72%, 55%)" : goalAlignment < 85 ? "hsl(38, 92%, 55%)" : "hsl(152, 60%, 48%)"}
                          className="text-[7px] font-mono font-bold"
                        >
                          🎯{goalAlignment}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })
            )}

            {/* Nodes */}
            {renderNodes.map((node) => {
              const regions: Record<string, string> = { Salesforce: "US-East-1", Zendesk: "US-East-1", ChurnZero: "EU-West-1", "MCP Bridge": "US-East-1" };
              const region = regions[node.agent] || "US-East-1";
              const effectiveStatus = killTriggered ? "terminated" : node.status;
              const replayHighlight = getReplayNodeStatus(node.id);
              const nodeStatus = replayHighlight && (replay.replayActive || replay.replayComplete) ? replayHighlight : effectiveStatus;

              const nodeW = topology === "sequential" ? 100 : 160;
              const nodeH = topology === "sequential" ? 60 : 68;

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    if (killTriggered) return;
                    if (node.status === "pending") {
                      setSelected(node);
                      setShowPayloadEditor(true);
                    } else if (node.id === "7" && onEscalationClick) {
                      onEscalationClick();
                    } else {
                      setSelected(node);
                      setShowPayloadEditor(false);
                    }
                  }}
                  className={killTriggered ? "" : "cursor-pointer"}
                >
                  <rect
                    x={node.x - nodeW / 2} y={node.y}
                    width={nodeW} height={nodeH} rx={8}
                    className={`${statusColors[nodeStatus]} stroke-[1.5] transition-all duration-500 ${nodeStatus === "critical" ? "node-pulse" : ""} ${nodeStatus === "pending" ? "animate-pulse" : ""} ${missionPoliciesActive && nodeStatus === "running" ? "vibe-glow" : ""} ${replayHighlight ? "vibe-glow" : ""}`}
                  />
                  <text x={node.x} y={node.y + 16} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                    {topology === "sequential" ? node.label.split(" ")[0] : node.label}
                  </text>
                  <text x={node.x} y={node.y + 30} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
                    {node.agent}
                  </text>
                  {nodeStatus === "pending" ? (
                    <text x={node.x} y={node.y + 44} textAnchor="middle" className="text-[8px] font-mono" fill="hsl(38, 92%, 55%)">⏳ PENDING</text>
                  ) : nodeStatus === "terminated" ? (
                    <text x={node.x} y={node.y + 44} textAnchor="middle" className="text-[8px] font-mono" fill="hsl(215, 20%, 45%)">⛔ HALTED</text>
                  ) : topology !== "sequential" ? (
                    <>
                      <text x={node.x - 30} y={node.y + 44} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">
                        {node.throughput ?? 0} req/s
                      </text>
                      <rect x={node.x + 8} y={node.y + 36} width={48} height={16} rx={8}
                        fill={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                        fillOpacity={0.2}
                        stroke={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                        strokeOpacity={0.4} strokeWidth={1}
                      />
                      <text x={node.x + 32} y={node.y + 48} textAnchor="middle"
                        fill={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                        className="text-[8px] font-mono font-semibold"
                      >
                        DS:{node.driftScore}
                      </text>
                    </>
                  ) : (
                    <text x={node.x} y={node.y + 44} textAnchor="middle"
                      fill={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                      className="text-[8px] font-mono font-semibold"
                    >
                      DS:{node.driftScore}
                    </text>
                  )}
                  {node.driftScore < 50 && nodeStatus !== "pending" && nodeStatus !== "terminated" && (
                    <text x={node.x} y={node.y + 62} textAnchor="middle" className="text-[7px] font-mono" fill="hsl(0, 72%, 55%)">⚠ semantic mismatch</text>
                  )}
                  {/* Data Sovereignty badge */}
                  {topology !== "sequential" && (
                    <>
                      <rect x={node.x + 20} y={node.y - 14} width={62} height={12} rx={6}
                        fill="hsl(200, 60%, 50%)" fillOpacity={0.12} stroke="hsl(200, 60%, 50%)" strokeOpacity={0.3} strokeWidth={0.8}
                      />
                      <text x={node.x + 51} y={node.y - 5} textAnchor="middle" fill="hsl(200, 60%, 55%)" className="text-[6px] font-mono">📍 {region}</text>
                    </>
                  )}
                  {/* Auto-rollback badge */}
                  {autoRollbackEnabled && nodeStatus === "critical" && topology !== "sequential" && (
                    <g>
                      <rect x={node.x - 80} y={node.y - 16} width={80} height={14} rx={7}
                        fill="hsl(152, 60%, 48%)" fillOpacity={0.15} stroke="hsl(152, 60%, 48%)" strokeOpacity={0.4} strokeWidth={1}
                      />
                      <text x={node.x - 40} y={node.y - 6} textAnchor="middle" fill="hsl(152, 60%, 48%)" className="text-[7px] font-mono font-semibold">✓ State Reverted</text>
                    </g>
                  )}
                  {/* Pending Approval badge */}
                  {nodeStatus === "pending" && topology !== "sequential" && (
                    <g>
                      <rect x={node.x - 80} y={node.y - 16} width={100} height={14} rx={7}
                        fill="hsl(38, 92%, 55%)" fillOpacity={0.15} stroke="hsl(38, 92%, 55%)" strokeOpacity={0.4} strokeWidth={1}
                      />
                      <text x={node.x - 30} y={node.y - 6} textAnchor="middle" fill="hsl(38, 92%, 55%)" className="text-[7px] font-mono font-semibold">🔍 Click to Review</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Replay Step Indicator */}
        {(replay.replayActive || replay.replayComplete) && (
          <div className="border-t border-primary/20 bg-primary/5 px-4 py-3 animate-fade-in-up">
            {replay.replayActive && replay.currentStep && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                    Step {replay.replayStep + 1}/{replay.totalSteps} — {nodes.find((n) => n.id === replay.currentStep?.nodeId)?.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] bg-primary/15 text-primary border-primary/30 animate-pulse">
                    REPLAYING
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{replay.currentStep.narrative}</p>
                <Progress value={((replay.replayStep + 1) / replay.totalSteps) * 100} className="h-1.5" />
              </>
            )}
            {replay.replayComplete && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] bg-drift-critical/15 text-drift-critical border-drift-critical/30">
                    SCENARIO COMPLETE
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Drift detected at Step 4, cascaded to Steps 5-6. Root cause: A2A schema version mismatch between ChurnZero v1.0 and MCP Bridge payload format.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[10px] h-7 border-primary/30 text-primary" onClick={() => onEscalationClick?.()}>
                    Open Root Cause Analysis →
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-7 border-drift-success/30 text-drift-success" onClick={handleResumeLive}>
                    ▶ Resume Live
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Event Feed */}
        <div className="border-t border-border">
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live Feed</span>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[10px] font-mono text-muted-foreground">{events.length} events</span>
          </div>
          <div className="px-4 pb-3 space-y-1.5 max-h-[120px] overflow-y-auto">
            {events.map((evt, i) => {
              const isClaimed = (evt as any).claimedBy;
              return (
                <div key={evt.id} className={`flex items-center gap-2 text-[10px] ${i === 0 ? "animate-fade-in-up" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    evt.status === "success" ? "bg-drift-success" :
                    evt.status === "critical" ? "bg-drift-critical" :
                    evt.status === "warning" ? "bg-drift-warning" : "bg-primary"
                  }`} />
                  <span className="text-muted-foreground font-mono">{evt.timestamp.toLocaleTimeString()}</span>
                  <span className="text-foreground flex-1">{evt.message}</span>
                  {isClaimed ? (
                    <span className="flex items-center gap-1 text-[9px] text-primary">
                      <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">SC</span>
                      In Progress
                    </span>
                  ) : (evt.status === "critical" || evt.status === "warning") ? (
                    <button
                      className="text-[9px] text-muted-foreground hover:text-primary font-mono px-1.5 py-0.5 rounded border border-border hover:border-primary/30 transition-colors"
                      onClick={() => {
                        setEvents((prev) => prev.map((e) => e.id === evt.id ? { ...e, claimedBy: "SC" } as any : e));
                        toast.success("Incident claimed", { description: `You are now investigating: ${evt.message}`, duration: 3000 });
                      }}
                    >
                      Claim
                    </button>
                  ) : null}
                </div>
              );
            })}
            {events.length === 0 && (
              <div className="text-[10px] text-muted-foreground italic">Waiting for events...</div>
            )}
          </div>
        </div>

        {/* Payload Editor for Pending Approval nodes */}
        {showPayloadEditor && selected?.status === "pending" && (
          <div className="border-t border-drift-warning/30 p-4 bg-drift-warning/5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono text-drift-warning uppercase tracking-wider">Human Payload Review</span>
              <Badge variant="outline" className="text-[9px] bg-drift-warning/15 text-drift-warning border-drift-warning/30">{selected.label}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Semantic Verification Gate intercepted a context mismatch. Review and edit the JSON payload before forwarding to {selected.agent}.
            </p>
            <textarea
              value={pendingPayload}
              onChange={(e) => setPendingPayload(e.target.value)}
              className="w-full text-[10px] font-mono text-foreground bg-background/80 rounded-md p-3 border border-drift-warning/20 min-h-[140px] resize-none focus:outline-none focus:ring-1 focus:ring-drift-warning/50 mb-3"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-[10px] h-8" onClick={handleApprovePayload}>✓ Approve & Forward Payload</Button>
              <Button size="sm" variant="outline" className="text-[10px] h-8 border-drift-critical/30 text-drift-critical" onClick={() => { setShowPayloadEditor(false); setSelected(null); }}>✕ Reject</Button>
            </div>
          </div>
        )}

        {/* Standard node detail panel */}
        {selected && !showPayloadEditor && (
          <div className="border-t border-border p-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-medium text-sm">{selected.label}</span>
              <Badge variant="outline" className={statusBadge[selected.status]}>{selected.status}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{selected.agent}</span>
              <span className="text-xs text-muted-foreground font-mono">· {selected.throughput} req/s</span>
              <Badge variant="outline" className={`text-[10px] ${
                selected.driftScore >= 80 ? "bg-drift-success/15 text-drift-success border-drift-success/30" :
                selected.driftScore >= 50 ? "bg-drift-warning/15 text-drift-warning border-drift-warning/30" :
                "bg-drift-critical/15 text-drift-critical border-drift-critical/30"
              }`}>
                Drift Score: {selected.driftScore}/100
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{selected.detail}</p>
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ground Truth Anchoring</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                  selected.driftScore >= 80 ? "bg-drift-success/15 text-drift-success" :
                  selected.driftScore >= 50 ? "bg-drift-warning/15 text-drift-warning" :
                  "bg-drift-critical/15 text-drift-critical"
                }`}>
                  {selected.driftScore >= 80 ? "ALIGNED" : selected.driftScore >= 50 ? "PARTIAL DRIFT" : "SEMANTIC MISMATCH"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase mb-0.5">Original Intent</p>
                  <p className="text-xs text-foreground">{selected.intent}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase mb-0.5">Final Agent Action</p>
                  <p className="text-xs text-foreground">{selected.action}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    selected.driftScore >= 80 ? "bg-drift-success" :
                    selected.driftScore >= 50 ? "bg-drift-warning" :
                    "bg-drift-critical"
                  }`} style={{ width: `${selected.driftScore}%` }} />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">{selected.driftScore}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
