import { BOARD, cellRect } from '../game/layout.ts'
import { floodStagger, type GameState } from '../game/state.ts'
import { neighbours } from '../logic/board.ts'
import { alpha, clamp, easeOutBack, mix, noise, ring, waterColor } from './theme.ts'

const GAP = 5
const TANK_PAD = 26

type Direction = 'down' | 'left' | 'right' | 'up'
type Side = 'down' | 'left' | 'right' | 'up'
type Look = { animating: boolean; prog: number; scale: number; shown: number }

/** The cell the water comes from : a neighbour one step closer to the corner where it was poured, none for that corner. */
function parentOf(state: GameState, index: number): number {
  const step = state.dist[index] ?? -1
  if (step <= 0) return -1
  return neighbours(index, state.width, state.height).find(near => state.dist[near] === step - 1) ?? -1
}

/** Which way the water moves while it crosses a cell. The first cell is fed from above, as if a valve opened over it. */
function directionOf(state: GameState, index: number, parent: number): Direction {
  if (parent === -1) return 'down'
  if (parent === index - 1) return 'right'
  if (parent === index + 1) return 'left'
  return parent === index - state.width ? 'down' : 'up'
}

/** The side of a cell the water comes in by, and the side of its parent it leaves from. */
const SIDES: Record<Direction, [Side, Side]> = { down: ['up', 'down'], left: ['right', 'left'], right: ['left', 'right'], up: ['down', 'up'] }

/** What a cell looks like right now : which color is on screen, how far the flowing water has come into it, how big it is. */
function lookAt(state: GameState, index: number, frame: number): Look {
  const column = index % state.width
  const row = Math.floor(index / state.width)
  const stagger = floodStagger(state.width)
  const step = state.dist[index] ?? -1
  let prog = 1
  let pop = 0
  if (step >= 0) {
    const local = frame - state.moveAt - step * stagger
    if (state.prev[index] === state.cells[index]) pop = local >= 0 && local < 30 ? Math.sin((Math.PI * local) / 30) : 0
    else prog = clamp(local / stagger)
  }
  const intro = clamp((frame - state.newGameAt - (row + column) * 2) / 22)
  let scale = 1 + pop * 0.05
  if (intro < 1) scale *= 0.55 + 0.45 * easeOutBack(intro)
  if (state.win?.celebrated === true && state.phase !== 'players') {
    const wave = frame - state.win.at - (row + column) * 3
    if (wave > 0 && wave < 150) scale *= 1 + 0.09 * Math.sin(wave / 4) * Math.exp(-wave / 60)
  }
  return { animating: prog > 0 && prog < 1, prog, scale: intro <= 0 ? 0 : scale, shown: prog >= 1 ? state.cells[index] : state.prev[index] }
}

type Point = [number, number]

/** The water front in a cell : a wavy line moving across it from the side the water comes in by. */
function flowFront(direction: Direction, width: number, height: number, prog: number, wobble: number): { fill: string; front: Point[]; place: (along: number, across: number) => Point } {
  const horizontal = direction === 'right' || direction === 'left'
  const length = horizontal ? width : height
  const span = horizontal ? height : width
  const amplitude = (1 - prog) * span * 0.09 + 1.5
  const reach = prog * (length + amplitude * 2)
  const place = (along: number, across: number): Point => {
    if (direction === 'right') return [along, across]
    if (direction === 'left') return [width - along, across]
    return direction === 'down' ? [across, along] : [across, height - along]
  }
  const front = Array.from({ length: 11 }, (_unused, part): Point => place(reach + Math.sin((part / 10) * Math.PI * 2.5 + wobble) * amplitude, (span * part) / 10))
  const edges = [place(-4, -2), ...front, place(-4, span + 2)]
  const fill = `M${edges.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`
  return { fill, front, place }
}

function Flow({ color, direction, frame, height, index, prog, width }: { color: number; direction: Direction; frame: number; height: number; index: number; prog: number; width: number }) {
  const water = waterColor(color)
  const { fill, front, place } = flowFront(direction, width, height, prog, frame / 4 + index)
  const horizontal = direction === 'right' || direction === 'left'
  const length = horizontal ? width : height
  const span = horizontal ? height : width
  const id = `flow-${index}`
  const foam = prog > 0.04 && prog < 0.96 ? 0.9 : 0
  return (
    <svg height={height} style={{ left: 0, position: 'absolute', top: 0 }} viewBox={`0 0 ${width} ${height}`} width={width}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={water.light} />
          <stop offset="0.4" stopColor={water.base} />
          <stop offset="1" stopColor={mix(water.base, water.dark, 0.3)} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <path d={`M${front.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`} fill="none" opacity={foam} stroke="rgba(255,255,255,0.75)" strokeLinecap="round" strokeWidth={3} />
      {[0, 1, 2, 3].map(dot => {
        const [x, y] = place(Math.max(0, prog * length * 1.05 - 3 - noise(index, dot) * 9), span * (0.1 + 0.8 * noise(index, dot + 5)))
        return <circle cx={x} cy={y} fill="rgba(255,255,255,0.9)" key={dot} opacity={foam} r={1.6 + noise(index, dot + 9) * 3} />
      })}
      {[0, 1].map(bubble => {
        const [x, y] = place(prog * length * 0.9 * noise(index, bubble + 30), span * (0.15 + 0.7 * noise(index, bubble + 40)))
        return <circle cx={x} cy={y} fill="rgba(255,255,255,0.5)" key={bubble} opacity={prog > 0.2 ? 0.8 : 0} r={1.5 + noise(index, bubble + 50) * 2.5} />
      })}
    </svg>
  )
}

/** A soft light on the top of a body of water, where it meets the air. */
function shading(up: boolean): string {
  return up ? 'none' : 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0) 50%)'
}

