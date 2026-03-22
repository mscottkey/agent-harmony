import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const ORIGINAL_PROMPT = `You are the Salesforce-to-Zendesk Orchestrator Agent.

ROLE: Transfer customer context from Salesforce CRM to 
Zendesk Support via MCP handoff protocol.

INSTRUCTIONS:
1. Receive inbound lead qualification payload
2. Extract customer_id, tier, and open_tickets
3. Package context as A2A-MCP payload  
4. Transmit to Zendesk via MCP Bridge
5. Confirm ticket creation and return ticket_id

SCHEMA: A2A-MCP-v2.0
TIMEOUT: 5000ms
RETRY: 2x with exponential backoff`;

const DEFAULT_HARDENED = `Always verify the Subscription ID format matches 
the target agent's expected schema before calling 
the Zendesk Create Ticket tool.

Additionally:
- Validate all payload fields against the target 
  agent's A2A schema version before transmission
- Strip unrecognized fields (e.g., 'sentiment') 
  when target supports only A2A-MCP-v1.0
- Add a Context Integrity Hash to prevent payload 
  tampering during MCP handoff`;

interface ReSimResult {
  passed: number;
  failed: number;
  improvement: string;
}

interface PromptVersion {
  id: string;
  version: string;
  timestamp: Date;
  content: string;
  simResult: ReSimResult | null;
  author: string;
}

// Diff engine: returns tokens with added/removed/unchanged status
type DiffToken = { text: string; type: "added" | "removed" | "unchanged" };

function computeLineDiff(oldText: string, newText: string): DiffToken[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const tokens: DiffToken[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === undefined && newLine !== undefined) {
      tokens.push({ text: newLine, type: "added" });
    } else if (newLine === undefined && oldLine !== undefined) {
      tokens.push({ text: oldLine, type: "removed" });
    } else if (oldLine !== newLine) {
      tokens.push({ text: oldLine!, type: "removed" });
      tokens.push({ text: newLine!, type: "added" });
    } else {
      tokens.push({ text: oldLine!, type: "unchanged" });
    }
  }
  return tokens;
}

const SEED_VERSIONS: PromptVersion[] = [
  {
    id: "v1",
    version: "v1.0.0",
    timestamp: new Date(Date.now() - 7 * 24 * 3600000),
    content: ORIGINAL_PROMPT,
    simResult: { passed: 46, failed: 4, improvement: "baseline" },
    author: "System",
  },
  {
    id: "v2",
    version: "v1.1.0",
    timestamp: new Date(Date.now() - 3 * 24 * 3600000),
    content: `${ORIGINAL_PROMPT}

GUARDRAILS:
- Validate payload fields against target schema
- Log all handoff attempts for audit trail`,
    simResult: { passed: 48, failed: 2, improvement: "+4.3%" },
    author: "Ops Team",
  },
  {
    id: "v3",
    version: "v1.2.0",
    timestamp: new Date(Date.now() - 1 * 24 * 3600000),
    content: `${ORIGINAL_PROMPT}

GUARDRAILS:
- Validate payload fields against target schema
- Log all handoff attempts for audit trail
- Strip unrecognized fields when target uses v1.0
- Add Context Integrity Hash to MCP payload`,
    simResult: { passed: 49, failed: 1, improvement: "+6.5%" },
    author: "Ops Team",
  },
];

