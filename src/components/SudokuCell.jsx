import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Per-state visual config
const STATE = {
  exploring: { text: 'text-yellow-300', bg: 'rgba(240,192,64,0.12)' },
  backtrack: { text: 'text-red-400', bg: 'rgba(255,84,112,0.1)' },
  solved: { text: 'text-emerald-400', bg: 'rgba(61,214,140,0.08)' },
  hint: { text: 'text-blue-400', bg: 'rgba(74,158,255,0.1)' },
  user: { text: 'text-slate-100', bg: '' },
};

const SudokuCell = React.memo(function SudokuCell({
  row,
  col,
  value,
  isGiven,
  isSelected,
  isHighlighted,
  animState,
  isShaking,
  onClick,
}) {
  const s = STATE[animState] ?? STATE.user;
  const textClass = isGiven ? 'text-yellow-300' : s.text;

  let bgStyle = {};
  if (animState && STATE[animState]?.bg) bgStyle = { background: STATE[animState].bg };
  else if (isHighlighted && !isSelected) bgStyle = { background: 'rgba(255,255,255,0.03)' };

  return (
    <div
      className={`
        w-14 h-14 flex items-center justify-center select-none relative
        font-mono text-lg font-bold
        transition-colors duration-100
        ${isGiven ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.05]'}
        ${isShaking ? 'animate-shake' : ''}
      `}
      style={bgStyle}
      onClick={onClick}
    >
      {/* Selection glow — this div persists so no re-mount flash */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-sm"
          style={{
            background: 'rgba(59,130,246,0.1)',
            boxShadow: '0 0 20px rgba(59,130,246,0.45), inset 0 0 0 2px rgba(59,130,246,0.9)',
          }}
        />
      )}

      {/* Value with staggered wave animation on solve complete */}
      <AnimatePresence mode="wait">
        {value !== 0 && (
          <motion.span
            key={`${value}-${animState === 'solved' ? 'wave' : 'norm'}`}
            className={`relative z-20 leading-none ${textClass}`}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: animState === 'solved' ? 300 : 500,
              damping: 20,
              // Wave: cells nearer to (0,0) appear first
              delay: animState === 'solved' ? (row + col) * 0.04 : 0,
            }}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SudokuCell;
