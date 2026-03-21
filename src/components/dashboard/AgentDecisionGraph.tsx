import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

const NODES: GraphNode[] = [
  { id: "1", label: "Inbound Lead", agent: "Salesforce", status: "success", x: 400, y: 40, children: ["2", "3"], detail: "Lead scored at 87/100" },
  { id: "2", label: "Qualify & Route", agent: "Salesforce", status: "success", x: 220, y: 140, children: ["4"], detail: "Enterprise tier detected" },
  { id: "3", label: "Churn Risk Check", agent: "ChurnZero", status: "warning", x: 580, y: 140, children: ["5"], detail: "Risk score elevated: 0.72" },
  { id: "4", label: "MCP Handoff → Zendesk", agent: "MCP Bridge", status: "success", x: 220, y: 240, children: ["6"], detail: "Context payload: 2.1KB" },
  { id: "5", label: "Retention Trigger", agent: "ChurnZero", status: "critical", x: 580, y: 240, children: ["7"], detail: "DRIFT: Reasoning misaligned" },
  { id: "6", label: "Ticket Created", agent: "Zendesk", status: "success", x: 140, y: 340, children: [], detail: "Ticket #ZD-4892 created" },
  { id: "7", label: "Escalation Failed", agent: "ChurnZero", status: "critical", x: 580, y: 340, children: [], detail: "Missing customer context" },
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

export default function AgentDecisionGraph() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <Card className="col-span-2 row-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Agent Decision Graph</CardTitle>
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
          <svg width="780" height="400" className="w-full" viewBox="0 0 780 400">
            {/* Edges */}
            {NODES.map((node) =>
              node.children.map((childId) => {
                const child = nodeMap[childId];
                const targetStatus = child.status;
                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={node.x}
                    y1={node.y + 28}
                    x2={child.x}
                    y2={child.y}
                    stroke={lineColor[targetStatus]}
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    strokeDasharray={targetStatus === "critical" ? "6 3" : "none"}
                  />
                );
              })
            )}
            {/* Nodes */}
            {NODES.map((node) => (
              <g
                key={node.id}
                onClick={() => setSelected(node)}
                className="cursor-pointer"
              >
                <rect
                  x={node.x - 80}
                  y={node.y}
                  width={160}
                  height={56}
                  rx={8}
                  className={`${statusColors[node.status]} stroke-[1.5] transition-all ${node.status === "critical" ? "node-pulse" : ""}`}
                />
                <text
                  x={node.x}
                  y={node.y + 22}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 40}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px] font-mono"
                >
                  {node.agent}
                </text>
              </g>
            ))}
          </svg>
        </div>
        {selected && (
          <div className="border-t border-border p-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-sm">{selected.label}</span>
              <Badge variant="outline" className={statusBadge[selected.status]}>
                {selected.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{selected.agent}</span>
            </div>
            <p className="text-xs text-muted-foreground">{selected.detail}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
