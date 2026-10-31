import { Link } from 'react-router-dom'
import sets from '../../data/wordproblems.json'
import type { WordProblemSet } from '../../data/types'
import { useStore } from '../../app/store'
import './learn.css'

const SETS = sets as WordProblemSet[]

export default function Problems() {
  const work = useStore((s) => s.work)
  const doneCount = (id: string) => work.filter((w) => w.kind === 'problem' && w.ref.startsWith(id + '#')).length
  const topics = Array.from(new Set(SETS.map((s) => s.topic)))
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Word problems</div>
          <h1 className="title">Story problems</h1>
          <p className="subtitle">Pick a set. Each has {SETS[0]?.problems.length ?? 15} or so problems to solve, one at a time, with the materials if you like.</p>
        </div>
      </div>
      {topics.map((t) => (
        <section key={t} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>{t}</h2>
          <div className="grid grid-3">
            {SETS.filter((s) => s.topic === t).map((s) => {
              const done = doneCount(s.id)
              return (
                <Link key={s.id} to={`/learn/problems/${s.id}`} className="tile" style={{ minHeight: 110 }}>
                  <h3 style={{ fontSize: 18 }}>{s.name}</h3>
                  <p>
                    {s.problems.length} problems · {s.steps === 1 ? 'one step' : 'two steps'}
                    {done > 0 && <> · <strong>{done} done</strong></>}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
