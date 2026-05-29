/**
 * n8n API client — single source of truth for all REST calls.
 * Auth header is injected server-side: by the Vite dev proxy locally,
 * and by /api/proxy.js (reading N8N_API_KEY env) on Vercel.
 */

import { getAppPassword, notifyAuthExpired } from './auth';

const BASE_URL = '/api/v1';

export const N8N_PUBLIC_URL = 'https://n8n.workflowsolution.org';

// The app password is attached to every request; the proxy checks it before
// it will use the real n8n API key. Read lazily so a fresh login is picked up.
function authHeaders() {
  return { Accept: 'application/json', 'x-app-auth': getAppPassword() };
}

const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 401) {
    notifyAuthExpired();
    const err = new Error('401 Unauthorized — app password rejected');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message || body?.error || JSON.stringify(body);
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    const err = new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ── Workflows ─────────────────────────────────────────────────── */

export async function listWorkflows({ active, limit = 250 } = {}) {
  const params = new URLSearchParams();
  if (active != null) params.set('active', String(active));
  if (limit) params.set('limit', String(limit));
  const data = await request(`/workflows?${params.toString()}`);
  return data.data || data;
}

export function getWorkflow(id) {
  return request(`/workflows/${id}`);
}

export async function activateWorkflow(id) {
  return request(`/workflows/${id}/activate`, { method: 'POST', headers: jsonHeaders });
}

export async function deactivateWorkflow(id) {
  return request(`/workflows/${id}/deactivate`, { method: 'POST', headers: jsonHeaders });
}

export async function setWorkflowActive(id, active) {
  return active ? activateWorkflow(id) : deactivateWorkflow(id);
}

export async function deleteWorkflow(id) {
  return request(`/workflows/${id}`, { method: 'DELETE' });
}

/* ── Executions ────────────────────────────────────────────────── */

export async function listExecutions({
  status,
  workflowId,
  limit = 100,
  cursor,
  includeData = false,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (workflowId) params.set('workflowId', workflowId);
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  if (includeData) params.set('includeData', 'true');
  return request(`/executions?${params.toString()}`);
}

export function getExecution(id, { includeData = true } = {}) {
  return request(`/executions/${id}?includeData=${includeData}`);
}

export function deleteExecution(id) {
  return request(`/executions/${id}`, { method: 'DELETE' });
}

/* ── Tags ──────────────────────────────────────────────────────── */

export async function listTags() {
  const data = await request('/tags');
  return data.data || data;
}

/* ── Health ────────────────────────────────────────────────────── */

export async function pingN8n() {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/workflows?limit=1`, { headers: authHeaders() });
    const ms = Math.round(performance.now() - t0);
    if (res.status === 401) notifyAuthExpired();
    return { ok: res.ok, status: res.status, latencyMs: ms };
  } catch (err) {
    return { ok: false, status: 0, latencyMs: null, error: err.message };
  }
}
