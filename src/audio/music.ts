import * as Tone from 'raea/tone'
import { THEME_IDS, type ThemeId } from '../logic/profiles.ts'
import { dice } from './dice.ts'

/**
 * The music and the background sounds of the three themes. Each theme has its own music and its own ambience, all of
 * them run together from the first frame and a gain in front of each one decides which can be heard : changing the
 * theme only fades one out and another in. The graph is made once when this file loads, as raea asks.
 */

// the mix, in dB : the music and the ambience sit under the sounds of the game, which stand out of them
const MIX = { ambience: 7, music: -5, sfx: 1, ui: 0 }
Tone.buses.music.volume.value = MIX.music
Tone.buses.ambience.volume.value = MIX.ambience
Tone.buses.sfx.volume.value = MIX.sfx
Tone.buses.ui.volume.value = MIX.ui

// how loud each theme plays once chosen, so that the three of them sound as loud as each other
const LEVEL: Record<ThemeId, number> = { aurora: 0.85, ocean: 1, sunset: 1.3 }

// the ocean is the theme the game starts in, the others wait silent until they are chosen
const themeMusic = {
  aurora: new Tone.Gain(0).connect(Tone.buses.music),
  ocean: new Tone.Gain(LEVEL.ocean).connect(Tone.buses.music),
  sunset: new Tone.Gain(0).connect(Tone.buses.music),
}
const themeAmbience = {
  aurora: new Tone.Gain(0).connect(Tone.buses.ambience),
  ocean: new Tone.Gain(1).connect(Tone.buses.ambience),
  sunset: new Tone.Gain(0).connect(Tone.buses.ambience),
}

/** Makes this theme the one that is heard : its music and ambience fade in, the others fade out. */
export function playTheme(time: number, theme: ThemeId, seconds: number): void {
  for (const id of THEME_IDS) {
    themeMusic[id].gain.rampTo(id === theme ? LEVEL[id] : 0, seconds, time)
    themeAmbience[id].gain.rampTo(id === theme ? 1 : 0, seconds, time)
  }
}

// ---------------------------------------------------------------- sounds of nature

// raea allows 31 instruments in all : the three kinds of noise are made once and every sound of nature takes what it needs
const pink = new Tone.Noise({ type: 'pink', volume: 0 }).start(0)
const white = new Tone.Noise({ type: 'white', volume: 0 }).start(0)
const brown = new Tone.Noise({ type: 'brown', volume: 0 }).start(0)

/** Plays a kind of noise into a destination, as loud as asked. */
function feed(noise: Tone.Noise, decibels: number, destination: Tone.Node): void {
  noise.connect(new Tone.Gain(10 ** (decibels / 20)).connect(destination))
}

type Sea = { foamDb: number; high: number; low: number; rumbleDb: number; swellDb: number; waveHz: number }

/** Waves : noise opened and closed by a slow wave, the hiss of the foam a little after, the rumble of the deep. */
function sea(out: Tone.Gain, options: Sea): void {
  const room = new Tone.Reverb({ decay: 2.8, wet: 0.3 }).connect(out)
  const swell = new Tone.Gain(0.5).connect(room)
  new Tone.LFO({ frequency: options.waveHz, max: 1, min: 0.15, phase: 0, type: 'sine' }).start().connect(swell.gain)
  const swellTone = new Tone.Filter({ Q: 0.6, frequency: 500, type: 'lowpass' }).connect(swell)
  new Tone.LFO({ frequency: options.waveHz, max: options.high, min: options.low, phase: 20, type: 'sine' }).start().connect(swellTone.frequency)
  feed(pink, options.swellDb, swellTone)
  const foam = new Tone.Gain(0.2).connect(room)
  new Tone.LFO({ frequency: options.waveHz, max: 0.9, min: 0.02, phase: 150, type: 'sine' }).start().connect(foam.gain)
  const foamTone = new Tone.Filter({ Q: 0.5, frequency: 3400, type: 'highpass' }).connect(foam)
  feed(white, options.foamDb, foamTone)
  const rumble = new Tone.Filter({ Q: 0.5, frequency: 170, type: 'lowpass' }).connect(out)
  feed(brown, options.rumbleDb, rumble)
}

