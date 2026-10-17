import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { go, type Route } from '../lib/router'
import { IconHills, IconHome, IconList, IconMap, IconStamp } from './Icons'

const TABS: { name: Route['name']; path: string; label: string; icon: ReactNode }[] = [
  { name: 'home', path: '/', label: '홈', icon: <IconHome /> },
  { name: 'list', path: '/list', label: '명산100', icon: <IconList /> },
  { name: 'local', path: '/local', label: '동네 산', icon: <IconHills /> },
  { name: 'map', path: '/map', label: '지도', icon: <IconMap /> },
  { name: 'stamps', path: '/stamps', label: '도장첩', icon: <IconStamp /> },
]

export function TabBar({ active }: { active: Route['name'] }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.name === active
        return (
          <button key={t.name} className={on ? 'tab on' : 'tab'} onClick={() => go(t.path)} aria-current={on ? 'page' : undefined}>
            {on && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
            <motion.span className="tab-icon" animate={on ? { y: [0, -5, 0] } : { y: 0 }} transition={{ duration: 0.35 }}>
              {t.icon}
            </motion.span>
            <span className="tab-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
