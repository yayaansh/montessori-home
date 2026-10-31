import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Keeps a crash inside one page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Page error', error)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page page-narrow">
          <div className="card stack" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40 }}>🪴</div>
            <h1 style={{ fontSize: 24 }}>Something went wrong on this page</h1>
            <p className="muted">Your progress is safe. Go back and try again, or reload the app.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={() => this.setState({ error: null })}>
                Try again
              </button>
              <a className="btn btn-ghost" href={import.meta.env.BASE_URL}>
                Home
              </a>
            </div>
            <p className="muted small" style={{ marginTop: 8 }}>{String(this.state.error.message)}</p>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

/** Resets the boundary when the route changes. */
export function RouteErrorBoundary({ children, resetKey }: { children: ReactNode; resetKey: string }) {
  return <ErrorBoundary key={resetKey}>{children}</ErrorBoundary>
}
