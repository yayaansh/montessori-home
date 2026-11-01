import { useEffect, useMemo, useState } from 'react'
import { Mat, Palette, newId, useMat, type Piece } from './Mat'
import { useStore } from '../../../app/store'
import { toast } from '../../../components/ui'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'
import { DemoOverlay, byLabel, bySelector, places, useDemo, type DemoStep } from '../demo'

type Kind = 'unit' | 'ten' | 'hundred' | 'thousand'
const KINDS: Kind[] = ['thousand', 'hundred', 'ten', 'unit']
const VALUE: Record<Kind, number> = { unit: 1, ten: 10, hundred: 100, thousand: 1000 }
const LABEL: Record<Kind, string> = { unit: 'Add a unit', ten: 'Add a ten bar', hundred: 'Add a hundred square', thousand: 'Add a thousand cube' }
const NEXT: Partial<Record<Kind, Kind>> = { unit: 'ten', ten: 'hundred', hundred: 'thousand' }
const PREV: Partial<Record<Kind, Kind>> = { ten: 'unit', hundred: 'ten', thousand: 'hundred' }
const B = 13 // bead size
const GAP = 2
const BAR = B * 10 + GAP * 9
const GOLD = '#d9a93c'

function Bead({ size = B }: { size?: number }) {
  return <span className="bead" style={{ width: size, height: size, background: GOLD }} />
}
function Unit() {
  return (
    <div style={{ padding: 6 }}>
      <Bead />
    </div>
  )
}
function TenBar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, padding: 4, borderRadius: 8 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Bead key={i} />
      ))}
    </div>
  )
}
function HundredSquare() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(10, ${B}px)`, gap: GAP, padding: 4, background: 'rgba(255,255,255,0.35)', borderRadius: 6 }}>
      {Array.from({ length: 100 }).map((_, i) => (
        <Bead key={i} />
      ))}
    </div>
  )
}
function ThousandCube() {
  const d = 16
  return (
    <div style={{ position: 'relative', width: BAR + 8 + d, height: BAR + 8 + d }}>
      <div style={{ position: 'absolute', left: d, top: 0, width: BAR + 8, height: BAR + 8, background: '#b58a2b', borderRadius: 4, transform: 'skewX(-35deg) scaleY(0.5)', transformOrigin: 'left bottom', opacity: 0.9 }} />
      <div style={{ position: 'absolute', right: 0, top: d, width: BAR + 8, height: BAR + 8, background: '#9a7320', borderRadius: 4, transform: 'skewY(-35deg) scaleX(0.4)', transformOrigin: 'left top', opacity: 0.9 }} />
      <div style={{ position: 'absolute', left: 0, top: d }}>
        <HundredSquare />
      </div>
    </div>
  )
}

const SIZE: Record<Kind, { w: number; h: number }> = {
  unit: { w: B + 12, h: B + 12 },
  ten: { w: B + 8, h: BAR + 8 },
  hundred: { w: BAR + 8, h: BAR + 8 },
  thousand: { w: BAR + 24, h: BAR + 24 },
}

/** Where the n-th piece of a kind goes: thousands and hundreds fan down in columns, tens in a row, units in a block. */
function spawnPos(kind: Kind, n: number) {
  const col = KINDS.indexOf(kind)
  if (kind === 'thousand' || kind === 'hundred') return { x: 24 + col * 190 + (n % 2) * 12, y: 24 + n * 30 }
  if (kind === 'ten') return { x: 24 + 2 * 190 + (n % 9) * 24, y: 24 + Math.floor(n / 9) * 170 }
  return { x: 24 + 3 * 190 + (n % 5) * 28, y: 24 + Math.floor(n / 5) * 28 }
}
function piece(kind: Kind, z: number, at: { x: number; y: number }): Piece<Kind> {
  return { id: newId(), kind, data: kind, x: at.x, y: at.y, z }
}
function withPiece(ps: Piece<Kind>[], kind: Kind): Piece<Kind>[] {
  const n = ps.filter((p) => p.data === kind).length
  return [...ps, piece(kind, Math.max(0, ...ps.map((p) => p.z)) + 1, spawnPos(kind, n))]
}
function countOf(ps: Piece<Kind>[]): Record<Kind, number> {
  const c: Record<Kind, number> = { unit: 0, ten: 0, hundred: 0, thousand: 0 }
  for (const p of ps) c[p.data]++
  return c
}
/** Exchange ten of the smallest kind that has ten or more for one of the next. */
function exchangeOnce(ps: Piece<Kind>[]): { ps: Piece<Kind>[]; from: Kind; to: Kind } | null {
  const c = countOf(ps)
  for (const from of ['unit', 'ten', 'hundred'] as Kind[]) {
    const to = NEXT[from]!
    if (c[from] >= 10) {
      const ids = ps.filter((p) => p.data === from).slice(0, 10).map((p) => p.id)
      const rest = ps.filter((p) => !ids.includes(p.id))
      return { ps: withPiece(rest, to), from, to }
    }
  }
  return null
}
/** Remove one piece of a kind, breaking a bigger piece into ten smaller ones when needed. */
function takeOne(ps: Piece<Kind>[], kind: Kind): Piece<Kind>[] {
  const hit = ps.find((p) => p.data === kind)
  if (hit) return ps.filter((p) => p.id !== hit.id)
  const bigger = NEXT[kind]
  if (!bigger) return ps
  const withBigger = takeOne(ps, bigger)
  if (withBigger.length === ps.length) return ps // nothing to break
  let out = withBigger
  for (let i = 0; i < 10; i++) out = withPiece(out, kind)
  return takeOne(out, kind)
}

export default function GoldenBeads() {
  const mat = useMat<Kind>()
  const showTotals = useStore((s) => s.settings.showTotals)
  const tk = useTask('golden-beads')
  const specTarget = tk.spec ? tk.spec.build ?? (tk.spec.sum ? tk.spec.sum[0] + tk.spec.sum[1] : tk.spec.take ? tk.spec.take[0] - tk.spec.take[1] : 0) : 0
  const showCards = !tk.spec || !!tk.spec.build
  const [target, setTarget] = useState<string>(specTarget ? String(specTarget) : '')
  const [showTotal, setShowTotal] = useState(showTotals)
  const log = useWorkLogger('material', 'golden-beads', 'Golden beads')
  const demo = useDemo()

  const counts = useMemo(() => countOf(mat.pieces), [mat.pieces])
  const total = counts.unit + counts.ten * 10 + counts.hundred * 100 + counts.thousand * 1000
  const targetN = Number(target.replace(/\D/g, '')) || 0
  const matches = targetN > 0 && total === targetN
  useEffect(() => {
    if (matches && tk.active && !tk.done && !demo.playing) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, tk.active, tk.done, demo.playing])

  const add = (k: Kind) => {
    mat.setPieces((ps) => withPiece(ps, k))
    log.touch(`Built ${total + VALUE[k]} with golden beads`)
  }
  const exchange = () => {
    let msg = ''
    mat.setPieces((ps) => {
      const r = exchangeOnce(ps)
      if (!r) return ps
      msg = `10 ${r.from}s → 1 ${r.to}`
      return r.ps
    })
    setTimeout(() => toast(msg || 'Nothing to exchange yet: you need 10 of a kind'), 0)
    log.touch()
  }

  const buildDemo = (): DemoStep[] => {
    const steps: DemoStep[] = [{ caption: 'Let me show you. First, a clear mat.', run: () => mat.clear(), wait: 600 }]
    const lay = (n: number, intro: string) => {
      const p = places(n)
      steps.push({ caption: `${intro} ${n.toLocaleString()}.`, wait: 900 })
      for (const k of KINDS) {
        for (let i = 1; i <= p[k]; i++) {
          steps.push({ caption: `${i} ${k}${i > 1 ? 's' : ''}${i === p[k] ? '.' : '…'}`, target: byLabel(LABEL[k]), run: () => add(k), wait: 420 })
        }
      }
    }
    const spec = tk.spec
    if (spec?.sum) {
      const [a, b] = spec.sum
      lay(a, 'The first number is')
      lay(b, 'Now the second number,')
      steps.push({ caption: `Push them together and count. That is ${(a + b).toLocaleString()}.`, target: bySelector('.mat-badge'), wait: 1800 })
      for (let i = 0; i < 3; i++) {
        steps.push({
          caption: 'Ten of a kind? Change them for one of the next kind.',
          target: byLabel('Exchange'),
          run: () => mat.setPieces((ps) => exchangeOnce(ps)?.ps ?? ps),
          wait: 1200,
        })
      }
      steps.push({ caption: `${a.toLocaleString()} + ${b.toLocaleString()} = ${(a + b).toLocaleString()}. Now you try.`, wait: 2000 })
    } else if (spec?.take) {
      const [a, b] = spec.take
      lay(a, 'Lay the big number,')
      const p = places(b)
      steps.push({ caption: `Now take away ${b.toLocaleString()}, starting with the units.`, wait: 1200 })
      for (const k of [...KINDS].reverse()) {
        for (let i = 1; i <= p[k]; i++) {
          steps.push({
            caption: `Put back ${i} ${k}${i > 1 ? 's' : ''}${i === p[k] ? '.' : '…'} (changing a bigger piece if there are none left)`,
            target: bySelector('.mat'),
            run: () => mat.setPieces((ps) => takeOne(ps, k)),
            wait: 450,
          })
        }
      }
      steps.push({ caption: `What is left is the answer: ${(a - b).toLocaleString()}. Now you try.`, target: bySelector('.mat-badge'), wait: 2200 })
    } else {
      const n = spec?.build ?? 1234
      lay(n, 'We are going to build')
      steps.push({ caption: `There it is: ${n.toLocaleString()}. Now clear the mat and build it yourself.`, target: bySelector('.mat-badge'), wait: 2200 })
    }
    steps.push({ caption: '', run: () => mat.clear(), wait: 10 })
    return steps
  }

  const render = (p: Piece<Kind>) =>
    p.data === 'unit' ? <Unit /> : p.data === 'ten' ? <TenBar /> : p.data === 'hundred' ? <HundredSquare /> : <ThousandCube />

  const digits = targetN ? String(targetN) : ''
  const cardColours = ['#3f7d3a', '#1f5fb0', '#c0392b', '#3f7d3a'] // units, tens, hundreds, thousands

  return (
    <div className="ws">
      <div>
        <TaskBanner t={tk} />
        <Mat pieces={mat.pieces} onMove={mat.move} onRaise={mat.raise} onRemove={mat.remove} render={render} sizeOf={(p) => SIZE[p.data]} hint="Tap a bead, bar, square or cube below to place it on the mat. Drag to move. Tap a piece to put it back.">
          {targetN > 0 && showCards && (
            <div className="mat-target numcards" aria-label={`Target ${targetN}`}>
              {digits.split('').map((d, i) => {
                const place = digits.length - 1 - i
                return (
                  <span key={i} className="numcard" style={{ color: cardColours[Math.min(place, 3)] }}>
                    {d}
                  </span>
                )
              })}
            </div>
          )}
          {(showTotal || matches || demo.playing) && mat.pieces.length > 0 && (
            <div className={`mat-badge ${matches && !demo.playing ? 'ok' : ''}`}>{matches && !demo.playing ? `${total.toLocaleString()} ✓` : total.toLocaleString()}</div>
          )}
        </Mat>
        <Palette>
          <button onClick={() => add('unit')} aria-label="Add a unit"><Bead size={16} /> 1</button>
          <button onClick={() => add('ten')} aria-label="Add a ten bar"><span style={{ display: 'flex', gap: 2 }}>{[0, 1, 2].map((i) => <Bead key={i} size={10} />)}</span> 10</button>
          <button onClick={() => add('hundred')} aria-label="Add a hundred square"><span style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 8px)', gap: 2 }}>{Array.from({ length: 9 }).map((_, i) => <Bead key={i} size={8} />)}</span> 100</button>
          <button onClick={() => add('thousand')} aria-label="Add a thousand cube">🧊 1000</button>
          <span className="sp" />
          <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} />
          <button onClick={exchange} aria-label="Exchange">Exchange ⇄</button>
          <button onClick={() => { mat.clear(); log.touch() }}>Clear mat</button>
        </Palette>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>On the mat</h3>
          <div className="stack" style={{ gap: 4, fontSize: 16 }}>
            <div className="row between"><span>Thousands</span><strong>{counts.thousand}</strong></div>
            <div className="row between"><span>Hundreds</span><strong>{counts.hundred}</strong></div>
            <div className="row between"><span>Tens</span><strong>{counts.ten}</strong></div>
            <div className="row between"><span>Units</span><strong>{counts.unit}</strong></div>
          </div>
          <label className="row between" style={{ marginTop: 10 }}>
            <span className="small">Show the total</span>
            <input type="checkbox" checked={showTotal} onChange={(e) => setShowTotal(e.target.checked)} style={{ width: 22, height: 22 }} />
          </label>
        </div>
        <div className="card">
          <h3>A number to build</h3>
          <input className="input" inputMode="numeric" placeholder="e.g. 2 347" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Number to build" />
          <p className="muted small" style={{ marginTop: 8 }}>The guide can type a number. It is shown on number cards in the corner of the mat. When the beads match, a tick appears.</p>
        </div>
        <div className="card">
          <h3>Ideas</h3>
          <ul style={{ paddingLeft: '1.1em', fontSize: 15, display: 'grid', gap: 6 }}>
            <li>Lay a number, then add a second number underneath and exchange.</li>
            <li>Take away: lay the big number, then put back the smaller one.</li>
            <li>Count ten units, then press Exchange to see them become a ten bar.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
