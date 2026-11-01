import { useEffect, useMemo, useState } from 'react'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'

type Pos = 'noun' | 'article' | 'adjective' | 'verb' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection'

const POS: { id: Pos; name: string }[] = [
  { id: 'noun', name: 'Noun' },
  { id: 'article', name: 'Article' },
  { id: 'adjective', name: 'Adjective' },
  { id: 'verb', name: 'Verb' },
  { id: 'adverb', name: 'Adverb' },
  { id: 'pronoun', name: 'Pronoun' },
  { id: 'preposition', name: 'Preposition' },
  { id: 'conjunction', name: 'Conjunction' },
  { id: 'interjection', name: 'Interjection' },
]

export function Symbol({ pos, size = 44 }: { pos: Pos; size?: number }) {
  const s = size
  switch (pos) {
    case 'noun':
      return <svg width={s} height={s} viewBox="0 0 44 44"><polygon points="22,4 42,40 2,40" fill="#1a1a1a" /></svg>
    case 'article':
      return <svg width={s} height={s} viewBox="0 0 44 44"><polygon points="22,22 32,40 12,40" fill="#7cc4e8" /></svg>
    case 'adjective':
      return <svg width={s} height={s} viewBox="0 0 44 44"><polygon points="22,12 37,40 7,40" fill="#1f4fa0" /></svg>
    case 'pronoun':
      return <svg width={s} height={s} viewBox="0 0 44 44"><polygon points="22,2 32,40 12,40" fill="#7b3fa0" /></svg>
    case 'verb':
      return <svg width={s} height={s} viewBox="0 0 44 44"><circle cx="22" cy="24" r="17" fill="#d6332b" /></svg>
    case 'adverb':
      return <svg width={s} height={s} viewBox="0 0 44 44"><circle cx="22" cy="26" r="11" fill="#f0892b" /></svg>
    case 'preposition':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44">
          <path d="M 30 8 A 17 17 0 1 0 30 40 A 13 13 0 1 1 30 8 Z" fill="#3a9d4a" />
        </svg>
      )
    case 'conjunction':
      return <svg width={s} height={s} viewBox="0 0 44 44"><rect x="4" y="19" width="36" height="9" rx="2" fill="#e88aa8" /></svg>
    case 'interjection':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44">
          <circle cx="22" cy="14" r="9" fill="#d9a93c" />
          <polygon points="22,18 31,40 13,40" fill="#d9a93c" />
        </svg>
      )
  }
}

interface Preset {
  text: string
  key: Pos[]
}

