import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Brain, FileJson } from "lucide-react";
import { toast } from "sonner";

interface AgentPolicy {
  agent: string;
  icon: string;
  version: string;
  policy: string;
  policyJson: string | null;
  analyzing: boolean;
  analyzed: boolean;
}

const INITIAL_AGENTS: AgentPolicy[] = [
  {
    agent: "Salesforce",
    icon: "☁️",
    version: "v3.1.0",
    policy: "",
    policyJson: null,
    analyzing: false,
    analyzed: false,
  },
  {
    agent: "Zendesk",
    icon: "🎧",
    version: "v2.4.2",
    policy: "",
    policyJson: null,
    analyzing: false,
    analyzed: false,
  },
  {
    agent: "ChurnZero",
    icon: "📊",
    version: "v1.8.1",
    policy: "",
    policyJson: null,
    analyzing: false,
    analyzed: false,
  },
];

const SAMPLE_POLICIES: Record<string, string> = {
  Salesforce:
    "Only hand off to Zendesk if lead sentiment is negative; otherwise, route to ChurnZero for retention analysis. Never expose billing data in handoff payloads.",
  Zendesk:
    "Create P1 tickets for enterprise-tier customers with churn risk > 0.7. Never modify billing fields. Escalate to senior ops if ticket unresolved for > 4 hours.",
  ChurnZero:
    "Monitor health scores passively. Never contact customers directly. Trigger retention playbooks only when churn probability exceeds 0.65 and CSM approval is obtained.",
};

const GENERATED_JSON: Record<string, object> = {
  Salesforce: {
    agent_id: "salesforce-v3.1.0",
    mission: "Lead Qualification & Pipeline Routing",
    policies: [
      {
        rule: "sentiment_gate",
        condition: "lead.sentiment === 'negative'",
        action: "handoff_to_zendesk",
        fallback: "route_to_churnzero",
      },
      {
        rule: "data_boundary",
        constraint: "exclude_fields",
        fields: ["billing_account", "payment_method", "invoice_history"],
      },
    ],
    permitted_tools: ["lead.score", "lead.qualify", "opportunity.create", "pipeline.route"],
    forbidden_actions: ["billing.modify", "payment.process"],
  },
  Zendesk: {
    agent_id: "zendesk-v2.4.2",
    mission: "Service Recovery & Ticket Resolution",
    policies: [
      {
        rule: "priority_escalation",
        condition: "customer.tier === 'enterprise' && churn_risk > 0.7",
        action: "create_p1_ticket",
      },
      {
        rule: "billing_lockout",
        constraint: "read_only",
        fields: ["billing_*"],
      },
      {
        rule: "sla_escalation",
        condition: "ticket.age_hours > 4 && !ticket.resolved",
        action: "escalate_to_senior_ops",
      },
    ],
    permitted_tools: ["ticket.create", "ticket.escalate", "ticket.resolve", "macro.apply"],
    forbidden_actions: ["billing.modify", "customer.delete"],
  },
  ChurnZero: {
    agent_id: "churnzero-v1.8.1",
    mission: "Retention Intelligence & Passive Monitoring",
    policies: [
      {
        rule: "passive_only",
        constraint: "no_direct_contact",
        description: "Agent may not send communications to end customers",
      },
      {
        rule: "retention_trigger",
        condition: "churn_probability > 0.65 && csm_approval === true",
        action: "execute_retention_playbook",
      },
    ],
    permitted_tools: ["churn.predict", "health.score", "segment.analyze", "alert.trigger"],
    forbidden_actions: ["customer.contact", "email.send", "billing.modify"],
  },
};

interface IntentStudioProps {
  onPoliciesUpdate?: (policies: Record<string, string>) => void;
}

