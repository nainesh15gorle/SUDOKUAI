/**
 * ════════════════════════════════════════════════════════════════
 *  SUDOKU AI — script.js
 *  Demonstrates AI concepts:
 *    • Problem Formulation as a Constraint Satisfaction Problem (CSP)
 *    • State-Space Search via Backtracking
 *    • MRV (Minimum Remaining Values) heuristic
 *    • Real-time constraint checking with isSafe()
 * ════════════════════════════════════════════════════════════════
 *
 *  CSP Representation:
 *    Variables   → each empty cell (r, c) where board[r][c] === 0
 *    Domain      → digits 1–9
 *    Constraints → no repeat in row | column | 3×3 box
 *
 *  Search Algorithm:
 *    1. Select next variable using MRV heuristic
 *    2. For each value in its domain (1–9):
 *       a. Check isSafe() — all three constraint types
 *       b. Assign the value (forward-checking step)
 *       c. Recurse to the next variable
 *       d. If recursion fails → undo (backtrack) and try next value
 *    3. If all variables assigned → puzzle solved!
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────
//  SAMPLE PUZZLES (0 = empty cell)
// ─────────────────────────────────────────
const PUZZLES = [
  // Puzzle 1 — Medium
  [
    [5,3,0, 0,7,0, 0,0,0],
    [6,0,0, 1,9,5, 0,0,0],
    [0,9,8, 0,0,0, 0,6,0],

    [8,0,0, 0,6,0, 0,0,3],
    [4,0,0, 8,0,3, 0,0,1],
    [7,0,0, 0,2,0, 0,0,6],

    [0,6,0, 0,0,0, 2,8,0],
    [0,0,0, 4,1,9, 0,0,5],
    [0,0,0, 0,8,0, 0,7,9],
  ],
  // Puzzle 2 — Hard
  [
    [0,0,0, 2,6,0, 7,0,1],
    [6,8,0, 0,7,0, 0,9,0],
    [1,9,0, 0,0,4, 5,0,0],

    [8,2,0, 1,0,0, 0,4,0],
    [0,0,4, 6,0,2, 9,0,0],
    [0,5,0, 0,0,3, 0,2,8],

    [0,0,9, 3,0,0, 0,7,4],
    [0,4,0, 0,5,0, 0,3,6],
    [7,0,3, 0,1,8, 0,0,0],
  ],
  // Puzzle 3 — Expert (fewer givens)
  [
    [0,0,0, 0,0,0, 0,1,2],
    [0,0,0, 0,3,5, 0,0,0],
    [0,0,0, 6,0,0, 0,7,0],

    [7,0,0, 0,0,0, 3,0,0],
    [0,0,0, 4,0,0, 8,0,0],
    [1,0,0, 0,0,0, 0,0,0],

    [0,0,0, 1,2,0, 0,0,0],
    [0,8,0, 0,0,0, 0,4,0],
    [0,5,0, 0,0,0, 6,0,0],
  ],
];

// ─────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────
let board        = [];   // current 9×9 grid (0 = empty)
let givenBoard   = [];   // original puzzle (immutable givens)
let selectedCell = null; // { row, col }
let solving      = false; // true while AI animation runs
let stepQueue    = [];   // queued animation steps
let stepTimer    = null;
let stepCount    = 0;

// Visualisation speed: delay in ms per step
const SPEED_MAP = { 1: 800, 2: 300, 3: 100, 4: 30, 5: 5 };
let stepDelay = 100;

// ─────────────────────────────────────────
//  DOM REFERENCES
// ─────────────────────────────────────────
const gridEl      = document.getElementById('sudoku-grid');
const statusEl    = document.getElementById('status-msg');
const stepCountEl = document.getElementById('step-count');
const logEl       = document.getElementById('ai-log');
const speedSlider = document.getElementById('speed-slider');
const speedLabel  = document.getElementById('speed-label');

// ═══════════════════════════════════════════════════════════════
//  SECTION 1: BOARD INITIALISATION
// ═══════════════════════════════════════════════════════════════

/** Deep-copy a 9×9 array */
function copyBoard(b) {
  return b.map(row => [...row]);
}