/** Wind : noise that a slow wave sweeps up and down in pitch. */
function wind(out: Tone.Gain, low: number, high: number, hertz: number, decibels: number): void {
  const tone = new Tone.Filter({ Q: 1.4, frequency: low, type: 'bandpass' }).connect(out)
  new Tone.LFO({ frequency: hertz, max: high, min: low, phase: 90, type: 'sine' }).start().connect(tone.frequency)
  feed(pink, decibels, tone)
}

/** Fine rain on water. */
function rain(out: Tone.Gain, decibels: number): void {
  const tone = new Tone.Filter({ Q: 0.5, frequency: 5200, type: 'highpass' }).connect(out)
  feed(white, decibels, tone)
}

sea(themeAmbience.ocean, { foamDb: -30, high: 1400, low: 260, rumbleDb: -22, swellDb: -17, waveHz: 0.11 })
sea(themeAmbience.sunset, { foamDb: -34, high: 900, low: 200, rumbleDb: -24, swellDb: -20, waveHz: 0.075 })
wind(themeAmbience.sunset, 400, 1100, 0.05, -32)
wind(themeAmbience.aurora, 500, 1700, 0.035, -27)
rain(themeAmbience.aurora, -38)
const auroraRumble = new Tone.Filter({ Q: 0.5, frequency: 140, type: 'lowpass' }).connect(themeAmbience.aurora)
feed(brown, -24, auroraRumble)

// ---------------------------------------------------------------- one loop : a part that comes round again

function loopOf(part: Tone.Part<{ time: number | string }>, length: number | string): void {
  part.loop = true
  part.loopEnd = length
  part.start(0)
}

// ---------------------------------------------------------------- ocean : a calm kalimba, eight bars at 78 bpm

Tone.getTransport().bpm.value = 78

const oceanRoom = new Tone.Reverb({ decay: 3.4, wet: 0.3 }).connect(themeMusic.ocean)
const oceanBells = new Tone.Reverb({ decay: 1.8, wet: 0.22 }).connect(themeMusic.ocean)

const oceanPad = new Tone.PolySynth(Tone.Synth, { envelope: { attack: 1.4, decay: 0.6, release: 2.6, sustain: 0.85 }, oscillator: { type: 'sine' }, volume: -26 }).connect(oceanRoom)
const kalimba = new Tone.PolySynth(Tone.FMSynth, {
  envelope: { attack: 0.002, decay: 0.55, release: 0.4, sustain: 0 },
  harmonicity: 3.01,
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.002, decay: 0.28, release: 0.2, sustain: 0 },
  modulationIndex: 1.5,
  oscillator: { type: 'sine' },
  volume: -17,
}).connect(oceanBells)
const oceanBass = new Tone.Synth({ envelope: { attack: 0.02, decay: 0.3, release: 0.6, sustain: 0.6 }, oscillator: { type: 'sine' }, volume: -15 }).connect(themeMusic.ocean)
const celesta = new Tone.PolySynth(Tone.FMSynth, {
  envelope: { attack: 0.003, decay: 1.1, release: 0.8, sustain: 0 },
  harmonicity: 4,
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.003, decay: 0.5, release: 0.5, sustain: 0 },
  modulationIndex: 2,
  oscillator: { type: 'sine' },
  volume: -19,
}).connect(oceanBells)

// C  Am  F  G  C  D7  G  G7, one chord a bar
const OCEAN_CHORDS = [
  { bass: 'C2', notes: ['E3', 'G3', 'B3', 'D4'] },
  { bass: 'A1', notes: ['E3', 'G3', 'C4', 'E4'] },
  { bass: 'F2', notes: ['A3', 'C4', 'E4', 'G4'] },
  { bass: 'G1', notes: ['F3', 'B3', 'D4', 'G4'] },
  { bass: 'C2', notes: ['E3', 'G3', 'C4', 'D4'] },
  { bass: 'D2', notes: ['F#3', 'A3', 'C4', 'E4'] },
  { bass: 'G1', notes: ['D3', 'G3', 'B3', 'D4'] },
  { bass: 'G1', notes: ['D3', 'F3', 'B3', 'F4'] },
]

loopOf(
  new Tone.Part(
    (time, chord) => {
      oceanPad.triggerAttackRelease(chord.notes, '1m', time, 0.5)
      oceanBass.triggerAttackRelease(chord.bass, '2n', time, 0.8)
      oceanBass.triggerAttackRelease(chord.bass, '4n', time + Tone.Time('2n').toSeconds() + 0.01, 0.55)
    },
    OCEAN_CHORDS.map((chord, bar) => ({ bass: chord.bass, notes: chord.notes, time: `${bar}:0:0` })),
  ),
  '8m',
)

