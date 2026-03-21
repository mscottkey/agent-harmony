import AgentDecisionGraph from "@/components/dashboard/AgentDecisionGraph";
import DriftSimulator from "@/components/dashboard/DriftSimulator";
import MCPHub from "@/components/dashboard/MCPHub";
import SafetyGuardrails from "@/components/dashboard/SafetyGuardrails";
import DriftAnalytics from "@/components/dashboard/DriftAnalytics";
import { Badge } from "@/components/ui/badge";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
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
            <Badge variant="outline" className="text-[10px] bg-drift-success/10 text-drift-success border-drift-success/30">
              System Healthy
            </Badge>
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
              O
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Row 1: Decision Graph (2 cols) + Simulator (1 col) */}
          <AgentDecisionGraph />
          <DriftSimulator />

          {/* Row 2: Analytics (2 cols) + MCP Hub (1 col) */}
          <DriftAnalytics />
          <MCPHub />

          {/* Row 3: Safety Guardrails full width */}
          <div className="lg:col-span-3">
            <SafetyGuardrails />
          </div>
        </div>
      </main>
    </div>
  );
}
