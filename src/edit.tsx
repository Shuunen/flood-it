import { Composition, registerRoot, useCurrentFrame, useGameState, useInput } from 'raea'
import './audio/music.ts'
import './audio/synth.ts'
import { Sounds } from './audio/cues.tsx'
import { createState, step } from './game/state.ts'
import { openSession } from './platform/session.ts'
import { Scene } from './view/scene.tsx'

const session = openSession()
const INITIAL = createState(session.save, session.startMs, session.nonce)

function FloodIt() {
  const frame = useCurrentFrame()
  const input = useInput()
  const state = useGameState(INITIAL, step)
  session.persist(state.save, state.saveRev)
  return (
    <>
      <Scene frame={frame} pointer={input.pointer} state={state} />
      <Sounds initial={INITIAL} state={state} />
    </>
  )
}

registerRoot(() => (
  <>
    <Composition component={FloodIt} durationInFrames={60 * 60 * 60} fps={60} height={1080} id="flood-it" width={1920} />
    <Composition component={FloodIt} durationInFrames={60 * 70} fps={60} height={1080} id="flood-it-demo" width={1920} />
  </>
))
