import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Celebration } from '../components/Celebration'
import { IconLocate, IconSearch } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { Sheet } from '../components/Sheet'
import { CERT_RADIUS_M, distanceM, formatDistance, isWithinSummit } from '../lib/geo'
import { getHere, locate, useHere, type Here } from '../lib/here'
import {
  LOCAL_COLOR,
  addVisit,
  lastVisit,
  loadPeaks,
  localPath,
  newCustomId,
  peaksNear,
  searchPeaks,
  totalVisits,
  useLocals,
  type LocalMountain,
  type Peak,
} from '../lib/local'
import { go } from '../lib/router'
import { shortDate, today } from '../lib/store'

// 다른 화면에 다녀와도 마지막 결과가 남아 있도록
const saved = { near: null as Peak[] | null, q: '' }

function PeakRow({ peak, here, local }: { peak: Peak; here: Here | null; local?: LocalMountain }) {
  const d = here ? distanceM(here, peak) : undefined
  const atTop = here && d !== undefined && isWithinSummit(d, here.accuracy)
  return (
    <motion.button
      className="peak-row"
      whileTap={{ scale: 0.97 }}
      onClick={() => go(peak.famous ? `/m/${peak.famous.id}` : localPath(peak.id))}
    >
      <Mascot size={42} color={local ? LOCAL_COLOR : '#E2DAD0'} mood={local ? 'happy' : 'sleep'} flag={Boolean(local)} still />
      <div className="peak-text">
        <b>
          {peak.name}
          {peak.famous && <span className="famous-tag">명산100</span>}
        </b>
        <span className="muted small">
          {peak.height ? `${peak.height.toLocaleString()}m` : '높이 정보 없음'}
          {local && ` · ${local.visits.length}번 올랐어요`}
        </span>
      </div>
      {atTop ? <span className="peak-d ok">정상이에요!</span> : d !== undefined && <span className="peak-d">{formatDistance(d)}</span>}
    </motion.button>
  )
}

function RegisterSheet({ open, near, onClose, onDone }: { open: boolean; near: Peak | undefined; onClose: () => void; onDone: (l: LocalMountain) => void }) {
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    // 등록 순간의 위치를 정상 좌표로 쓰므로 항상 새로 측정
    const h = await locate()
    setBusy(false)
    if (!h) return setErr(getHere().error)
    const peak = { id: newCustomId(), name: name.trim(), height: Number(height) || undefined, lat: h.lat, lng: h.lng }
    onDone(addVisit(peak, { date: today(), method: 'gps', distance: 0 }))
    setName('')
    setHeight('')
  }

  return (
    <Sheet open={open} onClose={onClose} label="동네 산 등록">
      <form className="manual-form" onSubmit={submit}>
        <h3>지금 위치를 정상으로 등록</h3>
        <p className="muted">지도에 없는 산이면 정상에 서서 등록하세요. 다음부터는 이 지점 {CERT_RADIUS_M}m 안에서 인증돼요.</p>
        {near && (
          <button type="button" className="hint-card" onClick={() => go(near.famous ? `/m/${near.famous.id}` : localPath(near.id))}>
            바로 근처에 <b>{near.name}</b>이(가) 있어요. 그 산으로 인증할까요? →
          </button>
        )}
        <label>
          <span>산 이름</span>
          <input className="text-input" value={name} required maxLength={20} placeholder="예: 우리집 뒷산" onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>높이 (모르면 비워두세요)</span>
          <input className="text-input" value={height} inputMode="numeric" placeholder="예: 348" onChange={(e) => setHeight(e.target.value.replace(/\D/g, ''))} />
        </label>
        {err && <p className="muted small">{err}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !name.trim()}>
          {busy ? '위치 확인 중…' : '등록하고 도장 받기'}
        </button>
      </form>
    </Sheet>
  )
}

