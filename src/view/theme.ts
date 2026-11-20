import { createContext, useContext } from 'react'
import type { ThemeId } from '../logic/profiles.ts'

/** The water colors, the first `colors` of them are used on a board. */
export const WATER = [
  { base: '#2f7bff', dark: '#1236a6', light: '#8cc0ff', name: 'azure' },
  { base: '#ff3f8e', dark: '#a3135a', light: '#ffa3c6', name: 'coral' },
  { base: '#7be32b', dark: '#3a8f0e', light: '#c9ff8f', name: 'lime' },
  { base: '#ffa31c', dark: '#b05600', light: '#ffd786', name: 'amber' },
  { base: '#9b63ff', dark: '#5320b5', light: '#d0b3ff', name: 'violet' },
  { base: '#14d8c6', dark: '#07766f', light: '#8ff7ec', name: 'teal' },
] as const

export const GOLD = '#ffd45e'
export const INK = '#eaf6ff'
export const INK_SOFT = 'rgba(234,246,255,0.62)'

/** A ring just inside the edge of a box. It looks like a border, without its cost : real borders are very slow to draw in raea. */
export function ring(width: number, color: string): string {
  return `inset 0 0 0 ${width}px ${color}`
}

export function clamp(value: number, low = 0, high = 1): number {
  return Math.min(high, Math.max(low, value))
}

export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

export function easeOutBack(value: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2
}

function channels(hex: string): [number, number, number] {
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)]
}

/** A color between two hex colors. */
export function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = channels(from)
  const [r2, g2, b2] = channels(to)
  const part = (a: number, b: number) =>
    Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, '0')
  return `#${part(r1, r2)}${part(g1, g2)}${part(b1, b2)}`
}

/** A hex color with some transparency. */
export function alpha(hex: string, opacity: number): string {
  const [r, g, b] = channels(hex)
  return `rgba(${r},${g},${b},${opacity.toFixed(3)})`
}

/** A stable number from 0 to 1 for an index and a salt : the same particle every frame, different from its neighbours. */
export function noise(index: number, salt = 0): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43_758.5453
  return value - Math.floor(value)
}

export function waterColor(index: number) {
  return WATER[index % WATER.length]
}

/** What makes a theme look like itself : its accent color, its sky and its sea. The water colors of the game stay the same. */
export type Look = {
  accent: {
    from: string
    /** red, green and blue of the glow around the accent buttons */
    glow: string
    ring: string
    to: string
  }
  backdrop: {
    /** red, green and blue of the bubbles */
    bubble: string
    /** a soft light over the sky */
    light: string
    /** the rays from above, nothing when the sky has none */
    rays: string
    sky: string
    waves: [string, string, string]
  }
  blurb: string
  extras: 'aurora' | 'none' | 'sun'
  id: ThemeId
  music: string
  name: string
}

export const LOOKS: Record<ThemeId, Look> = {
  aurora: {
    accent: { from: '#6df0b8', glow: '30,200,140', ring: 'rgba(210,255,235,0.85)', to: '#14b07c' },
    backdrop: {
      bubble: '170,255,225',
      light: 'radial-gradient(ellipse at 50% 0%, rgba(80,255,190,0.18), rgba(80,255,190,0) 60%)',
      rays: '',
      sky: 'linear-gradient(180deg,#020712 0%,#04142a 48%,#032a2a 100%)',
      waves: ['rgba(40,200,170,0.20)', 'rgba(60,230,190,0.16)', 'rgba(150,255,225,0.14)'],
    },
    blurb: 'A clear night under dancing lights.',
    extras: 'aurora',
    id: 'aurora',
    music: 'dreamy bells and a deep pad',
    name: 'Aurora',
  },
  ocean: {
    accent: { from: '#5fd0ff', glow: '20,140,240', ring: 'rgba(210,240,255,0.8)', to: '#1e8de8' },
    backdrop: {
      bubble: '190,230,255',
      light: 'radial-gradient(ellipse at 50% 0%, rgba(120,200,255,0.30), rgba(120,200,255,0) 62%)',
      rays: 'rgba(150,210,255,0.085)',
      sky: 'linear-gradient(180deg,#0d3a6b 0%,#082a52 28%,#05172f 62%,#020a17 100%)',
      waves: ['rgba(31,127,209,0.22)', 'rgba(42,160,232,0.20)', 'rgba(127,212,255,0.16)'],
    },
    blurb: 'The deep blue sea, calm and bright.',
    extras: 'none',
    id: 'ocean',
    music: 'a calm kalimba and the sea',
    name: 'Ocean',
  },
  sunset: {
    accent: { from: '#ffb56b', glow: '255,110,60', ring: 'rgba(255,226,200,0.85)', to: '#ff5c3d' },
    backdrop: {
      bubble: '255,225,195',
      light: 'radial-gradient(ellipse at 50% 100%, rgba(255,170,100,0.45), rgba(255,170,100,0) 62%)',
      rays: 'rgba(255,200,150,0.09)',
      sky: 'linear-gradient(180deg,#1d1148 0%,#4a1f6b 30%,#a63d6b 60%,#e8714a 84%,#9a3f55 100%)',
      waves: ['rgba(255,120,90,0.30)', 'rgba(210,80,110,0.30)', 'rgba(120,40,110,0.38)'],
    },
    blurb: 'A warm evening on the water.',
    extras: 'sun',
    id: 'sunset',
    music: 'a sunny marimba groove',
    name: 'Sunset',
  },
}

export const LookContext = createContext<Look>(LOOKS.ocean)

export function useLook(): Look {
  return useContext(LookContext)
}

/** The gradient of the main buttons. */
export function primaryGradient(look: Look): string {
  return `linear-gradient(180deg, ${look.accent.from} 0%, ${look.accent.to} 100%)`
}

/** The glow of the accent, as a color. */
export function accentGlow(look: Look, opacity: number): string {
  return `rgba(${look.accent.glow},${opacity})`
}
