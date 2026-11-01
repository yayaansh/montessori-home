import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A tiny "demo video" engine. A demo is a list of steps; each step moves a hand
 * pointer to a target element, performs an action on the page, and shows a caption.
 */
export interface DemoStep {
  caption: string
  target?: () => HTMLElement | null
  run?: () => void | Promise<void>
  wait?: number
}

interface Pointer {
  x: number
  y: number
  show: boolean
}

export interface Demo {
  playing: boolean
  caption: string
  step: number
  total: number
  pointer: Pointer
  play: (steps: DemoStep[]) => Promise<void>
  stop: () => void
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function useDemo(): Demo {
  const [playing, setPlaying] = useState(false)
  const [caption, setCaption] = useState('')
  const [step, setStep] = useState(0)
  const [total, setTotal] = useState(0)
  const [pointer, setPointer] = useState<Pointer>({ x: 0, y: 0, show: false })
  const cancel = useRef(false)
  const running = useRef(false)

  useEffect(() => () => void (cancel.current = true), [])

  const stop = useCallback(() => {
    cancel.current = true
  }, [])

  const play = useCallback(async (steps: DemoStep[]) => {
    if (running.current) return
    running.current = true
    cancel.current = false
    setPlaying(true)
    setTotal(steps.length)
    try {
      for (let i = 0; i < steps.length; i++) {
        if (cancel.current) break
        const s = steps[i]
        setStep(i + 1)
        setCaption(s.caption)
        const el = s.target?.()
        if (el) {
          el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
          await sleep(120)
          const r = el.getBoundingClientRect()
          setPointer({ x: r.left + r.width / 2, y: r.top + r.height / 2, show: true })
          await sleep(650)
          if (cancel.current) break
          el.classList.add('demo-press')
          setTimeout(() => el.classList.remove('demo-press'), 350)
        }
        await s.run?.()
        await sleep(s.wait ?? 1300)
      }
    } finally {
      running.current = false
      setPlaying(false)
      setPointer((p) => ({ ...p, show: false }))
      setCaption('')
    }
  }, [])

  return { playing, caption, step, total, pointer, play, stop }
}

export function byLabel(label: string) {
  return () => document.querySelector<HTMLElement>(`button[aria-label="${label}"]`)
}
export function bySelector(sel: string) {
  return () => document.querySelector<HTMLElement>(sel)
}

/** The "Show me how" button and, while playing, the caption bar and the hand pointer. */
export function DemoOverlay({ demo, onStart, label = 'Show me how', compact }: { demo: Demo; onStart: () => void; label?: string; compact?: boolean }) {
  return (
    <>
      {!demo.playing && (
        <button className={`btn btn-soft ${compact ? 'btn-sm' : ''} demo-btn`} onClick={onStart}>
          ▶ {label}
        </button>
      )}
      {demo.playing && (
        <>
          <div className="demo-bar" role="status" aria-live="polite">
            <span className="demo-count">{demo.step}/{demo.total}</span>
            <span className="demo-caption">{demo.caption}</span>
            <button className="btn btn-sm" onClick={demo.stop}>Stop</button>
          </div>
          <div className={`demo-hand ${demo.pointer.show ? 'show' : ''}`} style={{ left: demo.pointer.x, top: demo.pointer.y }} aria-hidden>
            👆
          </div>
        </>
      )}
    </>
  )
}

/** Split a number into thousands, hundreds, tens, units. */
export function places(n: number): { thousand: number; hundred: number; ten: number; unit: number } {
  return { thousand: Math.floor(n / 1000), hundred: Math.floor((n % 1000) / 100), ten: Math.floor((n % 100) / 10), unit: n % 10 }
}

export const PLACE_WORD = { thousand: 'thousand', hundred: 'hundred', ten: 'ten', unit: 'unit' } as const

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
