import { type FC } from 'react';
import { Activity } from 'lucide-react';

interface Execution {
  id: string;
  workflow: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  timestamp: string;
  nodes: number;
}

interface ExecutionMonitorProps {
  executions: Execution[] | null;
  workflows: any[] | null;
}

const ExecutionMonitor: FC<ExecutionMonitorProps> = ({ executions }) => {
  const displayExecutions = executions || [];

  return (
    <div className="flex flex-col w-full bg-background font-mono text-[11px] uppercase tracking-wider">
      {/* Header Row */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-[#050505] text-text-secondary select-none">
        <div className="w-24 shrink-0">ID</div>
        <div className="w-24 shrink-0">STATUS</div>
        <div className="flex-1 min-w-[200px]">TARGET_PROCESS</div>
        <div className="w-24 shrink-0 text-right">DUR</div>
        <div className="w-32 shrink-0 text-center">NODES</div>
        <div className="w-28 shrink-0 text-right">TIME</div>
      </div>

      {/* Log Stream */}
      <div className="flex flex-col">
        {displayExecutions.map((exe) => (
          <div 
            key={exe.id} 
            className="flex items-center px-4 py-2.5 border-b border-[#111111] hover:bg-[#0a0a0a] transition-colors group cursor-pointer"
          >
            <div className="w-24 shrink-0 text-text-muted group-hover:text-text-primary transition-colors">
              {exe.id}
            </div>
            
            <div className="w-24 shrink-0">
              {exe.status === 'success' && (
                <span className="bg-success text-black px-1.5 py-0.5 font-bold">
                  [SUCCESS]
                </span>
              )}
              {exe.status === 'failed' && (
                <span className="bg-warning text-black px-1.5 py-0.5 font-bold animate-pulse">
                  [FAILED!]
                </span>
              )}
              {exe.status === 'running' && (
                <span className="bg-brand text-black px-1.5 py-0.5 font-bold">
                  [ACTIVE_]
                </span>
              )}
            </div>

            <div className="flex-1 min-w-[200px] text-text-primary truncate pr-4">
              {exe.workflow}
            </div>

            <div className="w-24 shrink-0 text-right text-text-secondary">
              {exe.duration}
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
          </div>
        ))}
        {displayExecutions.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-text-muted text-sm border-b border-border bg-background">
            <Activity className="mb-4 opacity-30" size={24} />
            [NO_DATA_STREAM]
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionMonitor;

