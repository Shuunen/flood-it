import { PLAYER_CARD, SETTINGS_BACK, STAGE, themeCard } from '../game/layout.ts'
import type { GameState } from '../game/state.ts'
import { THEME_IDS } from '../logic/profiles.ts'
import { Sky } from './backdrop.tsx'
import { Button, Glass, hovering, Text, type Pointer } from './parts.tsx'
import { accentGlow, alpha, GOLD, INK_SOFT, LOOKS, primaryGradient, ring } from './theme.ts'

/** The settings : the card of each theme shows its colors and says what it sounds like. */
export function Settings({ pointer, state }: { pointer: Pointer; state: GameState }) {
  return (
    <>
      <div style={{ backgroundColor: alpha('#020a17', 0.5), height: STAGE.height, left: 0, position: 'absolute', top: 0, width: STAGE.width }} />
      <Glass glow="rgba(60,160,255,0.2)" radius={56} rect={PLAYER_CARD} style={{ backgroundColor: '#0a1f42', backgroundImage: 'linear-gradient(160deg, rgba(120,190,255,0.14) 0%, rgba(120,190,255,0.02) 60%)' }} />
      <Text height={80} size={62} spacing={-1} weight={800} width={900} x={PLAYER_CARD.x + 60} y={PLAYER_CARD.y + 34}>
        Settings
      </Text>
      <Text color={INK_SOFT} height={30} size={24} width={1100} x={PLAYER_CARD.x + 62} y={PLAYER_CARD.y + 114}>
        Pick a theme : it changes the colors and the music of the whole game, right now.
      </Text>
      <Text color={INK_SOFT} height={26} size={20} spacing={3} weight={700} width={300} x={PLAYER_CARD.x + 40} y={PLAYER_CARD.y + 154}>
        THEME
      </Text>
      {THEME_IDS.map((id, index) => {
        const look = LOOKS[id]
        const rect = themeCard(index)
        const selected = state.save.theme === id
        return (
          <div key={id}>
            <Glass
              glow={selected ? accentGlow(look, 0.5) : undefined}
              hot={selected || hovering(pointer, rect)}
              radius={36}
              rect={rect}
              style={selected ? { boxShadow: `${ring(4, look.accent.ring)}, 0 0 40px ${accentGlow(look, 0.5)}` } : undefined}
            />
            <Sky height={200} look={look} width={rect.width - 40} x={rect.x + 20} y={rect.y + 20} />
            <div style={{ backgroundImage: primaryGradient(look), borderRadius: 26, boxShadow: `0 8px 20px ${accentGlow(look, 0.6)}`, height: 52, left: rect.x + 60, position: 'absolute', top: rect.y + 156, width: rect.width - 120 }} />
            <Text align="center" height={52} size={26} weight={800} width={rect.width - 120} x={rect.x + 60} y={rect.y + 156}>
              Play
            </Text>
            <Text height={50} size={40} weight={800} width={rect.width - 40} x={rect.x + 28} y={rect.y + 236}>
              {look.name}
            </Text>
            <Text color={INK_SOFT} height={64} size={24} style={{ lineHeight: 1.25, whiteSpace: 'normal' }} width={rect.width - 56} x={rect.x + 28} y={rect.y + 290}>
              {look.blurb}
            </Text>
            <Text height={44} size={21} style={{ lineHeight: 1.2, whiteSpace: 'normal' }} width={rect.width - 56} x={rect.x + 28} y={rect.y + 358} color={selected ? look.accent.from : INK_SOFT}>
              {`Music: ${look.music}`}
            </Text>
            {selected ? (
              <Text align="center" color="#5a3a00" height={32} size={18} spacing={2} style={{ backgroundColor: GOLD, borderRadius: 16 }} weight={800} width={104} x={rect.x + rect.width - 128} y={rect.y + 240}>
                ACTIVE
              </Text>
            ) : null}
          </div>
        )
      })}
      <Button hot={hovering(pointer, SETTINGS_BACK)} keycap="Esc" label="Back" primary rect={SETTINGS_BACK} />
      <Text align="center" color="rgba(234,246,255,0.45)" height={30} size={22} width={1000} x={PLAYER_CARD.x + 120} y={PLAYER_CARD.y + PLAYER_CARD.height - 38}>
        Click a theme, or use the left and right arrows, or the keys 1 2 3
      </Text>
    </>
  )
}
