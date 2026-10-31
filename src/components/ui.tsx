import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AlbumId, Status } from '../data/types'
import { ALBUM_META } from '../data/albums'
import { STATUS_LABEL, STATUS_ORDER } from '../app/store'

export function AreaChip({ album, small }: { album: AlbumId; small?: boolean }) {
  const m = ALBUM_META[album]
  return (
    <span className={`chip area-${album}`} style={{ background: 'var(--a-2)', color: 'var(--ink)', fontSize: small ? 12 : 13 }}>
      <span className="chip-dot" style={{ background: 'var(--a)' }} />
      {m.name}
    </span>
  )
}

export function StatusChip({ status }: { status: Status }) {
  if (status === 'none') return null
  return (
    <span className={`chip status-chip st-${status}`}>
      <span className="chip-dot" />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function StatusControl({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Progress">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          role="radio"
          aria-checked={value === s}
          className={`st-${s} ${value === s ? 'on' : ''}`}
          onClick={() => onChange(s)}
          style={value === s && s !== 'none' ? { background: 'var(--st-2)', color: 'var(--ink)' } : undefined}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ counts, total }: { counts: Record<Status, number>; total: number }) {
  const pct = (n: number) => (total ? `${(100 * n) / total}%` : '0%')
  return (
    <div className="progress" aria-hidden>
      <span className="st-mastered" style={{ width: pct(counts.mastered), background: 'var(--st)' }} />
      <span className="st-practising" style={{ width: pct(counts.practising), background: 'var(--st)' }} />
      <span className="st-presented" style={{ width: pct(counts.presented), background: 'var(--st)' }} />
    </div>
  )
}

export function Breadcrumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="crumb-sep">›</span>}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])
  if (!src) return null
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="Picture">
      <img src={src} alt="" />
      <button className="btn btn-icon lightbox-close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}

let toastListeners: ((msg: string) => void)[] = []
export function toast(msg: string) {
  toastListeners.forEach((l) => l(msg))
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: number | undefined
    const l = (m: string) => {
      setMsg(m)
      window.clearTimeout(t)
      t = window.setTimeout(() => setMsg(null), 2200)
    }
    toastListeners.push(l)
    return () => {
      toastListeners = toastListeners.filter((x) => x !== l)
    }
  }, [])
  if (!msg) return null
  return (
    <div className="toast" role="status">
      {msg}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
