import { useState, useRef, useCallback } from 'react';
import {
  PUZZLES,
  SPEED_MAP,
  copyBoard,
  isSafe,
  findEmptyCell,
  solveSudoku,
  solveQuiet,
  isBoardComplete,
} from '../utils/sudoku';

export function useSudoku() {
  const [board, setBoard] = useState(() => copyBoard(PUZZLES[0]));
  const [givenBoard, setGivenBoard] = useState(() => copyBoard(PUZZLES[0]));
  const [selectedCell, setSelectedCell] = useState(null);
  const [solving, setSolving] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [status, setStatus] = useState({
    msg: 'Select a cell and enter a digit, or use the buttons below.',
    type: '',
  });
  const [logEntries, setLogEntries] = useState([
    { id: 0, msg: '[0000] Sudoku AI ready. CSP solver loaded with MRV heuristic.', type: 'info' },
  ]);
  // Per-cell animation states: key = "r-c", value = 'exploring'|'backtrack'|'solved'|'hint'|'user'|null
  const [cellAnimStates, setCellAnimStates] = useState({});
  // Shaking cells set (keys "r-c")
  const [shakingCells, setShakingCells] = useState(new Set());

  // Refs — always current without triggering re-renders
  const boardRef = useRef(copyBoard(PUZZLES[0]));
  const givenBoardRef = useRef(copyBoard(PUZZLES[0]));
  const timerRef = useRef(null);
  const stepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const stepCountRef = useRef(0);
  const speedRef = useRef(SPEED_MAP[3]);
  const logIdRef = useRef(1);

  // ─── Helpers ──────────────────────────────────────────────────

  const updateBoard = useCallback((newBoard) => {
    boardRef.current = newBoard;
    setBoard(newBoard);
  }, []);

  const addLog = useCallback((msg, type = 'info') => {
    const id = logIdRef.current++;
    const padded = `[${String(stepCountRef.current).padStart(4, '0')}] ${msg}`;
    setLogEntries((prev) => {
      const next = [...prev, { id, msg: padded, type }];
      return next.length > 300 ? next.slice(-300) : next;
    });
  }, []);

  const clearLog = useCallback(() => {
    setLogEntries([]);
    logIdRef.current = 0;
  }, []);

  const stopSolving = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    stepsRef.current = [];
    stepIndexRef.current = 0;
    setSolving(false);
  }, []);

  const triggerShake = useCallback((key) => {
    setShakingCells((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setShakingCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 500);
  }, []);

  // ─── Puzzle loading ────────────────────────────────────────────

  const loadPuzzle = useCallback((index) => {
    const idx =
      index !== undefined ? index : Math.floor(Math.random() * PUZZLES.length);
    const puzzle = copyBoard(PUZZLES[idx]);
    const given = copyBoard(PUZZLES[idx]);
    boardRef.current = puzzle;
    givenBoardRef.current = given;
    setBoard(puzzle);
    setGivenBoard(given);
  }, []);

  // ─── Cell interaction ──────────────────────────────────────────

  const handleCellClick = useCallback(
    (row, col) => {
      if (solving) return;
      setSelectedCell({ row, col });
    },
    [solving]
  );

  const enterDigit = useCallback(
    (num) => {
      if (!selectedCell || solving) return;
      const { row, col } = selectedCell;
      const key = `${row}-${col}`;

      if (givenBoardRef.current[row][col] !== 0) {
        setStatus({ msg: 'That cell is a given — it cannot be changed.', type: 'error' });
        triggerShake(key);
        return;
      }

      const currentBoard = boardRef.current.map((r) => [...r]);

      if (num === 0) {
        currentBoard[row][col] = 0;
        setCellAnimStates((prev) => ({ ...prev, [key]: null }));
        updateBoard(currentBoard);
        setStatus({ msg: 'Cell erased.', type: '' });
        return;
      }

      const prev = currentBoard[row][col];
      currentBoard[row][col] = 0;
      if (!isSafe(currentBoard, row, col, num)) {
        currentBoard[row][col] = prev;
        triggerShake(key);
        setStatus({
          msg: `⚠ ${num} violates a constraint in row, column, or box!`,
          type: 'error',
        });
        return;
      }

      currentBoard[row][col] = num;
      setCellAnimStates((prev) => ({ ...prev, [key]: 'user' }));
      updateBoard(currentBoard);
      setStatus({ msg: `Placed ${num} at (${row + 1}, ${col + 1}).`, type: '' });

      if (isBoardComplete(currentBoard)) {
        setStatus({ msg: '🎉 Puzzle solved! Congratulations!', type: 'solved' });
        addLog('Puzzle solved by user!', 'solved');
      }
    },
    [selectedCell, solving, updateBoard, addLog, triggerShake]
  );

  // ─── AI Solve (animated) ──────────────────────────────────────

  const handleSolve = useCallback(() => {
    if (solving) return;
    stopSolving();

    const copy = copyBoard(boardRef.current);
    const steps = [];
    const solved = solveSudoku(copy, steps);

    if (!solved) {
      setStatus({ msg: '❌ No solution exists for this puzzle.', type: 'error' });
      return;
    }

    setSolving(true);
    setStatus({ msg: '🤖 AI solving — watch the backtracking search…', type: 'working' });
    clearLog();
    addLog(`Starting backtracking search. Total steps: ${steps.length}`, 'info');
    stepsRef.current = steps;
    stepIndexRef.current = 0;
    stepCountRef.current = 0;
    setStepCount(0);
    setCellAnimStates({});

    const playNextStep = () => {
      if (stepIndexRef.current >= stepsRef.current.length) {
        setSolving(false);
        // Wave animation: mark all AI-placed cells as solved
        setCellAnimStates(() => {
          const next = {};
          const given = givenBoardRef.current;
          for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
              if (given[r][c] === 0) next[`${r}-${c}`] = 'solved';
          return next;
        });
        setStatus({ msg: '✅ Solved! Backtracking search complete.', type: 'solved' });
        addLog(`Solved in ${stepCountRef.current} visualisation steps.`, 'solved');
        return;
      }

      const s = stepsRef.current[stepIndexRef.current++];
      stepCountRef.current++;
      setStepCount(stepCountRef.current);

      setBoard((prev) => {
        const next = prev.map((r) => [...r]);
        next[s.row][s.col] = s.type === 'assign' ? s.num : 0;
        boardRef.current = next;
        return next;
      });

      setCellAnimStates((prev) => ({
        ...prev,
        [`${s.row}-${s.col}`]: s.type === 'assign' ? 'exploring' : 'backtrack',
      }));

      if (s.type === 'assign') {
        addLog(`Try ${s.num} → (${s.row + 1},${s.col + 1})`, 'explore');
      } else {
        addLog(`✗ Backtrack from (${s.row + 1},${s.col + 1})`, 'backtrack');
      }

      timerRef.current = setTimeout(playNextStep, speedRef.current);
    };

    timerRef.current = setTimeout(playNextStep, speedRef.current);
  }, [solving, stopSolving, clearLog, addLog]);

  // ─── Manual Step ──────────────────────────────────────────────

  const handleStep = useCallback(() => {
    if (solving) return;
    if (stepsRef.current.length === 0 || stepIndexRef.current >= stepsRef.current.length) {
      // Re-generate steps if queue is exhausted or empty
      const copy = copyBoard(boardRef.current);
      const steps = [];
      const ok = solveSudoku(copy, steps);
      if (!ok) {
        setStatus({ msg: 'No solution exists.', type: 'error' });
        return;
      }
      stepsRef.current = steps;
      stepIndexRef.current = 0;
      stepCountRef.current = 0;
      setStepCount(0);
      clearLog();
      setCellAnimStates({});
      setStatus({ msg: 'Step mode — press ⏩ Step repeatedly…', type: 'working' });
    }

    if (stepIndexRef.current >= stepsRef.current.length) {
      setStatus({ msg: '✅ All steps complete.', type: 'solved' });
      return;
    }

    const s = stepsRef.current[stepIndexRef.current++];
    stepCountRef.current++;
    setStepCount(stepCountRef.current);

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      next[s.row][s.col] = s.type === 'assign' ? s.num : 0;
      boardRef.current = next;
      return next;
    });

    setCellAnimStates((prev) => ({
      ...prev,
      [`${s.row}-${s.col}`]: s.type === 'assign' ? 'exploring' : 'backtrack',
    }));

    if (s.type === 'assign') {
      addLog(`Try ${s.num} → (${s.row + 1},${s.col + 1})`, 'explore');
    } else {
      addLog(`✗ Backtrack (${s.row + 1},${s.col + 1})`, 'backtrack');
    }

    if (stepIndexRef.current >= stepsRef.current.length) {
      setStatus({ msg: '✅ Step-through complete!', type: 'solved' });
    }
  }, [solving, clearLog, addLog]);

  // ─── Hint ─────────────────────────────────────────────────────

  const handleHint = useCallback(() => {
    if (solving) return;
    const solution = copyBoard(boardRef.current);
    const ok = solveQuiet(solution);
    if (!ok) {
      setStatus({ msg: '❌ Puzzle has no solution!', type: 'error' });
      return;
    }
    const cell = findEmptyCell(boardRef.current, true);
    if (!cell) {
      setStatus({ msg: 'Board is already complete!', type: 'solved' });
      return;
    }
    const { row, col } = cell;
    const hint = solution[row][col];
    const newBoard = boardRef.current.map((r) => [...r]);
    newBoard[row][col] = hint;
    updateBoard(newBoard);
    setCellAnimStates((prev) => ({ ...prev, [`${row}-${col}`]: 'hint' }));
    setStatus({ msg: `💡 Hint: place ${hint} at row ${row + 1}, col ${col + 1}.`, type: 'hint' });
    addLog(`Hint → (${row + 1},${col + 1}) = ${hint}`, 'hint');
    setTimeout(() => {
      setCellAnimStates((prev) => ({ ...prev, [`${row}-${col}`]: 'user' }));
    }, 1500);
  }, [solving, updateBoard, addLog]);

  // ─── New Puzzle / Reset ───────────────────────────────────────

  const handleNewPuzzle = useCallback(() => {
    stopSolving();
    loadPuzzle();
    setSelectedCell(null);
    setStepCount(0);
    stepCountRef.current = 0;
    setCellAnimStates({});
    clearLog();
    setStatus({ msg: 'New puzzle loaded. Good luck!', type: '' });
    addLog('New puzzle loaded.', 'info');
  }, [stopSolving, loadPuzzle, clearLog, addLog]);

  const handleReset = useCallback(() => {
    stopSolving();
    const reset = copyBoard(givenBoardRef.current);
    updateBoard(reset);
    setSelectedCell(null);
    setStepCount(0);
    stepCountRef.current = 0;
    setCellAnimStates({});
    clearLog();
    setStatus({ msg: 'Board reset to original puzzle.', type: '' });
    addLog('Board reset.', 'info');
  }, [stopSolving, updateBoard, clearLog, addLog]);

  // ─── Speed ───────────────────────────────────────────────────

  const handleSpeedChange = useCallback((v) => {
    setSpeed(v);
    speedRef.current = SPEED_MAP[v];
  }, []);

  return {
    board,
    givenBoard,
    selectedCell,
    solving,
    stepCount,
    speed,
    status,
    logEntries,
    cellAnimStates,
    shakingCells,
    handleCellClick,
    enterDigit,
    handleSolve,
    handleStep,
    handleHint,
    handleNewPuzzle,
    handleReset,
    handleSpeedChange,
    clearLog,
    stopSolving,
    setSelectedCell,
  };
}
