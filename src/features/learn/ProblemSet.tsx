import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import sets from '../../data/wordproblems.json'
import type { WordProblemSet } from '../../data/types'
import { useStore } from '../../app/store'
import { Toaster, toast } from '../../components/ui'
import { TaskBanner, useTask } from './useTask'
import { DemoOverlay, bySelector, useDemo, type DemoStep } from './demo'
import './learn.css'

const SETS = sets as WordProblemSet[]

const STEPS = [
  'Read the problem slowly. Underline what you are told.',
  'Write the important numbers down. Draw or sketch what you know.',
  'Read the question again and write it down.',
  'Decide: one step or more? Which operation comes first?',
  'Solve it, with the materials if it helps.',
  'Read the problem once more. Does your answer make sense?',
]

function materialFor(topic: string, name: string): { id: string; label: string } | null {
  const t = `${topic} ${name}`.toLowerCase()
  if (/fraction/.test(t)) return { id: 'fractions', label: 'Fraction circles' }
  if (/multiplication|lcm|gcf|multiple/.test(t)) return { id: 'bead-bars', label: 'Bead bars' }
  if (/passage|decimal|metric|percent|area|perimeter|volume|time|distance|statistic|signed/.test(t)) return { id: 'stamp-game', label: 'Stamp game' }
  return { id: 'golden-beads', label: 'Golden beads' }
}

function operationHint(topic: string, name: string): string {
  const t = `${topic} ${name}`.toLowerCase()
  if (/addition/.test(t)) return 'The words “more”, “in total” and “altogether” usually mean adding.'
  if (/subtraction/.test(t)) return 'Words like “left”, “fewer” and “how many more” usually mean taking away.'
  if (/multiplication/.test(t)) return 'The same amount taken several times means multiplying.'
  if (/division/.test(t)) return 'Sharing equally or “each” means dividing.'
  if (/fraction/.test(t)) return 'Think about the fraction circles: parts of one whole.'
  return 'Think about which operation the question is asking for.'
}

/** Highlight numbers or the question sentence inside a problem. */
function Highlighted({ text, mode }: { text: string; mode: 'none' | 'numbers' | 'question' }): ReactNode {
  if (mode === 'numbers') {
    const parts = text.split(/(\d[\d,./:]*\d|\d)/g)
    return <>{parts.map((p, i) => (/^\d/.test(p) ? <mark key={i} className="demo-hl">{p}</mark> : <span key={i}>{p}</span>))}</>
  }
  if (mode === 'question') {
    const sentences = text.split(/(?<=[.?!])\s+/)
    return <>{sentences.map((s, i) => (s.trim().endsWith('?') ? <mark key={i} className="demo-hl">{s} </mark> : <span key={i}>{s} </span>))}</>
  }
  return <>{text}</>
}

