import { useState } from 'react'
import experiments from '../../data/experiments.json'
import type { Experiment } from '../../data/types'
import { useStore } from '../../app/store'
import './learn.css'

const EXPS = (experiments as Experiment[]).filter((e, i, a) => a.findIndex((x) => x.title === e.title) === i)

export default function Experiments() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Science</div>
          <h1 className="title">Experiments</h1>
          <p className="subtitle">Simple experiments with things from around the house. Try first, then read why it happened.</p>
        </div>
      </div>
      <div className="grid grid-2">
        {EXPS.map((e) => (
          <ExperimentCard key={e.number} exp={e} open={open === e.number} onToggle={() => setOpen(open === e.number ? null : e.number)} />
        ))}
      </div>
    </main>
  )
}

function ExperimentCard({ exp, open, onToggle }: { exp: Experiment; open: boolean; onToggle: () => void }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [reveal, setReveal] = useState(false)
  const logWork = useStore((s) => s.logWork)
  return (
    <article className="card exp-card">
      <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={onToggle} aria-expanded={open}>
        <span className="num">{exp.number}</span>
        <h3 style={{ fontSize: 20, flex: 1 }}>{exp.title}</h3>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>You will need</div>
            <div className="check-list">
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
            {exp.procedure.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: 6 }}>{line}</p>
            ))}
          </div>
          {!reveal ? (
            <button
              className="btn btn-soft"
              onClick={() => {
                setReveal(true)
                logWork({ kind: 'experiment', ref: String(exp.number), label: `Experiment: ${exp.title}` })
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
