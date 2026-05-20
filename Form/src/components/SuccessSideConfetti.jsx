import { useMemo } from 'react'
import { motion } from 'framer-motion'

const PALETTE = [
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#fb7185',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#c084fc',
]

function buildParticles(count, side) {
  return Array.from({ length: count }, (_, i) => {
    const topPct = 4 + Math.random() * 92
    const reachX = 28 + Math.random() * 58
    const driftY = (Math.random() - 0.5) * 55
    const arcY = (Math.random() - 0.5) * 35
    return {
      id: `${side}-${i}`,
      topPct,
      reachX,
      driftY,
      arcY,
      delay: Math.random() * 0.18,
      dur: 0.85 + Math.random() * 0.55,
      color: PALETTE[i % PALETTE.length],
      w: 3 + Math.random() * 5,
      h: 7 + Math.random() * 12,
      spin: (Math.random() - 0.5) * 900,
    }
  })
}

/**
 * @param {{ seed: string }} props — animatsiya qayta ishga tushishi uchun noyob kalit
 */
export default function SuccessSideConfetti({ seed }) {
  const { left, right } = useMemo(() => {
    if (!seed) return { left: [], right: [] }
    return {
      left: buildParticles(52, 'L'),
      right: buildParticles(52, 'R'),
    }
  }, [seed])

  if (!seed) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[195] overflow-hidden"
      aria-hidden
    >
      {left.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-[1px] shadow-[0_0_6px_rgba(255,255,255,0.35)]"
          style={{
            left: 0,
            top: `${p.topPct}%`,
            width: p.w,
            height: p.h,
            background: `linear-gradient(180deg, ${p.color}, ${p.color}cc)`,
            transformOrigin: 'center center',
          }}
          initial={{ opacity: 0, x: '-4vw', y: 0, scale: 0.2, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0.85, 0],
            x: [`0vw`, `${p.reachX * 0.35}vw`, `${p.reachX}vw`],
            y: [0, `${p.arcY}vh`, `${p.driftY}vh`],
            rotate: [0, p.spin * 0.4, p.spin],
            scale: [0.2, 1.15, 0.85, 0.4],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            times: [0, 0.12, 0.55, 0.82, 1],
            ease: [0.16, 0.84, 0.44, 1],
          }}
        />
      ))}
      {right.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-[1px] shadow-[0_0_6px_rgba(255,255,255,0.35)]"
          style={{
            right: 0,
            top: `${p.topPct}%`,
            width: p.w,
            height: p.h,
            background: `linear-gradient(180deg, ${p.color}, ${p.color}cc)`,
            transformOrigin: 'center center',
          }}
          initial={{ opacity: 0, x: '4vw', y: 0, scale: 0.2, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0.85, 0],
            x: [`0vw`, `${-p.reachX * 0.35}vw`, `${-p.reachX}vw`],
            y: [0, `${p.arcY}vh`, `${p.driftY}vh`],
            rotate: [0, -p.spin * 0.4, -p.spin],
            scale: [0.2, 1.15, 0.85, 0.4],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            times: [0, 0.12, 0.55, 0.82, 1],
            ease: [0.16, 0.84, 0.44, 1],
          }}
        />
      ))}
    </div>
  )
}
