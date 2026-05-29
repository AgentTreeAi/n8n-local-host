import { useMemo, Fragment } from 'react';
import {
  Heart,
  AlertTriangle,
  HeartCrack,
  HelpCircle,
  Flame,
  Timer,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useExecutions, useWorkflows } from '../hooks/useN8n';
import {
  buildHeatmap,
  computeStats,
  execDurationMs,
  execStatusLabel,
  formatDuration,
  formatRelative,
  groupByWorkflow,
  workflowHealth,
} from '../utils/format';
import SuccessGauge from './SuccessGauge';
import NodeTypeTreemap from './NodeTypeTreemap';
import WorkflowGraph from './WorkflowGraph';

const HEALTH_ICON = {
  healthy: Heart,
  degraded: AlertTriangle,
  failing: HeartCrack,
  unknown: HelpCircle,
};

const HEALTH_COLOR = {
  healthy: 'text-success border-success/30 bg-success/5',
  degraded: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  failing: 'text-warning border-warning/30 bg-warning/5',
  unknown: 'text-text-muted border-border bg-background',
};

function StatusDots({ executions }) {
  const dots = executions.slice(0, 10).reverse();
  const empties = Math.max(0, 10 - dots.length);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: empties }).map((_, i) => (
        <span key={`e-${i}`} className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
      ))}
      {dots.map((e, i) => {
        const s = execStatusLabel(e);
        const cls =
          s === 'success'
            ? 'bg-success'
            : s === 'error'
              ? 'bg-warning'
              : s === 'running' || s === 'waiting'
                ? 'bg-brand'
                : 'bg-zinc-600';
        return (
          <span
            key={e.id || i}
            className={`w-2 h-2 rounded-full ${cls}`}
            title={`${s} — ${formatRelative(e.startedAt)}`}
          />
        );
      })}
    </div>
  );
}

function DurationTrend({ executions }) {
  const ds = executions
    .slice(0, 20)
    .map((e) => execDurationMs(e))
    .filter((d) => d != null && d > 0);
  if (ds.length < 4) return <Minus size={12} className="text-text-muted" />;
  const mid = Math.floor(ds.length / 2);
  const recent = ds.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const older = ds.slice(mid).reduce((a, b) => a + b, 0) / (ds.length - mid);
  if (!older) return <Minus size={12} className="text-text-muted" />;
  const change = ((recent - older) / older) * 100;
  if (Math.abs(change) < 10)
    return (
      <span className="text-[10px] text-text-muted font-mono flex items-center gap-0.5">
        <Minus size={10} /> stable
      </span>
    );
  if (change > 0)
    return (
      <span className="text-[10px] text-warning font-mono flex items-center gap-0.5">
        <TrendingUp size={10} /> +{Math.round(change)}%
      </span>
    );
  return (
    <span className="text-[10px] text-success font-mono flex items-center gap-0.5">
      <TrendingDown size={10} /> {Math.round(change)}%
    </span>
  );
}

