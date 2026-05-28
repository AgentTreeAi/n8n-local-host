import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Settings as SettingsIcon,
  Database,
  ExternalLink,
  BarChart3,
  ListChecks,
  Search,
  CircleDot,
} from 'lucide-react';

import { useExecutions, useWorkflows, useN8nHealth } from './hooks/useN8n';
import { N8N_PUBLIC_URL } from './lib/n8nClient';

import Pulse from './components/Pulse';
import Workflows from './components/Workflows';
import Insights from './components/Insights';
import Settings from './components/Settings';
import ExecutionStream from './components/ExecutionStream';
import ExecutionDetailDrawer from './components/ExecutionDetailDrawer';
import WorkflowDetailDrawer from './components/WorkflowDetailDrawer';
import CommandPalette from './components/CommandPalette';
import ToastStack from './components/Toast';

const TABS = [
  { key: 'monitor', label: 'Pulse', icon: Activity },
  { key: 'workflows', label: 'Workflows', icon: Database },
  { key: 'executions', label: 'Executions', icon: ListChecks },
  { key: 'insights', label: 'Insights', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function HealthPill({ health }) {
  const color =
    health.ok === true
      ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]'
      : health.ok === false
        ? 'bg-warning'
        : 'bg-zinc-600';
  const label =
    health.ok === true
      ? `Connected · ${health.latencyMs ?? '?'}ms`
      : health.ok === false
        ? 'Disconnected'
        : 'Connecting…';
  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-mono tabular-nums">{label}</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('monitor');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const pushToast = useCallback((t) => {
    toastId.current += 1;
    setToasts((arr) => [...arr, { ...t, id: toastId.current }]);
  }, []);
  const dismissToast = useCallback((id) => setToasts((arr) => arr.filter((t) => t.id !== id)), []);

  /* shared data — single source of truth, drives everything */
  const {
    executions,
    loading: execsLoading,
    error: execsError,
    refresh: refreshExecs,
    hasMore,
    loadMore,
  } = useExecutions({ limit: 100, refreshInterval: 15000 });

  const { workflows, refresh: refreshWfs } = useWorkflows({ refreshInterval: 30000 });
  const { health } = useN8nHealth({ refreshInterval: 15000 });

  /* notify on new failures since first paint */
  const seenFailedIds = useRef(new Set());
  const initialFailedScanned = useRef(false);
  useEffect(() => {
    if (!executions || executions.length === 0) return;
    const failures = executions.filter((e) => e.status === 'error');
    if (!initialFailedScanned.current) {
      failures.forEach((f) => seenFailedIds.current.add(f.id));
      initialFailedScanned.current = true;
      return;
    }
    failures.forEach((f) => {
      if (seenFailedIds.current.has(f.id)) return;
      seenFailedIds.current.add(f.id);
      const name = workflows.find((w) => w.id === f.workflowId)?.name || `Workflow ${f.workflowId}`;
      pushToast({
        kind: 'error',
        message: `Execution #${f.id} failed in "${name}"`,
        ttl: 6000,
      });
    });
  }, [executions, workflows, pushToast]);

  /* keyboard: cmd-k + g-X tab jumps */
  useEffect(() => {
    let gPending = false;
    let gTimer = null;
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (typing) return;
      if (e.key === 'g' && !gPending) {
        gPending = true;
        gTimer = setTimeout(() => {
          gPending = false;
        }, 700);
        return;
      }
      if (gPending) {
        const map = { p: 'monitor', w: 'workflows', e: 'executions', i: 'insights', s: 'settings' };
        const t = map[e.key.toLowerCase()];
        if (t) {
          setTab(t);
          gPending = false;
          clearTimeout(gTimer);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const removeExecutionFromState = useCallback(
    (id) => {
      refreshExecs();
      if (selectedExecution?.id === id) setSelectedExecution(null);
    },
    [refreshExecs, selectedExecution],
  );

  const tabContent = useMemo(() => {
    if (tab === 'monitor')
      return (
        <Pulse
          executions={executions}
          workflows={workflows}
          loading={execsLoading}
          error={execsError}
          onRefresh={refreshExecs}
          onSelectExecution={setSelectedExecution}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onAfterDelete={removeExecutionFromState}
          pushToast={pushToast}
        />
      );
    if (tab === 'workflows')
      return (
        <div className="p-4 md:p-8">
          <Workflows onSelect={setSelectedWorkflow} pushToast={pushToast} />
        </div>
      );
    if (tab === 'executions')
      return (
        <div className="p-4 md:p-8">
          <ExecutionStream
            executions={executions}
            workflows={workflows}
            loading={execsLoading}
            error={execsError}
            onRefresh={refreshExecs}
            onSelect={setSelectedExecution}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onAfterDelete={removeExecutionFromState}
            pushToast={pushToast}
          />
        </div>
      );
    if (tab === 'insights')
      return (
        <div className="p-4 md:p-8">
          <Insights onSelectWorkflow={setSelectedWorkflow} />
        </div>
      );
    if (tab === 'settings')
      return (
        <div className="p-4 md:p-8">
          <Settings />
        </div>
      );
    return null;
  }, [
    tab,
    executions,
    workflows,
    execsLoading,
    execsError,
    refreshExecs,
    hasMore,
    loadMore,
    removeExecutionFromState,
    pushToast,
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand selection:text-white text-sm">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand rounded-md text-white flex items-center justify-center font-bold text-lg leading-none shadow-brand">
            n
          </div>
          <h1 className="font-semibold text-lg tracking-tight text-text-primary">
            n8n<span className="text-text-muted font-normal">.terminal</span>
          </h1>
          <div className="hidden md:flex items-center gap-2 ml-4 text-[11px] text-text-muted font-mono">
            <CircleDot size={10} className="text-brand" /> {N8N_PUBLIC_URL.replace('https://', '')}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-background border border-border p-1 rounded-lg">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-card border border-border text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary border border-border bg-background rounded-md px-2.5 py-1.5 transition-colors"
            title="Command palette (Cmd+K)"
          >
            <Search size={12} />
            <span className="font-mono">Search</span>
            <kbd className="text-[9px] font-mono text-text-muted border border-border rounded px-1 py-0.5 ml-1">
              ⌘K
            </kbd>
          </button>
          <HealthPill health={health} />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-background">
        <aside className="w-14 border-r border-border bg-card flex flex-col items-center py-5 gap-2 z-10 relative hidden sm:flex">
          <a
            href={`${N8N_PUBLIC_URL}/workflows`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-text-secondary hover:text-brand transition-colors rounded-lg group relative"
            title="Open n8n editor"
          >
            <ExternalLink size={18} />
            <span className="absolute left-12 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-border text-text-primary rounded shadow-lg">
              Open editor
            </span>
          </a>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`p-2 transition-colors rounded-lg group relative ${
                  active
                    ? 'text-brand bg-brand/10 border border-brand/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
                title={t.label}
              >
                <t.icon size={18} />
                <span className="absolute left-12 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-border text-text-primary rounded shadow-lg">
                  {t.label}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="flex-1 overflow-auto relative">
          <div className="mx-auto w-full max-w-[1500px]">{tabContent}</div>
        </div>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        workflows={workflows}
        executions={executions}
        onGo={setTab}
        onSelectWorkflow={setSelectedWorkflow}
        onSelectExecution={setSelectedExecution}
      />

      <ExecutionDetailDrawer
        executionId={selectedExecution?.id || null}
        workflowName={
          selectedExecution
            ? workflows.find((w) => w.id === selectedExecution.workflowId)?.name
            : null
        }
        onClose={() => setSelectedExecution(null)}
        pushToast={pushToast}
        onDeleted={removeExecutionFromState}
      />

      <WorkflowDetailDrawer
        workflowSummary={selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        onSelectExecution={(e) => {
          setSelectedWorkflow(null);
          setSelectedExecution(e);
        }}
        pushToast={pushToast}
        onChanged={refreshWfs}
      />

      <ToastStack toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