/** The water of the board : cells of one color merge into one body, and a cell being flooded is joined to the one the water comes from. */
function Cells({ frame, state }: { frame: number; state: GameState }) {
  const { height, width } = state
  const looks = state.cells.map((_color, index) => lookAt(state, index, frame))
  const same = (from: number, to: number) => !looks[from].animating && !looks[to].animating && looks[from].shown === looks[to].shown && looks[from].scale === 1 && looks[to].scale === 1
  const directions = new Map<number, Direction>()
  const joined = new Set<string>()
  for (const [index, look] of looks.entries()) {
    if (!look.animating) continue
    const parent = parentOf(state, index)
    const direction = directionOf(state, index, parent)
    directions.set(index, direction)
    joined.add(`${index}:${SIDES[direction][0]}`)
    if (parent !== -1) joined.add(`${parent}:${SIDES[direction][1]}`)
  }
  return (
    <>
      {looks.map((look, index) => {
        const rect = cellRect(index, width, height)
        const column = index % width
        const row = Math.floor(index / width)
        const up = (row > 0 && same(index, index - width)) || joined.has(`${index}:up`)
        const down = (row < height - 1 && same(index, index + width)) || joined.has(`${index}:down`)
        const left = (column > 0 && same(index, index - 1)) || joined.has(`${index}:left`)
        const right = (column < width - 1 && same(index, index + 1)) || joined.has(`${index}:right`)
        const x = rect.x + (left ? 0 : GAP / 2)
        const y = rect.y + (up ? 0 : GAP / 2)
        const w = rect.x + rect.width - (right ? 0 : GAP / 2) - x
        const h = rect.y + rect.height - (down ? 0 : GAP / 2) - y
        const radius = Math.min(rect.width, rect.height) * 0.24
        const direction = directions.get(index)
        return (
          <div
            key={index}
            style={{
              backgroundColor: waterColor(look.shown).base,
              backgroundImage: shading(up),
              borderBottomLeftRadius: down || left ? 0 : radius,
              borderBottomRightRadius: down || right ? 0 : radius,
              borderTopLeftRadius: up || left ? 0 : radius,
              borderTopRightRadius: up || right ? 0 : radius,
              height: h,
              left: x - BOARD.x,
              opacity: look.scale <= 0 ? 0 : 1,
              overflow: 'hidden',
              position: 'absolute',
              top: y - BOARD.y,
              transform: look.scale === 1 ? 'none' : `scale(${Math.max(look.scale, 0.001).toFixed(3)})`,
              width: w,
            }}
          >
            {direction ? <Flow color={state.cells[index]} direction={direction} frame={frame} height={h} index={index} prog={look.prog} width={w} /> : null}
          </div>
        )
      })}
    </>
  )
}

/** Drops thrown up where the water is poured. */
function Droplets({ frame, state }: { frame: number; state: GameState }) {
  const elapsed = frame - state.moveAt
  if (state.moves === 0 || elapsed < 0 || elapsed > 60) return null
  const cell = cellRect(0, state.width, state.height)
  const water = waterColor(state.cells[0])
  return (
    <>
      {Array.from({ length: 14 }, (_unused, index) => {
        const angle = -Math.PI / 2 + (noise(index, state.moves) - 0.5) * 2.2
        const speed = 7 + noise(index, state.moves + 9) * 9
        const x = cell.x + cell.width / 2 + Math.cos(angle) * speed * elapsed
        const y = cell.y + cell.height / 2 + Math.sin(angle) * speed * elapsed + 0.42 * elapsed * elapsed
        const radius = 4 + noise(index, state.moves + 3) * 7
        return (
          <div
            key={index}
            style={{
              backgroundColor: water.light,
              borderRadius: radius,
              boxShadow: `0 0 10px ${alpha(water.base, 0.8)}`,
              height: radius * 2,
              left: x - radius,
              opacity: clamp(1 - elapsed / 60),
              position: 'absolute',
              top: y - radius,
              width: radius * 2,
            }}
          />
        )
      })}
    </>
  )
}

/** The glass tank holding the water, with a slow light passing over it. */
export function Board({ frame, state }: { frame: number; state: GameState }) {
  const band = ((Math.floor(frame / 3) * 4.2) % (BOARD.width + 700)) - 350
  return (
    <>
      <div
        style={{
          backgroundColor: '#03101f',
          borderRadius: 46,
          boxShadow: `${ring(2, 'rgba(190,225,255,0.38)')}, 0 34px 90px rgba(0,0,0,0.6), 0 0 70px rgba(80,170,255,0.18), inset 0 0 50px rgba(120,200,255,0.16)`,
          height: BOARD.height + TANK_PAD * 2,
          left: BOARD.x - TANK_PAD,
          position: 'absolute',
          top: BOARD.y - TANK_PAD,
          width: BOARD.width + TANK_PAD * 2,
        }}
      />
      <div style={{ borderRadius: 30, height: BOARD.height, left: BOARD.x, overflow: 'hidden', position: 'absolute', top: BOARD.y, width: BOARD.width }}>
        <Cells frame={frame} state={state} />
        <div
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 100%)',
            height: BOARD.height * 1.6,
            left: band,
            position: 'absolute',
            top: -BOARD.height * 0.3,
            transform: 'rotate(18deg)',
            width: 220,
          }}
        />
      </div>
      <Droplets frame={frame} state={state} />
      <div
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 30%)',
          borderRadius: 46,
          height: BOARD.height + TANK_PAD * 2,
          left: BOARD.x - TANK_PAD,
          position: 'absolute',
          top: BOARD.y - TANK_PAD,
          width: BOARD.width + TANK_PAD * 2,
        }}
      />
    </>
  )
}
