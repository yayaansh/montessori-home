export type AlbumId =
  | 'arithmetic'
  | 'geometry'
  | 'language'
  | 'biology'
  | 'geography'
  | 'history'
  | 'art'
  | 'theory'

export type SectionKind =
  | 'intro'
  | 'materials'
  | 'presentation'
  | 'directAim'
  | 'indirectAim'
  | 'age'
  | 'followUp'
  | 'extension'
  | 'etymology'
  | 'observations'
  | 'introduction'
  | 'prerequisites'
  | 'pointsOfInterest'
  | 'controlOfError'
  | 'notes'
  | 'conclusion'
  | 'activities'
  | 'story'
  | 'other'

export interface Block {
  type: 'para' | 'item' | 'sub' | 'label'
  text: string
  level?: number
}

export interface Section {
  label: string
  kind: SectionKind
  blocks: Block[]
}

export interface AlbumNode {
  id: string
  title: string
  depth: number
  page: number
  lesson: boolean
  sections: Section[]
  images: string[]
  children: AlbumNode[]
}

export interface Album {
  id: AlbumId
  name: string
  source: string
  pages: number
  nodeCount: number
  lessonCount: number
  roots: AlbumNode[]
}

export interface AlbumIndexEntry {
  id: AlbumId
  name: string
  nodeCount: number
  lessonCount: number
  pages: number
}

export interface Printable {
  id: string
  area: string
  group: string
  subgroup: string
  name: string
  file: string
  ext: string
  bytes: number
  pages: number
  thumb: string
}

export interface DictionaryEntry {
  word: string
  language: string
  root: string
  meaning: string
}

export interface Experiment {
  number: number
  title: string
  materials: string[]
  procedure: string
  explanation: string
}

export interface WordProblemSet {
  id: string
  topic: string
  name: string
  header: string
  steps: number
  file: string
  problems: { n: number; text: string }[]
}

export type Status = 'none' | 'presented' | 'practising' | 'mastered'

export interface AgeBand {
  min: number
  max: number
  label: string
}
