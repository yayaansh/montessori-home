import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AlbumNode, Block, Section, Status } from '../../data/types'
import { ALBUM_META, ageOf, hasContent, summaryOf } from '../../data/albums'
import { MATERIALS, formatBytes, materialsForNode, printablesForNode } from '../../data/links'
import { useStore } from '../../app/store'
import { AreaChip, Breadcrumbs, Lightbox, StatusControl, Toaster, toast } from '../../components/ui'
import { useNode } from './useAlbums'
import { asset } from '../../data/paths'
import './guide.css'

const KIND_LABEL: Partial<Record<Section['kind'], string>> = {
  intro: '',
  materials: 'Materials',
  presentation: 'Presentation',
  directAim: 'Direct aim',
  indirectAim: 'Indirect aim',
  age: 'Age',
  followUp: 'Follow-up',
  extension: 'Extensions',
  etymology: 'Etymology',
  observations: 'Observations',
  introduction: 'Introduction',
  prerequisites: 'Before this lesson',
  pointsOfInterest: 'Points of interest',
  controlOfError: 'Control of error',
  notes: 'Notes',
  conclusion: 'Conclusion',
  activities: 'Activities',
  story: 'Story',
}

export default function LessonPage() {
  const { nodeId } = useParams()
  const { album, flat, entry, error } = useNode(nodeId)
  const progress = useStore((s) => s.progress)
  const setStatus = useStore((s) => s.setStatus)
  const setNotes = useStore((s) => s.setNotes)
  const addToPlan = useStore((s) => s.addToPlan)
  const plan = useStore((s) => s.plan)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const related = useMemo(() => {
    if (!entry || !album) return { materials: [], printables: [] }
    return {
      materials: materialsForNode(entry.node, entry.path, album.id),
      printables: printablesForNode(entry.node, entry.path, album.id),
    }
  }, [entry, album])

  const neighbours = useMemo(() => {
    if (!flat || !entry) return { prev: null, next: null }
    const lessons = flat.list.filter((f) => f.node.lesson || (!f.node.children.length && hasContent(f.node)))
    const i = lessons.findIndex((f) => f.node.id === entry.node.id)
    if (i < 0) return { prev: null, next: null }
    return { prev: lessons[i - 1] ?? null, next: lessons[i + 1] ?? null }
  }, [flat, entry])

  if (error) return <main className="page"><p>{error}</p> <Link to="/guide">Back to overview</Link></main>
  if (!album || !entry) return <main className="page"><p className="muted">Loading…</p></main>

  const node = entry.node
  const meta = ALBUM_META[album.id]
  const status: Status = progress[node.id]?.status ?? 'none'
  const notes = progress[node.id]?.notes ?? ''
  const age = ageOf(node)
  const planned = plan.some((p) => p.nodeId === node.id && !p.done)
  const images = Array.from(new Set([node.id, ...(node.lesson ? node.children.map((c) => c.id) : [])].flatMap((id) => (id === node.id ? node.images : node.children.find((c) => c.id === id)?.images ?? []))))

  return (
    <main className={`page area-${album.id}`}>
      <Toaster />
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      <Breadcrumbs
        items={[
          { to: '/guide', label: 'Overview' },
          { to: `/guide/album/${album.id}`, label: meta.name },
          ...entry.path.map((p) => ({ to: `/guide/lesson/${p.id}`, label: p.title })),
        ]}
      />
      <header className="lesson-head">
        <div className="row">
          <AreaChip album={album.id} />
          {age && <span className="chip">Age {age.label}</span>}
          <span className="chip">Album p. {node.page}</span>
        </div>
        <h1 className="lesson-title">{node.title}</h1>
        {node.lesson && (
          <div className="lesson-actions">
            <StatusControl value={status} onChange={(s) => setStatus(node.id, s)} />
            <button
              className={`btn ${planned ? 'btn-ghost' : 'btn-soft'}`}
              onClick={() => {
                if (planned) return
                addToPlan({ nodeId: node.id, title: node.title, album: album.id })
                toast('Added to this week')
              }}
              disabled={planned}
            >
              {planned ? '✓ Planned this week' : '+ Add to this week'}
            </button>
          </div>
        )}
      </header>

      <div className="lesson-layout">
        <div className="lesson-body">
          <NodeBody node={node} depth={0} onImage={setLightbox} inlineChildren={node.lesson} />

          {!node.lesson && node.children.length > 0 && (
            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>In this chapter</h2>
              <div className="child-cards">
                {node.children.map((c) => (
                  <Link key={c.id} to={`/guide/lesson/${c.id}`} className={`child-card st-${progress[c.id]?.status ?? 'none'}`}>
                    {c.lesson && <span className="lesson-dot" aria-hidden />}
                    <div className="t">
                      {c.title}
                      {!c.lesson && c.children.length > 0 && <span className="tcount"> · {c.children.length} parts</span>}
                      <div className="muted small" style={{ fontWeight: 400 }}>{summaryOf(c, 110)}</div>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {images.length > 0 && (
            <section className="card section">
              <h3>Pictures from the album</h3>
              <div className="gallery">
                {images.map((src) => (
                  <button key={src} onClick={() => setLightbox(asset(src))} aria-label="Open picture">
                    <img src={asset(src)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <nav className="prevnext" aria-label="Previous and next">
            {neighbours.prev ? (
              <Link to={`/guide/lesson/${neighbours.prev.node.id}`} className="card">
                <div className="s">← Previous</div>
                <div className="t">{neighbours.prev.node.title}</div>
              </Link>
            ) : <span />}
            {neighbours.next ? (
              <Link to={`/guide/lesson/${neighbours.next.node.id}`} className="card" style={{ textAlign: 'right' }}>
                <div className="s">Next →</div>
                <div className="t">{neighbours.next.node.title}</div>
              </Link>
            ) : <span />}
          </nav>
        </div>

        <aside className="lesson-side">
          {related.materials.length > 0 && (
            <section className="card">
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>Digital materials</h3>
              <div className="side-list">
                {related.materials.map((m) => (
                  <Link key={m.id} to={`/learn/materials/${m.id}`} className="side-item">
                    <span className="glyph">{m.glyph}</span>
                    <div>
                      <div className="t">{m.name}</div>
                      <div className="s">Open in her corner</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {related.printables.length > 0 && (
            <section className="card">
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>Printables</h3>
              <div className="side-list">
                {related.printables.map((p) => (
                  <a key={p.id} href={asset(p.file)} target="_blank" rel="noopener" className="side-item">
                    {p.thumb ? <img src={asset(p.thumb)} alt="" loading="lazy" /> : <span className="glyph">📄</span>}
                    <div>
                      <div className="t">{p.name}</div>
                      <div className="s">{p.pages ? `${p.pages} pages · ` : ''}{formatBytes(p.bytes)}</div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
          {node.lesson && (
            <section className="card">
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>Notes</h3>
              <textarea
                className="textarea"
                placeholder="How did it go? What to repeat next time…"
                value={notes}
                onChange={(e) => setNotes(node.id, e.target.value)}
              />
              {progress[node.id]?.history?.length ? (
                <div className="muted small" style={{ marginTop: 8 }}>
                  {progress[node.id].history.slice(-3).map((h, i) => (
                    <div key={i}>
                      {h.status} · {new Date(h.date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          )}
          {related.materials.length === 0 && album.id === 'arithmetic' && (
            <section className="card">
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>Digital materials</h3>
              <div className="side-list">
                {MATERIALS.filter((m) => m.album === 'arithmetic').slice(0, 3).map((m) => (
                  <Link key={m.id} to={`/learn/materials/${m.id}`} className="side-item">
                    <span className="glyph">{m.glyph}</span>
                    <div className="t">{m.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}

function NodeBody({ node, depth, onImage, inlineChildren }: { node: AlbumNode; depth: number; onImage: (s: string) => void; inlineChildren: boolean }) {
  return (
    <>
      {node.sections.map((s, i) => (
        <SectionView key={i} section={s} />
      ))}
      {inlineChildren &&
        node.children.map((c) => (
          <section key={c.id} className={`subnode d${Math.min(depth + 1, 3)}`}>
            <h2>
              <Link to={`/guide/lesson/${c.id}`}>{c.title}</Link>
            </h2>
            <NodeBody node={c} depth={depth + 1} onImage={onImage} inlineChildren />
          </section>
        ))}
    </>
  )
}

function SectionView({ section }: { section: Section }) {
  if (!section.blocks.length && !section.label) return null
  const label = section.label || KIND_LABEL[section.kind] || ''
  if (section.kind === 'age') {
    return (
      <div className="card section k-age">
        <h3>Age</h3>
        <span>{section.blocks.map((b) => b.text).join(' ')}</span>
      </div>
    )
  }
  if (section.kind === 'intro' && !section.label) {
    return (
      <div className="blocks" style={{ fontSize: 18 }}>
        <Blocks blocks={section.blocks} ordered={false} />
      </div>
    )
  }
  return (
    <section className={`card section k-${section.kind}`}>
      <h3>{label}</h3>
      <div className="blocks">
        <Blocks blocks={section.blocks} ordered={section.kind === 'presentation'} />
      </div>
    </section>
  )
}

function Blocks({ blocks, ordered }: { blocks: Block[]; ordered: boolean }) {
  // group consecutive items into lists
  const out: JSX.Element[] = []
  let list: Block[] = []
  let step = 1
  const flush = () => {
    if (!list.length) return
    const items = list.map((b, i) => (
      <li key={i} className={b.level ? `l${b.level}` : ''} value={ordered && !b.level ? step++ : undefined}>
        {b.text}
      </li>
    ))
    out.push(ordered ? <ol key={out.length} className="steps">{items}</ol> : <ul key={out.length}>{items}</ul>)
    list = []
  }
  blocks.forEach((b, i) => {
    if (b.type === 'item') {
      list.push(b)
      return
    }
    flush()
    if (b.type === 'sub' || b.type === 'label') out.push(<div key={i} className="sub">{b.text}</div>)
    else out.push(<p key={i}>{b.text}</p>)
  })
  flush()
  return <>{out}</>
}
