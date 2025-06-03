import { useEffect, useRef, useState } from 'preact/hooks'
import { randomNumber } from 'shuutils'

const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
const initialSize = { height: 7, width: 7 }

function createSeed (width: number, height: number) {
  let seed = ''
  for (let i = 0; i < width * height; i++) {
    seed += randomNumber(0, colors.length - 1)
  }
  return `${width}x${height}_${seed}`
}

function parseSeed (seed: string) {
  const match = /(?<width>\d+)x(?<height>\d+)_(?<cells>\d+)/u.exec(seed)
  if (!match?.groups) return { width: 7, height: 7, cells: '', fixedSeed: '' }
  let width = parseInt(match.groups.width, 10)
  let height = parseInt(match.groups.height, 10)
  let cells = match.groups.cells
  const gridSize = width * height
  let fixed = false
  // Fix too short
  if (cells.length < gridSize) {
    for (let i = cells.length; i < gridSize; i++) {
      cells += randomNumber(0, colors.length - 1)
    }
    fixed = true
  }
  // Fix too long
  if (cells.length > gridSize) {
    cells = cells.slice(0, gridSize)
    fixed = true
  }
  const fixedSeed = `${width}x${height}_${cells}`
  return { width, height, cells, fixedSeed: fixed ? fixedSeed : seed }
}

export function App () {
  const [seed, setSeed] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
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
    if (typeof window !== 'undefined' && seed) {
      const { fixedSeed } = parseSeed(seed)
      if (window.location.hash.slice(1) !== fixedSeed) {
        window.location.hash = fixedSeed
      }
    }
  }, [seed])

  // Generate grid from seed
  useEffect(() => {
    const { width, height, cells, fixedSeed } = parseSeed(seed)
    let idx = 0
    const newGrid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => colors[parseInt(cells[idx++] ?? '0', 10)] || colors[0])
    )
    setGrid(newGrid)
    setFloodColor(newGrid[0]?.[0] || '')
    setMoves(0)
    setGameEnded(false)
    setSeed(fixedSeed)
  }, [seed, restartKey])

  // Flood fill algorithm
  function flood (x: number, y: number, target: string, replacement: string, g: string[][]) {
    if (
      x < 0 || y < 0 || y >= g.length || x >= g[0].length ||
      g[y][x] !== target || g[y][x] === replacement
    ) return
    g[y][x] = replacement
    flood(x + 1, y, target, replacement, g)
    flood(x - 1, y, target, replacement, g)
    flood(x, y + 1, target, replacement, g)
    flood(x, y - 1, target, replacement, g)
  }

  function handleCellClick (color: string) {
    if (gameEnded || color === floodColor) return
    const newGrid = grid.map(row => [...row])
    flood(0, 0, floodColor, color, newGrid)
    setGrid(newGrid)
    setFloodColor(color)
    setMoves(m => m + 1)
    // Check win
    if (newGrid.flat().every(c => c === color)) setGameEnded(true)
  }

  function restart () {
    setRestartKey(k => k + 1)
  }

  function newGame () {
    setSeed(createSeed(grid[0]?.length || 7, grid.length || 7))
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
