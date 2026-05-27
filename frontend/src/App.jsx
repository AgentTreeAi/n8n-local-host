import { useState } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  Settings, 
  BarChart, 
  Zap, 
  Clock,
  Layers
} from 'lucide-react';
import './index.css';

function App() {
  const [triggering, setTriggering] = useState(false);
  const [lastOutput, setLastOutput] = useState(null);

  // Mock function to simulate firing a webhook to n8n
  const triggerWorkflow = async () => {
    setTriggering(true);
    setLastOutput(null);
    try {
      // Connect specifically to our local n8n instance's webhook
      // We proxy /webhook through Vite to avoid CORS issues!
      const response = await fetch('/webhook-test/hi-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          trigger: 'dashboard-ui'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }

      setLastOutput({ success: true, message: 'Workflow executed!' });
    } catch (err) {
      setLastOutput({ success: false, message: err.message });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Zap className="brand-icon" size={28} />
          <span>FlowManager</span>
        </div>
        
        <nav className="nav-links">
          <a href="#" className="nav-item active">
            <Activity size={20} />
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <Layers size={20} />
            Workflows
          </a>
          <a href="#" className="nav-item">
            <BarChart size={20} />
            Analytics
          </a>
          <a href="#" className="nav-item" style={{ marginTop: 'auto' }}>
            <Settings size={20} />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header-bar">
          <div className="header-title">
            <h1>Overview</h1>
            <p>Welcome back! Here's what's happening with your automations.</p>
          </div>
          <div className="header-actions">
            <button>
              <Settings size={18} /> Configure Webhooks
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="dashboard-stats">
          <div className="stat-card glass-panel">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <h3>12</h3>
              <p>Active Workflows</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <h3>1,429</h3>
              <p>Executions (30d)</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ color: 'var(--accent-orange)' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h3>99.9%</h3>
              <p>Uptime Status</p>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        <section className="workflow-section">
          <h2><Layers size={24} /> Quick Actions</h2>
          <div className="workflow-list">
            
            {/* Hi Gemini Workflow Card */}
            <div className="workflow-card glass-panel">
              <div className="workflow-main">
                <div className="workflow-status status-active"></div>
                <div className="workflow-details">
                  <h4>Hi Gemini Test</h4>
                  <p>Webhook</p>
                </div>
              </div>
              <div className="workflow-actions">
                {lastOutput && (
                  <span style={{ 
                    color: lastOutput.success ? 'var(--success)' : 'var(--error)', 
                    fontSize: '0.9rem',
                    marginRight: '1rem' 
                  }}>
                    {lastOutput.message}
                  </span>
                )}
                <button 
                  className={`btn-trigger ${triggering ? 'loading' : ''}`}
                  onClick={triggerWorkflow}
                  disabled={triggering}
                >
                  <Play size={16} /> 
                  {triggering ? 'Running...' : 'Run Now'}
                </button>
              </div>
            </div>
            
            {/* Template Card 2 */}
            <div className="workflow-card glass-panel" style={{ opacity: 0.6 }}>
              <div className="workflow-main">
                <div className="workflow-status status-inactive"></div>
                <div className="workflow-details">
                  <h4>Daily Report Generator</h4>
                  <p>Schedule: Everyday at 8:00 AM</p>
                </div>
              </div>
              <div className="workflow-actions">
                <button className="btn-trigger" disabled>
                  <Play size={16} /> Run Now
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