// a kalimba running up and down each chord, from the third bar on, with rests so it breathes
const RUN = [0, 2, 1, 3, 2, 1, 3, 2]
const RESTS = new Set([5, 11, 22, 27, 33, 38, 44, 51])
loopOf(
  new Tone.Part(
    (time, hit) => {
      kalimba.triggerAttackRelease(hit.note, '8n', time + hit.late, hit.velocity)
    },
    OCEAN_CHORDS.flatMap((chord, bar) =>
      bar < 2
        ? []
        : RUN.flatMap((pick, step) => {
            const index = bar * 8 + step
            if (RESTS.has(index)) return []
            return [{ late: (dice(index) - 0.5) * 0.012, note: chord.notes[pick], time: `${bar}:${Math.floor(step / 2)}:${(step % 2) * 2}`, velocity: 0.3 + dice(index, 2) * 0.4 }]
          }),
    ),
  ),
  '8m',
)

// the tune : four notes that ask, four that answer
const OCEAN_TUNE: [string, string, string, number][] = [
  ['0:0:0', 'E5', '4n', 0.7],
  ['0:1:2', 'D5', '8n', 0.5],
  ['0:2:0', 'G5', '4n.', 0.65],
  ['1:1:0', 'E5', '8n', 0.5],
  ['1:2:0', 'C5', '4n', 0.6],
  ['1:3:0', 'D5', '4n', 0.55],
  ['4:0:0', 'E5', '4n', 0.7],
  ['4:1:2', 'G5', '8n', 0.55],
  ['4:2:0', 'A5', '4n.', 0.7],
  ['5:1:0', 'F#5', '8n', 0.5],
  ['5:2:0', 'D5', '4n', 0.6],
  ['5:3:0', 'E5', '4n', 0.55],
  ['7:0:0', 'G5', '4n', 0.65],
  ['7:1:0', 'D5', '2n', 0.6],
]
loopOf(
  new Tone.Part(
    (time, note) => {
      celesta.triggerAttackRelease(note.pitch, note.length, time + note.late, note.velocity)
    },
    OCEAN_TUNE.map(([time, pitch, length, velocity], index) => ({ late: (dice(index, 7) - 0.5) * 0.014, length, pitch, time, velocity })),
  ),
  '8m',
)

// ---------------------------------------------------------------- sunset : a sunny marimba groove, eight bars at 92 bpm

const SUNSET_BEAT = 60 / 92
const SUNSET_BAR = SUNSET_BEAT * 4
const sunsetAt = (bar: number, beat: number): number => bar * SUNSET_BAR + beat * SUNSET_BEAT

const sunsetRoom = new Tone.Reverb({ decay: 2, wet: 0.2 }).connect(themeMusic.sunset)
const marimba = new Tone.PolySynth(Tone.FMSynth, {
  envelope: { attack: 0.002, decay: 0.4, release: 0.25, sustain: 0 },
  harmonicity: 2,
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.002, decay: 0.18, release: 0.1, sustain: 0 },
  modulationIndex: 0.9,
  oscillator: { type: 'sine' },
  volume: -12,
}).connect(sunsetRoom)
const sunsetBass = new Tone.Synth({ envelope: { attack: 0.01, decay: 0.25, release: 0.3, sustain: 0.3 }, oscillator: { type: 'triangle' }, volume: -13 }).connect(themeMusic.sunset)
const sunsetChords = new Tone.PolySynth(Tone.Synth, { envelope: { attack: 0.4, decay: 0.5, release: 1.2, sustain: 0.6 }, oscillator: { type: 'triangle' }, volume: -26 }).connect(sunsetRoom)
const shakerTone = new Tone.Filter({ Q: 0.5, frequency: 6000, type: 'highpass' }).connect(themeMusic.sunset)
const shaker = new Tone.NoiseSynth({ envelope: { attack: 0.002, decay: 0.05, release: 0.04, sustain: 0 }, noise: { type: 'white' }, volume: -30 }).connect(shakerTone)
const sunsetKick = new Tone.MembraneSynth({ envelope: { attack: 0.002, decay: 0.3, release: 0.2, sustain: 0 }, octaves: 3, oscillator: { type: 'sine' }, pitchDecay: 0.05, volume: -22 }).connect(themeMusic.sunset)

