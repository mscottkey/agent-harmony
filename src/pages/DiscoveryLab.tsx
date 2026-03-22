import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Loader2, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogEntry {
  message: string;
  type: "info" | "success" | "warning";
  timestamp: Date;
}

interface AgentIntent {
  agent: string;
  version: string;
  icon: string;
  semanticMission: string;
  constraint: string;
  permittedTools: string[];
  goldenPath: string[];
  status: "pending" | "scanning" | "complete";
}

const AGENTS: AgentIntent[] = [
  {
    agent: "Salesforce",
    version: "v3.1.0",
    icon: "☁️",
    semanticMission: "Lead Qualification & Pipeline Routing",
    constraint: "Read-Write (CRM Objects Only)",
    permittedTools: ["lead.score", "lead.qualify", "opportunity.create", "contact.enrich", "pipeline.route"],
    goldenPath: ["Ingest Lead → Score → Qualify → Route to Pipeline → Handoff to Support"],
    status: "pending",
  },
  {
    agent: "Zendesk",
    version: "v2.4.2",
    icon: "🎧",
    semanticMission: "Service Recovery & Ticket Resolution",
    constraint: "Read-Only (Billing Fields)",
    permittedTools: ["ticket.create", "ticket.escalate", "ticket.resolve", "macro.apply", "satisfaction.survey"],
    goldenPath: ["Receive Context → Create Ticket → Triage Priority → Assign Agent → Resolve"],
    status: "pending",
  },
  {
    agent: "ChurnZero",
    version: "v1.8.1",
    icon: "📊",
    semanticMission: "Retention Intelligence & Proactive Outreach",
    constraint: "Read-Only (No Direct Customer Contact)",
    permittedTools: ["churn.predict", "health.score", "segment.analyze", "alert.trigger", "playbook.recommend"],
    goldenPath: ["Monitor Health Score → Detect Risk → Trigger Playbook → Escalate to CSM"],
    status: "pending",
  },
];

const SCAN_LOGS: { message: string; type: "info" | "success" | "warning"; delay: number; agentIdx?: number }[] = [
  { message: "Initiating Discovery Agent...", type: "info", delay: 0 },
  { message: "Connecting to .well-known/agent-card.json endpoints...", type: "info", delay: 800 },
  { message: "Extracting Semantic Intent from Salesforce v3.1.0...", type: "info", delay: 1600, agentIdx: 0 },
  { message: "Mapping Permitted Tool Chains for Salesforce...", type: "info", delay: 2400, agentIdx: 0 },
  { message: "✓ Salesforce Golden Path Established", type: "success", delay: 3200, agentIdx: 0 },
  { message: "Extracting Semantic Intent from Zendesk v2.4.2...", type: "info", delay: 4000, agentIdx: 1 },
  { message: "Mapping Permitted Tool Chains for Zendesk...", type: "info", delay: 4800, agentIdx: 1 },
  { message: "⚠ Zendesk billing field access detected — flagging as Read-Only constraint", type: "warning", delay: 5400, agentIdx: 1 },
  { message: "✓ Zendesk Golden Path Established", type: "success", delay: 6000, agentIdx: 1 },
  { message: "Extracting Semantic Intent from ChurnZero v1.8.1...", type: "info", delay: 6800, agentIdx: 2 },
  { message: "Mapping Permitted Tool Chains for ChurnZero...", type: "info", delay: 7600, agentIdx: 2 },
  { message: "⚠ ChurnZero direct-contact capability detected — locking as Read-Only", type: "warning", delay: 8200, agentIdx: 2 },
  { message: "✓ ChurnZero Golden Path Established", type: "success", delay: 9000, agentIdx: 2 },
  { message: "✓ All agent intents extracted. Behavioral baselines locked.", type: "success", delay: 10000 },
];

