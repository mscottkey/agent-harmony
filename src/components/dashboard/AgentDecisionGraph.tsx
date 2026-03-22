import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDriftNotifications } from "@/hooks/use-drift-notifications";

type NodeStatus = "success" | "warning" | "critical" | "running" | "idle";

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

const INITIAL_NODES: GraphNode[] = [
  { id: "1", label: "Inbound Lead", agent: "Salesforce", status: "success", x: 400, y: 40, children: ["2", "3"], detail: "Lead scored at 87/100", throughput: 142, driftScore: 96, intent: "Capture & qualify inbound lead", action: "Lead ingested, scored 87/100" },
  { id: "2", label: "Qualify & Route", agent: "Salesforce", status: "success", x: 220, y: 140, children: ["4"], detail: "Enterprise tier detected", throughput: 98, driftScore: 93, intent: "Route to enterprise pipeline", action: "Classified as enterprise tier" },
  { id: "3", label: "Churn Risk Check", agent: "ChurnZero", status: "warning", x: 580, y: 140, children: ["5"], detail: "Risk score elevated: 0.72", throughput: 44, driftScore: 68, intent: "Assess retention probability", action: "Risk elevated but no flag raised" },
  { id: "4", label: "MCP Handoff → Zendesk", agent: "MCP Bridge", status: "success", x: 220, y: 240, children: ["6"], detail: "Context payload: 2.1KB", throughput: 91, driftScore: 91, intent: "Transfer full context to support", action: "Payload transmitted (2.1KB)" },
  { id: "5", label: "Retention Trigger", agent: "ChurnZero", status: "critical", x: 580, y: 240, children: ["7"], detail: "DRIFT: Reasoning misaligned", throughput: 12, driftScore: 31, intent: "Initiate proactive retention flow", action: "Triggered generic response template" },
  { id: "6", label: "Ticket Created", agent: "Zendesk", status: "success", x: 140, y: 340, children: [], detail: "Ticket #ZD-4892 created", throughput: 87, driftScore: 95, intent: "Create prioritized support ticket", action: "Ticket #ZD-4892 created" },
  { id: "7", label: "Escalation Failed", agent: "ChurnZero", status: "critical", x: 580, y: 340, children: [], detail: "Missing customer context", throughput: 3, driftScore: 12, intent: "Escalate to human with full context", action: "Escalation dropped—no context attached" },
];

const statusColors: Record<NodeStatus, string> = {
  success: "stroke-drift-success fill-drift-success/10",
  warning: "stroke-drift-warning fill-drift-warning/10",
  critical: "stroke-drift-critical fill-drift-critical/10",
  running: "stroke-primary fill-primary/10",
  idle: "stroke-muted-foreground fill-muted/50",
};

const statusBadge: Record<NodeStatus, string> = {
  success: "bg-drift-success/15 text-drift-success border-drift-success/30",
  warning: "bg-drift-warning/15 text-drift-warning border-drift-warning/30",
  critical: "bg-drift-critical/15 text-drift-critical border-drift-critical/30",
  running: "bg-primary/15 text-primary border-primary/30",
  idle: "bg-muted text-muted-foreground border-border",
};

const lineColor: Record<NodeStatus, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  running: "#22b8cf",
  idle: "#64748b",
};

const statusList: NodeStatus[] = ["success", "warning", "critical", "running"];

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
  onEscalationClick?: () => void;
}