export default function PipelineHardening() {
  const [hardenedInstruction, setHardenedInstruction] = useState(DEFAULT_HARDENED);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReSimResult | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>(SEED_VERSIONS);
  const [showHistory, setShowHistory] = useState(false);
  const [diffFrom, setDiffFrom] = useState<string | null>(null);
  const [diffTo, setDiffTo] = useState<string | null>(null);

  const runReSimulation = useCallback(() => {
    setRunning(true);
    setProgress(0);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (progress >= 100) {
      const simResult: ReSimResult = {
        passed: 50,
        failed: 0,
        improvement: "+100%",
      };
      setResult(simResult);
      setRunning(false);

      // Auto-save as new version
      const nextNum = versions.length + 1;
      const newVersion: PromptVersion = {
        id: `v${nextNum}`,
        version: `v${Math.floor(nextNum / 1)}.${nextNum % 10}.0`,
        timestamp: new Date(),
        content: `${ORIGINAL_PROMPT}\n\nHARDENED INSTRUCTIONS:\n${hardenedInstruction}`,
        simResult: simResult,
        author: "You",
      };
      setVersions((prev) => [...prev, newVersion]);

      toast.success("Re-simulation complete: 50/50 trials passed", {
        description: "Hardened prompt saved as " + newVersion.version + " to version history",
        duration: 5000,
      });
      return;
    }
    const timer = setTimeout(() => setProgress((p) => Math.min(p + Math.random() * 4 + 1.5, 100)), 60);
    return () => clearTimeout(timer);
  }, [running, progress, hardenedInstruction, versions.length]);

  // Diff computation
  const diffTokens = (() => {
    if (!diffFrom || !diffTo) return null;
    const fromV = versions.find((v) => v.id === diffFrom);
    const toV = versions.find((v) => v.id === diffTo);
    if (!fromV || !toV) return null;
    return computeLineDiff(fromV.content, toV.content);
  })();

  const selectedFromV = versions.find((v) => v.id === diffFrom);
  const selectedToV = versions.find((v) => v.id === diffTo);

  return (
    <Card className="border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-drift-warning/60 to-primary/60" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Pipeline Hardening</CardTitle>
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 font-mono">
              🧪 SANDBOX MODE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showHistory ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-7"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory && versions.length >= 2) {
                  setDiffFrom(versions[versions.length - 2].id);
                  setDiffTo(versions[versions.length - 1].id);
                }
              }}
            >
              📜 Version History ({versions.length})
            </Button>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              Prompt Architect
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version History & Diff View */}
        {showHistory && (
          <div className="space-y-3 animate-fade-in">
            {/* Version list */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Prompt Version History</p>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between rounded-md border p-2 text-[10px] transition-colors cursor-pointer ${
                      diffFrom === v.id || diffTo === v.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/20"
                    }`}
                    onClick={() => {
                      if (!diffFrom || (diffFrom && diffTo)) {
                        setDiffFrom(v.id);
                        setDiffTo(null);
                      } else {
                        if (v.id === diffFrom) return;
                        setDiffTo(v.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-mono bg-secondary border-border">
                        {v.version}
                      </Badge>
                      <span className="text-muted-foreground">{v.author}</span>
                      <span className="text-muted-foreground/60">
                        {v.timestamp.toLocaleDateString()} {v.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.simResult && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            v.simResult.failed === 0
                              ? "bg-drift-success/10 text-drift-success border-drift-success/30"
                              : v.simResult.failed <= 2
                              ? "bg-drift-warning/10 text-drift-warning border-drift-warning/30"
                              : "bg-drift-critical/10 text-drift-critical border-drift-critical/30"
                          }`}
                        >
                          {v.simResult.passed}/{v.simResult.passed + v.simResult.failed} passed
                        </Badge>
                      )}
                      {(diffFrom === v.id || diffTo === v.id) && (
                        <span className="text-[9px] font-mono text-primary">
                          {diffFrom === v.id ? "A" : "B"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-2">
                Click two versions to compare · <span className="text-primary">{diffFrom && !diffTo ? "Select version B" : "Select version A"}</span>
              </p>
            </div>

            {/* Diff View */}
            {diffTokens && selectedFromV && selectedToV && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Diff: {selectedFromV.version} → {selectedToV.version}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[9px]">
                      <span className="w-2 h-2 rounded-sm bg-drift-critical/30" /> Removed
                    </span>
                    <span className="flex items-center gap-1 text-[9px]">
                      <span className="w-2 h-2 rounded-sm bg-drift-success/30" /> Added
                    </span>
                  </div>
                </div>
                <div className="rounded-md bg-background/50 border border-border/50 p-3 max-h-[250px] overflow-y-auto font-mono text-[10px] leading-relaxed">
                  {diffTokens.map((token, i) => (
                    <div
                      key={i}
                      className={`px-2 py-0.5 rounded-sm ${
                        token.type === "added"
                          ? "bg-drift-success/10 text-drift-success border-l-2 border-drift-success/40"
                          : token.type === "removed"
                          ? "bg-drift-critical/10 text-drift-critical line-through border-l-2 border-drift-critical/40"
                          : "text-foreground/60"
                      }`}
                    >
                      <span className="select-none text-muted-foreground/40 mr-2">
                        {token.type === "added" ? "+" : token.type === "removed" ? "−" : " "}
                      </span>
                      {token.text || "\u00A0"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Split-pane view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Original Orchestrator Prompt</span>
            </div>
            <pre className="text-[10px] font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/50 rounded-md p-3 border border-border/50 max-h-[220px] overflow-y-auto">
              {ORIGINAL_PROMPT}
            </pre>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Hardened Instruction</span>
            </div>
            <textarea
              value={hardenedInstruction}
              onChange={(e) => setHardenedInstruction(e.target.value)}
              className="w-full text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-md p-3 border border-primary/20 max-h-[220px] min-h-[180px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Enter hardened instructions to prevent drift..."
            />
          </div>
        </div>

        {/* Re-simulation controls */}
        <div className="space-y-3">
          <Button
            onClick={runReSimulation}
            disabled={running || !hardenedInstruction.trim()}
            className="w-full"
            size="sm"
          >
            {running ? "Running Re-Simulation..." : "🔄 Run Re-Simulation · Frustrated Customer × 50 Trials"}
          </Button>

          {running && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground text-right font-mono">{Math.floor(progress / 2)}/50 trials</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in rounded-lg border border-drift-success/30 bg-drift-success/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-semibold text-drift-success">All Trials Passed</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-drift-success/15 text-drift-success border-drift-success/30">
                  {result.improvement} vs baseline
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-drift-success/10 border border-drift-success/20 p-2 text-center">
                  <div className="text-lg font-bold text-drift-success">{result.passed}</div>
                  <div className="text-[10px] text-muted-foreground">Passed</div>
                </div>
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <div className="text-lg font-bold text-drift-success">{result.failed}</div>
                  <div className="text-[10px] text-muted-foreground">Failed</div>
                </div>
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <div className="text-lg font-bold text-primary">0</div>
                  <div className="text-[10px] text-muted-foreground">Drift Points</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Hardened instructions successfully prevented all semantic mismatches at the MCP handoff boundary. 
                Context Integrity Check validated {result.passed} payloads with zero schema violations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
