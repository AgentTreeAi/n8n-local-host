import { type FC, useState, useMemo, useEffect, useRef } from 'react';
import { Terminal, Activity, Clock, ChevronRight, ChevronDown, Search, Webhook, Timer, MousePointerClick, Zap, Power, PowerOff, Tag, GitBranch, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { MappedWorkflow, MappedExecution } from '../hooks/useN8nData';
import { formatMs } from '../lib/formatters';
import WorkflowDetailPanel from './WorkflowDetailPanel';

interface WorkflowsProps {
  workflows: MappedWorkflow[] | null;
  executions: MappedExecution[] | null;
  onToggleWorkflow: (id: string, activate: boolean) => Promise<void>;
  onRetryExecution: (id: string) => Promise<void>;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string | null) => void;
}

const triggerIcons: Record<string, any> = {
  webhook: Webhook,
  cron: Timer,
  manual: MousePointerClick,
  event: Zap,
  unknown: Zap,
};

const Workflows: FC<WorkflowsProps> = ({ workflows, executions, onToggleWorkflow, onRetryExecution, selectedWorkflowId, onSelectWorkflow }) => {
  const displayWorkflows = workflows || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const expandedId = selectedWorkflowId;
  const setExpandedId = (id: string | null) => onSelectWorkflow(id);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedWorkflowId) return;
    const el = rowRefs.current[selectedWorkflowId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedWorkflowId]);

  const filtered = useMemo(() => {
    return displayWorkflows.filter(wf => {
      if (statusFilter === 'active' && wf.status !== 'active') return false;
      if (statusFilter === 'inactive' && wf.status !== 'inactive') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return wf.name.toLowerCase().includes(q) || wf.id.toLowerCase().includes(q) || wf.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [displayWorkflows, searchQuery, statusFilter]);

  const activeCount = displayWorkflows.filter(w => w.status === 'active').length;
  const inactiveCount = displayWorkflows.filter(w => w.status !== 'active').length;

  const handleToggle = async (e: React.MouseEvent, wf: MappedWorkflow) => {
    e.stopPropagation();
    setTogglingId(wf.id);
    try {
      await onToggleWorkflow(wf.id, wf.status !== 'active');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Search & Filter Bar */}
      <div className="bg-black border border-border flex items-center p-1 focus-within:border-brand transition-colors">
        <div className="bg-brand text-black p-2 flex items-center justify-center">
          <Search size={16} />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search workflows by name, ID, or tag..." 
          className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-mono placeholder:text-[#444444] text-brand"
        />
        <div className="flex items-center gap-1 pr-1 font-mono text-[10px] uppercase tracking-widest">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 transition-colors border border-transparent ${statusFilter === 'all' ? 'text-text-primary bg-[#1f1f1f]' : 'text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            ALL:{displayWorkflows.length.toString().padStart(2, '0')}
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 transition-colors border border-transparent ${statusFilter === 'active' ? 'text-brand bg-brand/10 border-brand' : 'text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            ACTIVE:{activeCount.toString().padStart(2, '0')}
          </button>
          <button 
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 transition-colors border border-transparent ${statusFilter === 'inactive' ? 'text-warning bg-warning/10 border-warning' : 'text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            INACTIVE:{inactiveCount.toString().padStart(2, '0')}
          </button>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((wf) => {
          const TriggerIcon = triggerIcons[wf.triggerType] || Zap;
          const isExpanded = expandedId === wf.id;
          const isToggling = togglingId === wf.id;
          const wfExecutions = executions?.filter(e => e.workflowId === wf.id) || [];

          return (
            <div
              key={wf.id}
              ref={el => { rowRefs.current[wf.id] = el; }}
              className="flex flex-col"
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : wf.id)}
                className={`border bg-[#0a0a0a] flex flex-col group cursor-pointer relative overflow-hidden transition-colors ${
                  isExpanded ? 'border-brand' : 'border-border hover:border-brand/50'
                }`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full transition-all ${wf.status === 'active' ? 'bg-brand shadow-brand' : 'bg-[#1f1f1f]'}`} />
                
                <div className="p-4 pl-5">
                  {/* Top Row — ID, Trigger Type, Toggle */}
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted font-mono text-[10px] px-1.5 py-0.5 border border-[#1f1f1f] group-hover:border-brand/30 transition-colors uppercase tracking-widest bg-black">{wf.id}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                        <TriggerIcon size={10} className="text-text-secondary" />
                        {wf.triggerType}
                      </div>
                      {wf.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono text-brand/70 px-1.5 py-0.5 bg-brand/5 border border-brand/20 uppercase tracking-widest flex items-center gap-1">
                          <Tag size={8} />{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Activate/Deactivate Toggle */}
                      <button
                        onClick={(e) => handleToggle(e, wf)}
                        disabled={isToggling}
                        className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1 border transition-all ${
                          isToggling ? 'opacity-50 cursor-wait' :
                          wf.status === 'active' 
                            ? 'text-brand border-brand/30 bg-brand/5 hover:bg-brand/10' 
                            : 'text-text-muted border-border hover:text-brand hover:border-brand/30'
                        }`}
                      >
                        {wf.status === 'active' ? <Power size={10} /> : <PowerOff size={10} />}
                        {isToggling ? 'TOGGLING...' : wf.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Workflow Name */}
                  <h4 className="text-text-primary font-bold text-sm mb-3 truncate group-hover:text-brand transition-colors">
                    {wf.name}
                  </h4>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 border-t border-[#111111] pt-3">
                    {/* Nodes count */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                      <GitBranch size={10} /> {wf.nodesCount} nodes
                    </div>
                    
                    {/* Execution stats */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
                      <Activity size={10} className="text-text-secondary" />
                      <span className="text-text-secondary">{wf.stats.totalExecutions} runs</span>
                    </div>

                    {/* Success rate mini bar */}
                    {wf.stats.totalExecutions > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#1f1f1f] overflow-hidden flex">
                          <div className="bg-success h-full transition-all" style={{ width: `${wf.stats.successRate}%` }} />
                          <div className="bg-warning h-full transition-all" style={{ width: `${100 - wf.stats.successRate}%` }} />
                        </div>
                        <span className={`text-[10px] font-mono tracking-wider ${wf.stats.successRate >= 90 ? 'text-brand' : wf.stats.successRate >= 50 ? 'text-yellow-500' : 'text-warning'}`}>
                          {wf.stats.successRate.toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {/* Avg duration */}
                    {wf.stats.avgDurationMs > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                        <Clock size={10} /> avg {formatMs(wf.stats.avgDurationMs)}
                      </div>
                    )}

                    {/* Last run indicator */}
                    {wf.stats.lastRunStatus && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ml-auto">
                        {wf.stats.lastRunStatus === 'success' && <CheckCircle2 size={10} className="text-success" />}
                        {wf.stats.lastRunStatus === 'failed' && <XCircle size={10} className="text-warning" />}
                        {wf.stats.lastRunStatus === 'running' && <Activity size={10} className="text-brand animate-pulse" />}
                        <span className={
                          wf.stats.lastRunStatus === 'success' ? 'text-success' : 
                          wf.stats.lastRunStatus === 'failed' ? 'text-warning' : 'text-brand'
                        }>
                          LAST: {wf.stats.lastRunStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last error alert */}
                  {wf.stats.lastErrorMessage && (
                    <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-warning/5 border border-warning/20 text-[10px] font-mono text-warning/80 truncate">
                      <AlertTriangle size={10} className="text-warning shrink-0" />
                      {wf.stats.lastErrorMessage}
                    </div>
                  )}
                </div>

                {/* Circuit accents */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-transparent group-hover:border-brand/30 transition-colors" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-transparent group-hover:border-brand/30 transition-colors" />
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <WorkflowDetailPanel 
                  workflow={wf} 
                  executions={wfExecutions}
                  onRetryExecution={onRetryExecution}
                />
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-16 flex flex-col items-center justify-center text-text-muted text-[11px] border border-border bg-[#050505] font-mono uppercase tracking-wider">
          <Terminal className="mb-4 opacity-30 text-brand animate-pulse" size={24} />
          {searchQuery || statusFilter !== 'all' ? '[NO_MATCHING_WORKFLOWS]' : '[SYS_CONFIG_OFFLINE_OR_EMPTY]'}
        </div>
      )}
    </div>
  );
};

export default Workflows;
