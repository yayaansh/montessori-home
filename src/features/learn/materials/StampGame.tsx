import { useEffect, useMemo, useState } from 'react'
import { Mat, Palette, newId, useMat, type Piece } from './Mat'
import { useStore } from '../../../app/store'
import { toast } from '../../../components/ui'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'
import { describeSpec } from '../../../data/pathways'
import { DemoOverlay, byLabel, bySelector, places, useDemo, type DemoStep } from '../demo'

type V = 1 | 10 | 100 | 1000
const VALUES: V[] = [1000, 100, 10, 1]
const COLOUR: Record<V, string> = { 1: '#5aa65a', 10: '#4a7fd0', 100: '#d9534f', 1000: '#5aa65a' }
const NAME: Record<V, string> = { 1: 'unit', 10: 'ten', 100: 'hundred', 1000: 'thousand' }
const S = 48
const SNAP = 24

function Stamp({ v }: { v: V }) {
  return (
    <div className="stamp" style={{ width: S, height: S, background: COLOUR[v], color: 'white', fontSize: v === 1000 ? 13 : 15 }}>
      {v}
    </div>
  )
}

function countOf(ps: Piece<V>[]): Record<V, number> {
  const c: Record<V, number> = { 1: 0, 10: 0, 100: 0, 1000: 0 }
  for (const p of ps) c[p.data]++
  return c
}
function slot(v: V, n: number) {
  const col = { 1000: 0, 100: 1, 10: 2, 1: 3 }[v]
  return { x: 24 + col * (S + 36) + Math.floor(n / 10) * 10, y: 24 + (n % 10) * (S + 6) }
}
function withStamp(ps: Piece<V>[], v: V): Piece<V>[] {
  const n = countOf(ps)[v]
  const at = slot(v, n)
  return [...ps, { id: newId(), kind: String(v), data: v, x: at.x, y: at.y, z: Math.max(0, ...ps.map((p) => p.z)) + 1 }]
}
function tidy(ps: Piece<V>[]): Piece<V>[] {
  const byV: Record<V, Piece<V>[]> = { 1000: [], 100: [], 10: [], 1: [] }
  for (const p of ps) byV[p.data].push(p)
  return VALUES.flatMap((v) => byV[v].map((p, n) => ({ ...p, ...slot(v, n) })))
}
function exchangeOnce(ps: Piece<V>[]): { ps: Piece<V>[]; from: V; to: V } | null {
  const c = countOf(ps)
  for (const [from, to] of [[1, 10], [10, 100], [100, 1000]] as [V, V][]) {
    if (c[from] >= 10) {
      const ids = ps.filter((p) => p.data === from).slice(0, 10).map((p) => p.id)
      return { ps: tidy(withStamp(ps.filter((p) => !ids.includes(p.id)), to)), from, to }
    }
  }
  return null
}
function takeOne(ps: Piece<V>[], v: V): Piece<V>[] {
  const hit = ps.find((p) => p.data === v)
  if (hit) return tidy(ps.filter((p) => p.id !== hit.id))
  const bigger = v === 1 ? 10 : v === 10 ? 100 : v === 100 ? 1000 : null
  if (!bigger) return ps
  const broken = takeOne(ps, bigger as V)
  if (broken.length === ps.length) return ps
  let out = broken
  for (let i = 0; i < 10; i++) out = withStamp(out, v)
  return takeOne(out, v)
}

