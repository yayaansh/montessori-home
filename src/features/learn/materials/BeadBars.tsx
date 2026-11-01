import { useEffect, useMemo, useState } from 'react'
import { Mat, Palette, newId, useMat, type Piece } from './Mat'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'
import { DemoOverlay, byLabel, bySelector, useDemo, type DemoStep } from '../demo'

export const BAR_COLOURS: Record<number, string> = {
  1: '#d64545',
  2: '#4caf50',
  3: '#ec6fae',
  4: '#f2c230',
  5: '#64b5f6',
  6: '#9b6bbf',
  7: '#f5f5f0',
  8: '#8d5a3b',
  9: '#2d4fa0',
  10: '#d9a93c',
}
const B = 20
const GAP = 2
const SNAP = 22

function Bar({ n, label }: { n: number; label?: boolean }) {
  return (
    <div style={{ position: 'relative', display: 'flex', gap: GAP, padding: 3 }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="bead" style={{ width: B, height: B, background: BAR_COLOURS[n], border: n === 7 ? '1px solid #ccc' : undefined }} />
      ))}
      {label && (
        <span style={{ position: 'absolute', right: -4, top: -12, fontSize: 12, fontWeight: 900, background: 'white', borderRadius: 6, padding: '0 5px', boxShadow: 'var(--shadow)' }}>
          {n}
        </span>
      )}
    </div>
  )
}

function withBar(ps: Piece<number>[], n: number): Piece<number>[] {
  const row = ps.length
  return [...ps, { id: newId(), kind: String(n), data: n, x: 24, y: 24 + (row % 14) * (B + 8), z: Math.max(0, ...ps.map((p) => p.z)) + 1 }]
}

/** Pick a bar that makes the total with at least two bars of the same kind. */
function factorFor(m: number): number | null {
  for (const n of [10, 9, 8, 7, 6, 5, 4, 3, 2]) if (m % n === 0 && m / n >= 2) return n
  return null
}

