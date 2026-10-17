import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { isMilestone, levelFor } from '../lib/levels'
import { REGION_COLOR, TOTAL, type Mountain } from '../lib/mountains'
import { shortDate } from '../lib/store'
import { Mascot, type Mood } from './Mascot'

type Props = {
  mountain: Mountain
  count: number
  date: string
  onClose: () => void
}

const PASTELS = ['#FF9EAA', '#FFD36E', '#7FD3A8', '#8EC5FF', '#B79CFF', '#FFFFFF']

const SPARKLES = [
  { x: -120, y: -40, s: 1, d: 0 },
  { x: 118, y: -70, s: 0.8, d: 0.4 },
  { x: -96, y: 70, s: 0.6, d: 0.9 },
  { x: 128, y: 40, s: 1.1, d: 0.2 },
  { x: -30, y: -128, s: 0.7, d: 0.7 },
  { x: 60, y: -120, s: 0.5, d: 1.1 },
]

function Sparkle({ size = 22, color = '#FFD36E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill={color} />
    </svg>
  )
}

type Heart = { id: number; x: number; emoji: string }

export function Celebration({ mountain, count, date, onClose }: Props) {
  const reduce = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [hearts, setHearts] = useState<Heart[]>([])
  const [hops, setHops] = useState(0)
  const color = REGION_COLOR[mountain.region]
  const milestone = isMilestone(count)
  const { current: level } = levelFor(count)

  useEffect(() => {
    navigator.vibrate?.([30, 80, 30, 80, 160])
    const moodTimer = setTimeout(() => setMood('happy'), reduce ? 0 : 620)
    if (reduce || !canvasRef.current) return () => clearTimeout(moodTimer)

    const fire = confetti.create(canvasRef.current, { resize: true })
    const emoji = ['🌸', '⭐', '🍀'].map((text) => confetti.shapeFromText({ text, scalar: 2.2 }))
    const timers = [
      // 착지 순간 양옆에서 팡!
      setTimeout(() => {
        fire({ particleCount: 70, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.75 }, colors: PASTELS })
        fire({ particleCount: 70, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.75 }, colors: PASTELS })
      }, 600),
      // 도장 쾅! 순간 가운데에서 꽃·별
      setTimeout(() => {
        fire({ particleCount: 40, spread: 100, startVelocity: 38, scalar: 2.2, shapes: emoji, origin: { y: 0.42 }, ticks: 160 })
      }, 1380),
      // 꽃비
      setTimeout(() => {
        const end = Date.now() + (milestone ? 3500 : 1600)
        const rain = () => {
          fire({ particleCount: 2, angle: 270, spread: 180, startVelocity: 4, gravity: 0.5, drift: 0.4, scalar: 2, ticks: 260, shapes: emoji, origin: { x: Math.random(), y: -0.05 } })
          if (Date.now() < end) requestAnimationFrame(rain)
        }
        rain()
      }, 1900),
    ]
    return () => {
      clearTimeout(moodTimer)
      timers.forEach(clearTimeout)
      fire.reset()
    }
  }, [reduce, milestone])

  const poke = () => {
    setHops((h) => h + 1)
    navigator.vibrate?.(20)
    const id = Date.now()
    const items = ['💚', '💛', '🩷', '✨'].map((emoji, i) => ({ id: id + i, x: (i - 1.5) * 34 + Math.random() * 16, emoji }))
    setHearts((h) => [...h, ...items])
  }

  return (
    <motion.div
      className="celebrate"
      role="dialog"
      aria-label={`${mountain.name} 정복`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      style={{ ['--tint' as string]: color }}
    >
      <div className="celebrate-rays" />
      <motion.div className="cloud c1" animate={{ x: [-20, 30, -20] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="cloud c2" animate={{ x: [20, -30, 20] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div
        className="celebrate-body"
        animate={reduce ? undefined : { x: [0, 0, -9, 9, -5, 3, 0] }}
        transition={{ delay: 1.32, duration: 0.4 }}
      >
        <div className="celebrate-stage">
          {!reduce &&
            SPARKLES.map((s, i) => (
              <motion.div
                key={i}
                className="sparkle"
                style={{ x: s.x, y: s.y }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, s.s, 0], rotate: [0, 90, 180] }}
                transition={{ delay: 1 + s.d, duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
              >
                <Sparkle color={i % 2 ? '#FFFFFF' : '#FFD36E'} />
              </motion.div>
            ))}

          <motion.div
            className="celebrate-shadow"
            initial={{ scaleX: 0.3, opacity: 0 }}
            animate={{ scaleX: [0.3, 0.5, 1.15, 0.9, 1], opacity: 1 }}
            transition={{ duration: 1, times: [0, 0.45, 0.65, 0.82, 1] }}
          />

          {/* 아래에서 튀어올라 쿵 착지 → 찌그러졌다 펴지는 squash & stretch */}
          <motion.div
            className="celebrate-mascot"
            initial={reduce ? false : { y: 340 }}
            animate={reduce ? undefined : { y: [340, -70, 0, -20, 0], scaleY: [1, 1.14, 0.76, 1.06, 1], scaleX: [1, 0.88, 1.2, 0.96, 1] }}
            transition={{ duration: 1, times: [0, 0.45, 0.65, 0.82, 1], ease: 'easeOut' }}
            onClick={poke}
          >
            <motion.div
              key={hops}
              animate={reduce ? undefined : hops ? { y: [0, -46, 0], rotate: [0, -8, 8, 0] } : { y: [0, -12, 0] }}
              transition={hops ? { duration: 0.5, ease: 'easeOut' } : { delay: 2.2, duration: 0.55, repeat: Infinity, repeatDelay: 0.9 }}
            >
              <Mascot size={190} color={color} mood={mood} flag plantDelay={reduce ? undefined : 0.85} />
            </motion.div>
          </motion.div>

          <motion.div
            className="bubble"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -6 }}
            transition={{ delay: 1.05, type: 'spring', stiffness: 500, damping: 14 }}
          >
            야호~!
          </motion.div>

          {hearts.map((h) => (
            <motion.span
              key={h.id}
              className="float-heart"
              initial={{ x: h.x, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ y: -150 - Math.random() * 40, opacity: 0, scale: 1.3 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              onAnimationComplete={() => setHearts((all) => all.filter((x) => x.id !== h.id))}
            >
              {h.emoji}
            </motion.span>
          ))}

          {/* 도장 쾅! */}
          <motion.div
            className="stamp-ring"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.9], opacity: [0.7, 0] }}
            transition={{ delay: 1.34, duration: 0.6 }}
          />
          <motion.div
            className="stamp-big"
            initial={{ scale: 3.4, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: -14, opacity: 1 }}
            transition={{ delay: reduce ? 0 : 1.2, type: 'spring', stiffness: 600, damping: 17 }}
          >
            <span className="stamp-top">MOUNTAIN 100</span>
            <b>정복</b>
            <span className="stamp-date">{shortDate(date)}</span>
          </motion.div>
        </div>

        <h2 className="celebrate-title" aria-label={`${mountain.name} 정복!`}>
          {[...mountain.name, ' ', ...'정복!'].map((ch, i) => (
            <motion.span
              key={i}
              className={i > mountain.name.length ? 'accent' : undefined}
              initial={reduce ? false : { y: 36, opacity: 0, rotate: i % 2 ? 12 : -12 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 1.55 + i * 0.06, type: 'spring', stiffness: 520, damping: 13 }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h2>

        <motion.p
          className="celebrate-sub"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 2 }}
        >
          {mountain.peak} {mountain.height.toLocaleString()}m · 명산 {TOTAL}개 중 <b>{count}번째</b>
        </motion.p>

        {milestone && (
          <motion.div
            className="milestone"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduce ? 0 : 2.25, type: 'spring', stiffness: 400, damping: 12 }}
          >
            <span>{level.emoji}</span>
            <div>
              <b>{count === TOTAL ? `명산 ${TOTAL} 완등!!` : `${count}개 명산 달성!`}</b>
              <small>새 칭호 「{level.title}」</small>
            </div>
          </motion.div>
        )}

        <motion.button
          className="btn btn-primary celebrate-btn"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 2.4 }}
          whileTap={{ scale: 0.94 }}
          onClick={onClose}
        >
          야호! 계속하기
        </motion.button>
        <motion.p className="celebrate-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
          산이를 콕 눌러보세요
        </motion.p>
      </motion.div>

      <canvas ref={canvasRef} className="confetti-canvas" />
    </motion.div>
  )
}
