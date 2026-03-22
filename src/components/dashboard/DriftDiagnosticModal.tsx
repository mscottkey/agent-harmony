import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DriftDiagnosticModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFixApplied?: () => void;
}

export default function DriftDiagnosticModal({ open, onOpenChange, onFixApplied }: DriftDiagnosticModalProps) {
  const [fixApplied, setFixApplied] = useState(false);

  const handleApplyFix = () => {
    setFixApplied(true);
    onFixApplied?.();
    setTimeout(() => onOpenChange(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setFixApplied(false); }}>
      <DialogContent className="max-w-2xl bg-card border-border">
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
            <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-4 gap-3 text-center">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
