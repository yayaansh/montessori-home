import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AlbumNode, Block, Section } from '../../data/types'
import { ALBUM_META, iterate, materialsOf } from '../../data/albums'
import { asset } from '../../data/paths'
import { tasksForLesson, taskHref } from '../../data/pathways'
import { useStore } from '../../app/store'
import { Lightbox } from '../../components/ui'
import { useNode } from '../guide/useAlbums'
import './learn.css'

const KIND_GLYPH: Record<string, string> = {
  'golden-beads': '🟡', 'stamp-game': '🟩', 'bead-bars': '🧮', fractions: '🥧', 'grammar-symbols': '🔺', 'movable-alphabet': '🔤', words: '🏛️', problems: '🧩', experiment: '🔬',
}

/** The steps of a lesson in child-sized pieces: the presentation (own or in its parts) if there is one, else the main text. */
function stepsOf(node: AlbumNode): Block[] {
  const all: Section[] = []
  for (const n of iterate(node)) all.push(...n.sections)
  const pres = all.filter((s) => s.kind === 'presentation' || s.kind === 'story')
  const pool = pres.length ? pres : node.sections.filter((s) => s.kind === 'intro' || s.kind === 'introduction' || s.kind === 'activities' || s.kind === 'other')
  return pool.flatMap((s) => s.blocks).filter((b) => b.type !== 'label')
}

export default function ChildLesson() {
  const { nodeId } = useParams()
  const { album, entry, error } = useNode(nodeId)
  const progress = useStore((s) => s.progress)
  const tasks = useStore((s) => s.tasks)
  const name = useStore((s) => s.settings.childName)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const activities = useMemo(() => (nodeId ? tasksForLesson(nodeId) : []), [nodeId])

  if (error) return <main className="page"><p>{error}</p><Link to="/learn/path" className="btn btn-ghost">Back to the paths</Link></main>
  if (!album || !entry) return <main className="page"><p className="muted">Loading…</p></main>

  const node = entry.node
  const meta = ALBUM_META[album.id]
  const status = progress[node.id]?.status ?? 'none'
  const given = status !== 'none'
  const steps = stepsOf(node).slice(0, 40)
  const materials = materialsOf(node).filter((m) => !/^(The|A) (guide|child|children)\b/i.test(m)).slice(0, 8)
  const images = Array.from(new Set([...node.images, ...node.children.flatMap((c) => c.images)])).slice(0, 8)
  const pathAlbum = activities[0]?.pathway.album ?? album.id
  const firstPending = activities.find((a) => !tasks[a.task.id])
  const doneCount = activities.filter((a) => tasks[a.task.id]).length

  return (
    <main className={`page page-narrow area-${album.id}`}>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      <div className="row" style={{ marginBottom: 10 }}>
        <Link to={`/learn/path/${pathAlbum}`} className="btn btn-ghost btn-sm">← The path</Link>
        <span className="chip" style={{ background: 'var(--a-2)' }}>{meta.glyph} {meta.name}</span>
        {given ? <span className="chip st-mastered status-chip">✓ Mum has shown you this</span> : <span className="chip">○ Ask Mum to show you this lesson</span>}
      </div>
      <header style={{ marginBottom: 18 }}>
        <div className="eyebrow">Lesson</div>
        <h1 className="title">{node.title}</h1>
      </header>

      {images.length > 0 && (
        <section className="gallery" style={{ marginBottom: 18 }}>
          {images.map((src) => (
            <button key={src} onClick={() => setLightbox(asset(src))} aria-label="Open picture">
              <img src={asset(src)} alt="" loading="lazy" />
            </button>
          ))}
        </section>
      )}

      {materials.length > 0 && (
        <section className="card" style={{ marginBottom: 14, background: 'var(--bg-2)' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>What is used</div>
          <ul style={{ paddingLeft: '1.2em', display: 'grid', gap: 4, fontSize: 17 }}>
            {materials.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="card" style={{ marginBottom: 18, borderLeft: '5px solid var(--a)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>What happens in the lesson</div>
          <ol className="child-steps">
            {steps.map((b, i) =>
              b.type === 'sub' ? (
                <li key={i} className="child-sub">{b.text}</li>
              ) : (
                <li key={i}>{b.text}</li>
              ),
            )}
          </ol>
          <p className="muted small" style={{ marginTop: 12 }}>This is what Mum shows you with the materials. Then you practise below.</p>
        </section>
      )}

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 20 }}>Now practise</h2>
          {activities.length > 0 && <span className="muted small">{doneCount} of {activities.length} done</span>}
        </div>
        {activities.length === 0 ? (
          <p className="muted">There is no practice activity for this lesson yet. Open a material from the shelf and explore.</p>
        ) : (
          <div className="task-list">
            {activities.map(({ task }) => {
              const done = !!tasks[task.id]
              return (
                <Link key={task.id} to={taskHref(task)} className={`task-row ${done ? 'done' : ''}`}>
                  <span className="glyph">{KIND_GLYPH[task.spec.kind] ?? '⭐'}</span>
                  <span className="t">
                    {task.title}
                    {task.hint && !done && <span className="s">{task.hint}</span>}
                  </span>
                  <span className={`btn btn-sm ${done ? 'btn-ghost' : ''}`}>{done ? '✓ Done' : 'Start'}</span>
                </Link>
              )
            })}
          </div>
        )}
        {firstPending && (
          <div className="row" style={{ marginTop: 14 }}>
            <Link to={taskHref(firstPending.task)} className="btn">
              {name ? `${name}, start here →` : 'Start here →'}
            </Link>
            <span className="muted small">Every activity has a “Show me how” button if you are not sure.</span>
          </div>
        )}
      </section>

      <p className="muted small">
        For the guide: the full album entry is in the Guide at <Link to={`/guide/lesson/${node.id}`} style={{ textDecoration: 'underline' }}>{node.title}</Link>.
      </p>
    </main>
  )
}
