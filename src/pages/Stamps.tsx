import { motion } from 'motion/react'
import { Stamp } from '../components/Stamp'
import { LEVELS, MILESTONES } from '../lib/levels'
import { MOUNTAINS, TOTAL } from '../lib/mountains'
import { go } from '../lib/router'
import { useClimbs } from '../lib/store'

export function Stamps() {
  const climbs = useClimbs()
  const count = Object.keys(climbs).length
  const gps = Object.values(climbs).filter((c) => c.method === 'gps').length

  return (
    <div className="page stamps-page">
      <header className="title-row pad">
        <h1 className="page-title">도장첩</h1>
        <span className="muted">
          <b className="accent">{count}</b>개 · GPS 인증 {gps}개
        </span>
      </header>

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
    </div>
  )
}
