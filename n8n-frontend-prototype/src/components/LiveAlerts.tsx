import { type FC, useState, useMemo } from 'react';
import { Siren, RotateCcw, ChevronRight } from 'lucide-react';
import type { AlertItem, AlertSeverity } from '../hooks/useAlerts';

interface LiveAlertsProps {
  alerts: AlertItem[];
  loading: boolean;
  lastFetchedAt: Date | null;
  error: string | null;
  onRefresh: () => void;
  onAlertClick?: (workflowName: string | null, sourceExecutionId: string | null) => void;
}

type SeverityFilter = 'all' | AlertSeverity;

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-warning',     text: 'text-warning',     label: 'CRIT' },
  high:     { bg: 'bg-[#ff8a1f]',   text: 'text-[#ff8a1f]',   label: 'HIGH' },
  medium:   { bg: 'bg-[#ffd03b]',   text: 'text-[#ffd03b]',   label: 'MED' },
  low:      { bg: 'bg-text-secondary', text: 'text-text-secondary', label: 'LOW' },
};

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function fmtClockTime(iso: string): string {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString([], { hour12: false });
}

const LiveAlerts: FC<LiveAlertsProps> = ({ alerts, loading, lastFetchedAt, error, onRefresh, onAlertClick }) => {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 } as Record<AlertSeverity, number>;
    for (const a of alerts) c[a.severity]++;
    return c;
  }, [alerts]);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
    return [...list].sort((a, b) => {
      const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (s !== 0) return s;
      return new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime();
    });
  }, [alerts, filter]);

  const fetchedClock = lastFetchedAt ? lastFetchedAt.toLocaleTimeString([], { hour12: false }) : '--:--:--';

  return (
    <div className="border border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-border bg-black gap-4">
        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
          <Siren size={14} className={alerts.length > 0 ? 'text-warning animate-pulse' : 'text-brand'} />
          ALERT_FEED :: NOTIFICATION_HUB
          {counts.critical + counts.high > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-warning text-black text-[10px] font-bold tracking-widest">
              {counts.critical + counts.high} URGENT
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          <span>SYNC @ {fetchedClock}</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 text-text-secondary hover:text-brand transition-colors disabled:opacity-40"
            title="Refresh alerts"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-[#030303] gap-1 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-[10px] tracking-widest transition-colors font-mono uppercase ${filter === 'all' ? 'bg-brand text-black font-bold' : 'text-text-secondary hover:text-brand'}`}
        >
          ALL ({alerts.length})
        </button>
        {(['critical', 'high', 'medium', 'low'] as AlertSeverity[]).map(sev => {
          const style = SEVERITY_STYLES[sev];
          const isActive = filter === sev;
          return (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-3 py-1 text-[10px] tracking-widest transition-colors font-mono uppercase ${isActive ? `${style.bg} text-black font-bold` : `text-text-secondary hover:${style.text}`}`}
            >
              {style.label} ({counts[sev]})
            </button>
          );
        })}
      </div>

      {/* Body */}
      {error ? (
        <div className="p-6 text-center text-warning text-[11px] font-mono uppercase tracking-widest">
          ERR :: {error}
        </div>
      ) : loading && alerts.length === 0 ? (
        <div className="p-6 text-center text-text-secondary text-[11px] font-mono uppercase tracking-widest animate-pulse">
          &gt; LOADING_ALERT_STREAM...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center text-text-secondary text-[11px] font-mono uppercase tracking-widest">
          &gt; NO_ALERTS :: ALL_SYSTEMS_GREEN
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
          {filtered.map(a => {
            const style = SEVERITY_STYLES[a.severity];
            const clickable = Boolean(onAlertClick && a.workflowName);
            return (
              <button
                key={a.id}
                onClick={clickable ? () => onAlertClick!(a.workflowName, a.sourceExecutionId) : undefined}
                disabled={!clickable}
                className={`w-full text-left flex items-stretch px-4 py-3 gap-3 transition-colors ${clickable ? 'hover:bg-brand/5 cursor-pointer' : 'cursor-default'}`}
              >
                {/* Severity bar */}
                <div className={`w-1 shrink-0 ${style.bg}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold ${style.bg} text-black tracking-widest`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary truncate">
                      {a.workflowName || 'unknown_workflow'}
                      {a.nodeName && <span className="text-text-muted"> &gt; {a.nodeName}</span>}
                    </span>
                  </div>
                  <div className="text-[12px] font-sans text-text-primary leading-snug break-words">
                    {a.errorMessage || a.message}
                  </div>
                  {a.errorType && (
                    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-1">
                      type :: {a.errorType}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end justify-between gap-1 text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                  <span>{a.timestamp}</span>
                  <span className="text-text-muted">{fmtClockTime(a.rawTimestamp)}</span>
                  {clickable && <ChevronRight size={12} className="text-text-muted" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveAlerts;