/** Load a puzzle (index from PUZZLES array, or random) */
function loadPuzzle(index) {
  const idx = (index !== undefined) ? index : Math.floor(Math.random() * PUZZLES.length);
  givenBoard = copyBoard(PUZZLES[idx]);
  board      = copyBoard(givenBoard);
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2: RENDERING
// ═══════════════════════════════════════════════════════════════

/** Build the 81 cell divs and attach event listeners */
function buildGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => onCellClick(r, c));
      gridEl.appendChild(cell);
    }
  }
}

/** Render the current board state onto the DOM */
function renderBoard() {
  stepCountEl.textContent = stepCount;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = getCell(r, c);
      const val  = board[r][c];

      // Clear dynamic state classes (keep row/col data attrs)
      cell.className = 'cell';

      if (givenBoard[r][c] !== 0) {
        cell.classList.add('cell-given');
        cell.textContent = givenBoard[r][c];
      } else if (val !== 0) {
        cell.textContent = val;
        cell.classList.add('cell-user');
      } else {
        cell.textContent = '';
      }
    }
  }

  // Restore selected highlight
  if (selectedCell) applySelectionHighlight(selectedCell.row, selectedCell.col);
}

/** Return the DOM element for a cell */
function getCell(r, c) {
  return gridEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

/**
 * Highlight the selected cell and its peer cells (same row/col/box).
 * This helps the user understand constraint groups visually.
 */
function applySelectionHighlight(row, col) {
  // Clear previous
  document.querySelectorAll('.cell-selected, .cell-highlight').forEach(el => {
    el.classList.remove('cell-selected', 'cell-highlight');
  });

  // Highlight peers
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r === row && c === col) continue;
      const sameRow = r === row;
      const sameCol = c === col;
      const sameBox = Math.floor(r / 3) === Math.floor(row / 3) &&
                      Math.floor(c / 3) === Math.floor(col / 3);
      if (sameRow || sameCol || sameBox) {
        getCell(r, c).classList.add('cell-highlight');
      }
    }
  }
  getCell(row, col).classList.add('cell-selected');
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3: USER INTERACTION
// ═══════════════════════════════════════════════════════════════

function onCellClick(r, c) {
  if (solving) return;
  selectedCell = { row: r, col: c };
  applySelectionHighlight(r, c);
}

