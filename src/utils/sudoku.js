// ═══════════════════════════════════════════════════════════════
//  SUDOKU CSP UTILITIES
//  Variables   → each empty cell (r, c) where board[r][c] === 0
//  Domain      → digits 1–9
//  Constraints → no repeat in row | column | 3×3 box
// ═══════════════════════════════════════════════════════════════

export const PUZZLES = [
  // Puzzle 1 — Medium
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  // Puzzle 2 — Hard
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  // Puzzle 3 — Expert
  [
    [0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 0, 0, 0, 3, 5, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 7, 0],
    [7, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0, 0, 8, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 0],
    [0, 8, 0, 0, 0, 0, 0, 4, 0],
    [0, 5, 0, 0, 0, 0, 6, 0, 0],
  ],
];

export const SPEED_MAP = { 1: 800, 2: 300, 3: 100, 4: 30, 5: 5 };
export const SPEED_LABELS = { 1: 'Slowest', 2: 'Slow', 3: 'Medium', 4: 'Fast', 5: 'Fastest' };

/** Deep-copy a 9×9 array */
export function copyBoard(b) {
  return b.map((row) => [...row]);
}

/**
 * isSafe — core CSP constraint checker.
 * Returns true if placing `num` at (row, col) violates no constraint.
 */
export function isSafe(board, row, col, num) {
  // Row uniqueness
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  // Column uniqueness
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  // 3×3 box uniqueness
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

/** Return the set of legal digits (remaining domain) for a cell */
export function getDomain(board, row, col) {
  const d = [];
  for (let n = 1; n <= 9; n++) if (isSafe(board, row, col, n)) d.push(n);
  return d;
}

/**
 * findEmptyCell — MRV heuristic variable selection.
 * Returns the empty cell with the fewest legal values, or null if full.
 */
export function findEmptyCell(board, useMRV = true) {
  let best = null;
  let bestCount = 10;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        if (!useMRV) return { row: r, col: c };
        const count = getDomain(board, r, c).length;
        if (count < bestCount) {
          bestCount = count;
          best = { row: r, col: c };
          if (count === 0) return best; // dead-end found early
        }
      }
    }
  }
  return best;
}

/**
 * solveSudoku — recursive backtracking with MRV.
 * Records every assignment/backtrack in `steps` for visualisation.
 */
export function solveSudoku(board, steps = []) {
  const cell = findEmptyCell(board, true);
  if (!cell) return true; // base case: all cells assigned

  const { row, col } = cell;
  for (let num = 1; num <= 9; num++) {
    if (isSafe(board, row, col, num)) {
      board[row][col] = num;
      steps.push({ type: 'assign', row, col, num });

      if (solveSudoku(board, steps)) return true;

      board[row][col] = 0;
      steps.push({ type: 'backtrack', row, col, num });
    }
  }
  return false;
}

/** Silent solver — no step recording, used for hints */
export function solveQuiet(boardCopy) {
  const cell = findEmptyCell(boardCopy, true);
  if (!cell) return true;
  const { row, col } = cell;
  for (let num = 1; num <= 9; num++) {
    if (isSafe(boardCopy, row, col, num)) {
      boardCopy[row][col] = num;
      if (solveQuiet(boardCopy)) return true;
      boardCopy[row][col] = 0;
    }
  }
  return false;
}

/** True if every cell is filled */
export function isBoardComplete(board) {
  return board.every((row) => row.every((v) => v !== 0));
}
