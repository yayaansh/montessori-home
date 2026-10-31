import { useMemo, useState } from 'react'
import { Mat, Palette, useMat, type Piece } from './Mat'
import { useStore } from '../../../app/store'
import { toast } from '../../../components/ui'
import { useWorkLogger } from '../useWorkLogger'

type V = 1 | 10 | 100 | 1000
const COLOUR: Record<V, string> = { 1: '#5aa65a', 10: '#4a7fd0', 100: '#d9534f', 1000: '#5aa65a' }
const S = 48
const SNAP = 24

function Stamp({ v }: { v: V }) {
  return (
    <div className="stamp" style={{ width: S, height: S, background: COLOUR[v], color: 'white', fontSize: v === 1000 ? 13 : 15 }}>
      {v}
    </div>
  )
}

export default function StampGame() {
  const mat = useMat<V>()
  const showTotals = useStore((s) => s.settings.showTotals)
  const [showTotal, setShowTotal] = useState(showTotals)
  const [problem, setProblem] = useState('')
  const log = useWorkLogger('material', 'stamp-game', 'Stamp game')

  const counts = useMemo(() => {
    const c: Record<V, number> = { 1: 0, 10: 0, 100: 0, 1000: 0 }
    for (const p of mat.pieces) c[p.data]++
    return c
  }, [mat.pieces])
  const total = counts[1] + counts[10] * 10 + counts[100] * 100 + counts[1000] * 1000

  const add = (v: V) => {
    // place in the column for its value, stacking downwards
    const col = { 1000: 0, 100: 1, 10: 2, 1: 3 }[v]
    const n = counts[v]
    mat.add(String(v), v, { x: 24 + col * (S + 36) + (Math.floor(n / 10) * 10), y: 24 + (n % 10) * (S + 6) })
    log.touch(`Laid ${total + v} with the stamp game`)
  }

  const exchange = () => {
    const order: [V, V][] = [
      [1, 10],
      [10, 100],
      [100, 1000],
    ]
    for (const [from, to] of order) {
      if (counts[from] >= 10) {
        const ids = mat.pieces.filter((p) => p.data === from).slice(0, 10).map((p) => p.id)
        mat.removeMany(ids)
        setTimeout(() => add(to), 0)
        toast(`Ten ${from}s → one ${to}`)
        log.touch()
        return
      }
    }
    toast('Nothing to exchange yet: you need ten of a kind')
  }

  const tidy = () => {
    const byV: Record<V, Piece<V>[]> = { 1000: [], 100: [], 10: [], 1: [] }
    for (const p of mat.pieces) byV[p.data].push(p)
    mat.setPieces(
      ([1000, 100, 10, 1] as V[]).flatMap((v, col) =>
        byV[v].map((p, n) => ({ ...p, x: 24 + col * (S + 36) + Math.floor(n / 10) * 10, y: 24 + (n % 10) * (S + 6) })),
      ),
    )
  }

  return (
    <div className="ws">
      <div>
        {problem && (
          <div className="card" style={{ marginBottom: 12, fontSize: 30, fontWeight: 900, textAlign: 'center', letterSpacing: '0.04em' }}>
            {problem}
          </div>
        )}
        <Mat className="green" pieces={mat.pieces} onMove={mat.move} onRaise={mat.raise} onRemove={mat.remove} render={(p) => <Stamp v={p.data} />} sizeOf={() => ({ w: S, h: S })} snap={SNAP} hint="Tap a stamp below to lay it out. Thousands and hundreds on the left, tens and units on the right.">
          {showTotal && mat.pieces.length > 0 && <div className="mat-badge">{total.toLocaleString()}</div>}
        </Mat>
        <Palette>
          {([1000, 100, 10, 1] as V[]).map((v) => (
            <button key={v} onClick={() => add(v)} aria-label={`Add ${v}`} style={{ padding: 4 }}>
              <Stamp v={v} />
            </button>
          ))}
          <span className="sp" />
          <button onClick={exchange}>Exchange ⇄</button>
          <button onClick={tidy}>Tidy</button>
          <button onClick={() => { mat.clear(); log.touch() }}>Clear</button>
        </Palette>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>On the mat</h3>
          <div className="stack" style={{ gap: 4, fontSize: 16 }}>
            {([1000, 100, 10, 1] as V[]).map((v) => (
              <div key={v} className="row between">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, background: COLOUR[v], display: 'inline-block' }} /> {v}s
                </span>
                <strong>{counts[v]}</strong>
              </div>
            ))}
          </div>
          <label className="row between" style={{ marginTop: 10 }}>
            <span className="small">Show the total</span>
            <input type="checkbox" checked={showTotal} onChange={(e) => setShowTotal(e.target.checked)} style={{ width: 22, height: 22 }} />
          </label>
        </div>
        <div className="card">
          <h3>The problem</h3>
          <input className="input" placeholder="e.g. 1 234 + 2 341" value={problem} onChange={(e) => setProblem(e.target.value)} aria-label="Problem" />
          <p className="muted small" style={{ marginTop: 8 }}>Write the sum here so it stays in view while she lays out the stamps.</p>
        </div>
        <div className="card">
          <h3>How it works</h3>
          <ul style={{ paddingLeft: '1.1em', fontSize: 15, display: 'grid', gap: 6 }}>
            <li>Lay the first number, then the second number below it.</li>
            <li>Push them together and count. Ten of one kind become one of the next.</li>
            <li>For taking away, lay the big number and take stamps off.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
