import { motion } from 'motion/react'
import { useMemo } from 'react'
import { IconGear, IconLocate } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { ProgressRing } from '../components/ProgressRing'
import { Stamp } from '../components/Stamp'
import { distanceM, formatDistance } from '../lib/geo'
import { locate, useHere } from '../lib/here'
import { levelFor } from '../lib/levels'
import { LOCAL_COLOR, totalVisits, useLocals } from '../lib/local'
import { MOUNTAINS, REGION_COLOR, REGIONS, TOTAL, getMountain, type Mountain } from '../lib/mountains'
import { go } from '../lib/router'
import { useClimbs } from '../lib/store'
import { openNearList } from './List'

function greeting(count: number) {
  if (count === 0) return '첫 번째 산, 같이 올라가 볼까요?'
  if (count === TOTAL) return '명산 100 완등! 당신이 바로 산신령 👑'
  if (count < 10) return '좋은 출발이에요! 다음 산은 어디로?'
  if (count < 50) return `벌써 ${count}개! 다리가 튼튼해지고 있어요`
  return `${TOTAL - count}개만 더 오르면 완등이에요!`
}

// 날짜마다 바뀌는 '오늘의 추천 명산'
function pickOfDay(pool: Mountain[]) {
  if (!pool.length) return undefined
  const d = new Date()
  const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()
  return pool[(seed * 7919) % pool.length]
}

export function Home() {
  const climbs = useClimbs()
  const locals = useLocals()
  const localCount = Object.keys(locals).length
  const count = Object.keys(climbs).length
  const { current, next } = levelFor(count)
  const { here, loading: locating, error: locateError } = useHere()

  const recent = useMemo(
    () =>
      Object.values(climbs)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .slice(0, 8),
    [climbs],
  )
  const todo = useMemo(() => MOUNTAINS.filter((m) => !climbs[m.id]), [climbs])
  const today = pickOfDay(todo)

  const near = useMemo(
    () =>
      here
        ? todo
            .map((m) => ({ m, d: distanceM(here, m) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 5)
        : null,
    [here, todo],
  )

  return (
    <div className="page home">
      <header className="home-head">
        <h1 className="logo">
          명산100 <span>정복기</span>
        </h1>
        <button className="icon-btn" onClick={() => go('/settings')} aria-label="설정">
          <IconGear />
        </button>
      </header>

      <section className="hero">
        <motion.div
          className="hero-bubble"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.3 }}
        >
          {greeting(count)}
        </motion.div>
        <motion.div
          className="hero-mascot"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.9, rotate: -6 }}
        >
          <Mascot size={150} mood={count ? 'happy' : 'idle'} flag={count > 0} />
        </motion.div>
        <div className="hero-ground" />
      </section>

      <section className="card progress-card">
        <ProgressRing value={count} total={TOTAL} />
        <div className="progress-info">
          <span className="chip">
            {current.emoji} {current.title}
          </span>
          <p className="big">
            {Math.round((count / TOTAL) * 100)}
            <small>% 완등</small>
          </p>
          {next && (
            <p className="muted">
              {next.min - count}개 더 오르면 「{next.title}」
            </p>
          )}
        </div>
      </section>

      <motion.button className="card local-card" whileTap={{ scale: 0.97 }} onClick={() => go('/local')}>
        <Mascot size={64} color={LOCAL_COLOR} mood={localCount ? 'happy' : 'idle'} flag={localCount > 0} still />
        <div>
          <span className="eyebrow green">동네 산</span>
          <h3>{localCount ? `${localCount}곳 · 총 ${totalVisits(locals)}번 등반` : '뒷산도 인증해요'}</h3>
          <p className="muted small">{localCount ? '오늘도 동네 한 바퀴 어때요?' : '명산100 말고도 가까운 산에서 도장을 모아요'}</p>
        </div>
        <span className="chev">›</span>
      </motion.button>

      <section className="card">
        <h2 className="section-title">지역별 정복 현황</h2>
        <div className="regions">
          {REGIONS.map((r, i) => {
            const all = MOUNTAINS.filter((m) => m.region === r)
            const done = all.filter((m) => climbs[m.id]).length
            return (
              <div className="region-row" key={r}>
                <span className="region-name">{r}</span>
                <div className="bar">
                  <motion.div
                    className="bar-fill"
                    style={{ background: REGION_COLOR[r] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="region-count">
                  {done}/{all.length}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {today && (
        <motion.button className="card today-card" whileTap={{ scale: 0.97 }} onClick={() => go(`/m/${today.id}`)}>
          <div>
            <span className="eyebrow">오늘의 추천 명산</span>
            <h3>{today.name}</h3>
            <p className="muted">
              {today.peak} {today.height.toLocaleString()}m · {today.location}
            </p>
            <p className="desc">{today.desc}</p>
          </div>
          <Mascot size={72} color={REGION_COLOR[today.region]} mood="sleep" still />
        </motion.button>
      )}

      <section className="card">
        <div className="section-head">
          <h2 className="section-title">내 주변 미정복 명산</h2>
          <button className="pill-btn" onClick={() => locate()} disabled={locating}>
            <IconLocate /> {locating ? '찾는 중…' : near ? '새로고침' : '찾기'}
          </button>
        </div>
        {locateError && !locating && <p className="muted small">{locateError}</p>}
        {near ? (
          <ul className="near-list">
            {near.map(({ m, d }) => (
              <li key={m.id}>
                <button onClick={() => go(`/m/${m.id}`)}>
                  <span className="dot" style={{ background: REGION_COLOR[m.region] }} />
                  <b>{m.name}</b>
                  <span className="muted">{m.height.toLocaleString()}m</span>
                  <span className="near-d">{formatDistance(d)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !locateError && <p className="muted small">현재 위치에서 가까운 순으로 보여드려요.</p>
        )}
        <button className="more-btn" onClick={() => openNearList('todo')}>
          내 주변 명산 전체 보기 →
        </button>
      </section>

      {recent.length > 0 && (
        <section className="card">
          <div className="section-head">
            <h2 className="section-title">최근 정복</h2>
            <button className="link-btn" onClick={() => go('/stamps')}>
              도장첩 보기
            </button>
          </div>
          <div className="recent-row">
            {recent.map((c) => {
              const m = getMountain(c.mountainId)
              return (
                m && (
                  <button key={c.mountainId} onClick={() => go(`/m/${m.id}`)} className="recent-item">
                    <Stamp mountain={m} climb={c} size={78} />
                  </button>
                )
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
