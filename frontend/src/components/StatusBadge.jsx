import { Check, X, Clock, Pause, HelpCircle } from 'lucide-react';

const STYLES = {
  success: 'text-success bg-success/10 border-success/20',
  error: 'text-warning bg-warning/10 border-warning/20',
  failed: 'text-warning bg-warning/10 border-warning/20',
  running: 'text-brand bg-brand/10 border-brand/20',
  waiting: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  unknown: 'text-text-muted bg-zinc-800/50 border-zinc-700',
  canceled: 'text-text-muted bg-zinc-800/50 border-zinc-700',
  crashed: 'text-warning bg-warning/10 border-warning/20',
};

const ICONS = {
  success: Check,
  error: X,
  failed: X,
  running: Clock,
  waiting: Pause,
  unknown: HelpCircle,
  canceled: X,
  crashed: X,
};

export default function StatusBadge({ status }) {
  const key = String(status || 'unknown').toLowerCase();
  const Icon = ICONS[key] || HelpCircle;
  const className = STYLES[key] || STYLES.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium border px-2 py-0.5 rounded tracking-wider uppercase ${className}`}
    >
      <Icon
        size={10}
        strokeWidth={3}
        className={key === 'running' ? 'animate-spin' : ''}
      />
      {key}
    </span>
  );
}
