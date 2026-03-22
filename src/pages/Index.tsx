import { useState, useCallback } from "react";
import AgentDecisionGraph from "@/components/dashboard/AgentDecisionGraph";
import DriftSimulator from "@/components/dashboard/DriftSimulator";
import MCPHub from "@/components/dashboard/MCPHub";
import SafetyGuardrails from "@/components/dashboard/SafetyGuardrails";
import DriftAnalytics from "@/components/dashboard/DriftAnalytics";
import DriftDiagnosticModal from "@/components/dashboard/DriftDiagnosticModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SimResult } from "@/components/dashboard/DriftSimulator";

export default function Index() {
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simulationPeak, setSimulationPeak] = useState<number | null>(null);
  const [autoRollback, setAutoRollback] = useState(true);
  const [rcaModalOpen, setRcaModalOpen] = useState(false);
  const [driftAlert, setDriftAlert] = useState(false);

  const handleSimulationComplete = useCallback((result: SimResult) => {
    setSimResult(result);
    // Add a peak to the variance chart proportional to failures
    const peak = 18 + (result.failed / 50) * 30;
    setSimulationPeak(peak);
    // If there are critical failures, set drift alert
    if (result.failed >= 3) {
      setDriftAlert(true);
    }
  }, []);

  const handleFixApplied = useCallback(() => {
    // Reset drift alert after fix
    setTimeout(() => {
      setDriftAlert(false);
      setSimResult(null);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Simulation Failure Banner */}
      {simResult && simResult.failed > 0 && (
        <div className="bg-drift-critical/10 border-b border-drift-critical/20 px-6 py-2.5 animate-fade-in">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-drift-critical animate-pulse" />
              <span className="text-sm font-medium text-drift-critical">
                {simResult.failed}/50 Trials Failed
              </span>
              <span className="text-xs text-muted-foreground">
                · Critical drift detected in {simResult.driftPoints.length} breakpoint{simResult.driftPoints.length > 1 ? "s" : ""}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-7 border-drift-critical/30 text-drift-critical hover:bg-drift-critical/10"
              onClick={() => setRcaModalOpen(true)}
            >
              Review {simResult.failed} Failure Trajectories →
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">⚡</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Drift Orchestrator</h1>
              <p className="text-[10px] text-muted-foreground font-mono">Multi-Agent Simulation Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">
              2 Drift Events
            </Badge>
            {driftAlert ? (
              <Badge variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30 animate-pulse">
                ⚠ Drift Alert
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-drift-success/10 text-drift-success border-drift-success/30">
                System Healthy
              </Badge>
            )}
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
              O
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
          <div className="lg:col-span-2 lg:row-span-2">
            <AgentDecisionGraph
              autoRollbackEnabled={autoRollback}
              onEscalationClick={() => setRcaModalOpen(true)}
            />
          </div>
          <DriftSimulator onSimulationComplete={handleSimulationComplete} />

          <DriftAnalytics simulationPeak={simulationPeak} />
          <div className="lg:col-span-2">
            <MCPHub />
          </div>

          <div className="lg:col-span-3">
            <SafetyGuardrails onRollbackChange={setAutoRollback} />
          </div>
        </div>
      </main>

      {/* RCA Diagnostic Modal */}
      <DriftDiagnosticModal
        open={rcaModalOpen}
        onOpenChange={setRcaModalOpen}
        onFixApplied={handleFixApplied}
      />
    </div>
  );
}
