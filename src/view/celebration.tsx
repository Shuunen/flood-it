import { BOARD, STAGE, WIN_AGAIN, WIN_CARD, type Rect } from '../game/layout.ts'
import { isBigWin, type GameState, type Win } from '../game/state.ts'
import { Button, hovering, Star, Text, type Pointer } from './parts.tsx'
import { alpha, clamp, easeOutBack, easeOutCubic, GOLD, INK, INK_SOFT, mix, noise, WATER, ring } from './theme.ts'

const CENTER = { x: BOARD.x + BOARD.width / 2, y: BOARD.y + BOARD.height / 2 }
const FIREWORK_COLORS = ['#ffd45e', '#ff5fa2', '#6fd6ff', '#9dff6a', '#c79bff', '#ffb04a']

/** Bubbles and colored drops rising over the whole stage, for as long as the win screen stays. */
function Confetti({ t }: { t: number }) {
  return (
    <>
      {Array.from({ length: 40 }, (_unused, index) => {
        const delay = noise(index, 1) * 70
        const speed = 3 + noise(index, 2) * 5
        const cycle = (STAGE.height + 120) / speed
        const age = t - delay
        if (age < 0) return null
        const rise = (age % cycle) * speed
        const radius = 7 + noise(index, 3) * 15
        const water = WATER[index % WATER.length]
        const x = 120 + noise(index + Math.floor(age / cycle) * 7, 4) * (STAGE.width - 240) + Math.sin(age / 22 + index) * 26
        return (
          <div
            key={index}
            style={{
              backgroundImage: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), ${water.light} 24%, ${water.base} 70%)`,
              borderRadius: radius,
              boxShadow: ring(1.5, 'rgba(255,255,255,0.7)'),
              height: radius * 2,
              left: x,
              position: 'absolute',
              top: STAGE.height + 60 - rise,
              width: radius * 2,
            }}
          />
        )
      })}
    </>
  )
}

/** Rings spreading over the stage from the middle of the board. */
function Shockwaves({ color, t }: { color: string; t: number }) {
  return (
    <>
      {[0, 14, 30].map((delay, index) => {
        const age = t - delay
        if (age <= 0 || age > 110) return null
        const radius = age * 15
        return (
          <div
            key={delay}
            style={{ borderRadius: radius, boxShadow: ring(10 - index * 3, alpha(color, 0.6 * (1 - age / 110))), height: radius * 2, left: CENTER.x - radius, position: 'absolute', top: CENTER.y - radius, width: radius * 2 }}
          />
        )
      })}
    </>
  )
}

/** Golden light turning behind the board. */
function Rays({ t }: { t: number }) {
  const power = clamp(t / 40) * (0.8 + 0.2 * Math.sin(t / 14))
  return (
    <>
      <div
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,214,110,0.55) 0%, rgba(255,214,110,0.12) 38%, rgba(255,214,110,0) 66%)',
          borderRadius: 1100,
          height: 2200,
          left: CENTER.x - 1100,
          opacity: power,
          position: 'absolute',
          top: CENTER.y - 1100,
          width: 2200,
        }}
      />
      <div
        style={{
          backgroundImage: 'repeating-conic-gradient(from 0deg, rgba(255,224,130,0.26) 0deg 9deg, rgba(255,224,130,0) 9deg 24deg)',
          borderRadius: 1300,
          height: 2600,
          left: CENTER.x - 1300,
          opacity: power,
          position: 'absolute',
          top: CENTER.y - 1300,
          transform: `rotate(${t * 0.18}deg)`,
          width: 2600,
        }}
      />
    </>
  )
}

const FIREWORK_SPOTS = [
  { x: 250, y: 300 },
  { x: 1670, y: 340 },
  { x: 380, y: 640 },
  { x: 1540, y: 640 },
  { x: 700, y: 70 },
  { x: 1230, y: 80 },
  { x: 150, y: 520 },
  { x: 1780, y: 540 },
]

/** One burst after another around the board. */
function Fireworks({ t }: { t: number }) {
  const spacing = 24
  const life = 100
  const last = Math.floor((t - 8) / spacing)
  const first = Math.max(0, Math.floor((t - 8 - life) / spacing) + 1)
  const bursts: number[] = []
  for (let burst = first; burst <= last; burst += 1) bursts.push(burst)
  return (
    <>
      {bursts.map(burst => {
        const age = t - 8 - burst * spacing
        const spot = FIREWORK_SPOTS[(burst * 3 + Math.floor(noise(burst, 8) * 3)) % FIREWORK_SPOTS.length]
        const color = FIREWORK_COLORS[burst % FIREWORK_COLORS.length]
        const other = FIREWORK_COLORS[(burst + 2) % FIREWORK_COLORS.length]
        const fade = clamp(1 - age / life)
        return (
          <div key={burst}>
            {age < 10 ? (
              <div
                style={{
                  backgroundImage: `radial-gradient(circle, #fff 0%, ${alpha(color, 0.8)} 40%, ${alpha(color, 0)} 70%)`,
                  borderRadius: 110,
                  height: 220,
                  left: spot.x - 110,
                  opacity: 1 - age / 10,
                  position: 'absolute',
                  top: spot.y - 110,
                  width: 220,
                }}
              />
            ) : null}
            {Array.from({ length: 16 }, (_unused, spark) => {
              const angle = (Math.PI * 2 * spark) / 16 + noise(spark, burst) * 0.25
              const reach = (5.5 + noise(spark, burst + 3) * 3.5) * 24 * (1 - Math.exp(-age / 24))
              const x = spot.x + Math.cos(angle) * reach
              const y = spot.y + Math.sin(angle) * reach + 0.018 * age * age
              const size = 3 + 5 * fade
              const tint = spark % 2 === 0 ? color : other
              return (
                <div
                  key={spark}
                  style={{ backgroundColor: mix(tint, '#ffffff', 0.35), borderRadius: size, boxShadow: `0 0 12px ${alpha(tint, 0.95)}`, height: size * 2, left: x - size, opacity: fade, position: 'absolute', top: y - size, width: size * 2 }}
                />
              )
            })}
            {Array.from({ length: 8 }, (_unused, spark) => {
              const angle = (Math.PI * 2 * spark) / 8 + 0.3
              const reach = 9 * 24 * (1 - Math.exp(-(age - 6) / 24))
              if (age < 6) return null
              return (
                <div
                  key={spark}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 3,
                    height: 6,
                    left: spot.x + Math.cos(angle) * reach - 3,
                    opacity: fade * 0.9,
                    position: 'absolute',
                    top: spot.y + Math.sin(angle) * reach + 0.018 * age * age - 3,
                    width: 6,
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </>
  )
}

function Trophy({ size, x, y }: { size: number; x: number; y: number }) {
  return (
    <svg height={size} style={{ left: x - size / 2, position: 'absolute', top: y - size / 2 }} viewBox="0 0 100 100" width={size}>
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.5" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#c27a00" />
        </linearGradient>
      </defs>
      <path d="M28 22 H14 C14 42 22 50 33 50" fill="none" stroke="url(#gold)" strokeLinecap="round" strokeWidth="7" />
      <path d="M72 22 H86 C86 42 78 50 67 50" fill="none" stroke="url(#gold)" strokeLinecap="round" strokeWidth="7" />
      <path d="M26 12 H74 V40 C74 58 63 68 50 68 C37 68 26 58 26 40 Z" fill="url(#gold)" stroke="#fff6c8" strokeWidth="2.5" />
      <rect fill="url(#gold)" height="14" stroke="#fff6c8" strokeWidth="2" width="10" x="45" y="68" />
      <rect fill="url(#gold)" height="9" rx="3" stroke="#fff6c8" strokeWidth="2" width="38" x="31" y="81" />
      <path d="M34 20 C33 36 36 48 44 56" fill="none" stroke="rgba(255,255,255,0.75)" strokeLinecap="round" strokeWidth="5" />
    </svg>
  )
}

function Lines({ best, count, win }: { best: boolean; count: number; win: Win }) {
  const top = best ? 204 : 190
  let hint = `now beat ${win.moves} moves !`
  if (win.previousBest !== undefined) hint = win.newBest ? `previous best ${win.previousBest}   now ${count}` : `your best is ${win.previousBest} - can you beat it ?`
  else if (win.record !== undefined) hint = win.house ? `the best before was ${win.record} moves` : `the best on this puzzle is ${win.record} moves`
  return (
    <>
      <Text align="center" height={80} size={58} weight={800} width={WIN_CARD.width} x={0} y={top}>
        {`in ${win.moves} ${win.moves === 1 ? 'move' : 'moves'}`}
      </Text>
      <Text align="center" color={INK_SOFT} height={40} size={30} weight={600} width={WIN_CARD.width} x={0} y={top + 84}>
        {hint}
      </Text>
      {win.newBest && win.house ? (
        <Text align="center" color="#5a3a00" height={52} size={28} spacing={3} style={{ backgroundColor: GOLD, borderRadius: 26 }} weight={800} width={300} x={(WIN_CARD.width - 300) / 2} y={top + 148}>
          HOUSE RECORD
        </Text>
      ) : null}
    </>
  )
}

function local(rect: Rect): Rect {
  return { ...rect, x: rect.x - WIN_CARD.x, y: rect.y - WIN_CARD.y }
}

function Card({ pointer, state, t }: { pointer: Pointer; state: GameState; t: number }) {
  const win = state.win
  if (!win) return null
  const best = isBigWin(win)
  const grow = easeOutBack(clamp(t / 24))
  const count = win.previousBest === undefined ? win.moves : Math.round(win.previousBest + (win.moves - win.previousBest) * easeOutCubic(clamp((t - 50) / 60)))
  const pulse = 1 + 0.035 * Math.sin(t / 7)
  let title = 'You win!'
  if (best) title = win.newBest ? 'New best!' : 'House record!'
  return (
    <div style={{ height: WIN_CARD.height, left: WIN_CARD.x, opacity: clamp(t / 10), position: 'absolute', top: WIN_CARD.y, transform: `scale(${grow.toFixed(3)})`, width: WIN_CARD.width }}>
      <div
        style={{
          backgroundColor: 'rgba(6,24,52,0.92)',
          backgroundImage: best ? 'linear-gradient(160deg, rgba(255,214,110,0.28) 0%, rgba(255,214,110,0.04) 60%)' : 'linear-gradient(160deg, rgba(160,220,255,0.2) 0%, rgba(160,220,255,0.03) 60%)',
          borderRadius: 56,
          boxShadow: `${ring(4, best ? GOLD : 'rgba(190,230,255,0.7)')}, ${best ? '0 0 90px rgba(255,200,70,0.55), 0 30px 80px rgba(0,0,0,0.6)' : '0 0 60px rgba(100,190,255,0.4), 0 30px 80px rgba(0,0,0,0.6)'}`,
          height: WIN_CARD.height,
          position: 'absolute',
          width: WIN_CARD.width,
        }}
      />
      <Text
        align="center"
        color={best ? GOLD : INK}
        height={130}
        size={best ? 108 : 100}
        spacing={-2}
        style={{ textShadow: best ? '0 0 40px rgba(255,190,60,0.9), 0 6px 0 rgba(120,70,0,0.6)' : '0 6px 30px rgba(60,160,255,0.8)', transform: `scale(${best ? pulse.toFixed(3) : 1})` }}
        weight={900}
        width={WIN_CARD.width}
        x={0}
        y={best ? 66 : 60}
      >
        {title}
      </Text>
      <Lines best={best} count={count} win={win} />
      <Button hot={hovering(pointer, WIN_AGAIN)} keycap="R" label="Try again" primary rect={local(WIN_AGAIN)} />
    </div>
  )
}

/** The party : shown from the moment the water has covered the board, until the player goes on. */
export function Celebration({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  const win = state.win
  if (state.phase !== 'won' || !win?.celebrated) return null
  const t = frame - win.at
  if (t < 0) return null
  const best = isBigWin(win)
  return (
    <>
      {best ? <Rays t={t} /> : null}
      <Shockwaves color={best ? GOLD : '#9fdcff'} t={t} />
      {best ? <Fireworks t={t} /> : null}
      <Confetti t={t} />
      <Card pointer={pointer} state={state} t={t} />
      {best ? <Trophy size={170} x={CENTER.x} y={WIN_CARD.y + 6 + Math.sin(t / 12) * 6} /> : null}
      {best
        ? [0, 1, 2].map(index => {
            const born = 18 + index * 10
            const grow = easeOutBack(clamp((t - born) / 16))
            return <Star key={index} size={Math.max(1, (index === 1 ? 92 : 68) * grow)} x={CENTER.x + (index - 1) * 150} y={WIN_CARD.y - 70 + (index === 1 ? -28 : 0)} />
          })
        : null}
    </>
  )
}
