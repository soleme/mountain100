import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Celebration } from '../components/Celebration'
import { CertifySheet, type CertifyMode } from '../components/CertifySheet'
import { IconBack } from '../components/Icons'
import { Mascot } from '../components/Mascot'
import { Stamp } from '../components/Stamp'
import { formatDistance } from '../lib/geo'
import { REGION_COLOR, getMountain, kakaoMapUrl, naverMapUrl } from '../lib/mountains'
import { deletePhoto, putPhoto, resizeImage, usePhotoUrl } from '../lib/photos'
import { back } from '../lib/router'
import { getClimbs, removeClimb, saveClimb, updateClimb, useClimbs } from '../lib/store'

export function Detail({ id }: { id: number }) {
  const m = getMountain(id)
  const climbs = useClimbs()
  const climb = climbs[id]
  const [mode, setMode] = useState<CertifyMode | null>(null)
  const [celebrate, setCelebrate] = useState<{ count: number; date: string } | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoUrl = usePhotoUrl(id)

  if (!m)
    return (
      <div className="page empty">
        <p>산을 찾을 수 없어요.</p>
        <button className="btn" onClick={() => back('/list')}>
          돌아가기
        </button>
      </div>
    )

  const color = REGION_COLOR[m.region]

  const onPhoto = async (file?: File) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      await putPhoto(id, await resizeImage(file))
      updateClimb(id, { photo: true })
    } catch {
      alert('사진을 저장하지 못했어요. 다른 사진으로 시도해 주세요.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="page detail">
      <section className="detail-hero" style={{ ['--tint' as string]: color }}>
        <button className="icon-btn back-btn" onClick={() => back('/list')} aria-label="뒤로">
          <IconBack />
        </button>
        <span className="detail-no">No.{m.id}</span>
        <motion.div
          className="detail-mascot"
          initial={{ scale: 0.6, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Mascot size={150} color={climb ? color : '#E5DDD3'} mood={climb ? 'happy' : 'sleep'} flag={Boolean(climb)} />
          {!climb && (
            <motion.span
              className="zzz"
              animate={{ opacity: [0, 1, 0], y: [0, -16], x: [0, 8] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              z z
            </motion.span>
          )}
        </motion.div>
        <h1 className="detail-name">{m.name}</h1>
        <p className="detail-peak">
          {m.peak} · <b>{m.height.toLocaleString()}m</b>
        </p>
      </section>

      <section className="card info-card">
        <p className="desc">{m.desc}</p>
        <dl>
          <div>
            <dt>지역</dt>
            <dd>
              <span className="region-tag" style={{ ['--c' as string]: color }}>
                {m.region}
              </span>{' '}
              {m.location}
            </dd>
          </div>
          <div>
            <dt>정상 좌표</dt>
            <dd className="mono">
              {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
            </dd>
          </div>
        </dl>
        <div className="map-links">
          <a href={kakaoMapUrl(m)} target="_blank" rel="noreferrer">
            카카오맵
          </a>
          <a href={naverMapUrl(m)} target="_blank" rel="noreferrer">
            네이버 지도
          </a>
        </div>
      </section>

      {climb ? (
        <motion.section className="card record-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="record-top">
            <Stamp mountain={m} climb={climb} size={92} />
            <div>
              <span className={climb.method === 'gps' ? 'badge gps' : 'badge'}>{climb.method === 'gps' ? '📍 GPS 정상 인증' : '✍️ 직접 기록'}</span>
              <p className="record-date">{climb.date.replaceAll('-', '. ')}</p>
              {climb.distance !== undefined && <p className="muted small">정상에서 {formatDistance(climb.distance)} 지점에서 인증</p>}
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          {photoUrl ? (
            <div className="photo">
              <img src={photoUrl} alt={`${m.name} 정상 사진`} />
              <div className="photo-actions">
                <button className="pill-btn" onClick={() => fileRef.current?.click()}>
                  바꾸기
                </button>
                <button
                  className="pill-btn"
                  onClick={async () => {
                    await deletePhoto(id)
                    updateClimb(id, { photo: false })
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
              {photoBusy ? '사진 저장 중…' : '📸 정상 인증샷 추가하기'}
            </button>
          )}

          <label className="memo">
            <span>메모</span>
            <textarea
              rows={3}
              defaultValue={climb.memo ?? ''}
              placeholder="코스, 날씨, 함께한 사람… 기억하고 싶은 것들"
              onBlur={(e) => updateClimb(id, { memo: e.target.value.trim() || undefined })}
            />
          </label>

          <button
            className="link-btn danger"
            onClick={async () => {
              if (!confirm(`${m.name} 정복 기록을 지울까요? 사진도 함께 지워져요.`)) return
              await deletePhoto(id).catch(() => {})
              removeClimb(id)
            }}
          >
            기록 삭제
          </button>
        </motion.section>
      ) : (
        <section className="cta">
          <motion.button className="btn btn-primary btn-block btn-lg" whileTap={{ scale: 0.95 }} onClick={() => setMode('gps')}>
            📍 정상에서 인증하기
          </motion.button>
          <button className="btn btn-block" onClick={() => setMode('manual')}>
            지난 등산 직접 기록하기
          </button>
          <p className="muted small center">정상 반경 300m 안에서 GPS로 인증하면 ✓ 표시 도장을 받아요</p>
        </section>
      )}

      <CertifySheet
        mountain={m}
        mode={mode}
        onClose={() => setMode(null)}
        onCertified={(c) => {
          setMode(null)
          saveClimb({ ...c, mountainId: id, createdAt: Date.now() })
          setCelebrate({ count: Object.keys(getClimbs()).length, date: c.date })
        }}
      />

      <AnimatePresence>
        {celebrate && <Celebration mountain={m} count={celebrate.count} date={celebrate.date} onClose={() => setCelebrate(null)} />}
      </AnimatePresence>
    </div>
  )
}
