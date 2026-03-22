import { Play, Lightbulb, RefreshCw, RotateCcw, SkipForward } from 'lucide-react';
import { SPEED_LABELS } from '../utils/sudoku';

const Btn = ({ onClick, disabled, variant = 'secondary', children }) => {
  const base =
    'flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-bold tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-yellow-400 text-slate-950 hover:bg-yellow-300 hover:shadow-[0_0_18px_rgba(240,192,64,0.5)] active:scale-95',
    secondary:
      'bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/[0.12] hover:border-blue-500/50 hover:text-blue-300 active:scale-95',
    outline:
      'bg-transparent border border-white/10 text-slate-400 hover:border-red-500/50 hover:text-red-400 active:scale-95',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
};

export default function Controls({ solving, speed, onSolve, onHint, onNew, onReset, onStep, onSpeedChange }) {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Speed slider */}
      <div className="w-full flex items-center gap-3 px-1">
        <span className="font-mono text-xs text-slate-500 whitespace-nowrap">Viz Speed</span>
        <input
          type="range"
          min={1}
          max={5}
          value={speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="flex-1 h-1 accent-yellow-400 cursor-pointer"
          disabled={solving}
        />
        <span className="font-mono text-xs text-yellow-400 w-14 text-right">
          {SPEED_LABELS[speed]}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Btn onClick={onSolve} disabled={solving} variant="primary">
          <Play size={13} />
          Solve (AI)
        </Btn>
        <Btn onClick={onHint} disabled={solving} variant="secondary">
          <Lightbulb size={13} />
          Hint
        </Btn>
        <Btn onClick={onNew} disabled={solving} variant="secondary">
          <RefreshCw size={13} />
          New Puzzle
        </Btn>
        <Btn onClick={onReset} disabled={solving} variant="outline">
          <RotateCcw size={13} />
          Reset
        </Btn>
        <Btn onClick={onStep} disabled={solving} variant="outline">
          <SkipForward size={13} />
          Step
        </Btn>
      </div>
    </div>
  );
}
