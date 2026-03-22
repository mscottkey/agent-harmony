import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DriftDiagnosticModal from "./DriftDiagnosticModal";

interface AuditRecord {
  id: string;
  timestamp: Date;
  failingAgent: string;
  rootCause: string;
  remediationStatus: "applied" | "pending" | "rejected";
  traceId: string;
  driftScore: number;
  complianceRef: string;
}

const AUDIT_RECORDS: AuditRecord[] = [
  { id: "AR-001", timestamp: new Date(Date.now() - 2 * 3600000), failingAgent: "ChurnZero", rootCause: "Semantic Mismatch — Schema v2.0→v1.0", remediationStatus: "applied", traceId: "TRC-8A4F2B", driftScore: 12, complianceRef: "NIST AI 800-1 §4.3" },
  { id: "AR-002", timestamp: new Date(Date.now() - 8 * 3600000), failingAgent: "MCP Bridge", rootCause: "Handoff Timeout — Latency Spike", remediationStatus: "applied", traceId: "TRC-3C7E91", driftScore: 38, complianceRef: "NIST AI 800-1 §4.1" },
  { id: "AR-003", timestamp: new Date(Date.now() - 24 * 3600000), failingAgent: "Salesforce", rootCause: "Intent Misclassification — cancel→billing", remediationStatus: "pending", traceId: "TRC-5D1A4F", driftScore: 8, complianceRef: "NIST AI 800-1 §4.3" },
  { id: "AR-004", timestamp: new Date(Date.now() - 48 * 3600000), failingAgent: "ChurnZero", rootCause: "Retention Model Confidence Below Threshold", remediationStatus: "applied", traceId: "TRC-7E5B2D", driftScore: 31, complianceRef: "NIST AI 800-1 §4.2" },
  { id: "AR-005", timestamp: new Date(Date.now() - 72 * 3600000), failingAgent: "MCP Bridge", rootCause: "Protocol Version Conflict — A2A v2→v1", remediationStatus: "pending", traceId: "TRC-4C8A1E", driftScore: 15, complianceRef: "NIST AI 800-1 §4.3" },
  { id: "AR-006", timestamp: new Date(Date.now() - 120 * 3600000), failingAgent: "Zendesk", rootCause: "Ticket Priority Override — Unauthorized", remediationStatus: "rejected", traceId: "TRC-9F2A3B", driftScore: 22, complianceRef: "NIST AI 800-1 §4.4" },
  { id: "AR-007", timestamp: new Date(Date.now() - 168 * 3600000), failingAgent: "Salesforce", rootCause: "Payload Truncation — Context Lost", remediationStatus: "applied", traceId: "TRC-6B8D1C", driftScore: 41, complianceRef: "NIST AI 800-1 §4.1" },
];

const statusStyles: Record<string, { badge: string; label: string }> = {
  applied: { badge: "bg-drift-success/10 text-drift-success border-drift-success/30", label: "Applied" },
  pending: { badge: "bg-drift-warning/10 text-drift-warning border-drift-warning/30", label: "Pending" },
  rejected: { badge: "bg-drift-critical/10 text-drift-critical border-drift-critical/30", label: "Rejected" },
};

export default function GovernanceVault() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterAgent, setFilterAgent] = useState("all");

  const filtered = filterAgent === "all" ? AUDIT_RECORDS : AUDIT_RECORDS.filter((r) => r.failingAgent === filterAgent);
  const agents = [...new Set(AUDIT_RECORDS.map((r) => r.failingAgent))];

  const counts = {
    total: AUDIT_RECORDS.length,
    applied: AUDIT_RECORDS.filter((r) => r.remediationStatus === "applied").length,
    pending: AUDIT_RECORDS.filter((r) => r.remediationStatus === "pending").length,
  };

  return (
    <>
      {/* Vault Header */}
      <div className="rounded-lg border border-border bg-card p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏛️</span>
              <h2 className="text-sm font-semibold">NIST AI 800-1 Compliance Vault</h2>
              <Badge variant="outline" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/30">
                REGULATORY
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Decision evidence repository · All autonomous agent actions logged for audit retention (7 years)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[9px] bg-secondary text-foreground border-border font-mono">
              {counts.total} Records
            </Badge>
            <Badge variant="outline" className="text-[9px] bg-drift-success/10 text-drift-success border-drift-success/30">
              {counts.applied} Remediated
            </Badge>
            <Badge variant="outline" className="text-[9px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">
              {counts.pending} Pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Agent Filter Chips */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] text-muted-foreground font-mono uppercase">Filter:</span>
        <button
          onClick={() => setFilterAgent("all")}
          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
            filterAgent === "all" ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          All
        </button>
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => setFilterAgent(agent)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
              filterAgent === agent ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {agent}
          </button>
        ))}
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Decision Evidence Reports</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Report ID</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Failing Agent</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Root Cause</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Drift Score</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2 font-mono text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => {
                  const status = statusStyles[record.remediationStatus];
                  return (
                    <tr key={record.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-2.5 font-mono text-primary">{record.id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {record.timestamp.toLocaleDateString()} {record.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{record.failingAgent}</td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">{record.rootCause}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono font-medium ${record.driftScore < 30 ? "text-drift-critical" : record.driftScore < 60 ? "text-drift-warning" : "text-drift-success"}`}>
                          {record.driftScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={`text-[9px] ${status.badge}`}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Button variant="outline" size="sm" className="text-[9px] h-6 px-2 border-border" onClick={() => setModalOpen(true)}>
                          View Artifact
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-mono">
              Showing {filtered.length} of {AUDIT_RECORDS.length} records · Retention: 7 years · {AUDIT_RECORDS[0]?.complianceRef}
            </span>
          </div>
        </CardContent>
      </Card>

      <DriftDiagnosticModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
