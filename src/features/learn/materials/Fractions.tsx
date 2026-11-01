import { useEffect, useMemo, useState } from 'react'
import { Mat, Palette, useMat, type Piece } from './Mat'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'

const R = 110 // radius of the frame and of pieces
const FRAME = { x: 40, y: 30 } // frame top-left on the mat

interface FData {
  d: number // denominator
  inFrame: boolean
  startAngle: number // degrees, when in frame
}

const HUES: Record<number, string> = {
  1: '#d64545', 2: '#d64545', 3: '#d64545', 4: '#d64545', 5: '#d64545', 6: '#d64545', 7: '#d64545', 8: '#d64545', 9: '#d64545', 10: '#d64545',
}

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= 359.99) return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
  const rad = (a: number) => ((a - 90) * Math.PI) / 180
  const x0 = cx + r * Math.cos(rad(a0))
  const y0 = cy + r * Math.sin(rad(a0))
  const x1 = cx + r * Math.cos(rad(a1))
  const y1 = cy + r * Math.sin(rad(a1))
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}

function Sector({ d, startAngle, label }: { d: number; startAngle: number; label: boolean }) {
  const a = 360 / d
  const mid = startAngle + a / 2
  const rad = ((mid - 90) * Math.PI) / 180
  const lr = d === 1 ? 0 : R * 0.62
  return (
    <svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={sectorPath(R, R, R - 2, startAngle, startAngle + a)} fill={HUES[d]} stroke="#8e2a2a" strokeWidth={2} strokeLinejoin="round" />
      {label && (
        <text x={R + lr * Math.cos(rad)} y={R + lr * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fontSize={d > 6 ? 16 : 20} fontWeight={900} fill="white" style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 3 }}>
          {d === 1 ? '1' : `1/${d}`}
        </text>
      )}
    </svg>
  )
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

