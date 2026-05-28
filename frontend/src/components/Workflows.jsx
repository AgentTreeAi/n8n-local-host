import { useMemo, useState, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Loader2,
  Power,
  PowerOff,
  Activity,
  Calendar,
  ArrowUpDown,
  Plus,
  AlertCircle,
  Webhook,
  Clock as ClockIcon,
  Hand,
  GitBranch,
  Tag as TagIcon,
} from 'lucide-react';
import { useWorkflows, useExecutions } from '../hooks/useN8n';
import { setWorkflowActive, N8N_PUBLIC_URL } from '../lib/n8nClient';
import { formatRelative, summarizeTriggers, workflowHealth, execStatusLabel } from '../utils/format';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { key: 'updatedAt', label: 'Last Updated' },
  { key: 'createdAt', label: 'Newest' },
  { key: 'name', label: 'Name A→Z' },
  { key: 'health', label: 'Health (worst first)' },
];

const HEALTH_COLOR = {
  healthy: 'text-success',
  degraded: 'text-amber-400',
  failing: 'text-warning',
  unknown: 'text-text-muted',
};

function TriggerChip({ kind }) {
  const map = {
    Webhook: { icon: Webhook, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
    Schedule: { icon: ClockIcon, color: 'text-violet-400 border-violet-400/30 bg-violet-400/10' },
    Cron: { icon: ClockIcon, color: 'text-violet-400 border-violet-400/30 bg-violet-400/10' },
    Manual: { icon: Hand, color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  };
  const cfg = map[kind] || { icon: GitBranch, color: 'text-text-secondary border-border bg-background' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border px-1.5 py-0.5 rounded ${cfg.color}`}>
      <Icon size={9} />
      {kind}
    </span>
  );
}

export default function Workflows({ onSelect, pushToast }) {
  const { workflows, loading, error, lastFetched, refresh } = useWorkflows({ refreshInterval: 30000 });
  // Pull a broad execution slice for health/last-run signal
  const { executions: execSlice } = useExecutions({ limit: 250, refreshInterval: 30000 });

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [togglingId, setTogglingId] = useState(null);

  /* index executions by workflow */
  const execByWf = useMemo(() => {
    const m = new Map();
    for (const e of execSlice || []) {
      if (!e.workflowId) continue;
      if (!m.has(e.workflowId)) m.set(e.workflowId, []);
      m.get(e.workflowId).push(e);
    }
    return m;
  }, [execSlice]);

  const counts = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.active).length;
    return { total, active, inactive: total - active };
  }, [workflows]);

  const enriched = useMemo(() => {
    return workflows.map((w) => {
      const runs = execByWf.get(w.id) || [];
      const health = workflowHealth(runs);
      const last = runs[0];
      const triggers = summarizeTriggers(w);
      const successCount = runs.filter((e) => execStatusLabel(e) === 'success').length;
      const errorCount = runs.filter((e) => execStatusLabel(e) === 'error').length;
      const finished = successCount + errorCount;
      const successRate = finished ? Math.round((successCount / finished) * 100) : null;
      return { ...w, runs, health, last, triggers, successRate, runCount: runs.length, errorCount };
    });
  }, [workflows, execByWf]);

  const filtered = useMemo(() => {
    let res = enriched;
    if (statusFilter === 'active') res = res.filter((w) => w.active);
    else if (statusFilter === 'inactive') res = res.filter((w) => !w.active);
    if (query.trim()) {
      const q = query.toLowerCase();
      res = res.filter(
        (w) =>
          w.name?.toLowerCase().includes(q) ||
          w.id?.toLowerCase().includes(q) ||
          w.tags?.some((t) => t.name?.toLowerCase().includes(q)),
      );
    }
    const sorted = [...res].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'createdAt') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'health') {
        const order = { failing: 0, degraded: 1, unknown: 2, healthy: 3 };
        return (order[a.health] ?? 4) - (order[b.health] ?? 4);
      }
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    return sorted;
  }, [enriched, statusFilter, query, sortBy]);

  const handleToggle = useCallback(
    async (wf) => {
      const next = !wf.active;
      setTogglingId(wf.id);
      try {
        await setWorkflowActive(wf.id, next);
        pushToast?.({
          kind: 'success',
          message: `"${wf.name}" ${next ? 'activated' : 'deactivated'}`,
        });
        refresh();
      } catch (err) {
        pushToast?.({ kind: 'error', message: `Toggle failed: ${err.message}` });
      } finally {
        setTogglingId(null);
      }
    },
    [refresh, pushToast],
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* CLI-style search bar */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-2 flex items-center gap-2 focus-within:border-brand transition-all">
        <div className="bg-background rounded p-2 text-brand">
          <Search size={18} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="> filter workflows by name, ID, or tag…"
          className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-sm font-mono placeholder:text-zinc-600 text-text-primary"
        />
        <div className="flex items-center gap-2 pr-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            const n =
              f.key === 'all' ? counts.total : f.key === 'active' ? counts.active : counts.inactive;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
                  active
                    ? 'bg-zinc-800 border border-zinc-700 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:bg-white/5'
                }`}
              >
                {f.label} ({n})
              </button>
            );
          })}
          <div className="w-px h-4 bg-border mx-1" />
          <div className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1.5">
            <ArrowUpDown size={12} className="text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-text-secondary outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-card">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-text-secondary hover:text-text-primary border border-border rounded px-2 py-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title={lastFetched ? `Last synced ${formatRelative(lastFetched.toISOString())}` : 'Sync'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <a
            href={`${N8N_PUBLIC_URL}/workflow/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand text-white text-xs px-4 py-1.5 rounded flex items-center gap-1.5 hover:bg-brand-hover transition-colors font-medium shadow-brand"
          >
            <Plus size={13} /> New
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-warning" />
          <span className="text-xs text-warning font-mono">{error}</span>
        </div>
      )}

      {/* High-density list */}
      <div className="border border-border bg-card rounded-xl flex flex-col shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border bg-zinc-900/60 text-[10px] uppercase tracking-wider text-text-secondary font-medium">
              <th className="p-3 px-4 w-12 font-medium text-center">●</th>
              <th className="p-3 px-4 font-medium">Workflow</th>
              <th className="p-3 px-4 w-44 font-medium">Trigger</th>
              <th className="p-3 px-4 w-28 font-medium">Health</th>
              <th className="p-3 px-4 w-28 font-medium">Runs (slice)</th>
              <th className="p-3 px-4 w-36 font-medium">Last Run</th>
              <th className="p-3 px-4 w-36 font-medium">Updated</th>
              <th className="p-3 px-4 w-32 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((wf) => (
              <tr
                key={wf.id}
                onClick={() => onSelect?.(wf)}
                className="border-b border-border hover:bg-white/[0.03] transition-colors group cursor-pointer"
              >
                <td className="p-3 px-4 text-center">
                  {wf.active ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)] mx-auto" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-600 mx-auto" />
                  )}
                </td>
                <td className="p-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-text-primary font-medium tracking-tight truncate">
                      {wf.name || '(untitled)'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">{wf.id}</span>
                  </div>
                  {wf.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {wf.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 text-[9px] text-text-muted bg-background border border-border px-1.5 py-0.5 rounded"
                        >
                          <TagIcon size={8} /> {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {wf.triggers.kinds.length === 0 ? (
                      <span className="text-[10px] text-text-muted">—</span>
                    ) : (
                      wf.triggers.kinds.map((k) => <TriggerChip key={k} kind={k} />)
                    )}
                  </div>
                </td>
                <td className="p-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      wf.health === 'healthy'
                        ? 'bg-success'
                        : wf.health === 'degraded'
                          ? 'bg-amber-400'
                          : wf.health === 'failing'
                            ? 'bg-warning'
                            : 'bg-zinc-600'
                    }`} />
                    <span className={`text-xs font-medium ${HEALTH_COLOR[wf.health]}`}>
                      {wf.health}
                    </span>
                  </div>
                </td>
                <td className="p-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary text-xs font-mono tabular-nums">
                      {wf.runCount}
                    </span>
                    {wf.successRate != null && (
                      <span className={`text-[10px] font-mono ${
                        wf.successRate >= 95 ? 'text-success' : wf.successRate >= 80 ? 'text-text-secondary' : 'text-warning'
                      }`}>
                        {wf.successRate}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 px-4 text-text-secondary text-xs">
                  {wf.last ? (
                    <div className="flex items-center gap-1.5">
                      <Activity size={11} className="text-text-muted" />
                      {formatRelative(wf.last.startedAt)}
                    </div>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="p-3 px-4 text-text-secondary text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-text-muted" />
                    {formatRelative(wf.updatedAt)}
                  </div>
                </td>
                <td className="p-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(wf);
                      }}
                      disabled={togglingId === wf.id}
                      className={`text-xs font-medium border rounded px-2 py-1 flex items-center gap-1 transition-colors ${
                        wf.active
                          ? 'text-text-secondary border-border hover:text-warning hover:border-warning/30'
                          : 'text-text-secondary border-border hover:text-success hover:border-success/30'
                      } disabled:opacity-50`}
                      title={wf.active ? 'Deactivate' : 'Activate'}
                    >
                      {togglingId === wf.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : wf.active ? (
                        <PowerOff size={11} />
                      ) : (
                        <Power size={11} />
                      )}
                    </button>
                    <a
                      href={`${N8N_PUBLIC_URL}/workflow/${wf.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-text-primary bg-zinc-800 border border-zinc-700 rounded px-2 py-1 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> Edit
                    </a>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-16 text-center text-text-muted text-sm">
                  {loading ? 'Fetching workflows…' : 'No workflows match your filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
