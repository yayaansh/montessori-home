import { useEffect, useRef } from 'react'
import { useStore, type WorkKind } from '../../app/store'

/**
 * Records one work-log entry when the child has actually used a page (three or more
 * interactions). The entry is written when she leaves the page, switches apps or closes
 * the tab, and at most once per session of work.
 */
export function useWorkLogger(kind: WorkKind, ref: string, label: string) {
  const logWork = useStore((s) => s.logWork)
  const touched = useRef(0)
  const detail = useRef<string | undefined>(undefined)
  const latest = useRef({ kind, ref, label })
  latest.current = { kind, ref, label }

  useEffect(() => {
    const flush = () => {
      if (touched.current >= 3) {
        logWork({ ...latest.current, detail: detail.current })
        touched.current = 0
        detail.current = undefined
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    touch: (d?: string) => {
      touched.current++
      if (d) detail.current = d
    },
    force: (d?: string) => {
      touched.current = 99
      if (d) detail.current = d
    },
  }
}
