import type { AlbumId } from './types'

/**
 * The learning pathways: a built-in, stage-by-stage route through each subject
 * at the first-cycle (6–9) level. Each stage pairs the album lessons the guide
 * presents ("with Mum") with practice tasks the child completes on her own in
 * the app. Lesson references are album node ids.
 */

export type TaskSpec =
  | { kind: 'golden-beads' | 'stamp-game'; build?: number; sum?: [number, number]; take?: [number, number] }
  | { kind: 'bead-bars'; table?: [number, number]; make?: number; staircase?: boolean }
  | { kind: 'fractions'; fill?: number; show?: [number, number] }
  | { kind: 'grammar-symbols'; sentences: number[] }
  | { kind: 'movable-alphabet'; words: string[] }
  | { kind: 'words'; topic: string; count: number }
  | { kind: 'problems'; set: string; count: number }
  | { kind: 'experiment'; number: number }

/** The spec variant that covers a given material kind (some variants cover two kinds). */
export type SpecFor<K extends TaskSpec['kind']> = TaskSpec extends infer S ? (S extends TaskSpec ? (K extends S['kind'] ? S : never) : never) : never

export interface Task {
  id: string
  title: string
  hint?: string
  spec: TaskSpec
  /** The album lesson this activity reinforces (filled in from LESSON_OF below). */
  lesson?: string
}

export interface Stage {
  id: string
  title: string
  blurb: string
  lessons: string[]
  tasks: Task[]
}

export interface Pathway {
  album: AlbumId
  title: string
  tagline: string
  glyph: string
  stages: Stage[]
}

const t = (id: string, title: string, spec: TaskSpec, hint?: string): Task => ({ id, title, spec, hint })

const P = {
  add1: '02-passage-to-abstraction-word-problems-passage-to-abstraction-addition-1-step-pdf',
  sub1: '02-passage-to-abstraction-word-problems-passage-to-abstraction-subtraction-1-step-pdf',
  mul1: '02-passage-to-abstraction-word-problems-passage-to-abstraction-multiplication-1-step-pdf',
  div1: '02-passage-to-abstraction-word-problems-passage-to-abstraction-division-1-step-pdf',
  all2: '02-passage-to-abstraction-word-problems-passage-to-abstraction-all-operations-2-steps-pdf',
  longmul1: '03-long-multiplication-word-problems-long-multiplication-1-step-pdf',
  longmul2: '03-long-multiplication-word-problems-long-multiplication-2-steps-pdf',
  fracAddSame: '06-fractions-same-denominator-word-problems-addition-fraction-same-denominator-1-step-pdf',
  fracSubSame: '06-fractions-same-denominator-word-problems-subtraction-fraction-same-denominator-1-step-pdf',
  fracAddSame2: '06-fractions-same-denominator-word-problems-addition-fraction-same-denominator-2-steps-pdf',
  metric1: '08-metric-system-metric-system-measurement-1-step-pdf',
  metric2: '08-metric-system-metric-system-measurement-2-steps-pdf',
  time: '23-time-word-problems-with-time-pdf',
  perimeter1: '19-perimeter-word-problems-with-perimeter-1-step-pdf',
  perimeter2: '19-perimeter-word-problems-with-perimeter-2-steps-pdf',
  area1: '20-area-word-problems-with-area-1-step-pdf',
  area2: '20-area-word-problems-with-area-2-steps-pdf',
  distance: '11-distance-time-and-speed-word-problems-with-distance-time-and-speed-pdf',
}

