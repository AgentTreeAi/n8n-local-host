import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Boxes } from 'lucide-react';
import { countNodeTypes } from '../utils/format';

/* indigo-anchored palette, no purple-gradient slop — distinct steady hues */
const PALETTE = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#14b8a6', '#eab308', '#ec4899', '#22c55e',
  '#3b82f6', '#fb923c', '#06b6d4', '#a3e635',
];

function TreemapCell(props) {
  const { x, y, width, height, index, name, value, total, isRest } = props;
  if (width <= 0 || height <= 0) return null;
  const fill = isRest ? '#3f3f46' : PALETTE[index % PALETTE.length];
  const showLabel = width > 54 && height > 26;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        style={{ fill, fillOpacity: isRest ? 0.5 : 0.82, stroke: '#09090b', strokeWidth: 2 }}
      />
      {showLabel && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={600} className="font-sans">
            {name.length > Math.floor(width / 7) ? `${name.slice(0, Math.floor(width / 7))}…` : name}
          </text>
          {height > 40 && (
            <text x={x + 8} y={y + 34} fill="rgba(255,255,255,0.7)" fontSize={10} className="font-mono">
              {value} · {pct}%
            </text>
          )}
        </>
      )}
    </g>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 px-3 py-2 rounded-lg shadow-xl text-xs font-mono">
      <div className="text-text-primary font-semibold">{d.name}</div>
      <div className="text-text-secondary mt-0.5">
        {d.value} node{d.value === 1 ? '' : 's'} · {d.total ? Math.round((d.value / d.total) * 100) : 0}%
      </div>
    </div>
  );
};

export default function NodeTypeTreemap({ workflows }) {
  const { items, total, distinct } = useMemo(() => countNodeTypes(workflows || []), [workflows]);
  const data = useMemo(() => items.map((it) => ({ ...it, total })), [items, total]);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-5 shadow-inner h-[340px] flex flex-col relative overflow-hidden group transition-all duration-300 hover:border-white/10">
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Boxes size={14} className="text-brand" /> Node Composition
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            What this instance is built from · {distinct} distinct types
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-mono">
          {total} nodes
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        {total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs gap-2">
            <Boxes size={20} className="opacity-40" />
            <span>No workflow nodes available</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="value"
              stroke="#09090b"
              isAnimationActive={false}
              content={<TreemapCell total={total} />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
