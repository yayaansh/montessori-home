import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ALBUM_META, flatten } from '../../data/albums'
import type { AlbumId } from '../../data/types'
import { AreaChip } from '../../components/ui'
import { useAllAlbums } from './useAlbums'
import './guide.css'

interface Hit {
  id: string
  title: string
  album: AlbumId
  path: string
  snippet: string
  score: number
}

function snippetAround(text: string, needle: string, width = 140): string {
  const i = text.toLowerCase().indexOf(needle)
  if (i < 0) return text.slice(0, width)
  const start = Math.max(0, i - width / 2)
  const end = Math.min(text.length, i + needle.length + width / 2)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return (
    <>
      {parts.map((p, i) => (p.toLowerCase() === needle.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </>
  )
}

export default function SearchPage() {
  const albums = useAllAlbums()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase()
    if (!albums || needle.length < 2) return []
    const out: Hit[] = []
    for (const a of albums) {
      for (const f of flatten(a).list) {
        const titleHit = f.node.title.toLowerCase().includes(needle)
        let text = ''
        if (!titleHit) {
          text = f.node.sections.map((s) => s.blocks.map((b) => b.text).join(' ')).join(' ')
          if (!text.toLowerCase().includes(needle)) continue
        }
        out.push({
          id: f.node.id,
          title: f.node.title,
          album: a.id,
          path: f.path.map((p) => p.title).join(' › '),
          snippet: titleHit ? f.node.sections[0]?.blocks[0]?.text.slice(0, 140) ?? '' : snippetAround(text, needle),
          score: (titleHit ? 10 : 0) + (f.node.lesson ? 2 : 0),
        })
      }
    }
    return out.sort((x, y) => y.score - x.score).slice(0, 80)
  }, [albums, q])

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Search</div>
          <h1 className="title">Find a lesson</h1>
          <p className="subtitle">Searches titles and the full text of all eight albums.</p>
        </div>
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          setParams(draft ? { q: draft } : {})
        }}
      >
        <input className="input" style={{ flex: 1 }} placeholder="e.g. fractions, snake game, clock of eras, adjective…" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus aria-label="Search" />
        <button className="btn" type="submit">Search</button>
      </form>
      <div style={{ marginTop: 20 }} className="stack">
        {!albums && q && <p className="muted">Loading the albums…</p>}
        {albums && q.trim().length >= 2 && hits.length === 0 && <p className="muted">No matches for “{q}”.</p>}
        {hits.map((h) => (
          <Link key={h.id} to={`/guide/lesson/${h.id}`} className="card result">
            <div className="row">
              <AreaChip album={h.album} small />
              <span className="path">{h.path || ALBUM_META[h.album].name}</span>
            </div>
            <div className="t">
              <Highlight text={h.title} needle={q.trim()} />
            </div>
            {h.snippet && (
              <div className="muted small">
                <Highlight text={h.snippet} needle={q.trim()} />
              </div>
            )}
          </Link>
        ))}
        {q && hits.length === 80 && <p className="muted small">Showing the first 80 results. Try a more specific word.</p>}
      </div>
    </main>
  )
}
