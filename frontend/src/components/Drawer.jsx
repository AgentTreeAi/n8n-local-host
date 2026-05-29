import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, subtitle, width = 720, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className="relative ml-auto h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <header
          className="flex items-start justify-between gap-3 px-5 pb-4 border-b border-border bg-zinc-900/40"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5 font-mono truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors shrink-0 -mr-2 -mt-1"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-auto overscroll-y-contain">{children}</div>
        {footer && (
          <div
            className="border-t border-border px-4 pt-4 bg-background"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
