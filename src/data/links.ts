import type { AlbumId, AlbumNode, Printable } from './types'
import printablesJson from './printables.json'

export const PRINTABLES = printablesJson as Printable[]

export interface DigitalMaterial {
  id: string
  name: string
  short: string
  glyph: string
  album: AlbumId
  blurb: string
  match: RegExp
  colour: string
}

export const MATERIALS: DigitalMaterial[] = [
  {
    id: 'golden-beads',
    name: 'Golden beads',
    short: 'Beads',
    glyph: '🟡',
    album: 'arithmetic',
    blurb: 'Units, tens, hundreds and thousands. Build numbers, add, exchange.',
    match: /golden bead|decimal system|bank game|static (addition|subtraction|multiplication|division)|dynamic (addition|subtraction|multiplication|division)|wooden hierarchical|hierarch/i,
    colour: 'var(--ochre)',
  },
  {
    id: 'stamp-game',
    name: 'Stamp game',
    short: 'Stamps',
    glyph: '🟩',
    album: 'arithmetic',
    blurb: 'Number tiles for the four operations with exchanging.',
    match: /stamp game|dot game|passage to abstraction|group division/i,
    colour: 'var(--sage)',
  },
  {
    id: 'bead-bars',
    name: 'Bead bars',
    short: 'Bars',
    glyph: '🧮',
    album: 'arithmetic',
    blurb: 'Coloured bars from 1 to 10 for counting, tables, squares and multiples.',
    match: /bead bar|snake game|skip counting|multiplication (board|tables|games)|memorization|multiples|decanomial|squar|linear counting|teens|tens\b/i,
    colour: 'var(--terracotta)',
  },
  {
    id: 'fractions',
    name: 'Fraction circles',
    short: 'Fractions',
    glyph: '🥧',
    album: 'arithmetic',
    blurb: 'Circle insets from one whole to tenths. Name, compare and combine.',
    match: /fraction|centesimal|percentage|equivalence/i,
    colour: 'var(--rose)',
  },
  {
    id: 'grammar-symbols',
    name: 'Grammar symbols',
    short: 'Grammar',
    glyph: '🔺',
    album: 'language',
    blurb: 'Place the Montessori symbols over the words of a sentence.',
    match: /noun|article|adjective|verb|adverb|pronoun|preposition|conjunction|interjection|grammar|function of|parts of speech|classification of the words|sentence analysis/i,
    colour: 'var(--plum)',
  },
  {
    id: 'movable-alphabet',
    name: 'Movable alphabet',
    short: 'Alphabet',
    glyph: '🔤',
    album: 'language',
    blurb: 'Blue vowels and red consonants to build words and sentences.',
    match: /movable alphabet|spelling|word study|suffix|prefix|compound|word famil|phonetic|puzzle words|sandpaper letters|writing/i,
    colour: 'var(--slate)',
  },
]

export function materialsForNode(node: AlbumNode, path: AlbumNode[], album: AlbumId): DigitalMaterial[] {
  const text = [node.title, ...path.slice(-2).map((p) => p.title), node.sections.find((s) => s.kind === 'materials')?.blocks.map((b) => b.text).join(' ') ?? '']
    .join(' | ')
  return MATERIALS.filter((m) => m.album === album && m.match.test(text))
}

const STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'for', 'with', 'to', 'in', 'on', 'cards', 'card', 'chart', 'charts', 'format',
  'colour', 'color', 'version', 'worksheet', 'worksheets', 'blank', 'a3', 'a4', 'letter', 'format)', 'v1', 'v2',
  'material', 'materials', 'paper', 'form', 'step', 'steps', 'word', 'problems', 'problem', 'children', 'elementary',
  'presentation', 'introduction', 'working', 'exercise', 'exercises', 'first', 'second', 'third', 'part', 'story',
])

const AREA_FOR_ALBUM: Record<AlbumId, string[]> = {
  arithmetic: ['Arithmetic', 'Extra'],
  geometry: ['Geometry'],
  language: ['Language', 'Extra'],
  biology: ['Biology', 'Experiments'],
  geography: ['Geography', 'Experiments'],
  history: ['History'],
  art: ['Art', 'Music'],
  theory: ['Extra'],
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t))
}

function stem(t: string): string {
  return t.replace(/(ions?|ies|es|s|ing|ed|al|ical)$/g, '')
}

export function printablesForNode(node: AlbumNode, path: AlbumNode[], album: AlbumId, limit = 8): Printable[] {
  const areas = AREA_FOR_ALBUM[album]
  const titleToks = new Set(tokens([node.title, ...path.slice(-2).map((p) => p.title)].join(' ')).map(stem))
  const matToks = new Set(tokens(node.sections.find((s) => s.kind === 'materials')?.blocks.map((b) => b.text).join(' ') ?? '').map(stem))
  const scored = PRINTABLES.filter((p) => areas.includes(p.area)).map((p) => {
    const pt = tokens([p.name, p.group, p.subgroup].join(' ')).map(stem)
    let score = 0
    for (const t of pt) {
      if (titleToks.has(t)) score += t.length >= 7 ? 3 : 1.5
      else if (matToks.has(t)) score += t.length >= 7 ? 1.5 : 0.75
    }
    return { p, score }
  })
  return scored
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p)
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(n > 10 * 1024 * 1024 ? 0 : 1)} MB`
}
