const Dot = ({ color }) => (
  <span
    className="inline-block w-2 h-2 rounded-full shrink-0"
    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
  />
);

const Card = ({ dot, title, children }) => (
  <div className="rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4">
    <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-200 mb-2">
      <Dot color={dot} />
      {title}
    </h3>
    {children}
  </div>
);

export default function InfoPanel() {
  return (
    <aside className="flex flex-col gap-3 sticky top-8">
      <Card dot="#f0c040" title="What is a CSP?">
        <p className="text-xs text-slate-400 leading-relaxed">
          Sudoku is a classic <strong className="text-slate-200">Constraint Satisfaction Problem</strong>.
          Every empty cell is a <em>variable</em>, digits 1–9 are its <em>domain</em>, and the
          row/column/box rules are the <em>constraints</em>.
        </p>
      </Card>

      <Card dot="#4a9eff" title="Backtracking Search">
        <p className="text-xs text-slate-400 leading-relaxed">
          The AI picks an empty cell, tries every digit, checks all constraints with{' '}
          <code className="font-mono text-yellow-400 bg-yellow-400/10 px-1 rounded">isSafe()</code>, and
          recurses. On a dead-end it <em>backtracks</em> — undoing the last choice.
        </p>
      </Card>

      <Card dot="#3dd68c" title="MRV Heuristic">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Minimum Remaining Values</strong> — always pick the cell
          with the fewest legal digits first. This dramatically prunes the search tree.
        </p>
      </Card>

      <Card dot="#ff5470" title="isSafe() Constraints">
        <ul className="text-xs text-slate-400 space-y-1 mt-1">
          {['No duplicate in any row', 'No duplicate in any column', 'No duplicate in any 3×3 box'].map(
            (c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="text-emerald-400">→</span>
                <span dangerouslySetInnerHTML={{ __html: c.replace(/row|column|3×3 box/g, (m) => `<strong class="text-slate-200">${m}</strong>`) }} />
              </li>
            )
          )}
        </ul>
      </Card>
    </aside>
  );
}
