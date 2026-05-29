import { useEffect, useState } from 'react';
import { Server, Key, Globe, RefreshCw, Activity, Code2, ExternalLink } from 'lucide-react';
import { N8N_PUBLIC_URL, pingN8n } from '../lib/n8nClient';

function Row({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-text-primary text-right truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-brand" />
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [health, setHealth] = useState({ ok: null, latencyMs: null, status: null });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    const r = await pingN8n();
    setHealth(r);
    setBusy(false);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const authRoute = import.meta.env.DEV
    ? 'Vite dev proxy (X-N8N-API-KEY injected)'
    : '/api/proxy (Vercel function, X-N8N-API-KEY injected)';

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl">
      <Card icon={Server} title="Connection">
        <Row
          label="Status"
          value={
            <span className="flex items-center gap-2 justify-end">
              {health.ok ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-success">Connected</span>
                </>
              ) : health.ok === false ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-warning">Disconnected</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-text-muted">Checking…</span>
                </>
              )}
            </span>
          }
        />
        <Row label="Endpoint" value={N8N_PUBLIC_URL} mono />
        <Row label="HTTP status" value={health.status ?? '—'} mono />
        <Row
          label="Latency"
          value={health.latencyMs != null ? `${health.latencyMs}ms` : '—'}
          mono
        />
        <Row label="Auth header" value="X-N8N-API-KEY" mono />
        <Row label="Auth routing" value={authRoute} mono />
        <Row label="API key" value="server-side (N8N_API_KEY env)" mono />

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={refresh}
            disabled={busy}
            className="text-xs font-medium text-text-primary border border-border rounded px-3 py-1.5 flex items-center gap-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> Test connection
          </button>
          <a
            href={`${N8N_PUBLIC_URL}/settings`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded px-3 py-1.5 flex items-center gap-1.5 hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink size={12} /> Open n8n settings
          </a>
        </div>
      </Card>

      <Card icon={Activity} title="Auto-refresh intervals">
        <Row label="Executions stream" value="15s" mono />
        <Row label="Workflows list" value="30s" mono />
        <Row label="Health probe" value="15–20s" mono />
        <Row label="On-screen drawers" value="paused when closed" />
      </Card>

      <Card icon={Globe} title="About this terminal">
        <Row label="Build" value="n8n.terminal v1" mono />
        <Row label="React" value="19" mono />
        <Row label="Mode" value={import.meta.env.MODE || 'development'} mono />
        <Row label="Dev proxy" value={`/api → ${N8N_PUBLIC_URL}`} mono />
        <div className="text-[11px] text-text-muted mt-3 leading-relaxed">
          A read/manage console for your n8n instance. All actions go directly to the n8n public API.
          Workflow edits still live in the official editor — this terminal owns observability and
          quick-control surface area.
        </div>
      </Card>

      <Card icon={Code2} title="Keyboard shortcuts">
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <span className="text-text-secondary">Command palette</span>
          <span className="text-right font-mono text-text-primary">⌘ K / Ctrl K</span>
          <span className="text-text-secondary">Switch tab — Pulse</span>
          <span className="text-right font-mono text-text-primary">G P</span>
          <span className="text-text-secondary">Switch tab — Workflows</span>
          <span className="text-right font-mono text-text-primary">G W</span>
          <span className="text-text-secondary">Switch tab — Executions</span>
          <span className="text-right font-mono text-text-primary">G E</span>
          <span className="text-text-secondary">Switch tab — Insights</span>
          <span className="text-right font-mono text-text-primary">G I</span>
          <span className="text-text-secondary">Close drawer / palette</span>
          <span className="text-right font-mono text-text-primary">Esc</span>
        </div>
      </Card>
    </div>
  );
}
