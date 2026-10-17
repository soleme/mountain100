import { useSyncExternalStore } from 'react'
import { distanceM, type LatLng } from './geo'
import { MOUNTAINS, type Mountain } from './mountains'

// 명산100 밖의 '동네 산'. 같은 산을 여러 번 오르면 등반 기록이 쌓임
export const LOCAL_COLOR = '#A8D86E'
export const VISIT_MILESTONES = [10, 30, 50, 100]

export type Visit = { date: string; method: 'gps' | 'manual'; distance?: number; memo?: string; at: number }

/** OSM 봉우리(osm:노드ID) 또는 직접 등록한 산(my:...) */
export type Peak = { id: string; name: string; height?: number; lat: number; lng: number; famous?: Mountain }

export type LocalMountain = Omit<Peak, 'famous'> & { addedAt: number; visits: Visit[]; memo?: string; photo?: boolean }
export type Locals = Record<string, LocalMountain>

const KEY = 'm100.local.v1'

function load(): Locals {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Locals) : {}
  } catch {
    return {}
  }
}

let state: Locals = load()
const listeners = new Set<() => void>()

function commit(next: Locals) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 저장 실패해도 메모리에는 남아 있음
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useLocals = () => useSyncExternalStore(subscribe, () => state)
export const getLocals = () => state

export function addVisit(peak: Peak | LocalMountain, visit: Omit<Visit, 'at'>): LocalMountain {
  const v = { ...visit, at: Date.now() }
  const prev = state[peak.id]
  const next: LocalMountain = prev
    ? { ...prev, visits: [...prev.visits, v] }
    : { id: peak.id, name: peak.name, height: peak.height, lat: peak.lat, lng: peak.lng, addedAt: Date.now(), visits: [v] }
  commit({ ...state, [peak.id]: next })
  navigator.storage?.persist?.().catch(() => {})
  return next
}

export function updateLocal(id: string, patch: Partial<LocalMountain>) {
  const prev = state[id]
  if (prev) commit({ ...state, [id]: { ...prev, ...patch } })
}

export function removeVisit(id: string, at: number) {
  const prev = state[id]
  if (!prev) return
  const visits = prev.visits.filter((v) => v.at !== at)
  if (visits.length) commit({ ...state, [id]: { ...prev, visits } })
  else removeLocal(id)
}

export function removeLocal(id: string) {
  const next = { ...state }
  delete next[id]
  commit(next)
}

export const replaceLocals = (next: Locals) => commit(next)

export const lastVisit = (l: LocalMountain) => l.visits.reduce((a, b) => (b.date > a.date || (b.date === a.date && b.at > a.at) ? b : a))
export const totalVisits = (all: Locals) => Object.values(all).reduce((n, l) => n + l.visits.length, 0)
export const localPath = (id: string) => `/l/${encodeURIComponent(id)}`
export const photoKey = (id: string) => `local:${id}`
export const newCustomId = () => `my:${Date.now().toString(36)}`

/** 명산100 정상과 겹치는 봉우리는 명산 쪽에서 인증하도록 안내 */
export const famousNear = (p: LatLng) => MOUNTAINS.find((m) => distanceM(m, p) < 400)

// ---------- 봉우리 데이터 ----------
// OpenStreetMap의 남한 봉우리(이름 있는 것) 약 1만6천 개를 public/peaks.json에 넣어 둠.
// 산 정상에서 인터넷이 안 돼도 주변 산을 찾을 수 있도록 서버에 묻지 않고 앱 안에서 검색.
// 행 형식: [OSM 노드 ID, 이름, 높이(m, 모르면 0), 위도, 경도]
type Row = [number, string, number, number, number]

let peaksPromise: Promise<Peak[]> | null = null
let byId = new Map<string, Peak>()

export function loadPeaks(): Promise<Peak[]> {
  peaksPromise ??= fetch(`${import.meta.env.BASE_URL}peaks.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<Row[]>
    })
    .then((rows) => {
      const peaks = rows.map(([id, name, h, lat, lng]) => ({ id: `osm:${id}`, name, height: h || undefined, lat, lng }))
      byId = new Map(peaks.map((p) => [p.id, p]))
      return peaks
    })
    .catch(() => {
      peaksPromise = null
      throw new Error('산 목록을 불러오지 못했어요. 처음 한 번은 인터넷 연결이 필요해요.')
    })
  return peaksPromise
}

const withFamous = (p: Peak): Peak => ({ ...p, famous: famousNear(p) })

export function peaksNear(all: Peak[], here: LatLng, radiusM = 5000, limit = 30) {
  const dLat = radiusM / 111000
  const dLng = radiusM / (111000 * Math.cos((here.lat * Math.PI) / 180))
  return all
    .filter((p) => Math.abs(p.lat - here.lat) <= dLat && Math.abs(p.lng - here.lng) <= dLng)
    .map((p) => ({ p, d: distanceM(here, p) }))
    .filter(({ d }) => d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ p }) => withFamous(p))
}

/** 이름 검색: 정확히 같은 이름 → 앞부분 일치 → 가까운 순(위치 있으면) / 높은 순 */
export function searchPeaks(all: Peak[], q: string, here?: LatLng | null, limit = 50) {
  const query = q.trim().replace(/\s+/g, ' ')
  if (!query) return []
  const rank = (p: Peak) => (p.name === query ? 0 : p.name.startsWith(query) ? 1 : 2)
  return all
    .filter((p) => p.name.includes(query))
    .map((p) => ({ p, r: rank(p), d: here ? distanceM(here, p) : -(p.height ?? 0) }))
    .sort((a, b) => a.r - b.r || a.d - b.d)
    .slice(0, limit)
    .map(({ p }) => withFamous(p))
}

export async function fetchPeak(id: string) {
  await loadPeaks()
  const p = byId.get(id)
  return p && withFamous(p)
}

export const cachedPeak = (id: string) => {
  const p = byId.get(id)
  return p && withFamous(p)
}
