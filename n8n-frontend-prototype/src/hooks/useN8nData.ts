import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { formatRelativeTime, formatDuration, parseDurationMs, formatMs, detectTriggerType } from '../lib/formatters';

// ── Types ──────────────────────────────────────────────────

export interface MappedWorkflow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created: string;
  rawCreatedAt: string;
  updated: string;
  rawUpdatedAt: string;
  nodesCount: number;
  nodes: any[];
  tags: string[];
  triggerType: 'webhook' | 'cron' | 'manual' | 'event' | 'unknown';
  // Per-workflow stats (computed from executions)
  stats: WorkflowStats;
}

export interface WorkflowStats {
  totalExecutions: number;
  successCount: number;
  failCount: number;
  runningCount: number;
  successRate: number; // 0-100
  avgDurationMs: number;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | 'running' | null;
  lastErrorMessage: string | null;
}

export interface MappedExecution {
  id: string;
  rawId: string;
  workflowId: string;
  workflow: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  durationMs: number;
  timestamp: string;
  rawStartedAt: string;
  rawStoppedAt: string | null;
  nodes: number;
  errorMessage: string | null;
  errorNodeName: string | null;
  mode: string;
}

export interface MappedCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nDataState {
  workflows: MappedWorkflow[] | null;
  executions: MappedExecution[] | null;
  credentials: MappedCredential[] | null;
  loading: boolean;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'OFFLINE';
  instanceHealthy: boolean;
  lastRefreshedAt: Date | null;
  // Actions
  refresh: () => void;
  toggleWorkflow: (id: string, activate: boolean) => Promise<void>;
  retryExecution: (id: string) => Promise<void>;
}

// ── Hook ───────────────────────────────────────────────────

