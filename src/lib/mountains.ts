import raw from '../data/mountains.json'

export type Region = '수도권' | '강원' | '충청' | '전라' | '경상' | '제주'

export type Mountain = {
  id: number
  name: string
  peak: string
  height: number
  region: Region
  location: string
  lat: number
  lng: number
  desc: string
}

export const MOUNTAINS = raw as Mountain[]
export const TOTAL = MOUNTAINS.length

const byId = new Map(MOUNTAINS.map((m) => [m.id, m]))
export const getMountain = (id: number) => byId.get(id)

export const REGIONS: Region[] = ['수도권', '강원', '충청', '전라', '경상', '제주']

export const REGION_COLOR: Record<Region, string> = {
  수도권: '#8EC5FF',
  강원: '#7FD3A8',
  충청: '#FFC46B',
  전라: '#FF9EAA',
  경상: '#B79CFF',
  제주: '#FF9A76',
}

export const kakaoMapUrl = (m: Mountain) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(`${m.name} ${m.peak}`)},${m.lat},${m.lng}`
export const naverMapUrl = (m: Mountain) =>
  `https://map.naver.com/p/search/${encodeURIComponent(`${m.name} ${m.peak}`)}`
