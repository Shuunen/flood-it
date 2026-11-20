import { dropRect, HOME_BUTTON, NEW_GAME_BUTTON, PLAYER_CHIP, RESTART_BUTTON, sizeButton, SWITCH_BUTTON, STAGE } from '../game/layout.ts'
import type { GameState } from '../game/state.ts'
import { SIZES } from '../logic/board.ts'
import { bestOn, findProfile, houseRecord, leaderboard, solvedCount } from '../logic/profiles.ts'
import { Avatar, Button, Drop, Glass, hovering, Text, type Pointer } from './parts.tsx'
import { accentGlow, alpha, clamp, GOLD, INK, INK_SOFT, primaryGradient, ring, useLook, waterColor } from './theme.ts'

function Drops({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  const flooded = state.cells[0]
  return (
    <>
      {Array.from({ length: state.colors }, (_unused, index) => {
        const rect = dropRect(index, state.colors)
        const water = waterColor(index)
        const current = index === flooded
        const hot = !current && state.phase === 'play' && hovering(pointer, rect)
        const bob = Math.sin(frame / 38 + index * 1.3) * 3
        const scale = current ? 0.82 : hot ? 1.12 : 1
        return (
          <div key={index}>
            <div
              style={{
                backgroundImage: `radial-gradient(circle at 34% 26%, ${alpha('#ffffff', 0.95)} 0%, ${water.light} 14%, ${water.base} 56%, ${water.dark} 100%)`,
                borderRadius: rect.width / 2,
                boxShadow: `${ring(3, current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)')}, 0 14px 28px rgba(0,0,0,0.45), 0 0 ${hot ? 46 : 26}px ${alpha(water.base, hot ? 0.9 : 0.5)}, inset 0 -10px 18px ${alpha(water.dark, 0.55)}`,
                height: rect.height,
                left: rect.x,
                opacity: current ? 0.4 : 1,
                position: 'absolute',
                top: rect.y + (current ? 0 : bob),
                transform: `scale(${scale})`,
                width: rect.width,
              }}
            />
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 10,
                height: 20,
                left: rect.x + rect.width * 0.2,
                opacity: current ? 0.15 : 0.8,
                position: 'absolute',
                top: rect.y + rect.height * 0.14 + (current ? 0 : bob),
                transform: 'rotate(-35deg)',
                width: 34,
              }}
            />
            <Text align="center" color={INK_SOFT} height={30} size={22} weight={700} width={rect.width} x={rect.x} y={rect.y + rect.height + 10}>
              {index + 1}
            </Text>
          </div>
        )
      })}
    </>
  )
}

function Stat({ label, value, x, y, gold = false }: { gold?: boolean; label: string; value: string; x: number; y: number }) {
  return (
    <>
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={200} x={x} y={y}>
        {label}
      </Text>
      <Text color={gold ? GOLD : INK} height={60} size={52} weight={800} width={200} x={x + 200} y={y - 16} align="right">
        {value}
      </Text>
    </>
  )
}

function Leaderboard({ state }: { state: GameState }) {
  const rows = leaderboard(state.save, state.seed, 5)
  return (
    <>
      <Glass rect={{ height: 470, width: 440, x: 1410, y: 250 }} />
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={380} x={1440} y={276}>
        BEST SCORES ON THIS PUZZLE
      </Text>
      {rows.length === 0 ? (
        <>
          <Text align="center" height={50} size={36} weight={800} width={380} x={1440} y={420}>
            No score yet
          </Text>
          <Text align="center" color={INK_SOFT} height={40} size={26} width={380} x={1440} y={476}>
            Solve it to set the first one
          </Text>
        </>
      ) : null}
      {rows.map((row, index) => {
        const mine = row.profileId === state.save.lastPlayerId
        const y = 326 + index * 76
        return (
          <div key={row.profileId}>
            {mine ? <div style={{ backgroundColor: 'rgba(255,255,255,0.14)', boxShadow: ring(1.5, 'rgba(255,255,255,0.35)'), borderRadius: 22, height: 64, left: 1428, position: 'absolute', top: y - 2, width: 404 }} /> : null}
            <div
              style={{
                alignItems: 'center',
                backgroundColor: index === 0 ? GOLD : 'rgba(255,255,255,0.18)',
                borderRadius: 20,
                color: index === 0 ? '#5a3a00' : INK,
                display: 'flex',
                fontSize: 24,
                fontWeight: 800,
                height: 40,
                justifyContent: 'center',
                left: 1446,
                position: 'absolute',
                top: y + 10,
                width: 40,
              }}
            >
              {index + 1}
            </div>
            <Text height={60} size={28} weight={mine ? 800 : 600} width={200} x={1504} y={y}>
              {row.name}
            </Text>
            <Text align="right" color={index === 0 ? GOLD : INK} height={60} size={34} weight={800} width={110} x={1700} y={y}>
              {row.moves}
            </Text>
          </div>
        )
      })}
    </>
  )
}

