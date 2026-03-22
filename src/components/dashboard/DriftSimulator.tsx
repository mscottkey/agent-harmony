import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PERSONAS = [
  { id: "frustrated", label: "Frustrated Customer", risk: "High", icon: "😤" },
  { id: "security", label: "High-Security Risk", risk: "Critical", icon: "🔒" },
  { id: "enterprise", label: "Enterprise Escalation", risk: "Medium", icon: "🏢" },
  { id: "churn", label: "Silent Churner", risk: "High", icon: "👻" },
];

export interface SimResult {
  passed: number;
  failed: number;
  driftPoints: string[];
  avgLatency: number;
}

interface DriftSimulatorProps {
  onSimulationComplete?: (result: SimResult) => void;
}

export default function DriftSimulator({ onSimulationComplete }: DriftSimulatorProps) {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);

  const runSimulation = useCallback(() => {
    setRunning(true);
    setProgress(0);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (progress >= 100) {
      const failed = Math.floor(Math.random() * 5) + 3; // 3-7 failures for realistic results
      const simResult: SimResult = {
        passed: 50 - failed,
        failed,
        driftPoints: ["MCP Handoff → Zendesk", "Retention Trigger", "Churn Risk Check"].slice(0, Math.floor(Math.random() * 3) + 1),
        avgLatency: Math.floor(Math.random() * 200) + 80,
      };
      setResult(simResult);
      setRunning(false);
      onSimulationComplete?.(simResult);
      return;
    }
    // ~3 seconds total: progress increments of ~3.3% every 60ms ≈ 50 steps
    const timer = setTimeout(() => setProgress((p) => Math.min(p + Math.random() * 4 + 1.5, 100)), 60);
    return () => clearTimeout(timer);
  }, [running, progress, onSimulationComplete]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Proactive Drift Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Adversarial Persona</p>
          <div className="grid grid-cols-2 gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => !running && setPersona(p)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-all ${
                  persona.id === p.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                <span>{p.icon}</span>
                <div>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">Risk: {p.risk}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={runSimulation}
          disabled={running}
          className="w-full"
          size="sm"
        >
          {running ? "Running 50x Trials..." : "Run 50x Synthetic Trials"}
        </Button>

        {running && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right">{Math.floor(progress / 2)}/50 trials</p>
          </div>
        )}

        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-drift-success/10 border border-drift-success/20 p-2 text-center">
                <div className="text-lg font-bold text-drift-success">{result.passed}</div>
                <div className="text-[10px] text-muted-foreground">Passed</div>
              </div>
              <div className="rounded-md bg-drift-critical/10 border border-drift-critical/20 p-2 text-center">
                <div className="text-lg font-bold text-drift-critical">{result.failed}</div>
                <div className="text-[10px] text-muted-foreground">Failed</div>
              </div>
              <div className="rounded-md bg-primary/10 border border-primary/20 p-2 text-center">
                <div className="text-lg font-bold text-primary">{result.avgLatency}ms</div>
                <div className="text-[10px] text-muted-foreground">Avg Latency</div>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Drift Breakpoints</p>
              <div className="flex flex-wrap gap-1">
                {result.driftPoints.map((d) => (
                  <Badge key={d} variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
