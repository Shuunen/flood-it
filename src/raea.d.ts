/** The small part of raea's API this game uses. raea ships its own types, this keeps `tsc` working where raea is not installed (CI). */

declare module 'raea' {
  import type { ReactElement } from 'react'

  export type FrameInput = { keys: string[]; pointer?: { down: boolean; x: number; y: number } }

  export function useCurrentFrame(): number
  export function useInput(): FrameInput
  export function useGameState<State>(initial: State, step: (state: State, input: FrameInput, frame: number) => State): State
  export function useGameEvents<State>(initial: State, step: (state: State, input: FrameInput, frame: number) => State, isEvent: (before: State, after: State) => boolean): number[]
  export function registerRoot(root: () => ReactElement): void
  export function Composition(props: { component: () => ReactElement; durationInFrames: number; fps: number; height: number; id: string; width: number }): ReactElement | undefined
}

declare module 'raea/native' {
  type SqliteAnswer = { changes: number; error: string | null; sets: { columns: string[]; rows: (number | string | null)[][] }[] }
  export function native(name: 'host.env', args: { name: string }): string | null
  export function native(name: 'fs.open', args: { root: string }): { id: number; root: string }
  export function native(name: 'sqlite.exec', args: { path: string; readonly?: boolean; sql: string }): SqliteAnswer
}

declare module 'raea/tone' {
  import type { ReactElement } from 'react'

  type Options = Record<string, unknown>
  type Time = number | string

  export type Param = {
    exponentialRampToValueAtTime: (value: number, time: Time) => Param
    rampTo: (value: number, rampTime?: Time, startTime?: Time) => Param
    setValueAtTime: (value: number, time?: Time) => Param
    value: number
  }

  export class Node {
    constructor(options?: Options)
    connect(destination: Node | Param): this
    readonly frequency: Param
    readonly gain: Param
    start(time?: Time): this
  }

  export class Instrument extends Node {
    triggerAttackRelease(note: number | string | string[], duration: Time, time?: Time, velocity?: number): this
  }

  export class NoiseSynth extends Node {
    triggerAttackRelease(duration: Time, time?: Time, velocity?: number): this
  }

  export class Noise extends Node {}
  export class Filter extends Node {}
  export class LFO extends Node {}
  export class Gain extends Node {
    constructor(gain?: number)
  }
  export class Reverb extends Node {}
  export class FeedbackDelay extends Node {}
  export class Synth extends Instrument {}
  export class FMSynth extends Instrument {}
  export class MembraneSynth extends Instrument {}
  export class PolySynth extends Instrument {
    constructor(voice: new () => Instrument, options?: Options)
  }
  export class Part<Event extends { time: Time }> {
    constructor(callback: (time: number, value: Event) => void, events: Event[])
    loop: boolean | number
    loopEnd: Time
    start(time?: Time): this
  }

  export const buses: Record<'ambience' | 'music' | 'sfx' | 'ui', Node & { volume: Param }>
  export function getTransport(): { bpm: Param; start: () => void }
  export function Time(value: Time): { toSeconds: () => number }
  export function vary<Voice extends Instrument>(voice: Voice, variation: { pitch?: number; volume?: number }): Voice
  export function Sfx(props: { name?: string; play: (time: number, frame: number) => void; when: boolean | number | null | undefined }): ReactElement | undefined
}
