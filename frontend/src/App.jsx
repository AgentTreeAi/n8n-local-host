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
import { isAuthenticated } from './lib/auth';
import Login from './components/Login';

import Pulse from './components/Pulse';
import Workflows from './components/Workflows';
import Insights from './components/Insights';
import Settings from './components/Settings';
import ExecutionStream from './components/ExecutionStream';
import ExecutionDetailDrawer from './components/ExecutionDetailDrawer';
import WorkflowDetailDrawer from './components/WorkflowDetailDrawer';
import CommandPalette from './components/CommandPalette';
import ToastStack from './components/Toast';
import { ThemeSwitcher } from './components/ThemeSwitcher';

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

function Dashboard() {
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand selection:text-white text-sm bg-transparent">
      <header
        className="border-b border-white/5 bg-background/70 backdrop-blur-xl px-6 py-3 flex items-center justify-between z-50 sticky top-0 shadow-sm shadow-black/20"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand rounded-md text-white flex items-center justify-center font-bold text-lg leading-none shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-105 cursor-default">
            n
          </div>
          <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            n8n<span className="text-zinc-500 font-normal">.terminal</span>
          </h1>
          <div className="hidden md:flex items-center gap-2 ml-4 text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
            <CircleDot size={10} className="text-brand animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)] rounded-full" /> {N8N_PUBLIC_URL.replace('https://', '')}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-lg backdrop-blur-md shadow-inner">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ease-out flex items-center gap-1.5 border ${
                  active
                    ? 'bg-white/10 border-white/10 text-white shadow-sm shadow-black/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
            className="hidden md:flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 border border-white/5 bg-white/5 hover:bg-white/10 rounded-md px-2.5 py-1.5 transition-all duration-300 ease-out shadow-inner"
            title="Command palette (Cmd+K)"
          >
            <Search size={12} />
            <span className="font-mono">Search</span>
            <kbd className="text-[9px] font-mono text-zinc-500 border border-white/10 rounded px-1 py-0.5 ml-1 bg-black/40">
              ⌘K
            </kbd>
          </button>
          <ThemeSwitcher />
          <div className="bg-black/40 border border-white/5 rounded-md px-2 py-1.5 backdrop-blur-md shadow-inner">
            <HealthPill health={health} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-transparent">
        <aside className="w-14 border-r border-white/5 bg-background/60 backdrop-blur-xl flex flex-col items-center py-5 gap-2 z-40 relative hidden md:flex shadow-sm shadow-black/20">
          <a
            href={`${N8N_PUBLIC_URL}/workflows`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-white transition-all duration-300 ease-out rounded-lg group relative hover:scale-105 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            title="Open n8n editor"
          >
            <ExternalLink size={18} />
            <span className="absolute left-12 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-white/10 text-white rounded shadow-xl backdrop-blur-md">
              Open editor
            </span>
          </a>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`p-2 transition-all duration-300 ease-out rounded-lg group relative hover:scale-105 ${
                  active
                    ? 'text-brand bg-brand/15 border border-brand/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
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

        <div className="flex-1 overflow-auto relative overscroll-y-contain pb-[calc(env(safe-area-inset-bottom)_+_80px)] md:pb-0">
          <div className="mx-auto w-full max-w-[1500px]">{tabContent}</div>
        </div>
      </main>

      {/* iOS Style Bottom Sticky Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/80 border-t border-white/5 backdrop-blur-xl flex justify-around items-center pt-2 pb-[calc(env(safe-area-inset-bottom)_+_8px)] px-[max(12px,env(safe-area-inset-left))] shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 transition-all duration-300 rounded-lg ${
                active 
                  ? 'text-brand scale-105 bg-brand/10' 
                  : 'text-zinc-500 active:text-zinc-300'
              }`}
            >
              <t.icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''} />
              <span className="text-[10px] font-medium tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </nav>

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

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    const onExpired = () => setAuthed(false);
    window.addEventListener('app-auth-expired', onExpired);
    return () => window.removeEventListener('app-auth-expired', onExpired);
  }, []);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard />;
}
