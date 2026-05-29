// Centralized n8n API client
// All requests go through /api/v1 which is proxied securely (Vite dev or Vercel serverless)

const BASE = '/api/v1';

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ── Workflows ──────────────────────────────────────────────

export async function fetchWorkflows(): Promise<any[]> {
  const json = await request('/workflows');
  return json.data || [];
}

export async function fetchWorkflow(id: string): Promise<any> {
  return request(`/workflows/${id}`);
}

export async function activateWorkflow(id: string): Promise<any> {
  return request(`/workflows/${id}/activate`, { method: 'POST' });
}

export async function deactivateWorkflow(id: string): Promise<any> {
  return request(`/workflows/${id}/deactivate`, { method: 'POST' });
}

// ── Executions ─────────────────────────────────────────────

export interface FetchExecutionsParams {
  status?: 'error' | 'success' | 'waiting';
  workflowId?: string;
  limit?: number;
}

export async function fetchExecutions(params?: FetchExecutionsParams): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.workflowId) searchParams.set('workflowId', params.workflowId);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const qs = searchParams.toString();
  const json = await request(`/executions${qs ? `?${qs}` : ''}`);
  return json.data || [];
}

export async function fetchExecutionsWithData(params: { workflowId: string; limit?: number }): Promise<any[]> {
  const sp = new URLSearchParams();
  sp.set('workflowId', params.workflowId);
  sp.set('includeData', 'true');
  if (params.limit) sp.set('limit', params.limit.toString());
  const json = await request(`/executions?${sp.toString()}`);
  return json.data || [];
}

export async function fetchExecution(id: string): Promise<any> {
  return request(`/executions/${id}`);
}

export async function retryExecution(id: string): Promise<any> {
  return request(`/executions/${id}/retry`, { method: 'POST' });
}

export async function deleteExecution(id: string): Promise<any> {
  return request(`/executions/${id}`, { method: 'DELETE' });
}

// ── Credentials ────────────────────────────────────────────

export async function fetchCredentials(): Promise<any[]> {
  try {
    const json = await request('/credentials');
    return json.data || [];
  } catch {
    // Credentials endpoint may not be available on all instances
    return [];
  }
}

// ── Health ─────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/healthz');
    return res.ok;
  } catch {
    return false;
  }
}
