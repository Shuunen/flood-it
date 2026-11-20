import type { GameState } from '../game/state.ts'
import { Board } from './board.tsx'
import { Celebration } from './celebration.tsx'
import { Hud } from './hud.tsx'
import type { Pointer } from './parts.tsx'

/** The puzzle : the board, what is around it, and the party when it is solved. */
export function Game({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  return (
    <>
      <Board frame={frame} state={state} />
      <Hud frame={frame} pointer={pointer} state={state} />
      <Celebration frame={frame} pointer={pointer} state={state} />
    </>
  )
}
