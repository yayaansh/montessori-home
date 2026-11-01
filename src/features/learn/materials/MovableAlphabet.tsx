import { useEffect, useMemo, useState } from 'react'
import { Mat, useMat, type Piece } from './Mat'
import { useStore } from '../../../app/store'
import { useWorkLogger } from '../useWorkLogger'
import { TaskBanner, useTask } from '../useTask'
import { DemoOverlay, byLabel, bySelector, useDemo, type DemoStep } from '../demo'

const CELL = 46
const ROW = 60
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

const WORDS = [
  'cat', 'dog', 'sun', 'map', 'pin', 'mop', 'cup', 'hen', 'bed', 'fox',
  'ship', 'frog', 'drum', 'nest', 'milk', 'hand', 'jump', 'swim', 'tree', 'moon',
  'green', 'bread', 'cloud', 'plant', 'stone', 'river', 'garden', 'flower', 'window', 'basket',
]

export default function MovableAlphabet() {
  const mat = useMat<string>()
  const cursive = useStore((s) => s.settings.cursive)
  const setSettings = useStore((s) => s.setSettings)
  const [cursor, setCursor] = useState({ col: 0, row: 0 })
  const [prompt, setPrompt] = useState('')
  const [wordIdx, setWordIdx] = useState<number | null>(null)
  const [hidePrompt, setHidePrompt] = useState(false)
  const log = useWorkLogger('material', 'movable-alphabet', 'Movable alphabet')

  const tk = useTask('movable-alphabet')
  const list = tk.spec?.words
  const [wi, setWi] = useState(0)
  const [justRight, setJustRight] = useState(false)
  const demo = useDemo()

  const clearMat = () => {
    mat.clear()
    setCursor({ col: 0, row: 0 })
  }

  const buildDemo = (): DemoStep[] => {
    const word = list ? list[Math.min(wi, list.length - 1)] : wordIdx !== null ? WORDS[wordIdx] : prompt.trim() || 'cat'
    const steps: DemoStep[] = [{ caption: `Watch first. We will write “${word}”. Say it slowly: ${word.split('').join(' · ')}.`, run: clearMat, wait: 1800 }]
    word.split('').forEach((ch, i) => {
      if (ch === ' ') {
        steps.push({ caption: 'A space between the words.', target: byLabel('Space'), run: () => setCursor({ col: i + 1, row: 0 }), wait: 600 })
        return
      }
      steps.push({
        caption: `“${ch}”${VOWELS.has(ch) ? ' is a vowel, it is blue.' : ' is a consonant, it is red.'}`,
        target: byLabel(`Letter ${ch}`),
        run: () => {
          mat.add('letter', ch, { x: 20 + i * CELL, y: 20 })
          setCursor({ col: i + 1, row: 0 })
        },
        wait: 750,
      })
    })
    steps.push({ caption: `${word}! Now clear the mat and write it yourself.`, target: bySelector('.ws-side .card'), wait: 2000 })
    steps.push({ caption: '', run: clearMat, wait: 10 })
    return steps
  }

  const place = (ch: string) => {
    const x = 20 + cursor.col * CELL
    const y = 20 + cursor.row * ROW
    if (ch !== ' ') mat.add('letter', ch, { x, y })
    const next = cursor.col + 1
    if (next * CELL > 760) setCursor({ col: 0, row: cursor.row + 1 })
    else setCursor({ col: next, row: cursor.row })
    log.touch()
  }
  const newLine = () => setCursor({ col: 0, row: cursor.row + 1 })
  const backspace = () => {
    const last = mat.pieces[mat.pieces.length - 1]
    if (!last) return
    mat.remove(last.id)
    setCursor({ col: Math.round((last.x - 20) / CELL), row: Math.round((last.y - 20) / ROW) })
  }

  // read what is written, row by row, left to right
  const written = useMemo(() => {
    const rows = new Map<number, Piece<string>[]>()
    for (const p of mat.pieces) {
      const r = Math.round((p.y - 20) / ROW)
      if (!rows.has(r)) rows.set(r, [])
      rows.get(r)!.push(p)
    }
    return Array.from(rows.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, ps]) => {
        const sorted = ps.sort((a, b) => a.x - b.x)
        let s = ''
        let prevCol = -1
        for (const p of sorted) {
          const col = Math.round((p.x - 20) / CELL)
          if (prevCol >= 0 && col - prevCol > 1) s += ' '
          s += p.data
          prevCol = col
        }
        return s
      })
      .join(' / ')
  }, [mat.pieces])

  const normalized = written.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  const target = list ? list[Math.min(wi, list.length - 1)] : null

  useEffect(() => {
    if (!list || !target || tk.done || demo.playing) return
    if (normalized !== target) return
    setJustRight(true)
    if (wi + 1 < list.length) {
      const id = window.setTimeout(() => {
        clearMat()
        setWi(wi + 1)
        setJustRight(false)
      }, 1100)
      return () => window.clearTimeout(id)
    }
    tk.complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, target, wi, list, demo.playing])

  const promptText = target ?? (wordIdx !== null ? WORDS[wordIdx] : prompt.trim())

  return (
    <div className={`ws ${cursive ? 'cursive' : ''}`}>
      <div>
        <TaskBanner t={tk} />
        {promptText && !hidePrompt && (
          <div className="card" style={{ marginBottom: 12, textAlign: 'center', fontSize: 34, fontWeight: 700, letterSpacing: '0.06em', borderColor: justRight ? 'var(--sage)' : undefined }}>
            {promptText}
            {list && !tk.done && (
              <div className="muted small" style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0 }}>
                Word {Math.min(wi + 1, list.length)} of {list.length}
                {justRight ? ' · ✓' : ''}
              </div>
            )}
          </div>
        )}
        <Mat
          pieces={mat.pieces}
          onMove={mat.move}
          onRaise={mat.raise}
          onRemove={mat.remove}
          snap={CELL / 2}
          render={(p) => <span className={`letter ${VOWELS.has(p.data) ? 'v' : 'c'}`}>{p.data}</span>}
          sizeOf={() => ({ w: 44, h: 54 })}
          hint="Tap the letters below to write on the mat. Drag a letter to move it."
        >
          <div
            aria-hidden
            style={{ position: 'absolute', left: 20 + cursor.col * CELL, top: 20 + cursor.row * ROW, width: 44, height: 54, borderRadius: 8, border: '2px dashed rgba(0,0,0,0.25)', pointerEvents: 'none' }}
          />
        </Mat>
        <div className="alpha-grid" style={{ marginTop: 12 }}>
          {LETTERS.map((l) => (
            <button key={l} className={VOWELS.has(l) ? 'v' : 'c'} onClick={() => place(l)} aria-label={`Letter ${l}`} style={cursive ? { fontFamily: 'var(--font-hand)', fontSize: 30 } : undefined}>
              {l}
            </button>
          ))}
          <button onClick={() => place(' ')} aria-label="Space" style={{ gridColumn: 'span 2', fontSize: 15 }}>space</button>
          <button onClick={newLine} aria-label="New line" style={{ fontSize: 15 }}>↵</button>
          <button onClick={backspace} aria-label="Remove last letter" style={{ fontSize: 18 }}>⌫</button>
          <button onClick={() => { clearMat(); log.touch() }} aria-label="Clear" style={{ fontSize: 15 }}>clear</button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <DemoOverlay demo={demo} onStart={() => demo.play(buildDemo())} />
        </div>
      </div>
      <aside className="ws-side">
        <div className="card">
          <h3>You wrote</h3>
          <div style={{ fontSize: 26, fontWeight: 700, minHeight: 36, wordBreak: 'break-word' }}>
            {written || <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}>Nothing yet</span>}
          </div>
        </div>
        <div className="card">
          <h3>A word to build</h3>
          {list ? (
            <p className="small muted">Your task gives you the words, one at a time. When a word is right, the next one appears.</p>
          ) : (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => { setWordIdx(Math.floor(Math.random() * WORDS.length)); setPrompt('') }}>Pick a word</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setWordIdx(null); setPrompt('') }}>None</button>
              </div>
              <input className="input" placeholder="Or type a word or sentence…" value={prompt} onChange={(e) => { setPrompt(e.target.value); setWordIdx(null) }} aria-label="Word to build" />
            </>
          )}
          <label className="row between" style={{ marginTop: 10 }}>
            <span className="small">Hide it (dictation)</span>
            <input type="checkbox" checked={hidePrompt} onChange={(e) => setHidePrompt(e.target.checked)} style={{ width: 22, height: 22 }} />
          </label>
          <label className="row between" style={{ marginTop: 6 }}>
            <span className="small">Cursive letters</span>
            <input type="checkbox" checked={cursive} onChange={(e) => setSettings({ cursive: e.target.checked })} style={{ width: 22, height: 22 }} />
          </label>
        </div>
        <div className="card">
          <h3>Colours</h3>
          <p className="small"><span style={{ color: '#3f6fb5', fontWeight: 900 }}>Blue</span> letters are vowels: a e i o u. <span style={{ color: '#c0392b', fontWeight: 900 }}>Red</span> letters are consonants.</p>
        </div>
      </aside>
    </div>
  )
}
