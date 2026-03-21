import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentCard {
  name: string;
  protocol: string;
  latency: number;
  successRate: number;
  status: "connected" | "degraded" | "offline";
  icon: string;
  version: string;
}

const AGENTS: AgentCard[] = [
  { name: "Salesforce", protocol: "A2A v1.2", latency: 42, successRate: 99.2, status: "connected", icon: "☁️", version: "Agent v3.1.0" },
  { name: "Zendesk", protocol: "A2A v1.1", latency: 78, successRate: 97.8, status: "connected", icon: "🎧", version: "Agent v2.4.2" },
  { name: "ChurnZero", protocol: "A2A v1.0", latency: 156, successRate: 91.4, status: "degraded", icon: "📊", version: "Agent v1.8.1" },
];

const statusStyle: Record<string, string> = {
  connected: "bg-drift-success/15 text-drift-success border-drift-success/30",
  degraded: "bg-drift-warning/15 text-drift-warning border-drift-warning/30",
  offline: "bg-drift-critical/15 text-drift-critical border-drift-critical/30",
};

export default function MCPHub() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Virtual MCP Hub</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
            3 Agents
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{agent.icon}</span>
                <div>
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{agent.version}</div>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${statusStyle[agent.status]}`}>
                {agent.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-mono font-medium">{agent.protocol}</div>
                <div className="text-[9px] text-muted-foreground">Protocol</div>
              </div>
              <div>
                <div className={`text-xs font-mono font-medium ${agent.latency > 100 ? "text-drift-warning" : "text-drift-success"}`}>
                  {agent.latency}ms
                </div>
                <div className="text-[9px] text-muted-foreground">Latency</div>
              </div>
              <div>
                <div className={`text-xs font-mono font-medium ${agent.successRate < 95 ? "text-drift-warning" : "text-drift-success"}`}>
                  {agent.successRate}%
                </div>
                <div className="text-[9px] text-muted-foreground">Success</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
