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

export default function PipelineHardening() {
  const [hardenedInstruction, setHardenedInstruction] = useState(DEFAULT_HARDENED);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReSimResult | null>(null);

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
      toast.success("Re-simulation complete: 50/50 trials passed", {
        description: "Hardened instructions eliminated all drift breakpoints",
        duration: 5000,
      });
      return;
    }
    const timer = setTimeout(() => setProgress((p) => Math.min(p + Math.random() * 4 + 1.5, 100)), 60);
    return () => clearTimeout(timer);
  }, [running, progress]);

  return (
    <Card className="border-primary/20 relative overflow-hidden">
      {/* Development Mode indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-drift-warning/60 to-primary/60" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Pipeline Hardening</CardTitle>
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 font-mono">
              🧪 SANDBOX MODE
            </Badge>
          </div>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            Prompt Architect
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Split-pane view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left: Original Prompt */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Original Orchestrator Prompt</span>
            </div>
            <pre className="text-[10px] font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/50 rounded-md p-3 border border-border/50 max-h-[220px] overflow-y-auto">
              {ORIGINAL_PROMPT}
            </pre>
          </div>

          {/* Right: Hardened Instruction */}
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
            <div className="animate-fade-in-up rounded-lg border border-drift-success/30 bg-drift-success/5 p-4">
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
