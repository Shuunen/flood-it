import { randomNumber } from 'shuutils'

export const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']

export function createSeed (width: number, height: number) {
  let seed = ''
  for (let i = 0; i < width * height; i += 1) seed += randomNumber(0, colors.length - 1)
  return `${width}x${height}_${seed}`
}

// eslint-disable max-lines-per-function
export function parseSeed (seed: string) {
  const match = /(?<width>\d+)x(?<height>\d+)_(?<cells>\d+)/u.exec(seed)
  if (!match?.groups) return { cells: '', fixedSeed: '', height: 7, width: 7 }
  let width = Number.parseInt(match.groups.width, 10)
  let height = Number.parseInt(match.groups.height, 10)
  let cells = match.groups.cells
  const gridSize = width * height
  let fixed = false
  // Fix too short
  if (cells.length < gridSize) {
    for (let i = cells.length; i < gridSize; i += 1) cells += randomNumber(0, colors.length - 1)
    fixed = true
  }
  // Fix too long
  if (cells.length > gridSize) {
    cells = cells.slice(0, gridSize)
    fixed = true
  }
  const fixedSeed = `${width}x${height}_${cells}`
  return { cells, fixedSeed: fixed ? fixedSeed : seed, height, width }
}

// Flood fill algorithm
// eslint-disable-next-line max-params
export function flood (x: number, y: number, target: string, replacement: string, grid: string[][]) {
  if (
    x < 0 || y < 0 || y >= grid.length || x >= grid[0].length ||
    grid[y][x] !== target || grid[y][x] === replacement
  ) return
  grid[y][x] = replacement
  flood(x + 1, y, target, replacement, grid)
  flood(x - 1, y, target, replacement, grid)
  flood(x, y + 1, target, replacement, grid)
  flood(x, y - 1, target, replacement, grid)
}