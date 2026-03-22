import { motion } from 'framer-motion';

const RADIUS = 72; // px from center to each number button

/**
 * Circular dial of 9 numbers + erase, fanning out from the selected cell.
 * pos: { x, y } in viewport (fixed) coordinates — the cell's center.
 */
export default function RadialPicker({ pos, onSelect, onClose }) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <>
      {/* Invisible full-screen backdrop — click to dismiss */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Radial container centered on the clicked cell */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
      >
        {/* Numbers 1–9 fanned out in a circle */}
        {numbers.map((num, i) => {
          // Spread 360° starting from top (-90°)
          const angle = ((i / numbers.length) * 2 * Math.PI) - Math.PI / 2;
          const tx = Math.cos(angle) * RADIUS;
          const ty = Math.sin(angle) * RADIUS;

          return (
            <motion.button
              key={num}
              className="
                absolute w-9 h-9 rounded-full pointer-events-auto
                flex items-center justify-center
                font-mono text-sm font-bold text-white
                border border-white/20
                hover:border-blue-400 hover:text-blue-300
                hover:shadow-[0_0_14px_rgba(59,130,246,0.6)]
                transition-colors
              "
              style={{
                left: -18,
                top: -18,
                background: 'rgba(15,23,42,0.92)',
                backdropFilter: 'blur(12px)',
              }}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, x: tx, y: ty }}
              exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 22,
                delay: i * 0.035,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.88 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(num);
              }}
            >
              {num}
            </motion.button>
          );
        })}

        {/* Erase button at center */}
        <motion.button
          className="
            absolute w-8 h-8 rounded-full pointer-events-auto
            flex items-center justify-center
            font-mono text-xs font-bold text-red-400
            border border-red-500/40
            hover:bg-red-500/20 hover:border-red-400
            transition-colors
          "
          style={{
            left: -16,
            top: -16,
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.12 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.88 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(0);
          }}
        >
          ✕
        </motion.button>
      </div>
    </>
  );
}
