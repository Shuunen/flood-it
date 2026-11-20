import { STAGE } from '../game/layout.ts'
import type { GameState } from '../game/state.ts'
import { Backdrop } from './backdrop.tsx'
import { Game } from './game.tsx'
import { Home } from './home.tsx'
import type { Pointer } from './parts.tsx'
import { Players } from './players.tsx'
import { Settings } from './settings.tsx'
import { LOOKS, LookContext } from './theme.ts'

/** The whole picture of the game for one frame, in the colors of the theme. The players screen floats over the home screen or over the board, whichever it was opened from. */
export function Scene({ frame, pointer, state }: { frame: number; pointer: Pointer; state: GameState }) {
  const home = state.phase === 'home' || state.phase === 'settings' || (state.phase === 'players' && state.from === 'home')
  return (
    <LookContext.Provider value={LOOKS[state.save.theme]}>
      <div style={{ height: STAGE.height, left: 0, overflow: 'hidden', position: 'absolute', top: 0, width: STAGE.width }}>
        <Backdrop frame={frame} />
        {home ? <Home frame={frame} pointer={pointer} state={state} /> : <Game frame={frame} pointer={pointer} state={state} />}
        {state.phase === 'players' ? <Players frame={frame} pointer={pointer} state={state} /> : null}
        {state.phase === 'settings' ? <Settings pointer={pointer} state={state} /> : null}
      </div>
    </LookContext.Provider>
  )
}
