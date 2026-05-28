import { type FC } from 'react';
import { Clock, Activity, GitBranch, ExternalLink, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { MappedWorkflow, MappedExecution } from '../hooks/useN8nData';
import { formatMs, formatShortDate } from '../lib/formatters';

interface WorkflowDetailPanelProps {
  workflow: MappedWorkflow;
  executions: MappedExecution[];
  onRetryExecution: (id: string) => Promise<void>;
}

const WorkflowDetailPanel: FC<WorkflowDetailPanelProps> = ({ workflow, executions, onRetryExecution }) => {
  const recentExecs = executions.slice(0, 15);
  const uniqueNodeTypes = [...new Set(workflow.nodes.map((n: any) => n.type?.split('.').pop() || 'Unknown'))];

  // Mini sparkline data: last 20 executions mapped to success/fail
  const sparkData = executions.slice(0, 20).reverse();

  return (
    <div className="border border-t-0 border-brand/30 bg-[#050505] animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#1f1f1f]">
        
        {/* Left: Metadata & Nodes */}
        <div className="p-4 space-y-4">
          <h5 className="text-[10px] font-mono font-bold tracking-widest uppercase text-text-secondary flex items-center gap-2">
            <GitBranch size={10} className="text-brand" /> Node_Pipeline
          </h5>
          
          <div className="flex flex-wrap gap-1.5">
            {workflow.nodes.map((node: any, i: number) => {
              const shortType = node.type?.split('.').pop() || 'Node';
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[9px] font-mono px-2 py-1 bg-[#0a0a0a] border border-[#1f1f1f] text-text-secondary hover:border-brand/30 hover:text-text-primary transition-colors">
                    {node.name || shortType}
                  </span>
                  {i < workflow.nodes.length - 1 && (
                    <span className="text-brand/30 text-[10px]">→</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Clock size={9} /> Created: {formatShortDate(workflow.rawCreatedAt)}
            </div>
            <div className="flex items-center gap-2">
              <Activity size={9} /> Updated: {formatShortDate(workflow.rawUpdatedAt)}
            </div>
            <div className="flex items-center gap-2">
              <GitBranch size={9} /> {uniqueNodeTypes.length} unique node types
            </div>
          </div>

          {/* Open in n8n link */}
          <a 
            href={`/workflow/${workflow.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-brand uppercase tracking-widest hover:underline"
          >
            <ExternalLink size={10} /> Open in n8n Editor
          </a>
        </div>

        {/* Center: Execution Sparkline */}
        <div className="p-4 space-y-4">
          <h5 className="text-[10px] font-mono font-bold tracking-widest uppercase text-text-secondary flex items-center gap-2">
            <Activity size={10} className="text-brand" /> Recent_Executions ({executions.length})
          </h5>

          {/* Mini sparkline bar */}
          {sparkData.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-px h-6">
                {sparkData.map((exe, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full transition-colors ${
                      exe.status === 'success' ? 'bg-success/40 hover:bg-success/70' :
                      exe.status === 'failed' ? 'bg-warning/60 hover:bg-warning' :
                      'bg-brand/30 hover:bg-brand/50'
                    }`}
                    title={`${exe.status} — ${exe.duration} — ${exe.timestamp}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-text-muted uppercase tracking-widest">
                <span>Oldest</span>
                <span>Most Recent →</span>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-[#0a0a0a] border border-[#1f1f1f]">
                  <div className="text-lg font-bold font-mono text-brand">{workflow.stats.successCount}</div>
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest">OK</div>
                </div>
                <div className="text-center p-2 bg-[#0a0a0a] border border-[#1f1f1f]">
                  <div className="text-lg font-bold font-mono text-warning">{workflow.stats.failCount}</div>
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest">FAIL</div>
                </div>
                <div className="text-center p-2 bg-[#0a0a0a] border border-[#1f1f1f]">
                  <div className="text-lg font-bold font-mono text-text-primary">{formatMs(workflow.stats.avgDurationMs)}</div>
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest">AVG</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest text-center py-6">
              [NO_EXECUTION_DATA]
            </div>
          )}
        </div>

        {/* Right: Recent execution list */}
        <div className="p-4 space-y-3">
          <h5 className="text-[10px] font-mono font-bold tracking-widest uppercase text-text-secondary flex items-center gap-2">
            <Clock size={10} className="text-brand" /> Execution_Log
          </h5>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {recentExecs.map(exe => (
              <div key={exe.id} className="flex items-center gap-2 text-[10px] font-mono py-1.5 px-2 hover:bg-[#0a0a0a] transition-colors group">
                {exe.status === 'success' && <CheckCircle2 size={10} className="text-success shrink-0" />}
                {exe.status === 'failed' && <XCircle size={10} className="text-warning shrink-0" />}
                {exe.status === 'running' && <Activity size={10} className="text-brand animate-pulse shrink-0" />}
                
                <span className="text-text-muted">{exe.rawId}</span>
                <span className={`${
                  exe.status === 'success' ? 'text-success' : 
                  exe.status === 'failed' ? 'text-warning' : 'text-brand'
                }`}>
                  {exe.status.toUpperCase()}
                </span>
                <span className="text-text-muted ml-auto">{exe.duration}</span>
                <span className="text-text-muted">{exe.timestamp}</span>
                
                {exe.status === 'failed' && (
                  <button 
                    onClick={() => onRetryExecution(exe.rawId)}
                    className="text-brand opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand"
                    title="Retry this execution"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {recentExecs.length === 0 && (
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest text-center py-4">
              [EMPTY_LOG]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetailPanel;
