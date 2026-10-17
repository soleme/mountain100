import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'list' }
  | { name: 'map' }
  | { name: 'stamps' }
  | { name: 'settings' }
  | { name: 'mountain'; id: number }
  | { name: 'local' }
  | { name: 'localMountain'; id: string }

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '')
  const m = path.match(/^\/m\/(\d+)/)
  if (m) return { name: 'mountain', id: Number(m[1]) }
  const l = path.match(/^\/l\/(.+)/)
  if (l) return { name: 'localMountain', id: decodeURIComponent(l[1]) }
  if (path.startsWith('/local')) return { name: 'local' }
  if (path.startsWith('/list')) return { name: 'list' }
  if (path.startsWith('/map')) return { name: 'map' }
  if (path.startsWith('/stamps')) return { name: 'stamps' }
  if (path.startsWith('/settings')) return { name: 'settings' }
  return { name: 'home' }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const go = (path: string) => {
  location.hash = path
}

export const back = (fallback = '/') => {
  if (history.length > 1) history.back()
  else go(fallback)
}
