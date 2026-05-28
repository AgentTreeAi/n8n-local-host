import { useMemo } from 'react';
import StatsRibbon from './StatsRibbon';
import VolumeChart from './VolumeChart';
import ExecutionStream from './ExecutionStream';
import { computeStats } from '../utils/format';

export default function Pulse({
  executions,
  workflows,
  loading,
  error,
  onRefresh,
  onSelectExecution,
  hasMore,
  onLoadMore,
  onAfterDelete,
  pushToast,
}) {
  const stats = useMemo(() => computeStats(executions || []), [executions]);
  const workflowStats = useMemo(() => {
    if (!workflows) return null;
    return {
      total: workflows.length,
      active: workflows.filter((w) => w.active).length,
    };
  }, [workflows]);

  return (
    <div className="animate-in fade-in duration-300">
      <StatsRibbon stats={stats} workflowStats={workflowStats} />
      <div className="p-4 md:p-8 space-y-6">
        <VolumeChart executions={executions || []} hours={24} />

        <ExecutionStream
          executions={executions}
          workflows={workflows}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          onSelect={onSelectExecution}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onAfterDelete={onAfterDelete}
          pushToast={pushToast}
          maxHeight="60vh"
        />
      </div>
    </div>
  );
}
