import { useState, useMemo } from 'react';
import {
  ExternalLink,
  Loader2,
  Power,
  PowerOff,
  Activity,
  Code2,
  AlertCircle,
  Copy,
  Webhook,
  Clock as ClockIcon,
  Hand,
  GitBranch,
  Tag as TagIcon,
  Boxes,
  Calendar,
  Hash,
} from 'lucide-react';
import Drawer from './Drawer';
import StatusBadge from './StatusBadge';
import { useWorkflow, useExecutions } from '../hooks/useN8n';
import { setWorkflowActive, N8N_PUBLIC_URL } from '../lib/n8nClient';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  execDurationMs,
  execStatusLabel,
  summarizeTriggers,
  nodeShortName,
  computeStats,
} from '../utils/format';

function MetaRow({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-border last:border-b-0">
      <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-text-primary text-right truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function NodeIcon({ type }) {
  const t = (type || '').toLowerCase();
  if (t.includes('webhook')) return <Webhook size={12} />;
  if (t.includes('schedule') || t.includes('cron')) return <ClockIcon size={12} />;
  if (t.includes('manual')) return <Hand size={12} />;
  if (t.endsWith('trigger')) return <GitBranch size={12} />;
  return <Boxes size={12} />;
}

export default function WorkflowDetailDrawer({
  workflowSummary,
  onClose,
  onSelectExecution,
  pushToast,
  onChanged,
}) {
  const open = !!workflowSummary;
  const id = workflowSummary?.id;
  const { workflow, loading, error } = useWorkflow(id);
  const { executions, loading: execsLoading } = useExecutions({
    workflowId: id,
    limit: 50,
    refreshInterval: open ? 15000 : null,
    enabled: open,
  });
  const [tab, setTab] = useState('overview');
  const [toggling, setToggling] = useState(false);

  const triggers = useMemo(() => summarizeTriggers(workflow), [workflow]);
  const stats = useMemo(() => computeStats(executions || []), [executions]);

  const handleToggle = async () => {
    if (!workflow) return;
    setToggling(true);
    const next = !workflow.active;
    try {
      await setWorkflowActive(workflow.id, next);
      pushToast?.({
        kind: 'success',
        message: `"${workflow.name}" ${next ? 'activated' : 'deactivated'}`,
      });
      onChanged?.();
    } catch (err) {
      pushToast?.({ kind: 'error', message: err.message });
    } finally {
      setToggling(false);
    }
  };

  const copyJson = () => {
    if (!workflow) return;
    navigator.clipboard?.writeText(JSON.stringify(workflow, null, 2));
    pushToast?.({ kind: 'success', message: 'Workflow JSON copied' });
  };

  const name = workflow?.name || workflowSummary?.name || 'Workflow';
  const subtitle = id ? `ID: ${id}` : '';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={name}
      subtitle={subtitle}
      width={780}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleToggle}
            disabled={!workflow || toggling}
            className={`text-xs font-medium border rounded px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
              workflow?.active
                ? 'text-warning border-warning/30 hover:bg-warning/10'
                : 'text-success border-success/30 hover:bg-success/10'
            }`}
          >
            {toggling ? (
              <Loader2 size={13} className="animate-spin" />
            ) : workflow?.active ? (
              <PowerOff size={13} />
            ) : (
              <Power size={13} />
            )}
            {workflow?.active ? 'Deactivate' : 'Activate'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              disabled={!workflow}
              className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded px-3 py-1.5 flex items-center gap-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Copy size={13} /> Copy JSON
            </button>
            {id && (
              <a
                href={`${N8N_PUBLIC_URL}/workflow/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-brand"
              >
                <ExternalLink size={13} /> Open editor
              </a>
            )}
          </div>
        </div>
      }
    >
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center text-text-muted gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs font-mono">Loading workflow…</span>
        </div>
      )}
      {error && (
        <div className="m-5 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-warning font-mono">{error}</div>
        </div>
      )}

      {workflow && (
        <>
          <div className="p-5 space-y-4 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-medium border px-2 py-0.5 rounded tracking-wider uppercase ${
                  workflow.active
                    ? 'text-success bg-success/10 border-success/20'
                    : 'text-text-muted bg-zinc-800/50 border-zinc-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    workflow.active ? 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-zinc-600'
                  }`}
                />
                {workflow.active ? 'Active' : 'Inactive'}
              </span>
              {workflow.isArchived && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium border px-2 py-0.5 rounded tracking-wider uppercase text-text-muted bg-zinc-800/50 border-zinc-700">
                  Archived
                </span>
              )}
              {triggers.kinds.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-[10px] font-medium border border-border bg-background px-2 py-0.5 rounded"
                >
                  {k}
                </span>
              ))}
              {workflow.tags?.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-background border border-border px-2 py-0.5 rounded"
                >
                  <TagIcon size={9} /> {t.name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-6 bg-background border border-border rounded-lg p-4">
              <MetaRow label="ID" value={workflow.id} mono />
              <MetaRow label="Nodes" value={workflow.nodes?.length || 0} mono />
              <MetaRow label="Created" value={formatAbsolute(workflow.createdAt)} />
              <MetaRow label="Updated" value={formatAbsolute(workflow.updatedAt)} />
              <MetaRow label="Trigger count" value={triggers.count} mono />
              <MetaRow label="Version" value={workflow.versionId?.slice(0, 8) || '—'} mono />
            </div>

            {/* Quick stats from recent executions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Total', value: stats.total },
                {
                  label: 'Success',
                  value: stats.success,
                  color: 'text-success',
                },
                {
                  label: 'Error',
                  value: stats.error,
                  color: stats.error > 0 ? 'text-warning' : 'text-text-primary',
                },
                {
                  label: 'Avg',
                  value: stats.avgDurationMs ? formatDuration(stats.avgDurationMs) : '—',
                },
              ].map((s) => (
                <div key={s.label} className="bg-background border border-border rounded-lg p-3 text-center">
                  <div className="text-[10px] text-text-secondary uppercase tracking-wider">{s.label}</div>
                  <div className={`text-lg font-bold tabular-nums ${s.color || 'text-text-primary'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 flex items-center gap-1 border-b border-border">
            {[
              { key: 'overview', label: 'Nodes', icon: Boxes },
              { key: 'runs', label: `Runs (${executions?.length || 0})`, icon: Activity },
              { key: 'json', label: 'Raw JSON', icon: Code2 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'text-text-primary border-brand'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="p-5 space-y-1.5">
              {(workflow.nodes || []).map((n) => (
                <div
                  key={n.id || n.name}
                  className="flex items-center gap-3 border border-border bg-background rounded-lg p-2.5"
                >
                  <div className="w-7 h-7 rounded bg-card border border-border flex items-center justify-center text-text-secondary">
                    <NodeIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary font-medium truncate">{n.name}</div>
                    <div className="text-[10px] text-text-muted font-mono truncate">
                      {nodeShortName(n.type)} · v{n.typeVersion}
                    </div>
                  </div>
                  {n.credentials && Object.keys(n.credentials).length > 0 && (
                    <span className="text-[10px] text-text-muted font-mono">
                      🔑 {Object.keys(n.credentials).length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'runs' && (
            <div className="p-5 space-y-1.5">
              {execsLoading && (executions || []).length === 0 && (
                <div className="flex items-center justify-center py-8 text-text-muted gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Loading runs…</span>
                </div>
              )}
              {(executions || []).map((e) => {
                const d = execDurationMs(e);
                return (
                  <button
                    key={e.id}
                    onClick={() => onSelectExecution?.(e)}
                    className="w-full text-left flex items-center gap-3 border border-border bg-background hover:bg-zinc-800/40 rounded-lg p-2.5 transition-colors group"
                  >
                    <StatusBadge status={execStatusLabel(e)} />
                    <span className="text-text-muted font-mono text-xs flex items-center gap-1">
                      <Hash size={10} /> {e.id}
                    </span>
                    <span className="flex-1 text-xs text-text-secondary font-mono">
                      {formatAbsolute(e.startedAt)}
                    </span>
                    <span className="text-xs font-mono text-text-primary tabular-nums">
                      {d != null ? formatDuration(d) : '—'}
                    </span>
                    <ExternalLink size={11} className="text-text-muted opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
              {(executions || []).length === 0 && !execsLoading && (
                <div className="text-xs text-text-muted text-center py-8 flex flex-col items-center gap-2">
                  <Calendar size={20} className="opacity-40" />
                  No runs recorded yet.
                </div>
              )}
            </div>
          )}

          {tab === 'json' && (
            <div className="p-5">
              <pre className="text-[10px] font-mono text-text-secondary bg-background border border-border rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                {JSON.stringify(workflow, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