export const PRESETS: Preset[] = [
  { text: 'The cat sleeps.', key: ['article', 'noun', 'verb'] },
  { text: 'A red bird sings.', key: ['article', 'adjective', 'noun', 'verb'] },
  { text: 'The small dog runs quickly.', key: ['article', 'adjective', 'noun', 'verb', 'adverb'] },
  { text: 'She reads a long book.', key: ['pronoun', 'verb', 'article', 'adjective', 'noun'] },
  { text: 'The ball rolled under the table.', key: ['article', 'noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'Tom and Anna play outside.', key: ['noun', 'conjunction', 'noun', 'verb', 'adverb'] },
  { text: 'Wow! The sky is blue.', key: ['interjection', 'article', 'noun', 'verb', 'adjective'] },
  { text: 'We walked slowly to the river.', key: ['pronoun', 'verb', 'adverb', 'preposition', 'article', 'noun'] },
  { text: 'The old tree grows in the garden.', key: ['article', 'adjective', 'noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'Hurray! They won the game.', key: ['interjection', 'pronoun', 'verb', 'article', 'noun'] },
  { text: 'A tiny ant carried a big leaf.', key: ['article', 'adjective', 'noun', 'verb', 'article', 'adjective', 'noun'] },
  { text: 'The moon shines brightly at night.', key: ['article', 'noun', 'verb', 'adverb', 'preposition', 'noun'] },
  { text: 'He laughed and she smiled.', key: ['pronoun', 'verb', 'conjunction', 'pronoun', 'verb'] },
  { text: 'Oh! The soup is very hot.', key: ['interjection', 'article', 'noun', 'verb', 'adverb', 'adjective'] },
  { text: 'Birds fly over the mountains.', key: ['noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'The clever fox hid behind a rock.', key: ['article', 'adjective', 'noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'The sun rises.', key: ['article', 'noun', 'verb'] },
  { text: 'A dog barks loudly.', key: ['article', 'noun', 'verb', 'adverb'] },
  { text: 'The green frog jumps.', key: ['article', 'adjective', 'noun', 'verb'] },
  { text: 'My sister sings sweetly.', key: ['adjective', 'noun', 'verb', 'adverb'] },
  { text: 'The bird flew over the house.', key: ['article', 'noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'Oh! A spider!', key: ['interjection', 'article', 'noun'] },
  { text: 'They swim in the cold lake.', key: ['pronoun', 'verb', 'preposition', 'article', 'adjective', 'noun'] },
  { text: 'Bread and butter taste good.', key: ['noun', 'conjunction', 'noun', 'verb', 'adjective'] },
  { text: 'The baby sleeps quietly in the cot.', key: ['article', 'noun', 'verb', 'adverb', 'preposition', 'article', 'noun'] },
  { text: 'We planted seeds yesterday.', key: ['pronoun', 'verb', 'noun', 'adverb'] },
  { text: 'Hush! The owl is near.', key: ['interjection', 'article', 'noun', 'verb', 'adverb'] },
  { text: 'A tall giraffe eats leaves.', key: ['article', 'adjective', 'noun', 'verb', 'noun'] },
  { text: 'She and I walked home.', key: ['pronoun', 'conjunction', 'pronoun', 'verb', 'adverb'] },
  { text: 'The red kite flies above the trees.', key: ['article', 'adjective', 'noun', 'verb', 'preposition', 'article', 'noun'] },
  { text: 'Ouch! The bee stung my hand.', key: ['interjection', 'article', 'noun', 'verb', 'adjective', 'noun'] },
  { text: 'Rain falls softly on the roof.', key: ['noun', 'verb', 'adverb', 'preposition', 'article', 'noun'] },
  { text: 'The little boat sails slowly.', key: ['article', 'adjective', 'noun', 'verb', 'adverb'] },
  { text: 'He reads and she writes.', key: ['pronoun', 'verb', 'conjunction', 'pronoun', 'verb'] },
  { text: 'A cat sat under the warm lamp.', key: ['article', 'noun', 'verb', 'preposition', 'article', 'adjective', 'noun'] },
  { text: 'Wow! The stars shine brightly.', key: ['interjection', 'article', 'noun', 'verb', 'adverb'] },
]

function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ''))
    .filter(Boolean)
}

export default function GrammarSymbols() {
  const tk = useTask('grammar-symbols')
  const order = useMemo(() => tk.spec?.sentences ?? PRESETS.map((_, i) => i), [tk.spec])
  const [presetIdx, setPresetIdx] = useState(order[0] ?? 0)
  const [custom, setCustom] = useState('')
  const [armed, setArmed] = useState<Pos | null>(null)
  const [placed, setPlaced] = useState<Record<number, Pos>>({})
  const [showKey, setShowKey] = useState(false)
  const [solved, setSolved] = useState<number[]>([])
  const log = useWorkLogger('material', 'grammar-symbols', 'Grammar symbols')

  const text = custom.trim() || PRESETS[presetIdx].text
  const words = useMemo(() => tokenize(text), [text])
  const key = custom.trim() ? null : PRESETS[presetIdx].key
  const pos = Math.max(0, order.indexOf(presetIdx))

  const reset = () => {
    setPlaced({})
    setArmed(null)
  }
  const go = (d: number) => {
    setPresetIdx(order[(pos + d + order.length) % order.length])
    setCustom('')
    reset()
  }
  const place = (i: number) => {
    if (armed) {
      setPlaced((p) => ({ ...p, [i]: armed }))
      log.touch(`Marked “${text}” with grammar symbols`)
    } else if (placed[i]) {
      setPlaced((p) => {
        const n = { ...p }
        delete n[i]
        return n
      })
    }
  }
  const allPlaced = words.length > 0 && words.every((_, i) => placed[i])
  const allRight = !!key && allPlaced && words.every((_, i) => placed[i] === key[i])

  useEffect(() => {
    if (allRight && !custom.trim()) setSolved((s) => (s.includes(presetIdx) ? s : [...s, presetIdx]))
  }, [allRight, presetIdx, custom])
  const taskMet = !!tk.spec && tk.spec.sentences.every((i) => solved.includes(i))
  useEffect(() => {
    if (taskMet && tk.active && !tk.done) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done])

  return (
    <div className="ws">
      <div>
        <TaskBanner t={tk} />
        <div className="mat" style={{ height: 'auto', minHeight: 220 }}>
          <div className="sentence">
            {words.map((w, i) => (
              <div key={i} className="word">
                <button className={`slot ${placed[i] ? '' : 'empty'}`} onClick={() => place(i)} aria-label={placed[i] ? `Remove symbol from ${w}` : `Place symbol on ${w}`}>
                  {placed[i] && <Symbol pos={placed[i]} size={50} />}
                </button>
                <span className="w">{w}</span>
                {showKey && key && <span className="key"><Symbol pos={key[i]} size={24} /></span>}
              </div>
            ))}
          </div>
          {allRight && <div className="mat-badge ok">All placed ✓</div>}
        </div>
        <div className="palette symbol-palette">
          {POS.map((p) => (
            <button key={p.id} className={armed === p.id ? 'armed' : ''} onClick={() => setArmed((a) => (a === p.id ? null : p.id))} aria-pressed={armed === p.id}>
              <Symbol pos={p.id} size={40} />
              {p.name}
            </button>
          ))}
          <span className="sp" />
          <button onClick={reset}>Clear</button>
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>Tap a symbol to pick it up, then tap the word it belongs to. Tap a placed symbol to take it off.</p>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>Sentence</h3>
          <div className="row" style={{ marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => go(-1)} aria-label="Previous sentence">←</button>
            <span className="small muted">
              {custom.trim() ? 'Your own' : `${pos + 1} of ${order.length}`}
              {tk.spec && !custom.trim() && ` · ${solved.filter((i) => tk.spec!.sentences.includes(i)).length} done`}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => go(1)} aria-label="Next sentence">→</button>
          </div>
          {tk.spec && (
            <div className="row" style={{ gap: 6, marginBottom: 8 }}>
              {order.map((i, k) => (
                <button key={i} className={`chip ${solved.includes(i) ? 'st-mastered status-chip' : i === presetIdx ? 'st-presented status-chip' : ''}`} style={{ minHeight: 34 }} onClick={() => { setPresetIdx(i); setCustom(''); reset() }}>
                  {solved.includes(i) ? '✓ ' : ''}{k + 1}
                </button>
              ))}
            </div>
          )}
          <textarea className="textarea" style={{ minHeight: 70 }} placeholder="Or type your own sentence…" value={custom} onChange={(e) => { setCustom(e.target.value); reset() }} />
          {key && (
            <label className="row between" style={{ marginTop: 10 }}>
              <span className="small">Show the key (for the guide)</span>
              <input type="checkbox" checked={showKey} onChange={(e) => setShowKey(e.target.checked)} style={{ width: 22, height: 22 }} />
            </label>
          )}
        </div>
        <div className="card">
          <h3>The symbols</h3>
          <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
            {POS.map((p) => (
              <div key={p.id} className="row" style={{ gap: 10 }}>
                <Symbol pos={p.id} size={26} /> <strong>{p.name}</strong>
                <span className="muted">{HINT[p.id]}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

const HINT: Record<Pos, string> = {
  noun: 'a name of a thing',
  article: 'the, a, an',
  adjective: 'tells about the noun',
  verb: 'what happens',
  adverb: 'tells about the verb',
  pronoun: 'stands for a noun',
  preposition: 'shows where or how',
  conjunction: 'joins words',
  interjection: 'oh! wow!',
}
