import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { CERT_RADIUS_M, distanceM, formatDistance, getPosition, isWithinSummit } from '../lib/geo'
import { today, type Climb } from '../lib/store'
import { Mascot } from './Mascot'
import { Sheet } from './Sheet'

export type CertifyMode = 'gps' | 'manual'

/** 인증 대상: 명산100이든 동네 산이든 이름·정상 좌표·색만 있으면 됨 */
export type CertifyTarget = { name: string; peakLabel: string; lat: number; lng: number; color: string }

type Props = {
  target: CertifyTarget
  mode: CertifyMode | null
  onClose: () => void
  onCertified: (climb: Omit<Climb, 'mountainId' | 'createdAt'>) => void
}

type Step =
  | { kind: 'locating' }
  | { kind: 'far'; distance: number; accuracy: number }
  | { kind: 'error'; message: string }
  | { kind: 'manual' }

export function CertifySheet({ target, mode, onClose, onCertified }: Props) {
  const [step, setStep] = useState<Step>({ kind: 'locating' })
  const [date, setDate] = useState(today())
  const [memo, setMemo] = useState('')
  const color = target.color

  const locate = async () => {
    setStep({ kind: 'locating' })
    try {
      const pos = await getPosition()
      const distance = distanceM({ lat: pos.coords.latitude, lng: pos.coords.longitude }, target)
      if (isWithinSummit(distance, pos.coords.accuracy)) {
        onCertified({ date: today(), method: 'gps', distance: Math.round(distance) })
      } else {
        setStep({ kind: 'far', distance, accuracy: pos.coords.accuracy })
      }
    } catch (e) {
      setStep({ kind: 'error', message: (e as Error).message })
    }
  }

  useEffect(() => {
    if (mode === 'gps') locate()
    if (mode === 'manual') {
      setDate(today())
      setMemo('')
      setStep({ kind: 'manual' })
    }
  }, [mode])

  return (
    <Sheet open={mode !== null} onClose={onClose} label={`${target.name} 인증`}>
      {step.kind === 'locating' && (
        <div className="certify-center">
          <div className="radar">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                style={{ borderColor: color }}
                initial={{ scale: 0.3, opacity: 0.9 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
            <Mascot size={110} color={color} mood="look" />
          </div>
          <h3>정상 위치 확인 중…</h3>
          <p className="muted">
            {target.peakLabel} 반경 {CERT_RADIUS_M}m 안에 있으면 인증돼요
          </p>
        </div>
      )}

      {step.kind === 'far' && (
        <div className="certify-center">
          <motion.div initial={{ rotate: -6 }} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <Mascot size={110} color="#D9D0C5" mood="tired" />
          </motion.div>
          <h3>
            정상까지 <span className="accent">{formatDistance(step.distance)}</span> 남았어요!
          </h3>
          <p className="muted">
            {step.distance > 5000 ? '아직 산에 도착하지 않았나 봐요 🚗' : '조금만 더 힘내요 💪'}
            {step.accuracy >= 1 && ` (GPS 오차 ±${Math.round(step.accuracy)}m)`}
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={locate}>
              다시 확인
            </button>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
          <button className="link-btn" onClick={() => setStep({ kind: 'manual' })}>
            예전에 다녀왔다면 직접 기록하기
          </button>
        </div>
      )}

      {step.kind === 'error' && (
        <div className="certify-center">
          <Mascot size={110} color="#D9D0C5" mood="tired" />
          <h3>위치를 못 찾았어요</h3>
          <p className="muted">{step.message}</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={locate}>
              다시 시도
            </button>
            <button className="btn" onClick={() => setStep({ kind: 'manual' })}>
              직접 기록
            </button>
          </div>
        </div>
      )}

      {step.kind === 'manual' && (
        <form
          className="manual-form"
          onSubmit={(e) => {
            e.preventDefault()
            onCertified({ date, method: 'manual', memo: memo.trim() || undefined })
          }}
        >
          <h3>{target.name} 등산 기록</h3>
          <p className="muted">GPS 없이 기록하면 「직접 기록」 도장이 찍혀요.</p>
          <label>
            <span>다녀온 날</span>
            <input type="date" value={date} max={today()} required onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>한 줄 메모</span>
            <textarea rows={3} value={memo} placeholder="누구랑, 어떤 코스로 다녀왔나요?" onChange={(e) => setMemo(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-block" type="submit">
            기록하고 도장 받기
          </button>
        </form>
      )}
    </Sheet>
  )
}
