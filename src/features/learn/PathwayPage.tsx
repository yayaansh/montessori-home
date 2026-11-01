import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { pathwayFor, pathwayProgress, taskHref, type Stage } from '../../data/pathways'
import { ALBUM_META, flatten, loadAlbum } from '../../data/albums'
import type { AlbumId, Status } from '../../data/types'
import { useStore } from '../../app/store'
import './learn.css'

const KIND_GLYPH: Record<string, string> = {
  'golden-beads': '🟡',
  'stamp-game': '🟩',
  'bead-bars': '🧮',
  fractions: '🥧',
  'grammar-symbols': '🔺',
  'movable-alphabet': '🔤',
  words: '🏛️',
  problems: '🧩',
  experiment: '🔬',
}

export default function PathwayPage() {
  const { album } = useParams()
  const p = pathwayFor(album ?? '')
  const tasks = useStore((s) => s.tasks)
  const progress = useStore((s) => s.progress)
  const recommend = useStore((s) => s.recommend)
  const [titles, setTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!p) return
    let alive = true
    loadAlbum(p.album).then((a) => {
      if (!alive) return
      const map: Record<string, string> = {}
      for (const f of flatten(a).list) map[f.node.id] = f.node.title
      setTitles(map)
    })
    return () => {
      alive = false
    }
  }, [p])

  if (!p)
    return (
      <main className="page">
        <p>That path was not found.</p>
        <Link to="/learn/path" className="btn btn-ghost">All paths</Link>
      </main>
    )
  const prog = pathwayProgress(p, tasks)
  const meta = ALBUM_META[p.album as AlbumId]
  const rec = recommend[p.album]

  return (
    <main className={`page page-narrow area-${p.album}`}>
      <div className="row" style={{ marginBottom: 10 }}>
        <Link to="/learn/path" className="btn btn-ghost btn-sm">← All paths</Link>
      </div>
      <div className="page-head">
        <div>
          <div className="eyebrow">{meta.name}</div>
          <h1 className="title">
            <span style={{ marginRight: 10 }}>{p.glyph}</span>
            {p.title}
          </h1>
          <p className="subtitle">{p.tagline}</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row between">
          <strong>{prog.done} of {prog.total} tasks done</strong>
          <span className="muted small">{p.stages.length} steps</span>
        </div>
        <div className="progress" style={{ marginTop: 8 }} aria-hidden>
          <span style={{ width: `${prog.total ? (100 * prog.done) / prog.total : 0}%`, background: 'var(--a)' }} />
        </div>
      </div>

      <ol className="trail">
        {p.stages.map((s, i) => (
          <StageCard key={s.id} stage={s} index={i + 1} state={prog.stageState[s.id]} recommended={rec === s.id} tasks={tasks} progress={progress} titles={titles} />
        ))}
      </ol>
    </main>
  )
}

function StageCard({
  stage,
  index,
  state,
  recommended,
  tasks,
  progress,
  titles,
}: {
  stage: Stage
  index: number
  state: 'done' | 'current' | 'upcoming'
  recommended: boolean
  tasks: Record<string, { done: string }>
  progress: Record<string, { status: Status }>
  titles: Record<string, string>
}) {
  const [open, setOpen] = useState(state !== 'upcoming' || recommended)
  useEffect(() => {
    if (state === 'current' || recommended) setOpen(true)
  }, [state, recommended])
  const doneCount = stage.tasks.filter((t) => tasks[t.id]).length
  return (
    <li className={`stage ${state} ${recommended ? 'recommended' : ''}`}>
      <div className="stage-marker" aria-hidden>
        {state === 'done' ? '✓' : index}
      </div>
      <div className="stage-body card">
        <button className="stage-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div className="row" style={{ gap: 8 }}>
              <h2>{stage.title}</h2>
              {state === 'current' && <span className="chip" style={{ background: 'var(--a-2)' }}>You are here</span>}
              {recommended && <span className="chip" style={{ background: 'var(--ochre-2)' }}>💛 Mum suggests</span>}
            </div>
            <p className="muted">{stage.blurb}</p>
            {stage.tasks.length > 0 && (
              <div className="small muted" style={{ marginTop: 4 }}>
                {doneCount} of {stage.tasks.length} tasks done
              </div>
            )}
          </div>
          <span aria-hidden style={{ fontSize: 20 }}>{open ? '▾' : '▸'}</span>
        </button>
        {open && (
          <div className="stage-detail">
            {stage.lessons.map((id, li) => {
              const st = progress[id]?.status ?? 'none'
              const given = st !== 'none'
              const mine = stage.tasks.filter((t) => t.lesson === id)
              const doneHere = mine.filter((t) => tasks[t.id]).length
              return (
                <div key={id} className="lesson-block">
                  <Link to={`/learn/lesson/${id}`} className="lesson-card">
                    <span className="glyph">📖</span>
                    <span className="t">
                      Lesson {li + 1}: {titles[id] ?? '…'}
                      <span className="s">{given ? '✓ Mum has shown you this' : 'Ask Mum to show you this, then practise'}{mine.length ? ` · ${doneHere} of ${mine.length} activities done` : ''}</span>
                    </span>
                    <span aria-hidden>›</span>
                  </Link>
                  {mine.length > 0 && (
                    <div className="task-list" style={{ marginLeft: 12 }}>
                      {mine.map((t) => {
                        const done = !!tasks[t.id]
                        return (
                          <Link key={t.id} to={taskHref(t)} className={`task-row ${done ? 'done' : ''}`}>
                            <span className="glyph">{KIND_GLYPH[t.spec.kind] ?? '⭐'}</span>
                            <span className="t">
                              {t.title}
                              {t.hint && !done && <span className="s">{t.hint}</span>}
                            </span>
                            <span className={`btn btn-sm ${done ? 'btn-ghost' : ''}`}>{done ? '✓ Done' : 'Start'}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </li>
  )
}
