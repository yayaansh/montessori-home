import { Link } from 'react-router-dom'
import { MATERIALS } from '../../data/links'
import './learn.css'

export default function Shelf() {
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Materials</div>
          <h1 className="title">The shelf</h1>
          <p className="subtitle">Choose a material and take it to the mat.</p>
        </div>
      </div>
      <div className="shelf">
        {MATERIALS.map((m) => (
          <Link key={m.id} to={`/learn/materials/${m.id}`} className="tile" style={{ ['--c' as string]: m.colour }}>
            <span className="glyph">{m.glyph}</span>
            <h3>{m.name}</h3>
            <p>{m.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