export default function StampGame() {
  const mat = useMat<V>()
  const showTotals = useStore((s) => s.settings.showTotals)
  const [showTotal, setShowTotal] = useState(showTotals)
  const tk = useTask('stamp-game')
  const specTarget = tk.spec ? tk.spec.build ?? (tk.spec.sum ? tk.spec.sum[0] + tk.spec.sum[1] : tk.spec.take ? tk.spec.take[0] - tk.spec.take[1] : 0) : 0
  const [problem, setProblem] = useState(tk.task ? describeSpec(tk.task.spec) : '')
  const log = useWorkLogger('material', 'stamp-game', 'Stamp game')
  const demo = useDemo()

  const counts = useMemo(() => countOf(mat.pieces), [mat.pieces])
  const total = counts[1] + counts[10] * 10 + counts[100] * 100 + counts[1000] * 1000
  const taskMet = specTarget > 0 && total === specTarget
  useEffect(() => {
    if (taskMet && tk.active && !tk.done && !demo.playing) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done, demo.playing])

  const add = (v: V) => {
    mat.setPieces((ps) => withStamp(ps, v))
    log.touch(`Laid ${total + v} with the stamp game`)
  }
  const exchange = () => {
    let msg = ''
    mat.setPieces((ps) => {
      const r = exchangeOnce(ps)
      if (!r) return ps
      msg = `Ten ${r.from}s → one ${r.to}`
      return r.ps
    })
    setTimeout(() => toast(msg || 'Nothing to exchange yet: you need ten of a kind'), 0)
    log.touch()
  }

  const buildDemo = (): DemoStep[] => {
    const steps: DemoStep[] = [{ caption: 'Watch first. Clear mat.', run: () => mat.clear(), wait: 600 }]
    const lay = (n: number, intro: string) => {
      const p = places(n)
      steps.push({ caption: `${intro} ${n.toLocaleString()}. Thousands on the left, then hundreds, tens and units.`, wait: 1300 })
      const per: [V, number][] = [[1000, p.thousand], [100, p.hundred], [10, p.ten], [1, p.unit]]
      for (const [v, k] of per) for (let i = 1; i <= k; i++) steps.push({ caption: `${i} ${NAME[v]}${i > 1 ? 's' : ''}${i === k ? '.' : '…'}`, target: byLabel(`Add ${v}`), run: () => add(v), wait: 380 })
    }
    const spec = tk.spec
    if (spec?.sum) {
      const [a, b] = spec.sum
      lay(a, 'The first number is')
      lay(b, 'Underneath, the second number,')
      steps.push({ caption: `Count everything together: ${(a + b).toLocaleString()}.`, target: bySelector('.mat-badge'), wait: 1600 })
      for (let i = 0; i < 3; i++) steps.push({ caption: 'Ten of a kind? Exchange them for one of the next.', target: byLabel('Exchange'), run: () => mat.setPieces((ps) => exchangeOnce(ps)?.ps ?? ps), wait: 1100 })
      steps.push({ caption: `${a.toLocaleString()} + ${b.toLocaleString()} = ${(a + b).toLocaleString()}. Your turn.`, wait: 2000 })
    } else if (spec?.take) {
      const [a, b] = spec.take
      lay(a, 'Lay the big number,')
      const p = places(b)
      steps.push({ caption: `Now take away ${b.toLocaleString()}, units first.`, wait: 1100 })
      const per: [V, number][] = [[1, p.unit], [10, p.ten], [100, p.hundred], [1000, p.thousand]]
      for (const [v, k] of per) for (let i = 1; i <= k; i++) steps.push({ caption: `Take off ${i} ${NAME[v]}${i > 1 ? 's' : ''}${i === k ? '.' : '…'} If there are none, change a bigger stamp first.`, target: bySelector('.mat'), run: () => mat.setPieces((ps) => takeOne(ps, v)), wait: 420 })
      steps.push({ caption: `What is left: ${(a - b).toLocaleString()}. Your turn.`, target: bySelector('.mat-badge'), wait: 2200 })
    } else {
      const n = spec?.build ?? 2305
      lay(n, 'We lay')
      steps.push({ caption: `That is ${n.toLocaleString()}. Clear it and lay it yourself.`, target: bySelector('.mat-badge'), wait: 2200 })
    }
    steps.push({ caption: '', run: () => mat.clear(), wait: 10 })
    return steps
  }

  return (
    <div className="ws">
      <div>
        <TaskBanner t={tk} />
        {problem && (
          <div className="card" style={{ marginBottom: 12, fontSize: 30, fontWeight: 900, textAlign: 'center', letterSpacing: '0.04em' }}>
            {problem}
          </div>
        )}
        <Mat className="green" pieces={mat.pieces} onMove={mat.move} onRaise={mat.raise} onRemove={mat.remove} render={(p) => <Stamp v={p.data} />} sizeOf={() => ({ w: S, h: S })} snap={SNAP} hint="Tap a stamp below to lay it out. Thousands and hundreds on the left, tens and units on the right.">
          {(showTotal || demo.playing) && mat.pieces.length > 0 && <div className="mat-badge">{total.toLocaleString()}</div>}
        </Mat>
        <Palette>
          {VALUES.map((v) => (
            <button key={v} onClick={() => add(v)} aria-label={`Add ${v}`} style={{ padding: 4 }}>
              <Stamp v={v} />
            </button>
          ))}
          <span className="sp" />
          <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} />
          <button onClick={exchange} aria-label="Exchange">Exchange ⇄</button>
          <button onClick={() => mat.setPieces(tidy)}>Tidy</button>
          <button onClick={() => { mat.clear(); log.touch() }}>Clear</button>
        </Palette>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>On the mat</h3>
          <div className="stack" style={{ gap: 4, fontSize: 16 }}>
            {VALUES.map((v) => (
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
