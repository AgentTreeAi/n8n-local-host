/* ── time / duration formatting ────────────────────────────────── */

export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = Math.round(seconds % 60);
  if (minutes < 60) return remSec ? `${minutes}m ${remSec}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin ? `${hours}h ${remMin}m` : `${hours}h`;
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const s = Math.floor(diffMs / 1000);
  if (s < 30) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? '1 min ago' : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? '1h ago' : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return w === 1 ? '1w ago' : `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatAbsolute(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatNumber(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ── execution derivations ─────────────────────────────────────── */

export function execDurationMs(exec) {
  if (!exec) return null;
  if (!exec.startedAt || !exec.stoppedAt) return null;
  const ms = new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime();
  return ms >= 0 ? ms : null;
}

export function execIsRunning(exec) {
  if (!exec) return false;
  if (exec.finished) return false;
  if (exec.status === 'running' || exec.status === 'waiting') return true;
  return !exec.stoppedAt;
}

export function execStatusLabel(exec) {
  if (!exec) return 'unknown';
  if (execIsRunning(exec)) return exec.status === 'waiting' ? 'waiting' : 'running';
  return exec.status || (exec.finished ? 'success' : 'unknown');
}

export function modeLabel(mode) {
  return (
    {
      manual: 'Manual',
      trigger: 'Trigger',
      webhook: 'Webhook',
      schedule: 'Schedule',
      retry: 'Retry',
      integrated: 'Sub-WF',
      internal: 'Internal',
      error: 'Error',
    }[mode] || mode || '—'
  );
}

/* ── aggregations ──────────────────────────────────────────────── */

export function computeStats(executions) {
  const base = {
    total: 0,
    success: 0,
    error: 0,
    waiting: 0,
    running: 0,
    successRate: 0,
    avgDurationMs: 0,
    p95DurationMs: 0,
  };
  if (!executions || executions.length === 0) return base;

  let totalDur = 0;
  let durCount = 0;
  const durs = [];
  let success = 0,
    error = 0,
    waiting = 0,
    running = 0;

  for (const e of executions) {
    const s = execStatusLabel(e);
    if (s === 'success') success++;
    else if (s === 'error') error++;
    else if (s === 'waiting') waiting++;
    else if (s === 'running') running++;
    const d = execDurationMs(e);
    if (d != null) {
      totalDur += d;
      durCount++;
      durs.push(d);
    }
  }

  durs.sort((a, b) => a - b);
  const p95 = durs.length ? durs[Math.min(durs.length - 1, Math.floor(durs.length * 0.95))] : 0;

  const finished = success + error;
  return {
    total: executions.length,
    success,
    error,
    waiting,
    running,
    successRate: finished > 0 ? Math.round((success / finished) * 100) : 0,
    avgDurationMs: durCount ? Math.round(totalDur / durCount) : 0,
    p95DurationMs: p95,
  };
}

/* ── 24h bucketed volume (hour-level) ──────────────────────────── */
export function bucketByHour(executions, hours = 24, now = Date.now()) {
  const buckets = [];
  for (let i = hours - 1; i >= 0; i--) {
    const t = now - i * 3600_000;
    const d = new Date(t);
    const hour = d.getHours();
    buckets.push({
      ts: t,
      label: `${String(hour).padStart(2, '0')}:00`,
      success: 0,
      error: 0,
      other: 0,
      total: 0,
    });
  }
  const firstTs = buckets[0].ts - 3600_000;
  for (const exec of executions) {
    const start = exec.startedAt ? new Date(exec.startedAt).getTime() : null;
    if (start == null || start < firstTs) continue;
    const idx = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((start - firstTs) / 3600_000) - 1),
    );
    const b = buckets[idx];
    if (!b) continue;
    const s = execStatusLabel(exec);
    if (s === 'success') b.success++;
    else if (s === 'error') b.error++;
    else b.other++;
    b.total++;
  }
  return buckets;
}

/* ── heatmap (day-of-week × hour) ──────────────────────────────── */
export function buildHeatmap(executions) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of executions) {
    if (!e.startedAt) continue;
    const d = new Date(e.startedAt);
    const dow = d.getDay();
    const hr = d.getHours();
    grid[dow][hr]++;
  }
  return grid;
}

/* ── workflow grouping ─────────────────────────────────────────── */
export function groupByWorkflow(executions, workflows = []) {
  const nameMap = new Map(workflows.map((w) => [w.id, w.name]));
  const groups = new Map();
  for (const exec of executions) {
    const wfId = exec.workflowId;
    if (!wfId) continue;
    if (!groups.has(wfId)) {
      groups.set(wfId, {
        id: wfId,
        name: nameMap.get(wfId) || `Workflow ${wfId}`,
        executions: [],
      });
    }
    groups.get(wfId).executions.push(exec);
  }
  return groups;
}

export function workflowHealth(executions) {
  if (!executions || executions.length === 0) return 'unknown';
  const recent = executions.slice(0, 10);
  const errors = recent.filter((e) => execStatusLabel(e) === 'error').length;
  const ratio = errors / recent.length;
  if (ratio === 0) return 'healthy';
  if (ratio <= 0.2) return 'healthy';
  if (ratio <= 0.5) return 'degraded';
  return 'failing';
}

