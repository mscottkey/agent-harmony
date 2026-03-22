import { useState, useCallback } from "react";
import AgentDecisionGraph from "@/components/dashboard/AgentDecisionGraph";
import DriftSimulator from "@/components/dashboard/DriftSimulator";
import MCPHub from "@/components/dashboard/MCPHub";
import SafetyGuardrails from "@/components/dashboard/SafetyGuardrails";
import DriftAnalytics from "@/components/dashboard/DriftAnalytics";
import DriftDiagnosticModal from "@/components/dashboard/DriftDiagnosticModal";
import DriftTimeline from "@/components/dashboard/DriftTimeline";
import PipelineHardening from "@/components/dashboard/PipelineHardening";
import GovernanceVault from "@/components/dashboard/GovernanceVault";
import PredictiveDrift from "@/components/dashboard/PredictiveDrift";
import OrchestrationROI from "@/components/dashboard/OrchestrationROI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle } from "lucide-react";
import type { SimResult } from "@/components/dashboard/DriftSimulator";

type ViewMode = "monitoring" | "hardening" | "vault";

export default function Index() {
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simulationPeak, setSimulationPeak] = useState<number | null>(null);
  const [autoRollback, setAutoRollback] = useState(true);
  const [semanticGate, setSemanticGate] = useState(false);
  const [piiRedaction, setPiiRedaction] = useState(false);
  const [rcaModalOpen, setRcaModalOpen] = useState(false);
  const [driftAlert, setDriftAlert] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("monitoring");
  const [canaryActive, setCanaryActive] = useState(false);

  const handleSimulationComplete = useCallback((result: SimResult) => {
    setSimResult(result);
    const peak = 18 + (result.failed / 50) * 30;
    setSimulationPeak(peak);
    if (result.failed >= 3) {
      setDriftAlert(true);
    }
  }, []);

  const handleFixApplied = useCallback(() => {
    setTimeout(() => {
      setDriftAlert(false);
      setSimResult(null);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simulation Failure Banner */}
      {simResult && simResult.failed > 0 && (
        <div className="bg-drift-critical/10 border-b border-drift-critical/20 px-4 sm:px-6 py-2.5 animate-fade-in">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-drift-critical animate-pulse" />
              <span className="text-sm font-medium text-drift-critical">
                {simResult.failed}/50 Trials Failed
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
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
      <header className="border-b border-border px-4 sm:px-6 py-4">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30 hidden sm:inline-flex">
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

      {/* View Mode Tabs */}
      <div className="border-b border-border px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setViewMode("monitoring")}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
              viewMode === "monitoring"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            📡 Monitoring
          </button>
          <button
            onClick={() => setViewMode("hardening")}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              viewMode === "hardening"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🛡️ Pipeline Hardening
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              DEV
            </span>
          </button>
          <button
            onClick={() => setViewMode("vault")}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              viewMode === "vault"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🏛️ Audit Vault
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-drift-warning/10 text-drift-warning border border-drift-warning/20">
              NIST
            </span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 flex-1">
        {viewMode === "monitoring" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
            <div className="lg:col-span-2 lg:row-span-2">
              <AgentDecisionGraph
                autoRollbackEnabled={autoRollback}
                semanticGateEnabled={semanticGate}
                onEscalationClick={() => setRcaModalOpen(true)}
              />
            </div>
            <DriftSimulator onSimulationComplete={handleSimulationComplete} />

            <PredictiveDrift canaryActive={canaryActive} />
            <DriftAnalytics simulationPeak={simulationPeak} canaryActive={canaryActive} />
            <div className="lg:col-span-2">
              <MCPHub onCanaryChange={setCanaryActive} />
            </div>

            <OrchestrationROI />

            <div className="lg:col-span-3">
              <DriftTimeline />
            </div>
            <div className="lg:col-span-3">
              <SafetyGuardrails
                onRollbackChange={setAutoRollback}
                onSemanticGateChange={setSemanticGate}
                onPiiRedactionChange={setPiiRedaction}
              />
            </div>
          </div>
        ) : viewMode === "hardening" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider">🧪 Safe-to-Try Sandbox</span>
              <span className="text-[10px] text-muted-foreground">Changes are isolated from production · No live agents affected</span>
            </div>
            <PipelineHardening />
            <div className="lg:col-span-3">
              <SafetyGuardrails
                onRollbackChange={setAutoRollback}
                onSemanticGateChange={setSemanticGate}
                onPiiRedactionChange={setPiiRedaction}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <GovernanceVault />
          </div>
        )}
      </main>

      {/* Compliance Certified Footer */}
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
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-drift-info" />
            <span className="text-[9px] text-muted-foreground">Governed & safe for production data</span>
            <Badge variant="outline" className="text-[8px] bg-drift-success/10 text-drift-success border-drift-success/20">
              PRODUCTION
            </Badge>
          </div>
        </div>
      </footer>

      {/* RCA Diagnostic Modal */}
      <DriftDiagnosticModal
        open={rcaModalOpen}
        onOpenChange={setRcaModalOpen}
        onFixApplied={handleFixApplied}
        piiRedactionEnabled={piiRedaction}
      />
    </div>
  );
}
