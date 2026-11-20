import { STAGE } from '../game/layout.ts'
import { noise, ring, useLook, type Look } from './theme.ts'

const WAVES_TOP = 980

function wavePath(width: number, top: number, bottom: number, amplitude: number, length: number, phase: number): string {
  let path = `M0 ${bottom}`
  for (let x = 0; x <= width; x += 40) path += ` L${x} ${(top + Math.sin((x / length) * Math.PI * 2 + phase) * amplitude).toFixed(1)}`
  return `${path} L${width} ${bottom} Z`
}

const BUBBLES = Array.from({ length: 16 }, (_unused, index) => ({
  drift: 14 + noise(index, 3) * 26,
  radius: 5 + noise(index, 1) * 15,
  speed: 0.35 + noise(index, 2) * 0.7,
  start: noise(index, 4) * 1300,
  x: 40 + noise(index, 5) * (STAGE.width - 80),
}))

const STARS = Array.from({ length: 36 }, (_unused, index) => ({ phase: noise(index, 8) * 6, size: 2 + noise(index, 7) * 3, x: noise(index, 5) * STAGE.width, y: noise(index, 6) * 620 }))

/** The sun low on the horizon of the sunset. */
function Sun({ frame }: { frame: number }) {
  return (
    <div
      style={{
        backgroundImage: 'radial-gradient(circle, #fff6cc 0%, #ffd985 32%, #ff9a5a 66%, rgba(255,120,80,0) 100%)',
        borderRadius: 300,
        height: 600,
        left: STAGE.width / 2 - 300,
        opacity: 0.85 + Math.sin(frame / 90) * 0.05,
        position: 'absolute',
        top: 800,
        width: 600,
      }}
    />
  )
}

/** Curtains of light and a few stars, for the aurora. */
function Aurora({ frame }: { frame: number }) {
  const curtains = [
    { color: '60,255,170', left: 120, width: 760 },
    { color: '150,100,255', left: 700, width: 640 },
    { color: '40,230,255', left: 1180, width: 720 },
  ]
  return (
    <>
      {STARS.map((star, index) => (
        <div
          key={index}
          style={{ backgroundColor: '#ffffff', borderRadius: star.size, height: star.size, left: star.x, opacity: 0.35 + 0.5 * Math.abs(Math.sin(frame / 70 + star.phase)), position: 'absolute', top: star.y, width: star.size }}
        />
      ))}
      {curtains.map((curtain, index) => (
        <div
          key={curtain.color}
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 34%, rgba(${curtain.color},0.42) 0%, rgba(${curtain.color},0.16) 42%, rgba(${curtain.color},0) 72%)`,
            height: 760,
            left: curtain.left + Math.sin(frame / 240 + index * 2) * 70,
            opacity: 0.6 + 0.4 * Math.sin(frame / 170 + index),
            position: 'absolute',
            top: 20,
            width: curtain.width,
          }}
        />
      ))}
    </>
  )
}

function extrasOf(look: Look, frame: number) {
  if (look.extras === 'sun') return <Sun frame={frame} />
  return look.extras === 'aurora' ? <Aurora frame={frame} /> : null
}

/** The scenery behind everything : the sky of the theme, light from above, rising bubbles and slow waves at the bottom. */
export function Backdrop({ frame }: { frame: number }) {
  const look = useLook()
  const { backdrop } = look
  return (
    <div style={{ height: STAGE.height, left: 0, overflow: 'hidden', position: 'absolute', top: 0, width: STAGE.width }}>
      <div style={{ backgroundImage: backdrop.sky, height: STAGE.height, left: 0, position: 'absolute', top: 0, width: STAGE.width }} />
      {backdrop.rays === '' ? null : (
        <div
          style={{
            backgroundImage: `repeating-conic-gradient(from 90deg at 50% -400px, ${backdrop.rays} 0deg 5deg, rgba(150,210,255,0) 5deg 13deg)`,
            height: 1000,
            left: 0,
            position: 'absolute',
            top: 0,
            width: STAGE.width,
          }}
        />
      )}
      <div style={{ backgroundImage: backdrop.light, height: 700, left: 0, position: 'absolute', top: look.extras === 'sun' ? 380 : 0, width: STAGE.width }} />
      {extrasOf(look, frame)}
      {BUBBLES.map((bubble, index) => {
        const travel = (bubble.start + frame * bubble.speed) % (STAGE.height + 120)
        const y = Math.round(STAGE.height + 40 - travel)
        const x = Math.round(bubble.x + Math.sin(frame / 70 + index) * bubble.drift)
        return (
          <div
            key={index}
            style={{
              backgroundImage: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65), rgba(${backdrop.bubble},0.10) 55%, rgba(${backdrop.bubble},0) 72%)`,
              borderRadius: bubble.radius,
              boxShadow: ring(1.5, `rgba(${backdrop.bubble},0.35)`),
              height: bubble.radius * 2,
              left: x,
              opacity: 0.55,
              position: 'absolute',
              top: y,
              width: bubble.radius * 2,
            }}
          />
        )
      })}
      <svg height={STAGE.height - WAVES_TOP} style={{ left: 0, position: 'absolute', top: WAVES_TOP }} viewBox={`0 ${WAVES_TOP} ${STAGE.width} ${STAGE.height - WAVES_TOP}`} width={STAGE.width}>
        <path d={wavePath(STAGE.width, 1010, STAGE.height, 16, 520, frame / 55)} fill={backdrop.waves[0]} />
        <path d={wavePath(STAGE.width, 1034, STAGE.height, 12, 380, -frame / 42 + 1)} fill={backdrop.waves[1]} />
        <path d={wavePath(STAGE.width, 1056, STAGE.height, 9, 300, frame / 33 + 2)} fill={backdrop.waves[2]} />
      </svg>
    </div>
  )
}

/** A small picture of a theme, for the settings. */
export function Sky({ height, look, width, x, y }: { height: number; look: Look; width: number; x: number; y: number }) {
  return (
    <div style={{ backgroundImage: look.backdrop.sky, borderRadius: 28, height, left: x, overflow: 'hidden', position: 'absolute', top: y, width }}>
      <div style={{ backgroundImage: look.backdrop.light, height: height * 1.2, left: 0, position: 'absolute', top: look.extras === 'sun' ? height * 0.3 : 0, width }} />
    </div>
  )
}
