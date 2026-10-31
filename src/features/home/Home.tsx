import { Link } from 'react-router-dom'
import { useStore } from '../../app/store'
import { asset } from '../../data/paths'
import './home.css'

export default function Home() {
  const name = useStore((s) => s.settings.childName)
  const allPlan = useStore((s) => s.plan)
  const plan = allPlan.filter((p) => !p.done)
  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-head">
          <img src={asset('/icons/icon.svg')} alt="" width={56} height={56} />
          <h1>Montessori Home</h1>
          <p className="muted">The Elementary albums, the materials and the printables, all in one place.</p>
        </header>
        <div className="doors">
          <Link to="/learn" className="door door-learn">
            <span className="door-eyebrow">For {name || 'her'}</span>
            <span className="door-title">{name ? `${name}'s corner` : 'My corner'}</span>
            <span className="door-text">Materials to work with, words to discover, problems and experiments.</span>
            <span className="door-cta">Open →</span>
          </Link>
          <Link to="/guide" className="door door-guide">
            <span className="door-eyebrow">For the guide</span>
            <span className="door-title">Album &amp; planner</span>
            <span className="door-text">
              Every lesson from the eight albums, progress tracking, this week's plan and the printables.
              {plan.length > 0 && <strong> {plan.length} lesson{plan.length === 1 ? '' : 's'} planned this week.</strong>}
            </span>
            <span className="door-cta">Open →</span>
          </Link>
        </div>
        <p className="home-foot muted small">
          Based on the AMI Elementary albums (Bergamo). Add this page to the iPad home screen to use it like an app.
        </p>
      </div>
    </main>
  )
}
