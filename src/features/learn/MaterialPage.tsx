import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MATERIALS } from '../../data/links'
import { Toaster } from '../../components/ui'
import './learn.css'

const COMPONENTS: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  'golden-beads': lazy(() => import('./materials/GoldenBeads')),
  'stamp-game': lazy(() => import('./materials/StampGame')),
  'bead-bars': lazy(() => import('./materials/BeadBars')),
  fractions: lazy(() => import('./materials/Fractions')),
  'grammar-symbols': lazy(() => import('./materials/GrammarSymbols')),
  'movable-alphabet': lazy(() => import('./materials/MovableAlphabet')),
}

export default function MaterialPage() {
  const { materialId } = useParams()
  const m = MATERIALS.find((x) => x.id === materialId)
  const Comp = materialId ? COMPONENTS[materialId] : undefined
  if (!m || !Comp)
    return (
      <main className="page">
        <p>That material is not on the shelf.</p>
        <Link to="/learn/materials" className="btn btn-ghost">Back to the shelf</Link>
      </main>
    )
  return (
    <main className="page page-wide">
      <Toaster />
      <div className="ws-head">
        <Link to="/learn/materials" className="btn btn-ghost btn-sm" aria-label="Back to the shelf">← Shelf</Link>
        <span style={{ fontSize: 28 }}>{m.glyph}</span>
        <h1>{m.name}</h1>
      </div>
      <Suspense fallback={<p className="muted">Setting out the material…</p>}>
        <Comp />
      </Suspense>
    </main>
  )
}
