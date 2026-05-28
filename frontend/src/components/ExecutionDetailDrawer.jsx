import { useState } from 'react';
import {
  Activity,
  ExternalLink,
  Code2,
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
} from 'lucide-react';
import Drawer from './Drawer';
import StatusBadge from './StatusBadge';
import {
  formatAbsolute,
  formatDuration,
  execDurationMs,
  execStatusLabel,
  modeLabel,
} from '../utils/format';
import { useExecution } from '../hooks/useN8n';
import { deleteExecution, N8N_PUBLIC_URL } from '../lib/n8nClient';

function MetaRow({ label, value, mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-border last:border-b-0">
      <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-text-primary text-right truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function NodeRunRow({ name, runs }) {
  const first = runs[0];
  const totalTime = runs.reduce((acc, r) => acc + (r.executionTime || 0), 0);
  const itemsOut = (() => {
    try {
      const main = first?.data?.main;
      if (Array.isArray(main)) return main.reduce((a, arr) => a + (Array.isArray(arr) ? arr.length : 0), 0);
    } catch {
      /* ignore */
    }
    return 0;
  })();
  const errored = runs.some((r) => r.error || r.executionStatus === 'error');

  return (
    <div className="border border-border bg-background rounded-lg p-3 flex items-center gap-3">
      <div
        className={`w-2 h-8 rounded-full ${
          errored ? 'bg-warning' : 'bg-success'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">{name}</span>
          {runs.length > 1 && (
            <span className="text-[10px] font-mono text-text-muted bg-zinc-800 px-1.5 py-0.5 rounded">
              ×{runs.length}
            </span>
          )}
        </div>
        {first?.error && (
          <div className="text-[11px] text-warning font-mono mt-1 truncate">
            {first.error.message || String(first.error).slice(0, 200)}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end shrink-0 text-right">
        <span className="text-xs font-mono text-text-primary tabular-nums">
          {formatDuration(totalTime)}
        </span>
        <span className="text-[10px] text-text-muted font-mono">
          {itemsOut} item{itemsOut === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

export default function ExecutionDetailDrawer({
  executionId,
  workflowName,
  onClose,
  pushToast,
  onDeleted,
}) {
  const open = !!executionId;
  const { execution, loading, error } = useExecution(executionId);
  const [tab, setTab] = useState('overview');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!executionId) return;
    if (!confirm(`Delete execution ${executionId}?`)) return;
    setDeleting(true);
    try {
      await deleteExecution(executionId);
      pushToast?.({ kind: 'success', message: `Execution ${executionId} deleted` });
      onDeleted?.(executionId);
      onClose?.();
    } catch (err) {
      pushToast?.({ kind: 'error', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const copyJson = () => {
    if (!execution) return;
    navigator.clipboard?.writeText(JSON.stringify(execution, null, 2));
    pushToast?.({ kind: 'success', message: 'Execution JSON copied' });
  };

  const status = execution ? execStatusLabel(execution) : 'unknown';
  const dur = execution ? execDurationMs(execution) : null;
  const runData = execution?.data?.resultData?.runData || {};
  const nodeRuns = Object.entries(runData);
  const errorMsg = execution?.data?.resultData?.error?.message;
  const wfName = execution?.workflowData?.name || workflowName || '—';
  const wfId = execution?.workflowId;

  const subtitle = executionId ? `Execution #${executionId}` : '';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={wfName}
      subtitle={subtitle}
      width={760}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-warning hover:bg-warning/10 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete execution
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              disabled={!execution}
              className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded px-3 py-1.5 flex items-center gap-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Copy size={13} /> Copy JSON
            </button>
            {wfId && (
              <a
                href={`${N8N_PUBLIC_URL}/workflow/${wfId}/executions/${executionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-brand"
              >
                <ExternalLink size={13} /> Open in n8n
              </a>
            )}
          </div>
        </div>
      }
    >
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center text-text-muted gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs font-mono">Fetching execution data…</span>
        </div>
      )}

      {error && (
        <div className="m-5 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-warning font-mono">{error}</div>
        </div>
      )}

      {execution && (
        <>
          <div className="p-5 space-y-4 border-b border-border">
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <span className="text-xs text-text-muted font-mono">
                {modeLabel(execution.mode)}
              </span>
              {execution.retryOf && (
                <span className="text-xs text-text-muted font-mono">
                  ↩ retry of #{execution.retryOf}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 bg-background border border-border rounded-lg p-4">
              <MetaRow label="ID" value={execution.id} mono />
              <MetaRow label="Workflow ID" value={execution.workflowId || '—'} mono />
              <MetaRow label="Started" value={formatAbsolute(execution.startedAt)} />
              <MetaRow label="Stopped" value={formatAbsolute(execution.stoppedAt)} />
              <MetaRow label="Duration" value={dur != null ? formatDuration(dur) : '—'} mono />
              <MetaRow label="Nodes Ran" value={nodeRuns.length} mono />
            </div>

            {errorMsg && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-warning font-mono break-words">{errorMsg}</div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 flex items-center gap-1 border-b border-border">
            {[
              { key: 'overview', label: 'Node Timeline', icon: Activity },
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
            <div className="p-5 space-y-2">
              {nodeRuns.length === 0 && (
                <div className="text-xs text-text-muted text-center py-6">
                  No node-level data captured for this execution.
                </div>
              )}
              {nodeRuns.map(([name, runs]) => (
                <NodeRunRow key={name} name={name} runs={runs} />
              ))}
            </div>
          )}

          {tab === 'json' && (
            <div className="p-5">
              <pre className="text-[10px] font-mono text-text-secondary bg-background border border-border rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                {JSON.stringify(execution, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
