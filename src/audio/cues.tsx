import { useCurrentFrame, useGameEvents } from 'raea'
import { Sfx } from 'raea/tone'
import { step, type GameState } from '../game/state.ts'
import { playTheme } from './music.ts'
import { playBack, playBest, playError, playMove, playNewGame, playSelect, playTap, playType, playWin } from './synth.ts'

/**
 * Plays the cue the game rules raised, on the very frame it was raised. Each kind of cue has its own event list : an
 * event is told apart by the text of its function, so every one below spells its kind out.
 */
export function Sounds({ initial, state }: { initial: GameState; state: GameState }) {
  const frame = useCurrentFrame()
  const moves = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'move')
  const taps = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'tap')
  const types = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'type')
  const backs = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'back')
  const errors = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'error')
  const selects = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'select')
  const newGames = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'newgame')
  const wins = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'win')
  const bests = useGameEvents(initial, step, (before, after) => after.cue.id !== before.cue.id && after.cue.kind === 'best')
  const themes = useGameEvents(initial, step, (before, after) => after.save.theme !== before.save.theme)
  return (
    <>
      <Sfx
        name="theme"
        play={time => {
          playTheme(time, state.save.theme, frame < 3 ? 0.05 : 2)
        }}
        when={frame < 3 || themes.includes(frame)}
      />
      <Sfx
        name="move"
        play={time => {
          playMove(time, state.cue.data, state.moves)
        }}
        when={moves.includes(frame)}
      />
      <Sfx name="tap" play={playTap} when={taps.includes(frame)} />
      <Sfx
        name="type"
        play={time => {
          playType(time, state.draft.length)
        }}
        when={types.includes(frame)}
      />
      <Sfx name="back" play={playBack} when={backs.includes(frame)} />
      <Sfx name="error" play={playError} when={errors.includes(frame)} />
      <Sfx name="select" play={playSelect} when={selects.includes(frame)} />
      <Sfx name="newgame" play={playNewGame} when={newGames.includes(frame)} />
      <Sfx name="win" play={playWin} when={wins.includes(frame)} />
      <Sfx name="best" play={playBest} when={bests.includes(frame)} />
    </>
  )
}
