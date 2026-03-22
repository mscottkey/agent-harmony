import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface DriftDiagnosticModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFixApplied?: () => void;
  piiRedactionEnabled?: boolean;
}

function redact(value: string): string {
  return `[REDACTED]`;
}

export default function DriftDiagnosticModal({ open, onOpenChange, onFixApplied, piiRedactionEnabled = false }: DriftDiagnosticModalProps) {
  const [fixApplied, setFixApplied] = useState(false);
  const [regressionSaved, setRegressionSaved] = useState(false);

  const handleApplyFix = () => {
    setFixApplied(true);
    onFixApplied?.();
    setTimeout(() => onOpenChange(false), 1500);
  };

  const handleConvertToRegression = () => {
    setRegressionSaved(true);
    toast.success("Trajectory saved to Golden Dataset v2.1", {
      description: "Failed trajectory converted to regression test case · 1 new assertion added to suite",
      duration: 5000,
    });
  };

  const handleExportEvidence = () => {
    const report = `══════════════════════════════════════════════════
  DRIFT ORCHESTRATOR — DECISION EVIDENCE REPORT
  NIST AI 800-1 Compliance Artifact
══════════════════════════════════════════════════

Report ID:       DER-${Date.now().toString(36).toUpperCase()}
Generated:       ${new Date().toISOString()}
Classification:  CRITICAL DRIFT EVENT
Compliance Ref:  NIST AI 800-1 §4.3 — Autonomous Decision Traceability

──────────────────────────────────────────────────
1. IDENTITY MANIFEST (A2A Agent Card)
──────────────────────────────────────────────────
Agent Name:      ChurnZero
Agent Version:   v1.8.1
Protocol:        A2A-MCP-v1.0
Role:            Retention & Churn Prevention Agent
Status:          DEGRADED — Schema Mismatch
Latency (avg):   156ms
Success Rate:    91.4%

──────────────────────────────────────────────────
2. TRACE DATA
──────────────────────────────────────────────────
Trace ID:        TRC-${Math.random().toString(36).substring(2, 10).toUpperCase()}
Span ID:         SPN-${Math.random().toString(36).substring(2, 10).toUpperCase()}
Parent Span:     SPN-MCP-HANDOFF-4A2B

Source Agent:     Salesforce Agent (v3.1.0)
Target Agent:     ChurnZero Agent (v1.8.1)
Handoff Protocol: MCP Bridge (A2A-MCP-v2.0 → v1.0)

Intent Payload (Salesforce):
{
  "action": "escalate_to_human",
  "customer_id": "ENT-8847",
  "context": {
    "churn_score": 0.89,
    "tier": "enterprise",
    "ltv": "$284,000",
    "open_tickets": 3,
    "sentiment": "frustrated"
  },
  "priority": "P1",
  "routing": "senior_ops"
}

Error Response (ChurnZero):
{
  "status": "FAILED",
  "error": "UNRECOGNIZED_FIELD",
  "details": {
    "field": "context.sentiment",
    "message": "Field 'sentiment' not in A2A schema v1.0",
    "expected_schema": "A2A-MCP-v1.0",
    "received_schema": "A2A-MCP-v2.0"
  },
  "fallback": "generic_template",
  "escalation": null
}

──────────────────────────────────────────────────
3. ROOT CAUSE ANALYSIS
──────────────────────────────────────────────────
Failure Mode:    Semantic Mismatch — Schema Version Incompatibility
Root Cause:      Salesforce Agent transmitting v2.0 schema fields to
                 ChurnZero Agent expecting v1.0 schema
Impact:          Customer escalation dropped — no context attached
Drift Score:     12/100 (CRITICAL — below 50 threshold)

──────────────────────────────────────────────────
4. REMEDIATION APPLIED
──────────────────────────────────────────────────
Action:          Context Integrity Check added to Salesforce Handoff
Description:     Schema validation layer normalizes payload to
                 A2A-MCP-v1.0 before MCP transmission
Status:          APPLIED
Timestamp:       ${new Date().toISOString()}

══════════════════════════════════════════════════
  END OF REPORT — Retain for audit period (7 years)
══════════════════════════════════════════════════`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drift-evidence-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Decision Evidence Report exported", {
      description: "NIST AI 800-1 compliant audit artifact generated",
      duration: 4000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setFixApplied(false); setRegressionSaved(false); } }}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Drift Diagnostic · Root Cause Analysis</span>
            <Badge variant="outline" className="bg-drift-critical/15 text-drift-critical border-drift-critical/30 text-[10px]">
              CRITICAL
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Trace Data */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Trace Data · Payload Comparison</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-drift-success/20 bg-drift-success/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-drift-success" />
                  <span className="text-[10px] font-mono text-drift-success uppercase">Intent Payload · Salesforce Agent</span>
                </div>
                <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
{`{
  "action": "escalate_to_human",
  "customer_id": "ENT-8847",
  "context": {
    "churn_score": 0.89,
    "tier": "enterprise",
    "ltv": "$284,000",
    "open_tickets": 3,
    "sentiment": "frustrated"
  },
  "priority": "P1",
  "routing": "senior_ops"
}`}
                </pre>
              </div>
              <div className="rounded-lg border border-drift-critical/20 bg-drift-critical/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-drift-critical" />
                  <span className="text-[10px] font-mono text-drift-critical uppercase">Error Response · ChurnZero Agent</span>
                </div>
                <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
{`{
  "status": "FAILED",
  "error": "UNRECOGNIZED_FIELD",
  "details": {
    "field": "context.sentiment",
    "message": "Field 'sentiment' is not 
      in A2A schema v1.0",
    "expected_schema": "A2A-MCP-v1.0",
    "received_schema": "A2A-MCP-v2.0"
  },
  "fallback": "generic_template",
  "escalation": null
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* A2A Agent Card */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">A2A Agent Card · Failing Agent</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="text-sm font-semibold">ChurnZero</div>
                    <div className="text-[10px] text-muted-foreground font-mono">Retention & Churn Prevention Agent</div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-drift-critical/15 text-drift-critical border-drift-critical/30 text-[10px]">
                  Schema Mismatch
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-md bg-card border border-border p-2">
                  <div className="text-xs font-mono font-semibold">v1.8.1</div>
                  <div className="text-[9px] text-muted-foreground">Version</div>
                </div>
                <div className="rounded-md bg-card border border-border p-2">
                  <div className="text-xs font-mono font-semibold text-drift-warning">A2A-MCP-v1.0</div>
                  <div className="text-[9px] text-muted-foreground">Protocol</div>
                </div>
                <div className="rounded-md bg-card border border-border p-2">
                  <div className="text-xs font-mono font-semibold text-drift-critical">156ms</div>
                  <div className="text-[9px] text-muted-foreground">Latency</div>
                </div>
                <div className="rounded-md bg-card border border-border p-2">
                  <div className="text-xs font-mono font-semibold text-drift-critical">91.4%</div>
                  <div className="text-[9px] text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Remediation */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Suggested Remediation</p>
            <div className={`rounded-lg border p-4 transition-all duration-500 ${fixApplied ? "border-drift-success/30 bg-drift-success/5" : "border-drift-warning/30 bg-drift-warning/5"}`}>
              {fixApplied ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="text-sm font-semibold text-drift-success">Context Integrity Check Applied</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      A schema validation layer has been added to the Salesforce → ChurnZero handoff. 
                      Fields will be normalized to A2A-MCP-v1.0 before transmission.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <span className="text-sm font-semibold">Add Context Integrity Check to Salesforce Handoff</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                    The Salesforce Agent is sending A2A-MCP-v2.0 schema fields (including <code className="text-primary bg-primary/10 px-1 rounded">sentiment</code>) 
                    to ChurnZero, which only supports v1.0. Adding a Context Integrity Check will validate and transform the payload 
                    to prevent future semantic mismatches at the MCP handoff boundary.
                  </p>
                  <Button onClick={handleApplyFix} size="sm" className="w-full">
                    ⚡ One-Click Fix: Add Context Integrity Check
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Regression Suite & Export Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 text-[10px] h-8 transition-all ${regressionSaved ? "border-drift-success/30 text-drift-success bg-drift-success/5" : "border-border"}`}
              onClick={handleConvertToRegression}
              disabled={regressionSaved}
            >
              {regressionSaved ? "✓ Saved to Golden Dataset v2.1" : "🧪 Convert to Regression Test Case"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[10px] h-8 border-border"
              onClick={handleExportEvidence}
            >
              📋 Export Decision Evidence (NIST AI 800-1)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
