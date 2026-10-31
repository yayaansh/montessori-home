import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ALBUM_META, ageOf, flatten } from '../../data/albums'
import type { Album, AlbumId, Status } from '../../data/types'
import { levelBand, useStore } from '../../app/store'
import { AreaChip, ProgressBar, StatusChip, formatDateTime } from '../../components/ui'
import { useAllAlbums } from './useAlbums'
import './guide.css'

function countStatuses(album: Album, progress: Record<string, { status: Status }>) {
  const counts: Record<Status, number> = { none: 0, presented: 0, practising: 0, mastered: 0 }
  for (const f of flatten(album).list) {
    if (!f.node.lesson) continue
    counts[progress[f.node.id]?.status ?? 'none']++
  }
  return counts
}

export default function Dashboard() {
  const albums = useAllAlbums()
  const progress = useStore((s) => s.progress)
  const plan = useStore((s) => s.plan)
  const work = useStore((s) => s.work)
  const settings = useStore((s) => s.settings)
  const band = levelBand(settings.level)

  const stats = useMemo(() => {
    if (!albums) return null
    return albums.map((a) => ({ album: a, counts: countStatuses(a, progress) }))
  }, [albums, progress])

  const practising = useMemo(() => {
    if (!albums) return []
    const out: { id: string; title: string; album: AlbumId; updated: string }[] = []
    for (const a of albums) {
      for (const f of flatten(a).list) {
        const p = progress[f.node.id]
        if (p && (p.status === 'practising' || p.status === 'presented')) out.push({ id: f.node.id, title: f.node.title, album: a.id, updated: p.updated })
      }
    }
    return out.sort((x, y) => (x.updated < y.updated ? 1 : -1)).slice(0, 8)
  }, [albums, progress])

  const nextUp = useMemo(() => {
    if (!albums) return []
    const out: { id: string; title: string; album: AlbumId; chapter: string }[] = []
    for (const a of albums) {
      if (a.id === 'theory') continue
      const list = flatten(a).list
      // start after the last lesson that has any progress in this album
      let lastTouched = -1
      list.forEach((f, i) => {
        if (f.node.lesson && progress[f.node.id] && progress[f.node.id].status !== 'none') lastTouched = i
      })
      let found = 0
      for (let i = Math.max(0, lastTouched); i < list.length && found < 2; i++) {
        const f = list[i]
        if (!f.node.lesson) continue
        const st = progress[f.node.id]?.status ?? 'none'
        if (st !== 'none') continue
        const age = ageOf(f.node)
        if (age && (age.min > band.max || age.max < band.min)) continue
        out.push({ id: f.node.id, title: f.node.title, album: a.id, chapter: f.path[f.path.length - 1]?.title ?? '' })
        found++
      }
    }
    return out
  }, [albums, progress, band.min, band.max])

  const open = plan.filter((p) => !p.done)
  const totalLessons = stats?.reduce((a, s) => a + s.album.lessonCount, 0) ?? 0
  const totalDone = stats?.reduce((a, s) => a + s.counts.presented + s.counts.practising + s.counts.mastered, 0) ?? 0

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Guide</div>
          <h1 className="title">{settings.childName ? `${settings.childName}'s journey` : 'Overview'}</h1>
          <p className="subtitle">
            {totalLessons ? `${totalDone} of ${totalLessons} lessons touched across the albums.` : 'Loading the albums…'} Working at the{' '}
            {settings.level === 'first' ? '6–9' : settings.level === 'second' ? '9–12' : 'full 6–12'} level.
          </p>
        </div>
        <div className="legend" aria-hidden>
          <span className="st-mastered"><i /> Mastered</span>
          <span className="st-practising"><i /> Practising</span>
          <span className="st-presented"><i /> Presented</span>
        </div>
      </div>

      <section className="grid grid-3" aria-label="Albums">
        {(stats ?? []).map(({ album, counts }) => {
          const m = ALBUM_META[album.id]
          const done = counts.presented + counts.practising + counts.mastered
          return (
            <Link key={album.id} to={`/guide/album/${album.id}`} className={`tile album-card area-${album.id}`}>
              <div className="row between">
                <span className="glyph">{m.glyph}</span>
                <span className="tcount">{album.lessonCount} lessons</span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.blurb}</p>
              <ProgressBar counts={counts} total={album.lessonCount} />
              <div className="counts">
                <span>{done} started</span>
                <span>{counts.mastered} mastered</span>
              </div>
            </Link>
          )
        })}
      </section>

      <div className="grid grid-2" style={{ marginTop: 28, alignItems: 'start' }}>
        <section className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 20 }}>This week</h2>
            <Link to="/guide/plan" className="btn btn-ghost btn-sm">Open planner</Link>
          </div>
          {open.length === 0 ? (
            <p className="muted">Nothing planned yet. Open a lesson and tap “Add to this week”.</p>
          ) : (
            <div className="stack">
              {open.slice(0, 6).map((p) => (
                <Link key={p.id} to={`/guide/lesson/${p.nodeId}`} className="next-item card-tint" style={{ background: 'var(--bg-2)', borderRadius: 12 }}>
                  <AreaChip album={p.album as AlbumId} small />
                  <div>
                    <div className="t">{p.title}</div>
                  </div>
                </Link>
              ))}
              {open.length > 6 && <span className="muted small">and {open.length - 6} more…</span>}
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Suggested next</h2>
          {!albums ? (
            <p className="muted">Loading…</p>
          ) : nextUp.length === 0 ? (
            <p className="muted">Everything at this level has been started. Change the level in Settings to see more.</p>
          ) : (
            <div className="stack">
              {nextUp.map((n) => (
                <Link key={n.id} to={`/guide/lesson/${n.id}`} className="next-item" style={{ background: 'var(--bg-2)', borderRadius: 12 }}>
                  <AreaChip album={n.album} small />
                  <div>
                    <div className="t">{n.title}</div>
                    <div className="s">{n.chapter}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>In progress</h2>
          {practising.length === 0 ? (
            <p className="muted">Lessons you mark as Presented or Practising will appear here.</p>
          ) : (
            <div className="stack">
              {practising.map((n) => (
                <Link key={n.id} to={`/guide/lesson/${n.id}`} className="next-item" style={{ background: 'var(--bg-2)', borderRadius: 12 }}>
                  <AreaChip album={n.album} small />
                  <div style={{ flex: 1 }}>
                    <div className="t">{n.title}</div>
                  </div>
                  <StatusChip status={progress[n.id].status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 20 }}>{settings.childName ? `${settings.childName}'s recent work` : 'Recent work'}</h2>
            <Link to="/learn/work" className="btn btn-ghost btn-sm">See all</Link>
          </div>
          {work.length === 0 ? (
            <p className="muted">When she works with the digital materials, words, problems or experiments, it is noted here.</p>
          ) : (
            <div className="stack">
              {work.slice(0, 6).map((w) => (
                <div key={w.id} className="next-item" style={{ background: 'var(--bg-2)', borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="t">{w.label}</div>
                    {w.detail && <div className="s">{w.detail}</div>}
                  </div>
                  <span className="s">{formatDateTime(w.at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
