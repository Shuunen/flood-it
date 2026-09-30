// eslint-disable max-nested-callbacks
// eslint-disable max-lines-per-function
import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { randomNumber } from 'shuutils'

const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
const initialSize = { height: 7, width: 7 }

function createSeed (width: number, height: number) {
  let seed = ''
  for (let index = 0; index < width * height; index += 1) seed += randomNumber(0, colors.length - 1)
  return `${width}x${height}_${seed}`
}

function parseSeed (seed: string) {
  const match = /(?<width>\d+)x(?<height>\d+)_(?<cells>\d+)/u.exec(seed)
  if (!match?.groups) return { cells: '', fixedSeed: '', height: 7, width: 7 }
  const width = Number(match.groups.width)
  const height = Number(match.groups.height)
  let { cells } = match.groups
  const gridSize = width * height
  let fixed = false
  // Fix too short
  if (cells.length < gridSize) {
    for (let index = cells.length; index < gridSize; index += 1) cells += randomNumber(0, colors.length - 1)
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

export function App (): JSX.Element {
  const [seed, setSeed] = useState(() => {
    if (typeof globalThis !== 'undefined') {
      const hash = globalThis.location.hash.slice(1)
      if (hash) return hash
    }
    return createSeed(initialSize.width, initialSize.height)
  })
  const [moves, setMoves] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [grid, setGrid] = useState<string[][]>([])
  const [floodColor, setFloodColor] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)
  const [restartKey, setRestartKey] = useState(0)

  // Persist fixed seed in URL when it changes or is auto-fixed
  useEffect(() => {
    if (typeof globalThis !== 'undefined' && seed) {
      const { fixedSeed } = parseSeed(seed)
      if (globalThis.location.hash.slice(1) !== fixedSeed) globalThis.location.hash = fixedSeed
    }
  }, [seed])

  // Generate grid from seed
  useEffect(() => {
    const { width, height, cells, fixedSeed } = parseSeed(seed)
    let idx = 0
    const newGrid = Array.from({ length: height }, () =>
      // eslint-disable-next-line no-return-assign
      Array.from({ length: width }, () => colors[Number(cells[idx += 1] ?? '0')] || colors[0])
    )
    setGrid(newGrid)
    setFloodColor(newGrid[0]?.[0] || '')
    setMoves(0)
    setGameEnded(false)
    setSeed(fixedSeed)
  }, [seed, restartKey])

  // Flood fill algorithm
  // eslint-disable-next-line max-params, consistent-function-scoping
  function flood (column: number, row: number, target: string, replacement: string, board: string[][]) {
    if (
      column < 0 || row < 0 || row >= board.length || column >= board[0].length ||
      board[row][column] !== target || board[row][column] === replacement
    ) return
    board[row][column] = replacement
    flood(column + 1, row, target, replacement, board)
    flood(column - 1, row, target, replacement, board)
    flood(column, row + 1, target, replacement, board)
    flood(column, row - 1, target, replacement, board)
  }

  function handleCellClick (color: string) {
    if (gameEnded || color === floodColor) return
    const newGrid = grid.map(row => [...row])
    flood(0, 0, floodColor, color, newGrid)
    setGrid(newGrid)
    setFloodColor(color)
    setMoves(count => count + 1)
    // Check win
    if (newGrid.flat().every(cell => cell === color)) setGameEnded(true)
  }

  function restart () {
    setRestartKey(key => key + 1)
  }

  function newGame () {
    setSeed(createSeed(grid[0]?.length || initialSize.width, grid.length > 0 ? grid.length : initialSize.height))
  }

  function GameButtons () {
    return (
      <div class="flex justify-center gap-8">
        <button onClick={newGame} class="app-btn" type="button">New Game</button>
        <button onClick={restart} class="app-btn" type="button" disabled={moves === 0}>Restart</button>
      </div>
    )
  }

  return (
    <div class="flex flex-col gap-6">
      <h1 class="text-5xl font-bold tracking-tighter text-green-100 drop-shadow-md">Flood-it</h1>
      <div>{moves} moves</div>
      <div class="mb-2 flex shrink-0 flex-col items-center drop-shadow-md" ref={gridRef}>
        {grid.map((row, yi) => (
          <div key={yi} class="flex">
            {row.map((color, xi) => (
              <div
                key={`${xi}-${yi}`}
                id={`cell-${xi + 1}${yi + 1}`}
                onClick={() => handleCellClick(color)}
                class={`size-14 cursor-pointer transition-all duration-300 ${gameEnded ? 'animate-win' : ''}`}
                style={{ background: color }}
              />
            ))}
          </div>
        ))}
      </div>
      {gameEnded && (
        <p class="mb-2 text-xl underline underline-offset-8">You win in {moves} moves!</p>
      )}
      <GameButtons />
      <p class="text-xs tracking-tighter opacity-50">Game seed : {seed}</p>
      <div />
    </div>
  )
}
