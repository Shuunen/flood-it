import * as Tone from 'raea/tone'
import { dice } from './dice.ts'

/**
 * The sounds of the game : water poured, the interface, the celebrations. Written as Tone.js notes and synths so no
 * sound file is needed. The graph is made once when this file loads, as raea asks, and every cue is played through the
 * functions below at the frame it happens on. The music and the ambience are in music.ts.
 */

// ---------------------------------------------------------------- water, the sound of a move

const waterRoom = new Tone.Reverb({ decay: 1.6, wet: 0.22 }).connect(Tone.buses.sfx)
const uiRoom = new Tone.Reverb({ decay: 0.9, wet: 0.12 }).connect(Tone.buses.ui)

const pourTone = new Tone.Filter({ Q: 1.1, frequency: 500, type: 'bandpass' }).connect(waterRoom)
const pour = new Tone.NoiseSynth({ envelope: { attack: 0.05, decay: 0.5, release: 0.6, sustain: 0.4 }, noise: { type: 'pink' }, volume: 2 }).connect(pourTone)
const rushTone = new Tone.Filter({ Q: 0.8, frequency: 3000, type: 'highpass' }).connect(waterRoom)
const rush = new Tone.NoiseSynth({ envelope: { attack: 0.004, decay: 0.2, release: 0.2, sustain: 0 }, noise: { type: 'white' }, volume: -8 }).connect(rushTone)
const bloop = Tone.vary(new Tone.MembraneSynth({ envelope: { attack: 0.003, decay: 0.16, release: 0.1, sustain: 0 }, maxPolyphony: 10, octaves: 1.8, oscillator: { type: 'sine' }, pitchDecay: 0.045, poly: true, volume: -3 }), {
  pitch: 2.5,
  volume: 2.5,
}).connect(waterRoom)

const BLOOP_NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'E5', 'G5']

/** The water poured over the board : a pour that rises, a splash, then bubbles. `strength` is how much of the board it covers. */
export function playMove(time: number, strength: number, seed: number): void {
  const length = 0.55 + strength * 0.9
  pourTone.frequency.setValueAtTime(260, time)
  pourTone.frequency.exponentialRampToValueAtTime(1500, time + length + 0.2)
  pour.triggerAttackRelease(length, time, 0.55 + strength * 0.45)
  rush.triggerAttackRelease(0.14, time, 0.9)
  const bubbles = 3 + Math.round(strength * 7)
  for (let bubble = 0; bubble < bubbles; bubble += 1) {
    const at = time + 0.04 + (bubble / bubbles) * (length + 0.1) + dice(bubble, seed) * 0.06
    bloop.triggerAttackRelease(BLOOP_NOTES[(bubble + seed) % BLOOP_NOTES.length], 0.1, at, 0.35 + dice(bubble, seed + 3) * 0.45)
  }
}

// ---------------------------------------------------------------- the little sounds of the interface

const bell = new Tone.PolySynth(Tone.FMSynth, {
  envelope: { attack: 0.003, decay: 1.4, release: 1.2, sustain: 0 },
  harmonicity: 3.5,
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.003, decay: 0.8, release: 0.6, sustain: 0 },
  modulationIndex: 2.2,
  oscillator: { type: 'sine' },
  volume: -12,
}).connect(waterRoom)
const tick = Tone.vary(new Tone.Synth({ envelope: { attack: 0.002, decay: 0.05, release: 0.05, sustain: 0 }, maxPolyphony: 6, oscillator: { type: 'sine' }, poly: true, volume: -9 }), { pitch: 1.5, volume: 2 }).connect(uiRoom)
const bonk = new Tone.MembraneSynth({ envelope: { attack: 0.002, decay: 0.2, release: 0.1, sustain: 0 }, octaves: 2, oscillator: { type: 'sine' }, pitchDecay: 0.06, volume: -6 }).connect(uiRoom)

export function playTap(time: number): void {
  tick.triggerAttackRelease('A5', 0.05, time, 0.8)
}

export function playType(time: number, seed: number): void {
  tick.triggerAttackRelease(['E6', 'G6', 'A6', 'C7'][seed % 4], 0.03, time, 0.45)
}

export function playBack(time: number): void {
  tick.triggerAttackRelease('D5', 0.05, time, 0.7)
}

export function playError(time: number): void {
  bonk.triggerAttackRelease('A2', 0.2, time, 0.8)
  bonk.triggerAttackRelease('E2', 0.25, time + 0.09, 0.7)
}

export function playSelect(time: number): void {
  bell.triggerAttackRelease('E5', 0.3, time, 0.6)
  bell.triggerAttackRelease('B5', 0.5, time + 0.1, 0.65)
}

