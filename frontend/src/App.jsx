import { useState } from 'react';
import { Activity, Play, Settings, Cpu, HardDrive, Database, ListFilter, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import ExecutionMonitor from './components/ExecutionMonitor';
import Workflows from './components/Workflows';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: '00:00', executions: 400 },
  { time: '04:00', executions: 300 },
  { time: '08:00', executions: 550 },
  { time: '12:00', executions: 800 },
  { time: '16:00', executions: 600 },
  { time: '20:00', executions: 950 },
  { time: '24:00', executions: 700 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-lg shadow-xl">
        <p className="text-zinc-400 text-xs font-mono mb-1">{label}</p>
        <p className="text-brand font-semibold flex items-center gap-2">
          <Activity size={14} />
          {payload[0].value} Executions
        </p>
      </div>
    );
  }
  return null;
};

function App() {
  const [activeTab, setActiveTab] = useState('monitor');

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand selection:text-white text-sm">
      {/* Top Header Navigation */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand rounded-md text-white flex items-center justify-center font-bold text-lg leading-none shadow-brand">
            n
          </div>
          <h1 className="font-semibold text-lg tracking-tight text-text-primary">n8n<span className="text-text-muted font-normal">.terminal</span></h1>
        </div>
        
        <nav className="flex items-center gap-1 bg-background border border-border p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'monitor' ? 'bg-card border border-border text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Monitor
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'workflows' ? 'bg-card border border-border text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Workflows
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'settings' ? 'bg-card border border-border text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Settings
          </button>
        </nav>

        <div className="flex items-center gap-4 text-xs text-text-secondary hidden md:flex font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            All Systems Operational
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-background">
        {/* Minimal Side Rail */}
        <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-6 gap-6 z-10 relative hidden sm:flex">
          <button className="p-2 text-text-secondary hover:text-brand transition-colors rounded-lg group relative">
            <Play size={20} />
            <span className="absolute left-14 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-border text-text-primary rounded shadow-lg">Execute</span>
          </button>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`p-2 transition-colors rounded-lg group relative ${activeTab === 'monitor' ? 'text-brand bg-brand/10 border border-brand/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
          >
            <Activity size={20} />
            <span className="absolute left-14 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-border text-text-primary rounded shadow-lg">Monitor</span>
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`p-2 transition-colors rounded-lg group relative ${activeTab === 'workflows' ? 'text-brand bg-brand/10 border border-brand/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
          >
            <Database size={20} />
            <span className="absolute left-14 bg-card text-xs px-2 py-1 hidden group-hover:block whitespace-nowrap z-50 border border-border text-text-primary rounded shadow-lg">Workflows</span>
          </button>
          <div className="mt-auto">
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-white/5">
              <Settings size={20} />
            </button>
          </div>
        </aside>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto relative">
          
          <div className="mx-auto w-full max-w-[1400px]">
            {activeTab === 'monitor' && (
              <div className="animate-in fade-in duration-300">
                
                {/* Telemetry Ribbon */}
                <div className="border-b border-border bg-card flex overflow-x-auto">
                  <div className="flex-1 min-w-[200px] p-4 px-6 border-r border-border flex flex-col justify-center">
                    <div className="text-xs text-text-secondary font-medium mb-1 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> Total Vol</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-text-primary tracking-tight">14,203</span>
                      <span className="text-xs font-medium text-success flex items-center"><TrendingUp size={12} className="mr-0.5"/> 12.5%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 px-6 border-r border-border flex flex-col justify-center">
                    <div className="text-xs text-text-secondary font-medium mb-1 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={14}/> Success Rate</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-success tracking-tight">99.9%</span>
                      <span className="text-xs font-medium text-success flex items-center"><TrendingUp size={12} className="mr-0.5"/> 0.1%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 px-6 border-r border-border flex flex-col justify-center">
                    <div className="text-xs text-text-secondary font-medium mb-1 uppercase tracking-wider flex items-center gap-2"><Cpu size={14}/> Failures (24h)</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-warning tracking-tight">3</span>
                      <span className="text-xs font-medium text-success flex items-center"><TrendingDown size={12} className="mr-0.5"/> 2.4%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] p-4 px-6 flex flex-col justify-center">
                    <div className="text-xs text-text-secondary font-medium mb-1 uppercase tracking-wider flex items-center gap-2"><HardDrive size={14}/> Compute Avg</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-text-primary tracking-tight font-mono">942ms</span>
                      <span className="text-xs font-medium text-success flex items-center"><TrendingDown size={12} className="mr-0.5"/> 50ms</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-8 space-y-6">
                  {/* Main Chart */}
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="text-sm font-medium text-text-primary">Execution Volume (24h)</h3>
                      <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                        <button className="px-3 py-1 text-xs font-medium rounded bg-card border border-border shadow-sm text-text-primary">24h</button>
                        <button className="px-3 py-1 text-xs font-medium rounded text-text-secondary hover:text-text-primary">7d</button>
                        <button className="px-3 py-1 text-xs font-medium rounded text-text-secondary hover:text-text-primary">30d</button>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area 
                            type="monotone" 
                            dataKey="executions" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorExec)" 
                            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2, className: 'shadow-[0_0_10px_rgba(99,102,241,0.8)] drop-shadow-lg' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* The Execution Grid */}
                  <div className="border border-border bg-card rounded-xl flex flex-col shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between p-4 border-b border-border gap-4">
                      <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                        <Activity size={16} className="text-brand" />
                        Live Telemetry Stream
                      </h3>
                      <div className="flex items-center gap-3">
                        <button className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 border border-border px-3 py-1.5 rounded-md bg-background hover:bg-zinc-800 transition-colors">
                          <ListFilter size={14} /> Filter
                        </button>
                      </div>
                    </div>
                    <ExecutionMonitor />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="p-4 md:p-8">
                <Workflows />
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="flex items-center justify-center h-full min-h-[400px] text-text-muted animate-in fade-in">
                Configuration panel offline.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
