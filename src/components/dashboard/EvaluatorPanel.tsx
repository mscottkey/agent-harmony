import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: number;
  agent: string;
  transaction: string;
  faithfulness: number;
  contextualPrecision: number;
  taskCompletion: number;
  timestamp: Date;
}

const AGENTS = ["Salesforce", "Zendesk", "ChurnZero"];
const TRANSACTIONS: Record<string, string[]> = {
  Salesforce: ["Lead Qualification", "Pipeline Routing", "Opportunity Scoring", "Contact Enrichment"],
  Zendesk: ["Ticket Creation", "Priority Escalation", "Macro Application", "SLA Check"],
  ChurnZero: ["Churn Prediction", "Health Scoring", "Segment Analysis", "Retention Alert"],
};

function randomScore(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

function generateTransaction(id: number): Transaction {
  const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  const txns = TRANSACTIONS[agent];
  const transaction = txns[Math.floor(Math.random() * txns.length)];
  const isBad = agent === "ChurnZero" && Math.random() < 0.35;
  return {
    id,
    agent,
    transaction,
    faithfulness: isBad ? randomScore(42, 72) : randomScore(68, 99),
    contextualPrecision: isBad ? randomScore(38, 70) : randomScore(65, 98),
    taskCompletion: isBad ? randomScore(45, 75) : randomScore(70, 100),
    timestamp: new Date(Date.now() - Math.random() * 600000),
  };
}

function scoreColor(score: number) {
  if (score >= 80) return "text-drift-success";
  if (score >= 60) return "text-drift-warning";
  return "text-drift-critical";
}

function verdict(f: number, cp: number, tc: number): { label: string; className: string } {
  if (f >= 70 && cp >= 70 && tc >= 70) return { label: "PASS", className: "bg-drift-success/15 text-drift-success border-drift-success/30" };
  if (f < 60 || cp < 60 || tc < 60) return { label: "FAIL", className: "bg-drift-critical/15 text-drift-critical border-drift-critical/30" };
  return { label: "REVIEW", className: "bg-drift-warning/15 text-drift-warning border-drift-warning/30" };
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function EvaluatorPanel() {
  const [counter, setCounter] = useState(8);
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    Array.from({ length: 8 }, (_, i) => generateTransaction(i))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + 1);
      setTransactions((prev) => {
        const newTx = generateTransaction(counter);
        newTx.timestamp = new Date();
        return [newTx, ...prev.slice(0, 7)];
      });
    }, 4000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [counter]);

  const passRate = Math.round(
    (transactions.filter((t) => verdict(t.faithfulness, t.contextualPrecision, t.taskCompletion).label === "PASS").length / transactions.length) * 100
  );
  const avgFaithfulness = Math.round(transactions.reduce((a, t) => a + t.faithfulness, 0) / transactions.length);
  const flagged = transactions.filter((t) => verdict(t.faithfulness, t.contextualPrecision, t.taskCompletion).label === "REVIEW").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Transaction Evaluator · LLM-as-Judge</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
            <div className={`text-lg font-mono font-bold ${passRate >= 80 ? "text-drift-success" : passRate >= 60 ? "text-drift-warning" : "text-drift-critical"}`}>
              {passRate}%
            </div>
            <div className="text-[9px] text-muted-foreground">Pass Rate</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
            <div className={`text-lg font-mono font-bold ${avgFaithfulness >= 80 ? "text-drift-success" : avgFaithfulness >= 60 ? "text-drift-warning" : "text-drift-critical"}`}>
              {avgFaithfulness}
            </div>
            <div className="text-[9px] text-muted-foreground">Avg Faithfulness</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
            <div className={`text-lg font-mono font-bold ${flagged > 0 ? "text-drift-warning" : "text-foreground"}`}>
              {flagged}
            </div>
            <div className="text-[9px] text-muted-foreground">Flagged Reviews</div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-mono uppercase">
                <th className="text-left py-1.5 px-1">Time</th>
                <th className="text-left py-1.5 px-1">Agent</th>
                <th className="text-left py-1.5 px-1">Transaction</th>
                <th className="text-center py-1.5 px-1">Faith.</th>
                <th className="text-center py-1.5 px-1">Ctx.P</th>
                <th className="text-center py-1.5 px-1">Task</th>
                <th className="text-center py-1.5 px-1">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => {
                const v = verdict(t.faithfulness, t.contextualPrecision, t.taskCompletion);
                return (
                  <tr key={t.id} className={`border-b border-border/50 ${i === 0 ? "animate-fade-in-up" : ""}`}>
                    <td className="py-1.5 px-1 font-mono text-muted-foreground">{timeAgo(t.timestamp)}</td>
                    <td className="py-1.5 px-1 font-medium">{t.agent}</td>
                    <td className="py-1.5 px-1 text-muted-foreground">{t.transaction}</td>
                    <td className={`py-1.5 px-1 text-center font-mono font-semibold ${scoreColor(t.faithfulness)}`}>{t.faithfulness}</td>
                    <td className={`py-1.5 px-1 text-center font-mono font-semibold ${scoreColor(t.contextualPrecision)}`}>{t.contextualPrecision}</td>
                    <td className={`py-1.5 px-1 text-center font-mono font-semibold ${scoreColor(t.taskCompletion)}`}>{t.taskCompletion}</td>
                    <td className="py-1.5 px-1 text-center">
                      <Badge variant="outline" className={`text-[8px] ${v.className}`}>{v.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
