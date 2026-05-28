import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { bucketByHour } from '../utils/format';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 px-3 py-2 rounded-lg shadow-xl text-xs space-y-0.5 font-mono">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-text-primary capitalize">{p.dataKey}:</span>
          <span className="text-text-primary font-semibold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function VolumeChart({ executions, hours = 24 }) {
  const [mode, setMode] = useState('stack');
  const data = useMemo(() => bucketByHour(executions, hours), [executions, hours]);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-5 shadow-inner h-[340px] flex flex-col relative overflow-hidden group transition-all duration-300 hover:border-white/10">
      <div className="absolute inset-0 bg-gradient-to-tr from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Activity size={14} className="text-brand" /> Execution Volume ({hours}h)
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Hourly buckets · success vs error split
          </p>
        </div>
        <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg p-1 backdrop-blur-md shadow-inner relative z-10">
          <button
            onClick={() => setMode('stack')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ease-out border ${
              mode === 'stack'
                ? 'bg-white/10 border-white/10 text-white shadow-sm shadow-black/40'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setMode('area')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ease-out border ${
              mode === 'area'
                ? 'bg-white/10 border-white/10 text-white shadow-sm shadow-black/40'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted text-xs gap-2 z-10 pointer-events-none">
            <Activity size={20} className="opacity-40" />
            <span>No executions in the last {hours}h</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(data.length / 8))}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} fill="url(#gradSuccess)" />
              <Area type="monotone" dataKey="error" stroke="#f43f5e" strokeWidth={2} fill="url(#gradError)" />
              <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="square" iconSize={8} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(data.length / 8))}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="success" stackId="x" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="error" stackId="x" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="square" iconSize={8} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
