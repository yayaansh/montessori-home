import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AlbumId, AlbumNode, Status } from '../../data/types'
import { ALBUM_META, ageOf, countLessons, iterate } from '../../data/albums'
import { levelBand, useStore } from '../../app/store'
import { Breadcrumbs, StatusChip } from '../../components/ui'
import { useAlbum } from './useAlbums'
import './guide.css'

type Filter = 'all' | 'level' | 'none' | 'progress' | 'mastered'

export default function AlbumPage() {
  const { albumId } = useParams()
  const { album, error } = useAlbum(albumId as AlbumId)
  const progress = useStore((s) => s.progress)
  const level = useStore((s) => s.settings.level)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const band = levelBand(level)

  const match = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (n: AlbumNode): boolean => {
      if (needle && !n.title.toLowerCase().includes(needle)) return false
      if (filter === 'all') return true
      const st: Status = progress[n.id]?.status ?? 'none'
      if (filter === 'none') return n.lesson && st === 'none'
      if (filter === 'progress') return st === 'presented' || st === 'practising'
      if (filter === 'mastered') return st === 'mastered'
      if (filter === 'level') {
        const age = ageOf(n)
        return n.lesson && (!age || (age.min <= band.max && age.max >= band.min))
      }
      return true
    }
  }, [q, filter, progress, band.min, band.max])

  const filtering = filter !== 'all' || q.trim().length > 0

  if (error) return <main className="page"><p>{error}</p></main>
  if (!album) return <main className="page"><p className="muted">Loading…</p></main>
  const meta = ALBUM_META[album.id]

  return (
    <main className={`page area-${album.id}`}>
      <Breadcrumbs items={[{ to: '/guide', label: 'Overview' }, { label: meta.name }]} />
      <div className="page-head">
        <div>
          <div className="eyebrow">Album</div>
          <h1 className="title">
            <span style={{ marginRight: 10 }}>{meta.glyph}</span>
            {meta.name}
          </h1>
          <p className="subtitle">{meta.blurb} {album.lessonCount} lessons over {album.pages} album pages.</p>
        </div>
      </div>

      <div className="filters">
        <div className="seg" role="group" aria-label="Filter lessons">
          {(
            [
              ['all', 'All'],
              ['level', 'Her level'],
              ['none', 'Not started'],
              ['progress', 'In progress'],
              ['mastered', 'Mastered'],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Find a lesson in this album…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a lesson" />
      </div>

      <div className="tree">
        {album.roots.map((r) => (
          <TreeNode key={r.id} node={r} depth={0} filtering={filtering} match={match} defaultOpen />
        ))}
      </div>
    </main>
  )
}

function TreeNode({
  node,
  depth,
  filtering,
  match,
  defaultOpen,
}: {
  node: AlbumNode
  depth: number
  filtering: boolean
  match: (n: AlbumNode) => boolean
  defaultOpen?: boolean
}) {
  const progress = useStore((s) => s.progress)
  const [open, setOpen] = useState(!!defaultOpen)
  const anyMatch = useMemo(() => {
    if (!filtering) return true
    for (const n of iterate(node)) if (match(n)) return true
    return false
  }, [node, filtering, match])
  if (!anyMatch) return null

  const selfMatch = !filtering || match(node)
  const hasKids = node.children.length > 0
  const isOpen = filtering ? true : open
  const status: Status = progress[node.id]?.status ?? 'none'
  const age = ageOf(node)
  const lessons = countLessons(node)
  const isChapter = !node.lesson && hasKids

  return (
    <div className="tnode">
      {selfMatch && (
        <div className={`trow depth-${Math.min(depth, 2)} ${isChapter ? 'chapter' : ''} st-${status}`}>
          <button className={`tog ${hasKids ? '' : 'leaf'}`} onClick={() => setOpen((o) => !o)} aria-label={isOpen ? 'Collapse' : 'Expand'} aria-expanded={isOpen}>
            <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'none', fontSize: 18 }}>›</span>
          </button>
          <Link to={`/guide/lesson/${node.id}`} className="tlink">
            {node.lesson && <span className="lesson-dot" aria-hidden />}
            <span className="ttitle">{node.title}</span>
          </Link>
          <div className="tmeta">
            {age && <span className="chip small">{age.label}</span>}
            {node.lesson ? <StatusChip status={status} /> : lessons > 0 && <span className="tcount">{lessons} {lessons === 1 ? 'lesson' : 'lessons'}</span>}
          </div>
        </div>
      )}
      {hasKids && isOpen && (
        <div className="tkids">
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} filtering={filtering} match={match} defaultOpen={depth === 0 && !c.lesson && c.children.length > 0 && depth < 1} />
          ))}
        </div>
      )}
    </div>
  )
}
