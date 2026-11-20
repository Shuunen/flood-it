import { colorSwatch, NAME_CANCEL, NAME_DELETE, NAME_ERASE, NAME_FIELD, NAME_OK, NEW_PLAYER_CHIP, NEXT_PAGE, PLAYER_CARD, PREVIOUS_PAGE, PROFILES_PER_PAGE, profileChip, profileEdit, STAGE, type Rect } from '../game/layout.ts'
import type { GameState } from '../game/state.ts'
import { COLOR_COUNT, MAX_NAME_LENGTH, solvedCount, type Profile } from '../logic/profiles.ts'
import { Avatar, Glass, hovering, Text, type Pointer } from './parts.tsx'
import { accentGlow, alpha, GOLD, INK_SOFT, primaryGradient, ring, useLook, waterColor } from './theme.ts'

function summary(profile: Profile): string {
  const solved = solvedCount(profile)
  return solved > 0 ? `${solved} ${solved === 1 ? 'puzzle' : 'puzzles'} solved` : 'no puzzle solved yet'
}

function Arrow({ enabled, hot, left, rect }: { enabled: boolean; hot: boolean; left: boolean; rect: Rect }) {
  return (
    <Glass hot={hot && enabled} radius={30} rect={rect} style={{ opacity: enabled ? 1 : 0.35 }}>
      <svg height={rect.height} style={{ left: 0, position: 'absolute', top: 0 }} viewBox="0 0 100 100" width={rect.width}>
        <path d={left ? 'M60 30 L40 50 L60 70' : 'M40 30 L60 50 L40 70'} fill="none" stroke="#eaf6ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" />
      </svg>
    </Glass>
  )
}

function Chip({ hot, rect, selected }: { hot: boolean; rect: Rect; selected: boolean }) {
  const look = useLook()
  return <Glass glow={selected ? accentGlow(look, 0.55) : undefined} hot={hot || selected} radius={34} rect={rect} style={selected ? { boxShadow: `${ring(3, look.accent.ring)}, 0 0 36px ${accentGlow(look, 0.55)}` } : undefined} />
}

function Swatches({ pointer, state }: { pointer: Pointer; state: GameState }) {
  return (
    <>
      <Text color={INK_SOFT} height={30} size={24} width={400} x={NAME_FIELD.x} y={colorSwatch(0).y - 40}>
        Color (↑ ↓ or click)
      </Text>
      {Array.from({ length: COLOR_COUNT }, (_unused, index) => {
        const rect = colorSwatch(index)
        const water = waterColor(index)
        const chosen = state.draftColor === index
        return (
          <div
            key={index}
            style={{
              backgroundImage: `radial-gradient(circle at 34% 26%, rgba(255,255,255,0.95) 0%, ${water.light} 16%, ${water.base} 58%, ${water.dark} 100%)`,
              borderRadius: rect.width / 2,
              boxShadow: chosen ? `${ring(5, '#ffffff')}, 0 0 24px ${alpha(water.base, 0.9)}` : ring(2, hovering(pointer, rect) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'),
              height: rect.height,
              left: rect.x,
              position: 'absolute',
              top: rect.y,
              transform: chosen ? 'scale(1.12)' : 'none',
              width: rect.width,
            }}
          />
        )
      })}
    </>
  )
}

function FormButton({ danger = false, hot, label, primary = false, rect, size = 28 }: { danger?: boolean; hot: boolean; label: string; primary?: boolean; rect: Rect; size?: number }) {
  const look = useLook()
  let background = 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)'
  if (primary) background = primaryGradient(look)
  if (danger) background = 'linear-gradient(180deg,#ff7b8f 0%,#d6224a 100%)'
  return (
    <>
      <div
        style={{
          backgroundImage: background,
          borderRadius: rect.height / 2,
          boxShadow: `${ring(2, hot ? 'rgba(255,255,255,0.7)' : 'rgba(210,240,255,0.35)')}, 0 10px 26px rgba(0,0,0,0.3)`,
          height: rect.height,
          left: rect.x,
          position: 'absolute',
          top: rect.y,
          width: rect.width,
        }}
      />
      <Text align="center" height={rect.height} size={size} weight={primary || danger ? 800 : 700} width={rect.width} x={rect.x} y={rect.y}>
        {label}
      </Text>
    </>
  )
}

