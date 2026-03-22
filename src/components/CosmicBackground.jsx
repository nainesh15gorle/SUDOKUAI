import { motion } from 'framer-motion';

const ORBS = [
  {
    color: 'rgba(139,92,246,0.18)',
    size: 650,
    left: '-8%',
    top: '2%',
    animX: [0, 50, -30, 20, 0],
    animY: [0, -40, 30, -15, 0],
    duration: 22,
    delay: 0,
  },
  {
    color: 'rgba(59,130,246,0.14)',
    size: 550,
    left: '68%',
    top: '-8%',
    animX: [0, -40, 20, -10, 0],
    animY: [0, 50, -20, 30, 0],
    duration: 26,
    delay: 2,
  },
  {
    color: 'rgba(99,102,241,0.12)',
    size: 700,
    left: '28%',
    top: '58%',
    animX: [0, 30, -50, 15, 0],
    animY: [0, -30, 40, -20, 0],
    duration: 30,
    delay: 5,
  },
  {
    color: 'rgba(168,85,247,0.1)',
    size: 420,
    left: '82%',
    top: '65%',
    animX: [0, -20, 40, -30, 0],
    animY: [0, 30, -40, 10, 0],
    duration: 18,
    delay: 1,
  },
];

export default function CosmicBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle grid mesh */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Drifting orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(72px)',
          }}
          animate={{ x: orb.animX, y: orb.animY, scale: [1, 1.06, 0.97, 1.03, 1] }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
