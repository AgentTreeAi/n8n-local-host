import { Activity, BarChart3, AlertOctagon, Timer, Workflow, Power } from 'lucide-react';
import { formatDuration, formatNumber } from '../utils/format';

function Stat({ icon: Icon, label, value, accent = 'text-text-primary', sub }) {
  return (
    <div className="flex-1 min-w-[180px] p-4 px-5 border-r border-border last:border-r-0 flex flex-col justify-center">
      <div className="text-[10px] text-text-secondary font-medium mb-1.5 uppercase tracking-[0.12em] flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight tabular-nums ${accent}`}>{value}</span>
        {sub && <span className="text-[11px] font-mono text-text-muted">{sub}</span>}
      </div>
    </div>
  );
}

export default function StatsRibbon({ stats, workflowStats }) {
  const successColor =
    stats.successRate >= 95
      ? 'text-success'
      : stats.successRate >= 80
        ? 'text-text-primary'
        : 'text-warning';

  const failureColor = stats.error > 0 ? 'text-warning' : 'text-text-primary';

  return (
    <div className="border-b border-border bg-card flex overflow-x-auto">
      <Stat
        icon={Activity}
        label="Executions"
        value={formatNumber(stats.total)}
        sub={stats.running ? `${stats.running} live` : null}
      />
      <Stat
        icon={BarChart3}
        label="Success Rate"
        value={stats.total ? `${stats.successRate}%` : '—'}
        accent={successColor}
      />
      <Stat
        icon={AlertOctagon}
        label="Failures"
        value={formatNumber(stats.error)}
        accent={failureColor}
      />
      <Stat
        icon={Timer}
        label="Avg Duration"
        value={stats.avgDurationMs ? formatDuration(stats.avgDurationMs) : '—'}
        sub={stats.p95DurationMs ? `p95 ${formatDuration(stats.p95DurationMs)}` : null}
      />
      {workflowStats && (
        <>
          <Stat
            icon={Workflow}
            label="Workflows"
            value={workflowStats.total}
            sub={`${workflowStats.active} active`}
          />
          <Stat
            icon={Power}
            label="Active Rate"
            value={
              workflowStats.total
                ? `${Math.round((workflowStats.active / workflowStats.total) * 100)}%`
                : '—'
            }
          />
        </>
      )}
    </div>
  );
}
