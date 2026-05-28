import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Workflow, Activity, BarChart3, Settings as SettingsIcon, ArrowRight, ExternalLink, Power, Hash } from 'lucide-react';
import { N8N_PUBLIC_URL } from '../lib/n8nClient';

export default function CommandPalette({
  open,
  onClose,
  workflows = [],
  executions = [],
  onSelectWorkflow,
  onSelectExecution,
  onGo,
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const navItems = [
      { type: 'nav', id: 'monitor', label: 'Go to Pulse', icon: Activity, action: () => onGo('monitor') },
      { type: 'nav', id: 'workflows', label: 'Go to Workflows', icon: Workflow, action: () => onGo('workflows') },
      { type: 'nav', id: 'executions', label: 'Go to Executions', icon: Activity, action: () => onGo('executions') },
      { type: 'nav', id: 'insights', label: 'Go to Insights', icon: BarChart3, action: () => onGo('insights') },
      { type: 'nav', id: 'settings', label: 'Go to Settings', icon: SettingsIcon, action: () => onGo('settings') },
      {
        type: 'nav',
        id: 'open-editor',
        label: 'Open n8n editor',
        icon: ExternalLink,
        action: () => window.open(`${N8N_PUBLIC_URL}/workflows`, '_blank'),
      },
    ];
    const wfItems = workflows.map((w) => ({
      type: 'workflow',
      id: w.id,
      label: w.name,
      sub: w.active ? 'Active' : 'Inactive',
      icon: Power,
      iconColor: w.active ? 'text-success' : 'text-text-muted',
      action: () => onSelectWorkflow(w),
    }));
    const execItems = executions.slice(0, 30).map((e) => ({
      type: 'execution',
      id: `e-${e.id}`,
      label: `#${e.id} — ${e.workflowData?.name || 'Workflow ' + e.workflowId}`,
      sub: e.status,
      icon: Hash,
      action: () => onSelectExecution(e),
    }));
    return [...navItems, ...wfItems, ...execItems];
  }, [workflows, executions, onGo, onSelectWorkflow, onSelectExecution]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items.slice(0, 20);
    const needle = q.toLowerCase();
    return items
      .filter((i) => i.label.toLowerCase().includes(needle) || String(i.id).includes(needle))
      .slice(0, 30);
  }, [items, q]);

  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const runActive = () => {
    const item = filtered[active];
    if (!item) return;
    item.action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" />
      <div
        className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(filtered.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runActive();
              }
            }}
            placeholder="Type a workflow name, execution ID, or command…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted text-text-primary"
          />
          <kbd className="text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5 bg-background">
            esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="text-xs text-text-muted text-center py-8">No matches</div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === active;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-brand/10 border-l-2 border-brand' : 'border-l-2 border-transparent hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={item.iconColor || 'text-text-secondary'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{item.label}</div>
                    {item.sub && (
                      <div className="text-[10px] text-text-muted font-mono uppercase">{item.sub}</div>
                    )}
                  </div>
                  {isActive && <ArrowRight size={12} className="text-brand" />}
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-background flex items-center justify-between text-[10px] text-text-muted font-mono">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
