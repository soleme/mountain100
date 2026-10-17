import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { IconSearch } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { MOUNTAINS, REGION_COLOR, REGIONS, TOTAL, type Region } from '../lib/mountains'
import { go } from '../lib/router'
import { shortDate, useClimbs } from '../lib/store'

type Status = 'all' | 'todo' | 'done'
type Sort = 'id' | 'height' | 'name'

// 상세 화면에 갔다가 돌아와도 필터가 유지되도록 모듈 범위에 보관
const saved = { q: '', region: null as Region | null, status: 'all' as Status, sort: 'id' as Sort }

export function List() {
  const climbs = useClimbs()
  const [q, setQ] = useState(saved.q)
  const [region, setRegion] = useState(saved.region)
  const [status, setStatus] = useState(saved.status)
  const [sort, setSort] = useState(saved.sort)
  Object.assign(saved, { q, region, status, sort })

  const items = useMemo(() => {
    const query = q.trim()
    const out = MOUNTAINS.filter(
      (m) =>
        (!region || m.region === region) &&
        (status === 'all' || (status === 'done') === Boolean(climbs[m.id])) &&
        (!query || m.name.includes(query) || m.peak.includes(query) || m.location.includes(query)),
    )
    if (sort === 'height') out.sort((a, b) => b.height - a.height)
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    return out
  }, [q, region, status, sort, climbs])

  const doneCount = Object.keys(climbs).length

  return (
    <div className="page list-page">
      <header className="sticky-head">
        <div className="title-row">
          <h1 className="page-title">명산 {TOTAL}</h1>
          <span className="muted">
            <b className="accent">{doneCount}</b> 정복 · {TOTAL - doneCount} 남음
          </span>
        </div>
        <label className="search">
          <IconSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="산 이름, 봉우리, 지역 검색" />
        </label>
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
            <option value="height">높은순</option>
            <option value="name">가나다순</option>
          </select>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="empty">
          <Mascot size={96} color="#D9D0C5" mood="sleep" still />
          <p className="muted">조건에 맞는 산이 없어요</p>
        </div>
      ) : (
        <ul className="m-list">
          {items.map((m, i) => {
            const c = climbs[m.id]
            return (
              <motion.li
                key={m.id}
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
