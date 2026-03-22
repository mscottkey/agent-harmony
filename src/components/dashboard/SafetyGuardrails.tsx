import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface Guardrail {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  type: "rollback" | "escalation" | "verification" | "privacy" | "intent" | "termination";
}

const INITIAL: Guardrail[] = [
  { id: "auto-rollback", label: "Autonomous Rollback", description: "Automatically revert agent decisions when drift exceeds threshold", enabled: true, type: "rollback" },
  { id: "hitl", label: "Human-in-the-Loop Gate", description: "Require human approval for cross-platform handoffs", enabled: false, type: "escalation" },
  { id: "semantic-gate", label: "Semantic Verification Gate", description: "On context mismatch, pause execution and require human payload review before forwarding to target agent", enabled: false, type: "verification" },
  { id: "pii-redaction", label: "MCP PII Redaction Layer", description: "Automatically redact personally identifiable information in trace data, payloads, and diagnostic views", enabled: false, type: "privacy" },
  { id: "intent-lock", label: "Semantic Intent Locking", description: "Auto-block any agent action not identified during Discovery Scan. Unauthorized actions are flagged and prevented.", enabled: false, type: "intent" },
  { id: "kill-switch", label: "Emergency Kill Switch", description: "Immediately halt all agent execution when system-wide drift score drops below configurable threshold. Triggers full workflow cessation to prevent cascading failures.", enabled: false, type: "termination" },
  { id: "context-check", label: "Context Integrity Check", description: "Validate MCP payload completeness before handoff", enabled: true, type: "rollback" },
  { id: "escalation-path", label: "Escalation Path Override", description: "Route critical drift events to senior ops team", enabled: false, type: "escalation" },
];

const typeLabels: Record<string, string> = {
  rollback: "🔄 Rollback",
  escalation: "🧑 HITL",
  verification: "🔍 Verification",
  privacy: "🛡️ Privacy",
  intent: "🔐 Zero-Trust",
  termination: "🛑 Kill Switch",
};

interface SafetyGuardrailsProps {
  onRollbackChange?: (enabled: boolean) => void;
  onSemanticGateChange?: (enabled: boolean) => void;
  onPiiRedactionChange?: (enabled: boolean) => void;
  onIntentLockChange?: (enabled: boolean) => void;
  onKillSwitchChange?: (enabled: boolean) => void;
  onKillThresholdChange?: (threshold: number) => void;
}

export default function SafetyGuardrails({ onRollbackChange, onSemanticGateChange, onPiiRedactionChange, onIntentLockChange, onKillSwitchChange, onKillThresholdChange }: SafetyGuardrailsProps) {
  const [guardrails, setGuardrails] = useState(INITIAL);
  const [killThreshold, setKillThreshold] = useState(25);

  const toggle = (id: string) => {
    setGuardrails((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g));
      const find = (gid: string) => updated.find((g) => g.id === gid);
      if (id === "auto-rollback") onRollbackChange?.(find("auto-rollback")?.enabled ?? false);
      if (id === "semantic-gate") onSemanticGateChange?.(find("semantic-gate")?.enabled ?? false);
      if (id === "pii-redaction") onPiiRedactionChange?.(find("pii-redaction")?.enabled ?? false);
      if (id === "intent-lock") onIntentLockChange?.(find("intent-lock")?.enabled ?? false);
      if (id === "kill-switch") onKillSwitchChange?.(find("kill-switch")?.enabled ?? false);
      return updated;
    });
  };

  const killSwitchEnabled = guardrails.find((g) => g.id === "kill-switch")?.enabled ?? false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Safety Guardrails</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-drift-success/10 text-drift-success border-drift-success/30">
            {guardrails.filter((g) => g.enabled).length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {guardrails.map((g) => (
          <div key={g.id}>
            <div
              className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-all ${
                g.enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card"
              } ${g.id === "semantic-gate" && g.enabled ? "border-drift-warning/30 bg-drift-warning/5" : ""}
              ${g.id === "pii-redaction" && g.enabled ? "border-drift-info/30 bg-drift-info/5" : ""}
              ${g.id === "intent-lock" && g.enabled ? "border-primary/30 bg-primary/5" : ""}
              ${g.id === "kill-switch" && g.enabled ? "border-drift-critical/30 bg-drift-critical/5" : ""}`}
            >
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{g.label}</span>
                  <Badge variant="outline" className="text-[9px] border-border">
                    {typeLabels[g.type] || g.type}
                  </Badge>
                  {g.id === "semantic-gate" && g.enabled && (
                    <Badge variant="outline" className="text-[9px] bg-drift-warning/10 text-drift-warning border-drift-warning/30 animate-pulse">ACTIVE</Badge>
                  )}
                  {g.id === "pii-redaction" && g.enabled && (
                    <Badge variant="outline" className="text-[9px] bg-drift-info/10 text-drift-info border-drift-info/30">🛡️ SHIELDED</Badge>
                  )}
                  {g.id === "intent-lock" && g.enabled && (
                    <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 animate-pulse">🔐 ENFORCING</Badge>
                  )}
                  {g.id === "kill-switch" && g.enabled && (
                    <Badge variant="outline" className="text-[9px] bg-drift-critical/10 text-drift-critical border-drift-critical/30 animate-pulse">🛑 ARMED</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{g.description}</p>
              </div>
              <Switch checked={g.enabled} onCheckedChange={() => toggle(g.id)} />
            </div>
            {/* Kill Switch Threshold Slider */}
            {g.id === "kill-switch" && killSwitchEnabled && (
              <div className="mt-2 ml-3 mr-3 p-3 rounded-lg border border-drift-critical/20 bg-drift-critical/5 space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-drift-critical uppercase tracking-wider">Termination Threshold</span>
                  <span className="text-xs font-mono font-bold text-drift-critical">{killThreshold}</span>
                </div>
                <Slider
                  value={[killThreshold]}
                  onValueChange={([v]) => {
                    setKillThreshold(v);
                    onKillThresholdChange?.(v);
                  }}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-[9px] text-muted-foreground">
                  System halts when average drift score across all nodes falls below {killThreshold}. Once triggered, requires manual reset.
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
