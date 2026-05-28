import { type FC } from 'react';
import { Terminal, Activity, FileJson, Clock, ChevronRight } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created: string;
  updated: string;
}

interface WorkflowsProps {
  workflows: Workflow[] | null;
}

const Workflows: FC<WorkflowsProps> = ({ workflows }) => {
  const displayWorkflows = workflows || [];

  return (
    <div className="space-y-6">
      
      {/* CLI-Style Search Bar */}
      <div className="bg-black border border-border flex items-center p-1 focus-within:border-brand transition-colors">
        <div className="bg-brand text-black p-2 flex items-center justify-center">
          <Terminal size={16} />
        </div>
        <input 
          type="text" 
          placeholder="root@n8n.terminal:~# query workflows WHERE status = 'active'" 
          className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-mono placeholder:text-[#444444] text-brand"
        />
        <div className="flex items-center gap-1 pr-1 font-mono text-[10px] uppercase tracking-widest">
          <button className="text-text-primary bg-[#1f1f1f] px-4 py-2 hover:bg-[#333333] transition-colors border border-transparent">
            ALL:{displayWorkflows.length.toString().padStart(2, '0')}
          </button>
          <button className="text-text-secondary bg-transparent px-4 py-2 hover:text-brand hover:border-brand border border-transparent transition-colors">
            ACTIVE:{displayWorkflows.filter((w) => w.status === 'active').length.toString().padStart(2, '0')}
          </button>
          <button className="bg-brand text-black px-4 py-2 hover:bg-brand-hover transition-colors font-bold flex items-center gap-2 ml-2">
            <FileJson size={12} /> NEW_WF
          </button>
        </div>
      </div>

      {/* Grid Workflow List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayWorkflows.map((wf) => (
          <div 
            key={wf.id} 
            className="border border-border bg-[#0a0a0a] flex flex-col group hover:border-brand transition-colors cursor-pointer relative overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${wf.status === 'active' ? 'bg-brand shadow-brand' : 'bg-[#1f1f1f]'} transition-colors`} />
            
            <div className="p-4 pl-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-text-muted font-mono text-[10px] px-1.5 py-0.5 border border-[#1f1f1f] group-hover:border-brand/30 transition-colors uppercase tracking-widest bg-black">{wf.id}</span>
                <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
              </div>
              
              <h4 className="text-text-primary font-bold text-sm mb-4 truncate group-hover:text-brand transition-colors">
                {wf.name}
              </h4>
              
              <div className="flex items-center justify-between mt-auto border-t border-[#111111] pt-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  <Clock size={10} /> {wf.created}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  <Activity size={10} /> {wf.updated}
                </div>
              </div>
            </div>
            
            {/* Circuit Line Accents */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-transparent group-hover:border-brand/30 transition-colors" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-transparent group-hover:border-brand/30 transition-colors" />
          </div>
        ))}
      </div>

      {displayWorkflows.length === 0 && (
        <div className="p-16 flex flex-col items-center justify-center text-text-muted text-[11px] border border-border bg-[#050505] font-mono uppercase tracking-wider">
          <Terminal className="mb-4 opacity-30 text-brand animate-pulse" size={24} />
          [SYS_CONFIG_OFFLINE_OR_EMPTY]
        </div>
      )}
    </div>
  );
};

export default Workflows;

