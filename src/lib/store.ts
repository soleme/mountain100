import { useSyncExternalStore } from 'react'

export type Climb = {
  mountainId: number
  date: string // YYYY-MM-DD
  method: 'gps' | 'manual'
  distance?: number // 인증 당시 정상까지 거리(m)
  memo?: string
  photo?: boolean
  createdAt: number
}

export type Climbs = Record<number, Climb>

const KEY = 'm100.climbs.v1'

function load(): Climbs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Climbs) : {}
  } catch {
    return {}
  }
}

let state: Climbs = load()
const listeners = new Set<() => void>()

function commit(next: Climbs) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 저장 공간이 없거나 사파리 프라이빗 모드 — 메모리에는 남아 있음
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useClimbs = () => useSyncExternalStore(subscribe, () => state)
export const getClimbs = () => state

export function saveClimb(climb: Climb) {
  commit({ ...state, [climb.mountainId]: climb })
  // 홈 화면 앱이 아니면 브라우저가 데이터를 지울 수 있어서, 첫 기록 때 영구 보관을 요청
  navigator.storage?.persist?.().catch(() => {})
}

export function updateClimb(id: number, patch: Partial<Climb>) {
  const prev = state[id]
  if (prev) commit({ ...state, [id]: { ...prev, ...patch } })
}

export function removeClimb(id: number) {
  const next = { ...state }
  delete next[id]
  commit(next)
}

export function replaceAll(next: Climbs) {
  commit(next)
}

export const today = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const shortDate = (iso: string) => iso.slice(2).replaceAll('-', '.')
