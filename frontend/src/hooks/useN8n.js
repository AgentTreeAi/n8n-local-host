import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listExecutions,
  listWorkflows,
  getExecution,
  getWorkflow,
  pingN8n,
} from '../lib/n8nClient';

/* ── shared poller helper ──────────────────────────────────────── */
function usePoller(loader, deps, intervalMs) {
  const ref = useRef(null);
  useEffect(() => {
    loader();
    if (!intervalMs) return undefined;
    ref.current = setInterval(loader, intervalMs);
    return () => clearInterval(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ── workflows ─────────────────────────────────────────────────── */
export function useWorkflows({ refreshInterval = 30000, enabled = true } = {}) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const data = await listWorkflows({ limit: 250 });
      setWorkflows(data);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  usePoller(refresh, [refresh], enabled ? refreshInterval : null);

  return { workflows, loading, error, lastFetched, refresh };
}

/* ── executions ────────────────────────────────────────────────── */
export function useExecutions({
  status,
  workflowId,
  limit = 100,
  refreshInterval = 15000,
  enabled = true,
} = {}) {
  const [executions, setExecutions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const load = useCallback(
    async (cursor = null) => {
      if (!enabled) return;
      try {
        if (!cursor) setLoading(true);
        setError(null);
        const data = await listExecutions({ status, workflowId, limit, cursor });
        const results = data.data || [];
        setExecutions((prev) => (cursor ? [...prev, ...results] : results));
        setNextCursor(data.nextCursor || null);
        setLastFetched(new Date());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [status, workflowId, limit, enabled],
  );

  const refresh = useCallback(() => load(null), [load]);
  const loadMore = useCallback(() => {
    if (nextCursor) load(nextCursor);
  }, [nextCursor, load]);

  usePoller(refresh, [refresh], enabled ? refreshInterval : null);

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

/* ── single execution detail ───────────────────────────────────── */
export function useExecution(id, { includeData = true } = {}) {
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setExecution(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getExecution(id, { includeData })
      .then((data) => {
        if (!cancelled) setExecution(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, includeData]);

  return { execution, loading, error };
}

/* ── single workflow detail ────────────────────────────────────── */
export function useWorkflow(id) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setWorkflow(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getWorkflow(id)
      .then((data) => {
        if (!cancelled) setWorkflow(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { workflow, loading, error };
}

/* ── connection health ─────────────────────────────────────────── */
export function useN8nHealth({ refreshInterval = 20000 } = {}) {
  const [health, setHealth] = useState({ ok: null, latencyMs: null });

  const refresh = useCallback(async () => {
    const result = await pingN8n();
    setHealth(result);
  }, []);

  usePoller(refresh, [refresh], refreshInterval);

  return { health, refresh };
}
