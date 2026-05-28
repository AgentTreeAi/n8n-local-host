import { Check, X, Clock, Pause, HelpCircle } from 'lucide-react';

const STYLES = {
  success: 'text-success bg-success/10 border-success/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
  error: 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
  failed: 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
  running: 'text-brand bg-brand/10 border-brand/20 shadow-[0_0_10px_rgba(99,102,241,0.25)]',
  waiting: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
  unknown: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  canceled: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  crashed: 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
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
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium border px-2 py-0.5 rounded-full tracking-wider uppercase backdrop-blur-sm transition-all duration-300 ${className} ${key === 'running' ? 'animate-pulse' : ''}`}
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