/** Everything around the board : the title, who plays, the score, the buttons, the water to pour. */
export function Hud({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  const look = useLook()
  const profile = findProfile(state.save, state.save.lastPlayerId)
  const best = bestOn(profile, state.seed)
  const record = houseRecord(state.save, state.seed)
  const bump = clamp((frame - state.moveAt) / 14)
  const movesScale = state.moves === 0 ? 1 : 1 + 0.3 * (1 - bump) ** 2
  return (
    <>
      <Drop size={74} x={64} y={30} />
      <Text height={90} size={68} spacing={-2} style={{ textShadow: `0 6px 24px ${accentGlow(look, 0.7)}` }} weight={800} width={500} x={150} y={26}>
        Flood-it
      </Text>

      <Glass hot={hovering(pointer, PLAYER_CHIP)} radius={42} rect={PLAYER_CHIP} />
      {profile ? <Avatar color={profile.color} name={profile.name} size={60} x={PLAYER_CHIP.x + 14} y={PLAYER_CHIP.y + 12} /> : null}
      <Text height={40} size={32} weight={800} width={260} x={PLAYER_CHIP.x + 92} y={PLAYER_CHIP.y + 12}>
        {profile?.name ?? 'Nobody yet'}
      </Text>
      <Text color={INK_SOFT} height={26} size={20} weight={600} width={260} x={PLAYER_CHIP.x + 92} y={PLAYER_CHIP.y + 50}>
        click to switch player
      </Text>

      <Glass rect={{ height: 392, width: 440, x: 70, y: 150 }} />
      <Text color={INK_SOFT} height={26} size={20} spacing={4} weight={700} width={300} x={104} y={176}>
        MOVES
      </Text>
      <Text height={170} size={156} style={{ transform: `scale(${movesScale.toFixed(3)})`, transformOrigin: 'left center' }} weight={800} width={380} x={102} y={206}>
        {state.moves}
      </Text>
      <Stat label="YOUR BEST" value={best === undefined ? '-' : String(best)} x={100} y={410} />
      <Stat gold={record !== undefined && best === record} label="HOUSE RECORD" value={record === undefined ? '-' : String(record)} x={100} y={474} />

      <Button hot={hovering(pointer, NEW_GAME_BUTTON)} keycap="N" label="New game" primary={state.phase !== 'won'} rect={NEW_GAME_BUTTON} />
      <Button hot={hovering(pointer, RESTART_BUTTON)} keycap="R" label="Restart" rect={RESTART_BUTTON} />
      <Button hot={hovering(pointer, SWITCH_BUTTON)} keycap="P" label="Switch player" rect={SWITCH_BUTTON} />
      <Button hot={hovering(pointer, HOME_BUTTON)} keycap="H" label="Home" rect={HOME_BUTTON} />

      {SIZES.map((size, index) => {
        const rect = sizeButton(index)
        const active = size.id === state.sizeId
        return (
          <div key={size.id}>
            <div
              style={{
                alignItems: 'center',
                backgroundImage: active ? primaryGradient(look) : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: 35,
                boxShadow: `${ring(2, active ? look.accent.ring : hovering(pointer, rect) ? 'rgba(255,255,255,0.6)' : 'rgba(190,225,255,0.26)')}${active ? `, 0 10px 26px ${accentGlow(look, 0.5)}` : ''}`,
                color: INK,
                display: 'flex',
                fontSize: 26,
                paddingLeft: 18,
                paddingRight: 18,
                fontWeight: 800,
                height: rect.height,
                justifyContent: 'center',
                left: rect.x,
                position: 'absolute',
                top: rect.y,
                width: rect.width - 36,
              }}
            >
              {size.label}
            </div>
          </div>
        )
      })}
      <Leaderboard state={state} />
      <Glass rect={{ height: 96, width: 440, x: 1410, y: 744 }} />
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={240} x={1440} y={762}>
        PUZZLES SOLVED
      </Text>
      <Text align="right" height={96} size={46} weight={800} width={140} x={1680} y={744}>
        {solvedCount(profile)}
      </Text>
      <Text color={INK_SOFT} height={26} size={20} weight={600} width={240} x={1440} y={796}>
        by {profile?.name ?? 'nobody'}
      </Text>

      <Drops frame={frame} pointer={pointer} state={state} />
      <Text align="center" color="rgba(255,255,255,0.8)" height={30} size={22} width={STAGE.width} x={0} y={1030}>
        Pick a color, click a cell or press 1 to {state.colors} - flood the whole board with as few moves as you can
      </Text>
    </>
  )
}