/** Enter a digit into the selected cell (num=0 means erase) */
function enterDigit(num) {
  if (!selectedCell || solving) return;
  const { row, col } = selectedCell;

  // Cannot modify given (puzzle) cells
  if (givenBoard[row][col] !== 0) {
    setStatus('That cell is a given — it cannot be changed.', 'error');
    return;
  }

  if (num === 0) {
    board[row][col] = 0;
    getCell(row, col).textContent = '';
    getCell(row, col).className = 'cell cell-selected';
    setStatus('Cell erased.', '');
    return;
  }

  // Validate the move against CSP constraints
  const prev = board[row][col];
  board[row][col] = 0; // temporarily clear to run isSafe cleanly
  if (!isSafe(board, row, col, num)) {
    board[row][col] = prev; // restore
    getCell(row, col).classList.add('cell-invalid');
    setTimeout(() => getCell(row, col).classList.remove('cell-invalid'), 600);
    setStatus(`⚠ ${num} violates a constraint in row, column, or box!`, 'error');
    return;
  }

  board[row][col] = num;
  renderBoard();
  applySelectionHighlight(row, col);
  setStatus(`Placed ${num} at (${row + 1}, ${col + 1}).`, '');

  if (isBoardComplete()) {
    setStatus('🎉 Puzzle solved! Congratulations!', 'solved');
    addLog('Puzzle solved by user!', 'solved');
  }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 4: CSP — CONSTRAINT CHECKING
// ═══════════════════════════════════════════════════════════════

/**
 * isSafe(board, row, col, num)
 *
 * The core CSP constraint function. Returns true if placing `num`
 * at (row, col) does NOT violate any of the three Sudoku constraints.
 *
 * Constraint 1 — Row uniqueness:
 *   No other cell in the same row contains `num`.
 *
 * Constraint 2 — Column uniqueness:
 *   No other cell in the same column contains `num`.
 *
 * Constraint 3 — 3×3 Box uniqueness:
 *   No other cell in the same 3×3 sub-grid contains `num`.
 */
function isSafe(board, row, col, num) {
  // --- Constraint 1: Row ---
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // --- Constraint 2: Column ---
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // --- Constraint 3: 3×3 Box ---
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true; // All constraints satisfied ✓
}

/** Return the set of valid digits for a cell (its remaining domain) */
function getDomain(board, row, col) {
  const domain = [];
  for (let num = 1; num <= 9; num++) {
    if (isSafe(board, row, col, num)) domain.push(num);
  }
  return domain;
}

/** Check if the entire board is filled (no zeros remain) */
function isBoardComplete() {
  return board.every(row => row.every(v => v !== 0));
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 5: CSP — VARIABLE SELECTION (MRV HEURISTIC)
// ═══════════════════════════════════════════════════════════════

/**
 * findEmptyCell(board, useMRV)
 *
 * Returns the coordinates of the next cell to assign.
 *
 * Without MRV: just returns the first empty cell (top-left scan).
 *
 * With MRV (Minimum Remaining Values):
 *   Scans ALL empty cells and returns the one whose domain
 *   (set of legal digits) is smallest. Picking the most
 *   constrained variable first reduces the branching factor
 *   and prunes the search tree significantly.
 *
 *   Example: a cell with domain {3} must be 3 — no search needed.
 *   A cell with domain {1,5,7} needs to try 3 options.
 *   MRV picks the former first, resolving forced choices early.
 */
function findEmptyCell(board, useMRV = true) {
  let best = null;
  let bestCount = 10; // larger than max domain size (9)

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        if (!useMRV) return { row: r, col: c }; // first-found

        const count = getDomain(board, r, c).length;
        if (count < bestCount) {
          bestCount = count;
          best = { row: r, col: c };
          if (count === 0) return best; // dead-end found early
        }
      }
    }
  }
  return best; // null if board is full
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 6: BACKTRACKING SOLVER
// ═══════════════════════════════════════════════════════════════

/**
 * solveSudoku(board, steps)
 *
 * Recursive Backtracking Algorithm:
 *
 *  Base case  → no empty cells remain → solved!
 *  Recursive  → pick next variable (MRV), iterate its domain,
 *               check isSafe(), assign, recurse, backtrack if needed.
 *
 * The `steps` array records every assignment and un-assignment
 * so the animation engine can replay them step by step.
 *
 * Time Complexity:  O(9^n) worst case, where n = empty cells
 *                   (MRV + constraint propagation prunes massively)
 * Space Complexity: O(n) recursion stack depth
 */
function solveSudoku(board, steps = []) {
  // ── Base case: no empty cell left ──
  const cell = findEmptyCell(board, true); // MRV
  if (!cell) return true; // 🎉 Solution found

  const { row, col } = cell;

  // ── Try every value in the domain (1–9) ──
  for (let num = 1; num <= 9; num++) {

    if (isSafe(board, row, col, num)) {
      // ASSIGN — forward step
      board[row][col] = num;
      if (steps) steps.push({ type: 'assign', row, col, num });

      // RECURSE
      if (solveSudoku(board, steps)) return true;

      // BACKTRACK — assignment led to dead-end; undo it
      board[row][col] = 0;
      if (steps) steps.push({ type: 'backtrack', row, col, num });
    }
  }

  // No valid digit worked for this cell → trigger backtracking in caller
  return false;
}

