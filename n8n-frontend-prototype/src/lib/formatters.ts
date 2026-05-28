// Relative human-readable time formatter (e.g. "Just now", "2m ago")
export function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return 'N/A';
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Duration calculator (e.g. "965ms", "1.2s", "2m 15s")
export function formatDuration(startedAt: string | undefined, stoppedAt: string | undefined): string {
  if (!startedAt) return '0ms';
  const start = new Date(startedAt).getTime();
  const stop = stoppedAt ? new Date(stoppedAt).getTime() : new Date().getTime();
  const diffMs = stop - start;
  if (isNaN(diffMs) || diffMs < 0) return '0ms';
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

// Parse a duration string back to ms for computation
export function parseDurationMs(durStr: string): number {
  if (!durStr) return 0;
  // "2m 15s" format
  const mMatch = durStr.match(/(\d+)m/);
  const sMatchFull = durStr.match(/(\d+(?:\.\d+)?)s/);
  const msMatch = durStr.match(/(\d+)ms/);
  
  if (msMatch && !sMatchFull) return parseInt(msMatch[1]) || 0;
  
  let total = 0;
  if (mMatch) total += parseInt(mMatch[1]) * 60000;
  if (sMatchFull) total += parseFloat(sMatchFull[1]) * 1000;
  if (msMatch) total += parseInt(msMatch[1]);
  return total || 0;
}

// Format ms to human-readable duration
export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

// Format a date string to a short local format
export function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Detect trigger type from node types
export function detectTriggerType(nodes: any[]): 'webhook' | 'cron' | 'manual' | 'event' | 'unknown' {
  if (!nodes || nodes.length === 0) return 'unknown';
  const triggerNode = nodes.find((n: any) => {
    const type = (n.type || '').toLowerCase();
    return type.includes('trigger') || type.includes('webhook') || type.includes('cron') || type.includes('schedule');
  });
  if (!triggerNode) return 'manual';
  const type = (triggerNode.type || '').toLowerCase();
  if (type.includes('webhook')) return 'webhook';
  if (type.includes('cron') || type.includes('schedule')) return 'cron';
  if (type.includes('manualtrigger') || type.includes('manual')) return 'manual';
  return 'event';
}

// Truncate a string with ellipsis
export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
