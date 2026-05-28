import { useState, useEffect } from 'react';
import { Activity, Play, Settings, Cpu, HardDrive, Database, ListFilter, BarChart3, TerminalSquare } from 'lucide-react';
import ExecutionMonitor from './components/ExecutionMonitor';
import Workflows from './components/Workflows';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Relative human-readable time formatter (e.g. "Just now", "2m ago")
function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return 'N/A';
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Duration calculator (e.g. "965ms", "1.2s")
function formatDuration(startedAt: string | undefined, stoppedAt: string | undefined): string {
  if (!startedAt) return '0ms';
  const start = new Date(startedAt).getTime();
  const stop = stoppedAt ? new Date(stoppedAt).getTime() : new Date().getTime();
  const diffMs = stop - start;
  if (isNaN(diffMs) || diffMs < 0) return '0ms';
  if (diffMs < 1000) return `${diffMs}ms`;
  return `${(diffMs / 1000).toFixed(1)}s`;
}

// Dynamically bin executions into 6 intervals across the last 24 hours
function generateChartData(executionsList: any[] | null): { time: string; executions: number }[] {
  const defaultBins = [
    { time: '00:00', executions: 0 },
    { time: '04:00', executions: 0 },
    { time: '08:00', executions: 0 },
    { time: '12:00', executions: 0 },
    { time: '16:00', executions: 0 },
    { time: '20:00', executions: 0 },
    { time: '24:00', executions: 0 },
  ];
  if (!executionsList || executionsList.length === 0) {
    return defaultBins;
  }
  const now = new Date();
  const bins = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (24 - i * 4) * 60 * 60 * 1000);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: d.getTime(),
      executions: 0
    };
  });

  executionsList.forEach(exe => {
    const startedAtStr = exe.rawStartedAt;
    if (!startedAtStr) return;
    const exeTime = new Date(startedAtStr).getTime();
    for (let i = 0; i < bins.length - 1; i++) {
      if (exeTime >= bins[i].timestamp && exeTime < bins[i+1].timestamp) {
        bins[i].executions++;
        break;
      }
    }
    if (exeTime >= bins[bins.length - 1].timestamp) {
      bins[bins.length - 1].executions++;
    }
  });

  return bins.map(b => ({ time: b.time, executions: b.executions }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-brand p-3 shadow-brand">
        <p className="text-text-secondary text-xs font-mono mb-1">{label}</p>
        <p className="text-brand font-mono font-bold flex items-center gap-2">
          <Activity size={14} />
          {payload[0].value} EXECUTIONS
        </p>
      </div>
    );
  }
  return null;
};

