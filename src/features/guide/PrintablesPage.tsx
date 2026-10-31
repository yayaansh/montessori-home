import { useMemo, useState } from 'react'
import { PRINTABLES, formatBytes } from '../../data/links'
import { asset } from '../../data/paths'
import './guide.css'

const AREA_ORDER = ['Arithmetic', 'Geometry', 'Language', 'Biology', 'Geography', 'History', 'Art', 'Music', 'Experiments', 'Extra']

export default function PrintablesPage() {
  const [area, setArea] = useState<string>('All')
  const [q, setQ] = useState('')
  const areas = useMemo(() => {
    const present = new Set(PRINTABLES.map((p) => p.area))
    return AREA_ORDER.filter((a) => present.has(a))
  }, [])
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return PRINTABLES.filter((p) => (area === 'All' || p.area === area) && (!needle || `${p.name} ${p.group} ${p.subgroup}`.toLowerCase().includes(needle)))
  }, [area, q])

  const groups = useMemo(() => {
    const m = new Map<string, typeof items>()
    for (const p of items) {
      const key = area === 'All' ? p.area : [p.group, p.subgroup].filter(Boolean).join(' · ') || 'General'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(p)
    }
    return Array.from(m.entries())
  }, [items, area])

  return (
    <main className="page page-wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Library</div>
          <h1 className="title">Printables</h1>
          <p className="subtitle">{PRINTABLES.length} charts, cards and worksheets. They open in a new tab, from where you can print or save them.</p>
        </div>
      </div>
      <div className="filters">
        <div className="seg" role="group" aria-label="Area">
          {['All', ...areas].map((a) => (
            <button key={a} className={area === a ? 'on' : ''} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Search printables…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search printables" />
      </div>
      {groups.map(([label, list]) => (
        <section key={label} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>
            {label} <span className="tcount">{list.length}</span>
          </h2>
          <div className="grid grid-4">
            {list.map((p) => (
              <a key={p.id} href={asset(p.file)} target="_blank" rel="noopener" className="pcard">
                <div className="thumb">{p.thumb ? <img src={asset(p.thumb)} alt="" loading="lazy" /> : <span style={{ fontSize: 32 }}>📄</span>}</div>
                <div>
                  <div className="t">{p.name}</div>
                  <div className="s">
                    {p.ext.toUpperCase()}
                    {p.pages > 1 ? ` · ${p.pages} pages` : ''} · {formatBytes(p.bytes)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
