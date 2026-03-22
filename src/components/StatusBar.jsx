const TYPE_COLORS = {
  solved: 'text-emerald-400',
  error: 'text-red-400',
  hint: 'text-blue-400',
  working: 'text-yellow-400',
  '': 'text-slate-400',
};

export default function StatusBar({ status, stepCount }) {
  const color = TYPE_COLORS[status.type] ?? 'text-slate-400';
  return (
    <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
      <span className={`font-mono text-xs leading-relaxed transition-colors duration-200 ${color}`}>
        {status.msg}
      </span>
      <span className="font-mono text-xs text-slate-500 whitespace-nowrap shrink-0">
        Steps:{' '}
        <span className="text-yellow-400 font-bold">{stepCount.toLocaleString()}</span>
      </span>
    </div>
  );
}
