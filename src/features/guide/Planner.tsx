import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AlbumId, AlbumNode } from '../../data/types'
import { flatten, loadAlbum, materialsOf } from '../../data/albums'
import { useStore, type PlanItem } from '../../app/store'
import { AreaChip, Empty } from '../../components/ui'
import './guide.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Planner() {
  const plan = useStore((s) => s.plan)
  const removeFromPlan = useStore((s) => s.removeFromPlan)
  const setPlanDay = useStore((s) => s.setPlanDay)
  const completePlan = useStore((s) => s.completePlan)
  const clearDonePlan = useStore((s) => s.clearDonePlan)
  const [nodes, setNodes] = useState<Record<string, AlbumNode>>({})

  const open = plan.filter((p) => !p.done)
  const done = plan.filter((p) => p.done)

  useEffect(() => {
    const albums = Array.from(new Set(plan.map((p) => p.album as AlbumId)))
    let alive = true
    Promise.all(albums.map((a) => loadAlbum(a))).then((loaded) => {
      if (!alive) return
      const map: Record<string, AlbumNode> = {}
      for (const a of loaded) for (const f of flatten(a).list) if (plan.some((p) => p.nodeId === f.node.id)) map[f.node.id] = f.node
      setNodes(map)
    })
    return () => {
      alive = false
    }
  }, [plan])

  const materials = useMemo(() => {
    const out: { text: string; lesson: string }[] = []
    for (const p of open) {
      const n = nodes[p.nodeId]
      if (!n) continue
      for (const m of materialsOf(n).slice(0, 6)) out.push({ text: m, lesson: p.title })
    }
    return out
  }, [open, nodes])

  const groups: { label: string; day: number | null; items: PlanItem[] }[] = [
    { label: 'Any day', day: null, items: open.filter((p) => p.day === null) },
    ...DAYS.map((d, i) => ({ label: d, day: i, items: open.filter((p) => p.day === i) })),
  ].filter((g) => g.items.length > 0)

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Planner</div>
          <h1 className="title">This week</h1>
          <p className="subtitle">Lessons you have chosen to present. Tick one off when it has been given and it is marked as Presented.</p>
        </div>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <Empty>
          Nothing planned yet. Open an album, pick a lesson and tap <strong>Add to this week</strong>.
          <div style={{ marginTop: 14 }}>
            <Link to="/guide" className="btn">Browse the albums</Link>
          </div>
        </Empty>
      ) : (
        <div className="lesson-layout">
          <div>
            {groups.map((g) => (
              <section key={g.label} className="day">
                <h3>{g.label}</h3>
                <div className="stack">
                  {g.items.map((p) => (
                    <PlanRow key={p.id} item={p} node={nodes[p.nodeId]} onDone={() => completePlan(p.id)} onRemove={() => removeFromPlan(p.id)} onDay={(d) => setPlanDay(p.id, d)} />
                  ))}
                </div>
              </section>
            ))}
            {done.length > 0 && (
              <section className="day">
                <div className="row between">
                  <h3>Done</h3>
                  <button className="btn btn-ghost btn-sm" onClick={clearDonePlan}>Clear done</button>
                </div>
                <div className="stack">
                  {done.map((p) => (
                    <PlanRow key={p.id} item={p} node={nodes[p.nodeId]} onDone={() => {}} onRemove={() => removeFromPlan(p.id)} onDay={() => {}} />
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="lesson-side">
            <section className="card">
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>To prepare</h3>
              {materials.length === 0 ? (
                <p className="muted small">The materials listed in the planned lessons will appear here. Many can be replaced by the digital materials in her corner.</p>
              ) : (
                <ul style={{ paddingLeft: '1.2em', display: 'grid', gap: 8, fontSize: 15 }}>
                  {materials.map((m, i) => (
                    <li key={i}>
                      {m.text}
                      <div className="muted small">{m.lesson}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}

function PlanRow({ item, node, onDone, onRemove, onDay }: { item: PlanItem; node?: AlbumNode; onDone: () => void; onRemove: () => void; onDay: (d: number | null) => void }) {
  return (
    <div className={`card plan-item ${item.done ? 'done' : ''}`}>
      <button className="check" aria-label={item.done ? 'Done' : 'Mark as presented'} onClick={onDone} disabled={!!item.done}>
        {item.done ? '✓' : ''}
      </button>
      <div>
        <Link to={`/guide/lesson/${item.nodeId}`} className="t">{item.title}</Link>
        <div className="row" style={{ marginTop: 4 }}>
          <AreaChip album={item.album as AlbumId} small />
          {node && materialsOf(node).length > 0 && <span className="muted small">{materialsOf(node).length} materials</span>}
        </div>
      </div>
      <div className="acts">
        {!item.done && (
          <select className="select" value={item.day ?? ''} onChange={(e) => onDay(e.target.value === '' ? null : Number(e.target.value))} aria-label="Day">
            <option value="">Any day</option>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        )}
        <button className="btn btn-ghost btn-sm" onClick={onRemove}>Remove</button>
      </div>
    </div>
  )
}