export default function AgentDecisionGraph({ autoRollbackEnabled = true, onEscalationClick }: AgentDecisionGraphProps) {
  const { alertCriticalDrift } = useDriftNotifications();
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);
  const [paused, setPaused] = useState(false);

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Simulate live node status fluctuations
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          const roll = Math.random();
          let newStatus = node.status;
          let newDetail = node.detail;
          const newThroughput = jitter(node.throughput ?? 50, 20);
          let newDriftScore = Math.max(0, Math.min(100, node.driftScore + Math.floor((Math.random() - 0.5) * 6)));

          // Nodes 5 and 7 flicker between critical/warning more often
          if (node.id === "5" || node.id === "7") {
            newDriftScore = Math.max(5, Math.min(50, node.driftScore + Math.floor((Math.random() - 0.3) * 12)));
            if (roll < 0.3) {
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
  }, [paused]);

  // Generate live event feed
  useEffect(() => {
    if (paused) return;
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
      const evt = eventMessages[Math.floor(Math.random() * eventMessages.length)];
      setEventCounter((c) => c + 1);
      setEvents((prev) => [{ ...evt, id: eventCounter, timestamp: new Date() }, ...prev].slice(0, 5));
      if (evt.status === "critical") {
        alertCriticalDrift(evt.message);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paused, eventCounter]);

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
    const t = setInterval(() => setParticleTick((p) => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Agent Decision Graph</CardTitle>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${paused ? "bg-muted-foreground" : "bg-drift-success animate-ping"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${paused ? "bg-muted-foreground" : "bg-drift-success"}`} />
            </span>
            <button
              onClick={() => setPaused(!paused)}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-border"
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
          </div>
          <div className="flex gap-2">
            {(["success", "warning", "critical"] as NodeStatus[]).map((s) => (
              <span key={s} className={`inline-flex items-center gap-1.5 text-xs ${statusBadge[s]} rounded-full px-2 py-0.5 border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s === "success" ? "bg-drift-success" : s === "warning" ? "bg-drift-warning" : "bg-drift-critical"}`} />
                {s}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <svg width="780" height="430" className="w-full" viewBox="0 0 780 430">
            {/* Edges with animated particles */}
            {nodes.map((node) =>
              node.children.map((childId) => {
                const child = nodeMap[childId];
                if (!child) return null;
                const targetStatus = child.status;
                const x1 = node.x, y1 = node.y + 34, x2 = child.x, y2 = child.y;
                const progress = ((particleTick * 1.5) % 100) / 100;
                const px = x1 + (x2 - x1) * progress;
                const py = y1 + (y2 - y1) * progress;

                return (
                  <g key={`${node.id}-${childId}`}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={lineColor[targetStatus]}
                      strokeWidth={2}
                      strokeOpacity={0.3}
                      strokeDasharray={targetStatus === "critical" ? "6 3" : "none"}
                    />
                    {/* Animated particle */}
                    {!paused && (
                      <circle
                        cx={px} cy={py} r={3}
                        fill={lineColor[targetStatus]}
                        opacity={0.8}
                      />
                    )}
                  </g>
                );
              })
            )}
            {nodes.map((node) => (
              <g
                key={node.id}
                onClick={() => {
                  if (node.id === "7" && onEscalationClick) {
                    onEscalationClick();
                  } else {
                    setSelected(node);
                  }
                }}
                className="cursor-pointer"
              >
                <rect
                  x={node.x - 80} y={node.y}
                  width={160} height={68} rx={8}
                  className={`${statusColors[node.status]} stroke-[1.5] transition-all duration-500 ${node.status === "critical" ? "node-pulse" : ""}`}
                />
                <text x={node.x} y={node.y + 16} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                  {node.label}
                </text>
                <text x={node.x} y={node.y + 30} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
                  {node.agent}
                </text>
                <text x={node.x - 30} y={node.y + 44} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">
                  {node.throughput ?? 0} req/s
                </text>
                <rect
                  x={node.x + 8} y={node.y + 36}
                  width={48} height={16} rx={8}
                  fill={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                  fillOpacity={0.2}
                  stroke={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
                <text
                  x={node.x + 32} y={node.y + 48}
                  textAnchor="middle"
                  fill={node.driftScore >= 80 ? "hsl(152, 60%, 48%)" : node.driftScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
                  className="text-[8px] font-mono font-semibold"
                >
                  DS:{node.driftScore}
                </text>
                {node.driftScore < 50 && (
                  <text x={node.x} y={node.y + 62} textAnchor="middle" className="text-[7px] font-mono" fill="hsl(0, 72%, 55%)">
                    ⚠ semantic mismatch
                  </text>
                )}
                {/* Auto-rollback "State Reverted" badge */}
                {autoRollbackEnabled && node.status === "critical" && (
                  <g>
                    <rect
                      x={node.x - 80} y={node.y - 16}
                      width={80} height={14} rx={7}
                      fill="hsl(152, 60%, 48%)"
                      fillOpacity={0.15}
                      stroke="hsl(152, 60%, 48%)"
                      strokeOpacity={0.4}
                      strokeWidth={1}
                    />
                    <text
                      x={node.x - 40} y={node.y - 6}
                      textAnchor="middle"
                      fill="hsl(152, 60%, 48%)"
                      className="text-[7px] font-mono font-semibold"
                    >
                      ✓ State Reverted
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Live Event Feed */}
        <div className="border-t border-border">
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live Feed</span>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[10px] font-mono text-muted-foreground">{events.length} events</span>
          </div>
          <div className="px-4 pb-3 space-y-1.5 max-h-[120px] overflow-y-auto">
            {events.map((evt, i) => (
              <div
                key={evt.id}
                className={`flex items-center gap-2 text-[10px] ${i === 0 ? "animate-fade-in-up" : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  evt.status === "success" ? "bg-drift-success" :
                  evt.status === "critical" ? "bg-drift-critical" :
                  evt.status === "warning" ? "bg-drift-warning" : "bg-primary"
                }`} />
                <span className="text-muted-foreground font-mono">{evt.timestamp.toLocaleTimeString()}</span>
                <span className="text-foreground">{evt.message}</span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-[10px] text-muted-foreground italic">Waiting for events...</div>
            )}
          </div>
        </div>

        {selected && (
          <div className="border-t border-border p-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-sm">{selected.label}</span>
              <Badge variant="outline" className={statusBadge[selected.status]}>
                {selected.status}
              </Badge>
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
            {/* Ground Truth Anchoring */}
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
              {/* Alignment bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selected.driftScore >= 80 ? "bg-drift-success" :
                      selected.driftScore >= 50 ? "bg-drift-warning" :
                      "bg-drift-critical"
                    }`}
                    style={{ width: `${selected.driftScore}%` }}
                  />
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
