import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { IconLocate, IconSearch } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { distanceM, formatDistance } from '../lib/geo'
import { ago, locate, locateIfStale, useHere } from '../lib/here'
import { MOUNTAINS, REGION_COLOR, REGIONS, TOTAL, type Region } from '../lib/mountains'
import { go } from '../lib/router'
import { shortDate, useClimbs } from '../lib/store'

type Status = 'all' | 'todo' | 'done'
type Sort = 'id' | 'height' | 'name' | 'near'

const RADII = [10, 30, 50, 100]

// 상세 화면에 갔다가 돌아와도 필터가 유지되도록 모듈 범위에 보관
const saved = { q: '', region: null as Region | null, status: 'all' as Status, sort: 'id' as Sort, radius: null as number | null }

/** 홈 화면 등에서 '내 주변' 모드로 목록을 열 때 */
export function openNearList(status: Status = 'all') {
  Object.assign(saved, { q: '', region: null, status, sort: 'near', radius: null })
  go('/list')
}

export function List() {
  const climbs = useClimbs()
  const { here, loading, error } = useHere()
  const [q, setQ] = useState(saved.q)
  const [region, setRegion] = useState(saved.region)
  const [status, setStatus] = useState(saved.status)
  const [sort, setSort] = useState(saved.sort)
  const [radius, setRadius] = useState(saved.radius)
  Object.assign(saved, { q, region, status, sort, radius })
  const near = sort === 'near'

  useEffect(() => {
    if (near) locateIfStale()
  }, [near])

  const dist = useMemo(() => (here ? new Map(MOUNTAINS.map((m) => [m.id, distanceM(here, m)])) : null), [here])

  const items = useMemo(() => {
    const query = q.trim()
    const out = MOUNTAINS.filter(
      (m) =>
        (!region || m.region === region) &&
        (status === 'all' || (status === 'done') === Boolean(climbs[m.id])) &&
        (!query || m.name.includes(query) || m.peak.includes(query) || m.location.includes(query)) &&
        (!near || !radius || !dist || dist.get(m.id)! <= radius * 1000),
    )
    if (sort === 'height') out.sort((a, b) => b.height - a.height)
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    if (near && dist) out.sort((a, b) => dist.get(a.id)! - dist.get(b.id)!)
    return out
  }, [q, region, status, sort, radius, near, dist, climbs])

  const doneCount = Object.keys(climbs).length
  const widerRadius = radius ? (RADII.find((r) => r > radius) ?? null) : null

  return (
    <div className="page list-page">
      <header className="sticky-head">
        <div className="title-row">
          <h1 className="page-title">명산 {TOTAL}</h1>
          <span className="muted">
            <b className="accent">{doneCount}</b> 정복 · {TOTAL - doneCount} 남음
          </span>
        </div>
        <div className="search-row">
          <label className="search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="산 이름, 봉우리, 지역 검색" />
          </label>
          <motion.button
            className={near ? 'near-btn on' : 'near-btn'}
            whileTap={{ scale: 0.92 }}
            onClick={() => setSort(near ? 'id' : 'near')}
            aria-pressed={near}
          >
            <IconLocate />
            내 주변
          </motion.button>
        </div>
        <div className="chips">
          <button className={!region ? 'chip-btn on' : 'chip-btn'} onClick={() => setRegion(null)}>
            전체
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              className={region === r ? 'chip-btn on' : 'chip-btn'}
              style={region === r ? { background: REGION_COLOR[r], borderColor: REGION_COLOR[r] } : undefined}
              onClick={() => setRegion(region === r ? null : r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <div className="segment">
            {(
              [
                ['all', '전체'],
                ['todo', '미정복'],
                ['done', '정복'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                {label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="정렬">
            <option value="id">번호순</option>
            <option value="near">가까운순</option>
            <option value="height">높은순</option>
            <option value="name">가나다순</option>
          </select>
        </div>

      </header>

      {near && (
        <motion.div className="near-bar" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="near-status">
            <span className={loading ? 'near-dot pulse' : error && !here ? 'near-dot err' : 'near-dot'} />
            <span className="near-text">
              {loading
                ? '현재 위치 찾는 중…'
                : error && !here
                  ? error
                  : here
                    ? `내 위치 기준 · ${ago(here.at)} (±${Math.round(here.accuracy)}m)`
                    : ''}
            </span>
            <button className="link-btn" onClick={() => locate()} disabled={loading}>
              {error && !here ? '다시 시도' : '새로고침'}
            </button>
          </div>
          {here && (
            <div className="radius-chips">
              {RADII.map((r) => (
                <button key={r} className={radius === r ? 'chip-btn sm on' : 'chip-btn sm'} onClick={() => setRadius(radius === r ? null : r)}>
                  {r}km
                </button>
              ))}
              <button className={!radius ? 'chip-btn sm on' : 'chip-btn sm'} onClick={() => setRadius(null)}>
                전체
              </button>
            </div>
          )}
        </motion.div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <Mascot size={96} color="#D9D0C5" mood="sleep" still />
          {near && radius ? (
            <>
              <p className="muted">{radius}km 안에 조건에 맞는 명산이 없어요</p>
              <button className="btn" onClick={() => setRadius(widerRadius)}>
                {widerRadius ? `${widerRadius}km로 넓히기` : '전체 보기'}
              </button>
            </>
          ) : (
            <p className="muted">조건에 맞는 산이 없어요</p>
          )}
        </div>
      ) : (
        <ul className="m-list">
          {items.map((m, i) => {
            const c = climbs[m.id]
            const d = near ? dist?.get(m.id) : undefined
            return (
              <motion.li
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.025 }}
              >
                <motion.button className={c ? 'm-item done' : 'm-item'} whileTap={{ scale: 0.97 }} onClick={() => go(`/m/${m.id}`)}>
                  <Mascot
                    size={50}
                    color={c ? REGION_COLOR[m.region] : '#E2DAD0'}
                    mood={c ? 'happy' : 'sleep'}
                    flag={Boolean(c)}
                    still
                  />
                  <div className="m-text">
                    <span className="m-name">
                      <span className="m-no">{m.id}</span>
                      {m.name}
                    </span>
                    <span className="muted small">
                      {d !== undefined && <b className="m-dist">{formatDistance(d)}</b>}
                      {m.peak} {m.height.toLocaleString()}m · {m.location}
                    </span>
                  </div>
                  {c ? (
                    <span className="mini-stamp" style={{ ['--c' as string]: REGION_COLOR[m.region] }}>
                      정복
                      <small>{shortDate(c.date)}</small>
                    </span>
                  ) : (
                    <span className="region-tag" style={{ ['--c' as string]: REGION_COLOR[m.region] }}>
                      {m.region}
                    </span>
                  )}
                </motion.button>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
