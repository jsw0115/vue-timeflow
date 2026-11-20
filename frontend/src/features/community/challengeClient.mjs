// 커뮤니티 챌린지·인증·랭킹 API를 부르고, 화면이 쓰는 입력 검사·규칙 문구·기간 상태·인증에 쓸 실제 기록 고르기·순위를 한곳에 둔다(PR-10 3b-2, Q-26).
import { localDate } from '../../utils/postValidation.mjs'

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/

export function emptyChallengeDraft(today) {
  return { title: '', desc: '', startDate: today, days: 21, verify: 'self', minMinutes: 20, useWindow: false, windowStart: '06:00', windowEnd: '08:00', openRecords: false }
}

/** 서버(FeatureInput.validateChallenge)와 같은 규칙. 화면에서 먼저 알리고, 최종 판단은 서버가 한다. */
export function challengeDraftError(d) {
  if (!String(d.title ?? '').trim()) return '챌린지 이름을 입력해 주세요.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.startDate ?? '')) return '시작 날짜를 골라 주세요.'
  if (!Number.isInteger(d.days) || d.days < 3 || d.days > 100) return '기간은 3~100일 사이의 정수로 입력해 주세요.'
  if (d.verify !== 'record') return d.openRecords ? '기록 공개 챌린지는 실제 기록으로 인증해야 해요.' : ''
  if (!Number.isInteger(d.minMinutes) || d.minMinutes < 1 || d.minMinutes > 600) return '최소 기록 시간은 1~600분으로 입력해 주세요.'
  if (!d.useWindow) return ''
  if (!CLOCK.test(d.windowStart ?? '') || !CLOCK.test(d.windowEnd ?? '')) return '인증 시간대를 시:분으로 입력해 주세요.'
  if (d.windowStart >= d.windowEnd) return '인증 시간대의 끝은 시작보다 늦어야 해요. 자정을 넘는 시간대는 정할 수 없어요.'
  return ''
}

/** 고른 인증 방식에 필요한 필드만 보낸다. */
export function challengeBody(d) {
  const body = { title: d.title.trim(), startDate: d.startDate, days: d.days, verify: d.verify === 'record' ? 'record' : 'self' }
  if (String(d.desc ?? '').trim()) body.desc = d.desc.trim()
  if (body.verify !== 'record') return body
  body.minMinutes = d.minMinutes
  if (d.useWindow) { body.windowStart = d.windowStart; body.windowEnd = d.windowEnd }
  if (d.openRecords) body.openRecords = true
  return body
}

export function challengeRule(c) {
  if (c?.verify !== 'record') return '직접 인증'
  return ['실제 기록 확인', c.windowStart && c.windowEnd ? `${c.windowStart}~${c.windowEnd}` : '', `${c.minMinutes}분 이상`, c.openRecords ? '기록 공개' : ''].filter(Boolean).join(' · ')
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return localDate(d)
}

/** 시작일부터 days일. state는 upcoming(시작 전)·ongoing·ended. */
export function challengePeriod(c, today) {
  const end = addDays(c.startDate, c.days - 1)
  return { start: c.startDate, end, state: today < c.startDate ? 'upcoming' : today > end ? 'ended' : 'ongoing' }
}

/** 오늘 인증 버튼 상태. join(참여 전)·upcoming·ended·done(오늘 이미 인증)·ready. */
export function checkinState(c, today) {
  if (!c.joined) return 'join'
  const { state } = challengePeriod(c, today)
  if (state !== 'ongoing') return state
  return c.myLastDate === today ? 'done' : 'ready'
}

/**
 * 인증에 쓸 수 있는 실제 기록과 그 분. 서버와 같은 규칙이다. 실시간으로 시작·종료한 완료 기록(finishKey)만 쓰고,
 * 시간대가 있으면 그 날짜의 시간대와 겹친 분, 없으면 그 날짜에 시작한 기록 전체 분을 센다.
 * 브라우저 시간대로 계산하므로 프로필 시간대·하루 시작 시각이 다르면 서버가 거절할 수 있다.
 */
export function sessionsForCheckin(sessions, c, date) {
  const need = c?.verify === 'record' ? c.minMinutes : 1
  return (sessions ?? []).filter((s) => s.state === 'COMPLETED' && s.finishKey && s.startedAt && s.endedAt).map((s) => {
    const from = new Date(s.startedAt).getTime(), to = new Date(s.endedAt).getTime()
    let ms
    if (c?.windowStart && c?.windowEnd) {
      const open = new Date(`${date}T${c.windowStart}:00`).getTime(), close = new Date(`${date}T${c.windowEnd}:00`).getTime()
      ms = Math.max(0, Math.min(to, close) - Math.max(from, open))
    } else ms = localDate(new Date(from)) === date ? to - from : 0
    const minutes = Math.floor(ms / 60000)
    return { id: s.id, title: s.title ?? '', startedAt: s.startedAt, endedAt: s.endedAt, minutes, need, eligible: ms > 0 && minutes >= need, relevant: ms > 0 }
  }).filter((s) => s.relevant).sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}

/** 인증 일수, 같으면 기록 확인 일수 순. 둘 다 같으면 같은 순위다. */
export function rankRows(rows, me) {
  const sorted = [...(rows ?? [])].sort((a, b) => b.doneDays - a.doneDays || b.verifiedDays - a.verifiedDays)
  return sorted.map((row, i) => {
    let rank = i + 1
    for (let j = i - 1; j >= 0 && sorted[j].doneDays === row.doneDays && sorted[j].verifiedDays === row.verifiedDays; j--) rank = j + 1
    return { ...row, rank, me: row.userId === me }
  })
}

export function challengeErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  if (error.status === 403) return '챌린지에 참여한 커뮤니티 회원만 할 수 있어요.'
  if (error.status === 404) return '챌린지나 실제 기록을 찾을 수 없어요. 목록을 새로 불러와 주세요.'
  return error.message || '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** request는 features/auth/apiRequest.js처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다. */
export function createChallengeClient({ request }) {
  const q = encodeURIComponent
  const send = (path, method, body) => request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const base = (id, challenge) => `/api/communities/${q(id)}/challenges` + (challenge ? `/${q(challenge)}` : '')
  return {
    list: (id) => request(base(id)),
    create: (id, body) => send(base(id), 'POST', body),
    /** 기록 공개 챌린지는 consent=true여야 참여된다. */
    join: (id, challenge, consent = false) => send(`${base(id, challenge)}/join`, 'POST', consent ? { consent: true } : {}),
    /** 참여 취소. 내 인증과 근거도 함께 지워진다. */
    leave: (id, challenge) => send(`${base(id, challenge)}/members/me`, 'DELETE'),
    checkin: (id, challenge, date, sessionId = '') => send(`${base(id, challenge)}/checkins/${q(date)}`, 'PUT', sessionId ? { sessionId } : {}),
    checkins: (id, challenge, userId = '') => request(`${base(id, challenge)}/checkins` + (userId ? `?userId=${q(userId)}` : '')),
    ranking: (id, challenge) => request(`${base(id, challenge)}/ranking`),
    recordings: () => request('/api/planner/recordings'),
  }
}