// Am  F  C  G  Am  F  E  E
const SUNSET_CHORDS = [
  { bass: 'A2', fifth: 'E3', notes: ['A3', 'C4', 'E4'] },
  { bass: 'F2', fifth: 'C3', notes: ['F3', 'A3', 'C4'] },
  { bass: 'C3', fifth: 'G3', notes: ['C4', 'E4', 'G4'] },
  { bass: 'G2', fifth: 'D3', notes: ['B3', 'D4', 'G4'] },
  { bass: 'A2', fifth: 'E3', notes: ['A3', 'C4', 'E4'] },
  { bass: 'F2', fifth: 'C3', notes: ['F3', 'A3', 'C4'] },
  { bass: 'E2', fifth: 'B2', notes: ['E3', 'G#3', 'B3', 'E4'] },
  { bass: 'E2', fifth: 'B2', notes: ['E3', 'G#3', 'B3', 'E4'] },
]

function sunsetHit(kind: string, time: number, velocity = 0, note = '', notes: string[] = []) {
  return { kind, note, notes, time, velocity }
}

const SUNSET_HITS = SUNSET_CHORDS.flatMap((chord, bar) => {
  const hits = [
    sunsetHit('chord', sunsetAt(bar, 0), 0, '', chord.notes),
    sunsetHit('bass', sunsetAt(bar, 0), 0.8, chord.bass),
    sunsetHit('bass', sunsetAt(bar, 1.5), 0.55, chord.bass),
    sunsetHit('bass', sunsetAt(bar, 2), 0.65, chord.fifth),
    sunsetHit('bass', sunsetAt(bar, 3), 0.6, chord.bass),
    sunsetHit('kick', sunsetAt(bar, 0)),
    sunsetHit('kick', sunsetAt(bar, 2)),
  ]
  for (let step = 0; step < 8; step += 1) hits.push(sunsetHit('shaker', sunsetAt(bar, step / 2), step % 2 === 0 ? 0.4 : 0.8))
  return hits
})

loopOf(
  new Tone.Part((time, hit) => {
    if (hit.kind === 'chord') sunsetChords.triggerAttackRelease(hit.notes, SUNSET_BAR * 0.95, time, 0.5)
    else if (hit.kind === 'bass') sunsetBass.triggerAttackRelease(hit.note, SUNSET_BEAT * 0.8, time, hit.velocity)
    else if (hit.kind === 'kick') sunsetKick.triggerAttackRelease('C1', 0.2, time, 0.7)
    else shaker.triggerAttackRelease(0.04, time, hit.velocity)
  }, SUNSET_HITS),
  SUNSET_BAR * 8,
)

// the tune, as [beat, note] in each bar
const SUNSET_TUNE: [number, string][][] = [
  [
    [0, 'E5'],
    [1, 'C5'],
    [1.5, 'D5'],
    [2, 'E5'],
    [3, 'G5'],
  ],
  [
    [0, 'A5'],
    [1, 'G5'],
    [2, 'E5'],
    [2.5, 'C5'],
    [3, 'D5'],
  ],
  [
    [0, 'E5'],
    [1, 'G5'],
    [1.5, 'A5'],
    [2, 'G5'],
    [3, 'E5'],
  ],
  [
    [0, 'D5'],
    [1, 'E5'],
    [1.5, 'D5'],
    [2, 'B4'],
    [3, 'G4'],
  ],
  [
    [0, 'E5'],
    [1, 'C5'],
    [1.5, 'D5'],
    [2, 'E5'],
    [3, 'A5'],
  ],
  [
    [0, 'C6'],
    [1, 'A5'],
    [2, 'G5'],
    [2.5, 'F5'],
    [3, 'E5'],
  ],
  [
    [0, 'E5'],
    [1, 'G#5'],
    [2, 'B5'],
    [3, 'G#5'],
  ],
  [
    [0, 'E5'],
    [1.5, 'D5'],
    [2.5, 'B4'],
  ],
]
loopOf(
  new Tone.Part(
    (time, note) => {
      marimba.triggerAttackRelease(note.pitch, SUNSET_BEAT * 0.9, time + note.late, note.velocity)
    },
    SUNSET_TUNE.flatMap((notes, bar) => notes.map(([beat, pitch], index) => ({ late: (dice(bar * 8 + index, 5) - 0.5) * 0.01, pitch, time: sunsetAt(bar, beat), velocity: 0.55 + dice(bar * 8 + index, 6) * 0.35 }))),
  ),
  SUNSET_BAR * 8,
)

