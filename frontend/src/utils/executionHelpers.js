/**
 * Execution monitoring utility functions
 */

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - e.g. "1.2s", "45s", "2m 30s", "1h 5m"
 */
export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    const decimal = ms % 1000 >= 100 ? `.${Math.floor((ms % 1000) / 100)}` : '';
    return `${seconds}${decimal}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format an ISO date string to a relative time string
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} - e.g. "3 min ago", "2 hours ago", "yesterday"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  
  if (diffMs < 0) return 'just now';
  
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  
  return new Date(isoString).toLocaleDateString();
}

/**
 * Format an ISO date string to a short timestamp
 * @param {string} isoString - ISO 8601 timestamp  
 * @returns {string} - e.g. "May 27, 5:29 PM"
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Determine health status based on recent executions
 * @param {Array} executions - Array of execution objects (newest first)
 * @returns {'healthy'|'degraded'|'failing'|'unknown'}
 */
export function getHealthStatus(executions) {
  if (!executions || executions.length === 0) return 'unknown';
  
  const recent = executions.slice(0, 10);
  const errorCount = recent.filter(e => e.status === 'error').length;
  
  if (errorCount === 0) return 'healthy';
  if (errorCount <= recent.length * 0.3) return 'healthy';
  if (errorCount <= recent.length * 0.5) return 'degraded';
  return 'failing';
}

/**
 * Group executions by workflow ID
 * @param {Array} executions - Array of execution objects
 * @param {Array} workflows - Array of workflow objects for name resolution
 * @returns {Object} - { workflowId: { name, executions: [...] } }
 */
export function groupExecutionsByWorkflow(executions, workflows = []) {
  const workflowMap = {};
  workflows.forEach(w => {
    workflowMap[w.id] = w.name;
  });
  
  const groups = {};
  
  executions.forEach(exec => {
    const wfId = exec.workflowId;
    if (!groups[wfId]) {
      groups[wfId] = {
        id: wfId,
        name: exec.workflowData?.name || workflowMap[wfId] || `Workflow ${wfId}`,
        executions: [],
      };
    }
    groups[wfId].executions.push(exec);
  });
  
  return groups;
}

/**
 * Calculate aggregate stats from a list of executions
 * @param {Array} executions - Array of execution objects
 * @returns {Object} - { total, success, error, waiting, successRate, avgDurationMs }
 */
export function calculateStats(executions) {
  if (!executions || executions.length === 0) {
    return { total: 0, success: 0, error: 0, waiting: 0, successRate: 0, avgDurationMs: 0 };
  }
  
  let success = 0;
  let error = 0;
  let waiting = 0;
  let totalDuration = 0;
  let durationCount = 0;
  
  executions.forEach(exec => {
    if (exec.status === 'success') success++;
    else if (exec.status === 'error') error++;
    else if (exec.status === 'waiting') waiting++;
    
    if (exec.startedAt && exec.stoppedAt) {
      const duration = new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime();
      if (duration > 0) {
        totalDuration += duration;
        durationCount++;
      }
    }
  });
  
  const total = executions.length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const avgDurationMs = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  
  return { total, success, error, waiting, successRate, avgDurationMs };
}

/**
 * Compute the execution duration in milliseconds
 * @param {Object} execution - Execution object with startedAt and stoppedAt
 * @returns {number|null} - Duration in ms, or null if not computable
 */
export function getExecutionDuration(execution) {
  if (!execution.startedAt || !execution.stoppedAt) return null;
  return new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime();
}

/**
 * Get a mode label for display
 * @param {string} mode - Execution mode from n8n
 * @returns {string} - Human-readable label
 */
export function getModeLabel(mode) {
  const labels = {
    'manual': 'Manual',
    'trigger': 'Trigger',
    'webhook': 'Webhook',
    'schedule': 'Schedule',
    'retry': 'Retry',
    'integrated': 'Sub-workflow',
    'internal': 'Internal',
    'error': 'Error Handler',
  };
  return labels[mode] || mode || '—';
}
