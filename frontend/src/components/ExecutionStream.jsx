import { useMemo, useState } from 'react';
import { Activity, RefreshCw, Search, Trash2, Loader2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  formatDuration,
  formatRelative,
  execDurationMs,
  execStatusLabel,
  modeLabel,
} from '../utils/format';
import { deleteExecution } from '../lib/n8nClient';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'error', label: 'Failed' },
  { key: 'running', label: 'Live' },
  { key: 'waiting', label: 'Waiting' },
];

export default function ExecutionStream({
  executions,
  workflows = [],
  loading,
  error,
  onRefresh,
  onSelect,
  hasMore,
  onLoadMore,
  onAfterDelete,
  pushToast,
  compact = false,
  maxHeight,
}) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const wfNameMap = useMemo(() => {
    const m = new Map();
    workflows.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [workflows]);

  const filtered = useMemo(() => {
    let res = executions || [];
    if (filter !== 'all') {
      res = res.filter((e) => execStatusLabel(e) === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      res = res.filter((e) => {
        const name = wfNameMap.get(e.workflowId) || '';
        return (
          name.toLowerCase().includes(q) ||
          String(e.id).includes(q) ||
          (e.workflowId || '').toLowerCase().includes(q)
        );
      });
    }
    return res;
  }, [executions, filter, query, wfNameMap]);

  const counts = useMemo(() => {
    const c = { all: executions?.length || 0, success: 0, error: 0, running: 0, waiting: 0 };
    for (const e of executions || []) {
      const s = execStatusLabel(e);
      if (s in c) c[s]++;
    }
    return c;
  }, [executions]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm(`Delete execution ${id}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteExecution(id);
      pushToast?.({ kind: 'success', message: `Execution ${id} deleted` });
      onAfterDelete?.(id);
    } catch (err) {
      pushToast?.({ kind: 'error', message: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border border-border bg-card rounded-xl flex flex-col shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-background border border-border rounded px-3 py-1.5 focus-within:border-brand transition-colors">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by workflow name, execution ID..."
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted font-mono"
          />
        </div>

        <div className="flex items-center gap-1 bg-background border border-border rounded p-1">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.key;
            const n = counts[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-card border border-border text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {f.label}
                {n != null && (
                  <span className={`tabular-nums text-[10px] ${active ? 'text-text-muted' : 'text-text-muted'}`}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 border border-border px-2.5 py-1.5 rounded bg-background hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sync
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-warning bg-warning/10 border-b border-warning/20 font-mono">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[820px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-zinc-900/95 backdrop-blur text-[10px] uppercase tracking-wider text-text-secondary font-medium">
              <th className="p-3 px-4 w-24 font-medium">Status</th>
              <th className="p-3 px-4 w-20 font-medium">ID</th>
              <th className="p-3 px-4 font-medium">Workflow</th>
              <th className="p-3 px-4 w-24 font-medium">Mode</th>
              <th className="p-3 px-4 w-28 font-medium">Duration</th>
              <th className="p-3 px-4 w-32 font-medium text-right">When</th>
              {!compact && <th className="p-3 px-4 w-12 font-medium text-right"></th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((exec) => {
              const name = wfNameMap.get(exec.workflowId) || exec.workflowData?.name || '—';
              const dur = execDurationMs(exec);
              const status = execStatusLabel(exec);
              return (
                <tr
                  key={exec.id}
                  onClick={() => onSelect?.(exec)}
                  className="border-b border-border hover:bg-white/[0.03] transition-colors group cursor-pointer"
                >
                  <td className="p-3 px-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="p-3 px-4">
                    <span className="text-text-muted font-mono text-xs group-hover:text-text-primary transition-colors">
                      #{exec.id}
                    </span>
                  </td>
                  <td className="p-3 px-4 text-text-primary font-medium truncate max-w-[420px]">
                    {name}
                    {exec.retryOf && (
                      <span className="ml-2 text-[10px] text-text-muted font-mono">↩ retry of #{exec.retryOf}</span>
                    )}
                  </td>
                  <td className="p-3 px-4 text-text-secondary text-xs">{modeLabel(exec.mode)}</td>
                  <td className="p-3 px-4 text-text-secondary text-xs font-mono">
                    {status === 'running' || status === 'waiting' ? (
                      <span className="text-brand flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> live
                      </span>
                    ) : (
                      formatDuration(dur)
                    )}
                  </td>
                  <td className="p-3 px-4 text-right text-text-muted text-xs">
                    {formatRelative(exec.startedAt)}
                  </td>
                  {!compact && (
                    <td className="p-3 px-4 text-right">
                      <button
                        onClick={(e) => handleDelete(e, exec.id)}
                        disabled={deletingId === exec.id}
                        className="text-text-muted hover:text-warning transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete execution"
                      >
                        {deletingId === exec.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={compact ? 6 : 7} className="p-16 text-center text-text-muted text-sm border-b border-border bg-background">
                  <Activity className="mx-auto mb-3 opacity-40" size={24} />
                  {loading ? 'Streaming telemetry…' : query || filter !== 'all' ? 'No matches for current filter.' : 'No executions yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="p-3 border-t border-border bg-background flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded px-4 py-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load older executions'}
          </button>
        </div>
      )}
    </div>
  );
}
