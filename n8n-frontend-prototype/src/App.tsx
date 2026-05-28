import { useState } from 'react';
import { Activity, Play, Settings, Cpu, HardDrive, Database, ListFilter, BarChart3, TerminalSquare, Shield, RefreshCw } from 'lucide-react';
import ExecutionMonitor from './components/ExecutionMonitor';
import Workflows from './components/Workflows';
import SystemHealth from './components/SystemHealth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useN8nData } from './hooks/useN8nData';
import { formatMs } from './lib/formatters';

// Dynamically bin executions into 6 intervals across the last 24 hours
function generateChartData(executionsList: any[] | null): { time: string; executions: number; success: number; failed: number }[] {
  const defaultBins = Array.from({ length: 7 }, (_, i) => ({
    time: `${String(i * 4).padStart(2, '0')}:00`,
    executions: 0,
    success: 0,
    failed: 0,
  }));
  if (!executionsList || executionsList.length === 0) {
    return defaultBins;
  }
  const now = new Date();
  const bins = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (24 - i * 4) * 60 * 60 * 1000);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: d.getTime(),
      executions: 0,
      success: 0,
      failed: 0,
    };
  });

  executionsList.forEach(exe => {
    const startedAtStr = exe.rawStartedAt;
    if (!startedAtStr) return;
    const exeTime = new Date(startedAtStr).getTime();
    for (let i = 0; i < bins.length - 1; i++) {
      if (exeTime >= bins[i].timestamp && exeTime < bins[i+1].timestamp) {
        bins[i].executions++;
        if (exe.status === 'success') bins[i].success++;
        if (exe.status === 'failed') bins[i].failed++;
        break;
      }
    }
    if (exeTime >= bins[bins.length - 1].timestamp) {
      bins[bins.length - 1].executions++;
      if (exe.status === 'success') bins[bins.length - 1].success++;
      if (exe.status === 'failed') bins[bins.length - 1].failed++;
    }
  });

  return bins.map(b => ({ time: b.time, executions: b.executions, success: b.success, failed: b.failed }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-brand p-3 shadow-brand">
        <p className="text-text-secondary text-xs font-mono mb-1">{label}</p>
        <p className="text-brand font-mono font-bold flex items-center gap-2 text-xs">
          <Activity size={12} />
          {payload[0]?.value || 0} TOTAL
        </p>
        {payload[1] && (
          <p className="text-success font-mono text-xs flex items-center gap-2 mt-0.5">
            ✓ {payload[1].value} OK
          </p>
        )}
        {payload[2] && payload[2].value > 0 && (
          <p className="text-warning font-mono text-xs flex items-center gap-2 mt-0.5">
            ✗ {payload[2].value} FAILED
          </p>
        )}
      </div>
    );
  }
  return null;
};

