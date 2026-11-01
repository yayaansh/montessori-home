import { useEffect, useMemo, useState } from 'react'
import dictionary from '../../data/dictionary.json'
import type { DictionaryEntry } from '../../data/types'
import { useWorkLogger } from './useWorkLogger'
import { TaskBanner, useTask } from './useTask'
import './learn.css'

const ENTRIES = dictionary as DictionaryEntry[]

const TOPICS: { id: string; name: string; test: (w: string) => boolean }[] = [
  { id: 'all', name: 'All words', test: () => true },
  {
    id: 'geometry',
    name: 'Geometry',
    test: (w) =>
      /acute|obtuse|angle|circle|circumcenter|centroid|barycenter|orthocenter|cone|cube|curve|cylinder|diagonal|ellips|equilateral|equivalent|hypotenuse|isosceles|line|oblique|oval|ovoid|parallel|pentagon|perimeter|perpendicular|point|polygon|prism|pyramid|quadrilateral|rectangle|reflex|rhombus|scalene|segment|solid|sphere|square|straight|surface|trapez|vertex|vertical|convex|concave|geometry|convergent|divergent|horizon|elastic|rigid|plastic|fluid|viscous|gravity|attraction/i.test(w),
  },
  {
    id: 'biology',
    name: 'Plants & animals',
    test: (w) =>
      /aciculate|amphibian|androecium|anurans|anseriformes|anther|arthropod|capsule|carnivor|cetacean|chelonian|chiropter|ciconii|colenterate|coleopter|columbi|corrola|crustace|dipnoan|dipteran|edentate|equinoderm|falconi|filament|galli|ganoid|gynoecium|hastate|hemipter|hymenopter|insect|lepidopter|marsupial|monotreme|myriapod|node|odonate|orbiculate|orthoptera|passeri|peltate|petiole|pici|pinniped|pollen|poriferan|primates|protozoa|rhynchota|rodent|sagittate|saurian|selachian|serrate|sirenion|struthian|style|teleost|ungulate|urodelan|vertebrate|insectivore/i.test(w),
  },
  { id: 'history', name: 'Eras & time', test: (w) => /cambrian|carboniferous|cenozoic|cretaceous|devonian|jurassic|neozoic|ordovician|paleozoic|permian|silurian|triassic/i.test(w) },
  { id: 'geography', name: 'Geography', test: (w) => /africa|america|antarctic|arctic|asia|australia|europe|island|isthmus|peninsula|geography/i.test(w) },
  { id: 'language', name: 'Language', test: (w) => /adjective|consonant|noun|verb|vowel|tone|tetrachord/i.test(w) },
  { id: 'maths', name: 'Numbers', test: (w) => /denominator|numerator|fraction|equivalent|square|cube/i.test(w) },
]

function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export default function Words() {
  const tk = useTask('words')
  const [topic, setTopic] = useState(tk.spec?.topic ?? 'all')
  const [order, setOrder] = useState<number[] | null>(null)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seen, setSeen] = useState<Set<number>>(() => new Set())
  const log = useWorkLogger('words', 'dictionary', 'Word origins')

  const deck = useMemo(() => {
    const t = TOPICS.find((x) => x.id === topic)!
    const idx = ENTRIES.map((e, k) => (t.test(e.word) ? k : -1)).filter((k) => k >= 0)
    return order ? order.filter((k) => idx.includes(k)) : idx
  }, [topic, order])

  const entryIndex = deck.length ? deck[Math.min(i, deck.length - 1)] : -1
  const entry = entryIndex >= 0 ? ENTRIES[entryIndex] : null
  const go = (d: number) => {
    setFlipped(false)
    setI((x) => (x + d + deck.length) % deck.length)
  }
  const flip = () => {
    if (!flipped && entry) {
      setSeen((s) => new Set(s).add(entryIndex))
      log.touch(`Looked at ${entry.word}`)
    }
    setFlipped((f) => !f)
  }

  const taskMet = !!tk.spec && seen.size >= Math.min(tk.spec.count, Math.max(deck.length, 1))
  useEffect(() => {
    if (taskMet && tk.active && !tk.done) tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMet, tk.active, tk.done])

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Etymology</div>
          <h1 className="title">Where words come from</h1>
          <p className="subtitle">Tap the card to turn it over.</p>
        </div>
      </div>
      <TaskBanner t={tk} />
      {tk.spec && !tk.done && (
        <p className="muted small" style={{ marginBottom: 10 }}>
          {seen.size} of {Math.min(tk.spec.count, Math.max(deck.length, 1))} cards turned over.
        </p>
      )}
      <div className="seg" style={{ marginBottom: 20 }}>
        {TOPICS.map((t) => (
          <button key={t.id} className={topic === t.id ? 'on' : ''} onClick={() => { setTopic(t.id); setI(0); setFlipped(false) }}>
            {t.name}
          </button>
        ))}
      </div>
      {entry ? (
        <div className="flash">
          <div className={`flash-card ${flipped ? 'flipped' : ''}`} onClick={flip} role="button" tabIndex={0} onKeyDown={(e) => e.key === ' ' && flip()} aria-label={`Card: ${entry.word}`}>
            <div className="flash-face flash-front">
              <div>
                <div className="flash-lang">{deck.length ? `${(i % deck.length) + 1} of ${deck.length}` : ''}{seen.has(entryIndex) ? ' · seen' : ''}</div>
                <div className="flash-word">{entry.word}</div>
                <div className="muted" style={{ marginTop: 14 }}>Where does it come from?</div>
              </div>
            </div>
            <div className="flash-face flash-back">
              <div className="stack" style={{ gap: 10 }}>
                <div className="flash-lang">{entry.language ? `From ${entry.language}` : 'Origin'}</div>
                {entry.root && <div className="flash-root">{entry.root}</div>}
                <div className="flash-meaning">“{entry.meaning}”</div>
                <div className="muted small" style={{ marginTop: 6 }}>{entry.word}</div>
              </div>
            </div>
          </div>
          <div className="flash-nav">
            <button className="btn btn-ghost" onClick={() => go(-1)}>← Back</button>
            <button className="btn btn-ghost" onClick={() => { setOrder(shuffle(ENTRIES.map((_, k) => k))); setI(0); setFlipped(false) }}>Shuffle</button>
            <button className="btn" onClick={() => go(1)}>Next →</button>
          </div>
        </div>
      ) : (
        <p className="muted">No words in this set.</p>
      )}
    </main>
  )
}
