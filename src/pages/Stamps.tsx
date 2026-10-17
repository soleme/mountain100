import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { LocalStamp, Stamp } from '../components/Stamp'
import { LEVELS, MILESTONES } from '../lib/levels'
import { LOCAL_COLOR, lastVisit, localPath, totalVisits, useLocals } from '../lib/local'
import { MOUNTAINS, TOTAL } from '../lib/mountains'
import { go } from '../lib/router'
import { useClimbs } from '../lib/store'

export function Stamps() {
  const climbs = useClimbs()
  const count = Object.keys(climbs).length
  const gps = Object.values(climbs).filter((c) => c.method === 'gps').length
  const locals = useLocals()
  const [tab, setTab] = useState<'famous' | 'local'>('famous')
  const mine = useMemo(() => Object.values(locals).sort((a, b) => b.visits.length - a.visits.length), [locals])

  return (
    <div className="page stamps-page">
      <header className="title-row pad">
        <h1 className="page-title">도장첩</h1>
        <span className="muted">
          {tab === 'famous' ? (
            <>
              <b className="accent">{count}</b>개 · GPS 인증 {gps}개
            </>
          ) : (
            <>
              <b className="accent">{mine.length}</b>곳 · 총 {totalVisits(locals)}번
            </>
          )}
        </span>
      </header>

      <div className="segment wide">
        <button className={tab === 'famous' ? 'on' : ''} onClick={() => setTab('famous')}>
          명산100
        </button>
        <button className={tab === 'local' ? 'on' : ''} onClick={() => setTab('local')}>
          동네 산
        </button>
      </div>

      {tab === 'local' ? (
        mine.length === 0 ? (
          <div className="empty">
            <Mascot size={96} color={LOCAL_COLOR} mood="idle" />
            <p className="muted">아직 동네 산 도장이 없어요</p>
            <button className="btn" onClick={() => go('/local')}>
              동네 산 찾으러 가기
            </button>
          </div>
        ) : (
          <section className="stamp-grid">
            {mine.map((l) => (
              <motion.button
                key={l.id}
                className="stamp-cell"
                onClick={() => go(localPath(l.id))}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                whileTap={{ scale: 0.9 }}
              >
                <LocalStamp id={l.id} name={l.name} color={LOCAL_COLOR} date={lastVisit(l).date} count={l.visits.length} size={70} />
              </motion.button>
            ))}
          </section>
        )
      ) : (
        <>

      <section className="badges">
        {MILESTONES.map((n) => {
          const lv = LEVELS.find((l) => l.min === n)!
          const on = count >= n
          return (
            <motion.div
              key={n}
              className={on ? 'badge-medal on' : 'badge-medal'}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="medal">{on ? lv.emoji : '🔒'}</span>
              <b>{n}</b>
              <small>{lv.title}</small>
            </motion.div>
          )
        })}
      </section>

      <section className="stamp-grid">
        {MOUNTAINS.map((m, i) => (
          <motion.button
            key={m.id}
            className="stamp-cell"
            onClick={() => go(`/m/${m.id}`)}
            initial={climbs[m.id] ? { scale: 1.6, opacity: 0 } : { opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: Math.min(i, 24) * 0.015, type: 'spring', stiffness: 500, damping: 22 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`${m.name}${climbs[m.id] ? ' 정복' : ''}`}
          >
            <Stamp mountain={m} climb={climbs[m.id]} size={70} />
          </motion.button>
        ))}
      </section>
      <p className="muted small center">총 {TOTAL}개의 칸을 도장으로 채워보세요!</p>
        </>
      )}
    </div>
  )
}
