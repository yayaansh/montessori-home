import { Link } from 'react-router-dom'
import { useStore } from '../../app/store'
import { MATERIALS } from '../../data/links'
import './learn.css'

const TILES = [
  { to: '/learn/materials', glyph: '🧺', title: 'Materials', text: 'Beads, stamps, bars, fractions, grammar symbols and letters.', c: 'var(--terracotta)', c2: 'var(--terracotta-2)' },
  { to: '/learn/words', glyph: '🏛️', title: 'Words', text: 'Where do words come from? Flip the cards and find out.', c: 'var(--plum)', c2: 'var(--plum-2)' },
  { to: '/learn/problems', glyph: '🧩', title: 'Problems', text: 'Story problems to work out, step by step.', c: 'var(--ochre)', c2: 'var(--ochre-2)' },
  { to: '/learn/experiments', glyph: '🔬', title: 'Experiments', text: 'Things to try at the kitchen table.', c: 'var(--slate)', c2: 'var(--slate-2)' },
  { to: '/learn/work', glyph: '📒', title: 'My work', text: 'Everything you have worked on.', c: 'var(--sage)', c2: 'var(--sage-2)' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function LearnHome() {
  const name = useStore((s) => s.settings.childName)
  const allPlan = useStore((s) => s.plan)
  const plan = allPlan.filter((p) => !p.done)
  const work = useStore((s) => s.work)
  const lastMaterial = work.find((w) => w.kind === 'material')
  const lastM = lastMaterial ? MATERIALS.find((m) => m.id === lastMaterial.ref) : undefined

  return (
    <main className="page">
      <header style={{ marginBottom: 24 }}>
        <h1 className="hello">
          {greeting()}
          {name ? `, ${name}` : ''}.
        </h1>
        <p className="subtitle">What would you like to work on?</p>
      </header>

      {(plan.length > 0 || lastM) && (
        <section className="grid grid-2" style={{ marginBottom: 24 }}>
          {plan.length > 0 && (
            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 8 }}>Planned together</div>
              <ul style={{ paddingLeft: '1.1em', display: 'grid', gap: 6, fontSize: 17 }}>
                {plan.slice(0, 4).map((p) => (
                  <li key={p.id}>{p.title}</li>
                ))}
              </ul>
            </div>
          )}
          {lastM && (
            <Link to={`/learn/materials/${lastM.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 34 }}>{lastM.glyph}</span>
              <div>
                <div className="eyebrow">Continue</div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{lastM.name}</div>
              </div>
            </Link>
          )}
        </section>
      )}

      <div className="big-tiles">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="tile big-tile" style={{ ['--c' as string]: t.c, ['--c2' as string]: t.c2 }}>
            <span className="glyph">{t.glyph}</span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
