import { motion } from 'motion/react'
import { useId, type CSSProperties } from 'react'

export type Mood = 'idle' | 'happy' | 'tired' | 'sleep' | 'look'
/** down: 차렷 · up: 만세 · wave: 만세하며 흔들기 · salute: 손을 이마에 대고 두리번 */
export type Pose = 'down' | 'up' | 'wave' | 'salute'

type Props = {
  size?: number
  color?: string
  mood?: Mood
  pose?: Pose
  flag?: boolean
  /** 깃발이 꽂히는 애니메이션을 재생할 지연(초). 없으면 그냥 꽂혀 있음 */
  plantDelay?: number
  /** 목록처럼 여러 개를 그릴 때: 움직임 없이 정지 화면 */
  still?: boolean
  className?: string
  style?: CSSProperties
}

const INK = '#3B2E2A'

// 통통한 산 몸통 (옆구리가 볼록한 곡선)
const BODY =
  'M100 34C112 34 121 44 129 57C150 82 176 108 180 142C186 166 174 180 152 180H48C26 180 14 166 20 142C24 108 50 82 71 57C79 44 88 34 100 34Z'
// 몸통으로 잘라 쓰는 눈 덮인 정상 (아래가 녹아 흐르는 모양)
const SNOW =
  'M0 0H200V80H150C146 90 136 93 131 84C126 97 112 99 108 88C104 95 96 95 92 88C86 101 72 99 69 86C64 93 54 91 50 80H0Z'
const SNOW_SHADE = 'M100 30C118 40 140 60 160 82L150 80C146 90 136 93 131 84C126 93 118 95 112 92C117 70 111 46 100 30Z'
const SIDE_SHADE = 'M118 34C150 80 162 140 138 200H200V34Z'
const RIM = 'M54 94C46 108 38 124 34 140'

// motion은 SVG의 transform-origin을 덮어쓰므로 기준점은 originX/originY(0~1)로 지정
// 팔 타원(cx 0, cy 15, ry 17)의 영역 안에서 어깨(0,0)가 있는 위치 → 회전 기준점
const SHOULDER = { transformBox: 'fill-box', originX: 0.5, originY: 0.0588 } as const

const ANGLE: Record<Pose, number[]> = {
  down: [42],
  up: [158],
  wave: [148, 175, 148],
  salute: [-118],
}

function mix(hex: string, target: number, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.round(c + (target - c) * amount)
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}
export const shade = (hex: string, amount = 0.18) => mix(hex, 0, amount)
const tint = (hex: string, amount: number) => mix(hex, 255, amount)

