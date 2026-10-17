import { MotionConfig, motion } from 'motion/react'
import { Suspense, lazy, useLayoutEffect } from 'react'
import { TabBar } from './components/TabBar'
import { useRoute, type Route } from './lib/router'
import { Detail } from './pages/Detail'
import { Home } from './pages/Home'
import { List } from './pages/List'
import { Settings } from './pages/Settings'
import { Stamps } from './pages/Stamps'

// 지도(leaflet)는 무거워서 지도 탭을 열 때만 불러옴
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })))

const routeKey = (r: Route) => (r.name === 'mountain' ? `m${r.id}` : r.name)

// 목록 → 상세 → 뒤로가기 했을 때 보던 위치로 돌아가도록 화면별 스크롤 기억
const scrollPos = new Map<string, number>()

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'list':
      return <List />
    case 'map':
      return (
        <Suspense fallback={null}>
          <MapPage />
        </Suspense>
      )
    case 'stamps':
      return <Stamps />
    case 'settings':
      return <Settings />
    case 'mountain':
      return <Detail id={route.id} />
  }
}

export default function App() {
  const route = useRoute()
  const key = routeKey(route)
  const showTabs = route.name !== 'mountain' && route.name !== 'settings'

  useLayoutEffect(() => {
    window.scrollTo(0, scrollPos.get(key) ?? 0)
    const onScroll = () => scrollPos.set(key, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [key])

  return (
    <MotionConfig reducedMotion="user">
      <div className={showTabs ? 'app with-tabs' : 'app'}>
        <motion.main key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <Page route={route} />
        </motion.main>
        {showTabs && <TabBar active={route.name} />}
      </div>
    </MotionConfig>
  )
}
