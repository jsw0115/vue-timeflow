// 마감 알림(Q-32) 화면 쪽: 알림함은 서버 계산 뒤 목록을 읽고, 설정은 서버 허용값과 같으며 다른 값을 지우지 않고 저장한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createNotificationClient, fromServer, relativeTime } from '../src/features/notifications/notificationClient.mjs'
import { LEAD_DAYS, LEAD_MINUTES, createDueSettings, readDueSettings } from '../src/features/notifications/dueSettings.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('허용값이 서버 DueReminders와 같다', () => {
  const java = read('../../backend/src/main/java/kr/timebar/diary/records/DueReminders.java')
  const list = (name) => JSON.parse('[' + java.match(new RegExp(name + ' = List\\.of\\(([^)]*)\\)'))[1] + ']')
  assert.deepEqual(LEAD_MINUTES.map((o) => o.value), list('LEAD_MINUTES'))
  assert.deepEqual(LEAD_DAYS.map((o) => o.value), list('LEAD_DAYS'))
})

test('알림함 읽기: 먼저 마감 계산을 요청하고, 계산이 실패해도 목록은 최신순으로 읽는다', async () => {
  const calls = []
  const request = async (path, options = {}) => {
    calls.push(`${options.method ?? 'GET'} ${path}`)
    if (path.endsWith('/due-refresh')) throw Object.assign(new Error('x'), { status: 503 })
    return { items: [{ id: 'a', version: 1, title: '옛', kind: '마감', createdAt: '2026-11-20T00:00:00Z' }, { id: 'b', version: 2, title: '새', kind: '마감', read: true, createdAt: '2026-11-22T00:00:00Z' }] }
  }
  const rows = await createNotificationClient(request).load()
  assert.deepEqual(calls, ['POST /api/notifications/due-refresh', 'GET /api/notifications?page=0&size=100'])
  assert.deepEqual(rows.map((r) => [r.id, r.read]), [['b', true], ['a', false]])
  assert.equal(fromServer({ id: 'x', version: 1 }).link, '/notifications')
  const now = Date.parse('2026-11-22T12:00:00Z')
  assert.deepEqual([relativeTime('2026-11-22T11:59:40Z', now), relativeTime('2026-11-22T11:48:00Z', now), relativeTime('2026-11-22T09:00:00Z', now), relativeTime('2026-11-21T09:00:00Z', now)], ['방금', '12분 전', '3시간 전', '어제'])
})

test('설정은 같은 구역의 다른 값을 지우지 않고, 지원 알림을 비우면 키를 지워 커리어 목표를 따른다', async () => {
  assert.deepEqual(readDueSettings(undefined), { enabled: true, leadMinutes: 60, leadDays: null })
  assert.deepEqual(readDueSettings({ dueReminders: false, dueLeadMinutes: 45, applicationLeadDays: 3 }), { enabled: false, leadMinutes: 60, leadDays: 3 })
  let row = { id: 'notifications', version: 2, value: { quietHours: '22-07', applicationLeadDays: 7 } }
  const sent = []
  const request = async (path, options = {}) => {
    if ((options.method ?? 'GET') === 'GET') return row
    const body = JSON.parse(options.body); sent.push(body); row = { ...row, version: row.version + 1, value: body.value }; return row
  }
  const settings = createDueSettings({ request })
  assert.deepEqual(await settings.save({ enabled: true, leadMinutes: 30, leadDays: null }), { enabled: true, leadMinutes: 30, leadDays: null })
  assert.deepEqual(sent[0], { value: { quietHours: '22-07', dueReminders: true, dueLeadMinutes: 30 }, version: 2 })
})

test('화면 연결: 알림 저장소는 로그인이면 서버, 알림함은 열 때 다시 읽고, 설정은 메일·메신저를 준비 중으로 안내한다', () => {
  const store = read('../src/store/people.js')
  assert.match(store, /session\.userId \? serverNotifications\.value\.filter\(\(n\) => isVisible\(n, clockTick\.value\)\) : demoNotifications\.value/)
  assert.match(read('../src/views/home/NotificationsView.vue'), /onMounted\(\(\) => \{ if \(session\.userId\) void loadNotifications\(\) \}\)/)
  const settings = read('../src/components/DueReminderSettings.vue')
  assert.match(settings, /메일·메신저로 받는 마감 알림은 발송 서비스를 연결한 뒤 켤 수 있어요\(준비 중\)/)
  assert.match(read('../src/views/settings/SettingsNotificationsView.vue'), /<DueReminderSettings v-if="session\.userId" \/>/)
})

test('UF-126·UF-127: 바로 처리 버튼은 처리 전·기간 안의 할 일 알림에만, 미룬 알림은 그 시각까지 숨기고, 오류는 서버 안내를 보인다', async () => {
  const { canAct, isVisible, actionErrorText, createNotificationClient: client } = await import('../src/features/notifications/notificationClient.mjs')
  const now = Date.parse('2026-11-23T05:00:00Z')
  const base = { action: { kind: 'task', id: 'T1' }, handled: null, expiresAt: '2026-11-24T00:00:00Z' }
  assert.equal(canAct(base, now), true)
  assert.equal(canAct({ ...base, handled: 'completed' }, now), false)
  assert.equal(canAct({ ...base, expiresAt: '2026-11-23T04:59:00Z' }, now), false)
  assert.equal(canAct({ ...base, action: null }, now), false)
  assert.equal(isVisible({ showAfter: '2026-11-23T05:10:00Z' }, now), false)
  assert.equal(isVisible({ showAfter: '2026-11-23T05:10:00Z' }, now + 10 * 60000), true)
  assert.equal(actionErrorText({ status: 409, message: '이미 완료했어요.' }), '이미 완료했어요.')
  const calls = []
  await client(async (path, options) => { calls.push(`${options.method} ${path}`); return {} }).act({ id: 'due:task:T1:2026-11-23' }, 'complete')
  assert.deepEqual(calls, ['POST /api/notifications/due%3Atask%3AT1%3A2026-11-23/actions/complete'])
  for (const file of ['../src/views/home/NotificationsView.vue', '../src/components/SidePanel.vue']) {
    const view = read(file)
    assert.match(view, /actOnNotification\(n, 'complete'\)/, file)
    assert.match(view, /actOnNotification\(n, 'snooze'\)/, file)
    assert.match(view, /처리됨/, file)
  }
})