export default function DiscoveryLab() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState(AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentIntent | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const startScan = () => {
    setScanning(true);
    setScanComplete(false);
    setLogs([]);
    setAgents(AGENTS.map((a) => ({ ...a, status: "pending" })));

    SCAN_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { message: log.message, type: log.type, timestamp: new Date() }]);
        if (log.agentIdx !== undefined) {
          setAgents((prev) =>
            prev.map((a, idx) => {
              if (idx === log.agentIdx) {
                return { ...a, status: log.type === "success" ? "complete" : "scanning" };
              }
              return a;
            })
          );
        }
        if (i === SCAN_LOGS.length - 1) {
          setScanning(false);
          setScanComplete(true);
        }
      }, log.delay);
    });
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Discovery Lab</h1>
              <p className="text-[10px] text-muted-foreground font-mono">Intent Extraction & Behavioral Baselining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scanComplete && (
              <Badge variant="outline" className="text-[10px] bg-drift-success/10 text-drift-success border-drift-success/30 animate-fade-in">
                <CheckCircle className="w-3 h-3 mr-1" /> All Baselines Locked
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 flex-1 space-y-4">
        {/* Scan Control */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Ecosystem Discovery Scanner</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                A2A + MCP
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              The Discovery Agent crawls <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">.well-known/agent-card.json</code> endpoints
              to extract semantic intent, permitted tool chains, and behavioral constraints from every agent in the mesh.
            </p>
            <Button
              onClick={startScan}
              disabled={scanning}
              className="gap-2"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Ecosystem...
                </>
              ) : scanComplete ? (
                <>
                  <Search className="w-4 h-4" />
                  Re-Scan Ecosystem
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Scan Ecosystem
                </>
              )}
            </Button>

            {/* Progress Log */}
            {logs.length > 0 && (
              <div
                ref={logRef}
                className="rounded-lg border border-border bg-muted/30 p-3 max-h-[240px] overflow-y-auto space-y-1 font-mono text-[11px]"
              >
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 animate-fade-in ${
                      log.type === "success" ? "text-drift-success" : log.type === "warning" ? "text-drift-warning" : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-[9px] text-muted-foreground shrink-0 w-[70px]">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
                {scanning && (
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Intent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.agent}
              className={`transition-all duration-500 cursor-pointer hover:border-primary/30 ${
                agent.status === "complete" ? "border-drift-success/20" : agent.status === "scanning" ? "border-drift-warning/20 animate-pulse" : "border-border"
              }`}
              onClick={() => agent.status === "complete" && setSelectedAgent(agent)}
            >
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{agent.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{agent.agent}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{agent.version}</div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      agent.status === "complete"
                        ? "bg-drift-success/10 text-drift-success border-drift-success/30"
                        : agent.status === "scanning"
                        ? "bg-drift-warning/10 text-drift-warning border-drift-warning/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {agent.status === "complete" ? "✓ Baselined" : agent.status === "scanning" ? "Scanning..." : "Pending"}
                  </Badge>
                </div>

                {agent.status === "complete" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">Semantic Mission</div>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        Role: {agent.semanticMission}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">Constraint</div>
                      <Badge variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">
                        {agent.constraint}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Click to view extracted logic →
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extracted Logic Modal */}
        {selectedAgent && (
          <Card className="border-primary/20 bg-primary/5 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedAgent.icon}</span>
                  <CardTitle className="text-sm font-semibold">Extracted Logic: {selectedAgent.agent}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setSelectedAgent(null)}>
                  ✕ Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Permitted Tool Chains</div>
                  <div className="space-y-1">
                    {selectedAgent.permittedTools.map((tool) => (
                      <div key={tool} className="flex items-center gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-drift-success shrink-0" />
                        <code className="font-mono text-[10px] text-foreground bg-muted px-1.5 py-0.5 rounded">{tool}</code>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Golden Path</div>
                  {selectedAgent.goldenPath.map((path, i) => (
                    <div key={i} className="text-xs text-foreground font-mono bg-drift-success/5 border border-drift-success/20 rounded-md p-2">
                      {path}
                    </div>
                  ))}
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mt-3">Constraint Boundary</div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-drift-warning" />
                    <span className="text-xs text-drift-warning">{selectedAgent.constraint}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Compliance Footer */}
      <footer className="border-t border-border bg-muted/20 px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-drift-success" />
              <span className="text-[10px] font-semibold text-drift-success">Compliance Certified</span>
            </div>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[9px] font-mono text-muted-foreground">NIST AI 800-4</span>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[9px] font-mono text-muted-foreground">EU AI Act Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
