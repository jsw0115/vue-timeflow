// 관리자 정책 보기(/api/admin/policy)의 값을 화면 문구로 바꾼다(Q-30). 서버가 적용하지 않는 항목은 "지원하지 않음"으로만 보인다.

import { korean } from '../i18n/translate.mjs'

export const loadPolicy = (request) => request('/api/admin/policy')

/** 초를 "15분", "14일", "1시간 30분" 형식으로. t는 화면 표시용 번역(기본 한국어)이다. */
export function durationLabel(seconds, t = korean) {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0) return '—'
  const minutes = Math.round(s / 60)
  if (minutes < 60) return t('{n}분', { n: minutes })
  if (minutes % 1440 === 0) return t('{n}일', { n: minutes / 1440 })
  const hours = Math.floor(minutes / 60), rest = minutes % 60
  return rest ? t('{n}시간 {m}분', { n: hours, m: rest }) : t('{n}시간', { n: hours })
}

/** 바이트를 MB(1024 단위, 소수 없으면 정수)로. */
export function megabytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '—'
  const mb = n / 1048576
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`
}

/** 서버 unsupported 키 → 화면 이름과 이유. 화면에 있던 설정 중 서버가 적용하지 않는 것만 둔다. */
export const UNSUPPORTED_LABELS = {
  adminTwoFactor: '관리자 2단계 인증',
  ipAllowlist: '관리자 IP 허용 목록',
  operatorRoles: '세부 운영자 역할(최고 관리자·운영자·읽기 전용)',
  signupControl: '신규 가입 막기·초대 가입',
  emailVerification: '이메일 인증 필수',
  dataRetention: '휴지통·감사 로그·첨부파일 자동 보관 기간',
  dormantAccounts: '휴면 계정 전환',
}

/** 화면 구획별로 보일 행을 만든다. 값은 모두 서버 응답에서만 온다. t는 값 문구의 번역(기본 한국어)이고, 이름표(label)는 화면에서 옮긴다. */
export function policySections(policy, t = korean) {
  const p = policy ?? {}
  const unsupported = (p.unsupported ?? []).filter((key) => UNSUPPORTED_LABELS[key])
  const off = (keys) => unsupported.filter((key) => keys.includes(key)).map((key) => ({ label: UNSUPPORTED_LABELS[key], value: t('지원하지 않음'), unsupported: true }))
  return [
    { id: 'service', label: '서비스 정책', rows: [
      { label: '첨부파일 한 개 최대 크기', value: megabytes(p.uploads?.attachmentMaxBytes) },
      { label: '백업 파일 최대 크기', value: megabytes(p.uploads?.backupMaxBytes) },
      ...off(['signupControl', 'emailVerification']),
    ] },
    { id: 'members', label: '운영자 권한', rows: [
      { label: '계정 역할', value: (p.roles ?? []).join(' · ') || '—' },
      ...off(['operatorRoles']),
    ] },
    { id: 'security', label: '보안', rows: [
      { label: '비밀번호 길이', value: p.password ? t('{min}~{max}자', { min: p.password.minLength, max: p.password.maxLength }) : '—' },
      { label: '비밀번호 조합', value: p.password ? t('영문·숫자·특수문자 중 {n}종 이상', { n: p.password.minKinds }) + (p.password.whitespaceAllowed ? '' : t(', 공백 불가')) : '—' },
      { label: '로그인 잠금', value: p.login ? t('{n}번 실패하면 {m}분 잠금', { n: p.login.maxFailures, m: p.login.lockMinutes }) : '—' },
      { label: '로그인 유지(접근 토큰)', value: durationLabel(p.session?.accessTtlSeconds, t) },
      { label: '자동 로그인 갱신(갱신 토큰)', value: durationLabel(p.session?.refreshTtlSeconds, t) },
      ...off(['adminTwoFactor', 'ipAllowlist']),
    ] },
    { id: 'retention', label: '보관 정책', rows: [
      { label: '재전송 확인 기록', value: p.retention ? t('{n}일 뒤 자동 정리', { n: p.retention.idempotencyKeyDays }) : '—' },
      ...off(['dataRetention', 'dormantAccounts']),
    ] },
  ]
}
