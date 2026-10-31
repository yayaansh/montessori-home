import { useRef, useState } from 'react'
import { useStore } from '../../app/store'
import { Toaster, toast } from '../../components/ui'
import './guide.css'

export default function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const exportState = useStore((s) => s.exportState)
  const importState = useStore((s) => s.importState)
  const resetAll = useStore((s) => s.resetAll)
  const progressCount = useStore((s) => Object.values(s.progress).filter((p) => p.status !== 'none').length)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `montessori-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="page page-narrow">
      <Toaster />
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings</div>
          <h1 className="title">Settings</h1>
        </div>
      </div>
      <div className="stack">
        <section className="card stack">
          <h2 style={{ fontSize: 20 }}>About her</h2>
          <label className="stack" style={{ gap: 6 }}>
            <span className="small muted">Her name (shown in her corner)</span>
            <input className="input" value={settings.childName} onChange={(e) => setSettings({ childName: e.target.value })} placeholder="Name" />
          </label>
          <div className="stack" style={{ gap: 6 }}>
            <span className="small muted">Working level. Used for suggestions and the “Her level” filter.</span>
            <div className="seg">
              {(
                [
                  ['first', 'First cycle · 6–9'],
                  ['second', 'Second cycle · 9–12'],
                  ['all', 'Everything'],
                ] as const
              ).map(([k, label]) => (
                <button key={k} className={settings.level === k ? 'on' : ''} onClick={() => setSettings({ level: k })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 20 }}>Her corner</h2>
          <label className="row between">
            <span>Use cursive letters in the movable alphabet</span>
            <input type="checkbox" checked={settings.cursive} onChange={(e) => setSettings({ cursive: e.target.checked })} style={{ width: 24, height: 24 }} />
          </label>
          <label className="row between">
            <span>Show running totals on the bead and stamp materials</span>
            <input type="checkbox" checked={settings.showTotals} onChange={(e) => setSettings({ showTotals: e.target.checked })} style={{ width: 24, height: 24 }} />
          </label>
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 20 }}>Progress data</h2>
          <p className="muted small">
            Progress, notes, the weekly plan and her work log are saved on this device only ({progressCount} lessons with progress). Export a copy to move it to
            another device or keep a backup.
          </p>
          <div className="row">
            <button className="btn" onClick={download}>Export backup</button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import backup</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const ok = importState(await f.text())
                toast(ok ? 'Backup imported' : 'That file could not be read')
                e.target.value = ''
              }}
            />
          </div>
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 20 }}>Start over</h2>
          <p className="muted small">Clears all progress, notes, plans and the work log on this device. The albums and printables are not affected.</p>
          {!confirmReset ? (
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Reset everything…</button>
          ) : (
            <div className="row">
              <button
                className="btn"
                style={{ background: 'var(--rose)' }}
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                  toast('Everything was reset')
                }}
              >
                Yes, reset
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          )}
        </section>

        <p className="muted small">
          Content: AMI Elementary albums from the 58th International Course, Bergamo (Stefan Jaleru), with the accompanying printables. For home use.
        </p>
      </div>
    </main>
  )
}
