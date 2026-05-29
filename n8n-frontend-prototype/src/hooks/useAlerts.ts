import { useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../lib/api';

const NOTIFICATION_HUB_ID = '9MwRgAbGAHLTfThi';
const ALERT_FETCH_LIMIT = 50;

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
  workflowName: string | null;
  nodeName: string | null;
  sourceExecutionId: string | null;
  timestamp: string;
  rawTimestamp: string;
  errorMessage: string | null;
  errorType: string | null;
  channels: string[];
}

export interface UseAlertsReturn {
  alerts: AlertItem[];
  loading: boolean;
  lastFetchedAt: Date | null;
  refresh: () => void;
  error: string | null;
}

function extractAlert(exe: any): AlertItem | null {
  if (!exe?.id) return null;
  const runData = exe?.data?.resultData?.runData;
  let payload: any = null;
  if (runData && typeof runData === 'object') {
    const nodeKeys = Object.keys(runData);
    const formatKey = nodeKeys.find(k => k === 'Route & Format') || nodeKeys[nodeKeys.length - 1];
    if (formatKey) {
      const run = runData[formatKey]?.[0];
      payload = run?.data?.main?.[0]?.[0]?.json ?? null;
    }
  }

  const rawSev = (payload?.severity || 'medium').toString().toLowerCase();
  const severity: AlertSeverity =
    rawSev === 'critical' || rawSev === 'high' || rawSev === 'medium' || rawSev === 'low'
      ? rawSev
      : 'medium';

  const message = payload?.originalMessage || payload?.formatted?.log || `Alert from execution ${exe.id}`;
  const md = payload?.metadata || {};

  return {
    id: String(exe.id),
    severity,
    message,
    workflowName: md.workflowName || null,
    nodeName: md.nodeName || null,
    sourceExecutionId: md.executionId || null,
    timestamp: '',
    rawTimestamp: payload?.timestamp || exe.startedAt || exe.createdAt || '',
    errorMessage: md.error?.message || null,
    errorType: md.error?.type || null,
    channels: Array.isArray(payload?.channels) ? payload.channels : [],
  };
}

function relTime(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchAlerts = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setError(null);
      const execs = await api.fetchExecutionsWithData({
        workflowId: NOTIFICATION_HUB_ID,
        limit: ALERT_FETCH_LIMIT,
      });
      const mapped = execs
        .map(extractAlert)
        .filter((a): a is AlertItem => a !== null)
        .map(a => ({ ...a, timestamp: relTime(a.rawTimestamp) }));
      mapped.sort((a, b) =>
        new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime()
      );
      setAlerts(mapped);
      setLastFetchedAt(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchAlerts();
    };
    const onFocus = () => fetchAlerts();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAlerts]);

  return { alerts, loading, lastFetchedAt, refresh: fetchAlerts, error };
}