function HealthCard({ wf, onClick }) {
  const Icon = HEALTH_ICON[wf.health];
  const stats = computeStats(wf.executions);
  return (
    <button
      onClick={onClick}
      className={`text-left border rounded-xl p-4 transition-all hover:scale-[1.01] hover:shadow-lg ${HEALTH_COLOR[wf.health]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} />
          <span className="text-xs uppercase tracking-wider font-medium">{wf.health}</span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">{wf.executions.length} runs</span>
      </div>
      <h4 className="text-sm font-semibold text-text-primary mb-3 line-clamp-2">{wf.name}</h4>
      <div className="mb-3">
        <StatusDots executions={wf.executions} />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
        <span>
          {stats.avgDurationMs ? formatDuration(stats.avgDurationMs) : '—'} avg
        </span>
        <DurationTrend executions={wf.executions} />
      </div>
      <div className="mt-2 text-[10px] text-text-muted">
        last {wf.executions[0] ? formatRelative(wf.executions[0].startedAt) : '—'}
      </div>
    </button>
  );
}

/* ── Heatmap ─────────────────────────────────────────────────── */
function Heatmap({ executions }) {
  const grid = useMemo(() => buildHeatmap(executions), [executions]);
  const max = Math.max(1, ...grid.flat());
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: '40px repeat(24, 18px)' }}>
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div
            key={h}
            className="text-[9px] text-text-muted font-mono text-center"
            style={{ visibility: h % 2 === 0 ? 'visible' : 'hidden' }}
          >
            {String(h).padStart(2, '0')}
          </div>
        ))}
        {grid.map((row, d) => (
          <Fragment key={`row-${d}`}>
            <div className="text-[10px] text-text-muted font-mono pr-2 text-right">{days[d]}</div>
            {row.map((v, h) => {
              const alpha = v === 0 ? 0 : 0.15 + 0.85 * (v / max);
              return (
                <div
                  key={`${d}-${h}`}
                  className="w-[18px] h-[18px] rounded-sm border border-border"
                  style={{
                    background: v ? `rgba(99,102,241,${alpha})` : '#0d0d10',
                  }}
                  title={`${days[d]} ${String(h).padStart(2, '0')}:00 — ${v} run${v === 1 ? '' : 's'}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Insights({ onSelectWorkflow }) {
  const { executions } = useExecutions({ limit: 250, refreshInterval: 30000 });
  const { workflows } = useWorkflows({ refreshInterval: 30000 });

  const groups = useMemo(() => groupByWorkflow(executions || [], workflows || []), [
    executions,
    workflows,
  ]);

  const cards = useMemo(() => {
    return [...groups.values()]
      .map((g) => ({ ...g, health: workflowHealth(g.executions) }))
      .sort((a, b) => {
        const order = { failing: 0, degraded: 1, unknown: 2, healthy: 3 };
        return (order[a.health] ?? 4) - (order[b.health] ?? 4);
      });
  }, [groups]);

  const topFailing = useMemo(() => {
    return [...groups.values()]
      .map((g) => ({
        ...g,
        errorCount: g.executions.filter((e) => execStatusLabel(e) === 'error').length,
      }))
      .filter((g) => g.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
  }, [groups]);

  const slowest = useMemo(() => {
    return [...groups.values()]
      .map((g) => {
        const ds = g.executions.map((e) => execDurationMs(e)).filter((d) => d != null);
        const avg = ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : 0;
        return { ...g, avg };
      })
      .filter((g) => g.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [groups]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview row: gauge + node composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SuccessGauge executions={executions || []} />
        <div className="lg:col-span-2">
          <NodeTypeTreemap workflows={workflows || []} />
        </div>
      </div>

      {/* Dependency graph */}
      <WorkflowGraph workflows={workflows || []} onSelectWorkflow={onSelectWorkflow} />

      {/* Top row: failing & slow leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Flame size={14} className="text-warning" /> Top Failing Workflows
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">last {executions?.length || 0} runs</span>
          </div>
          {topFailing.length === 0 ? (
            <div className="text-xs text-text-muted py-6 text-center">No failures in the recent window 🎉</div>
          ) : (
            <div className="space-y-2">
              {topFailing.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => onSelectWorkflow?.(wf)}
                  className="w-full text-left flex items-center gap-3 border border-border bg-background hover:bg-zinc-800/40 rounded-lg p-2.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-warning/10 border border-warning/30 text-warning flex items-center justify-center font-mono text-sm font-bold">
                    {wf.errorCount}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{wf.name}</div>
                    <div className="text-[10px] text-text-muted font-mono">{wf.executions.length} runs total</div>
                  </div>
                  <StatusDots executions={wf.executions} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Timer size={14} className="text-amber-400" /> Slowest Workflows
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">avg duration</span>
          </div>
          {slowest.length === 0 ? (
            <div className="text-xs text-text-muted py-6 text-center">No duration data.</div>
          ) : (
            <div className="space-y-2">
              {slowest.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => onSelectWorkflow?.(wf)}
                  className="w-full text-left flex items-center gap-3 border border-border bg-background hover:bg-zinc-800/40 rounded-lg p-2.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                    <Zap size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{wf.name}</div>
                    <div className="text-[10px] text-text-muted font-mono">{wf.executions.length} runs</div>
                  </div>
                  <span className="text-sm font-mono text-text-primary tabular-nums">{formatDuration(wf.avg)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="border border-border bg-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Execution Heatmap</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Day of week × hour · brighter = more runs</p>
          </div>
        </div>
        <Heatmap executions={executions || []} />
      </div>

      {/* Health cards */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Health by Workflow</h3>
        {cards.length === 0 ? (
          <div className="text-xs text-text-muted text-center py-8 bg-card border border-border rounded-xl">
            No execution data captured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((wf) => (
              <HealthCard key={wf.id} wf={wf} onClick={() => onSelectWorkflow?.(wf)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