/* ── trigger summary from workflow nodes ───────────────────────── */
export function summarizeTriggers(workflow) {
  const nodes = workflow?.nodes || [];
  const triggers = nodes.filter((n) => {
    const t = (n.type || '').toLowerCase();
    return (
      t.endsWith('trigger') ||
      t.includes('webhook') ||
      t === 'n8n-nodes-base.manualtrigger'
    );
  });
  if (triggers.length === 0) return { count: 0, label: 'No trigger', kinds: [] };
  const kinds = [
    ...new Set(
      triggers.map((t) => {
        const id = (t.type || '').replace('n8n-nodes-base.', '');
        if (id.includes('webhook')) return 'Webhook';
        if (id.includes('schedule')) return 'Schedule';
        if (id.includes('manual')) return 'Manual';
        if (id.includes('cron')) return 'Cron';
        return id.replace(/Trigger$/i, '');
      }),
    ),
  ];
  return {
    count: triggers.length,
    label: kinds.join(' · '),
    kinds,
  };
}

export function nodeShortName(type) {
  if (!type) return '?';
  return type.replace(/^n8n-nodes-base\./i, '').replace(/^@n8n\//i, '');
}

/* ── sub-workflow dependency extraction ────────────────────────── */

/** Pull the target workflow id out of an Execute-Sub-workflow node, across the
 *  several shapes n8n has used (plain string, resource-locator object, or the
 *  older { source, workflowId } form). Returns null when nothing resolvable. */
export function subworkflowTargetId(node) {
  const type = (node?.type || '').toLowerCase();
  if (!type.includes('executeworkflow') && !type.includes('executesubworkflow')) return null;
  const wf = node?.parameters?.workflowId;
  if (wf == null) return null;
  if (typeof wf === 'string') return wf || null;
  if (typeof wf === 'object') return wf.value ?? wf.id ?? null;
  return null;
}

/** Build a directed graph of caller → sub-workflow relationships.
 *  Only workflows that participate in at least one edge become nodes; the rest
 *  are reported as `isolated` so the canvas stays legible. */
export function buildDependencyGraph(workflows = []) {
  const byId = new Map(workflows.map((w) => [String(w.id), w]));
  const edges = [];
  const seen = new Set();

  for (const w of workflows) {
    for (const node of w.nodes || []) {
      const target = subworkflowTargetId(node);
      if (target == null) continue;
      const targetId = String(target);
      if (String(w.id) === targetId) continue; // ignore self-calls
      const key = `${w.id}->${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        source: String(w.id),
        target: targetId,
        label: node.name || nodeShortName(node.type),
        // target may be an external/unknown id not in our list
        resolved: byId.has(targetId),
      });
    }
  }

  const connectedIds = new Set();
  edges.forEach((e) => {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  });

  const indeg = new Map();
  const outdeg = new Map();
  connectedIds.forEach((id) => {
    indeg.set(id, 0);
    outdeg.set(id, 0);
  });
  edges.forEach((e) => {
    outdeg.set(e.source, (outdeg.get(e.source) || 0) + 1);
    indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
  });

  const nodes = [...connectedIds].map((id) => {
    const wf = byId.get(id);
    const incoming = indeg.get(id) || 0;
    const outgoing = outdeg.get(id) || 0;
    let role = 'link'; // both calls and is called
    if (incoming === 0 && outgoing > 0) role = 'orchestrator';
    else if (incoming > 0 && outgoing === 0) role = 'subworkflow';
    return {
      id,
      name: wf?.name || (byId.has(id) ? `Workflow ${id}` : `External ${id}`),
      active: wf?.active ?? null,
      missing: !byId.has(id),
      incoming,
      outgoing,
      role,
    };
  });

  const isolated = workflows.filter((w) => !connectedIds.has(String(w.id)));
  return { nodes, edges, isolated };
}

/** Assign each node an integer column = longest path from a root, with a guard
 *  against cycles. Roots (no incoming edges) sit at depth 0. */
export function layerGraph(nodes, edges) {
  const adj = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
  });
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  const roots = nodes.filter((n) => n.incoming === 0).map((n) => n.id);
  const starts = roots.length ? roots : nodes.map((n) => n.id);

  const MAX = nodes.length + 1;
  const stack = starts.map((id) => [id, 0, new Set([id])]);
  while (stack.length) {
    const [id, d, path] = stack.pop();
    if (d > (depth.get(id) || 0)) depth.set(id, Math.min(d, MAX));
    for (const next of adj.get(id) || []) {
      if (path.has(next)) continue; // cycle guard
      stack.push([next, d + 1, new Set([...path, next])]);
    }
  }
  return depth;
}

/* ── node-type composition across all workflows ────────────────── */
export function countNodeTypes(workflows = [], topN = 14) {
  const counts = new Map();
  let total = 0;
  for (const w of workflows) {
    for (const node of w.nodes || []) {
      const name = nodeShortName(node.type);
      counts.set(name, (counts.get(name) || 0) + 1);
      total += 1;
    }
  }
  const sorted = [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const restValue = sorted.slice(topN).reduce((acc, x) => acc + x.value, 0);
  if (restValue > 0) top.push({ name: `+${sorted.length - topN} others`, value: restValue, isRest: true });
  return { items: top, total, distinct: sorted.length };
}
