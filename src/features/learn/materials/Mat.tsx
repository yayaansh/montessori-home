import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export interface Piece<T = unknown> {
  id: string
  kind: string
  x: number
  y: number
  z: number
  data: T
}

let seq = 1
export const newId = () => `p${seq++}`

export function useMat<T = unknown>() {
  const [pieces, setPieces] = useState<Piece<T>[]>([])
  const zRef = useRef(1)
  const spawn = useRef(0)

  const add = useCallback((kind: string, data: T, at?: { x: number; y: number }, size?: { w: number; h: number }) => {
    const id = newId()
    const n = spawn.current++
    const pos = at ?? { x: 24 + (n % 6) * 36, y: 24 + ((Math.floor(n / 6) % 5) * 40) }
    setPieces((ps) => [...ps, { id, kind, data, x: pos.x, y: pos.y, z: zRef.current++ }])
    void size
    return id
  }, [])

  const move = useCallback((id: string, x: number, y: number) => {
    setPieces((ps) => ps.map((p) => (p.id === id ? { ...p, x, y } : p)))
  }, [])

  const update = useCallback((id: string, fn: (p: Piece<T>) => Piece<T>) => {
    setPieces((ps) => ps.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const raise = useCallback((id: string) => {
    setPieces((ps) => ps.map((p) => (p.id === id ? { ...p, z: zRef.current++ } : p)))
  }, [])

  const remove = useCallback((id: string) => setPieces((ps) => ps.filter((p) => p.id !== id)), [])
  const removeMany = useCallback((ids: string[]) => setPieces((ps) => ps.filter((p) => !ids.includes(p.id))), [])
  const clear = useCallback(() => {
    setPieces([])
    spawn.current = 0
  }, [])

  return { pieces, setPieces, add, move, update, raise, remove, removeMany, clear }
}

interface MatProps<T> {
  pieces: Piece<T>[]
  onMove: (id: string, x: number, y: number) => void
  onDrop?: (id: string, x: number, y: number) => void
  onRaise: (id: string) => void
  onRemove: (id: string) => void
  render: (p: Piece<T>) => ReactNode
  sizeOf: (p: Piece<T>) => { w: number; h: number }
  snap?: number
  className?: string
  children?: ReactNode
  hint?: string
}

export function Mat<T>({ pieces, onMove, onDrop, onRaise, onRemove, render, sizeOf, snap, className, children, hint }: MatProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean; startX: number; startY: number } | null>(null)

  const clamp = (p: Piece<T>, x: number, y: number) => {
    const el = ref.current
    if (!el) return { x, y }
    const { w, h } = sizeOf(p)
    const W = el.clientWidth
    const H = el.clientHeight
    return { x: Math.max(-w * 0.3, Math.min(W - w * 0.7, x)), y: Math.max(-h * 0.3, Math.min(H - h * 0.7, y)) }
  }

  // keep newly placed pieces inside the mat on narrow screens
  useEffect(() => {
    for (const p of pieces) {
      const c = clamp(p, p.x, p.y)
      if (c.x !== p.x || c.y !== p.y) onMove(p.id, c.x, c.y)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces.length])

  const onPointerDown = (e: React.PointerEvent, p: Piece<T>) => {
    if ((e.target as HTMLElement).closest('.rm')) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    drag.current = { id: p.id, dx: e.clientX - rect.left - p.x, dy: e.clientY - rect.top - p.y, moved: false, startX: e.clientX, startY: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onRaise(p.id)
    setDragging(p.id)
  }
  const onPointerMove = (e: React.PointerEvent, p: Piece<T>) => {
    const d = drag.current
    if (!d || d.id !== p.id) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 4) d.moved = true
    const { x, y } = clamp(p, e.clientX - rect.left - d.dx, e.clientY - rect.top - d.dy)
    onMove(p.id, x, y)
  }
  const onPointerUp = (e: React.PointerEvent, p: Piece<T>) => {
    const d = drag.current
    if (!d || d.id !== p.id) return
    drag.current = null
    setDragging(null)
    if (!d.moved) {
      setSelected((s) => (s === p.id ? null : p.id))
      return
    }
    setSelected(null)
    let { x, y } = p
    if (snap) {
      x = Math.round(x / snap) * snap
      y = Math.round(y / snap) * snap
      const c = clamp(p, x, y)
      x = c.x
      y = c.y
      onMove(p.id, x, y)
    }
    onDrop?.(p.id, x, y)
    void e
  }

  return (
    <div ref={ref} className={`mat ${className ?? ''}`} onPointerDown={(e) => e.target === ref.current && setSelected(null)}>
      {pieces.map((p) => {
        const style: CSSProperties = { transform: `translate(${p.x}px, ${p.y}px)`, zIndex: p.z, left: 0, top: 0 }
        return (
          <div
            key={p.id}
            className={`piece ${dragging === p.id ? 'dragging' : ''} ${selected === p.id ? 'selected' : ''}`}
            style={style}
            onPointerDown={(e) => onPointerDown(e, p)}
            onPointerMove={(e) => onPointerMove(e, p)}
            onPointerUp={(e) => onPointerUp(e, p)}
            onPointerCancel={() => {
              drag.current = null
              setDragging(null)
            }}
          >
            {render(p)}
            {selected === p.id && (
              <button
                className="rm"
                aria-label="Put back"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onRemove(p.id)
                  setSelected(null)
                }}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      {children}
      {hint && pieces.length === 0 && <div className="mat-hint">{hint}</div>}
    </div>
  )
}

export function Palette({ children }: { children: ReactNode }) {
  return <div className="palette">{children}</div>
}
