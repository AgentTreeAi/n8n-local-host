import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  Radio,
  ExternalLink,
  Loader2,
  Power,
  PowerOff,
  Clock,
  CalendarPlus,
  Tag,
  ArrowUpDown,
  Zap,
  ZapOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useWorkflows, activateWorkflow } from '../hooks/useExecutions';
import { formatRelativeTime } from '../utils/executionHelpers';

const N8N_URL = 'https://n8n.workflowsolution.org';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { key: 'updatedAt', label: 'Last Updated' },
  { key: 'name', label: 'Name A–Z' },
  { key: 'createdAt', label: 'Newest First' },
];

export default function WorkflowsDashboard() {
  const { workflows, loading, error, lastFetched, refresh } = useWorkflows({
    refreshInterval: 30000,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Stats
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter(w => w.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [workflows]);

  // Filter & sort
  const filteredWorkflows = useMemo(() => {
    let result = [...workflows];

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(w => w.active);
    } else if (statusFilter === 'inactive') {
      result = result.filter(w => !w.active);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w => {
        const nameMatch = w.name?.toLowerCase().includes(q);
        const tagMatch = w.tags?.some(t => t.name?.toLowerCase().includes(q));
        return nameMatch || tagMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else {
        // updatedAt (default)
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
    });

    return result;
  }, [workflows, statusFilter, searchQuery, sortBy]);

  // Toggle active/inactive
  const handleToggle = useCallback(async (workflow) => {
    const newActive = !workflow.active;
    setTogglingId(workflow.id);
    try {
      await activateWorkflow(workflow.id, newActive);
      setToast({
        success: true,
        message: `"${workflow.name}" ${newActive ? 'activated' : 'deactivated'}`,
      });
      // Refresh to get updated state
      refresh();
    } catch (err) {
      setToast({
        success: false,
        message: `Failed to toggle: ${err.message}`,
      });
    } finally {
      setTogglingId(null);
    }
  }, [refresh]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <>
      <header className="header-bar">
        <div className="header-title">
          <h1>Workflows</h1>
          <p>Manage and monitor all your n8n automations in one place.</p>
        </div>
        <div className="header-actions">
          <a
            href={`${N8N_URL}/workflows`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-open-n8n"
          >
            <ExternalLink size={18} />
            Open n8n Editor
          </a>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="wf-stats">
        <div className="wf-stat-card glass-panel staggered-load" style={{ animationDelay: '0.05s' }}>
          <div className="wf-stat-icon">
            <Layers size={20} />
          </div>
          <div className="wf-stat-info">
            <span className="wf-stat-value">{stats.total}</span>
            <span className="wf-stat-label">Total Workflows</span>
          </div>
        </div>

        <div className="wf-stat-card glass-panel staggered-load" style={{ animationDelay: '0.1s' }}>
          <div className="wf-stat-icon wf-stat-icon-active">
            <Zap size={20} />
          </div>
          <div className="wf-stat-info">
            <span className="wf-stat-value">{stats.active}</span>
            <span className="wf-stat-label">Active</span>
          </div>
        </div>

        <div className="wf-stat-card glass-panel staggered-load" style={{ animationDelay: '0.15s' }}>
          <div className="wf-stat-icon wf-stat-icon-inactive">
            <ZapOff size={20} />
          </div>
          <div className="wf-stat-info">
            <span className="wf-stat-value">{stats.inactive}</span>
            <span className="wf-stat-label">Inactive</span>
          </div>
        </div>

        <div className="wf-stat-card glass-panel staggered-load" style={{ animationDelay: '0.2s' }}>
          <div className="wf-stat-icon wf-stat-icon-synced">
            <RefreshCw size={20} />
          </div>
          <div className="wf-stat-info">
            <span className="wf-stat-value">
              {lastFetched ? formatRelativeTime(lastFetched.toISOString()) : '—'}
            </span>
            <span className="wf-stat-label">Last Synced</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="wf-controls">
        <div className="wf-controls-left">
          <div className="wf-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="wf-status-filters">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-pill ${statusFilter === f.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
                {f.key === 'active' && <span className="filter-count">{stats.active}</span>}
                {f.key === 'inactive' && <span className="filter-count">{stats.inactive}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="wf-controls-right">
          <div className="wf-sort">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="wf-live-group">
            <div className="live-indicator">
              <Radio size={12} className="live-dot" />
              <span>Live</span>
            </div>
            <button className="refresh-btn" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="monitor-error glass-panel">
          <AlertCircle size={16} />
          <span>Failed to fetch workflows: {error}</span>
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && workflows.length === 0 && (
        <div className="wf-loading glass-panel">
          <Loader2 size={24} className="spinner" />
          <span>Loading workflows from n8n...</span>
        </div>
      )}

      {/* Workflow Grid */}
      {!loading && filteredWorkflows.length === 0 && (
        <div className="wf-empty glass-panel staggered-load">
          <Layers size={40} style={{ opacity: 0.4 }} />
          <h3>{searchQuery || statusFilter !== 'all' ? 'No matches found' : 'No workflows yet'}</h3>
          <p>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first workflow in the n8n editor.'}
          </p>
        </div>
      )}

      {filteredWorkflows.length > 0 && (
        <div className="wf-grid">
          {filteredWorkflows.map((wf, index) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              index={index}
              toggling={togglingId === wf.id}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="wf-toast-wrap">
          <div className={`wf-toast glass-panel ${toast.success ? 'wf-toast-success' : 'wf-toast-error'}`}>
            {toast.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
            <button className="wf-toast-close" onClick={dismissToast}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Individual Workflow Card ─── */
function WorkflowCard({ workflow, index, toggling, onToggle }) {
  const isActive = workflow.active;

  return (
    <div
      className={`wf-card glass-panel staggered-load ${isActive ? 'wf-card-active' : 'wf-card-inactive'}`}
      style={{ animationDelay: `${0.04 * index}s` }}
    >
      {/* Top accent bar */}
      <div className={`wf-card-accent ${isActive ? 'accent-active' : 'accent-inactive'}`} />

      <div className="wf-card-header">
        <div className="wf-card-status-row">
          <div className={`wf-status-dot ${isActive ? 'dot-on pulse' : 'dot-off'}`} />
          <span className={`wf-active-label ${isActive ? 'label-active' : 'label-inactive'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button
          className={`wf-toggle-btn ${isActive ? 'toggle-on' : 'toggle-off'} ${toggling ? 'toggling' : ''}`}
          onClick={() => onToggle(workflow)}
          disabled={toggling}
          title={isActive ? 'Deactivate workflow' : 'Activate workflow'}
        >
          {toggling ? (
            <Loader2 size={14} className="spinner" />
          ) : isActive ? (
            <Power size={14} />
          ) : (
            <PowerOff size={14} />
          )}
        </button>
      </div>

      <h4 className="wf-card-name">{workflow.name || 'Untitled Workflow'}</h4>

      {/* Tags */}
      {workflow.tags && workflow.tags.length > 0 && (
        <div className="wf-card-tags">
          {workflow.tags.slice(0, 3).map(tag => (
            <span key={tag.id} className="wf-tag">
              <Tag size={10} />
              {tag.name}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="wf-tag wf-tag-more">+{workflow.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="wf-card-meta">
        <div className="wf-meta-item">
          <CalendarPlus size={13} />
          <span>Created {formatRelativeTime(workflow.createdAt)}</span>
        </div>
        <div className="wf-meta-item">
          <Clock size={13} />
          <span>Updated {formatRelativeTime(workflow.updatedAt)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="wf-card-footer">
        <span className="wf-card-id">ID: {workflow.id}</span>
        <a
          href={`${N8N_URL}/workflow/${workflow.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="wf-open-link"
          title="Open in n8n editor"
        >
          <ExternalLink size={14} />
          Edit
        </a>
      </div>
    </div>
  );
}
