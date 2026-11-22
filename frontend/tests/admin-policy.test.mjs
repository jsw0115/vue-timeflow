// 관리자 설정이 서버 정책 보기(읽기 전용)로 바뀌었고, 값은 서버 응답에서만 오며 적용 안 되는 항목은 "지원하지 않음"인지 검사한다(Q-30).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { UNSUPPORTED_LABELS, durationLabel, megabytes, policySections } from '../src/features/admin/policy.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const POLICY = {
  password: { minLength: 8, maxLength: 72, minKinds: 2, whitespaceAllowed: false },
  login: { maxFailures: 5, lockMinutes: 15 },
  session: { accessTtlSeconds: 900, refreshTtlSeconds: 1209600 },
  uploads: { attachmentMaxBytes: 10485760, backupMaxBytes: 8388608 },
  retention: { idempotencyKeyDays: 7 },
  roles: ['USER', 'ADMIN'],
  unsupported: ['adminTwoFactor', 'ipAllowlist', 'operatorRoles', 'signupControl', 'emailVerification', 'dataRetention', 'dormantAccounts'],
}

test('시간·크기 문구', () => {
  assert.deepEqual([durationLabel(900), durationLabel(1209600), durationLabel(5400), durationLabel(0)], ['15분', '14일', '1시간 30분', '—'])
  assert.deepEqual([megabytes(10485760), megabytes(8388608), megabytes(1572864), megabytes(null)], ['10MB', '8MB', '1.5MB', '—'])
})

test('구획별 행은 서버 값으로 만들고 지원하지 않는 항목은 따로 표시한다', () => {
  const sections = policySections(POLICY)
  assert.deepEqual(sections.map((s) => s.id), ['service', 'members', 'security', 'retention'])
  const security = sections.find((s) => s.id === 'security').rows
  assert.ok(security.some((row) => row.value === '8~72자'))
  assert.ok(security.some((row) => row.value === '5번 실패하면 15분 잠금'))
  assert.ok(security.some((row) => row.value === '15분'))
  const off = sections.flatMap((s) => s.rows).filter((row) => row.unsupported).map((row) => row.label)
  assert.deepEqual(off.sort(), Object.values(UNSUPPORTED_LABELS).sort())
  assert.ok(policySections({}).flatMap((s) => s.rows).every((row) => row.value === '—' || row.unsupported || row.value === '—'))
})

test('서버 unsupported 목록과 화면 이름표의 키가 같다', () => {
  const java = read('../../backend/src/main/java/kr/timebar/diary/contract/AdminPolicyController.java')
  const keys = JSON.parse('[' + java.match(/UNSUPPORTED = List\.of\(([^)]*)\)/)[1] + ']')
  assert.deepEqual(keys.sort(), Object.keys(UNSUPPORTED_LABELS).sort())
})

test('화면은 편집 입력·저장 버튼·시연 저장 문구 없이 서버 정책만 보이고 서버 연결 화면으로 표시된다', () => {
  const view = read('../src/views/admin/AdminSettingsView.vue')
  assert.doesNotMatch(view, /v-model\.number|저장하기|저장했어요|자동으로 정리돼요|adminOps/)
  assert.match(view, /loadPolicy\(apiRequest\)/)
  assert.match(view, /이 화면에서는 바꿀 수 없어요/)
  assert.match(read('../src/AdminApp.vue'), /SERVER_PATHS = new Set\(\[[^\]]*'\/admin\/settings'/)
})
