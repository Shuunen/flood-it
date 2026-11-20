/** Board sizes the player can pick, each with its own number of water colors. */
export type SizeId = 'l' | 'm' | 's'

export type Size = { colors: number; height: number; id: SizeId; label: string; width: number }

export const SIZES: readonly Size[] = [
  { colors: 4, height: 7, id: 's', label: 'Small', width: 7 },
  { colors: 5, height: 10, id: 'm', label: 'Medium', width: 10 },
  { colors: 6, height: 14, id: 'l', label: 'Large', width: 14 },
]

export type Board = { cells: number[]; colors: number; height: number; width: number }

export type Move = {
  /** how many cells of the new color were already there and got swallowed by the flood */
  absorbed: number
  /** the board after the move */
  cells: number[]
  /** steps from the top-left cell through the flooded region, -1 for the cells outside of it */
  dist: number[]
  /** the biggest distance, the flood front's last step */
  maxDist: number
}

export function sizeById(id: string): Size {
  return SIZES.find(size => size.id === id) ?? SIZES[0]
}

/** A small stable text hash (FNV-1a), to turn words and numbers into a random seed. */
export function hashText(text: string): number {
  let hash = 2_166_136_261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

/** A seeded random generator (mulberry32) : same seed, same numbers. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

/** A game seed looks like `7x7x4_0123…`, width x height x colors then one digit per cell. */
export function createSeed(size: Size, rng: () => number): string {
  let cells = ''
  for (let index = 0; index < size.width * size.height; index += 1) cells += Math.floor(rng() * size.colors)
  return `${size.width}x${size.height}x${size.colors}_${cells}`
}

export function parseSeed(seed: string): Board | undefined {
  const match = /^(?<width>\d+)x(?<height>\d+)x(?<colors>\d+)_(?<digits>\d+)$/u.exec(seed)
  if (!match?.groups) return undefined
  const width = Number(match.groups.width)
  const height = Number(match.groups.height)
  const colors = Number(match.groups.colors)
  const cells = [...match.groups.digits].map(Number)
  if (width < 2 || height < 2 || colors < 2 || colors > 9 || cells.length !== width * height || cells.some(cell => cell >= colors)) return undefined
  return { cells, colors, height, width }
}

export function neighbours(index: number, width: number, height: number): number[] {
  const column = index % width
  const row = Math.floor(index / width)
  const found: number[] = []
  if (row > 0) found.push(index - width)
  if (column > 0) found.push(index - 1)
  if (column < width - 1) found.push(index + 1)
  if (row < height - 1) found.push(index + width)
  return found
}

/** Steps from the top-left cell through the cells sharing its color, -1 elsewhere. */
export function floodDistances(cells: readonly number[], width: number, height: number): number[] {
  const dist = cells.map(() => -1)
  dist[0] = 0
  const queue = [0]
  for (const current of queue)
    for (const next of neighbours(current, width, height)) {
      if (dist[next] !== -1 || cells[next] !== cells[0]) continue
      dist[next] = dist[current] + 1
      queue.push(next)
    }
  return dist
}

/** Floods the top-left region with `color`, or returns nothing when that changes nothing. */
export function playMove(cells: readonly number[], width: number, height: number, color: number): Move | undefined {
  if (color === cells[0] || color < 0) return undefined
  const before = floodDistances(cells, width, height)
  const next = cells.map((cell, index) => (before[index] === -1 ? cell : color))
  const dist = floodDistances(next, width, height)
  const absorbed = dist.filter((step, index) => step !== -1 && before[index] === -1).length
  return { absorbed, cells: next, dist, maxDist: Math.max(...dist) }
}

export function isSolved(cells: readonly number[]): boolean {
  return cells.every(cell => cell === cells[0])
}