function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const { 
    workflows, executions, credentials, 
    loading, connectionStatus, instanceHealthy, lastRefreshedAt,
    refresh, toggleWorkflow, retryExecution 
  } = useN8nData();

  // Stats calculations
  const totalExecs = executions ? executions.length : 0;
  const totalExecsFormatted = executions ? totalExecs.toLocaleString() : '---';
  
  // Success rate
  let successRate = '---';
  if (executions && executions.length > 0) {
    const successCount = executions.filter((e: any) => e.status === 'success').length;
    successRate = `${((successCount / totalExecs) * 100).toFixed(1)}%`;
  }

  // Errors
  let errors24h = '00';
  if (executions) {
    const failedCount = executions.filter((e: any) => e.status === 'failed').length;
    errors24h = failedCount.toString().padStart(2, '0');
  }

  // Average computation time
  let avgCompTime = '---';
  if (executions && executions.length > 0) {
    const successfulExecs = executions.filter((e: any) => e.status === 'success');
    if (successfulExecs.length > 0) {
      const totalMs = successfulExecs.reduce((sum: number, e: any) => sum + e.durationMs, 0);
      avgCompTime = formatMs(totalMs / successfulExecs.length);
    }
  }

  // Active workflows count
  const activeWfCount = workflows ? workflows.filter(w => w.status === 'active').length : 0;

  const dynamicChartData = generateChartData(executions);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-brand text-xs uppercase tracking-widest gap-3">
        <div className="animate-pulse flex items-center gap-2">
          <TerminalSquare size={16} className="text-brand" />
          <span>&gt; SYS_BOOT::INITIALIZING_COMMAND_CENTER...</span>
        </div>
        <span className="text-[9px] text-text-secondary opacity-60">ESTABLISHING DATA-STREAM WITH PORT 5678</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand selection:text-black text-sm bg-background">
      {/* Top Header Navigation - Dense Status Bar */}
      <header className="border-b border-border bg-black px-4 py-2 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-brand text-black flex items-center justify-center font-bold text-lg leading-none shadow-brand">
            <TerminalSquare size={20} className="text-black" />
          </div>
          <h1 className="font-bold text-lg tracking-widest uppercase text-text-primary">N8N<span className="text-brand">.TERMINAL</span></h1>
        </div>
        
        <nav className="flex items-center gap-2">
          {[
            { key: 'monitor', label: 'Monitor' },
            { key: 'workflows', label: 'Workflows' },
            { key: 'system', label: 'System' },
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === tab.key ? 'bg-brand text-black shadow-brand' : 'bg-card border border-border text-text-secondary hover:text-brand hover:border-brand'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-xs font-mono hidden md:flex uppercase tracking-wider">
          {/* Active workflow count */}
          <div className="flex items-center gap-2 text-text-secondary">
            <Database size={12} className="text-brand" />
            {activeWfCount} WF_ACTIVE
          </div>

          {connectionStatus === 'CONNECTED' && (
            <div className="flex items-center gap-2 text-brand">
              <span className="w-2 h-2 bg-brand shadow-brand animate-pulse"></span>
              CONNECTED
            </div>
          )}
          {connectionStatus === 'CONNECTING' && (
            <div className="flex items-center gap-2 text-brand/60 animate-pulse">
              <span className="w-2 h-2 bg-brand/50"></span>
              CONNECTING
            </div>
          )}
          {connectionStatus === 'OFFLINE' && (
            <div className="flex items-center gap-2 text-warning animate-pulse">
              <span className="w-2 h-2 bg-warning shadow-[0_0_10px_rgba(255,0,60,0.5)]"></span>
              OFFLINE
            </div>
          )}
          <button onClick={refresh} className="p-1 text-text-muted hover:text-brand transition-colors" title="Refresh data">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-background">
        {/* Minimal Side Rail */}
        <aside className="w-14 border-r border-border bg-card flex flex-col items-center py-4 gap-4 z-10 relative hidden sm:flex">
          <button className="p-2 text-text-secondary hover:text-brand transition-colors hover:bg-brand/10 group relative border border-transparent hover:border-brand">
            <Play size={20} />
          </button>
          <div className="w-full h-px bg-border"></div>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`p-2 transition-colors group relative border ${activeTab === 'monitor' ? 'text-brand border-brand bg-brand/10' : 'text-text-secondary border-transparent hover:text-brand hover:border-brand'}`}
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`p-2 transition-colors group relative border ${activeTab === 'workflows' ? 'text-brand border-brand bg-brand/10' : 'text-text-secondary border-transparent hover:text-brand hover:border-brand'}`}
          >
            <Database size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`p-2 transition-colors group relative border ${activeTab === 'system' ? 'text-brand border-brand bg-brand/10' : 'text-text-secondary border-transparent hover:text-brand hover:border-brand'}`}
          >
            <Shield size={20} />
          </button>
          <div className="mt-auto w-full flex flex-col items-center gap-4">
            <div className="w-full h-px bg-border"></div>
            <button onClick={refresh} className="p-2 text-text-secondary hover:text-brand transition-colors hover:bg-brand/10 border border-transparent hover:border-brand">
              <RefreshCw size={20} />
            </button>
          </div>
        </aside>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto relative">
          
          <div className="mx-auto w-full p-4 md:p-6">
            {activeTab === 'monitor' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                
                {/* Telemetry Ribbon */}
                <div className="flex overflow-x-auto gap-4">
                  <div className="flex-1 min-w-[180px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><Activity size={12}/> VOL_TOTAL</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">{totalExecsFormatted}</span>
                      <span className="text-xs font-mono text-brand uppercase tracking-widest">[TOTAL]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[180px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><BarChart3 size={12}/> SR_RATIO</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-brand tracking-tight">{successRate}</span>
                      <span className="text-xs font-mono text-brand uppercase tracking-widest">[OK]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[180px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-warning transition-colors"><Cpu size={12}/> ERR_TOTAL</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-warning tracking-tight shadow-[0_0_10px_rgba(255,0,60,0.5)]">{errors24h}</span>
                      <span className="text-xs font-mono text-warning uppercase tracking-widest">[ERR]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[180px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><HardDrive size={12}/> CMPT_AVG</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">{avgCompTime}</span>
                      <span className="text-xs font-mono text-brand uppercase tracking-widest ml-1">[AVG]</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Main Chart — now with success/fail overlay */}
                  <div className="bg-card border border-border p-5 h-[320px] flex flex-col relative overflow-hidden group hover:border-brand/50 transition-colors">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand"></span>
                        Execution_Volume [24h]
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-widest">
                          <span className="flex items-center gap-1"><span className="w-2 h-1 bg-success"></span> Success</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-1 bg-warning"></span> Failed</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff003c" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ff003c" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="1 4" stroke="#1f1f1f" vertical={false} />
                          <XAxis dataKey="time" stroke="#444444" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} tickMargin={10} />
                          <YAxis stroke="#444444" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} tickMargin={10} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#39ff14', strokeWidth: 1, strokeDasharray: '2 2' }} />
                          <Area 
                            type="step" 
                            dataKey="executions" 
                            stroke="#39ff14" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorExec)" 
                            activeDot={{ r: 0, fill: '#39ff14', stroke: '#39ff14', strokeWidth: 2 }}
                          />
                          <Area 
                            type="step" 
                            dataKey="success" 
                            stroke="#39ff14" 
                            strokeWidth={0} 
                            fillOpacity={0} 
                            fill="transparent"
                          />
                          <Area 
                            type="step" 
                            dataKey="failed" 
                            stroke="#ff003c" 
                            strokeWidth={1.5} 
                            strokeDasharray="4 2"
                            fillOpacity={1} 
                            fill="url(#colorFailed)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* The Execution Grid */}
                  <div className="border border-border bg-card flex flex-col overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between p-3 border-b border-border bg-black gap-4">
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
                        <Activity size={14} className="text-brand animate-pulse" />
                        SYS_STREAM :: LIVE
                      </h3>
                    </div>
                    <ExecutionMonitor executions={executions} workflows={workflows} onRetryExecution={retryExecution} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="animate-in fade-in duration-300">
                <Workflows 
                  workflows={workflows} 
                  executions={executions}
                  onToggleWorkflow={toggleWorkflow}
                  onRetryExecution={retryExecution}
                />
              </div>
            )}
            
            {activeTab === 'system' && (
              <SystemHealth 
                workflows={workflows}
                executions={executions}
                credentials={credentials}
                instanceHealthy={instanceHealthy}
                connectionStatus={connectionStatus}
                lastRefreshedAt={lastRefreshedAt}
                onRefresh={refresh}
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
