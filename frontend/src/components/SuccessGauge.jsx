import { useMemo } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { computeStats } from '../utils/format';

/* color thresholds: <80 rose · 80–95 amber · ≥95 emerald */
function rateColor(rate) {
  if (rate >= 95) return '#10b981';
  if (rate >= 80) return '#f59e0b';
  return '#f43f5e';
}

export default function SuccessGauge({ executions }) {
  const stats = useMemo(() => computeStats(executions || []), [executions]);
  const finished = stats.success + stats.error;
  const rate = finished > 0 ? stats.successRate : 0;
  const color = rateColor(rate);
  const data = [{ name: 'success', value: rate, fill: color }];

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-5 shadow-inner flex flex-col relative overflow-hidden group transition-all duration-300 hover:border-white/10">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 60%, ${color}1a, transparent 70%)` }}
      />
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <CheckCircle2 size={14} style={{ color }} /> Success Rate
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5">
          across {finished} finished run{finished === 1 ? '' : 's'}
        </p>
      </div>

      <div className="relative flex-1 min-h-[180px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="74%"
            outerRadius="100%"
            data={data}
            startAngle={220}
            endAngle={-40}
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#27272a' }}
              dataKey="value"
              cornerRadius={8}
              angleAxisId={0}
              isAnimationActive
              animationDuration={900}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold tabular-nums tracking-tight" style={{ color }}>
            {finished > 0 ? `${rate}%` : '—'}
          </span>
          <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
            <span className="text-success">{stats.success} ok</span>
            <span className="text-warning">{stats.error} fail</span>
          </div>
        </div>
      </div>
    </div>
  );
}