export function playNewGame(time: number): void {
  pourTone.frequency.setValueAtTime(300, time)
  pourTone.frequency.exponentialRampToValueAtTime(2600, time + 0.5)
  pour.triggerAttackRelease(0.45, time, 0.5)
  for (const [index, note] of ['G5', 'C6', 'E6'].entries()) bloop.triggerAttackRelease(note, 0.1, time + 0.08 + index * 0.1, 0.5)
}

// ---------------------------------------------------------------- the celebrations

const brassTone = new Tone.Filter({ Q: 0.7, frequency: 2300, type: 'lowpass' }).connect(new Tone.Reverb({ decay: 2.2, wet: 0.28 }).connect(Tone.buses.sfx))
const brass = new Tone.PolySynth(Tone.Synth, { envelope: { attack: 0.06, decay: 0.2, release: 0.9, sustain: 0.7 }, oscillator: { type: 'sawtooth' }, volume: -20 }).connect(brassTone)
const timpani = new Tone.MembraneSynth({ envelope: { attack: 0.002, decay: 0.7, release: 0.6, sustain: 0 }, octaves: 2.5, oscillator: { type: 'sine' }, pitchDecay: 0.08, volume: -4 }).connect(waterRoom)
const shimmerTone = new Tone.Filter({ Q: 0.6, frequency: 4500, type: 'highpass' }).connect(waterRoom)
const shimmer = new Tone.NoiseSynth({ envelope: { attack: 1.1, decay: 0.6, release: 1.4, sustain: 0.6 }, noise: { type: 'white' }, volume: -23 }).connect(shimmerTone)
const popTone = new Tone.Filter({ Q: 0.9, frequency: 1100, type: 'bandpass' }).connect(waterRoom)
const pop = new Tone.NoiseSynth({ envelope: { attack: 0.002, decay: 0.22, release: 0.3, sustain: 0 }, noise: { type: 'pink' }, volume: -4 }).connect(popTone)

/** A plain win : a wave comes in and a rising chime rings over it. */
export function playWin(time: number): void {
  pourTone.frequency.setValueAtTime(220, time)
  pourTone.frequency.exponentialRampToValueAtTime(1800, time + 1.2)
  pour.triggerAttackRelease(1.2, time, 0.8)
  for (const [index, note] of ['C5', 'E5', 'G5', 'C6', 'E6'].entries()) bell.triggerAttackRelease(note, 0.6, time + 0.15 + index * 0.1, 0.55 + index * 0.06)
  bell.triggerAttackRelease(['C5', 'G5', 'E6'], 1.2, time + 0.7, 0.55)
}

/** A new best : timpani, a brass fanfare, a glittering run to the top, and a firework every 24 frames. */
export function playBest(time: number): void {
  timpani.triggerAttackRelease('C2', 0.6, time, 1)
  timpani.triggerAttackRelease('G1', 0.6, time + 0.28, 0.85)
  timpani.triggerAttackRelease('C2', 1.2, time + 1.12, 1)
  brass.triggerAttackRelease(['C4', 'G4', 'C5'], 0.5, time + 0.02, 0.8)
  brass.triggerAttackRelease(['E4', 'G4', 'C5', 'E5'], 0.5, time + 0.58, 0.85)
  brass.triggerAttackRelease(['C4', 'G4', 'C5', 'E5', 'G5'], 1.9, time + 1.14, 0.95)
  for (const [index, note] of ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].entries()) bell.triggerAttackRelease(note, 0.8, time + 0.1 + index * 0.075, 0.6 + index * 0.05)
  bell.triggerAttackRelease(['C6', 'E6', 'G6', 'C7'], 1.8, time + 1.14, 0.7)
  shimmer.triggerAttackRelease(1.9, time + 0.2, 0.9)
  pourTone.frequency.setValueAtTime(200, time)
  pourTone.frequency.exponentialRampToValueAtTime(2200, time + 1.3)
  pour.triggerAttackRelease(1.3, time, 0.7)
  // the fireworks of the picture start 8 frames after the celebration, one every 24 frames, at 60 frames a second
  for (let burst = 0; burst < 10; burst += 1) {
    const at = time + (8 + burst * 24) / 60
    popTone.frequency.setValueAtTime(700 + dice(burst) * 900, at)
    pop.triggerAttackRelease(0.22, at, 0.8)
    for (let spark = 0; spark < 6; spark += 1) tick.triggerAttackRelease(['E6', 'G6', 'A6', 'C7', 'D7'][(burst + spark) % 5], 0.06, at + 0.12 + spark * 0.045 + dice(spark, burst) * 0.03, 0.4)
  }
}
