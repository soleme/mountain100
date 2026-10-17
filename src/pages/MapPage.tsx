import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { IconLocate } from '../components/Icons'
import { getPosition } from '../lib/geo'
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

function LocateButton({ map, onFound }: { map: L.Map | null; onFound: (p: L.LatLngTuple) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      className="map-fab"
      aria-label="내 위치"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const pos = await getPosition()
          const p: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude]
          onFound(p)
          map?.flyTo(p, 10)
        } catch (e) {
          alert((e as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <IconLocate />
    </button>
  )
}

export function MapPage() {
  const climbs = useClimbs()
  const [onlyTodo, setOnlyTodo] = useState(false)
  const [me, setMe] = useState<L.LatLngTuple | null>(null)
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
        {me && <CircleMarker center={me} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#3D8BFF', fillOpacity: 1 }} />}
      </MapContainer>
      <LocateButton map={map} onFound={setMe} />
    </div>
  )
}
