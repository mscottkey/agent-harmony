import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MentionTextarea, { renderWithMentions } from "./MentionTextarea";

type Severity = "critical" | "warning" | "info" | "resolved";

interface Annotation {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: Date;
}

interface DriftEvent {
  id: string;
  timestamp: Date;
  agent: string;
  severity: Severity;
  title: string;
  description: string;
  traceId: string;
  driftScore: number;
}

const AGENTS = ["All Agents", "Salesforce", "Zendesk", "ChurnZero", "MCP Bridge"] as const;
const SEVERITIES = ["All Severities", "critical", "warning", "info", "resolved"] as const;

const TEAM_MEMBERS = [
  { name: "Sarah Chen", avatar: "SC" },
  { name: "Alex Rivera", avatar: "AR" },
  { name: "Jordan Lee", avatar: "JL" },
  { name: "Priya Patel", avatar: "PP" },
];

function generateEvents(): DriftEvent[] {
  const now = Date.now();
  return [
    { id: "evt-1", timestamp: new Date(now - 2 * 60000), agent: "ChurnZero", severity: "critical", title: "Schema Mismatch — A2A-MCP-v2.0 → v1.0", description: "Field 'sentiment' not recognized in target schema. Escalation payload dropped.", traceId: "TRC-8A4F2B", driftScore: 12 },
    { id: "evt-2", timestamp: new Date(now - 8 * 60000), agent: "MCP Bridge", severity: "warning", title: "Latency Spike — Handoff Timeout", description: "MCP bridge response exceeded 500ms threshold during Salesforce → Zendesk routing.", traceId: "TRC-3C7E91", driftScore: 38 },
    { id: "evt-3", timestamp: new Date(now - 15 * 60000), agent: "Salesforce", severity: "critical", title: "Intent Misclassification", description: "Customer intent 'cancel_subscription' misrouted as 'billing_inquiry'. Churn risk elevated.", traceId: "TRC-5D1A4F", driftScore: 8 },
    { id: "evt-4", timestamp: new Date(now - 22 * 60000), agent: "Zendesk", severity: "info", title: "Ticket Priority Auto-Adjusted", description: "P3 ticket escalated to P1 based on customer sentiment analysis. Agent alignment confirmed.", traceId: "TRC-9B2E7C", driftScore: 72 },
    { id: "evt-5", timestamp: new Date(now - 35 * 60000), agent: "Salesforce", severity: "resolved", title: "Context Integrity Check Passed", description: "Schema validation applied successfully. All fields normalized to A2A-MCP-v1.0.", traceId: "TRC-1F6D3A", driftScore: 94 },
    { id: "evt-6", timestamp: new Date(now - 48 * 60000), agent: "ChurnZero", severity: "warning", title: "Retention Model Confidence Low", description: "Churn prediction confidence dropped below 60% threshold for enterprise accounts.", traceId: "TRC-7E5B2D", driftScore: 31 },
    { id: "evt-7", timestamp: new Date(now - 62 * 60000), agent: "MCP Bridge", severity: "critical", title: "Protocol Version Conflict", description: "Agent handoff failed: source using A2A-MCP-v2.0, target expects v1.0.", traceId: "TRC-4C8A1E", driftScore: 15 },
    { id: "evt-8", timestamp: new Date(now - 90 * 60000), agent: "Zendesk", severity: "resolved", title: "Auto-Rollback Executed", description: "Agent state reverted to last known good configuration after drift detection.", traceId: "TRC-2D9F6B", driftScore: 88 },
    { id: "evt-9", timestamp: new Date(now - 120 * 60000), agent: "Salesforce", severity: "info", title: "Golden Path Deviation Minor", description: "Agent took alternate routing path but achieved correct outcome. Variance within tolerance.", traceId: "TRC-6A3C8D", driftScore: 65 },
    { id: "evt-10", timestamp: new Date(now - 180 * 60000), agent: "ChurnZero", severity: "warning", title: "Payload Size Exceeds Limit", description: "Customer context payload 4.2MB exceeds 2MB soft limit. Truncation applied.", traceId: "TRC-8F1E4A", driftScore: 42 },
  ];
}

const severityConfig: Record<Severity, { color: string; bg: string; border: string }> = {
  critical: { color: "text-drift-critical", bg: "bg-drift-critical/10", border: "border-drift-critical/30" },
  warning: { color: "text-drift-warning", bg: "bg-drift-warning/10", border: "border-drift-warning/30" },
  info: { color: "text-drift-info", bg: "bg-drift-info/10", border: "border-drift-info/30" },
  resolved: { color: "text-drift-success", bg: "bg-drift-success/10", border: "border-drift-success/30" },
};

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEED_ANNOTATIONS: Record<string, Annotation[]> = {
  "evt-1": [
    { id: "ann-1", author: "Sarah Chen", avatar: "SC", text: "This is the same schema mismatch we saw last sprint. Root cause is the v2.0 migration — ChurnZero hasn't updated their adapter.", timestamp: new Date(Date.now() - 90000) },
    { id: "ann-2", author: "Alex Rivera", avatar: "AR", text: "Confirmed. I've flagged this in the hardening pipeline. We should add a pre-flight schema check.", timestamp: new Date(Date.now() - 60000) },
  ],
  "evt-3": [
    { id: "ann-3", author: "Priya Patel", avatar: "PP", text: "Intent classifier accuracy dropped after the last fine-tune. Reverting to checkpoint 47 fixed it in staging.", timestamp: new Date(Date.now() - 600000) },
  ],
};

