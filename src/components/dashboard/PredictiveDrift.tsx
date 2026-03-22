import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PredictiveDriftProps {
  canaryActive?: boolean;
}

export default function PredictiveDrift({ canaryActive }: PredictiveDriftProps) {
  const probability = canaryActive ? 31 : 14;
  const likelihood = canaryActive ? 89 : 72;
  const hours = canaryActive ? 2 : 4;
  const source = canaryActive ? "Salesforce v3.2.0-beta instability" : "ChurnZero latency spikes";

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold">Predictive Analysis</CardTitle>
          <Badge variant="outline" className="text-[9px] bg-drift-info/10 text-drift-info border-drift-info/30 font-mono">
            ML MODEL
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
              <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke={probability > 25 ? "hsl(var(--drift-warning))" : "hsl(var(--drift-success))"}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(probability / 100) * 150.8} 150.8`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold font-mono ${probability > 25 ? "text-drift-warning" : "text-drift-success"}`}>
              {probability}%
            </span>
          </div>
          <div>
            <div className="text-[10px] font-medium">Probability of Future Drift</div>
            <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
              Current variance trends suggest a <span className="text-drift-warning font-medium">{likelihood}% likelihood</span> of handoff failure in the next <span className="text-foreground font-medium">{hours} hours</span> based on current {source}.
            </p>
          </div>
        </div>
        {canaryActive && (
          <div className="rounded-md border border-drift-warning/20 bg-drift-warning/5 px-2.5 py-1.5 animate-fade-in">
            <span className="text-[9px] text-drift-warning font-medium">⚠ Canary deployment detected — elevated drift probability</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