function Arm({ angles, still, fill, stroke, delay = 0 }: { angles: number[]; still?: boolean; fill: string; stroke: string; delay?: number }) {
  const arm = <ellipse cx="0" cy="15" rx="10" ry="17" fill={fill} stroke={stroke} strokeWidth="3" />
  if (still || angles.length === 1)
    return still ? (
      <g transform={`rotate(${angles[0]})`}>{arm}</g>
    ) : (
      <motion.g
        style={SHOULDER}
        initial={false}
        animate={{ rotate: angles[0] }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
      >
        {arm}
      </motion.g>
    )
  return (
    <motion.g
      style={SHOULDER}
      initial={{ rotate: angles[0] }}
      animate={{ rotate: angles }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {arm}
    </motion.g>
  )
}

function Boot() {
  return (
    <g>
      <ellipse cx="62" cy="190" rx="18.5" ry="8" fill="#5E3F2A" />
      <ellipse cx="62" cy="185.5" rx="17.5" ry="9.5" fill="#B07A50" />
      <ellipse cx="53" cy="182.5" rx="5" ry="2.6" fill="#fff" opacity="0.3" />
      <path d="M66 180.5H74" stroke="#F5E6C8" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function Eyes({ mood, still }: { mood: Mood; still?: boolean }) {
  if (mood === 'happy')
    return (
      <g stroke={INK} strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d="M69 125Q78 112 87 125" />
        <path d="M113 125Q122 112 131 125" />
      </g>
    )
  if (mood === 'tired')
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M71 116L85 122L71 128" />
        <path d="M129 116L115 122L129 128" />
      </g>
    )
  if (mood === 'sleep')
    return (
      <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M70 121Q78 129 86 121" />
        <path d="M114 121Q122 129 130 121" />
      </g>
    )
  const open = (
    <>
      <ellipse cx="78" cy="122" rx="9" ry="11" fill={INK} />
      <ellipse cx="122" cy="122" rx="9" ry="11" fill={INK} />
      <circle cx="81.5" cy="117.5" r="3.6" fill="#fff" />
      <circle cx="125.5" cy="117.5" r="3.6" fill="#fff" />
      <circle cx="75.5" cy="126.5" r="1.8" fill="#fff" opacity=".9" />
      <circle cx="119.5" cy="126.5" r="1.8" fill="#fff" opacity=".9" />
    </>
  )
  if (still) return <g>{open}</g>
  if (mood === 'look')
    return (
      <motion.g animate={{ x: [0, -7, -7, 7, 7, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        {open}
      </motion.g>
    )
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ scaleY: [1, 1, 0.1, 1] }}
      transition={{ duration: 4, times: [0, 0.93, 0.965, 1], repeat: Infinity }}
    >
      {open}
    </motion.g>
  )
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'happy')
    return (
      <g>
        <path d="M86 134Q100 157 114 134Q100 139 86 134Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M93 145Q100 152 107 145Q100 141 93 145Z" fill="#FF7B88" />
      </g>
    )
  if (mood === 'tired')
    return <path d="M89 141Q94.5 136 100 141Q105.5 146 111 141" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
  if (mood === 'sleep' || mood === 'look') return <ellipse cx="100" cy="140" rx="3.8" ry="4.5" fill={INK} />
  // 고양이 입 ω
  return <path d="M90 136Q95 142 100 137Q105 142 110 136" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
}

function Flag({ plantDelay }: { plantDelay?: number }) {
  const planting = plantDelay !== undefined
  return (
    <motion.g
      style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
      initial={planting ? { scaleY: 0 } : false}
      animate={{ scaleY: 1 }}
      transition={{ delay: plantDelay, type: 'spring', stiffness: 420, damping: 11 }}
    >
      <line x1="100" y1="50" x2="100" y2="-2" stroke="#6B5444" strokeWidth="4.5" strokeLinecap="round" />
      <motion.path
        d="M102 0L141 11L102 23Z"
        fill="#FF7B7B"
        stroke="#E85D5D"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transformBox: 'fill-box', originX: 0, originY: 0.5 }}
        animate={{ skewY: [0, -8, 0, 6, 0], scaleX: [1, 0.92, 1, 0.95, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  )
}

export function Mascot({ size = 120, color = '#7FD3A8', mood = 'idle', pose, flag, plantDelay, still, className, style }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const grad = `mg${uid}`
  const clip = `mc${uid}`
  const outline = shade(color, 0.2)
  const p = pose ?? (mood === 'happy' ? (still ? 'up' : 'wave') : mood === 'look' ? 'salute' : 'down')
  const rightAngles = ANGLE[p]
  const leftAngles = p === 'salute' ? ANGLE.down : ANGLE[p]

  const character = (
    <>
      {flag && <Flag plantDelay={plantDelay} />}
      <path d={BODY} fill={`url(#${grad})`} />
      <g clipPath={`url(#${clip})`}>
        <path d={SIDE_SHADE} fill="#000" opacity="0.06" />
        <path d={SNOW} fill="#fff" />
        <path d={SNOW_SHADE} fill="#E1EEF8" />
      </g>
      <path d={RIM} stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d={BODY} fill="none" stroke={outline} strokeWidth="3" strokeLinejoin="round" />

      <ellipse cx="60" cy="140" rx="12" ry="7.5" fill="#FF8FAB" opacity="0.7" />
      <ellipse cx="140" cy="140" rx="12" ry="7.5" fill="#FF8FAB" opacity="0.7" />
      <Eyes mood={mood} still={still} />
      <Mouth mood={mood} />
      {mood === 'tired' && (
        <motion.path
          d="M152 88Q159 100 159 106A7 7 0 0 1 145 106Q145 100 152 88Z"
          fill="#9ED8FF"
          animate={still ? undefined : { y: [0, 6, 0], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      {mood === 'sleep' && !still && (
        // 잠잘 때 부풀었다 줄어드는 콧방울
        <motion.g
          style={{ transformBox: 'fill-box', originX: 0, originY: 1 }}
          animate={{ scale: [0.4, 1, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="114" cy="134" r="8" fill="#DDF3FF" stroke="#9ED8FF" strokeWidth="1.5" opacity="0.9" />
          <circle cx="111" cy="131" r="2" fill="#fff" />
        </motion.g>
      )}

      <g transform="translate(30 126)">
        <Arm angles={leftAngles} still={still} fill={color} stroke={outline} />
      </g>
      <g transform="translate(200 0) scale(-1 1)">
        <g transform="translate(30 126)">
          <Arm angles={rightAngles} still={still} fill={color} stroke={outline} delay={0.35} />
        </g>
      </g>
    </>
  )

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} style={{ overflow: 'visible', ...style }} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint(color, 0.35)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* 동글동글 등산화 */}
      <Boot />
      <g transform="translate(200 0) scale(-1 1)">
        <Boot />
      </g>

      {still ? (
        character
      ) : (
        // 숨 쉬듯 살짝 부풀었다 가라앉기
        <motion.g
          style={{ transformBox: 'view-box', originX: 0.5, originY: 0.9 }}
          animate={{ scaleY: [1, 1.025, 1], scaleX: [1, 0.99, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {character}
        </motion.g>
      )}
    </svg>
  )
}