export default function DriftTimeline() {
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [severityFilter, setSeverityFilter] = useState("All Severities");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>(SEED_ANNOTATIONS);
  const [draftText, setDraftText] = useState("");
  const [currentUser] = useState(TEAM_MEMBERS[0]);
  const events = useMemo(generateEvents, []);

  const filtered = useMemo(() =>
    events.filter(e =>
      (agentFilter === "All Agents" || e.agent === agentFilter) &&
      (severityFilter === "All Severities" || e.severity === severityFilter)
    ), [events, agentFilter, severityFilter]);

  const counts = useMemo(() => ({
    critical: events.filter(e => e.severity === "critical").length,
    warning: events.filter(e => e.severity === "warning").length,
    resolved: events.filter(e => e.severity === "resolved").length,
  }), [events]);

  const totalAnnotations = Object.values(annotations).reduce((sum, arr) => sum + arr.length, 0);

  const handleAddAnnotation = (eventId: string) => {
    if (!draftText.trim()) return;

    // Extract @mentions and notify
    const mentions = draftText.match(/@([\w\s]+?)(?=\s@|\s*$|[.,!?])/g);
    if (mentions) {
      mentions.forEach((m) => {
        const name = m.slice(1).trim();
        const member = TEAM_MEMBERS.find((t) => t.name === name);
        if (member) {
          toast(`🔔 ${member.name} was mentioned`, {
            description: `${currentUser.name} tagged ${member.name} on event ${eventId}`,
          });
        }
      });
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: draftText.trim(),
      timestamp: new Date(),
    };
    setAnnotations(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), newAnnotation],
    }));
    setDraftText("");
  };

  return (
    <Card>
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-sm font-semibold">Drift Event Timeline</CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] bg-drift-critical/10 text-drift-critical border-drift-critical/30">{counts.critical} Critical</Badge>
              <Badge variant="outline" className="text-[9px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">{counts.warning} Warning</Badge>
              <Badge variant="outline" className="text-[9px] bg-drift-success/10 text-drift-success border-drift-success/30">{counts.resolved} Resolved</Badge>
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">💬 {totalAnnotations} Notes</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="h-7 text-[10px] w-[130px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map(a => <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-7 text-[10px] w-[130px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map(s => <SelectItem key={s} value={s} className="text-[10px] capitalize">{s === "All Severities" ? s : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative space-y-0">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No events match the selected filters</div>
          ) : (
            filtered.map((event, i) => {
              const cfg = severityConfig[event.severity];
              const eventAnnotations = annotations[event.id] || [];
              const isExpanded = expandedEvent === event.id;

              return (
                <div key={event.id} className="relative pl-8 pb-4 last:pb-0 group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${cfg.border} ${cfg.bg} z-10 group-hover:scale-125 transition-transform`}>
                    <div className={`absolute inset-1 rounded-full ${event.severity === "critical" ? "bg-drift-critical animate-pulse" : event.severity === "warning" ? "bg-drift-warning" : event.severity === "resolved" ? "bg-drift-success" : "bg-drift-info"}`} />
                  </div>

                  <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 hover:border-primary/30 transition-colors`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{event.title}</span>
                        <Badge variant="outline" className={`text-[9px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {event.severity}
                        </Badge>
                      </div>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{timeAgo(event.timestamp)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{event.description}</p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[9px] font-mono text-muted-foreground">Agent: <span className="text-foreground/80">{event.agent}</span></span>
                        <span className="text-[9px] font-mono text-muted-foreground">Trace: <span className="text-primary">{event.traceId}</span></span>
                        <span className="text-[9px] font-mono text-muted-foreground">Drift Score: <span className={event.driftScore < 30 ? "text-drift-critical" : event.driftScore < 60 ? "text-drift-warning" : "text-drift-success"}>{event.driftScore}/100</span></span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[9px] text-muted-foreground hover:text-foreground gap-1"
                        onClick={() => {
                          setExpandedEvent(isExpanded ? null : event.id);
                          setDraftText("");
                        }}
                      >
                        💬 {eventAnnotations.length > 0 ? eventAnnotations.length : ""}
                        <span>{isExpanded ? "Hide" : "Annotate"}</span>
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
                        {eventAnnotations.map((ann) => (
                          <div key={ann.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0 mt-0.5">
                              {ann.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-semibold text-foreground">{ann.author}</span>
                                <span className="text-[9px] text-muted-foreground">{timeAgo(ann.timestamp)}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">{renderWithMentions(ann.text)}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0 mt-1">
                            {currentUser.avatar}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <MentionTextarea
                              value={draftText}
                              onChange={setDraftText}
                              teamMembers={TEAM_MEMBERS.filter(m => m.name !== currentUser.name)}
                              placeholder="Add a note... Type @ to mention a teammate"
                              className="min-h-[60px] text-[10px] bg-background/50 border-border/50 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                  handleAddAnnotation(event.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-muted-foreground">⌘+Enter to submit</span>
                              <Button
                                size="sm"
                                className="h-6 px-3 text-[9px]"
                                disabled={!draftText.trim()}
                                onClick={() => handleAddAnnotation(event.id)}
                              >
                                Post Note
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}