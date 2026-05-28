import { useMemo } from 'react';
import {
  Heart,
  HeartCrack,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from 'lucide-react';
import {
  getHealthStatus,
  formatRelativeTime,
  formatDuration,
  getExecutionDuration,
  groupExecutionsByWorkflow,
} from '../utils/executionHelpers';

function HealthIcon({ status }) {
  switch (status) {
    case 'healthy':
      return <Heart size={18} className="health-icon-healthy" />;
    case 'degraded':
      return <AlertTriangle size={18} className="health-icon-degraded" />;
    case 'failing':
      return <HeartCrack size={18} className="health-icon-failing" />;
    default:
      return <HelpCircle size={18} className="health-icon-unknown" />;
  }
}

function StatusDots({ executions }) {
  // Show last 10 executions as colored dots (newest on the right)
  const dots = executions.slice(0, 10).reverse();

  return (
    <div className="status-dots">
      {dots.map((exec, i) => (
        <span
          key={exec.id || i}
          className={`status-dot dot-${exec.status === 'success' ? 'success' : exec.status === 'error' ? 'error' : 'other'}`}
          title={`${exec.status} — ${formatRelativeTime(exec.startedAt)}`}
        />
      ))}
      {/* Pad with empty dots if fewer than 10 */}
      {Array.from({ length: Math.max(0, 10 - dots.length) }).map((_, i) => (
        <span key={`empty-${i}`} className="status-dot dot-empty" />
      ))}
    </div>
  );
}

function DurationTrend({ executions }) {
  const durations = executions
    .slice(0, 10)
    .map(e => getExecutionDuration(e))
    .filter(d => d != null && d > 0);

  if (durations.length < 2) {
    return <Minus size={14} className="trend-neutral" />;
  }

  const recent = durations.slice(0, Math.ceil(durations.length / 2));
  const older = durations.slice(Math.ceil(durations.length / 2));

  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

  const change = avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;

  if (Math.abs(change) < 10) {
    return <span className="trend-badge trend-neutral-badge"><Minus size={12} /> Stable</span>;
  } else if (change > 0) {
    return <span className="trend-badge trend-slower-badge"><TrendingUp size={12} /> Slower</span>;
  } else {
    return <span className="trend-badge trend-faster-badge"><TrendingDown size={12} /> Faster</span>;
  }
}

export default function WorkflowHealth({ executions, workflows }) {
  const groups = useMemo(
    () => groupExecutionsByWorkflow(executions, workflows),
    [executions, workflows]
  );

  const workflowCards = useMemo(() => {
    return Object.values(groups)
      .map(group => {
        const health = getHealthStatus(group.executions);
        const lastExec = group.executions[0];
        const avgDuration = group.executions
          .map(e => getExecutionDuration(e))
          .filter(d => d != null && d > 0);
        const avg = avgDuration.length > 0
          ? Math.round(avgDuration.reduce((a, b) => a + b, 0) / avgDuration.length)
          : null;

        return {
          ...group,
          health,
          lastExec,
          avgDuration: avg,
        };
      })
      .sort((a, b) => {
        // Sort failing first, then degraded, then healthy, then unknown
        const order = { failing: 0, degraded: 1, healthy: 2, unknown: 3 };
        return (order[a.health] ?? 4) - (order[b.health] ?? 4);
      });
  }, [groups]);

  if (workflowCards.length === 0) {
    return (
      <div className="health-empty glass-panel">
        <HelpCircle size={32} />
        <p>No workflow execution data yet</p>
      </div>
    );
  }

  return (
    <div className="health-grid">
      {workflowCards.map((wf, index) => (
        <div
          key={wf.id}
          className={`health-card glass-panel health-${wf.health} staggered-load`}
          style={{ animationDelay: `${0.05 * index}s` }}
        >
          <div className="health-card-header">
            <HealthIcon status={wf.health} />
            <span className={`health-badge badge-${wf.health}`}>
              {wf.health}
            </span>
          </div>

          <h4 className="health-card-name">{wf.name}</h4>

          <StatusDots executions={wf.executions} />

          <div className="health-card-meta">
            <div className="health-meta-item">
              <Clock size={13} />
              <span>{wf.lastExec ? formatRelativeTime(wf.lastExec.startedAt) : 'Never'}</span>
            </div>
            <div className="health-meta-item">
              <span className="meta-label">Avg</span>
              <span>{wf.avgDuration != null ? formatDuration(wf.avgDuration) : '—'}</span>
            </div>
          </div>

          <div className="health-card-footer">
            <span className="exec-count">{wf.executions.length} runs</span>
            <DurationTrend executions={wf.executions} />
          </div>
        </div>
      ))}
    </div>
  );
}
