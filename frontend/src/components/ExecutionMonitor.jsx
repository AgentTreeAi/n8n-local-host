import { useState } from 'react';
import { Check, X, Clock, Activity } from 'lucide-react';

const mockData = [
  { id: 'EXE-9081', workflow: 'Todoist Grocery Run Compiler', status: 'success', duration: '965ms', timestamp: 'Just now', nodes: 8 },
  { id: 'EXE-9080', workflow: 'Stale Task Detector', status: 'success', duration: '1.2s', timestamp: '2 mins ago', nodes: 12 },
  { id: 'EXE-9079', workflow: 'Weekly Report Generator', status: 'running', duration: '4.5s', timestamp: '5 mins ago', nodes: 24 },
  { id: 'EXE-9078', workflow: 'Sync Gmail to CRM', status: 'failed', duration: '200ms', timestamp: '12 mins ago', nodes: 2 },
  { id: 'EXE-9077', workflow: 'Slack Notification Alert', status: 'success', duration: '450ms', timestamp: '15 mins ago', nodes: 4 },
  { id: 'EXE-9076', workflow: 'Web Scraper Daily', status: 'success', duration: '14.2s', timestamp: '1 hour ago', nodes: 18 },
  { id: 'EXE-9075', workflow: 'Database Backup', status: 'success', duration: '45.1s', timestamp: '3 hours ago', nodes: 5 },
];

const ExecutionMonitor = () => {
  const [executions] = useState(mockData);

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-zinc-900/50 text-xs text-text-secondary font-medium">
            <th className="p-4 w-32 font-medium">Execution ID</th>
            <th className="p-4 font-medium">Workflow Target</th>
            <th className="p-4 w-32 font-medium">Status</th>
            <th className="p-4 w-24 font-medium">Duration</th>
            <th className="p-4 w-32 font-medium">Nodes</th>
            <th className="p-4 text-right w-32 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {executions.map((exe) => (
            <tr 
              key={exe.id} 
              className="border-b border-border hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <td className="p-4">
                <span className="text-text-muted font-mono text-xs group-hover:text-text-primary transition-colors">{exe.id}</span>
              </td>
              <td className="p-4 text-text-primary font-medium">
                {exe.workflow}
              </td>
              <td className="p-4">
                {exe.status === 'success' && (
                  <span className="inline-flex items-center gap-1.5 text-success text-[10px] font-medium bg-success/10 border border-success/20 px-2 py-0.5 rounded tracking-wide">
                    <Check size={10} strokeWidth={3} /> SUCCESS
                  </span>
                )}
                {exe.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 text-warning text-[10px] font-medium bg-warning/10 border border-warning/20 px-2 py-0.5 rounded tracking-wide">
                    <X size={10} strokeWidth={3} /> FAILED
                  </span>
                )}
                {exe.status === 'running' && (
                  <span className="inline-flex items-center gap-1.5 text-brand text-[10px] font-medium bg-brand/10 border border-brand/20 px-2 py-0.5 rounded tracking-wide">
                    <Clock size={10} className="animate-spin" /> ACTIVE
                  </span>
                )}
              </td>
              <td className="p-4 text-text-secondary text-xs">{exe.duration}</td>
              <td className="p-4 text-text-secondary">
                <div className="flex gap-1 items-center h-full">
                  {Array.from({ length: Math.min(exe.nodes, 8) }).map((_, i) => (
                    <div key={i} className={`w-1 h-3 rounded-full ${exe.status === 'failed' && i === 1 ? 'bg-warning' : 'bg-zinc-700 group-hover:bg-zinc-500'} transition-colors`}></div>
                  ))}
                  {exe.nodes > 8 && <span className="text-[10px] ml-1 text-text-muted">+{exe.nodes - 8}</span>}
                </div>
              </td>
              <td className="p-4 text-right text-text-muted text-xs">{exe.timestamp}</td>
            </tr>
          ))}
          {executions.length === 0 && (
            <tr>
              <td colSpan={6} className="p-16 text-center text-text-muted text-sm border-b border-border bg-background">
                <Activity className="mx-auto mb-4 opacity-50 text-text-secondary" size={24} />
                No telemetry available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExecutionMonitor;