/** Solve without recording steps (used for hint & validation) */
function solveQuiet(boardCopy) {
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

// ═══════════════════════════════════════════════════════════════
//  SECTION 7: ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Plays back the recorded steps array with configurable delay,
 * visualising exactly how backtracking navigates the search tree.
 */
function playSteps(steps, onDone) {
  let i = 0;
  stepCount = 0;
  stepCountEl.textContent = 0;

  function tick() {
    if (i >= steps.length) {
      solving = false;
      enableButtons(true);
      if (onDone) onDone();
      return;
    }

    const s = steps[i++];
    stepCount++;
    stepCountEl.textContent = stepCount;

    // Apply the step to the live board for rendering
    board[s.row][s.col] = (s.type === 'assign') ? s.num : 0;

    const cell = getCell(s.row, s.col);

    if (s.type === 'assign') {
      cell.textContent = s.num;
      cell.className = 'cell cell-exploring';
      addLog(`Try ${s.num} → (${s.row+1},${s.col+1})`, 'explore');
    } else {
      cell.textContent = '';
      cell.className = 'cell cell-backtrack';
      addLog(`✗ Backtrack from (${s.row+1},${s.col+1})`, 'backtrack');
    }

    stepTimer = setTimeout(tick, stepDelay);
  }

  tick();
}

/** Handle the ▶ Solve button */
function handleSolve() {
  if (solving) return;
  stopSolving();

  const copy   = copyBoard(board);
  const steps  = [];
  const solved = solveSudoku(copy, steps);

  if (!solved) {
    setStatus('❌ No solution exists for this puzzle.', 'error');
    return;
  }

  solving = true;
  enableButtons(false);
  setStatus('🤖 AI solving — watch the backtracking search…', 'working');
  clearLog();
  addLog(`Starting backtracking search. Total steps: ${steps.length}`, 'info');
  stepCount = 0;

  playSteps(steps, () => {
    // Final: paint all AI-placed cells green
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (givenBoard[r][c] === 0) {
          const cell = getCell(r, c);
          cell.className = 'cell cell-solved';
        }
      }
    }
    setStatus('✅ Solved! Backtracking search complete.', 'solved');
    addLog(`Solved in ${stepCount} visualisation steps.`, 'solved');
  });
}

/** Handle the ⏩ Step button — advance one step at a time manually */
function handleStep() {
  if (solving) return;
  if (stepQueue.length === 0) {
    const copy  = copyBoard(board);
    const steps = [];
    const ok    = solveSudoku(copy, steps);
    if (!ok) { setStatus('No solution.', 'error'); return; }
    stepQueue = steps;
    stepCount = 0;
    clearLog();
    setStatus('Step mode — press ⏩ Step repeatedly…', 'working');
  }

  const s = stepQueue.shift();
  if (!s) { setStatus('All steps complete.', 'solved'); return; }

  stepCount++;
  stepCountEl.textContent = stepCount;
  board[s.row][s.col] = (s.type === 'assign') ? s.num : 0;

  const cell = getCell(s.row, s.col);
  if (s.type === 'assign') {
    cell.textContent = s.num;
    cell.className = 'cell cell-exploring';
    addLog(`Try ${s.num} → (${s.row+1},${s.col+1})`, 'explore');
  } else {
    cell.textContent = '';
    cell.className = 'cell cell-backtrack';
    addLog(`✗ Backtrack (${s.row+1},${s.col+1})`, 'backtrack');
  }

  if (stepQueue.length === 0) {
    setStatus('✅ Step-through complete!', 'solved');
  }
}

