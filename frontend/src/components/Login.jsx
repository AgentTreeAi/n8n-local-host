import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { setAppPassword, clearAppPassword } from '../lib/auth';

/**
 * App-password gate. Verifies the entered password against the proxy by making
 * a real (cheap) authenticated call; only a 200 unlocks the app.
 */
export default function Login({ onSuccess }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    setAppPassword(value);
    try {
      const res = await fetch('/api/v1/workflows?limit=1', {
        headers: { Accept: 'application/json', 'x-app-auth': value },
      });
      if (res.ok) {
        onSuccess();
        return;
      }
      clearAppPassword();
      setError(res.status === 401 ? 'Incorrect password.' : `Server error (${res.status}).`);
    } catch {
      clearAppPassword();
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-text-primary font-sans">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-7 shadow-xl relative z-40"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 bg-brand rounded-lg text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Lock size={16} />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">n8n.terminal</h1>
        </div>
        <p className="text-xs text-text-secondary mb-5">Enter the app password to continue.</p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="App password"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors relative z-50 cursor-text pointer-events-auto"
          autoComplete="current-password"
        />

        {error && <p className="text-xs text-warning mt-2">{error}</p>}

        <button
          type="submit"
          disabled={busy || !value}
          className="mt-4 w-full bg-brand text-white text-sm font-medium rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          {busy ? 'Verifying…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
