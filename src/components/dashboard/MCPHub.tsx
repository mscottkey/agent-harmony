import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield } from "lucide-react";

interface AgentCard {
  name: string;
  protocol: string;
  latency: number;
  successRate: number;
  status: "connected" | "degraded" | "offline";
  icon: string;
  version: string;
  requests: number;
  versions?: string[];
  semanticMission?: string;
  constraint?: string;
  permittedTools?: string[];
}

const INITIAL_AGENTS: AgentCard[] = [
  { name: "Salesforce", protocol: "A2A v1.2", latency: 42, successRate: 99.2, status: "connected", icon: "☁️", version: "v3.1.0", requests: 1847, versions: ["v3.1.0 (Stable)", "v3.2.0-beta (Canary)"], semanticMission: "Lead Qualification & Pipeline Routing", constraint: "Read-Write (CRM Only)", permittedTools: ["lead.score", "lead.qualify", "opportunity.create", "pipeline.route"] },
  { name: "Zendesk", protocol: "A2A v1.1", latency: 78, successRate: 97.8, status: "connected", icon: "🎧", version: "v2.4.2", requests: 923, semanticMission: "Service Recovery", constraint: "Read-Only (Billing)", permittedTools: ["ticket.create", "ticket.escalate", "ticket.resolve", "macro.apply"] },
  { name: "ChurnZero", protocol: "A2A v1.0", latency: 156, successRate: 91.4, status: "degraded", icon: "📊", version: "v1.8.1", requests: 412, semanticMission: "Retention Intelligence", constraint: "Read-Only (No Direct Contact)", permittedTools: ["churn.predict", "health.score", "segment.analyze", "alert.trigger"] },
];

const statusStyle: Record<string, string> = {
  connected: "bg-drift-success/15 text-drift-success border-drift-success/30",
  degraded: "bg-drift-warning/15 text-drift-warning border-drift-warning/30",
  offline: "bg-drift-critical/15 text-drift-critical border-drift-critical/30",
};

function jitter(base: number, range: number) {
  return Math.max(1, Math.round((base + (Math.random() - 0.5) * range) * 10) / 10);
}

interface MCPHubProps {
  onCanaryChange?: (active: boolean) => void;
}

type SelectedAgentLogic = AgentCard | null;
}

export default function MCPHub({ onCanaryChange }: MCPHubProps) {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({
    Salesforce: "v3.1.0 (Stable)",
  });
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({
    Salesforce: Array(12).fill(0).map(() => 30 + Math.random() * 30),
    Zendesk: Array(12).fill(0).map(() => 60 + Math.random() * 40),
    ChurnZero: Array(12).fill(0).map(() => 120 + Math.random() * 80),
  });

  const isCanary = selectedVersions["Salesforce"] === "v3.2.0-beta (Canary)";

  useEffect(() => {
    onCanaryChange?.(isCanary);
  }, [isCanary, onCanaryChange]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          const canaryBoost = agent.name === "Salesforce" && isCanary ? 60 : 0;
          const latency = jitter(agent.latency + canaryBoost, agent.name === "ChurnZero" ? 80 : isCanary && agent.name === "Salesforce" ? 50 : 20);
          const successRate = Math.min(100, Math.max(85, jitter(
            agent.successRate - (agent.name === "Salesforce" && isCanary ? 4 : 0),
            agent.name === "ChurnZero" ? 6 : 1.5
          )));
          const requests = agent.requests + Math.floor(Math.random() * 8) + 1;

          let status: "connected" | "degraded" | "offline" = "connected";
          if (latency > 200) status = "offline";
          else if (latency > 100 || successRate < 95) status = "degraded";

          return { ...agent, latency, successRate, status, requests };
        })
      );

      setSparklines((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const canaryBoost = key === "Salesforce" && isCanary ? 60 : 0;
          next[key] = [...next[key].slice(1), jitter(
            (key === "ChurnZero" ? 150 : key === "Zendesk" ? 75 : 40) + canaryBoost, 40
          )];
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isCanary]);

  const handleVersionChange = (agentName: string, version: string) => {
    setSelectedVersions((prev) => ({ ...prev, [agentName]: version }));
  };

  const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 80, h = 24;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Virtual MCP Hub</CardTitle>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-drift-success opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-drift-success" />
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
            {agents.filter((a) => a.status !== "offline").length} Online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={`rounded-lg border bg-muted/30 p-3 space-y-2 transition-all duration-500 ${
              agent.name === "Salesforce" && isCanary ? "border-drift-warning/30" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{agent.icon}</span>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {agent.name}
                    {agent.name === "Salesforce" && isCanary && (
                      <Badge variant="outline" className="text-[9px] bg-drift-warning/10 text-drift-warning border-drift-warning/30 animate-pulse">
                        CANARY
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">Agent {agent.version}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {agent.versions && (
                  <Select
                    value={selectedVersions[agent.name] || agent.versions[0]}
                    onValueChange={(v) => handleVersionChange(agent.name, v)}
                  >
                    <SelectTrigger className="h-6 text-[9px] w-[140px] bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agent.versions.map((v) => (
                        <SelectItem key={v} value={v} className="text-[10px]">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Badge variant="outline" className={`text-[10px] transition-all duration-300 ${statusStyle[agent.status]}`}>
                  {agent.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center items-center">
              <div>
                <div className="text-xs font-mono font-medium">{agent.protocol}</div>
                <div className="text-[9px] text-muted-foreground">Protocol</div>
              </div>
              <div>
                <div className={`text-xs font-mono font-medium transition-colors duration-300 ${agent.latency > 100 ? "text-drift-warning" : "text-drift-success"}`}>
                  {agent.latency}ms
                </div>
                <div className="text-[9px] text-muted-foreground">Latency</div>
              </div>
              <div>
                <div className={`text-xs font-mono font-medium transition-colors duration-300 ${agent.successRate < 95 ? "text-drift-warning" : "text-drift-success"}`}>
                  {agent.successRate}%
                </div>
                <div className="text-[9px] text-muted-foreground">Success</div>
              </div>
              <div>
                <div className="text-xs font-mono font-medium text-foreground">{agent.requests.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">Requests</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-[9px] text-muted-foreground font-mono w-12">Latency</span>
              <MiniSparkline
                data={sparklines[agent.name] || []}
                color={agent.latency > 100 ? "#f59e0b" : "#22c55e"}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
