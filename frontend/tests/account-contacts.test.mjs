// 계정 주소록의 저장 본문·담당자 후보와, 다른 계정을 체크리스트 담당자로 저장하기 전에 할 일 담당자 후보로 등록하는지 검사한다(Q-21).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assignablePeople, contactBody, contactDraftError, linkAccount, linkErrorText, unlinkAccount } from '../src/features/address/accountContacts.mjs'
import { syncChecklist } from '../src/features/records/taskRecords.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const ME = 'ME000000000000000000000001', FRIEND = 'FR000000000000000000000002'

test('일반 저장 본문에는 계정 연결 값을 넣지 않고 빈 값은 뺀다', () => {
  assert.deepEqual(contactBody({ name: ' 친구 ', relation: '', email: ' f@example.test ', accountId: FRIEND, accountNickname: 'x' }), { name: '친구', email: 'f@example.test' })
  assert.equal(contactDraftError({ name: '' }), '이름을 입력해 주세요.')
  assert.equal(contactDraftError({ name: 'a', email: 'not-mail' }), '이메일 형식을 확인해 주세요.')
  assert.equal(contactDraftError({ name: 'a', email: '' }), '')
})

test('담당자 후보는 계정에 연결된 연락처만이고 값은 계정 ID다', () => {
  assert.deepEqual(assignablePeople([{ id: 'c1', name: '친구', accountId: FRIEND, accountNickname: '프렌드' }, { id: 'c2', name: '연결 안 됨' }]), [{ id: FRIEND, name: '친구', nickname: '프렌드' }])
})

test('연결·해제 요청 경로와 오류 문구', async () => {
  const calls = []
  const request = async (path, options) => { calls.push([path, options.method, options.body]); return {} }
  await linkAccount(request, { id: 'c1', version: 3 })
  await unlinkAccount(request, { id: 'c1', version: 4 })
  assert.deepEqual(calls, [['/api/contacts/c1/account', 'POST', '{"version":3}'], ['/api/contacts/c1/account?version=4', 'DELETE', undefined]])
  assert.match(linkErrorText({ status: 404 }), /찾지 못했어요/)
  assert.match(linkErrorText({ status: 429 }), /1분 뒤/)
})

test('다른 계정을 담당자로 저장하기 전에 할 일 담당자 후보로 한 번만 등록하고, 나·없음은 등록하지 않는다', async () => {
  const calls = []
  let n = 0
  const request = async (path, options = {}) => {
    calls.push(`${options.method ?? 'GET'} ${path}`)
    if (path.includes('/assignees/')) return { userId: FRIEND }
    const body = options.body ? JSON.parse(options.body) : {}
    return { id: 'i' + (++n), version: 1, title: body.title, completed: false, assigneeId: body.assigneeId ?? null }
  }
  const draft = [
    { id: 'a', title: '자료 찾기', done: false, assigneeId: FRIEND },
    { id: 'b', title: '정리', done: false, assigneeId: FRIEND },
    { id: 'c', title: '내 일', done: false, assigneeId: 'self' },
    { id: 'd', title: '미정', done: false, assigneeId: null },
  ]
  const result = await syncChecklist({ request, taskId: 't1', baseline: [], draft, me: ME })
  assert.equal(result.error, null)
  assert.deepEqual(calls, [
    `PUT /api/tasks/t1/assignees/${FRIEND}`,
    'POST /api/tasks/t1/checklist-items',
    'POST /api/tasks/t1/checklist-items',
    'POST /api/tasks/t1/checklist-items',
    'POST /api/tasks/t1/checklist-items',
  ])
})

test('화면 연결: 로그인 주소록은 계정 주소록 컴포넌트, 체크리스트는 연결된 연락처를 담당자로 쓴다', () => {
  assert.match(read('../src/views/address/AddressBookView.vue'), /<AccountAddressBook v-if="session\.userId" \/>/)
  const editor = read('../src/components/ChecklistEditor.vue')
  assert.match(editor, /props\.accountOnly \? assignableContacts\.value/)
  assert.match(editor, /to="\/address"/)
  const store = read('../src/store/accountContacts.js')
  assert.match(store, /path: CONTACT_PATH/)
  assert.doesNotMatch(read('../src/store/contacts.js'), /accountContacts|\/api\/contacts/)
})
