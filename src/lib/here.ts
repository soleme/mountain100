import { useSyncExternalStore } from 'react'
import { getPosition } from './geo'

// 홈·목록·지도가 같은 '내 위치'를 공유해서, 화면을 옮길 때마다 위치를 다시 묻지 않도록 함
export type Here = { lat: number; lng: number; accuracy: number; at: number }
type State = { here: Here | null; loading: boolean; error: string | null }

const STALE_MS = 5 * 60 * 1000

let state: State = { here: null, loading: false, error: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

let pending: Promise<Here | null> | null = null

export function locate(): Promise<Here | null> {
  pending ??= (async () => {
    set({ loading: true, error: null })
    try {
      const pos = await getPosition()
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, at: Date.now() }
      set({ here, loading: false })
      return here
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
      return null
    } finally {
      pending = null
    }
  })()
  return pending
}

/** 위치가 없거나 5분 넘게 지났으면 새로 찾기 */
export function locateIfStale() {
  if (!state.here || Date.now() - state.here.at > STALE_MS) return locate()
  return Promise.resolve(state.here)
}

export const useHere = () => useSyncExternalStore(subscribe, () => state)
export const getHere = () => state

export function ago(t: number) {
  const s = (Date.now() - t) / 1000
  if (s < 60) return '방금'
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  return `${Math.floor(s / 3600)}시간 전`
}
