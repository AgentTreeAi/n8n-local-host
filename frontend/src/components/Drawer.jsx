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
        <header className="flex items-start justify-between gap-3 p-5 border-b border-border bg-zinc-900/40">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5 font-mono truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-white/5 transition-colors shrink-0"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && <div className="border-t border-border p-4 bg-background">{footer}</div>}
      </div>
    </div>
  );
}