function stopSolving() {
  if (stepTimer) clearTimeout(stepTimer);
  solving = false;
  stepQueue = [];
  stepTimer = null;
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 8: HINT SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * handleHint()
 *
 * Uses the solver logic to find ONE safe move and highlights it.
 * Strategy:
 *   1. Clone the board.
 *   2. Run the quiet solver to completion.
 *   3. Find the first empty cell on the CURRENT (unsolved) board.
 *   4. Copy that cell's value from the solution → highlight it.
 *
 * This is a "look-ahead" hint — it peeks at the full solution
 * and reveals one step without spoiling the rest.
 */
function handleHint() {
  if (solving) return;

  const solution = copyBoard(board);
  const ok = solveQuiet(solution);
  if (!ok) { setStatus('❌ Puzzle has no solution!', 'error'); return; }

  // Find the first empty cell using MRV on the CURRENT board
  const cell = findEmptyCell(board, true);
  if (!cell) { setStatus('Board is already complete!', 'solved'); return; }

  const { row, col } = cell;
  const hint = solution[row][col];

  board[row][col] = hint;
  const domCell = getCell(row, col);
  domCell.textContent = hint;
  domCell.className = 'cell cell-hint';

  setStatus(`💡 Hint: place ${hint} at row ${row+1}, column ${col+1}.`, 'hint');
  addLog(`Hint → (${row+1},${col+1}) = ${hint}`, 'hint');

  // After 1.5s, settle to user style
  setTimeout(() => {
    if (board[row][col] === hint) {
      domCell.className = 'cell cell-user';
    }
  }, 1500);
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 9: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status-msg';
  if (type === 'solved')  statusEl.classList.add('status-solved');
  if (type === 'error')   statusEl.classList.add('status-error');
  if (type === 'hint')    statusEl.classList.add('status-hint');
  if (type === 'working') statusEl.classList.add('status-working');
}

function addLog(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${stepCount.toString().padStart(4,'0')}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  // Limit log size
  while (logEl.children.length > 300) logEl.removeChild(logEl.firstChild);
}

function clearLog() {
  logEl.innerHTML = '';
}

function enableButtons(enabled) {
  ['btn-solve','btn-hint','btn-new','btn-reset','btn-step'].forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });
  document.querySelectorAll('.num-btn').forEach(b => b.disabled = !enabled);
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 10: SPEED CONTROL
// ═══════════════════════════════════════════════════════════════

const SPEED_LABELS = { 1:'Slowest', 2:'Slow', 3:'Medium', 4:'Fast', 5:'Fastest' };
speedSlider.addEventListener('input', () => {
  const v = parseInt(speedSlider.value);
  stepDelay = SPEED_MAP[v];
  speedLabel.textContent = SPEED_LABELS[v];
});

// ═══════════════════════════════════════════════════════════════
//  SECTION 11: BUTTON WIRING & KEYBOARD INPUT
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-solve').addEventListener('click', handleSolve);
document.getElementById('btn-hint').addEventListener('click', handleHint);
document.getElementById('btn-step').addEventListener('click', handleStep);

document.getElementById('btn-reset').addEventListener('click', () => {
  stopSolving();
  board = copyBoard(givenBoard);
  stepCount = 0;
  selectedCell = null;
  renderBoard();
  clearLog();
  setStatus('Board reset to original puzzle.', '');
  addLog('Board reset.', 'info');
});

document.getElementById('btn-new').addEventListener('click', () => {
  stopSolving();
  loadPuzzle(); // random
  selectedCell = null;
  stepCount = 0;
  renderBoard();
  clearLog();
  setStatus('New puzzle loaded. Good luck!', '');
  addLog('New puzzle loaded.', 'info');
});

document.getElementById('btn-clear-log').addEventListener('click', clearLog);

// Number pad buttons
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => enterDigit(parseInt(btn.dataset.num)));
});

// Keyboard input
document.addEventListener('keydown', e => {
  if (solving) return;

  const n = parseInt(e.key);
  if (!isNaN(n) && n >= 0 && n <= 9) {
    enterDigit(n);
    return;
  }
  if (e.key === 'Backspace' || e.key === 'Delete') {
    enterDigit(0);
    return;
  }

  // Arrow key navigation
  if (!selectedCell) return;
  let { row, col } = selectedCell;
  if (e.key === 'ArrowUp')    row = Math.max(0, row - 1);
  if (e.key === 'ArrowDown')  row = Math.min(8, row + 1);
  if (e.key === 'ArrowLeft')  col = Math.max(0, col - 1);
  if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
  selectedCell = { row, col };
  applySelectionHighlight(row, col);
});

// ═══════════════════════════════════════════════════════════════
//  SECTION 12: INITIALISE
// ═══════════════════════════════════════════════════════════════

(function init() {
  loadPuzzle(0); // start with puzzle 0
  buildGrid();
  renderBoard();
  setStatus('Select a cell and enter a digit, or use the buttons below.', '');
  addLog('Sudoku AI ready. CSP solver loaded with MRV heuristic.', 'info');
})();