export default function Fractions() {
  const mat = useMat<FData>()
  const [labels, setLabels] = useState(true)
  const log = useWorkLogger('material', 'fractions', 'Fraction circles')

  const inFrame = useMemo(() => mat.pieces.filter((p) => p.data.inFrame).sort((a, b) => a.data.startAngle - b.data.startAngle), [mat.pieces])
  const sum = useMemo(() => {
    // sum of 1/d as a reduced fraction
    let num = 0
    let den = 1
    for (const p of inFrame) {
      const d = p.data.d
      num = num * d + den
      den = den * d
      const g = gcd(num, den)
      num /= g
      den /= g
    }
    return { num, den }
  }, [inFrame])
  const usedAngle = inFrame.reduce((a, p) => a + 360 / p.data.d, 0)

  const tk = useTask('fractions')
  const taskMet = (() => {
    const s = tk.spec
    if (!s) return false
    if (s.fill) return inFrame.length === s.fill && inFrame.every((p) => p.data.d === s.fill)
    if (s.show) return inFrame.length === s.show[0] && inFrame.every((p) => p.data.d === s.show![1])
    return false
  })()
  useEffect(() => {
    if (taskMet && tk.active && !tk.done) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done])

  const addPiece = (d: number) => {
    const n = mat.pieces.filter((p) => !p.data.inFrame).length
    mat.add(String(d), { d, inFrame: false, startAngle: 0 }, { x: FRAME.x + R * 2 + 60 + (n % 3) * 30, y: 30 + (n % 5) * 36 })
    log.touch(`Fraction circles: ${sum.num}/${sum.den} in the frame`)
  }

  // when a loose piece is dropped with its centre inside the frame, snap it in
  const onDrop = (id: string, x: number, y: number) => {
    const p = mat.pieces.find((q) => q.id === id)
    if (!p) return
    const cx = x + R
    const cy = y + R
    const fx = FRAME.x + R
    const fy = FRAME.y + R
    const inside = Math.hypot(cx - fx, cy - fy) < R * 0.9
    const a = 360 / p.data.d
    if (inside && !p.data.inFrame) {
      if (usedAngle + a > 360.01) {
        // does not fit: nudge it out to the right
        mat.update(id, (q) => ({ ...q, x: FRAME.x + R * 2 + 40, y: FRAME.y }))
        return
      }
      mat.update(id, (q) => ({ ...q, x: FRAME.x, y: FRAME.y, data: { ...q.data, inFrame: true, startAngle: usedAngle } }))
      log.touch()
    } else if (!inside && p.data.inFrame) {
      // taken out: re-pack the others
      const others = inFrame.filter((q) => q.id !== id)
      let angle = 0
      mat.setPieces((ps) =>
        ps.map((q) => {
          if (q.id === id) return { ...q, data: { ...q.data, inFrame: false, startAngle: 0 } }
          const o = others.find((z) => z.id === q.id)
          if (o) {
            const r = { ...q, data: { ...q.data, startAngle: angle } }
            angle += 360 / q.data.d
            return r
          }
          return q
        }),
      )
    } else if (inside && p.data.inFrame) {
      mat.update(id, (q) => ({ ...q, x: FRAME.x, y: FRAME.y }))
    }
  }

  const render = (p: Piece<FData>) => <Sector d={p.data.d} startAngle={p.data.inFrame ? p.data.startAngle : 0} label={labels} />

  const isWhole = sum.num === sum.den && inFrame.length > 0
  const sameD = inFrame.length > 0 && inFrame.every((p) => p.data.d === inFrame[0].data.d)
  const readout = inFrame.length === 0 ? '—' : sameD && !isWhole ? `${inFrame.length}/${inFrame[0].data.d}` : isWhole ? '1 whole' : `${sum.num}/${sum.den}`

  return (
    <div className="ws">
      <div>
        <TaskBanner t={tk} />
        <Mat pieces={mat.pieces} onMove={mat.move} onDrop={onDrop} onRaise={mat.raise} onRemove={mat.remove} render={render} sizeOf={() => ({ w: R * 2, h: R * 2 })} hint="Tap a fraction below, then drag it into the green frame. Fill the whole circle.">
          <div style={{ position: 'absolute', left: FRAME.x - 10, top: FRAME.y - 10, width: R * 2 + 20, height: R * 2 + 20, borderRadius: '50%', background: '#5f8a5f', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#efe6d4' }} />
          </div>
          {inFrame.length > 0 && <div className={`mat-badge ${isWhole ? 'ok' : ''}`}>{readout}</div>}
        </Mat>
        <Palette>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
            <button key={d} onClick={() => addPiece(d)} aria-label={`Add one ${d === 1 ? 'whole' : `${d}th`}`}>
              <svg width={26} height={26} viewBox="0 0 26 26">
                <circle cx={13} cy={13} r={12} fill="#f3dccf" />
                <path d={sectorPath(13, 13, 12, 0, 360 / d)} fill="#d64545" />
              </svg>
              {d === 1 ? '1' : `1/${d}`}
            </button>
          ))}
          <span className="sp" />
          <button onClick={() => setLabels((l) => !l)}>{labels ? 'Hide names' : 'Show names'}</button>
          <button onClick={() => { mat.clear(); log.touch() }}>Clear</button>
        </Palette>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>In the frame</h3>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{readout}</div>
          {inFrame.length > 1 && !sameD && (
            <p className="muted small" style={{ marginTop: 6 }}>
              {inFrame.map((p) => (p.data.d === 1 ? '1' : `1/${p.data.d}`)).join(' + ')} = {isWhole ? '1' : `${sum.num}/${sum.den}`}
            </p>
          )}
          {inFrame.length > 0 && !isWhole && <p className="muted small" style={{ marginTop: 6 }}>Still missing: {sum.den - sum.num}/{sum.den}</p>}
        </div>
        <div className="card">
          <h3>Try</h3>
          <ul style={{ paddingLeft: '1.1em', fontSize: 15, display: 'grid', gap: 6 }}>
            <li>Fill the frame with quarters. How many did you need?</li>
            <li>Put in one half. Which other pieces fill the rest exactly?</li>
            <li>Is 2/6 the same as 1/3? Try it in the frame.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
