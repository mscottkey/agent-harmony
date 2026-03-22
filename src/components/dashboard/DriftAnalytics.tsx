import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BASE_DATA = [
  { day: "Mon", variance: 2.1 },
  { day: "Tue", variance: 3.8 },
  { day: "Wed", variance: 1.4 },
  { day: "Thu", variance: 7.2 },
  { day: "Fri", variance: 12.8 },
  { day: "Sat", variance: 5.1 },
  { day: "Sun", variance: 4.3 },
  { day: "Mon", variance: 8.9 },
  { day: "Tue", variance: 6.2 },
  { day: "Wed", variance: 3.1 },
  { day: "Thu", variance: 15.4 },
  { day: "Fri", variance: 9.7 },
  { day: "Sat", variance: 4.8 },
  { day: "Sun", variance: 2.9 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-xs text-primary">Variance: {payload[0].value}%</p>
    </div>
  );
};

interface DriftAnalyticsProps {
  simulationPeak?: number | null;
  canaryActive?: boolean;
}

const CANARY_DATA = [
  { day: "Mon", variance: 4.2 },
  { day: "Tue", variance: 8.1 },
  { day: "Wed", variance: 5.6 },
  { day: "Thu", variance: 14.3 },
  { day: "Fri", variance: 22.1 },
  { day: "Sat", variance: 11.8 },
  { day: "Sun", variance: 9.2 },
  { day: "Mon", variance: 16.4 },
  { day: "Tue", variance: 12.7 },
  { day: "Wed", variance: 7.9 },
  { day: "Thu", variance: 24.8 },
  { day: "Fri", variance: 18.3 },
  { day: "Sat", variance: 10.1 },
  { day: "Sun", variance: 6.5 },
];

export default function DriftAnalytics({ simulationPeak, canaryActive }: DriftAnalyticsProps) {
  const baseData = canaryActive ? CANARY_DATA : BASE_DATA;
  const data = simulationPeak
    ? [...baseData, { day: "Now", variance: simulationPeak }]
    : baseData;

  const avgVariance = (data.reduce((s, d) => s + d.variance, 0) / data.length).toFixed(1);
  const maxVariance = Math.max(...data.map((d) => d.variance)).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Stochastic Variance · Golden Path Deviation</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              Avg {avgVariance}%
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-drift-warning/10 text-drift-warning border-drift-warning/30">
              Peak {maxVariance}%
            </Badge>
            {simulationPeak && (
              <Badge variant="outline" className="text-[10px] bg-drift-critical/10 text-drift-critical border-drift-critical/30 animate-fade-in">
                ⚡ Sim Peak {simulationPeak.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="varianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 80%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 80%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="variance"
              stroke="hsl(187, 80%, 48%)"
              strokeWidth={2}
              fill="url(#varianceGrad)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
