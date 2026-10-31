import { useMemo, useState } from 'react'
import { Mat, Palette, useMat, type Piece } from './Mat'
import { useWorkLogger } from '../useWorkLogger'

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

export default function BeadBars() {
  const mat = useMat<number>()
  const [labels, setLabels] = useState(false)
  const log = useWorkLogger('material', 'bead-bars', 'Bead bars')

  const stats = useMemo(() => {
    const total = mat.pieces.reduce((a, p) => a + p.data, 0)
    const values = Array.from(new Set(mat.pieces.map((p) => p.data)))
    const same = values.length === 1 ? values[0] : null
    return { total, same, count: mat.pieces.length }
  }, [mat.pieces])

  const add = (n: number) => {
    const row = mat.pieces.length
    mat.add(String(n), n, { x: 24, y: 24 + (row % 14) * (B + 8) })
    log.touch(stats.same && stats.same === n ? `${stats.count + 1} × ${n} with bead bars` : `Bead bars up to ${stats.total + n}`)
  }

  const render = (p: Piece<number>) => <Bar n={p.data} label={labels} />

  return (
    <div className="ws">
      <div>
        <Mat pieces={mat.pieces} onMove={mat.move} onRaise={mat.raise} onRemove={mat.remove} render={render} sizeOf={(p) => ({ w: p.data * (B + GAP) + 6, h: B + 6 })} snap={SNAP} hint="Tap a bar below to place it. Lay the same bar again and again to build a table, or make a square." />
        <Palette>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => add(n)} aria-label={`Add bar of ${n}`} style={{ padding: '6px 10px', gap: 6 }}>
              <span className="bead" style={{ width: 16, height: 16, background: BAR_COLOURS[n], border: n === 7 ? '1px solid #ccc' : undefined }} />
              {n}
            </button>
          ))}
          <span className="sp" />
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
