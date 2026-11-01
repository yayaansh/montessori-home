import { useState } from 'react'
import experiments from '../../data/experiments.json'
import type { Experiment } from '../../data/types'
import { useStore } from '../../app/store'
import { TaskBanner, useTask } from './useTask'
import { DemoOverlay, bySelector, useDemo, type DemoStep } from './demo'
import './learn.css'

const EXPS = (experiments as Experiment[]).filter((e, i, a) => a.findIndex((x) => x.title === e.title) === i)

type Hl = { exp: number; part: 'materials' | 'line' | 'none'; index: number }

export default function Experiments() {
  const tk = useTask('experiment')
  const [open, setOpen] = useState<number | null>(tk.spec?.number ?? null)
  const [hl, setHl] = useState<Hl>({ exp: 0, part: 'none', index: 0 })
  const demo = useDemo()
  const ordered = tk.spec ? [...EXPS].sort((a, b) => (a.number === tk.spec!.number ? -1 : b.number === tk.spec!.number ? 1 : 0)) : EXPS

  const buildDemo = (): DemoStep[] => {
    const exp = EXPS.find((e) => e.number === (open ?? tk.spec?.number ?? EXPS[0].number)) ?? EXPS[0]
    const lines = exp.procedure.split('\n').filter(Boolean)
    const steps: DemoStep[] = [
      { caption: `“${exp.title}”. Here is how an experiment goes.`, run: () => { setOpen(exp.number); setHl({ exp: exp.number, part: 'none', index: 0 }) }, wait: 1600 },
      { caption: 'First gather everything you need. Tick each thing when you have it.', target: bySelector(`#exp-${exp.number} .check-list`), run: () => setHl({ exp: exp.number, part: 'materials', index: 0 }), wait: 2400 },
    ]
    lines.forEach((ln, i) => {
      const text = ln.replace(/^\d+\.\s*/, '')
      steps.push({ caption: lines.length > 1 ? `Step ${i + 1}: ${text.slice(0, 110)}${text.length > 110 ? '…' : ''}` : 'Then follow what to do, slowly, and watch closely.', target: bySelector(`#exp-${exp.number} .proc-${i}`), run: () => setHl({ exp: exp.number, part: 'line', index: i }), wait: 2800 })
    })
    steps.push({ caption: 'Try it for real, think about what you saw, and only then tap to find out why.', target: bySelector(`#exp-${exp.number} .btn-reveal`), run: () => setHl({ exp: exp.number, part: 'none', index: 0 }), wait: 2600 })
    steps.push({ caption: 'Your turn.', wait: 600 })
    return steps
  }

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Science</div>
          <h1 className="title">Experiments</h1>
          <p className="subtitle">Simple experiments with things from around the house. Try first, then read why it happened.</p>
        </div>
        <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} />
      </div>
      <TaskBanner t={tk} />
      <div className="grid grid-2">
        {ordered.map((e) => (
          <ExperimentCard
            key={e.number}
            exp={e}
            open={open === e.number}
            hl={hl.exp === e.number ? hl : null}
            onToggle={() => setOpen(open === e.number ? null : e.number)}
            onReveal={() => {
              if (tk.active && tk.spec?.number === e.number) tk.complete()
            }}
          />
        ))}
      </div>
    </main>
  )
}

function ExperimentCard({ exp, open, hl, onToggle, onReveal }: { exp: Experiment; open: boolean; hl: Hl | null; onToggle: () => void; onReveal: () => void }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [reveal, setReveal] = useState(false)
  const logWork = useStore((s) => s.logWork)
  return (
    <article className="card exp-card" id={`exp-${exp.number}`}>
      <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={onToggle} aria-expanded={open}>
        <span className="num">{exp.number}</span>
        <h3 style={{ fontSize: 20, flex: 1 }}>{exp.title}</h3>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>You will need</div>
            <div className={`check-list ${hl?.part === 'materials' ? 'demo-hl' : ''}`}>
              {exp.materials.map((m, i) => (
                <label key={i}>
                  <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))} />
                  <span style={{ textDecoration: checked[i] ? 'line-through' : 'none' }}>{m}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>What to do</div>
            {exp.procedure.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className={`proc-${i} ${hl?.part === 'line' && hl.index === i ? 'demo-hl' : ''}`} style={{ marginBottom: 6 }}>{line}</p>
            ))}
          </div>
          {!reveal ? (
            <button
              className="btn btn-soft btn-reveal"
              onClick={() => {
                setReveal(true)
                logWork({ kind: 'experiment', ref: String(exp.number), label: `Experiment: ${exp.title}` })
                onReveal()
              }}
            >
              What happened, and why?
            </button>
          ) : (
            <div className="reveal">
              <div className="eyebrow" style={{ marginBottom: 6 }}>Why</div>
              {exp.explanation.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: 6 }}>{line}</p>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}
