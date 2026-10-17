import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { Celebration } from '../components/Celebration'
import { IconBack } from '../components/Icons'
import { CERT_RADIUS_M } from '../lib/geo'
import { MOUNTAINS, type Mountain } from '../lib/mountains'
import { allPhotos, blobToDataUrl, clearPhotos, dataUrlToBlob, putPhoto } from '../lib/photos'
import { back } from '../lib/router'
import { replaceAll, today, useClimbs, type Climbs } from '../lib/store'

type Backup = { app: 'mountain100'; version: 1; exportedAt: string; climbs: Climbs; photos?: Record<string, string> }

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Settings() {
  const climbs = useClimbs()
  const count = Object.keys(climbs).length
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Mountain | null>(null)

  const exportData = async (withPhotos: boolean) => {
    setBusy(true)
    try {
      const data: Backup = { app: 'mountain100', version: 1, exportedAt: new Date().toISOString(), climbs }
      if (withPhotos) {
        data.photos = {}
        for (const [id, blob] of await allPhotos()) data.photos[id] = await blobToDataUrl(blob)
      }
      download(`명산100-백업-${today()}.json`, JSON.stringify(data))
    } finally {
      setBusy(false)
    }
  }

  const importData = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as Backup
      if (data.app !== 'mountain100' || typeof data.climbs !== 'object') throw new Error()
      const n = Object.keys(data.climbs).length
      if (!confirm(`백업의 정복 기록 ${n}개로 지금 기록(${count}개)을 덮어쓸까요?`)) return
      setBusy(true)
      if (data.photos) {
        await clearPhotos()
        for (const [id, url] of Object.entries(data.photos)) await putPhoto(Number(id), await dataUrlToBlob(url))
      }
      replaceAll(data.climbs)
      alert('복원했어요!')
    } catch {
      alert('백업 파일을 읽을 수 없어요.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="page settings">
      <header className="sub-head">
        <button className="icon-btn" onClick={() => back('/')} aria-label="뒤로">
          <IconBack />
        </button>
        <h1 className="page-title">설정</h1>
      </header>

      <section className="card">
        <h2 className="section-title">데이터 백업</h2>
        <p className="muted small">
          가입 없이 이 기기 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 폰을 바꾸면 사라지니 가끔 백업해 두세요.
        </p>
        <div className="stack">
          <button className="btn btn-block" disabled={busy} onClick={() => exportData(false)}>
            기록만 내보내기 (가벼움)
          </button>
          <button className="btn btn-block" disabled={busy} onClick={() => exportData(true)}>
            사진까지 내보내기
          </button>
          <button className="btn btn-block" disabled={busy} onClick={() => fileRef.current?.click()}>
            백업 파일 불러오기
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">재미</h2>
        <button className="btn btn-block" onClick={() => setPreview(MOUNTAINS[Math.floor(Math.random() * MOUNTAINS.length)])}>
          🎉 정복 애니메이션 미리보기
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">사용 팁</h2>
        <ul className="tips">
          <li>
            <b>홈 화면에 추가</b>하면 앱처럼 열리고, 산 정상에서 신호가 약해도 열려요. (iPhone: 공유 → 홈 화면에 추가)
          </li>
          <li>GPS 인증은 정상 좌표 반경 {CERT_RADIUS_M}m 안에서 성공해요. 하늘이 트인 곳에서 시도하세요.</li>
          <li>위치 인증은 HTTPS 주소에서만 동작해요.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">초기화</h2>
        <button
          className="btn btn-block danger"
          disabled={busy || count === 0}
          onClick={async () => {
            if (!confirm(`정복 기록 ${count}개와 사진을 모두 지울까요? 되돌릴 수 없어요.`)) return
            await clearPhotos().catch(() => {})
            replaceAll({})
          }}
        >
          모든 기록 지우기
        </button>
      </section>

      <AnimatePresence>
        {preview && <Celebration mountain={preview} count={count + 1} date={today()} onClose={() => setPreview(null)} />}
      </AnimatePresence>
    </div>
  )
}
