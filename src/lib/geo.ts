// 정상 좌표에서 이 반경(+ GPS 오차 일부) 안이면 인증 성공
export const CERT_RADIUS_M = 300

export type LatLng = { lat: number; lng: number }

export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function isWithinSummit(distance: number, accuracy: number) {
  return distance <= CERT_RADIUS_M + Math.min(accuracy, 100)
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)}m`
  if (m < 10000) return `${(m / 1000).toFixed(1)}km`
  return `${Math.round(m / 1000)}km`
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('이 브라우저는 위치 기능을 지원하지 않아요.'))
      return
    }
    if (!window.isSecureContext) {
      reject(new Error('위치 인증은 HTTPS 주소에서만 동작해요. (npm run dev:phone 또는 배포 주소로 접속)'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const msg =
        err.code === err.PERMISSION_DENIED
          ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 접근을 허용해 주세요.'
          : err.code === err.TIMEOUT
            ? '위치를 찾는 데 시간이 너무 걸렸어요. 하늘이 보이는 곳에서 다시 시도해 주세요.'
            : '현재 위치를 확인할 수 없어요.'
      reject(new Error(msg))
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
  })
}
