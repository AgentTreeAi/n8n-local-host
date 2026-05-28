import { type FC, useState, useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import type { MappedExecution } from '../hooks/useN8nData';

interface ExecutionMonitorProps {
  executions: MappedExecution[] | null;
  workflows: any[] | null;
  onRetryExecution: (id: string) => Promise<void>;
}

type StatusFilter = 'all' | 'success' | 'failed' | 'running';

const ExecutionMonitor: FC<ExecutionMonitorProps> = ({ executions, onRetryExecution }) => {
  const displayExecutions = executions || [];
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return displayExecutions;
    return displayExecutions.filter(e => e.status === statusFilter);
  }, [displayExecutions, statusFilter]);

  const successCount = displayExecutions.filter(e => e.status === 'success').length;
  const failedCount = displayExecutions.filter(e => e.status === 'failed').length;
  const runningCount = displayExecutions.filter(e => e.status === 'running').length;

  const handleRetry = async (e: React.MouseEvent, rawId: string) => {
    e.stopPropagation();
    setRetryingId(rawId);
    try {
      await onRetryExecution(rawId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full bg-background font-mono text-[11px] uppercase tracking-wider">
      {/* Filter Tabs */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-[#030303] gap-1">
        <Filter size={10} className="text-text-muted mr-2" />
        <button 
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 text-[10px] tracking-widest transition-colors ${statusFilter === 'all' ? 'bg-brand text-black font-bold' : 'text-text-secondary hover:text-brand'}`}
        >
          ALL ({displayExecutions.length})
        </button>
        <button 
          onClick={() => setStatusFilter('success')}
          className={`px-3 py-1 text-[10px] tracking-widest transition-colors ${statusFilter === 'success' ? 'bg-success text-black font-bold' : 'text-text-secondary hover:text-success'}`}
        >
          OK ({successCount})
        </button>
        <button 
          onClick={() => setStatusFilter('failed')}
          className={`px-3 py-1 text-[10px] tracking-widest transition-colors ${statusFilter === 'failed' ? 'bg-warning text-black font-bold' : 'text-text-secondary hover:text-warning'}`}
        >
          FAILED ({failedCount})
        </button>
        <button 
          onClick={() => setStatusFilter('running')}
          className={`px-3 py-1 text-[10px] tracking-widest transition-colors ${statusFilter === 'running' ? 'bg-brand text-black font-bold' : 'text-text-secondary hover:text-brand'}`}
        >
          ACTIVE ({runningCount})
        </button>
      </div>

      {/* Header Row */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-[#050505] text-text-secondary select-none">
        <div className="w-6 shrink-0"></div>
        <div className="w-24 shrink-0">ID</div>
        <div className="w-24 shrink-0">STATUS</div>
        <div className="flex-1 min-w-[200px]">TARGET_PROCESS</div>
        <div className="w-20 shrink-0 text-right">DUR</div>
        <div className="w-16 shrink-0 text-center">MODE</div>
        <div className="w-32 shrink-0 text-center">NODES</div>
        <div className="w-28 shrink-0 text-right">TIME</div>
        <div className="w-10 shrink-0"></div>
      </div>

      {/* Log Stream */}
      <div className="flex flex-col">
        {filtered.map((exe) => {
          const isExpanded = expandedId === exe.id;
          const isRetrying = retryingId === exe.rawId;

          return (
            <div key={exe.id}>
              <div 
                onClick={() => setExpandedId(isExpanded ? null : exe.id)}
                className={`flex items-center px-4 py-2.5 border-b transition-colors group cursor-pointer ${
                  isExpanded ? 'bg-[#0a0a0a] border-brand/20' : 'border-[#111111] hover:bg-[#0a0a0a]'
                }`}
              >
                {/* Expand indicator */}
                <div className="w-6 shrink-0">
                  {exe.status === 'failed' || exe.errorMessage ? (
                    isExpanded ? <ChevronDown size={10} className="text-brand" /> : <ChevronRight size={10} className="text-text-muted" />
                  ) : null}
                </div>

                <div className="w-24 shrink-0 text-text-muted group-hover:text-text-primary transition-colors">
                  {exe.rawId}
                </div>
                
                <div className="w-24 shrink-0">
                  {exe.status === 'success' && (
                    <span className="bg-success text-black px-1.5 py-0.5 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 size={8} /> OK
                    </span>
                  )}
                  {exe.status === 'failed' && (
                    <span className="bg-warning text-black px-1.5 py-0.5 font-bold animate-pulse inline-flex items-center gap-1">
                      <XCircle size={8} /> FAIL
                    </span>
                  )}
                  {exe.status === 'running' && (
                    <span className="bg-brand text-black px-1.5 py-0.5 font-bold inline-flex items-center gap-1">
                      <Activity size={8} className="animate-spin" /> RUN
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-[200px] text-text-primary truncate pr-4">
                  {exe.workflow}
                  {exe.errorMessage && (
                    <span className="ml-2 text-warning/60 text-[9px] normal-case">
                      — {exe.errorMessage.slice(0, 60)}{exe.errorMessage.length > 60 ? '…' : ''}
                    </span>
                  )}
                </div>

                <div className="w-20 shrink-0 text-right text-text-secondary">
                  {exe.duration}
                </div>

                <div className="w-16 shrink-0 text-center text-text-muted text-[9px]">
                  {exe.mode}
                </div>

                <div className="w-32 shrink-0 flex items-center justify-center gap-px px-4">
                  {Array.from({ length: Math.min(exe.nodes, 12) }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 h-2 ${exe.status === 'failed' && i > Math.floor(exe.nodes/2) ? 'bg-warning' : exe.status === 'running' ? 'bg-brand/50' : 'bg-success/40'} group-hover:opacity-100 opacity-60 transition-opacity`}
                    />
                  ))}
                  {exe.nodes > 12 && <span className="ml-2 text-text-muted">+{exe.nodes - 12}</span>}
                </div>

                <div className="w-28 shrink-0 text-right text-text-muted">
                  {exe.timestamp}
                </div>

                <div className="w-10 shrink-0 flex justify-end">
                  {exe.status === 'failed' && (
                    <button
                      onClick={(e) => handleRetry(e, exe.rawId)}
                      disabled={isRetrying}
                      className={`p-1 transition-colors ${isRetrying ? 'text-brand animate-spin' : 'text-text-muted hover:text-brand opacity-0 group-hover:opacity-100'}`}
                      title="Retry execution"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Error Detail */}
              {isExpanded && exe.errorMessage && (
                <div className="px-4 py-3 bg-[#050505] border-b border-warning/20 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-start gap-3 ml-6">
                    <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <div className="text-[11px] font-mono text-warning">
                        ERROR_TRACE
                      </div>
                      <div className="text-[11px] font-mono text-text-secondary normal-case leading-relaxed bg-black border border-[#1f1f1f] p-3">
                        {exe.errorMessage}
                      </div>
                      {exe.errorNodeName && (
                        <div className="text-[10px] font-mono text-text-muted">
                          FAILED_AT_NODE: <span className="text-warning">{exe.errorNodeName}</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => handleRetry(e, exe.rawId)}
                          disabled={isRetrying}
                          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 bg-brand text-black font-bold hover:bg-brand-hover transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={10} /> {isRetrying ? 'RETRYING...' : 'RETRY_EXECUTION'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-text-muted text-sm border-b border-border bg-background">
            <Activity className="mb-4 opacity-30" size={24} />
            {statusFilter !== 'all' ? `[NO_${statusFilter.toUpperCase()}_EXECUTIONS]` : '[NO_DATA_STREAM]'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionMonitor;