export function Local() {
  const locals = useLocals()
  const { here } = useHere()
  const [near, setNear] = useState(saved.near)
  const [nearErr, setNearErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState(saved.q)
  const [peaks, setPeaks] = useState<Peak[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [register, setRegister] = useState(false)
  const [celebrate, setCelebrate] = useState<LocalMountain | null>(null)
  Object.assign(saved, { near, q })

  useEffect(() => {
    loadPeaks()
      .then(setPeaks)
      .catch((e) => setLoadErr((e as Error).message))
  }, [])

  // 앱 안에 있는 봉우리 목록에서 바로 찾으니 입력하는 대로 결과가 나옴
  const results = useMemo(() => (peaks && q.trim() ? searchPeaks(peaks, q, here) : null), [peaks, q, here])

  const mine = useMemo(
    () => Object.values(locals).sort((a, b) => lastVisit(b).date.localeCompare(lastVisit(a).date)),
    [locals],
  )
  const total = totalVisits(locals)
  const closest = here ? near?.find((p) => isWithinSummit(distanceM(here, p), here.accuracy)) : undefined

  const findNear = async () => {
    setBusy(true)
    setNearErr(null)
    const h = await locate()
    if (!h) {
      setNearErr(getHere().error)
      setBusy(false)
      return
    }
    try {
      setNear(peaksNear(peaks ?? (await loadPeaks()), h))
    } catch (e) {
      setNearErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page local-page">
      <header className="title-row pad">
        <h1 className="page-title">동네 산</h1>
        <span className="muted">
          <b className="accent">{mine.length}</b>곳 · 총 {total}번 등반
        </span>
      </header>
      <p className="muted small intro">명산100이 아니어도 괜찮아요. 뒷산도 정상에서 인증하고 도장을 모아요.</p>

      <section className="card">
        <h2 className="section-title">지금 여기 주변 봉우리</h2>
        <motion.button className="btn btn-primary btn-block with-icon" whileTap={{ scale: 0.96 }} onClick={findNear} disabled={busy}>
          <IconLocate />
          {busy ? '주변 산 찾는 중…' : near ? '다시 찾기' : '내 주변 산 찾기'}
        </motion.button>
        {nearErr && <p className="muted small err-text">{nearErr}</p>}
        {near &&
          (near.length === 0 ? (
            <p className="muted small center">5km 안에 봉우리가 없어요</p>
          ) : (
            <div className="peak-list">
              {near.map((p) => (
                <PeakRow key={p.id} peak={p} here={here} local={locals[p.id]} />
              ))}
            </div>
          ))}
        {near && (
          <button className="more-btn" onClick={() => setRegister(true)}>
            찾는 산이 없나요? 지금 위치를 정상으로 등록
          </button>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">이름으로 찾기</h2>
        <form className="search-row" onSubmit={(e) => (e.preventDefault(), (document.activeElement as HTMLElement | null)?.blur())}>
          <label className="search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 아차산, 용마봉" enterKeyHint="search" />
          </label>
        </form>
        {loadErr && <p className="muted small err-text">{loadErr}</p>}
        {!q.trim() && <p className="muted small">전국 봉우리 {peaks ? peaks.length.toLocaleString() : ''}개 중에서 찾아요{here ? ' · 가까운 순' : ''}</p>}
        {results &&
          (results.length === 0 ? (
            <p className="muted small center">이름에 '{q.trim()}'이(가) 들어간 봉우리를 못 찾았어요</p>
          ) : (
            <div className="peak-list">
              {results.map((p) => (
                <PeakRow key={p.id} peak={p} here={here} local={locals[p.id]} />
              ))}
            </div>
          ))}
      </section>

      <section className="card">
        <h2 className="section-title">내 동네 산</h2>
        {mine.length === 0 ? (
          <div className="local-empty">
            <Mascot size={84} color={LOCAL_COLOR} mood="idle" />
            <p className="muted small">아직 인증한 동네 산이 없어요. 가까운 산부터 올라가 볼까요?</p>
          </div>
        ) : (
          <div className="peak-list">
            {mine.map((l) => (
              <motion.button key={l.id} className="peak-row" whileTap={{ scale: 0.97 }} onClick={() => go(localPath(l.id))}>
                <Mascot size={42} color={LOCAL_COLOR} mood="happy" flag still />
                <div className="peak-text">
                  <b>{l.name}</b>
                  <span className="muted small">
                    {l.height ? `${l.height.toLocaleString()}m · ` : ''}마지막 {shortDate(lastVisit(l).date)}
                  </span>
                </div>
                <span className="visit-count">
                  {l.visits.length}
                  <small>회</small>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <RegisterSheet
        open={register}
        near={closest}
        onClose={() => setRegister(false)}
        onDone={(l) => {
          setRegister(false)
          setCelebrate(l)
        }}
      />

      <AnimatePresence>
        {celebrate && (
          <Celebration
            name={celebrate.name}
            color={LOCAL_COLOR}
            date={today()}
            detail={
              <>
                새 동네 산 등록 · <b>첫 번째 등반</b>
              </>
            }
            onClose={() => {
              const id = celebrate.id
              setCelebrate(null)
              go(localPath(id))
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