export const PATHWAYS: Pathway[] = [
  {
    album: 'arithmetic',
    title: 'Numbers',
    tagline: 'From counting to ten all the way to fractions and big multiplications.',
    glyph: '🔢',
    stages: [
      {
        id: 'num-1',
        title: 'Numbers to ten',
        blurb: 'Count, name and order the numbers from one to ten.',
        lessons: ['arithmetic.number-rods.282b9', 'arithmetic.sandpaper-digits.e952e', 'arithmetic.number-rods-and-cards.db697', 'arithmetic.cards-and-counters.cdaf3'],
        tasks: [
          t('num-1-a', 'Build the staircase of bars from 1 to 10', { kind: 'bead-bars', staircase: true }, 'Put one bar of each colour on the mat, shortest at the top.'),
          t('num-1-b', 'Lay the bar of 5 two times', { kind: 'bead-bars', table: [5, 2] }, 'Two fives make ten.'),
          t('num-1-c', 'Lay the bar of 3 three times', { kind: 'bead-bars', table: [3, 3] }, 'Count all the beads at the end.'),
          t('num-1-d', 'Make 10 with two different bars', { kind: 'bead-bars', make: 10 }, '6 and 4? 7 and 3? 8 and 2?'),
          t('num-1-e', 'Make 9 with two bars', { kind: 'bead-bars', make: 9 }),
          t('num-1-f', 'Put 7 golden units on the mat', { kind: 'golden-beads', build: 7 }),
          t('num-1-g', 'Put 10 golden units on the mat, then press Exchange', { kind: 'golden-beads', build: 10 }, 'Ten units become one ten bar. The total stays 10.'),
          t('num-1-h', 'Discover 6 number words', { kind: 'words', topic: 'maths', count: 6 }),
        ],
      },
      {
        id: 'num-2',
        title: 'The golden beads',
        blurb: 'Units, tens, hundreds and thousands. Build any number you like.',
        lessons: ['arithmetic.golden-beads.2be82', 'arithmetic.static-addition.4303e', 'arithmetic.static-subtraction.7275f'],
        tasks: [
          t('num-2-a', 'Build 1 234 with golden beads', { kind: 'golden-beads', build: 1234 }),
          t('num-2-b', 'Build 3 052 with golden beads', { kind: 'golden-beads', build: 3052 }, 'Careful: there are no tens in this number.'),
          t('num-2-c', 'Build 4 507', { kind: 'golden-beads', build: 4507 }, 'No hundreds this time.'),
          t('num-2-d', 'Build 1 000 with just one piece', { kind: 'golden-beads', build: 1000 }),
          t('num-2-e', 'Build 2 340', { kind: 'golden-beads', build: 2340 }),
          t('num-2-f', 'Add 1 234 and 2 341', { kind: 'golden-beads', sum: [1234, 2341] }, 'Lay the first number, then the second underneath, then push them together.'),
          t('num-2-g', 'Add 2 102 and 1 231', { kind: 'golden-beads', sum: [2102, 1231] }),
          t('num-2-h', 'Take 2 345 away from 4 568', { kind: 'golden-beads', take: [4568, 2345] }, 'Lay the big number, then put back the smaller one.'),
          t('num-2-i', 'Take 1 234 away from 3 456', { kind: 'golden-beads', take: [3456, 1234] }),
        ],
      },
      {
        id: 'num-3',
        title: 'Exchanging',
        blurb: 'When you have ten of a kind, change them for one of the next.',
        lessons: ['arithmetic.dynamic-addition.22698', 'arithmetic.dynamic-subtraction.fd348', 'arithmetic.stamp-game.03872'],
        tasks: [
          t('num-3-a', 'Add 1 456 and 2 378 with the stamps', { kind: 'stamp-game', sum: [1456, 2378] }, 'You will need to exchange ten units for a ten.'),
          t('num-3-b', 'Add 2 785 and 1 649 with the stamps', { kind: 'stamp-game', sum: [2785, 1649] }),
          t('num-3-c', 'Add 1 999 and 1', { kind: 'stamp-game', sum: [1999, 1] }, 'Watch the exchanges run all the way up.'),
          t('num-3-d', 'Add 1 275 and 1 848', { kind: 'stamp-game', sum: [1275, 1848] }),
          t('num-3-e', 'Take 1 234 away from 5 000', { kind: 'stamp-game', take: [5000, 1234] }, 'You will have to break a thousand into hundreds first.'),
          t('num-3-f', 'Take 1 away from 2 000', { kind: 'stamp-game', take: [2000, 1] }, 'Change a thousand, then a hundred, then a ten.'),
          t('num-3-g', 'Take 1 876 away from 3 245', { kind: 'stamp-game', take: [3245, 1876] }),
          t('num-3-h', 'Solve 5 addition story problems', { kind: 'problems', set: P.add1, count: 5 }),
          t('num-3-i', 'Solve 5 subtraction story problems', { kind: 'problems', set: P.sub1, count: 5 }),
          t('num-3-j', 'Solve 5 more addition problems', { kind: 'problems', set: P.add1, count: 10 }),
          t('num-3-k', 'Solve 5 more subtraction problems', { kind: 'problems', set: P.sub1, count: 10 }),
        ],
      },
      {
        id: 'num-4',
        title: 'Counting in jumps',
        blurb: 'Teens, tens and skip counting with the coloured bars.',
        lessons: ['arithmetic.teens.68cef', 'arithmetic.tens.f2008', 'arithmetic.skip-counting.3e977'],
        tasks: [
          t('num-4-a', 'Lay the bar of 2 ten times and count in twos', { kind: 'bead-bars', table: [2, 10] }, '2, 4, 6, 8…'),
          t('num-4-b', 'Lay the bar of 3 ten times and count in threes', { kind: 'bead-bars', table: [3, 10] }),
          t('num-4-c', 'Lay the bar of 4 ten times and count in fours', { kind: 'bead-bars', table: [4, 10] }),
          t('num-4-d', 'Lay the bar of 5 ten times and count in fives', { kind: 'bead-bars', table: [5, 10] }),
          t('num-4-e', 'Lay the bar of 9 ten times', { kind: 'bead-bars', table: [9, 10] }, 'Look at the pattern in the numbers: 9, 18, 27…'),
          t('num-4-f', 'Lay the bar of 10 ten times. What do you reach?', { kind: 'bead-bars', table: [10, 10] }, 'Ten tens make a hundred.'),
          t('num-4-g', 'Make 20 with bars of 4', { kind: 'bead-bars', make: 20 }, 'How many fours is that?'),
          t('num-4-h', 'Make 30 with bars of 6', { kind: 'bead-bars', make: 30 }),
          t('num-4-i', 'Build 19 with golden beads', { kind: 'golden-beads', build: 19 }, 'One ten and nine units.'),
          t('num-4-j', 'Build 70 with golden beads', { kind: 'golden-beads', build: 70 }),
        ],
      },
      {
        id: 'num-5',
        title: 'Multiplication',
        blurb: 'Taking the same number again and again.',
        lessons: ['arithmetic.building-multiplication-tables-with-bead-bars.52786', 'arithmetic.multiplication-board.8bbbf', 'arithmetic.multiplication-games.871c4'],
        tasks: [
          t('num-5-a', 'Make the square of 4', { kind: 'bead-bars', table: [4, 4] }, 'Four bars of four.'),
          t('num-5-b', 'Make the square of 6', { kind: 'bead-bars', table: [6, 6] }),
          t('num-5-c', 'Make the square of 7', { kind: 'bead-bars', table: [7, 7] }),
          t('num-5-d', 'Lay 3 bars of 6', { kind: 'bead-bars', table: [6, 3] }),
          t('num-5-e', 'Lay 3 bars of 8', { kind: 'bead-bars', table: [8, 3] }),
          t('num-5-f', 'Lay 4 bars of 9', { kind: 'bead-bars', table: [9, 4] }),
          t('num-5-g', 'Make 24 with one kind of bar', { kind: 'bead-bars', make: 24 }, 'Try several kinds: twos, threes, fours…'),
          t('num-5-h', 'Make 36 with one kind of bar', { kind: 'bead-bars', make: 36 }),
          t('num-5-i', 'Make 18 with one kind of bar', { kind: 'bead-bars', make: 18 }),
          t('num-5-j', 'Make 40 with one kind of bar', { kind: 'bead-bars', make: 40 }),
          t('num-5-k', 'Solve 5 multiplication story problems', { kind: 'problems', set: P.mul1, count: 5 }),
          t('num-5-l', 'Solve 5 more multiplication problems', { kind: 'problems', set: P.mul1, count: 10 }),
        ],
      },
      {
        id: 'num-6',
        title: 'Division',
        blurb: 'Sharing equally.',
        lessons: ['arithmetic.division-board.0684c', 'arithmetic.dynamic-short-division-with-the-stamp-game.6d180'],
        tasks: [
          t('num-6-a', 'Build 3 696 with the stamps, then share it between 3', { kind: 'stamp-game', build: 3696 }, 'Lay it out, then move the stamps into three equal rows.'),
          t('num-6-b', 'Build 4 848 with the stamps, then share it between 4', { kind: 'stamp-game', build: 4848 }),
          t('num-6-c', 'Build 2 466 with the stamps, then share it between 2', { kind: 'stamp-game', build: 2466 }),
          t('num-6-d', 'Make 12 with bars, then see how many ways it splits', { kind: 'bead-bars', make: 12 }, 'Two sixes, three fours, four threes…'),
          t('num-6-e', 'Solve 5 division story problems', { kind: 'problems', set: P.div1, count: 5 }),
          t('num-6-f', 'Solve 5 more division problems', { kind: 'problems', set: P.div1, count: 10 }),
          t('num-6-g', 'Solve 3 two-step story problems', { kind: 'problems', set: P.all2, count: 3 }),
          t('num-6-h', 'Solve 3 more two-step problems', { kind: 'problems', set: P.all2, count: 6 }),
        ],
      },
      {
        id: 'num-7',
        title: 'Fractions',
        blurb: 'Breaking a whole into equal parts and naming them.',
        lessons: ['arithmetic.concept-of-fractions-for-elementary.5579e', 'arithmetic.nomenclature.4565a', 'arithmetic.equivalence.38ab8'],
        tasks: [
          t('num-7-a', 'Put the whole circle in the frame', { kind: 'fractions', fill: 1 }),
          t('num-7-b', 'Fill the circle with halves', { kind: 'fractions', fill: 2 }),
          t('num-7-c', 'Fill the circle with thirds', { kind: 'fractions', fill: 3 }),
          t('num-7-d', 'Fill the circle with quarters', { kind: 'fractions', fill: 4 }),
          t('num-7-e', 'Fill the circle with fifths', { kind: 'fractions', fill: 5 }),
          t('num-7-f', 'Fill the circle with sixths', { kind: 'fractions', fill: 6 }),
          t('num-7-g', 'Fill the circle with eighths', { kind: 'fractions', fill: 8 }),
          t('num-7-h', 'Fill the circle with tenths', { kind: 'fractions', fill: 10 }),
          t('num-7-i', 'Show one half', { kind: 'fractions', show: [1, 2] }),
          t('num-7-j', 'Show two thirds', { kind: 'fractions', show: [2, 3] }),
          t('num-7-k', 'Show three quarters', { kind: 'fractions', show: [3, 4] }),
          t('num-7-l', 'Show four fifths', { kind: 'fractions', show: [4, 5] }),
          t('num-7-m', 'Show five sixths', { kind: 'fractions', show: [5, 6] }),
          t('num-7-n', 'Show seven eighths', { kind: 'fractions', show: [7, 8] }),
          t('num-7-o', 'Solve 5 fraction addition problems', { kind: 'problems', set: P.fracAddSame, count: 5 }),
          t('num-7-p', 'Solve 5 fraction subtraction problems', { kind: 'problems', set: P.fracSubSame, count: 5 }),
          t('num-7-q', 'Solve 5 more fraction addition problems', { kind: 'problems', set: P.fracAddSame, count: 10 }),
          t('num-7-r', 'Solve 5 two-step fraction problems', { kind: 'problems', set: P.fracAddSame2, count: 5 }),
        ],
      },
      {
        id: 'num-8',
        title: 'Big multiplications',
        blurb: 'Multiplying large numbers with the bead frame and the checkerboard.',
        lessons: ['arithmetic.large-bead-frame.d68e0', 'arithmetic.checkerboard.93568'],
        tasks: [
          t('num-8-a', 'Build 2 468 with golden beads', { kind: 'golden-beads', build: 2468 }),
          t('num-8-b', 'Build 9 999: the biggest four-digit number', { kind: 'golden-beads', build: 9999 }),
          t('num-8-c', 'Add 4 321 and 4 321: that is 4 321 taken twice', { kind: 'golden-beads', sum: [4321, 4321] }),
          t('num-8-d', 'Add 3 456 and 4 567', { kind: 'stamp-game', sum: [3456, 4567] }),
          t('num-8-e', 'Add 6 789 and 1 234', { kind: 'stamp-game', sum: [6789, 1234] }),
          t('num-8-f', 'Solve 5 long multiplication problems', { kind: 'problems', set: P.longmul1, count: 5 }),
          t('num-8-g', 'Solve 5 more long multiplication problems', { kind: 'problems', set: P.longmul1, count: 10 }),
          t('num-8-h', 'Solve 3 two-step multiplication problems', { kind: 'problems', set: P.longmul2, count: 3 }),
        ],
      },
      {
        id: 'num-9',
        title: 'Measuring',
        blurb: 'Metres, litres, grams and the clock.',
        lessons: ['arithmetic.story-of-the-meter.c4496', 'arithmetic.introduction-of-the-concept.a51f1'],
        tasks: [
          t('num-9-a', 'Build 100: the centimetres in a metre', { kind: 'golden-beads', build: 100 }),
          t('num-9-b', 'Build 1 000: the millilitres in a litre', { kind: 'golden-beads', build: 1000 }),
          t('num-9-c', 'Build 60: the minutes in an hour', { kind: 'golden-beads', build: 60 }),
          t('num-9-d', 'Solve 5 measuring story problems', { kind: 'problems', set: P.metric1, count: 5 }),
          t('num-9-e', 'Solve 5 more measuring problems', { kind: 'problems', set: P.metric1, count: 10 }),
          t('num-9-f', 'Solve 5 time story problems', { kind: 'problems', set: P.time, count: 5 }),
          t('num-9-g', 'Solve 3 two-step measuring problems', { kind: 'problems', set: P.metric2, count: 3 }),
          t('num-9-h', 'Solve 3 distance and speed problems', { kind: 'problems', set: P.distance, count: 3 }),
        ],
      },
    ],
  },
  {
    album: 'language',
    title: 'Language',
    tagline: 'Letters, words, the parts of speech and where our words come from.',
    glyph: '✒️',
    stages: [
      {
        id: 'lan-1',
        title: 'Sounds and letters',
        blurb: 'Build words with the movable alphabet, sound by sound.',
        lessons: ['language.sandpaper-letters.d298b', 'language.movable-alphabet.d5c93', 'language.small-movable-alphabet.3115e'],
        tasks: [
          t('lan-1-a', 'Write five short words', { kind: 'movable-alphabet', words: ['cat', 'dog', 'sun', 'pin', 'mop'] }, 'Say the word slowly and listen for each sound.'),
          t('lan-1-b', 'Write five more short words', { kind: 'movable-alphabet', words: ['hat', 'pig', 'log', 'bus', 'web'] }),
          t('lan-1-c', 'Write five words with a, e, i, o, u', { kind: 'movable-alphabet', words: ['bag', 'ten', 'six', 'fox', 'cup'] }),
          t('lan-1-d', 'Write five longer words', { kind: 'movable-alphabet', words: ['ship', 'frog', 'nest', 'milk', 'jump'] }),
          t('lan-1-e', 'Write five more longer words', { kind: 'movable-alphabet', words: ['fish', 'duck', 'lamp', 'tent', 'ring'] }),
        ],
      },
      {
        id: 'lan-2',
        title: 'Reading words',
        blurb: 'Reading words and matching them to things.',
        lessons: ['language.object-boxes.2485c', 'language.action-words.c028a', 'language.puzzle-words-1.fd89a'],
        tasks: [
          t('lan-2-a', 'Write words with two sounds together', { kind: 'movable-alphabet', words: ['green', 'bread', 'cloud', 'plant', 'stone'] }),
          t('lan-2-b', 'Write words with sh, ch and th', { kind: 'movable-alphabet', words: ['chair', 'sheep', 'brush', 'thin', 'bath'] }),
          t('lan-2-c', 'Write words with long sounds', { kind: 'movable-alphabet', words: ['train', 'boat', 'rain', 'moon', 'tree'] }),
          t('lan-2-d', 'Write some puzzle words', { kind: 'movable-alphabet', words: ['said', 'come', 'was', 'they', 'once'] }, 'These do not sound the way they look. Look, remember, write.'),
          t('lan-2-e', 'Write five two-part words', { kind: 'movable-alphabet', words: ['apple', 'water', 'happy', 'little', 'yellow'] }),
          t('lan-2-f', 'Discover 5 words about language', { kind: 'words', topic: 'language', count: 5 }),
        ],
      },
      {
        id: 'lan-3',
        title: 'Nouns and articles',
        blurb: 'A noun names a thing. The little words the, a and an go with it.',
        lessons: ['language.function-of-the-noun.48d8e', 'language.function-of-the-article.91782'],
        tasks: [
          t('lan-3-a', 'Write six nouns', { kind: 'movable-alphabet', words: ['table', 'river', 'garden', 'window', 'basket', 'flower'] }),
          t('lan-3-b', 'Write six more nouns', { kind: 'movable-alphabet', words: ['bird', 'house', 'book', 'moon', 'bread', 'friend'] }),
          t('lan-3-c', 'Mark the symbols in "The cat sleeps."', { kind: 'grammar-symbols', sentences: [0] }, 'Black triangle for the noun, small blue triangle for the article.'),
          t('lan-3-d', 'Mark the symbols in "The sun rises."', { kind: 'grammar-symbols', sentences: [16] }),
        ],
      },
      {
        id: 'lan-4',
        title: 'Adjectives',
        blurb: 'Words that tell you more about the noun.',
        lessons: ['language.adjective.a1134'],
        tasks: [
          t('lan-4-a', 'Mark two sentences with adjectives', { kind: 'grammar-symbols', sentences: [1, 10] }),
          t('lan-4-b', 'Mark two more sentences with adjectives', { kind: 'grammar-symbols', sentences: [18, 27] }),
          t('lan-4-c', 'Mark a sentence where "my" describes the noun', { kind: 'grammar-symbols', sentences: [19] }, 'Words like my, your and his tell whose: they take the adjective symbol.'),
          t('lan-4-d', 'Write six adjectives', { kind: 'movable-alphabet', words: ['big', 'small', 'red', 'soft', 'happy', 'cold'] }),
        ],
      },
      {
        id: 'lan-5',
        title: 'Verbs and adverbs',
        blurb: 'The red circle is the verb: what happens. The orange circle tells how.',
        lessons: ['language.verb.6d809', 'language.adverb.85e2a'],
        tasks: [
          t('lan-5-a', 'Mark two sentences with verbs and adverbs', { kind: 'grammar-symbols', sentences: [2, 11] }),
          t('lan-5-b', 'Mark two more', { kind: 'grammar-symbols', sentences: [17, 24] }),
          t('lan-5-c', 'And two more', { kind: 'grammar-symbols', sentences: [31, 33] }),
          t('lan-5-d', 'Write five action words', { kind: 'movable-alphabet', words: ['run', 'jump', 'sing', 'swim', 'read'] }),
          t('lan-5-e', 'Write four adverbs', { kind: 'movable-alphabet', words: ['quickly', 'slowly', 'softly', 'loudly'] }, 'Many adverbs end in -ly.'),
        ],
      },
      {
        id: 'lan-6',
        title: 'Pronouns, prepositions and conjunctions',
        blurb: 'Words that stand in, words that show where, and words that join.',
        lessons: ['language.pronoun.b820d', 'language.preposition.9edcd', 'language.conjunction.455ce'],
        tasks: [
          t('lan-6-a', 'Mark three sentences', { kind: 'grammar-symbols', sentences: [3, 4, 5] }),
          t('lan-6-b', 'Mark two with prepositions', { kind: 'grammar-symbols', sentences: [20, 22] }),
          t('lan-6-c', 'Mark two with pronouns', { kind: 'grammar-symbols', sentences: [28, 29] }),
          t('lan-6-d', 'Mark two with conjunctions', { kind: 'grammar-symbols', sentences: [23, 34] }),
          t('lan-6-e', 'Mark two longer sentences', { kind: 'grammar-symbols', sentences: [7, 12] }),
          t('lan-6-f', 'Write five small joining and placing words', { kind: 'movable-alphabet', words: ['under', 'over', 'behind', 'and', 'but'] }),
        ],
      },
      {
        id: 'lan-7',
        title: 'Interjections and whole sentences',
        blurb: 'Oh! Wow! Now you know all nine symbols.',
        lessons: ['language.interjection.9dfde'],
        tasks: [
          t('lan-7-a', 'Mark three sentences with interjections', { kind: 'grammar-symbols', sentences: [21, 26, 30] }),
          t('lan-7-b', 'Mark five whole sentences', { kind: 'grammar-symbols', sentences: [6, 9, 13, 14, 15] }),
          t('lan-7-c', 'Mark three more', { kind: 'grammar-symbols', sentences: [25, 32, 35] }),
          t('lan-7-d', 'Mark the last one', { kind: 'grammar-symbols', sentences: [8] }),
        ],
      },
      {
        id: 'lan-8',
        title: 'Word study',
        blurb: 'Prefixes, suffixes and compound words.',
        lessons: ['language.suffixes.12e0a', 'language.prefixes.927a7', 'language.compound-words.26901', 'language.word-families.449ee'],
        tasks: [
          t('lan-8-a', 'Write four compound words', { kind: 'movable-alphabet', words: ['sunflower', 'raincoat', 'football', 'bedroom'] }, 'Two words joined into one.'),
          t('lan-8-b', 'Write four more compound words', { kind: 'movable-alphabet', words: ['snowman', 'toothbrush', 'butterfly', 'cupcake'] }),
          t('lan-8-c', 'Write words with prefixes', { kind: 'movable-alphabet', words: ['unhappy', 'replay', 'untie', 'redo'] }, 'un- means not, re- means again.'),
          t('lan-8-d', 'Write words with suffixes', { kind: 'movable-alphabet', words: ['kindness', 'helpful', 'careful', 'slowly'] }),
          t('lan-8-e', 'Write a word family', { kind: 'movable-alphabet', words: ['play', 'player', 'playful', 'replay', 'playing'] }),
        ],
      },
      {
        id: 'lan-9',
        title: 'The story of language',
        blurb: 'Where English comes from, and what old words mean.',
        lessons: ['language.story-of-the-ox-and-the-house.dad1f', 'language.the-origins-of-the-english-language-from-indo-european-to-ge.09a0c', 'language.story-of-the-english-language.7c1b2'],
        tasks: [
          t('lan-9-a', 'Discover 10 word origins', { kind: 'words', topic: 'all', count: 10 }),
          t('lan-9-b', 'Discover 10 more', { kind: 'words', topic: 'all', count: 20 }),
          t('lan-9-c', 'Discover 10 more again', { kind: 'words', topic: 'all', count: 30 }),
          t('lan-9-d', 'Write the names of three old languages', { kind: 'movable-alphabet', words: ['latin', 'greek', 'english'] }),
        ],
      },
    ],
  },
  {
    album: 'geometry',
    title: 'Geometry',
    tagline: 'Shapes, lines, angles and the names that come from Greek.',
    glyph: '📐',
    stages: [
      {
        id: 'geo-1',
        title: 'Shapes around us',
        blurb: 'The shapes in the geometry cabinet and where you can find them at home.',
        lessons: ['geometry.geometry-cabinet.7b829', 'geometry.small-geometric-solids.65972'],
        tasks: [
          t('geo-1-a', 'Discover 8 shape words', { kind: 'words', topic: 'geometry', count: 8 }, 'Circle, cube, sphere… where do their names come from?'),
          t('geo-1-b', 'Write the names of four shapes', { kind: 'movable-alphabet', words: ['circle', 'square', 'cube', 'sphere'] }),
          t('geo-1-c', 'Write four more shapes', { kind: 'movable-alphabet', words: ['triangle', 'rectangle', 'oval', 'cone'] }),
          t('geo-1-d', 'Discover 4 more shape words', { kind: 'words', topic: 'geometry', count: 12 }),
          t('geo-1-e', 'Make a square of bars: the square of 3', { kind: 'bead-bars', table: [3, 3] }),
        ],
      },
      {
        id: 'geo-2',
        title: 'Lines and angles',
        blurb: 'Straight and curved, parallel and crossing, acute and obtuse.',
        lessons: ['geometry.fundamental-concepts.838b6', 'geometry.lines.93b84', 'geometry.angles.9c4f6'],
        tasks: [
          t('geo-2-a', 'Lay two bars of 9 side by side, like parallel lines', { kind: 'bead-bars', table: [9, 2] }),
          t('geo-2-b', 'Write four line words', { kind: 'movable-alphabet', words: ['line', 'point', 'curve', 'parallel'] }),
          t('geo-2-c', 'Write four angle words', { kind: 'movable-alphabet', words: ['acute', 'obtuse', 'right', 'straight'] }),
          t('geo-2-d', 'Discover 8 more geometry words', { kind: 'words', topic: 'geometry', count: 20 }),
          t('geo-2-e', 'Fill the circle with quarters: four right angles', { kind: 'fractions', fill: 4 }, 'Each quarter is a right angle. Four make a full turn.'),
          t('geo-2-f', 'Show one half: a straight angle', { kind: 'fractions', show: [1, 2] }),
        ],
      },
      {
        id: 'geo-3',
        title: 'Triangles and quadrilaterals',
        blurb: 'Three sides, four sides, and all their families.',
        lessons: ['geometry.triangles.fd223', 'geometry.quadrilaterals.972f3', 'geometry.polygons.5b3db'],
        tasks: [
          t('geo-3-a', 'Build a triangle of bars: 3, 4 and 5', { kind: 'bead-bars', make: 12 }, 'Use the 3 bar, the 4 bar and the 5 bar. Together they make 12 beads.'),
          t('geo-3-b', 'Build a triangle of bars: 2, 3 and 4', { kind: 'bead-bars', make: 9 }),
          t('geo-3-c', 'Build a rectangle of bars: 4, 6, 4 and 6', { kind: 'bead-bars', make: 20 }, 'Two long sides and two short sides.'),
          t('geo-3-d', 'Write four triangle words', { kind: 'movable-alphabet', words: ['isosceles', 'scalene', 'equilateral', 'triangle'] }),
          t('geo-3-e', 'Write four quadrilateral words', { kind: 'movable-alphabet', words: ['rhombus', 'trapezium', 'rectangle', 'square'] }),
          t('geo-3-f', 'Discover all the geometry words', { kind: 'words', topic: 'geometry', count: 30 }),
        ],
      },
      {
        id: 'geo-4',
        title: 'Around and inside: perimeter and area',
        blurb: 'How far around a shape, and how much space it covers.',
        lessons: ['geometry.area.7fccf'],
        tasks: [
          t('geo-4-a', 'Make the square of 5 with bars', { kind: 'bead-bars', table: [5, 5] }, 'Five bars of five: the area is 25.'),
          t('geo-4-b', 'Make the square of 6 with bars', { kind: 'bead-bars', table: [6, 6] }),
          t('geo-4-c', 'Make a rectangle 4 by 6', { kind: 'bead-bars', table: [6, 4] }, 'Four bars of six: the area is 24.'),
          t('geo-4-d', 'Make a rectangle 3 by 8', { kind: 'bead-bars', table: [8, 3] }),
          t('geo-4-e', 'Solve 5 perimeter problems', { kind: 'problems', set: P.perimeter1, count: 5 }),
          t('geo-4-f', 'Solve 5 area problems', { kind: 'problems', set: P.area1, count: 5 }),
          t('geo-4-g', 'Solve 4 more perimeter problems', { kind: 'problems', set: P.perimeter1, count: 9 }),
          t('geo-4-h', 'Solve 5 more area problems', { kind: 'problems', set: P.area1, count: 10 }),
          t('geo-4-i', 'Solve 3 two-step perimeter problems', { kind: 'problems', set: P.perimeter2, count: 3 }),
          t('geo-4-j', 'Solve 3 two-step area problems', { kind: 'problems', set: P.area2, count: 3 }),
        ],
      },
    ],
  },
  {
    album: 'biology',
    title: 'Living things',
    tagline: 'Plants, animals and the great story of life.',
    glyph: '🌿',
    stages: [
      {
        id: 'bio-1',
        title: 'The story of life',
        blurb: 'How life came to the Earth, told as a great story.',
        lessons: ['biology.the-story-of-life.fa462'],
        tasks: [
          t('bio-1-a', 'Discover 6 words from the ages of the Earth', { kind: 'words', topic: 'history', count: 6 }),
          t('bio-1-b', 'Write four things every living thing needs', { kind: 'movable-alphabet', words: ['water', 'air', 'food', 'sun'] }),
          t('bio-1-c', 'Write the order life came in', { kind: 'movable-alphabet', words: ['fish', 'frog', 'reptile', 'bird', 'mammal'] }),
        ],
      },
      {
        id: 'bio-2',
        title: 'Parts of a plant',
        blurb: 'Root, stem, leaf, flower, fruit and seed, and what each one does.',
        lessons: ['biology.classified-nomenclature-for-botany.13244', 'biology.needs-of-the-plants.d12b3', 'biology.leaf.c067e', 'biology.root.d06a7'],
        tasks: [
          t('bio-2-a', 'Write the six parts of a plant', { kind: 'movable-alphabet', words: ['root', 'stem', 'leaf', 'flower', 'fruit', 'seed'] }),
          t('bio-2-b', 'Write the parts of a leaf', { kind: 'movable-alphabet', words: ['blade', 'veins', 'margin', 'petiole'] }),
          t('bio-2-c', 'Write four kinds of root', { kind: 'movable-alphabet', words: ['tap', 'fibrous', 'conical', 'tuberous'] }),
          t('bio-2-d', 'Discover 8 plant words', { kind: 'words', topic: 'biology', count: 8 }),
          t('bio-2-e', 'Fill the circle with sixths: six parts of a plant', { kind: 'fractions', fill: 6 }),
        ],
      },
      {
        id: 'bio-3',
        title: 'Flowers, fruits and seeds',
        blurb: 'How plants make new plants.',
        lessons: ['biology.flower.3c762', 'biology.fruit.0e883', 'biology.seed.9720b'],
        tasks: [
          t('bio-3-a', 'Write the parts of a flower', { kind: 'movable-alphabet', words: ['petal', 'sepal', 'stamen', 'pistil'] }),
          t('bio-3-b', 'Write four flower words from the dictionary', { kind: 'movable-alphabet', words: ['pollen', 'anther', 'style', 'capsule'] }),
          t('bio-3-c', 'Fill the circle with quarters: a flower with four petals', { kind: 'fractions', fill: 4 }),
          t('bio-3-d', 'Fill the circle with thirds, like the parts of a seed', { kind: 'fractions', fill: 3 }),
          t('bio-3-e', 'Discover 8 more living-thing words', { kind: 'words', topic: 'biology', count: 16 }),
        ],
      },
      {
        id: 'bio-4',
        title: 'The animal kingdom',
        blurb: 'Vertebrates and invertebrates, and how we sort them.',
        lessons: ['biology.first-knowledge-of-animals.af29a', 'biology.first-classification-of-animals.16569', 'biology.tree-of-life.a91fb'],
        tasks: [
          t('bio-4-a', 'Write the five classes of vertebrates', { kind: 'movable-alphabet', words: ['fish', 'amphibian', 'reptile', 'bird', 'mammal'] }),
          t('bio-4-b', 'Write five invertebrates', { kind: 'movable-alphabet', words: ['insect', 'spider', 'snail', 'worm', 'crab'] }),
          t('bio-4-c', 'Fill the circle with fifths: five classes', { kind: 'fractions', fill: 5 }),
          t('bio-4-d', 'Discover 12 animal words', { kind: 'words', topic: 'biology', count: 28 }),
          t('bio-4-e', 'Discover 12 more animal words', { kind: 'words', topic: 'biology', count: 40 }),
          t('bio-4-f', 'Write the names of four insect groups', { kind: 'movable-alphabet', words: ['beetle', 'butterfly', 'bee', 'fly'] }),
        ],
      },
    ],
  },
  {
    album: 'geography',
    title: 'The Earth',
    tagline: 'Land and water, air and weather, the sun and the seasons.',
    glyph: '🌍',
    stages: [
      {
        id: 'geg-1',
        title: 'Our planet',
        blurb: 'Globes, continents, oceans and flags.',
        lessons: ['geography.first-knowledge-of-the-earth-globes-and-puzzle-maps.a094c', 'geography.flags.8a054', 'geography.contrasting-land-and-water-forms.bdbd4'],
        tasks: [
          t('geg-1-a', 'Discover 6 geography words', { kind: 'words', topic: 'geography', count: 6 }, 'Island, isthmus, peninsula…'),
          t('geg-1-b', 'Write the names of four continents', { kind: 'movable-alphabet', words: ['asia', 'africa', 'europe', 'australia'] }),
          t('geg-1-c', 'Write three more continents', { kind: 'movable-alphabet', words: ['america', 'antarctica', 'oceania'] }),
          t('geg-1-d', 'Write four land and water forms', { kind: 'movable-alphabet', words: ['island', 'lake', 'gulf', 'cape'] }),
          t('geg-1-e', 'Build 7 with golden beads: the continents', { kind: 'golden-beads', build: 7 }),
          t('geg-1-f', 'Build 5 with golden beads: the oceans', { kind: 'golden-beads', build: 5 }),
          t('geg-1-g', 'Discover all the geography words', { kind: 'words', topic: 'geography', count: 9 }),
        ],
      },
      {
        id: 'geg-2',
        title: 'Water',
        blurb: 'Water pushes, water clings, water turns to vapour and back.',
        lessons: ['geography.erosion-by-rain.6beed'],
        tasks: [
          t('geg-2-a', 'Experiment: water pressure', { kind: 'experiment', number: 1 }),
          t('geg-2-b', 'Experiment: surface tension', { kind: 'experiment', number: 2 }),
          t('geg-2-c', 'Experiment: where did the drops come from?', { kind: 'experiment', number: 5 }),
          t('geg-2-d', 'Experiment: the foggy mirror', { kind: 'experiment', number: 6 }),
          t('geg-2-e', 'Experiment: sinking a cork', { kind: 'experiment', number: 7 }),
          t('geg-2-f', 'Write the three forms of water', { kind: 'movable-alphabet', words: ['ice', 'water', 'steam'] }),
          t('geg-2-g', 'Write four water words', { kind: 'movable-alphabet', words: ['rain', 'river', 'ocean', 'cloud'] }),
        ],
      },
      {
        id: 'geg-3',
        title: 'Air',
        blurb: 'Air takes up space, air pushes, warm air rises and makes the wind.',
        lessons: ['geography.air-occupies-space.74fef', 'geography.formation-of-the-winds.1ff45', 'geography.erosion-by-wind.84cbf'],
        tasks: [
          t('geg-3-a', 'Experiment: how heat travels in air', { kind: 'experiment', number: 3 }),
          t('geg-3-b', 'Experiment: what pushed the glass up?', { kind: 'experiment', number: 8 }),
          t('geg-3-c', 'Experiment: air streams', { kind: 'experiment', number: 9 }),
          t('geg-3-d', 'Write four wind words', { kind: 'movable-alphabet', words: ['air', 'wind', 'storm', 'breeze'] }),
        ],
      },
      {
        id: 'geg-4',
        title: 'The sun and the Earth',
        blurb: 'Day and night, the seasons and time zones.',
        lessons: ['geography.the-earth-s-movement-rotation.8c108', 'geography.the-earth-s-movement-day-and-night.0958c', 'geography.the-earth-s-movement-revolution-and-seasons.e5440', 'geography.the-earth-s-movement-time-zones.debb1'],
        tasks: [
          t('geg-4-a', 'Experiment: magic colours', { kind: 'experiment', number: 4 }, 'Light and colour, just like the sun.'),
          t('geg-4-b', 'Write the four seasons', { kind: 'movable-alphabet', words: ['spring', 'summer', 'autumn', 'winter'] }),
          t('geg-4-c', 'Write the four directions', { kind: 'movable-alphabet', words: ['north', 'south', 'east', 'west'] }),
          t('geg-4-d', 'Fill the circle with quarters: the four seasons', { kind: 'fractions', fill: 4 }),
          t('geg-4-e', 'Lay the bar of 6 twice: the twelve months', { kind: 'bead-bars', table: [6, 2] }),
          t('geg-4-f', 'Build 24 with golden beads: the hours in a day', { kind: 'golden-beads', build: 24 }),
          t('geg-4-g', 'Build 365 with golden beads: the days in a year', { kind: 'golden-beads', build: 365 }),
          t('geg-4-h', 'Solve 5 time problems', { kind: 'problems', set: P.time, count: 5 }),
        ],
      },
    ],
  },
  {
    album: 'history',
    title: 'Time and people',
    tagline: 'The long story of the Earth, of people and of how we measure time.',
    glyph: '🕰️',
    stages: [
      {
        id: 'his-1',
        title: 'The great stories',
        blurb: 'Life, the long black strip, and the coming of human beings.',
        lessons: ['history.the-story-of-life.954e6', 'history.long-black-strip.9c700', 'history.the-story-of-the-coming-of-human-beings.8cef9', 'history.the-timeline-of-the-hand.df47d'],
        tasks: [
          t('his-1-a', 'Discover the names of the ages of the Earth', { kind: 'words', topic: 'history', count: 12 }, 'Cambrian, Jurassic… each one is a place or a word from long ago.'),
          t('his-1-b', 'Write the three gifts of human beings', { kind: 'movable-alphabet', words: ['mind', 'love', 'hands'] }),
          t('his-1-c', 'Write four ages of the Earth', { kind: 'movable-alphabet', words: ['cambrian', 'devonian', 'jurassic', 'permian'] }),
          t('his-1-d', 'Build 1 000 with golden beads: the hand made things for a thousand thousand years', { kind: 'golden-beads', build: 1000 }),
        ],
      },
      {
        id: 'his-2',
        title: 'The clock of eras',
        blurb: 'The whole history of the Earth on one clock face.',
        lessons: ['history.clock-of-eras.d1e02'],
        tasks: [
          t('his-2-a', 'Fill the circle with tenths, like the hours on a clock', { kind: 'fractions', fill: 10 }, 'Our circle goes up to tenths: fill it with ten tenths.'),
          t('his-2-b', 'Show one quarter of the clock', { kind: 'fractions', show: [1, 4] }),
          t('his-2-c', 'Show half the clock', { kind: 'fractions', show: [1, 2] }),
          t('his-2-d', 'Show three quarters of the clock', { kind: 'fractions', show: [3, 4] }),
          t('his-2-e', 'Build 12 with golden beads: the hours on the clock', { kind: 'golden-beads', build: 12 }),
        ],
      },
      {
        id: 'his-3',
        title: 'What people need',
        blurb: 'Food, shelter, clothing, and the things that make us human.',
        lessons: ['history.fundamental-human-needs-chart-i.ef994', 'history.fundamental-human-needs-chart-ii.81fea'],
        tasks: [
          t('his-3-a', 'Write five fundamental needs', { kind: 'movable-alphabet', words: ['food', 'shelter', 'clothing', 'transport', 'defence'] }),
          t('his-3-b', 'Write four needs of the spirit', { kind: 'movable-alphabet', words: ['love', 'art', 'music', 'faith'] }),
          t('his-3-c', 'Fill the circle with fifths: five material needs', { kind: 'fractions', fill: 5 }),
        ],
      },
      {
        id: 'his-4',
        title: 'Measuring time',
        blurb: 'Clocks, calendars, BCE and CE.',
        lessons: ['history.introduction-of-the-terms-bce-ce-and-place-arrows.68f6c', 'history.study-of-civilizations.37141'],
        tasks: [
          t('his-4-a', 'Build 60 with golden beads: the minutes in an hour', { kind: 'golden-beads', build: 60 }),
          t('his-4-b', 'Build 365: the days in a year', { kind: 'golden-beads', build: 365 }),
          t('his-4-c', 'Build 2 026: this year', { kind: 'golden-beads', build: 2026 }),
          t('his-4-d', 'Build 2 000: the year the century began', { kind: 'stamp-game', build: 2000 }),
          t('his-4-e', 'Take 1 900 away from 2 026: how long since 1900?', { kind: 'stamp-game', take: [2026, 1900] }),
          t('his-4-f', 'Solve 5 time problems', { kind: 'problems', set: P.time, count: 5 }),
          t('his-4-g', 'Solve 5 more time problems', { kind: 'problems', set: P.time, count: 10 }),
          t('his-4-h', 'Write the days of the week', { kind: 'movable-alphabet', words: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }),
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------- lesson ↔ activity

/**
 * Which lesson of its stage each activity reinforces, as an index into the stage's
 * lessons list. Activities not listed here belong to the stage's first lesson.
 */
const LESSON_OF: Record<string, number> = {
  'num-1-d': 2, 'num-1-e': 2, 'num-1-f': 3, 'num-1-g': 3, 'num-1-h': 1,
  'num-2-f': 1, 'num-2-g': 1, 'num-2-h': 2, 'num-2-i': 2,
  'num-3-a': 2, 'num-3-b': 2, 'num-3-e': 2, 'num-3-f': 1, 'num-3-g': 1, 'num-3-i': 1, 'num-3-k': 1,
  'num-4-a': 2, 'num-4-b': 2, 'num-4-c': 2, 'num-4-d': 2, 'num-4-e': 2, 'num-4-f': 2, 'num-4-g': 2, 'num-4-h': 2, 'num-4-j': 1,
  'num-5-g': 2, 'num-5-h': 2, 'num-5-i': 2, 'num-5-j': 2, 'num-5-k': 1, 'num-5-l': 1,
  'num-6-a': 1, 'num-6-b': 1, 'num-6-c': 1,
  'num-7-i': 1, 'num-7-j': 1, 'num-7-k': 1, 'num-7-l': 1, 'num-7-m': 1, 'num-7-n': 1, 'num-7-o': 2, 'num-7-p': 2, 'num-7-q': 2, 'num-7-r': 2,
  'num-8-f': 1, 'num-8-g': 1, 'num-8-h': 1,
  'num-9-c': 1, 'num-9-f': 1, 'num-9-h': 1,
  'lan-1-a': 1, 'lan-1-b': 1, 'lan-1-d': 2, 'lan-1-e': 2,
  'lan-2-c': 1, 'lan-2-d': 2, 'lan-2-e': 1, 'lan-2-f': 2,
  'lan-3-c': 1, 'lan-3-d': 1,
  'lan-5-b': 1, 'lan-5-c': 1, 'lan-5-e': 1,
  'lan-6-b': 1, 'lan-6-d': 2, 'lan-6-e': 1, 'lan-6-f': 2,
  'lan-8-a': 2, 'lan-8-b': 2, 'lan-8-c': 1, 'lan-8-e': 3,
  'lan-9-b': 1, 'lan-9-c': 2, 'lan-9-d': 1,
  'geo-1-c': 1, 'geo-1-d': 1,
  'geo-2-a': 1, 'geo-2-b': 1, 'geo-2-c': 2, 'geo-2-e': 2, 'geo-2-f': 2,
  'geo-3-c': 1, 'geo-3-e': 1, 'geo-3-f': 2,
  'bio-2-b': 2, 'bio-2-c': 3, 'bio-2-e': 1,
  'bio-3-d': 2, 'bio-3-e': 1,
  'bio-4-a': 1, 'bio-4-b': 1, 'bio-4-c': 1, 'bio-4-e': 2,
  'geg-1-d': 2, 'geg-1-g': 1,
  'geg-3-a': 1, 'geg-3-c': 1, 'geg-3-d': 2,
  'geg-4-a': 1, 'geg-4-b': 2, 'geg-4-d': 2, 'geg-4-e': 2, 'geg-4-f': 1, 'geg-4-g': 2, 'geg-4-h': 3,
  'his-1-b': 2, 'his-1-d': 3,
  'his-3-b': 1,
  'his-4-d': 1, 'his-4-h': 1,
}

for (const p of PATHWAYS) {
  for (const s of p.stages) {
    for (const task of s.tasks) {
      const idx = LESSON_OF[task.id] ?? 0
      task.lesson = s.lessons[Math.min(idx, s.lessons.length - 1)]
    }
  }
}

// ---------------------------------------------------------------- helpers

export const ALL_TASKS: { task: Task; stage: Stage; pathway: Pathway }[] = PATHWAYS.flatMap((p) =>
  p.stages.flatMap((s) => s.tasks.map((task) => ({ task, stage: s, pathway: p }))),
)

/** Activities that reinforce a given album lesson, in path order. */
export function tasksForLesson(lessonId: string) {
  return ALL_TASKS.filter((x) => x.task.lesson === lessonId)
}

export function findTask(id: string | null | undefined) {
  if (!id) return undefined
  return ALL_TASKS.find((x) => x.task.id === id)
}

export function pathwayFor(album: string) {
  return PATHWAYS.find((p) => p.album === album)
}

export function taskHref(task: Task): string {
  const q = `?task=${encodeURIComponent(task.id)}`
  switch (task.spec.kind) {
    case 'words':
      return `/learn/words${q}`
    case 'problems':
      return `/learn/problems/${task.spec.set}${q}`
    case 'experiment':
      return `/learn/experiments${q}`
    default:
      return `/learn/materials/${task.spec.kind}${q}`
  }
}

export interface PathwayProgress {
  total: number
  done: number
  current: Stage | null
  stageState: Record<string, 'done' | 'current' | 'upcoming'>
}

export function pathwayProgress(p: Pathway, tasks: Record<string, { done: string }>): PathwayProgress {
  let total = 0
  let done = 0
  const stageState: Record<string, 'done' | 'current' | 'upcoming'> = {}
  let current: Stage | null = null
  for (const s of p.stages) {
    const n = s.tasks.length
    const d = s.tasks.filter((t) => tasks[t.id]).length
    total += n
    done += d
    if (n > 0 && d === n) stageState[s.id] = 'done'
    else if (!current) {
      current = s
      stageState[s.id] = 'current'
    } else stageState[s.id] = 'upcoming'
  }
  return { total, done, current, stageState }
}

/** The next task that is not yet done, after the given one (same stage first, then the following stages). */
export function nextTaskAfter(taskId: string, tasks: Record<string, { done: string }>): Task | null {
  const hit = findTask(taskId)
  if (!hit) return null
  const stages = hit.pathway.stages
  const si = stages.indexOf(hit.stage)
  for (let i = si; i < stages.length; i++) {
    for (const t of stages[i].tasks) {
      if (t.id === taskId) continue
      if (!tasks[t.id]) return t
    }
  }
  return null
}

export function describeSpec(spec: TaskSpec): string {
  switch (spec.kind) {
    case 'golden-beads':
    case 'stamp-game':
      if (spec.sum) return `${spec.sum[0].toLocaleString()} + ${spec.sum[1].toLocaleString()}`
      if (spec.take) return `${spec.take[0].toLocaleString()} − ${spec.take[1].toLocaleString()}`
      if (spec.build) return spec.build.toLocaleString()
      return ''
    case 'bead-bars':
      if (spec.staircase) return '1 to 10'
      if (spec.table) return `${spec.table[1]} × ${spec.table[0]}`
      if (spec.make) return `= ${spec.make}`
      return ''
    case 'fractions':
      if (spec.fill) return spec.fill === 1 ? '1 whole' : `${spec.fill}/${spec.fill}`
      if (spec.show) return `${spec.show[0]}/${spec.show[1]}`
      return ''
    default:
      return ''
  }
}