export function useN8nData(): N8nDataState {
  const [workflows, setWorkflows] = useState<MappedWorkflow[] | null>(null);
  const [executions, setExecutions] = useState<MappedExecution[] | null>(null);
  const [credentials, setCredentials] = useState<MappedCredential[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
  const [instanceHealthy, setInstanceHealthy] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (!lastRefreshedAt) setConnectionStatus('CONNECTING');

      // Parallel fetch for speed
      const [rawWorkflows, rawExecutions, rawCredentials, healthy] = await Promise.all([
        api.fetchWorkflows(),
        api.fetchExecutions({ limit: 250 }),
        api.fetchCredentials(),
        api.checkHealth(),
      ]);

      // Map workflows
      const mappedWorkflows: MappedWorkflow[] = rawWorkflows.map((wf: any) => {
        const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];
        const tags = Array.isArray(wf.tags) ? wf.tags.map((t: any) => t.name || t) : [];
        return {
          id: wf.id,
          name: wf.name,
          status: wf.active ? 'active' as const : 'inactive' as const,
          created: formatRelativeTime(wf.createdAt),
          rawCreatedAt: wf.createdAt || '',
          updated: formatRelativeTime(wf.updatedAt),
          rawUpdatedAt: wf.updatedAt || '',
          nodesCount: nodes.length,
          nodes,
          tags,
          triggerType: detectTriggerType(nodes),
          stats: { totalExecutions: 0, successCount: 0, failCount: 0, runningCount: 0, successRate: 0, avgDurationMs: 0, lastRunAt: null, lastRunStatus: null, lastErrorMessage: null },
        };
      });

      // Map executions — extract error info
      const mappedExecutions: MappedExecution[] = rawExecutions.map((exe: any) => {
        const matchedWf = mappedWorkflows.find(w => w.id === exe.workflowId);
        const status: 'success' | 'failed' | 'running' =
          exe.status === 'success' ? 'success' :
          (exe.status === 'error' || exe.status === 'failed' || exe.status === 'crashed') ? 'failed' :
          'running';

        // Extract error message from execution data
        let errorMessage: string | null = null;
        let errorNodeName: string | null = null;
        if (status === 'failed') {
          // n8n stores errors in data.resultData.error or in individual node results
          if (exe.data?.resultData?.error?.message) {
            errorMessage = exe.data.resultData.error.message;
            errorNodeName = exe.data.resultData.error.node?.name || null;
          } else if (exe.stoppedAt && !exe.data) {
            errorMessage = 'Execution failed (details not loaded)';
          }
        }

        const dur = formatDuration(exe.startedAt, exe.stoppedAt);
        return {
          id: `EXE-${exe.id}`,
          rawId: String(exe.id),
          workflowId: exe.workflowId || '',
          workflow: matchedWf ? matchedWf.name : 'Unknown Process',
          status,
          duration: dur,
          durationMs: parseDurationMs(dur),
          timestamp: formatRelativeTime(exe.startedAt),
          rawStartedAt: exe.startedAt || '',
          rawStoppedAt: exe.stoppedAt || null,
          nodes: matchedWf ? matchedWf.nodesCount : 0,
          errorMessage,
          errorNodeName,
          mode: exe.mode || 'unknown',
        };
      });

      // Compute per-workflow stats
      mappedWorkflows.forEach(wf => {
        const wfExecs = mappedExecutions.filter(e => e.workflowId === wf.id);
        const successExecs = wfExecs.filter(e => e.status === 'success');
        const failExecs = wfExecs.filter(e => e.status === 'failed');
        const runningExecs = wfExecs.filter(e => e.status === 'running');

        let avgDurationMs = 0;
        if (successExecs.length > 0) {
          const totalMs = successExecs.reduce((sum, e) => sum + e.durationMs, 0);
          avgDurationMs = totalMs / successExecs.length;
        }

        // Find last run
        const sorted = [...wfExecs].sort((a, b) => 
          new Date(b.rawStartedAt).getTime() - new Date(a.rawStartedAt).getTime()
        );
        const lastRun = sorted[0] || null;
        const lastFailed = sorted.find(e => e.status === 'failed');

        wf.stats = {
          totalExecutions: wfExecs.length,
          successCount: successExecs.length,
          failCount: failExecs.length,
          runningCount: runningExecs.length,
          successRate: wfExecs.length > 0 ? (successExecs.length / wfExecs.length) * 100 : 0,
          avgDurationMs,
          lastRunAt: lastRun?.rawStartedAt || null,
          lastRunStatus: lastRun?.status || null,
          lastErrorMessage: lastFailed?.errorMessage || null,
        };
      });

      // Map credentials
      const mappedCredentials: MappedCredential[] = rawCredentials.map((cred: any) => ({
        id: cred.id,
        name: cred.name,
        type: cred.type,
        createdAt: cred.createdAt || '',
        updatedAt: cred.updatedAt || '',
      }));

      setWorkflows(mappedWorkflows);
      setExecutions(mappedExecutions);
      setCredentials(mappedCredentials);
      setInstanceHealthy(healthy);
      setConnectionStatus('CONNECTED');
      setLastRefreshedAt(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setConnectionStatus('OFFLINE');
      setLoading(false);
    }
  }, [lastRefreshedAt]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────

  const toggleWorkflow = useCallback(async (id: string, activate: boolean) => {
    try {
      if (activate) {
        await api.activateWorkflow(id);
      } else {
        await api.deactivateWorkflow(id);
      }
      // Optimistic update
      setWorkflows(prev => prev?.map(wf =>
        wf.id === id ? { ...wf, status: activate ? 'active' as const : 'inactive' as const } : wf
      ) || null);
      // Then refresh from API
      setTimeout(fetchData, 500);
    } catch (err) {
      console.error('Toggle workflow error:', err);
      // Revert on failure — just re-fetch
      fetchData();
    }
  }, [fetchData]);

  const retryExecutionAction = useCallback(async (id: string) => {
    try {
      await api.retryExecution(id);
      // Refresh to show new execution
      setTimeout(fetchData, 1000);
    } catch (err) {
      console.error('Retry execution error:', err);
    }
  }, [fetchData]);

  return {
    workflows,
    executions,
    credentials,
    loading,
    connectionStatus,
    instanceHealthy,
    lastRefreshedAt,
    refresh: fetchData,
    toggleWorkflow,
    retryExecution: retryExecutionAction,
  };
}
