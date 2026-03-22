import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DIMENSIONS = [
  "Response Consistency",
  "Tool Selection Accuracy",
  "Context Retention",
  "Latency Stability",
  "Error Recovery",
  "Payload Fidelity",
  "Handoff Reliability",
  "Schema Compliance",
  "Intent Alignment",
  "Drift Resistance",
  "Token Efficiency",
  "Escalation Accuracy",
];

function generateScores() {
  return DIMENSIONS.map(() => 0.5 + Math.random() * 0.5);
}

interface AgentStabilityIndexProps {
  canaryActive?: boolean;
}

export default function AgentStabilityIndex({ canaryActive }: AgentStabilityIndexProps) {
  const [scores, setScores] = useState(generateScores);

  useEffect(() => {
    const interval = setInterval(() => {
      setScores((prev) =>
        prev.map((s, i) => {
          const canaryPenalty = canaryActive && (i === 0 || i === 9 || i === 3) ? -0.15 : 0;
          return Math.max(0.2, Math.min(1, s + (Math.random() - 0.5) * 0.08 + canaryPenalty * 0.3));
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [canaryActive]);

  const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length * 100).toFixed(0);
  const cx = 150, cy = 140, maxR = 110;

  const points = scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / scores.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxR * s,
      y: cy + Math.sin(angle) * maxR * s,
      lx: cx + Math.cos(angle) * (maxR + 16),
      ly: cy + Math.sin(angle) * (maxR + 16),
      ax: cx + Math.cos(angle) * maxR,
      ay: cy + Math.sin(angle) * maxR,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Agent Stability Index (ASI)</CardTitle>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              Number(avgScore) >= 80
                ? "bg-drift-success/10 text-drift-success border-drift-success/30"
                : Number(avgScore) >= 60
                ? "bg-drift-warning/10 text-drift-warning border-drift-warning/30"
                : "bg-drift-critical/10 text-drift-critical border-drift-critical/30"
            }`}
          >
            Overall: {avgScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <svg width="300" height="290" viewBox="0 0 300 290" className="w-full max-w-[300px] mx-auto">
          {/* Grid */}
          {gridLevels.map((level) => {
            const gridPoints = DIMENSIONS.map((_, i) => {
              const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
              return `${cx + Math.cos(angle) * maxR * level},${cy + Math.sin(angle) * maxR * level}`;
            }).join(" ");
            return (
              <polygon
                key={level}
                points={gridPoints}
                fill="none"
                stroke="hsl(222, 20%, 16%)"
                strokeWidth={0.5}
              />
            );
          })}
          {/* Axes */}
          {DIMENSIONS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + Math.cos(angle) * maxR}
                y2={cy + Math.sin(angle) * maxR}
                stroke="hsl(222, 20%, 16%)"
                strokeWidth={0.5}
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={polygon}
            fill="hsl(187, 80%, 48%)"
            fillOpacity={0.15}
            stroke="hsl(187, 80%, 48%)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            className="transition-all duration-700"
          />
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill={scores[i] >= 0.8 ? "hsl(152, 60%, 48%)" : scores[i] >= 0.6 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)"}
              className="transition-all duration-700"
            />
          ))}
          {/* Labels */}
          {DIMENSIONS.map((dim, i) => {
            const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
            const lx = cx + Math.cos(angle) * (maxR + 20);
            const ly = cy + Math.sin(angle) * (maxR + 20);
            return (
              <text
                key={dim}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[5.5px] font-mono"
                fill="hsl(215, 20%, 55%)"
              >
                {dim.length > 14 ? dim.slice(0, 12) + "…" : dim}
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
