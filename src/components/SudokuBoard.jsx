import { motion } from 'framer-motion';
import SudokuCell from './SudokuCell';

// ── Layout constants (must match Tailwind classes below) ──────────
const CELL_SIZE = 56; // w-14 = 56px
const INNER_GAP = 1;  // gap-px = 1px  (between cells in a box)
const INNER_PAD = 1;  // p-px = 1px    (box inner padding)
const BOX_GAP = 4;    // gap-1 = 4px   (between the 3×3 box groups)
const OUTER_PAD = 12; // p-3 = 12px    (outer board padding)

// Width of a single 3×3 box: pad + 3 cells + 2 inner gaps + pad
const BOX_DIM = INNER_PAD * 2 + CELL_SIZE * 3 + INNER_GAP * 2; // = 172

/**
 * Returns the top-left pixel position of a cell relative to
 * the board container's content area (accounts for outer padding).
 */
function getCursorPos(row, col) {
  const bRow = Math.floor(row / 3);
  const bCol = Math.floor(col / 3);
  const x = OUTER_PAD + bCol * (BOX_DIM + BOX_GAP) + INNER_PAD + (col % 3) * (CELL_SIZE + INNER_GAP);
  const y = OUTER_PAD + bRow * (BOX_DIM + BOX_GAP) + INNER_PAD + (row % 3) * (CELL_SIZE + INNER_GAP);
  return { x, y };
}

function isPeer(row, col, selRow, selCol) {
  if (row === selRow && col === selCol) return false;
  return (
    row === selRow ||
    col === selCol ||
    (Math.floor(row / 3) === Math.floor(selRow / 3) &&
      Math.floor(col / 3) === Math.floor(selCol / 3))
  );
}

export default function SudokuBoard({
  board,
  givenBoard,
  selectedCell,
  cellAnimStates,
  shakingCells,
  onCellClick,
}) {
  const cursorPos = selectedCell ? getCursorPos(selectedCell.row, selectedCell.col) : null;

  return (
    <div
      className="relative p-3 rounded-2xl backdrop-blur-xl border border-white/10"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Fluid selection cursor — one element that springs between positions */}
      <motion.div
        className="absolute pointer-events-none z-20 rounded-sm"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          boxShadow: '0 0 20px rgba(59,130,246,0.5), inset 0 0 0 2px rgba(59,130,246,0.8)',
          background: 'rgba(59,130,246,0.1)',
        }}
        animate={
          cursorPos
            ? { left: cursorPos.x, top: cursorPos.y, opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.8 }
        }
        transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
        initial={{ opacity: 0, scale: 0.8 }}
      />

      {/* 3×3 box grid */}
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((bRow) => (
          <div key={bRow} className="flex gap-1">
            {[0, 1, 2].map((bCol) => (
              <div
                key={bCol}
                className="grid grid-cols-3 gap-px p-px rounded-sm"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {Array.from({ length: 9 }, (_, i) => {
                  const r = bRow * 3 + Math.floor(i / 3);
                  const c = bCol * 3 + (i % 3);
                  const key = `${r}-${c}`;
                  return (
                    <SudokuCell
                      key={key}
                      row={r}
                      col={c}
                      value={board[r][c]}
                      isGiven={givenBoard[r][c] !== 0}
                      isSelected={selectedCell?.row === r && selectedCell?.col === c}
                      isHighlighted={
                        selectedCell ? isPeer(r, c, selectedCell.row, selectedCell.col) : false
                      }
                      animState={cellAnimStates[key] ?? null}
                      isShaking={shakingCells.has(key)}
                      onClick={(e) => onCellClick(r, c, e)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
