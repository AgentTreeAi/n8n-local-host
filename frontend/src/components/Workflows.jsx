import { ListFilter, Activity, FileJson, Clock, MoreVertical, Terminal } from 'lucide-react';

const mockWorkflows = [
  { id: '1dEfAb6L', name: 'Todoist Grocery Run Compiler', status: 'active', created: '7 hours ago', updated: '23 min ago' },
  { id: 'U1i3kRbr', name: 'Todoist Weekly Review', status: 'active', created: '7 hours ago', updated: '44 min ago' },
  { id: '3I8ttHD2', name: 'Todoist Stale Task Detector', status: 'active', created: '7 hours ago', updated: '1 hour ago' },
  { id: 'q5gn6Fyp', name: 'Todoist Label-Smart Notifications', status: 'inactive', created: '7 hours ago', updated: '6 min ago' },
  { id: '1R1wBEaC', name: 'Todoist Deadline Early Warning', status: 'inactive', created: '7 hours ago', updated: '7 hours ago' },
  { id: 'd2vg7POc', name: 'Todoist Overdue Escalator', status: 'inactive', created: '7 hours ago', updated: '7 hours ago' },
];

const Workflows = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CLI-Style Search Bar */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-2 flex items-center gap-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-all">
        <div className="bg-background rounded p-2 text-brand">
          <Terminal size={18} />
        </div>
        <input 
          type="text" 
          placeholder="> query workflows WHERE status = 'active' OR name LIKE 'Todoist'..." 
          className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-sm font-mono placeholder:text-zinc-600 text-text-primary"
        />
        <div className="flex items-center gap-2 pr-2">
          <button className="text-xs font-mono text-text-primary bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-700 transition-colors shadow-sm">All (19)</button>
          <button className="text-xs font-mono text-text-secondary bg-transparent px-3 py-1.5 rounded hover:bg-white/5 transition-colors">Active (3)</button>
          <div className="w-[1px] h-4 bg-border mx-1"></div>
          <button className="text-xs font-medium text-text-secondary bg-background border border-border px-3 py-1.5 rounded flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm">
            <ListFilter size={14} /> Sort: Updated
          </button>
          <button className="bg-brand text-white text-xs px-4 py-1.5 rounded flex items-center gap-2 hover:bg-brand-hover transition-colors font-medium shadow-brand ml-2">
            <FileJson size={14} /> New
          </button>
        </div>
      </div>

      {/* High-Density Workflow List */}
      <div className="border border-border bg-card rounded-xl flex flex-col shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border bg-zinc-900/50 text-xs text-text-secondary font-medium">
              <th className="p-4 w-12 font-medium text-center">Status</th>
              <th className="p-4 font-medium">Workflow Name</th>
              <th className="p-4 w-32 font-medium">ID</th>
              <th className="p-4 w-40 font-medium">Created</th>
              <th className="p-4 w-40 font-medium">Updated</th>
              <th className="p-4 w-20 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {mockWorkflows.map((wf) => (
              <tr 
                key={wf.id} 
                className="border-b border-border hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <td className="p-4 flex justify-center">
                  {wf.status === 'active' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-600"></div>
                  )}
                </td>
                <td className="p-4 text-text-primary font-medium tracking-tight">
                  <div className="flex items-center gap-2">
                    {wf.name}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-text-muted font-mono text-xs bg-background px-2 py-1 rounded border border-border group-hover:border-zinc-600 group-hover:text-text-secondary transition-colors">{wf.id}</span>
                </td>
                <td className="p-4 text-text-secondary text-xs flex items-center gap-1.5">
                  <Clock size={12} className="text-text-muted" /> {wf.created}
                </td>
                <td className="p-4 text-text-secondary text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className="text-text-muted" /> {wf.updated}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs font-medium text-text-primary bg-zinc-800 border border-zinc-700 rounded px-3 py-1 hover:bg-zinc-700 hover:text-white transition-colors">
                      Edit
                    </button>
                    <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Workflows;
