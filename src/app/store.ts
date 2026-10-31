import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Status } from '../data/types'

export interface ProgressEntry {
  status: Status
  updated: string
  notes?: string
  history: { status: Status; date: string }[]
}

export interface PlanItem {
  id: string
  nodeId: string
  title: string
  album: string
  addedAt: string
  day: number | null // 0 = Monday … 6 = Sunday, null = any day
  done?: string
}

export type WorkKind = 'material' | 'words' | 'problem' | 'experiment' | 'lesson'

export interface WorkEntry {
  id: string
  at: string
  kind: WorkKind
  ref: string
  label: string
  detail?: string
}

export interface Settings {
  childName: string
  level: 'first' | 'second' | 'all' // first cycle 6–9, second cycle 9–12
  cursive: boolean
  showTotals: boolean
}

interface State {
  progress: Record<string, ProgressEntry>
  plan: PlanItem[]
  work: WorkEntry[]
  settings: Settings
  setStatus: (nodeId: string, status: Status) => void
  setNotes: (nodeId: string, notes: string) => void
  addToPlan: (item: Omit<PlanItem, 'id' | 'addedAt' | 'day'> & { day?: number | null }) => void
  removeFromPlan: (id: string) => void
  setPlanDay: (id: string, day: number | null) => void
  completePlan: (id: string) => void
  clearDonePlan: () => void
  logWork: (entry: Omit<WorkEntry, 'id' | 'at'>) => void
  removeWork: (id: string) => void
  setSettings: (s: Partial<Settings>) => void
  importState: (json: string) => boolean
  exportState: () => string
  resetAll: () => void
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const now = () => new Date().toISOString()

const initial = {
  progress: {} as Record<string, ProgressEntry>,
  plan: [] as PlanItem[],
  work: [] as WorkEntry[],
  settings: { childName: '', level: 'first', cursive: false, showTotals: true } as Settings,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setStatus: (nodeId, status) =>
        set((s) => {
          const prev = s.progress[nodeId]
          const entry: ProgressEntry = {
            status,
            updated: now(),
            notes: prev?.notes,
            history: [...(prev?.history ?? []), { status, date: now() }].slice(-20),
          }
          return { progress: { ...s.progress, [nodeId]: entry } }
        }),
      setNotes: (nodeId, notes) =>
        set((s) => {
          const prev = s.progress[nodeId] ?? { status: 'none' as Status, updated: now(), history: [] }
          return { progress: { ...s.progress, [nodeId]: { ...prev, notes, updated: now() } } }
        }),
      addToPlan: (item) =>
        set((s) => {
          if (s.plan.some((p) => p.nodeId === item.nodeId && !p.done)) return {}
          return { plan: [...s.plan, { ...item, id: uid(), addedAt: now(), day: item.day ?? null }] }
        }),
      removeFromPlan: (id) => set((s) => ({ plan: s.plan.filter((p) => p.id !== id) })),
      setPlanDay: (id, day) => set((s) => ({ plan: s.plan.map((p) => (p.id === id ? { ...p, day } : p)) })),
      completePlan: (id) =>
        set((s) => {
          const item = s.plan.find((p) => p.id === id)
          if (!item) return {}
          const prev = s.progress[item.nodeId]
          const progress = { ...s.progress }
          if (!prev || prev.status === 'none') {
            progress[item.nodeId] = {
              status: 'presented',
              updated: now(),
              notes: prev?.notes,
              history: [...(prev?.history ?? []), { status: 'presented', date: now() }],
            }
          }
          return { plan: s.plan.map((p) => (p.id === id ? { ...p, done: now() } : p)), progress }
        }),
      clearDonePlan: () => set((s) => ({ plan: s.plan.filter((p) => !p.done) })),
      logWork: (entry) => set((s) => ({ work: [{ ...entry, id: uid(), at: now() }, ...s.work].slice(0, 500) })),
      removeWork: (id) => set((s) => ({ work: s.work.filter((w) => w.id !== id) })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      exportState: () => {
        const { progress, plan, work, settings } = get()
        return JSON.stringify({ version: 1, exported: now(), progress, plan, work, settings }, null, 2)
      },
      importState: (json) => {
        try {
          const data = JSON.parse(json)
          if (!data || typeof data !== 'object') return false
          set({
            progress: data.progress ?? {},
            plan: data.plan ?? [],
            work: data.work ?? [],
            settings: { ...initial.settings, ...(data.settings ?? {}) },
          })
          return true
        } catch {
          return false
        }
      },
      resetAll: () => set({ ...initial }),
    }),
    { name: 'montessori-home-v1' },
  ),
)

export const STATUS_LABEL: Record<Status, string> = {
  none: 'Not started',
  presented: 'Presented',
  practising: 'Practising',
  mastered: 'Mastered',
}

export const STATUS_ORDER: Status[] = ['none', 'presented', 'practising', 'mastered']

export function levelBand(level: Settings['level']): { min: number; max: number } {
  if (level === 'first') return { min: 6, max: 9 }
  if (level === 'second') return { min: 9, max: 12 }
  return { min: 0, max: 99 }
}
