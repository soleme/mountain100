import { motion } from 'motion/react'
import type { CSSProperties } from 'react'

export type Mood = 'idle' | 'happy' | 'tired' | 'sleep' | 'look'

type Props = {
  size?: number
  color?: string
  mood?: Mood
  flag?: boolean
  /** 깃발이 땅에 꽂히는 애니메이션을 재생할 지연(초). 없으면 그냥 꽂혀 있음 */
  plantDelay?: number
  still?: boolean
  className?: string
  style?: CSSProperties
}

const BODY = 'M100 44C110 44 116 52 122 62L176 158C184 172 176 186 160 186H40C24 186 16 172 24 158L78 62C84 52 90 44 100 44Z'
const SHADE = 'M100 44C110 44 116 52 122 62L176 158C184 172 176 186 160 186H130C142 150 132 92 100 44Z'
const SNOW = 'M78 62C84 52 90 44 100 44S116 52 122 62L137 88Q128 97 119 89Q110 99 100 89Q90 99 81 89Q72 97 63 88Z'

const INK = '#3B2E2A'
const fill: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' }

export function shade(hex: string, amount = 0.18) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.round(c * (1 - amount))
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}

function Eyes({ mood, still }: { mood: Mood; still?: boolean }) {
  if (mood === 'happy')
    return (
      <g stroke={INK} strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d="M71 131Q80 119 89 131" />
        <path d="M111 131Q120 119 129 131" />
      </g>
    )
  if (mood === 'tired')
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M73 121L87 128L73 135" />
        <path d="M127 121L113 128L127 135" />
      </g>
    )
  if (mood === 'sleep')
    return (
      <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M72 128Q80 134 88 128" />
        <path d="M112 128Q120 134 128 128" />
      </g>
    )
  const open = (
    <>
      <ellipse cx="80" cy="128" rx="7" ry="9" fill={INK} />
      <ellipse cx="120" cy="128" rx="7" ry="9" fill={INK} />
      <circle cx="82.5" cy="124" r="2.6" fill="#fff" />
      <circle cx="122.5" cy="124" r="2.6" fill="#fff" />
    </>
  )
  if (still) return <g>{open}</g>
  if (mood === 'look')
    return (
      <motion.g animate={{ x: [0, -6, -6, 6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        {open}
      </motion.g>
    )
  return (
    <motion.g
      style={fill}
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
        <path d="M88 139Q100 160 112 139Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M94 148Q100 155 106 148Q100 144 94 148Z" fill="#FF7B7B" />
      </g>
    )
  if (mood === 'tired') return <ellipse cx="100" cy="147" rx="5" ry="6" fill={INK} />
  if (mood === 'sleep') return <path d="M95 144Q100 147 105 144" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
  return <path d="M92 141Q100 150 108 141" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
}

function Flag({ plantDelay }: { plantDelay?: number }) {
  const planting = plantDelay !== undefined
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
      initial={planting ? { scaleY: 0 } : false}
      animate={{ scaleY: 1 }}
      transition={{ delay: plantDelay, type: 'spring', stiffness: 420, damping: 11 }}
    >
      <line x1="100" y1="52" x2="100" y2="0" stroke="#6B5444" strokeWidth="4.5" strokeLinecap="round" />
      <motion.path
        d="M102 2L140 13L102 25Z"
        fill="#FF7B7B"
        stroke="#E85D5D"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
        animate={{ skewY: [0, -8, 0, 6, 0], scaleX: [1, 0.92, 1, 0.95, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  )
}

export function Mascot({ size = 120, color = '#7FD3A8', mood = 'idle', flag, plantDelay, still, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible', ...style }}
      aria-hidden
    >
      {flag && <Flag plantDelay={plantDelay} />}
      <ellipse cx="68" cy="187" rx="14" ry="7.5" fill={shade(color, 0.28)} />
      <ellipse cx="132" cy="187" rx="14" ry="7.5" fill={shade(color, 0.28)} />
      <path d={BODY} fill={color} />
      <path d={SHADE} fill="#000" opacity="0.07" />
      <path d={SNOW} fill="#fff" />
      {/* 흰 배경 위에서도 눈 덮인 봉우리가 보이도록 스티커처럼 테두리 */}
      <path d={BODY} fill="none" stroke={shade(color, 0.14)} strokeWidth="3.5" strokeLinejoin="round" />
      {mood === 'tired' && (
        <motion.path
          d="M150 92Q156 102 156 107A6 6 0 0 1 144 107Q144 102 150 92Z"
          fill="#9ED8FF"
          animate={still ? undefined : { y: [0, 6, 0], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <ellipse cx="64" cy="143" rx="11" ry="6.5" fill="#FF9EAA" opacity="0.75" />
      <ellipse cx="136" cy="143" rx="11" ry="6.5" fill="#FF9EAA" opacity="0.75" />
      <Eyes mood={mood} still={still} />
      <Mouth mood={mood} />
    </svg>
  )
}
