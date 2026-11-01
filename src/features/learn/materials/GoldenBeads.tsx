import { useEffect, useMemo, useState } from 'react'
import { Mat, Palette, useMat, type Piece } from './Mat'
import { useStore } from '../../../app/store'
import { toast } from '../../../components/ui'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'

type Kind = 'unit' | 'ten' | 'hundred' | 'thousand'
const VALUE: Record<Kind, number> = { unit: 1, ten: 10, hundred: 100, thousand: 1000 }
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

export default function GoldenBeads() {
  const mat = useMat<Kind>()
  const showTotals = useStore((s) => s.settings.showTotals)
  const tk = useTask('golden-beads')
  const specTarget = tk.spec ? tk.spec.build ?? (tk.spec.sum ? tk.spec.sum[0] + tk.spec.sum[1] : tk.spec.take ? tk.spec.take[0] - tk.spec.take[1] : 0) : 0
  const showCards = !tk.spec || !!tk.spec.build
  const [target, setTarget] = useState<string>(specTarget ? String(specTarget) : '')
  const [showTotal, setShowTotal] = useState(showTotals)
  const log = useWorkLogger('material', 'golden-beads', 'Golden beads')

  const counts = useMemo(() => {
    const c: Record<Kind, number> = { unit: 0, ten: 0, hundred: 0, thousand: 0 }
    for (const p of mat.pieces) c[p.data]++
    return c
  }, [mat.pieces])
  const total = counts.unit + counts.ten * 10 + counts.hundred * 100 + counts.thousand * 1000
  const targetN = Number(target.replace(/\D/g, '')) || 0
  const matches = targetN > 0 && total === targetN
  useEffect(() => {
    if (matches && tk.active && !tk.done) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, tk.active, tk.done])

  const add = (k: Kind) => {
    mat.add(k, k)
    log.touch(`Built ${total + VALUE[k]} with golden beads`)
  }

  const exchange = () => {
    const order: [Kind, Kind][] = [
      ['unit', 'ten'],
      ['ten', 'hundred'],
      ['hundred', 'thousand'],
    ]
    for (const [from, to] of order) {
      if (counts[from] >= 10) {
        const ids = mat.pieces.filter((p) => p.data === from).slice(0, 10).map((p) => p.id)
        const first = mat.pieces.find((p) => p.id === ids[0])!
        mat.removeMany(ids)
        mat.add(to, to, { x: first.x, y: first.y })
        toast(`10 ${from}s → 1 ${to}`)
        log.touch()
        return
      }
    }
    toast('Nothing to exchange yet: you need 10 of a kind')
  }

  const render = (p: Piece<Kind>) =>
    p.data === 'unit' ? <Unit /> : p.data === 'ten' ? <TenBar /> : p.data === 'hundred' ? <HundredSquare /> : <ThousandCube />

  const digits = targetN ? String(targetN).padStart(1, '0') : ''
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
          {(showTotal || matches) && mat.pieces.length > 0 && (
            <div className={`mat-badge ${matches ? 'ok' : ''}`}>{matches ? `${total.toLocaleString()} ✓` : total.toLocaleString()}</div>
          )}
        </Mat>
        <Palette>
          <button onClick={() => add('unit')} aria-label="Add a unit"><Bead size={16} /> 1</button>
          <button onClick={() => add('ten')} aria-label="Add a ten bar"><span style={{ display: 'flex', gap: 2 }}>{[0, 1, 2].map((i) => <Bead key={i} size={10} />)}</span> 10</button>
          <button onClick={() => add('hundred')} aria-label="Add a hundred square"><span style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 8px)', gap: 2 }}>{Array.from({ length: 9 }).map((_, i) => <Bead key={i} size={8} />)}</span> 100</button>
          <button onClick={() => add('thousand')} aria-label="Add a thousand cube">🧊 1000</button>
          <span className="sp" />
          <button onClick={exchange}>Exchange ⇄</button>
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
