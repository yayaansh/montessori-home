import type { Album, AlbumId, AlbumIndexEntry, AlbumNode, AgeBand, Section } from './types'
import indexJson from './albums/index.json'

export const ALBUM_INDEX = indexJson as AlbumIndexEntry[]

export const ALBUM_META: Record<AlbumId, { name: string; short: string; glyph: string; blurb: string; order: number }> = {
  arithmetic: { name: 'Arithmetic', short: 'Maths', glyph: '🔢', blurb: 'Numbers, the decimal system, operations, fractions and beyond.', order: 1 },
  geometry: { name: 'Geometry', short: 'Geometry', glyph: '📐', blurb: 'Lines, angles, shapes, area and solids, explored by hand.', order: 2 },
  language: { name: 'Language', short: 'Language', glyph: '✒️', blurb: 'Reading, writing, grammar, word study and the story of language.', order: 3 },
  biology: { name: 'Biology', short: 'Biology', glyph: '🌿', blurb: 'Plants, animals, cells and the tree of life.', order: 4 },
  geography: { name: 'Geography', short: 'Geography', glyph: '🌍', blurb: 'The Earth, its land and water, weather and human needs.', order: 5 },
  history: { name: 'History', short: 'History', glyph: '🕰️', blurb: 'Great stories, timelines, fundamental needs and civilisations.', order: 6 },
  art: { name: 'Art', short: 'Art', glyph: '🎨', blurb: 'Elements and principles of art with project ideas.', order: 7 },
  theory: { name: 'Theory', short: 'Theory', glyph: '📖', blurb: 'Montessori principles for the guide: planes of development, freedom, observation.', order: 8 },
}

export const ALBUM_IDS = (Object.keys(ALBUM_META) as AlbumId[]).sort((a, b) => ALBUM_META[a].order - ALBUM_META[b].order)

const modules = import.meta.glob<{ default: Album }>('./albums/*.json')

const cache = new Map<AlbumId, Promise<Album>>()

export function loadAlbum(id: AlbumId): Promise<Album> {
  let p = cache.get(id)
  if (!p) {
    const key = `./albums/${id}.json`
    const loader = modules[key]
    if (!loader) throw new Error(`Unknown album ${id}`)
    p = loader().then((m) => m.default)
    cache.set(id, p)
  }
  return p
}

export async function loadAllAlbums(): Promise<Album[]> {
  return Promise.all(ALBUM_IDS.map(loadAlbum))
}

// ---------------------------------------------------------------- helpers

export interface FlatNode {
  node: AlbumNode
  album: AlbumId
  parent: FlatNode | null
  path: AlbumNode[] // ancestors, root first
  order: number
}

const flatCache = new Map<AlbumId, { list: FlatNode[]; byId: Map<string, FlatNode> }>()

export function flatten(album: Album) {
  const hit = flatCache.get(album.id)
  if (hit) return hit
  const list: FlatNode[] = []
  const byId = new Map<string, FlatNode>()
  const walk = (n: AlbumNode, parent: FlatNode | null, path: AlbumNode[]) => {
    const f: FlatNode = { node: n, album: album.id, parent, path, order: list.length }
    list.push(f)
    byId.set(n.id, f)
    n.children.forEach((c) => walk(c, f, [...path, n]))
  }
  album.roots.forEach((r) => walk(r, null, []))
  const out = { list, byId }
  flatCache.set(album.id, out)
  return out
}

export function albumOfNodeId(id: string): AlbumId {
  return id.split('.')[0] as AlbumId
}

export function section(node: AlbumNode, kind: Section['kind']): Section | undefined {
  return node.sections.find((s) => s.kind === kind)
}

export function sectionText(node: AlbumNode, kind: Section['kind']): string {
  const s = section(node, kind)
  return s ? s.blocks.map((b) => b.text).join(' ') : ''
}

export function parseAge(text: string): AgeBand | null {
  if (!text) return null
  const m = text.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/)
  if (m) return { min: +m[1], max: +m[2], label: `${m[1]}–${m[2]}` }
  const single = text.match(/(\d+)\s*years?/)
  if (single) return { min: +single[1], max: +single[1] + 1, label: `${single[1]}+` }
  return null
}

export function ageOf(node: AlbumNode): AgeBand | null {
  return parseAge(sectionText(node, 'age'))
}

/** First sentence or two of a node, for listings. */
export function summaryOf(node: AlbumNode, max = 160): string {
  const order: Section['kind'][] = ['intro', 'introduction', 'directAim', 'presentation', 'materials', 'story', 'other']
  for (const k of order) {
    const s = section(node, k)
    if (s && s.blocks.length) {
      const t = s.blocks
        .filter((b) => b.type !== 'sub')
        .map((b) => b.text)
        .join(' ')
      if (t.trim()) return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t
    }
  }
  return ''
}

/** Materials listed in the node or (for chapters) its first lesson child. */
export function materialsOf(node: AlbumNode): string[] {
  const s = section(node, 'materials')
  if (s) return s.blocks.filter((b) => b.type === 'item' && (b.level ?? 0) === 0).map((b) => b.text)
  return []
}

export function countLessons(node: AlbumNode): number {
  return (node.lesson ? 1 : 0) + node.children.reduce((a, c) => a + countLessons(c), 0)
}

export function* iterate(node: AlbumNode): Generator<AlbumNode> {
  yield node
  for (const c of node.children) yield* iterate(c)
}

export function hasContent(node: AlbumNode): boolean {
  return node.sections.some((s) => s.blocks.length > 0) || node.images.length > 0
}
