import { useMemo, useState } from 'react';
import { Share2, ArrowRight } from 'lucide-react';
import { buildDependencyGraph, layerGraph } from '../utils/format';

const NODE_W = 158;
const NODE_H = 46;
const COL_GAP = 96; // gap between columns (in addition to NODE_W)
const ROW_GAP = 22; // gap between rows (in addition to NODE_H)
const PAD = 28;

const ROLE_STYLE = {
  orchestrator: { stroke: '#6366f1', fill: 'rgba(99,102,241,0.12)', label: 'Orchestrator' },
  subworkflow: { stroke: '#10b981', fill: 'rgba(16,185,129,0.12)', label: 'Sub-workflow' },
  link: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.12)', label: 'Both' },
};

function layout(nodes, edges) {
  const depth = layerGraph(nodes, edges);
  const cols = new Map();
  nodes.forEach((n) => {
    const d = depth.get(n.id) || 0;
    if (!cols.has(d)) cols.set(d, []);
    cols.get(d).push(n);
  });
  const sortedDepths = [...cols.keys()].sort((a, b) => a - b);
  const pos = new Map();
  let maxRows = 0;
  sortedDepths.forEach((d, colIdx) => {
    const column = cols.get(d);
    column.sort((a, b) => a.name.localeCompare(b.name));
    maxRows = Math.max(maxRows, column.length);
    column.forEach((n, rowIdx) => {
      pos.set(n.id, {
        x: PAD + colIdx * (NODE_W + COL_GAP),
        y: PAD + rowIdx * (NODE_H + ROW_GAP),
        col: colIdx,
        row: rowIdx,
      });
    });
  });
  const width = PAD * 2 + sortedDepths.length * NODE_W + (sortedDepths.length - 1) * COL_GAP;
  const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;
  return { pos, width: Math.max(width, 320), height: Math.max(height, 160) };
}

function edgePath(a, b) {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(40, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function WorkflowGraph({ workflows, onSelectWorkflow }) {
  const [hover, setHover] = useState(null);
  const graph = useMemo(() => buildDependencyGraph(workflows || []), [workflows]);
  const { pos, width, height } = useMemo(
    () => layout(graph.nodes, graph.edges),
    [graph.nodes, graph.edges],
  );
  const wfById = useMemo(
    () => new Map((workflows || []).map((w) => [String(w.id), w])),
    [workflows],
  );

  const hasGraph = graph.edges.length > 0;

  const isDimmed = (id) => {
    if (!hover) return false;
    if (id === hover) return false;
    const connected = graph.edges.some(
      (e) =>
        (e.source === hover && e.target === id) || (e.target === hover && e.source === id),
    );
    return !connected;
  };

  const edgeActive = (e) => hover && (e.source === hover || e.target === hover);

  return (
    <div className="border border-border bg-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Share2 size={14} className="text-brand" /> Workflow Dependency Graph
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
          {Object.entries(ROLE_STYLE).map(([k, s]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.stroke }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-text-muted mb-4">
        Who calls whom via Execute-Sub-workflow nodes · {graph.edges.length} link
        {graph.edges.length === 1 ? '' : 's'} · {graph.isolated.length} standalone
      </p>

      {!hasGraph ? (
        <div className="text-xs text-text-muted text-center py-12 flex flex-col items-center gap-2">
          <Share2 size={22} className="opacity-40" />
          <span>No cross-workflow dependencies detected.</span>
          <span className="text-text-muted/70">
            Workflows wired together via Execute-Sub-workflow nodes will appear here.
          </span>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg bg-background/60 border border-white/5">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block"
            style={{ minWidth: '100%' }}
          >
            <defs>
              <marker
                id="wf-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
              </marker>
              <marker
                id="wf-arrow-hot"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
            </defs>

            {/* edges */}
            {graph.edges.map((e, i) => {
              const a = pos.get(e.source);
              const b = pos.get(e.target);
              if (!a || !b) return null;
              const hot = edgeActive(e);
              const dim = hover && !hot;
              return (
                <path
                  key={`e-${i}`}
                  d={edgePath(a, b)}
                  fill="none"
                  stroke={hot ? '#6366f1' : '#3f3f46'}
                  strokeWidth={hot ? 2 : 1.4}
                  strokeDasharray={e.resolved ? '0' : '4 4'}
                  markerEnd={hot ? 'url(#wf-arrow-hot)' : 'url(#wf-arrow)'}
                  style={{ opacity: dim ? 0.18 : 1, transition: 'opacity .2s, stroke .2s' }}
                />
              );
            })}

            {/* nodes */}
            {graph.nodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const style = ROLE_STYLE[n.role] || ROLE_STYLE.link;
              const dim = isDimmed(n.id);
              const wf = wfById.get(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x},${p.y})`}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => wf && onSelectWorkflow?.(wf)}
                  style={{
                    cursor: wf ? 'pointer' : 'default',
                    opacity: dim ? 0.3 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill={n.missing ? 'rgba(63,63,70,0.4)' : style.fill}
                    stroke={n.missing ? '#52525b' : style.stroke}
                    strokeWidth={1.4}
                    strokeDasharray={n.missing ? '4 4' : '0'}
                  />
                  {n.active === false && !n.missing && (
                    <circle cx={NODE_W - 12} cy={12} r={3} fill="#71717a">
                      <title>Inactive</title>
                    </circle>
                  )}
                  {n.active === true && (
                    <circle cx={NODE_W - 12} cy={12} r={3} fill="#10b981">
                      <title>Active</title>
                    </circle>
                  )}
                  <text
                    x={12}
                    y={20}
                    fill="#f4f4f5"
                    fontSize={11.5}
                    fontWeight={600}
                    className="font-sans select-none"
                  >
                    {n.name.length > 20 ? `${n.name.slice(0, 20)}…` : n.name}
                  </text>
                  <text x={12} y={35} fill="#a1a1aa" fontSize={9.5} className="font-mono select-none">
                    {n.outgoing > 0 && `${n.outgoing} call${n.outgoing === 1 ? '' : 's'}`}
                    {n.outgoing > 0 && n.incoming > 0 && ' · '}
                    {n.incoming > 0 && `${n.incoming} caller${n.incoming === 1 ? '' : 's'}`}
                    {n.missing && 'external / not in list'}
                  </text>
                  <title>{n.name}</title>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {hasGraph && graph.isolated.length > 0 && (
        <div className="mt-3 text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap">
          <ArrowRight size={11} className="opacity-50" />
          <span className="font-mono">
            {graph.isolated.length} standalone workflow
            {graph.isolated.length === 1 ? '' : 's'} with no sub-workflow links (hidden)
          </span>
        </div>
      )}
    </div>
  );
}