// ---------------------------------------------------------------- aurora : dreamy bells over a deep pad, eight bars at 66 bpm

const AURORA_BEAT = 60 / 66
const AURORA_BAR = AURORA_BEAT * 4
const auroraAt = (bar: number, beat: number): number => bar * AURORA_BAR + beat * AURORA_BEAT

const auroraRoom = new Tone.Reverb({ decay: 6, wet: 0.5 }).connect(themeMusic.aurora)
const auroraEcho = new Tone.FeedbackDelay({ delayTime: AURORA_BEAT * 0.75, feedback: 0.4, wet: 0.3 }).connect(auroraRoom)
const auroraPad = new Tone.PolySynth(Tone.Synth, { envelope: { attack: 2.2, decay: 1, release: 3.5, sustain: 0.9 }, oscillator: { type: 'sine' }, volume: -21 }).connect(auroraRoom)
const auroraBells = new Tone.PolySynth(Tone.FMSynth, {
  envelope: { attack: 0.003, decay: 1.6, release: 1.2, sustain: 0 },
  harmonicity: 5.01,
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.003, decay: 0.9, release: 0.6, sustain: 0 },
  modulationIndex: 2.5,
  oscillator: { type: 'sine' },
  volume: -18,
}).connect(auroraEcho)
const auroraSub = new Tone.Synth({ envelope: { attack: 0.8, decay: 0.5, release: 1.6, sustain: 0.9 }, oscillator: { type: 'sine' }, volume: -14 }).connect(themeMusic.aurora)

// Dm9  Bbmaj7  Gm9  A7sus4  Dm9  Fmaj7  Gm9  A7
const AURORA_CHORDS = [
  { bells: ['A5', 'F5', 'D6', 'E6'], notes: ['D3', 'A3', 'C4', 'E4', 'F4'], sub: 'D2' },
  { bells: ['D6', 'F6', 'A5', 'C6'], notes: ['Bb2', 'F3', 'A3', 'D4'], sub: 'Bb1' },
  { bells: ['Bb5', 'D6', 'F6', 'A5'], notes: ['G2', 'D3', 'F3', 'Bb3', 'A4'], sub: 'G1' },
  { bells: ['E6', 'D6', 'A5', 'G5'], notes: ['A2', 'E3', 'G3', 'D4'], sub: 'A1' },
  { bells: ['A5', 'F5', 'D6', 'E6'], notes: ['D3', 'A3', 'C4', 'E4', 'F4'], sub: 'D2' },
  { bells: ['C6', 'A5', 'E6', 'F6'], notes: ['F3', 'A3', 'C4', 'E4'], sub: 'F2' },
  { bells: ['Bb5', 'D6', 'F6', 'A5'], notes: ['G2', 'D3', 'F3', 'Bb3', 'A4'], sub: 'G1' },
  { bells: ['C#6', 'E6', 'A5', 'G5'], notes: ['A2', 'E3', 'G3', 'C#4'], sub: 'A1' },
]
const AURORA_BELL_BEATS = [0.5, 1.5, 2.25, 3.25]

loopOf(
  new Tone.Part(
    (time, hit) => {
      if (hit.kind === 'pad') auroraPad.triggerAttackRelease(hit.notes, AURORA_BAR * 1.1, time, 0.5)
      else auroraSub.triggerAttackRelease(hit.notes[0], AURORA_BAR * 0.95, time, 0.6)
    },
    AURORA_CHORDS.flatMap((chord, bar) => [
      { kind: 'pad', notes: chord.notes, time: auroraAt(bar, 0) },
      { kind: 'sub', notes: [chord.sub], time: auroraAt(bar, 0) },
    ]),
  ),
  AURORA_BAR * 8,
)
loopOf(
  new Tone.Part(
    (time, hit) => {
      auroraBells.triggerAttackRelease(hit.pitch, AURORA_BEAT * 1.5, time, hit.velocity)
    },
    AURORA_CHORDS.flatMap((chord, bar) =>
      chord.bells.flatMap((pitch, index) => {
        if (bar % 2 === 1 && index === 3) return []
        return [{ pitch, time: auroraAt(bar, AURORA_BELL_BEATS[index]), velocity: 0.35 + dice(bar * 4 + index, 3) * 0.4 }]
      }),
    ),
  ),
  AURORA_BAR * 8,
)

Tone.getTransport().start()
