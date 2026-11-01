import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { describeSpec, findTask, nextTaskAfter, taskHref, type SpecFor, type Task, type TaskSpec } from '../../data/pathways'
import { useStore } from '../../app/store'

export interface ActiveTask<K extends TaskSpec['kind']> {
  active: boolean
  task?: Task
  spec?: SpecFor<K>
  done: boolean
  complete: () => void
  next: Task | null
  stageTitle?: string
  pathwayAlbum?: string
}

/** Reads ?task= from the URL and exposes the matching assignment for this material or activity. */
export function useTask<K extends TaskSpec['kind']>(kind: K): ActiveTask<K> {
  const [params] = useSearchParams()
  const id = params.get('task')
  const hit = useMemo(() => findTask(id), [id])
  const tasks = useStore((s) => s.tasks)
  const completeTask = useStore((s) => s.completeTask)
  const matches = !!hit && hit.task.spec.kind === kind
  const task = matches ? hit.task : undefined
  const done = !!task && !!tasks[task.id]
  const complete = useCallback(() => {
    if (task) completeTask(task.id, `⭐ ${task.title}`)
  }, [task, completeTask])
  const next = task ? nextTaskAfter(task.id, tasks) : null
  return {
    active: !!task,
    task,
    spec: task ? (task.spec as SpecFor<K>) : undefined,
    done,
    complete,
    next,
    stageTitle: hit?.stage.title,
    pathwayAlbum: hit?.pathway.album,
  }
}

export function TaskBanner<K extends TaskSpec['kind']>({ t }: { t: ActiveTask<K> }) {
  const name = useStore((s) => s.settings.childName)
  if (!t.active || !t.task) return null
  const detail = describeSpec(t.task.spec)
  return (
    <div className={`task-banner ${t.done ? 'done' : ''}`} role="status">
      <div className="task-main">
        <div className="eyebrow">{t.done ? 'Done' : 'Your task'} · {t.stageTitle}</div>
        <div className="task-title">
          {t.done ? '⭐ ' : ''}
          {t.task.title}
          {detail && !t.done && <span className="task-detail">{detail}</span>}
        </div>
        {t.task.hint && !t.done && <div className="muted small">{t.task.hint}</div>}
        {t.done && <div className="muted small">{name ? `Well done, ${name}.` : 'Well done.'} You can keep playing, or move on.</div>}
      </div>
      <div className="task-acts">
        {t.done && t.next && (
          <Link className="btn" to={taskHref(t.next)}>
            Next task →
          </Link>
        )}
        <Link className="btn btn-ghost" to={`/learn/path/${t.pathwayAlbum}`}>
          {t.done ? 'Back to the path' : 'The path'}
        </Link>
      </div>
    </div>
  )
}
