import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLOR = {
  success: 'text-success border-success/30 bg-success/10',
  error: 'text-warning border-warning/30 bg-warning/10',
  info: 'text-brand border-brand/30 bg-brand/10',
};

export default function ToastStack({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)_+_80px)] md:bottom-5 right-4 md:right-5 z-[60] flex flex-col gap-2 max-w-[calc(100vw_-_2rem)] md:max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const Icon = ICON[toast.kind] || Info;
  useEffect(() => {
    const ttl = toast.ttl ?? 3500;
    if (ttl <= 0) return undefined;
    const id = setTimeout(onDismiss, ttl);
    return () => clearTimeout(id);
  }, [toast.id, toast.ttl, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 border rounded-lg px-3 py-2.5 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-5 fade-in duration-200 ${COLOR[toast.kind] || COLOR.info}`}
    >
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span className="text-sm text-text-primary flex-1 leading-snug">{toast.message}</span>
      <button onClick={onDismiss} className="text-text-secondary hover:text-text-primary">
        <X size={14} />
      </button>
    </div>
  );
}