/** The form of a player : a new one, or an existing one to rename, recolor or delete. */
function Form({ frame, state, pointer }: { frame: number; pointer: Pointer; state: GameState }) {
  const look = useLook()
  const caret = Math.floor(frame / 30) % 2 === 0
  const editing = state.editing !== ''
  const canCancel = state.save.profiles.length > 0
  let ask = 'What is the name of the new player ?'
  if (state.save.profiles.length === 0) ask = 'Welcome ! What is your name ?'
  if (editing) ask = 'Change the name and the color of this player'
  return (
    <>
      <Avatar color={state.draftColor} name={state.draft || '?'} size={104} x={PLAYER_CARD.x + PLAYER_CARD.width - 170} y={PLAYER_CARD.y + 40} />
      <Text color={INK_SOFT} height={34} size={28} width={1000} x={NAME_FIELD.x} y={NAME_FIELD.y - 56}>
        {ask}
      </Text>
      <div
        style={{
          backgroundColor: 'rgba(0,12,32,0.7)',
          borderRadius: 36,
          boxShadow: `${ring(3, state.error ? '#ff6b8f' : look.accent.ring)}, 0 0 40px ${accentGlow(look, 0.3)}, inset 0 4px 18px rgba(0,0,0,0.5)`,
          height: NAME_FIELD.height,
          left: NAME_FIELD.x,
          position: 'absolute',
          top: NAME_FIELD.y,
          width: NAME_FIELD.width,
        }}
      />
      <Text height={NAME_FIELD.height} size={64} weight={800} width={NAME_FIELD.width - 80} x={NAME_FIELD.x + 40} y={NAME_FIELD.y}>
        {state.draft}
        <span style={{ backgroundColor: caret ? '#8fdcff' : 'transparent', display: 'flex', height: 70, marginLeft: 6, width: 5 }} />
      </Text>
      {state.draft.length === 0 ? (
        <Text color="rgba(234,246,255,0.28)" height={NAME_FIELD.height} size={50} width={700} x={NAME_FIELD.x + 62} y={NAME_FIELD.y}>
          type with your keyboard
        </Text>
      ) : null}
      <Text align="right" color={INK_SOFT} height={30} size={22} width={300} x={NAME_FIELD.x + NAME_FIELD.width - 300} y={NAME_FIELD.y + NAME_FIELD.height + 14}>
        {`${state.draft.length} / ${MAX_NAME_LENGTH}`}
      </Text>
      <Text color="#ff8aa8" height={34} size={28} weight={700} width={700} x={NAME_FIELD.x + 8} y={NAME_FIELD.y + NAME_FIELD.height + 12}>
        {state.error}
      </Text>
      <Swatches pointer={pointer} state={state} />
      {canCancel ? <FormButton hot={hovering(pointer, NAME_CANCEL)} label="Cancel (Esc)" rect={NAME_CANCEL} /> : null}
      <FormButton hot={hovering(pointer, NAME_ERASE)} label="Erase (←)" rect={NAME_ERASE} />
      {editing ? <FormButton danger={state.confirmDelete} hot={hovering(pointer, NAME_DELETE)} label={state.confirmDelete ? 'Sure ? Click' : 'Delete'} rect={NAME_DELETE} /> : null}
      <FormButton hot={hovering(pointer, NAME_OK)} label={editing ? 'Save (Enter)' : "Let's play"} primary rect={NAME_OK} />
      <Text align="center" color="rgba(234,246,255,0.45)" height={30} size={22} width={1000} x={NAME_FIELD.x} y={NAME_OK.y + NAME_OK.height + 22}>
        {state.confirmDelete ? `This deletes ${state.draft || 'the player'} and all their scores. Click Delete again to confirm.` : 'Backspace and Delete do not reach raea games : erase with the left arrow or the button'}
      </Text>
    </>
  )
}

function EditPill({ hot, rect }: { hot: boolean; rect: Rect }) {
  return (
    <>
      <div
        style={{
          backgroundColor: hot ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
          borderRadius: rect.height / 2,
          boxShadow: ring(2, hot ? 'rgba(255,255,255,0.7)' : 'rgba(190,225,255,0.35)'),
          height: rect.height,
          left: rect.x,
          position: 'absolute',
          top: rect.y,
          width: rect.width,
        }}
      />
      <Text align="center" height={rect.height} size={24} weight={700} width={rect.width} x={rect.x} y={rect.y}>
        Edit
      </Text>
    </>
  )
}

