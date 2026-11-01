import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store'
import { asset } from '../data/paths'
import { RouteErrorBoundary } from '../components/ErrorBoundary'

export function Loading() {
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '50dvh' }}>
      <div className="muted">Loading…</div>
    </div>
  )
}

export function Shell({ mode }: { mode: 'guide' | 'learn' }) {
  const name = useStore((s) => s.settings.childName)
  const loc = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [loc.pathname])

  const guideLinks = [
    { to: '/guide', label: 'Overview', end: true },
    { to: '/guide/plan', label: 'This week' },
    { to: '/guide/printables', label: 'Printables' },
    { to: '/guide/search', label: 'Search' },
    { to: '/guide/settings', label: 'Settings' },
  ]
  const learnLinks = [
    { to: '/learn', label: 'Home', end: true },
    { to: '/learn/path', label: 'My path' },
    { to: '/learn/materials', label: 'Materials' },
    { to: '/learn/words', label: 'Words' },
    { to: '/learn/problems', label: 'Problems' },
    { to: '/learn/experiments', label: 'Experiments' },
    { to: '/learn/work', label: 'My work' },
  ]
  const links = mode === 'guide' ? guideLinks : learnLinks
  return (
    <div className={`shell mode-${mode}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Home">
            <img src={asset('/icons/icon.svg')} alt="" />
            <span>{mode === 'guide' ? 'Guide' : name ? `${name}'s corner` : 'My corner'}</span>
          </Link>
          <nav className="topnav" aria-label="Sections">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <RouteErrorBoundary resetKey={loc.pathname}>
        <Outlet />
      </RouteErrorBoundary>
    </div>
  )
}
