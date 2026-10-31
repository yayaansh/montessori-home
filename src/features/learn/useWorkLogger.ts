import { useEffect, useRef } from 'react'
import { useStore, type WorkKind } from '../../app/store'

/** Records one work-log entry when the child leaves a page she actually used. */
export function useWorkLogger(kind: WorkKind, ref: string, label: string) {
  const logWork = useStore((s) => s.logWork)
  const touched = useRef(0)
  const detail = useRef<string | undefined>(undefined)
  const latest = useRef({ kind, ref, label })
  latest.current = { kind, ref, label }
  useEffect(() => {
    return () => {
      if (touched.current >= 3) logWork({ ...latest.current, detail: detail.current })
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
