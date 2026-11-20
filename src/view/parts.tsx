import type { CSSProperties, ReactNode } from 'react'
import type { Rect } from '../game/layout.ts'
import { accentGlow, alpha, GOLD, INK, mix, primaryGradient, ring, useLook, waterColor } from './theme.ts'

export type Pointer = { down: boolean; x: number; y: number } | undefined

export function hovering(pointer: Pointer, rect: Rect): boolean {
  return pointer !== undefined && pointer.x >= rect.x && pointer.x <= rect.x + rect.width && pointer.y >= rect.y && pointer.y <= rect.y + rect.height
}

/** Text in a box of its own, centered vertically. */
export function Text({
  align = 'left',
  children,
  color = INK,
  height,
  size,
  spacing = 0,
  style,
  weight = 600,
  width,
  x,
  y,
}: {
  align?: 'center' | 'left' | 'right'
  children: ReactNode
  color?: string
  height: number
  size: number
  spacing?: number
  style?: CSSProperties
  weight?: number
  width: number
  x: number
  y: number
}) {
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  return (
    <div
      style={{
        alignItems: 'center',
        color,
        display: 'flex',
        fontSize: size,
        fontWeight: weight,
        height,
        justifyContent: justify,
        left: x,
        letterSpacing: spacing,
        lineHeight: 1,
        position: 'absolute',
        top: y,
        whiteSpace: 'nowrap',
        width,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** A frosted glass panel. */
export function Glass({ children, glow, hot = false, radius = 28, rect, style }: { children?: ReactNode; glow?: string; hot?: boolean; radius?: number; rect: Rect; style?: CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: hot ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.075)',
        backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 55%)',
        borderRadius: radius,
        boxShadow: `${ring(2, hot ? 'rgba(255,255,255,0.55)' : 'rgba(190,225,255,0.24)')}, 0 18px 40px rgba(0,0,0,0.38)${glow ? `, 0 0 36px ${glow}` : ''}`,
        height: rect.height,
        left: rect.x,
        position: 'absolute',
        top: rect.y,
        width: rect.width,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** A button with a label and the key that does the same. */
export function Button({ hot, keycap, label, primary = false, rect }: { hot: boolean; keycap: string; label: string; primary?: boolean; rect: Rect }) {
  const look = useLook()
  return (
    <div
      style={{
        alignItems: 'center',
        backgroundImage: primary ? primaryGradient(look) : 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)',
        borderRadius: rect.height / 2,
        boxShadow: `${ring(2, primary ? look.accent.ring : hot ? 'rgba(255,255,255,0.6)' : 'rgba(190,225,255,0.28)')}, ${primary ? `0 14px 34px ${accentGlow(look, hot ? 0.75 : 0.45)}` : '0 10px 26px rgba(0,0,0,0.3)'}`,
        color: INK,
        display: 'flex',
        fontSize: 30,
        fontWeight: 700,
        gap: 18,
        height: rect.height,
        justifyContent: 'center',
        left: rect.x,
        paddingLeft: 28,
        paddingRight: 28,
        position: 'absolute',
        top: rect.y,
        transform: hot ? 'scale(1.03)' : 'none',
        whiteSpace: 'nowrap',
        width: rect.width - 56,
      }}
    >
      {label}
      <div
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(0,10,40,0.35)',
          borderRadius: 10,
          boxShadow: ring(1.5, 'rgba(255,255,255,0.3)'),
          display: 'flex',
          flexShrink: 0,
          fontSize: 22,
          fontWeight: 700,
          height: 40,
          justifyContent: 'center',
          width: keycap.length > 1 ? 66 : 40,
        }}
      >
        {keycap}
      </div>
    </div>
  )
}

/** A round picture for a player : their initial on a water color taken from their name. */
export function Avatar({ color, name, size, x, y }: { color: number; name: string; size: number; x: number; y: number }) {
  const water = waterColor(color)
  return (
    <div
      style={{
        alignItems: 'center',
        backgroundImage: `radial-gradient(circle at 32% 26%, ${water.light} 0%, ${water.base} 52%, ${water.dark} 100%)`,
        borderRadius: size / 2,
        boxShadow: `${ring(2, 'rgba(255,255,255,0.55)')}, 0 6px 18px ${alpha(water.base, 0.55)}`,
        color: '#fff',
        display: 'flex',
        fontSize: size * 0.46,
        fontWeight: 800,
        height: size,
        justifyContent: 'center',
        left: x,
        position: 'absolute',
        textShadow: '0 2px 6px rgba(0,0,0,0.4)',
        top: y,
        width: size,
      }}
    >
      {[...name][0]?.toUpperCase() ?? '?'}
    </div>
  )
}

/** A five pointed star. */
export function Star({ color = GOLD, size, x, y }: { color?: string; size: number; x: number; y: number }) {
  const points = Array.from({ length: 10 }, (_unused, index) => {
    const radius = index % 2 === 0 ? 50 : 21
    const angle = (Math.PI * index) / 5 - Math.PI / 2
    return `${(50 + Math.cos(angle) * radius).toFixed(1)},${(52 + Math.sin(angle) * radius).toFixed(1)}`
  }).join(' ')
  return (
    <svg height={size} style={{ left: x - size / 2, position: 'absolute', top: y - size / 2 }} viewBox="0 0 100 100" width={size}>
      <polygon fill={color} points={points} stroke={mix(color, '#ffffff', 0.55)} strokeLinejoin="round" strokeWidth="5" />
    </svg>
  )
}

/** The water drop that stands for the game. */
export function Drop({ size, x, y }: { size: number; x: number; y: number }) {
  const look = useLook()
  return (
    <svg height={size} style={{ left: x, position: 'absolute', top: y }} viewBox="0 0 100 100" width={size}>
      <defs>
        <linearGradient id="logo-drop" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(look.accent.from, '#ffffff', 0.35)} />
          <stop offset="1" stopColor={look.accent.to} />
        </linearGradient>
      </defs>
      <path d="M50 6 C 50 6 18 46 18 66 A 32 32 0 0 0 82 66 C 82 46 50 6 50 6 Z" fill="url(#logo-drop)" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
      <ellipse cx="38" cy="62" fill="rgba(255,255,255,0.55)" rx="6" ry="11" transform="rotate(18 38 62)" />
    </svg>
  )
}
