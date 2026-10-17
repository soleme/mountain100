export type Level = { min: number; title: string; emoji: string }

export const LEVELS: Level[] = [
  { min: 0, title: '등산 준비생', emoji: '🎒' },
  { min: 1, title: '새싹 등산러', emoji: '🌱' },
  { min: 10, title: '능선 탐험가', emoji: '🥾' },
  { min: 30, title: '봉우리 수집가', emoji: '⛰️' },
  { min: 50, title: '구름 위 산책자', emoji: '☁️' },
  { min: 70, title: '산신령 수련생', emoji: '🧙' },
  { min: 100, title: '명산100 완등 산신령', emoji: '👑' },
]

export const MILESTONES = [10, 30, 50, 70, 100]

export function levelFor(count: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) if (count >= l.min) current = l
  const next = LEVELS.find((l) => l.min > count)
  return { current, next }
}

export function isMilestone(count: number) {
  return MILESTONES.includes(count)
}

export type Milestone = { emoji: string; title: string; sub: string }

export function famousMilestone(count: number, total: number): Milestone | undefined {
  if (!isMilestone(count)) return undefined
  const { current } = levelFor(count)
  return { emoji: current.emoji, title: count === total ? `명산 ${total} 완등!!` : `${count}개 명산 달성!`, sub: `새 칭호 「${current.title}」` }
}