function List({ pointer, state }: { pointer: Pointer; state: GameState }) {
  const { profiles } = state.save
  const count = profiles.length
  const pageStart = Math.floor(Math.min(state.selected, Math.max(count - 1, 0)) / PROFILES_PER_PAGE) * PROFILES_PER_PAGE
  const visible = profiles.slice(pageStart, pageStart + PROFILES_PER_PAGE)
  const pages = Math.max(1, Math.ceil(count / PROFILES_PER_PAGE))
  return (
    <>
      {visible.map((profile, slot) => {
        const rect = profileChip(slot)
        const current = profile.id === state.save.lastPlayerId
        return (
          <div key={profile.id}>
            <Chip hot={hovering(pointer, rect)} rect={rect} selected={pageStart + slot === state.selected} />
            <Avatar color={profile.color} name={profile.name} size={68} x={rect.x + 16} y={rect.y + 14} />
            <Text height={38} size={34} weight={800} width={330} x={rect.x + 104} y={rect.y + 14}>
              {profile.name}
            </Text>
            <Text color={INK_SOFT} height={28} size={22} width={440} x={rect.x + 104} y={rect.y + 56}>
              {summary(profile)}
            </Text>
            {current ? (
              <Text align="center" color="#5a3a00" height={30} size={18} spacing={2} style={{ backgroundColor: GOLD, borderRadius: 15 }} weight={800} width={112} x={rect.x + rect.width - 252} y={rect.y + 33}>
                PLAYING
              </Text>
            ) : null}
            <EditPill hot={hovering(pointer, profileEdit(slot))} rect={profileEdit(slot)} />
          </div>
        )
      })}
      <Chip hot={hovering(pointer, NEW_PLAYER_CHIP)} rect={NEW_PLAYER_CHIP} selected={state.selected === count} />
      <svg height={70} style={{ left: NEW_PLAYER_CHIP.x + 24, position: 'absolute', top: NEW_PLAYER_CHIP.y + 13 }} viewBox="0 0 100 100" width={70}>
        <circle cx="50" cy="50" fill="rgba(95,208,255,0.25)" r="44" stroke="#8fdcff" strokeWidth="5" />
        <path d="M50 28 L50 72 M28 50 L72 50" stroke="#eaf6ff" strokeLinecap="round" strokeWidth="9" />
      </svg>
      <Text height={96} size={34} weight={800} width={400} x={NEW_PLAYER_CHIP.x + 116} y={NEW_PLAYER_CHIP.y}>
        New player
      </Text>
      {pages > 1 ? (
        <>
          <Arrow enabled={pageStart > 0} hot={hovering(pointer, PREVIOUS_PAGE)} left rect={PREVIOUS_PAGE} />
          <Arrow enabled={pageStart + PROFILES_PER_PAGE < count} hot={hovering(pointer, NEXT_PAGE)} left={false} rect={NEXT_PAGE} />
          <Text align="right" color={INK_SOFT} height={30} size={24} width={220} x={PREVIOUS_PAGE.x - 240} y={PREVIOUS_PAGE.y + 33}>
            {`page ${pageStart / PROFILES_PER_PAGE + 1} / ${pages}`}
          </Text>
        </>
      ) : null}
    </>
  )
}

/** The screen where a player is picked or created : a card over the dimmed game. */
export function Players({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  return (
    <>
      <div style={{ backgroundColor: alpha('#020a17', 0.76), height: STAGE.height, left: 0, position: 'absolute', top: 0, width: STAGE.width }} />
      <Glass
        glow="rgba(60,160,255,0.25)"
        radius={56}
        rect={{ ...PLAYER_CARD, height: state.naming ? 760 : PLAYER_CARD.height }}
        style={{ backgroundColor: '#0a2145', backgroundImage: 'linear-gradient(160deg, rgba(120,190,255,0.16) 0%, rgba(120,190,255,0.02) 60%)' }}
      />
      <Text height={80} size={62} spacing={-1} weight={800} width={900} x={PLAYER_CARD.x + 60} y={PLAYER_CARD.y + 34}>
        {state.naming ? (state.editing === '' ? 'New player' : 'Edit player') : 'Who is playing ?'}
      </Text>
      <Text color={INK_SOFT} height={30} size={24} width={1100} x={PLAYER_CARD.x + 62} y={PLAYER_CARD.y + 114}>
        {state.naming
          ? state.editing === ''
            ? 'Your scores will be kept under this name on this computer.'
            : 'Renaming a player keeps all their scores.'
          : 'Click a player or use the arrows and Enter. Edit changes the name and color, or deletes a player.'}
      </Text>
      {state.naming ? <Form frame={frame} pointer={pointer} state={state} /> : <List pointer={pointer} state={state} />}
    </>
  )
}