export default function BeadBars() {
  const mat = useMat<number>()
  const [labels, setLabels] = useState(false)
  const log = useWorkLogger('material', 'bead-bars', 'Bead bars')
  const demo = useDemo()

  const stats = useMemo(() => {
    const total = mat.pieces.reduce((a, p) => a + p.data, 0)
    const values = Array.from(new Set(mat.pieces.map((p) => p.data)))
    const same = values.length === 1 ? values[0] : null
    return { total, same, count: mat.pieces.length }
  }, [mat.pieces])

  const tk = useTask('bead-bars')
  const taskMet = useMemo(() => {
    const s = tk.spec
    if (!s) return false
    if (s.staircase) {
      const vals = mat.pieces.map((p) => p.data).sort((a, b) => a - b)
      return vals.length === 10 && vals.every((v, i) => v === i + 1)
    }
    if (s.table) return stats.same === s.table[0] && stats.count === s.table[1]
    if (s.make) return stats.count >= 2 && stats.total === s.make
    return false
  }, [tk.spec, mat.pieces, stats])
  useEffect(() => {
    if (taskMet && tk.active && !tk.done && !demo.playing) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done, demo.playing])

  const add = (n: number) => {
    mat.setPieces((ps) => withBar(ps, n))
    log.touch(stats.same && stats.same === n ? `${stats.count + 1} × ${n} with bead bars` : `Bead bars up to ${stats.total + n}`)
  }

  const buildDemo = (): DemoStep[] => {
    const steps: DemoStep[] = [{ caption: 'Watch first. Clear mat.', run: () => mat.clear(), wait: 500 }]
    const s = tk.spec
    const lay = (n: number, k: number, say: (i: number) => string) => {
      for (let i = 1; i <= k; i++) steps.push({ caption: say(i), target: byLabel(`Add bar of ${n}`), run: () => add(n), wait: 650 })
    }
    if (s?.staircase) {
      steps.push({ caption: 'One bar of each colour, from 1 to 10. Shortest first.', wait: 1200 })
      for (let n = 1; n <= 10; n++) steps.push({ caption: `The bar of ${n}.`, target: byLabel(`Add bar of ${n}`), run: () => add(n), wait: 550 })
      steps.push({ caption: 'A staircase! Each bar is one bead longer. Clear it and build your own.', wait: 2200 })
    } else if (s?.table) {
      const [n, k] = s.table
      steps.push({ caption: `We lay the bar of ${n}, ${k} times, counting as we go.`, wait: 1300 })
      lay(n, k, (i) => `${i} × ${n} = ${i * n}`)
      steps.push({ caption: `${k} bars of ${n} make ${n * k}. Clear the mat and try it.`, target: bySelector('.ws-side .card'), wait: 2200 })
    } else if (s?.make) {
      const m = s.make
      const n = factorFor(m)
      if (n) {
        steps.push({ caption: `We want ${m}. Let's try the bar of ${n}.`, wait: 1200 })
        lay(n, m / n, (i) => `${i} × ${n} = ${i * n}`)
        steps.push({ caption: `${m / n} bars of ${n} make ${m}. Are there other bars that work? Try them.`, wait: 2400 })
      } else {
        steps.push({ caption: `We want ${m} with more than one bar. Try different bars until the total says ${m}.`, wait: 2200 })
      }
    } else {
      steps.push({ caption: 'Tap a bar to place it. Lay the same bar again to build a table.', wait: 1200 })
      lay(4, 4, (i) => `${i} × 4 = ${i * 4}`)
      steps.push({ caption: 'Four fours make a square: 16. Now you try.', wait: 2200 })
    }
    steps.push({ caption: '', run: () => mat.clear(), wait: 10 })
    return steps
  }

  const render = (p: Piece<number>) => <Bar n={p.data} label={labels || demo.playing} />

  return (
    <div className="ws">
      <div>
        <TaskBanner t={tk} />
        <Mat pieces={mat.pieces} onMove={mat.move} onRaise={mat.raise} onRemove={mat.remove} render={render} sizeOf={(p) => ({ w: p.data * (B + GAP) + 6, h: B + 6 })} snap={SNAP} hint="Tap a bar below to place it. Lay the same bar again and again to build a table, or make a square." />
        <Palette>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => add(n)} aria-label={`Add bar of ${n}`} style={{ padding: '6px 10px', gap: 6 }}>
              <span className="bead" style={{ width: 16, height: 16, background: BAR_COLOURS[n], border: n === 7 ? '1px solid #ccc' : undefined }} />
              {n}
            </button>
          ))}
          <span className="sp" />
          <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} />
          <button onClick={() => setLabels((l) => !l)}>{labels ? 'Hide numbers' : 'Show numbers'}</button>
          <button onClick={() => { mat.clear(); log.touch() }}>Clear</button>
        </Palette>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>On the mat</h3>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {stats.count === 0 ? '—' : stats.same ? `${stats.count} × ${stats.same} = ${stats.total}` : stats.total}
          </div>
          <p className="muted small" style={{ marginTop: 6 }}>
            {stats.count === 0 ? 'Nothing yet.' : stats.same ? `${stats.count} bars of ${stats.same}.` : `${stats.count} bars, ${stats.total} beads altogether.`}
          </p>
        </div>
        <div className="card">
          <h3>Try</h3>
          <ul style={{ paddingLeft: '1.1em', fontSize: 15, display: 'grid', gap: 6 }}>
            <li>Lay the bar of 4 four times. What shape do you get?</li>
            <li>Skip count: lay the 3 bar and say 3, 6, 9, 12…</li>
            <li>How many ways can you make 24 with one kind of bar?</li>
            <li>Build a snake with different bars and count it in tens.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Colours</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, fontSize: 13 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <div key={n} className="row" style={{ gap: 6 }}>
                <span className="bead" style={{ width: 14, height: 14, background: BAR_COLOURS[n], border: n === 7 ? '1px solid #ccc' : undefined }} /> {n}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