export default function ProblemSet() {
  const { setId } = useParams()
  const set = SETS.find((s) => s.id === setId)
  const work = useStore((s) => s.work)
  const logWork = useStore((s) => s.logWork)
  const name = useStore((s) => s.settings.childName)
  const [i, setI] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  const [scratch, setScratch] = useState<Record<number, string>>({})
  const [hl, setHl] = useState<'none' | 'numbers' | 'question'>('none')
  const demo = useDemo()
  const tk = useTask('problems')
  const doneInSet = set ? work.filter((w) => w.kind === 'problem' && w.ref.startsWith(set.id + '#')).length : 0
  const taskMet = !!tk.spec && doneInSet >= tk.spec.count
  useEffect(() => {
    if (taskMet && tk.active && !tk.done) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done])

  if (!set)
    return (
      <main className="page">
        <p>That set was not found.</p>
        <Link to="/learn/problems" className="btn btn-ghost">All problems</Link>
      </main>
    )
  const p = set.problems[i]
  const doneRefs = new Set(work.filter((w) => w.kind === 'problem').map((w) => w.ref))
  const isDone = doneRefs.has(`${set.id}#${p.n}`)
  const mat = materialFor(set.topic, set.name)

  const buildDemo = (): DemoStep[] => [
    { caption: 'Here is how to work on a story problem. First, read it slowly, all the way through.', target: bySelector('.problem-text'), run: () => { setHl('none'); setShowSteps(true) }, wait: 2600 },
    { caption: 'Find the numbers. These are what you are told.', target: bySelector('.problem-text'), run: () => setHl('numbers'), wait: 2400 },
    { caption: 'Now find the question. This is what you must work out.', target: bySelector('.problem-text'), run: () => setHl('question'), wait: 2400 },
    { caption: operationHint(set.topic, set.name), run: () => setHl('none'), wait: 2600 },
    { caption: `Work it out with the ${mat?.label ?? 'materials'} if it helps. The link is on the right.`, target: bySelector('.ws-side a.card'), wait: 2200 },
    { caption: 'Write your numbers and your answer here.', target: bySelector('.scratch'), wait: 1800 },
    { caption: 'Read the problem once more. Does the answer make sense? Then tap Done.', target: bySelector('.btn-done'), wait: 2400 },
    { caption: 'Your turn.', run: () => setHl('none'), wait: 800 },
  ]

  return (
    <main className="page">
      <Toaster />
      <div className="row" style={{ marginBottom: 14 }}>
        <Link to="/learn/problems" className="btn btn-ghost btn-sm">← All problems</Link>
        <span className="chip">{set.topic}</span>
        <span className="muted small">{set.name}</span>
        <span className="sp" style={{ flex: 1 }} />
        <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} compact />
      </div>
      <TaskBanner t={tk} />
      {tk.spec && !tk.done && (
        <p className="muted small" style={{ marginBottom: 10 }}>
          {Math.min(doneInSet, tk.spec.count)} of {tk.spec.count} problems done for this task.
        </p>
      )}
      <div className="ws">
        <div className="stack">
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Problem {p.n} of {set.problems.length} {isDone && '· done ✓'}
            </div>
            <p className="problem-text">
              <Highlighted text={p.text} mode={hl} />
            </p>
          </div>
          <div className="card">
            <h3 className="eyebrow" style={{ marginBottom: 8 }}>My working</h3>
            <textarea className="textarea scratch" placeholder="Write your numbers and your answer here…" value={scratch[i] ?? ''} onChange={(e) => setScratch((s) => ({ ...s, [i]: e.target.value }))} />
          </div>
          <div className="row between">
            <button className="btn btn-ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>← Previous</button>
            <button
              className={`btn btn-done ${isDone ? 'btn-ghost' : ''}`}
              onClick={() => {
                if (!isDone) {
                  logWork({ kind: 'problem', ref: `${set.id}#${p.n}`, label: `${set.name} · problem ${p.n}`, detail: scratch[i]?.trim() ? `Answer: ${scratch[i].trim().slice(0, 80)}` : undefined })
                  toast(name ? `Well done, ${name}` : 'Noted as done')
                }
                if (i < set.problems.length - 1) setI(i + 1)
              }}
            >
              {isDone ? 'Next →' : i < set.problems.length - 1 ? 'Done, next →' : 'Done ✓'}
            </button>
          </div>
        </div>
        <aside className="ws-side">
          {mat && (
            <Link to={`/learn/materials/${mat.id}`} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>🧺</span>
              <div>
                <div className="eyebrow">Work it out with</div>
                <div style={{ fontWeight: 900 }}>{mat.label}</div>
              </div>
            </Link>
          )}
          <div className="card">
            <button className="row between" style={{ width: '100%' }} onClick={() => setShowSteps((s) => !s)} aria-expanded={showSteps}>
              <h3 style={{ margin: 0 }}>How to solve any problem</h3>
              <span>{showSteps ? '▾' : '▸'}</span>
            </button>
            {showSteps && (
              <ol className="steps-list" style={{ marginTop: 12 }}>
                {STEPS.map((s, k) => (
                  <li key={k}>{s}</li>
                ))}
              </ol>
            )}
          </div>
          <div className="card">
            <h3>Jump to</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {set.problems.map((q, k) => (
                <button key={q.n} className={`chip ${k === i ? 'st-presented status-chip' : ''} ${doneRefs.has(`${set.id}#${q.n}`) ? 'st-mastered status-chip' : ''}`} style={{ minWidth: 40, minHeight: 36, justifyContent: 'center' }} onClick={() => setI(k)}>
                  {q.n}
                </button>
              ))}
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>There is no answer key in the album sets: check the answer together.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
