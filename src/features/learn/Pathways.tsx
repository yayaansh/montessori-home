import { Link } from 'react-router-dom'
import { PATHWAYS, pathwayProgress } from '../../data/pathways'
import { useStore } from '../../app/store'
import './learn.css'

export default function Pathways() {
  const tasks = useStore((s) => s.tasks)
  const recommend = useStore((s) => s.recommend)
  const name = useStore((s) => s.settings.childName)
  const all = PATHWAYS.map((p) => ({ p, prog: pathwayProgress(p, tasks) }))
  const total = all.reduce((a, x) => a + x.prog.total, 0)
  const done = all.reduce((a, x) => a + x.prog.done, 0)
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your path</div>
          <h1 className="title">{name ? `${name}'s path` : 'My path'}</h1>
          <p className="subtitle">
            Six subjects, each one a path of small steps. Start at the top and work your way down. {done} of {total} tasks done so far.
          </p>
        </div>
      </div>
      <div className="path-grid">
        {all.map(({ p, prog }) => {
          const pct = prog.total ? Math.round((100 * prog.done) / prog.total) : 0
          const rec = recommend[p.album] ? p.stages.find((s) => s.id === recommend[p.album]) : undefined
          return (
            <Link key={p.album} to={`/learn/path/${p.album}`} className={`tile path-card area-${p.album}`}>
              <div className="row between">
                <span className="glyph" style={{ background: 'var(--a-2)' }}>{p.glyph}</span>
                <span className="ring" style={{ ['--pct' as string]: `${pct}%` }} aria-label={`${pct} percent`}>
                  <span>{pct}%</span>
                </span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.tagline}</p>
              <div className="progress" aria-hidden>
                <span style={{ width: `${pct}%`, background: 'var(--a)' }} />
              </div>
              <div className="small muted">
                {prog.done === prog.total ? 'All done!' : prog.current ? `Next: ${prog.current.title}` : ''}
              </div>
              {rec && <div className="chip" style={{ alignSelf: 'flex-start', background: 'var(--ochre-2)' }}>💛 Mum suggests: {rec.title}</div>}
            </Link>
          )
        })}
      </div>
    </main>
  )
}