export default function IntentStudio({ onPoliciesUpdate }: IntentStudioProps) {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [showJson, setShowJson] = useState<string | null>(null);

  const updatePolicy = (agent: string, policy: string) => {
    setAgents((prev) => prev.map((a) => (a.agent === agent ? { ...a, policy } : a)));
  };

  const loadSample = (agent: string) => {
    updatePolicy(agent, SAMPLE_POLICIES[agent] || "");
  };

  const analyzePolicy = (agent: string) => {
    setAgents((prev) => prev.map((a) => (a.agent === agent ? { ...a, analyzing: true } : a)));

    // Simulate Discovery Agent parsing
    setTimeout(() => {
      const json = JSON.stringify(GENERATED_JSON[agent] || {}, null, 2);
      setAgents((prev) =>
        prev.map((a) =>
          a.agent === agent ? { ...a, analyzing: false, analyzed: true, policyJson: json } : a
        )
      );

      // Notify parent about policy update
      const currentPolicies: Record<string, string> = {};
      agents.forEach((a) => {
        if (a.agent === agent) {
          currentPolicies[a.agent] = SAMPLE_POLICIES[agent] || a.policy;
        } else if (a.analyzed) {
          currentPolicies[a.agent] = a.policy;
        }
      });
      onPoliciesUpdate?.(currentPolicies);

      toast.success(`Policy analyzed for ${agent}`, {
        description: "Mission constraints appended to Agent Card",
        duration: 3000,
      });
    }, 2500);
  };

  const analyzedCount = agents.filter((a) => a.analyzed).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-primary" />
          <div>
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Semantic Intent Studio</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Define mission policies in plain English. The Discovery Agent will parse them into enforceable protocol constraints.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${
            analyzedCount === 3
              ? "bg-drift-success/10 text-drift-success border-drift-success/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {analyzedCount}/3 Policies Locked
        </Badge>
      </div>

      {/* Agent Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card
            key={agent.agent}
            className={`transition-all duration-500 ${
              agent.analyzed
                ? "border-drift-success/30"
                : agent.analyzing
                ? "border-primary/30"
                : "border-border"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div>
                    <CardTitle className="text-sm font-semibold">{agent.agent}</CardTitle>
                    <span className="text-[10px] text-muted-foreground font-mono">{agent.version}</span>
                  </div>
                </div>
                {agent.analyzed ? (
                  <Badge variant="outline" className="text-[9px] bg-drift-success/10 text-drift-success border-drift-success/30">
                    <CheckCircle className="w-3 h-3 mr-1" /> Locked
                  </Badge>
                ) : agent.analyzing ? (
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border">
                    Draft
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                    Mission Policy
                  </label>
                  <button
                    onClick={() => loadSample(agent.agent)}
                    className="text-[9px] text-primary hover:text-primary/80 font-mono transition-colors"
                  >
                    Load Example
                  </button>
                </div>
                <Textarea
                  placeholder={`Define constraints for ${agent.agent} in plain English...`}
                  value={agent.policy}
                  onChange={(e) => updatePolicy(agent.agent, e.target.value)}
                  className="text-xs min-h-[100px] resize-none bg-muted/30 border-border font-mono text-[11px] leading-relaxed"
                  disabled={agent.analyzing || agent.analyzed}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-[10px] h-8 gap-1.5"
                  onClick={() => analyzePolicy(agent.agent)}
                  disabled={!agent.policy.trim() || agent.analyzing || agent.analyzed}
                >
                  {agent.analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Parsing Intent...
                    </>
                  ) : (
                    <>
                      <Brain className="w-3 h-3" />
                      Analyze Policy
                    </>
                  )}
                </Button>
                {agent.analyzed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-8 gap-1.5"
                    onClick={() => setShowJson(showJson === agent.agent ? null : agent.agent)}
                  >
                    <FileJson className="w-3 h-3" />
                    {showJson === agent.agent ? "Hide" : "View"} JSON
                  </Button>
                )}
              </div>

              {/* Analyzing Animation */}
              {agent.analyzing && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-[10px] text-primary font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Discovery Agent parsing natural language...
                  </div>
                  <div className="space-y-1">
                    {["Extracting semantic constraints...", "Mapping tool permissions...", "Generating Policy JSON..."].map(
                      (step, i) => (
                        <div
                          key={i}
                          className="text-[9px] text-muted-foreground font-mono animate-fade-in"
                          style={{ animationDelay: `${i * 600}ms` }}
                        >
                          → {step}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Policy JSON */}
              {showJson === agent.agent && agent.policyJson && (
                <div className="rounded-md border border-drift-success/20 bg-drift-success/5 p-3 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <FileJson className="w-3 h-3 text-drift-success" />
                    <span className="text-[9px] font-mono text-drift-success uppercase">Generated Agent Card Extension</span>
                  </div>
                  <pre className="text-[9px] font-mono text-foreground/80 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed">
                    {agent.policyJson}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {analyzedCount === 3 && (
        <div className="rounded-lg border border-drift-success/30 bg-drift-success/5 p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-drift-success" />
            <div>
              <div className="text-sm font-medium text-drift-success">All Mission Policies Locked</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Intent constraints are now enforced on the Decision Graph. Goal Alignment meters are active on all handoff lines.
                Semantic Drift alerts will trigger when alignment drops below 70%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