function App() {
  const [activeTab, setActiveTab] = useState('monitor');

  // Real dynamic states
  const [workflows, setWorkflows] = useState<any[] | null>(null);
  const [executions, setExecutions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setConnectionStatus('CONNECTING');
        const apiKey = import.meta.env.VITE_N8N_API_KEY || '';
        const headers: HeadersInit = {
          'Accept': 'application/json'
        };
        if (apiKey) {
          headers['X-N8N-API-KEY'] = apiKey;
        }

        // Fetch workflows
        const wfRes = await fetch('/api/v1/workflows', { headers });
        if (!wfRes.ok) throw new Error(`Workflows fetch failed: ${wfRes.status}`);
        const wfJson = await wfRes.json();
        const wfData = wfJson.data || [];

        // Fetch executions
        const exeRes = await fetch('/api/v1/executions', { headers });
        if (!exeRes.ok) throw new Error(`Executions fetch failed: ${exeRes.status}`);
        const exeJson = await exeRes.json();
        const exeData = exeJson.data || [];

        if (active) {
          // Map workflows
          const mappedWorkflows = wfData.map((wf: any) => ({
            id: wf.id,
            name: wf.name,
            status: wf.active ? 'active' : 'inactive',
            created: formatRelativeTime(wf.createdAt),
            updated: formatRelativeTime(wf.updatedAt),
            nodesCount: Array.isArray(wf.nodes) ? wf.nodes.length : 0
          }));

          // Map executions
          const mappedExecutions = exeData.map((exe: any) => {
            const matchedWf = mappedWorkflows.find((w: any) => w.id === exe.workflowId);
            return {
              id: `EXE-${exe.id}`,
              workflow: matchedWf ? matchedWf.name : 'Unknown Process',
              status: exe.status === 'success' ? 'success' : (exe.status === 'failed' ? 'failed' : 'running'),
              duration: formatDuration(exe.startedAt, exe.stoppedAt),
              timestamp: formatRelativeTime(exe.startedAt),
              rawStartedAt: exe.startedAt,
              nodes: matchedWf ? matchedWf.nodesCount : 0
            };
          });

          setWorkflows(mappedWorkflows);
          setExecutions(mappedExecutions);
          setConnectionStatus('CONNECTED');
          setLoading(false);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (active) {
          setWorkflows(null);
          setExecutions(null);
          setConnectionStatus('OFFLINE');
          setLoading(false);
        }
      }
    }

    fetchData();
    
    // Set up polling interval every 15 seconds to keep the monitor updated
    const interval = setInterval(fetchData, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Stats calculations
  const totalExecs = executions ? executions.length : 0;
  const totalExecsFormatted = executions ? totalExecs.toLocaleString() : '---';
  
  // Success rate
  let successRate = '---';
  if (executions && executions.length > 0) {
    const successCount = executions.filter((e: any) => e.status === 'success').length;
    successRate = `${((successCount / totalExecs) * 100).toFixed(1)}%`;
  }

  // Errors in last 24h
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
      let totalMs = 0;
      let counted = 0;
      successfulExecs.forEach((e: any) => {
        const durStr = e.duration;
        let ms = 0;
        if (durStr.endsWith('ms')) {
          ms = parseInt(durStr.slice(0, -2)) || 0;
        } else if (durStr.endsWith('s')) {
          ms = parseFloat(durStr.slice(0, -1)) * 1000 || 0;
        }
        if (!isNaN(ms)) {
          totalMs += ms;
          counted++;
        }
      });
      avgCompTime = counted > 0 ? `${Math.round(totalMs / counted)}ms` : '---';
    }
  }

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
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-6 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'monitor' ? 'bg-brand text-black shadow-brand' : 'bg-card border border-border text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            Monitor
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-6 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'workflows' ? 'bg-brand text-black shadow-brand' : 'bg-card border border-border text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            Workflows
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'bg-brand text-black shadow-brand' : 'bg-card border border-border text-text-secondary hover:text-brand hover:border-brand'}`}
          >
            Settings
          </button>
        </nav>

        <div className="flex items-center gap-4 text-xs font-mono hidden md:flex uppercase tracking-wider">
          {connectionStatus === 'CONNECTED' && (
            <div className="flex items-center gap-2 text-brand">
              <span className="w-2 h-2 bg-brand shadow-brand animate-pulse"></span>
              SYS_OPS_CONNECTED
            </div>
          )}
          {connectionStatus === 'CONNECTING' && (
            <div className="flex items-center gap-2 text-brand/60 animate-pulse">
              <span className="w-2 h-2 bg-brand/50"></span>
              SYS_CONN_CONNECTING
            </div>
          )}
          {connectionStatus === 'OFFLINE' && (
            <div className="flex items-center gap-2 text-warning animate-pulse">
              <span className="w-2 h-2 bg-warning shadow-[0_0_10px_rgba(255,0,60,0.5)]"></span>
              SYS_CONN_OFFLINE
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-background">
        {/* Minimal Side Rail - Vertical System Resource Strip */}
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
          <div className="mt-auto w-full flex flex-col items-center gap-4">
            <div className="w-full h-px bg-border"></div>
            <button className="p-2 text-text-secondary hover:text-brand transition-colors hover:bg-brand/10 border border-transparent hover:border-brand">
              <Settings size={20} />
            </button>
          </div>
        </aside>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto relative">
          
          <div className="mx-auto w-full p-4 md:p-6">
            {activeTab === 'monitor' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                
                {/* Telemetry Ribbon (LED Segment Display style) */}
                <div className="flex overflow-x-auto gap-4">
                  <div className="flex-1 min-w-[200px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><Activity size={12}/> VOL_TOTAL</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">{totalExecsFormatted}</span>
                      <span className="text-xs font-mono text-brand uppercase tracking-widest">[TOTAL]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><BarChart3 size={12}/> SR_RATIO</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-brand tracking-tight">{successRate}</span>
                      <span className="text-xs font-mono text-brand uppercase tracking-widest">[OK]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-warning transition-colors"><Cpu size={12}/> ERR_TOTAL</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-warning tracking-tight shadow-[0_0_10px_rgba(255,0,60,0.5)]">{errors24h}</span>
                      <span className="text-xs font-mono text-warning uppercase tracking-widest">[ERR]</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 bg-card border border-border flex flex-col justify-center hover:border-brand transition-colors group">
                    <div className="text-[10px] text-text-secondary font-mono mb-2 uppercase tracking-widest flex items-center gap-2 group-hover:text-brand transition-colors"><HardDrive size={12}/> CMPT_AVG</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">
                        {avgCompTime === '---' ? '---' : avgCompTime.replace('ms', '')}
                      </span>
                      {avgCompTime !== '---' && <span className="text-sm font-mono text-text-secondary">ms</span>}
                      <span className="text-xs font-mono text-brand uppercase tracking-widest ml-1">[AVG]</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Main Chart */}
                  <div className="bg-card border border-border p-5 h-[320px] flex flex-col relative overflow-hidden group hover:border-brand/50 transition-colors">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-text-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand"></span>
                        Execution_Volume [24h]
                      </h3>
                      <div className="flex items-center gap-2 bg-black border border-border p-1">
                        <button className="px-3 py-1 text-xs font-mono bg-brand text-black font-bold tracking-wider">24H</button>
                        <button className="px-3 py-1 text-xs font-mono text-text-secondary hover:text-brand tracking-wider">7D</button>
                        <button className="px-3 py-1 text-xs font-mono text-text-secondary hover:text-brand tracking-wider">30D</button>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#39ff14" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
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
                      <div className="flex items-center gap-3">
                        <button className="text-[10px] font-mono tracking-widest uppercase text-text-secondary hover:text-brand hover:border-brand flex items-center gap-2 border border-border px-3 py-1.5 bg-black transition-colors">
                          <ListFilter size={12} /> Apply_Filter
                        </button>
                      </div>
                    </div>
                    <ExecutionMonitor executions={executions} workflows={workflows} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="animate-in fade-in duration-300">
                <Workflows workflows={workflows} />
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="flex items-center justify-center h-full min-h-[400px] text-brand font-mono text-sm animate-in fade-in uppercase tracking-widest">
                <span className="animate-pulse">&gt; SYS_CONFIG_OFFLINE_</span>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
