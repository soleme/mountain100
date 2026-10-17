import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { IconLocate } from '../components/Icons'
import { getHere, locate, useHere } from '../lib/here'
import { LOCAL_COLOR, localPath, useLocals } from '../lib/local'
import { MOUNTAINS, REGION_COLOR } from '../lib/mountains'
import { go } from '../lib/router'
import { useClimbs } from '../lib/store'

const BOUNDS = L.latLngBounds(MOUNTAINS.map((m) => [m.lat, m.lng] as L.LatLngTuple)).pad(0.04)

const iconCache = new Map<string, L.DivIcon>()
function pinIcon(done: boolean, color: string) {
  const key = `${done}${color}`
  let icon = iconCache.get(key)
  if (!icon) {
    icon = L.divIcon({
      className: 'pin',
      html: done
        ? `<svg viewBox="0 0 30 34" width="30" height="34"><line x1="15" y1="11" x2="15" y2="1.5" stroke="#6B5444" stroke-width="2" stroke-linecap="round"/><path d="M16 1.5L24.5 4.5L16 7.5Z" fill="#FF7B7B"/><path d="M15 10L28 31H2Z" fill="${color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 10L11.2 16.2L15 14.8L18.8 16.2Z" fill="#fff"/></svg>`
        : `<svg viewBox="0 0 30 34" width="22" height="25"><path d="M15 12L27 31H3Z" fill="#CFC4B8" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
      iconSize: done ? [30, 34] : [22, 25],
      iconAnchor: done ? [15, 32] : [11, 23],
      popupAnchor: [0, -24],
    })
    iconCache.set(key, icon)
  }
  return icon
}

// 동네 산은 동그란 핀으로 구분
const localIcon = L.divIcon({
  className: 'pin',
  html: `<svg viewBox="0 0 28 30" width="26" height="28"><line x1="14" y1="9" x2="14" y2="1.5" stroke="#6B5444" stroke-width="2" stroke-linecap="round"/><path d="M15 1.5L22 4L15 6.5Z" fill="#FF7B7B"/><circle cx="14" cy="18" r="9.5" fill="${LOCAL_COLOR}" stroke="#fff" stroke-width="2.5"/><path d="M8.5 21C10 17.5 11.5 16.5 13 17.8C14.5 15 17 14.5 19.5 21Z" fill="#fff" opacity=".9"/></svg>`,
  iconSize: [26, 28],
  iconAnchor: [13, 26],
  popupAnchor: [0, -22],
})

function LocateButton({ map }: { map: L.Map | null }) {
  const { loading } = useHere()
  return (
    <button
      className="map-fab"
      aria-label="내 위치"
      disabled={loading}
      onClick={async () => {
        const here = await locate()
        if (here) map?.flyTo([here.lat, here.lng], 10)
        else alert(getHere().error ?? '현재 위치를 확인할 수 없어요.')
      }}
    >
      <IconLocate />
    </button>
  )
}

export function MapPage() {
  const climbs = useClimbs()
  const locals = useLocals()
  const [onlyTodo, setOnlyTodo] = useState(false)
  const { here } = useHere()
  const [map, setMap] = useState<L.Map | null>(null)
  const list = useMemo(() => MOUNTAINS.filter((m) => !onlyTodo || !climbs[m.id]), [onlyTodo, climbs])
  const done = Object.keys(climbs).length

  return (
    <div className="map-page">
      <div className="map-top">
        <span className="map-count">
          ⛳ <b>{done}</b> / {MOUNTAINS.length}
        </span>
        <button className={onlyTodo ? 'chip-btn on' : 'chip-btn'} onClick={() => setOnlyTodo((v) => !v)}>
          미정복만
        </button>
      </div>
      <MapContainer ref={setMap} bounds={BOUNDS} className="map" zoomControl={false}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={17}
        />
        {list.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon(Boolean(climbs[m.id]), REGION_COLOR[m.region])}>
            <Popup>
              <div className="popup">
                <b>{m.name}</b>
                <span>
                  {m.peak} {m.height.toLocaleString()}m
                </span>
                <button onClick={() => go(`/m/${m.id}`)}>{climbs[m.id] ? '정복 기록 보기' : '자세히 보기'} →</button>
              </div>
            </Popup>
          </Marker>
        ))}
        {Object.values(locals).map((l) => (
          <Marker key={l.id} position={[l.lat, l.lng]} icon={localIcon}>
            <Popup>
              <div className="popup">
                <b>{l.name}</b>
                <span>동네 산 · {l.visits.length}번 등반</span>
                <button onClick={() => go(localPath(l.id))}>기록 보기 →</button>
              </div>
            </Popup>
          </Marker>
        ))}
        {here && <CircleMarker center={[here.lat, here.lng]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#3D8BFF', fillOpacity: 1 }} />}
      </MapContainer>
      <LocateButton map={map} />
    </div>
  )
}
