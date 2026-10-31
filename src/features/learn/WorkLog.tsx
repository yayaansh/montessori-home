import { useStore, type WorkKind } from '../../app/store'
import { Empty } from '../../components/ui'
import './learn.css'

const GLYPH: Record<WorkKind, string> = { material: '🧺', words: '🏛️', problem: '🧩', experiment: '🔬', lesson: '📖' }

export default function WorkLog() {
  const work = useStore((s) => s.work)
  const removeWork = useStore((s) => s.removeWork)
  const name = useStore((s) => s.settings.childName)
  const byDay = new Map<string, typeof work>()
  for (const w of work) {
    const d = new Date(w.at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(w)
  }
  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Journal</div>
          <h1 className="title">{name ? `${name}'s work` : 'My work'}</h1>
          <p className="subtitle">A record of what you have worked on. {work.length} {work.length === 1 ? 'entry' : 'entries'}.</p>
        </div>
      </div>
      {work.length === 0 ? (
        <Empty>When you work with the materials, the words, the problems or the experiments, it will be written down here.</Empty>
      ) : (
        Array.from(byDay.entries()).map(([day, items]) => (
          <section key={day} className="work-day">
            <h3>{day}</h3>
            <div className="stack" style={{ gap: 8 }}>
              {items.map((w) => (
                <div key={w.id} className="card work-item">
                  <span className="glyph">{GLYPH[w.kind]}</span>
                  <div style={{ flex: 1 }}>
                    <div className="t">{w.label}</div>
                    {w.detail && <div className="s">{w.detail}</div>}
                  </div>
                  <span className="s">{new Date(w.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeWork(w.id)} aria-label="Remove entry">✕</button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
