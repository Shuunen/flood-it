import { HOME_SETTINGS, HOME_START, HOME_SWITCH, homeSize, PLAYER_CHIP, STAGE } from '../game/layout.ts'
import type { GameState } from '../game/state.ts'
import { SIZES } from '../logic/board.ts'
import { findProfile, solvedCount } from '../logic/profiles.ts'
import { Avatar, Button, Drop, Glass, hovering, Text, type Pointer } from './parts.tsx'
import { accentGlow, GOLD, INK, INK_SOFT, primaryGradient, ring, useLook, WATER } from './theme.ts'

function Hall({ state }: { state: GameState }) {
  const rows = state.save.profiles
    .map(profile => ({ count: solvedCount(profile), id: profile.id, name: profile.name }))
    .toSorted((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5)
  return (
    <>
      <Glass rect={{ height: 430, width: 400, x: 1400, y: 440 }} />
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={340} x={1430} y={466}>
        MOST PUZZLES SOLVED
      </Text>
      {rows.map((row, index) => (
        <div key={row.id}>
          {row.id === state.save.lastPlayerId ? (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.14)', boxShadow: ring(1.5, 'rgba(255,255,255,0.35)'), borderRadius: 22, height: 60, left: 1416, position: 'absolute', top: 512 + index * 68, width: 368 }} />
          ) : null}
          <div
            style={{
              alignItems: 'center',
              backgroundColor: index === 0 && row.count > 0 ? GOLD : 'rgba(255,255,255,0.18)',
              borderRadius: 18,
              color: index === 0 && row.count > 0 ? '#5a3a00' : INK,
              display: 'flex',
              fontSize: 22,
              fontWeight: 800,
              height: 36,
              justifyContent: 'center',
              left: 1432,
              position: 'absolute',
              top: 524 + index * 68,
              width: 36,
            }}
          >
            {index + 1}
          </div>
          <Text height={60} size={26} weight={700} width={200} x={1486} y={512 + index * 68}>
            {row.name}
          </Text>
          <Text align="right" height={60} size={32} weight={800} width={80} x={1690} y={512 + index * 68}>
            {row.count}
          </Text>
        </div>
      ))}
    </>
  )
}

function Stats({ state }: { state: GameState }) {
  const profile = findProfile(state.save, state.save.lastPlayerId)
  return (
    <>
      <Glass rect={{ height: 430, width: 400, x: 120, y: 440 }} />
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={340} x={150} y={466}>
        YOUR PUZZLES
      </Text>
      <Text height={150} size={130} weight={800} width={340} x={150} y={520}>
        {solvedCount(profile)}
      </Text>
      <Text color={INK_SOFT} height={30} size={26} width={340} x={150} y={690}>
        puzzles solved
      </Text>
      <Text height={64} size={54} weight={800} width={340} x={150} y={742}>
        {Object.keys(profile?.best ?? {}).length}
      </Text>
      <Text color={INK_SOFT} height={30} size={26} width={340} x={150} y={812}>
        best scores to beat
      </Text>
    </>
  )
}

/** The first screen : the title, a big Start game button, the board size, who plays. */
export function Home({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  const look = useLook()
  const profile = findProfile(state.save, state.save.lastPlayerId)
  const startHot = hovering(pointer, HOME_START)
  return (
    <>
      <Drop size={150} x={STAGE.width / 2 - 440} y={70 + Math.sin(frame / 40) * 6} />
      <Text height={170} size={150} spacing={-4} style={{ textShadow: `0 8px 40px ${accentGlow(look, 0.8)}` }} weight={800} width={800} x={STAGE.width / 2 - 270} y={60}>
        Flood-it
      </Text>
      <Text align="center" color={INK_SOFT} height={40} size={32} width={STAGE.width} x={0} y={262}>
        Pour the water, flood the whole board, with as few moves as you can
      </Text>
      {WATER.slice(0, 5).map((water, index) => {
        const bob = Math.sin(frame / 36 + index * 1.2) * 8
        return (
          <div
            key={water.name}
            style={{
              backgroundImage: `radial-gradient(circle at 34% 26%, rgba(255,255,255,0.95) 0%, ${water.light} 14%, ${water.base} 56%, ${water.dark} 100%)`,
              borderRadius: 40,
              boxShadow: `${ring(3, 'rgba(255,255,255,0.55)')}, 0 14px 28px rgba(0,0,0,0.4)`,
              height: 80,
              left: STAGE.width / 2 - 270 + index * 112,
              position: 'absolute',
              top: 350,
              transform: `translateY(${bob.toFixed(1)}px)`,
              width: 80,
            }}
          />
        )
      })}

      <div
        style={{
          alignItems: 'center',
          backgroundImage: primaryGradient(look),
          borderRadius: 65,
          boxShadow: `${ring(3, 'rgba(220,245,255,0.9)')}, 0 22px 60px ${accentGlow(look, startHot ? 0.85 : 0.5)}`,
          color: '#fff',
          display: 'flex',
          fontSize: 58,
          fontWeight: 800,
          height: HOME_START.height,
          justifyContent: 'center',
          left: HOME_START.x,
          position: 'absolute',
          textShadow: '0 4px 14px rgba(0,60,120,0.6)',
          top: HOME_START.y,
          transform: startHot ? 'scale(1.04)' : 'none',
          width: HOME_START.width,
        }}
      >
        Start game
      </div>
      <Text align="center" color={INK_SOFT} height={30} size={24} width={HOME_START.width} x={HOME_START.x} y={HOME_START.y + HOME_START.height + 14}>
        press Enter or Space
      </Text>

      {SIZES.map((size, index) => {
        const rect = homeSize(index)
        const active = size.id === state.sizeId
        return (
          <div
            key={size.id}
            style={{
              alignItems: 'center',
              backgroundImage: active ? primaryGradient(look) : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
              borderRadius: 36,
              boxShadow: `${ring(2, active ? look.accent.ring : hovering(pointer, rect) ? 'rgba(255,255,255,0.6)' : 'rgba(190,225,255,0.26)')}${active ? `, 0 10px 26px ${accentGlow(look, 0.5)}` : ''}`,
              color: INK,
              display: 'flex',
              fontSize: 24,
              paddingLeft: 24,
              paddingRight: 24,
              fontWeight: 800,
              height: rect.height,
              justifyContent: 'center',
              left: rect.x,
              position: 'absolute',
              top: rect.y,
              width: rect.width - 48,
            }}
          >
            {`${size.label} ${size.width}x${size.height}`}
          </div>
        )
      })}
      <Button hot={hovering(pointer, HOME_SWITCH)} keycap="P" label="Switch player" rect={HOME_SWITCH} />
      <Button hot={hovering(pointer, HOME_SETTINGS)} keycap="S" label="Settings" rect={HOME_SETTINGS} />

      <Glass hot={hovering(pointer, PLAYER_CHIP)} radius={42} rect={PLAYER_CHIP} />
      {profile ? <Avatar color={profile.color} name={profile.name} size={60} x={PLAYER_CHIP.x + 14} y={PLAYER_CHIP.y + 12} /> : null}
      <Text height={40} size={32} weight={800} width={260} x={PLAYER_CHIP.x + 92} y={PLAYER_CHIP.y + 12}>
        {profile?.name ?? 'Nobody yet'}
      </Text>
      <Text color={INK_SOFT} height={26} size={20} weight={600} width={260} x={PLAYER_CHIP.x + 92} y={PLAYER_CHIP.y + 50}>
        click to switch player
      </Text>
      <Stats state={state} />
      <Hall state={state} />
    </>
  )
}
