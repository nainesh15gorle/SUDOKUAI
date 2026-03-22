import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

import CosmicBackground from './components/CosmicBackground';
import SudokuBoard from './components/SudokuBoard';
import Controls from './components/Controls';
import AILog from './components/AILog';
import InfoPanel from './components/InfoPanel';
import StatusBar from './components/StatusBar';
import RadialPicker from './components/RadialPicker';
import { useSudoku } from './hooks/useSudoku';

export default function App() {
  const sudoku = useSudoku();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  // Cell click: select + open picker (viewport position via event)
  const handleCellClick = useCallback(
    (row, col, event) => {
      sudoku.handleCellClick(row, col);
      if (!sudoku.solving && sudoku.givenBoard[row][col] === 0) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPickerPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        // Toggle: clicking the already-selected empty cell closes/opens picker
        setPickerOpen((prev) =>
          sudoku.selectedCell?.row === row && sudoku.selectedCell?.col === col ? !prev : true
        );
      } else {
        setPickerOpen(false);
      }
    },
    [sudoku]
  );

  const handlePickerSelect = useCallback(
    (num) => {
      sudoku.enterDigit(num);
      setPickerOpen(false);
    },
    [sudoku]
  );

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sudoku.solving) return;

      const n = parseInt(e.key);
      if (!isNaN(n) && n >= 0 && n <= 9) {
        sudoku.enterDigit(n);
        setPickerOpen(false);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        sudoku.enterDigit(0);
        setPickerOpen(false);
        return;
      }
      if (e.key === 'Escape') {
        setPickerOpen(false);
        return;
      }

      // Arrow key navigation
      if (!sudoku.selectedCell) return;
      const { row, col } = sudoku.selectedCell;
      const moves = {
        ArrowUp: [Math.max(0, row - 1), col],
        ArrowDown: [Math.min(8, row + 1), col],
        ArrowLeft: [row, Math.max(0, col - 1)],
        ArrowRight: [row, Math.min(8, col + 1)],
      };
      if (moves[e.key]) {
        e.preventDefault();
        sudoku.setSelectedCell({ row: moves[e.key][0], col: moves[e.key][1] });
        setPickerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sudoku]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Cosmic animated background */}
      <CosmicBackground />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-white/[0.08] bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⬛</span>
            <span
              className="font-bold text-xl tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              SUDOKU<em className="text-yellow-400 not-italic">AI</em>
            </span>
          </div>
          <span className="text-xs text-slate-500 border border-slate-800 px-3 py-1 rounded-full font-mono tracking-wide">
            Constraint Satisfaction Problem Solver
          </span>
        </div>
      </header>

      {/* ── 3-Column Layout ────────────────────────────────────── */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-[220px_1fr_260px] gap-6 items-start">
        {/* Left: CSP info */}
        <InfoPanel />

        {/* Center: board + status + controls */}
        <div className="flex flex-col items-center gap-4">
          <StatusBar status={sudoku.status} stepCount={sudoku.stepCount} />
          <SudokuBoard
            board={sudoku.board}
            givenBoard={sudoku.givenBoard}
            selectedCell={sudoku.selectedCell}
            cellAnimStates={sudoku.cellAnimStates}
            shakingCells={sudoku.shakingCells}
            onCellClick={handleCellClick}
          />
          <Controls
            solving={sudoku.solving}
            speed={sudoku.speed}
            onSolve={sudoku.handleSolve}
            onHint={sudoku.handleHint}
            onNew={sudoku.handleNewPuzzle}
            onReset={sudoku.handleReset}
            onStep={sudoku.handleStep}
            onSpeedChange={sudoku.handleSpeedChange}
          />
          <p className="text-xs text-slate-600 font-mono mt-1">
            Click a cell to open radial picker · Arrow keys to navigate · 1–9 to type
          </p>
        </div>

        {/* Right: AI log */}
        <AILog entries={sudoku.logEntries} onClear={sudoku.clearLog} />
      </main>

      {/* ── Radial Picker (portal-style fixed overlay) ─────────── */}
      <AnimatePresence>
        {pickerOpen && !sudoku.solving && (
          <RadialPicker
            pos={pickerPos}
            onSelect={handlePickerSelect}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
