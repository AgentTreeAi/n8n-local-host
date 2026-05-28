import { useState, useEffect, useCallback, useRef } from 'react';

const API_KEY = import.meta.env.VITE_N8N_API_KEY;
const BASE_URL = '/api/v1';

const headers = {
  'Accept': 'application/json',
  'X-N8N-API-KEY': API_KEY,
};

/**
 * Fetch a page of executions from the n8n API
 */
async function fetchExecutions({ status, workflowId, limit = 100, cursor } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (workflowId) params.set('workflowId', workflowId);
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/executions?${params.toString()}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all workflows from the n8n API
 */
async function fetchWorkflows() {
  const response = await fetch(`${BASE_URL}/workflows`, { headers });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // The API returns { data: [...] } for workflows
  return data.data || data;
}

/**
 * Custom hook for fetching and auto-refreshing execution data
 * 
 * @param {Object} options
 * @param {string} options.status - Filter by status ('success', 'error', 'waiting')
 * @param {string} options.workflowId - Filter by workflow ID
 * @param {number} options.limit - Max results per page
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (default 30s)
 * @param {boolean} options.enabled - Whether to fetch data (default true)
 */
export function useExecutions({
  status,
  workflowId,
  limit = 100,
  refreshInterval = 30000,
  enabled = true,
} = {}) {
  const [executions, setExecutions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async (cursor = null) => {
    if (!enabled) return;
    
    try {
      if (!cursor) setLoading(true);
      setError(null);

      const data = await fetchExecutions({ status, workflowId, limit, cursor });
      const results = data.data || [];

      if (cursor) {
        // Append for pagination
        setExecutions(prev => [...prev, ...results]);
      } else {
        // Fresh load
        setExecutions(results);
      }

      setNextCursor(data.nextCursor || null);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch executions:', err);
    } finally {
      setLoading(false);
    }
  }, [status, workflowId, limit, enabled]);

  // Initial load + refresh on filter changes
  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    intervalRef.current = setInterval(() => {
      load();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, refreshInterval, enabled]);

  const loadMore = useCallback(() => {
    if (nextCursor) load(nextCursor);
  }, [nextCursor, load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return {
    executions,
    loading,
    error,
    lastFetched,
    hasMore: !!nextCursor,
    loadMore,
    refresh,
  };
}

/**
 * Toggle a workflow's active state via the n8n API
 * @param {string} workflowId - The workflow ID
 * @param {boolean} active - Whether to activate (true) or deactivate (false)
 */
export async function activateWorkflow(workflowId, active) {
  const response = await fetch(`${BASE_URL}/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Custom hook for fetching workflow list with auto-refresh
 *
 * @param {Object} options
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (default 30s)
 * @param {boolean} options.enabled - Whether to fetch data (default true)
 */
export function useWorkflows({ refreshInterval = 30000, enabled = true } = {}) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkflows();
      setWorkflows(data);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    intervalRef.current = setInterval(() => {
      load();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, refreshInterval, enabled]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { workflows, loading, error, lastFetched, refresh };
}
