import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Clock, Zap } from "lucide-react";

const SPARKLINE_DATA = [82, 76, 71, 68, 59, 54, 48, 42, 38, 35, 31, 28];

export default function OrchestrationROI() {
  const [animatedMTTR, setAnimatedMTTR] = useState(0);
  const [animatedToil, setAnimatedToil] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimatedMTTR(62), 300);
    const t2 = setTimeout(() => setAnimatedToil(14.2), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const maxVal = Math.max(...SPARKLINE_DATA);
  const minVal = Math.min(...SPARKLINE_DATA);
  const range = maxVal - minVal || 1;
  const h = 40;
  const w = 160;
  const points = SPARKLINE_DATA.map((v, i) => {
    const x = (i / (SPARKLINE_DATA.length - 1)) * w;
    const y = h - ((v - minVal) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Orchestration ROI</CardTitle>
            <Badge variant="outline" className="text-[9px] bg-drift-success/10 text-drift-success border-drift-success/30">
              IMPROVING
            </Badge>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">This week</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-drift-success/20 bg-drift-success/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-drift-success" />
              <span className="text-[9px] font-mono text-muted-foreground uppercase">MTTR Reduction</span>
            </div>
            <div className="text-xl font-bold text-drift-success">-{animatedMTTR}%</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">vs. manual remediation baseline</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Toil Savings</span>
            </div>
            <div className="text-xl font-bold text-primary">{animatedToil}h</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">engineering hours saved this week</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-drift-success" />
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Projected Cost Savings</span>
            </div>
            <Badge variant="outline" className="text-[9px] bg-drift-success/10 text-drift-success border-drift-success/30">
              ↓ Token Waste
            </Badge>
          </div>
          <div className="flex items-end gap-3">
            <svg width={w} height={h} className="shrink-0">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 60%, 48%)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(152, 60%, 48%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,${h} ${points} ${w},${h}`}
                fill="url(#sparkGrad)"
              />
              <polyline
                points={points}
                fill="none"
                stroke="hsl(152, 60%, 48%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-right">
              <div className="text-sm font-bold text-drift-success">$4,280</div>
              <p className="text-[9px] text-muted-foreground">saved from reduced<br />infinite loop tokens</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
