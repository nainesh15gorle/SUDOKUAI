import { useEffect, useRef } from 'react';

const LOG_COLORS = {
  info: 'text-slate-500',
  explore: 'text-yellow-400',
  backtrack: 'text-red-400',
  solved: 'text-emerald-400 font-bold',
  hint: 'text-blue-400',
};

const LEGEND = [
  { label: 'Exploring', bg: 'rgba(240,192,64,0.25)', border: '#f0c040' },
  { label: 'Backtracking', bg: 'rgba(255,84,112,0.25)', border: '#ff5470' },
  { label: 'Solved', bg: 'rgba(61,214,140,0.2)', border: '#3dd68c' },
  { label: 'Hint', bg: 'rgba(74,158,255,0.2)', border: '#4a9eff' },
  { label: 'Invalid', bg: 'rgba(255,84,112,0.15)', border: '#ff5470' },
  { label: 'Given (fixed)', bg: 'rgba(240,192,64,0.08)', border: '#f0c040' },
];

export default function AILog({ entries, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <aside className="flex flex-col gap-3 sticky top-8">
      {/* Glass terminal */}
      <div className="rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-hidden">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#b983ff', boxShadow: '0 0 6px #b983ff' }}
            />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">
              AI Step Log
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            clear
          </button>
        </div>

        {/* Scrollable log entries */}
        <div
          ref={scrollRef}
          className="ai-log-scroll h-72 overflow-y-auto p-3 flex flex-col gap-0.5 font-mono text-[11px] leading-relaxed"
        >
          {entries.length === 0 ? (
            <span className="text-slate-600 italic">Log cleared.</span>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`px-1 rounded ${LOG_COLORS[entry.type] ?? 'text-slate-500'}`}
              >
                {entry.msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4">
        <h4 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3">Legend</h4>
        <div className="flex flex-col gap-1.5">
          {LEGEND.map(({ label, bg, border }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-sm shrink-0 border"
                style={{ background: bg, borderColor: border }}
              />
              <span className="text-xs font-mono text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
