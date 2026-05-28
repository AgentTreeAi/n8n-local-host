import { type FC } from 'react';
import { Shield, Key, Activity, Cpu, Database, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { MappedWorkflow, MappedExecution, MappedCredential } from '../hooks/useN8nData';
import { formatMs } from '../lib/formatters';

interface SystemHealthProps {
  workflows: MappedWorkflow[] | null;
  executions: MappedExecution[] | null;
  credentials: MappedCredential[] | null;
  instanceHealthy: boolean;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'OFFLINE';
  lastRefreshedAt: Date | null;
  onRefresh: () => void;
}

const SystemHealth: FC<SystemHealthProps> = ({ workflows, executions, credentials, instanceHealthy, connectionStatus, lastRefreshedAt, onRefresh }) => {
  const wfs = workflows || [];
  const execs = executions || [];
  const creds = credentials || [];

  const activeWfCount = wfs.filter(w => w.status === 'active').length;
  const totalWfCount = wfs.length;
  const totalExecs = execs.length;
  const successExecs = execs.filter(e => e.status === 'success').length;
  const failedExecs = execs.filter(e => e.status === 'failed').length;
  const runningExecs = execs.filter(e => e.status === 'running').length;

  // Group credentials by type
  const credByType: Record<string, number> = {};
  creds.forEach(c => {
    const shortType = c.type.replace(/Api$|Oauth2$|Auth$/i, '').replace(/([A-Z])/g, ' $1').trim();
    credByType[shortType] = (credByType[shortType] || 0) + 1;
  });

  // Overall success rate
  const overallSuccessRate = totalExecs > 0 ? ((successExecs / totalExecs) * 100).toFixed(1) : '---';

  // Average duration across all successful executions
  const avgDurationMs = successExecs > 0 
    ? execs.filter(e => e.status === 'success').reduce((sum, e) => sum + e.durationMs, 0) / successExecs 
    : 0;

  // Throughput: executions per hour in the last 24h
  const now = Date.now();
  const last24h = execs.filter(e => e.rawStartedAt && (now - new Date(e.rawStartedAt).getTime()) < 86400000);
  const throughputPerHour = last24h.length > 0 ? (last24h.length / 24).toFixed(1) : '0';

  // Identify workflows with recent failures
  const unhealthyWorkflows = wfs.filter(w => w.stats.lastRunStatus === 'failed');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Instance Status Banner */}
      <div className={`flex items-center justify-between p-4 border ${
        connectionStatus === 'CONNECTED' && instanceHealthy 
          ? 'border-brand/30 bg-brand/5' 
          : connectionStatus === 'OFFLINE' 
          ? 'border-warning/30 bg-warning/5' 
          : 'border-border bg-card'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${
            connectionStatus === 'CONNECTED' && instanceHealthy ? 'bg-brand shadow-brand animate-pulse' :
            connectionStatus === 'OFFLINE' ? 'bg-warning shadow-[0_0_10px_rgba(255,0,60,0.5)]' :
            'bg-yellow-500'
          }`} />
          <div>
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary">
              {connectionStatus === 'CONNECTED' && instanceHealthy ? 'SYSTEM_NOMINAL' :
               connectionStatus === 'OFFLINE' ? 'SYSTEM_OFFLINE' : 'SYSTEM_CONNECTING'}
            </div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-0.5">
              n8n.workflowsolution.org — Last sync: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 bg-brand text-black font-bold hover:bg-brand-hover transition-colors"
        >
          <RefreshCw size={10} /> SYNC_NOW
        </button>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-card border border-border hover:border-brand transition-colors group">
          <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors">
            <Database size={10} /> WORKFLOWS
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-brand">{activeWfCount}</span>
            <span className="text-sm font-mono text-text-muted">/ {totalWfCount}</span>
          </div>
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mt-1">ACTIVE / TOTAL</div>
        </div>

        <div className="p-4 bg-card border border-border hover:border-brand transition-colors group">
          <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors">
            <Activity size={10} /> THROUGHPUT
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary">{throughputPerHour}</span>
            <span className="text-xs font-mono text-text-muted">/hr</span>
          </div>
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mt-1">LAST 24H AVG</div>
        </div>

        <div className="p-4 bg-card border border-border hover:border-brand transition-colors group">
          <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors">
            <Shield size={10} /> SUCCESS_RATE
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${overallSuccessRate !== '---' && parseFloat(overallSuccessRate) >= 90 ? 'text-brand' : overallSuccessRate !== '---' && parseFloat(overallSuccessRate) >= 50 ? 'text-yellow-500' : 'text-warning'}`}>
              {overallSuccessRate}{overallSuccessRate !== '---' ? '%' : ''}
            </span>
          </div>
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mt-1">ALL EXECUTIONS</div>
        </div>

        <div className="p-4 bg-card border border-border hover:border-brand transition-colors group">
          <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors">
            <Cpu size={10} /> AVG_DURATION
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary">{avgDurationMs > 0 ? formatMs(avgDurationMs) : '---'}</span>
          </div>
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mt-1">SUCCESSFUL RUNS</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Credential Inventory */}
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between p-3 border-b border-border bg-black">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
              <Key size={14} className="text-brand" />
              CREDENTIAL_REGISTRY ({creds.length})
            </h3>
          </div>
          
          {creds.length > 0 ? (
            <div className="divide-y divide-[#111111]">
              {creds.map(cred => {
                const shortType = cred.type.replace(/Api$|Oauth2$|Auth$/i, '').replace(/([A-Z])/g, ' $1').trim();
                return (
                  <div key={cred.id} className="flex items-center px-4 py-2.5 hover:bg-[#0a0a0a] transition-colors group">
                    <div className="flex items-center gap-2 flex-1">
                      <Key size={10} className="text-brand/50 shrink-0" />
                      <span className="text-text-primary text-[11px] font-mono truncate">{cred.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest px-2 py-0.5 bg-[#0a0a0a] border border-[#1f1f1f]">
                      {shortType}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-[10px] font-mono text-text-muted uppercase tracking-widest">
              [NO_CREDENTIALS_FOUND]
            </div>
          )}
        </div>

        {/* Workflow Health Report */}
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between p-3 border-b border-border bg-black">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
              <Shield size={14} className="text-brand" />
              WORKFLOW_HEALTH_REPORT
            </h3>
          </div>
          
          <div className="divide-y divide-[#111111]">
            {wfs.map(wf => (
              <div key={wf.id} className="flex items-center px-4 py-2.5 hover:bg-[#0a0a0a] transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {wf.stats.lastRunStatus === 'success' && <CheckCircle2 size={10} className="text-success shrink-0" />}
                  {wf.stats.lastRunStatus === 'failed' && <XCircle size={10} className="text-warning shrink-0" />}
                  {!wf.stats.lastRunStatus && <div className="w-2.5 h-2.5 bg-[#1f1f1f] shrink-0" />}
                  <span className="text-text-primary text-[11px] font-mono truncate">{wf.name}</span>
                </div>
                
                {/* Mini success bar */}
                {wf.stats.totalExecutions > 0 ? (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-16 h-1 bg-[#1f1f1f] overflow-hidden flex">
                      <div className="bg-success h-full" style={{ width: `${wf.stats.successRate}%` }} />
                    </div>
                    <span className={`text-[9px] font-mono w-8 text-right ${wf.stats.successRate >= 90 ? 'text-brand' : wf.stats.successRate >= 50 ? 'text-yellow-500' : 'text-warning'}`}>
                      {wf.stats.successRate.toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-text-muted ml-2">NO RUNS</span>
                )}

                <span className={`text-[9px] font-mono uppercase tracking-widest ml-3 px-1.5 py-0.5 ${
                  wf.status === 'active' ? 'text-brand bg-brand/5 border border-brand/20' : 'text-text-muted bg-[#0a0a0a] border border-[#1f1f1f]'
                }`}>
                  {wf.status}
                </span>
              </div>
            ))}
          </div>

          {wfs.length === 0 && (
            <div className="p-8 text-center text-[10px] font-mono text-text-muted uppercase tracking-widest">
              [NO_WORKFLOWS]
            </div>
          )}
        </div>
      </div>

      {/* Unhealthy Workflows Alert */}
      {unhealthyWorkflows.length > 0 && (
        <div className="border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-warning" />
            <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-warning">
              ATTENTION_REQUIRED — {unhealthyWorkflows.length} workflow{unhealthyWorkflows.length > 1 ? 's' : ''} with recent failures
            </h4>
          </div>
          <div className="space-y-2">
            {unhealthyWorkflows.map(wf => (
              <div key={wf.id} className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-warning">▸</span>
                <span className="text-text-primary">{wf.name}</span>
                <span className="text-text-muted">—</span>
                <span className="text-warning/80 normal-case truncate max-w-md">
                  {wf.stats.lastErrorMessage || 'Unknown error'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
