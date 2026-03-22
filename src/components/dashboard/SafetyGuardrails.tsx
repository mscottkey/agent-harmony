import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Guardrail {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  type: "rollback" | "escalation" | "verification" | "privacy";
}

const INITIAL: Guardrail[] = [
  { id: "auto-rollback", label: "Autonomous Rollback", description: "Automatically revert agent decisions when drift exceeds threshold", enabled: true, type: "rollback" },
  { id: "hitl", label: "Human-in-the-Loop Gate", description: "Require human approval for cross-platform handoffs", enabled: false, type: "escalation" },
  { id: "semantic-gate", label: "Semantic Verification Gate", description: "On context mismatch, pause execution and require human payload review before forwarding to target agent", enabled: false, type: "verification" },
  { id: "pii-redaction", label: "MCP PII Redaction Layer", description: "Automatically redact personally identifiable information in trace data, payloads, and diagnostic views", enabled: false, type: "privacy" },
  { id: "context-check", label: "Context Integrity Check", description: "Validate MCP payload completeness before handoff", enabled: true, type: "rollback" },
  { id: "escalation-path", label: "Escalation Path Override", description: "Route critical drift events to senior ops team", enabled: false, type: "escalation" },
];

const typeLabels: Record<string, string> = {
  rollback: "🔄 Rollback",
  escalation: "🧑 HITL",
  verification: "🔍 Verification",
  privacy: "🛡️ Privacy",
};

interface SafetyGuardrailsProps {
  onRollbackChange?: (enabled: boolean) => void;
  onSemanticGateChange?: (enabled: boolean) => void;
  onPiiRedactionChange?: (enabled: boolean) => void;
}

export default function SafetyGuardrails({ onRollbackChange, onSemanticGateChange, onPiiRedactionChange }: SafetyGuardrailsProps) {
  const [guardrails, setGuardrails] = useState(INITIAL);

  const toggle = (id: string) => {
    setGuardrails((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g));
      if (id === "auto-rollback") {
        const rollback = updated.find((g) => g.id === "auto-rollback");
        onRollbackChange?.(rollback?.enabled ?? false);
      }
      if (id === "semantic-gate") {
        const gate = updated.find((g) => g.id === "semantic-gate");
        onSemanticGateChange?.(gate?.enabled ?? false);
      }
      if (id === "pii-redaction") {
        const pii = updated.find((g) => g.id === "pii-redaction");
        onPiiRedactionChange?.(pii?.enabled ?? false);
      }
      return updated;
    });
  };

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
          <div
            key={g.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-all ${
              g.enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card"
            } ${g.id === "semantic-gate" && g.enabled ? "border-drift-warning/30 bg-drift-warning/5" : ""}
            ${g.id === "pii-redaction" && g.enabled ? "border-drift-info/30 bg-drift-info/5" : ""}`}
          >
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{g.label}</span>
                <Badge variant="outline" className="text-[9px] border-border">
                  {typeLabels[g.type] || g.type}
                </Badge>
                {g.id === "semantic-gate" && g.enabled && (
                  <Badge variant="outline" className="text-[9px] bg-drift-warning/10 text-drift-warning border-drift-warning/30 animate-pulse">
                    ACTIVE
                  </Badge>
                )}
                {g.id === "pii-redaction" && g.enabled && (
                  <Badge variant="outline" className="text-[9px] bg-drift-info/10 text-drift-info border-drift-info/30">
                    🛡️ SHIELDED
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{g.description}</p>
            </div>
            <Switch checked={g.enabled} onCheckedChange={() => toggle(g.id)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
