import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Celebration } from '../components/Celebration'
import { CertifySheet, type CertifyMode } from '../components/CertifySheet'
import { IconBack } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { formatDistance } from '../lib/geo'
import {
  LOCAL_COLOR,
  VISIT_MILESTONES,
  addVisit,
  cachedPeak,
  fetchPeak,
  photoKey,
  removeLocal,
  removeVisit,
  updateLocal,
  useLocals,
  type Peak,
} from '../lib/local'
import { deletePhoto, putPhoto, resizeImage, usePhotoUrl } from '../lib/photos'
import { back, go } from '../lib/router'
import { shortDate, today } from '../lib/store'

export function LocalDetail({ id }: { id: string }) {
  const locals = useLocals()
  const saved = locals[id]
  const [peak, setPeak] = useState<Peak | undefined>(() => cachedPeak(id))
  const [status, setStatus] = useState<'idle' | 'loading' | 'notfound' | 'error'>('idle')
  const [mode, setMode] = useState<CertifyMode | null>(null)
  const [celebrate, setCelebrate] = useState<{ count: number; date: string } | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoUrl = usePhotoUrl(photoKey(id))

  // 새로고침 등으로 캐시에 없는 OSM 봉우리면 다시 불러옴
  useEffect(() => {
    if (saved || peak) return
    setStatus('loading')
    fetchPeak(id)
      .then((p) => {
        setPeak(p)
        setStatus(p ? 'idle' : 'notfound')
      })
      .catch(() => setStatus('error'))
  }, [id, saved, peak])

  const m = saved ?? peak
  if (!m)
    return (
      <div className="page empty">
        {status === 'loading' ? (
          <>
            <Mascot size={96} color={LOCAL_COLOR} mood="look" />
            <p className="muted">산 정보를 불러오는 중…</p>
          </>
        ) : (
          <>
            <Mascot size={96} color="#D9D0C5" mood="tired" still />
            <p className="muted">{status === 'error' ? '산 정보를 불러오지 못했어요.' : '산을 찾을 수 없어요.'}</p>
            <button className="btn" onClick={() => back('/local')}>
              돌아가기
            </button>
          </>
        )}
      </div>
    )

  const famous = peak?.famous
  const visits = saved ? [...saved.visits].sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at) : []
  const gpsToday = visits.some((v) => v.date === today() && v.method === 'gps')

  const onPhoto = async (file?: File) => {
    if (!file || !saved) return
    setPhotoBusy(true)
    try {
      await putPhoto(photoKey(id), await resizeImage(file))
      updateLocal(id, { photo: true })
    } catch {
      alert('사진을 저장하지 못했어요. 다른 사진으로 시도해 주세요.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="page detail">
      <section className="detail-hero" style={{ ['--tint' as string]: LOCAL_COLOR }}>
        <button className="icon-btn back-btn" onClick={() => back('/local')} aria-label="뒤로">
          <IconBack />
        </button>
        <span className="detail-no">동네 산</span>
        <motion.div
          className="detail-mascot"
          initial={{ scale: 0.6, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Mascot size={150} color={saved ? LOCAL_COLOR : '#E5DDD3'} mood={saved ? 'happy' : 'sleep'} flag={Boolean(saved)} />
        </motion.div>
        <h1 className="detail-name">{m.name}</h1>
        <p className="detail-peak">
          {m.height ? <b>{m.height.toLocaleString()}m</b> : '높이 정보 없음'}
          {saved && (
            <>
              {' · '}
              <b className="accent">{saved.visits.length}번</b> 올랐어요
            </>
          )}
        </p>
      </section>

      {famous && !saved ? (
        <section className="card hint-card static">
          <p>
            이 봉우리는 명산100 <b>「{famous.name}」</b>이에요. 명산 도장으로 인증하세요!
          </p>
          <button className="btn btn-primary btn-block" onClick={() => go(`/m/${famous.id}`)}>
            {famous.name} 명산 페이지로
          </button>
        </section>
      ) : (
        <section className="cta">
          {gpsToday ? (
            <button className="btn btn-block btn-lg done-today" disabled>
              오늘 정상 인증 완료 ✓
            </button>
          ) : (
            <motion.button className="btn btn-primary btn-block btn-lg" whileTap={{ scale: 0.95 }} onClick={() => setMode('gps')}>
              📍 정상에서 인증하기
            </motion.button>
          )}
          <button className="btn btn-block" onClick={() => setMode('manual')}>
            지난 등산 직접 기록하기
          </button>
          <p className="muted small center">같은 산을 다시 오를 때마다 등반 횟수가 쌓여요 (GPS 인증은 하루 한 번)</p>
        </section>
      )}

      <section className="card info-card">
        <dl>
          <div>
            <dt>정상 좌표</dt>
            <dd className="mono">
              {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
            </dd>
          </div>
          <div>
            <dt>출처</dt>
            <dd>{m.id.startsWith('my:') ? '직접 등록한 정상' : 'OpenStreetMap 봉우리'}</dd>
          </div>
        </dl>
        <div className="map-links">
          <a href={`https://map.kakao.com/link/map/${encodeURIComponent(m.name)},${m.lat},${m.lng}`} target="_blank" rel="noreferrer">
            카카오맵
          </a>
          <a href={`https://map.naver.com/p/search/${encodeURIComponent(m.name)}`} target="_blank" rel="noreferrer">
            네이버 지도
          </a>
        </div>
      </section>

      {saved && (
        <motion.section className="card record-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="section-title">등반 기록</h2>
          <ul className="visit-list">
            {visits.map((v, i) => (
              <li key={v.at}>
                <span className="visit-no">{visits.length - i}</span>
                <div>
                  <b>{v.date.replaceAll('-', '. ')}</b>
                  <span className={v.method === 'gps' ? 'badge gps' : 'badge'}>{v.method === 'gps' ? 'GPS' : '직접 기록'}</span>
                  {v.distance !== undefined && v.distance > 0 && <span className="muted small"> 정상 {formatDistance(v.distance)}</span>}
                  {v.memo && <p className="muted small">{v.memo}</p>}
                </div>
                <button
                  className="visit-del"
                  aria-label="이 기록 삭제"
                  onClick={() => confirm(`${shortDate(v.date)} 기록을 지울까요?`) && removeVisit(id, v.at)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          {photoUrl ? (
            <div className="photo">
              <img src={photoUrl} alt={`${m.name} 사진`} />
              <div className="photo-actions">
                <button className="pill-btn" onClick={() => fileRef.current?.click()}>
                  바꾸기
                </button>
                <button
                  className="pill-btn"
                  onClick={async () => {
                    await deletePhoto(photoKey(id))
                    updateLocal(id, { photo: false })
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
              {photoBusy ? '사진 저장 중…' : '📸 대표 사진 추가하기'}
            </button>
          )}

          <label className="memo">
            <span>메모</span>
            <textarea
              rows={3}
              defaultValue={saved.memo ?? ''}
              placeholder="좋아하는 코스, 약수터, 쉬어가는 벤치…"
              onBlur={(e) => updateLocal(id, { memo: e.target.value.trim() || undefined })}
            />
          </label>

          <button
            className="link-btn danger"
            onClick={async () => {
              if (!confirm(`${m.name}의 등반 기록 ${saved.visits.length}개를 모두 지울까요?`)) return
              await deletePhoto(photoKey(id)).catch(() => {})
              removeLocal(id)
              if (id.startsWith('my:')) back('/local')
            }}
          >
            이 산 기록 모두 삭제
          </button>
        </motion.section>
      )}

      <CertifySheet
        target={{ name: m.name, peakLabel: m.name, lat: m.lat, lng: m.lng, color: LOCAL_COLOR }}
        mode={mode}
        onClose={() => setMode(null)}
        onCertified={(c) => {
          setMode(null)
          const next = addVisit(m, { date: c.date, method: c.method, distance: c.distance, memo: c.memo })
          setCelebrate({ count: next.visits.length, date: c.date })
        }}
      />

      <AnimatePresence>
        {celebrate && (
          <Celebration
            name={m.name}
            color={LOCAL_COLOR}
            date={celebrate.date}
            detail={
              <>
                {m.height ? `${m.height.toLocaleString()}m · ` : ''}동네 산 <b>{celebrate.count}번째 등반</b>
              </>
            }
            milestone={
              VISIT_MILESTONES.includes(celebrate.count)
                ? { emoji: '🏅', title: `${celebrate.count}번째 등반!`, sub: `${m.name} 단골 인증` }
                : undefined
            }
            onClose={() => setCelebrate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
