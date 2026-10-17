import type { CSSProperties } from 'react'
import { REGION_COLOR, type Mountain } from '../lib/mountains'
import { shortDate, type Climb } from '../lib/store'

// 아이디로 기울기를 정해서 도장이 매번 같은 각도로 '찍혀' 보이게
const tilt = (id: number) => ((id * 37) % 23) - 11

export function Stamp({ mountain, climb, size = 84 }: { mountain: Mountain; climb?: Climb; size?: number }) {
  const color = REGION_COLOR[mountain.region]
  const style = {
    width: size,
    height: size,
    fontSize: size / 6,
    ['--c' as string]: color,
    ['--tilt' as string]: `${tilt(mountain.id)}deg`,
  } as CSSProperties
  // 긴 이름(예: 백운산(광양))은 도장 안에 들어가도록 글자를 줄임
  const nameStyle = { fontSize: `${Math.min(1, 4.2 / mountain.name.length)}em` }
  if (!climb)
    return (
      <div className="stamp stamp-empty" style={style}>
        <span className="stamp-no">{mountain.id}</span>
        <span className="stamp-name" style={nameStyle}>{mountain.name}</span>
      </div>
    )
  return (
    <div className="stamp stamp-done" style={style}>
      <svg viewBox="0 0 40 24" className="stamp-mt" aria-hidden>
        <path d="M2 22L14 6L20 13L25 8L38 22Z" fill="currentColor" />
        <path d="M14 6L11 10L14 9L17 10Z M25 8L23 11L25 10L27 11Z" fill="#fff" />
      </svg>
      <span className="stamp-name" style={nameStyle}>{mountain.name}</span>
      <span className="stamp-date">{shortDate(climb.date)}</span>
      {climb.method === 'gps' && <span className="stamp-gps" title="GPS 인증">✓</span>}
    </div>
  )
}

const hashTilt = (id: string) => {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return (Math.abs(h) % 23) - 11
}

/** 동네 산 도장: 몇 번 올랐는지 ×N 으로 표시 */
export function LocalStamp({ id, name, color, date, count, size = 76 }: { id: string; name: string; color: string; date: string; count: number; size?: number }) {
  const style = {
    width: size,
    height: size,
    fontSize: size / 6,
    ['--c' as string]: color,
    ['--tilt' as string]: `${hashTilt(id)}deg`,
  } as CSSProperties
  return (
    <div className="stamp stamp-done" style={style}>
      <svg viewBox="0 0 40 24" className="stamp-mt" aria-hidden>
        <path d="M2 22C8 12 13 10 17 14C21 7 28 6 38 22Z" fill="currentColor" />
      </svg>
      <span className="stamp-name" style={{ fontSize: `${Math.min(1, 4.2 / name.length)}em` }}>
        {name}
      </span>
      <span className="stamp-date">{shortDate(date)}</span>
      {count > 1 && <span className="stamp-count">×{count}</span>}
    </div>
  )
}
