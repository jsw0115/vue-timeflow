// 랭킹 참여 끄기의 계정 설정 저장과 순위 표시 규칙을 검사한다(PR-19 UF-136, UT-242의 화면 쪽).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VISIBILITY_PATH, createRankingVisibility, isRankingVisible, visibilityErrorText } from '../src/features/community/rankingVisibility.mjs'
import { rankRows } from '../src/features/community/challengeClient.mjs'

test('값이 없으면 참여이고 false일 때만 끈 것으로 본다', () => {
  assert.equal(isRankingVisible(undefined), true)
  assert.equal(isRankingVisible({}), true)
  assert.equal(isRankingVisible({ rankingVisible: 'false' }), true)
  assert.equal(isRankingVisible({ rankingVisible: false }), false)
})

test('저장은 같은 구역의 다른 값을 지우지 않고 version과 함께 보낸다', async () => {
  let row = { id: 'share-visibility', version: 0, value: {} }
  const sent = []
  const request = async (path, options = {}) => {
    assert.equal(path, VISIBILITY_PATH)
    if ((options.method ?? 'GET') === 'GET') return row
    const body = JSON.parse(options.body); sent.push(body)
    row = { id: 'share-visibility', version: (row.version || 0) + 1, value: body.value }
    return row
  }
  const account = createRankingVisibility({ request })
  assert.equal(await account.load(), true)
  assert.equal(await account.save(false), false)
  assert.deepEqual(sent[0], { value: { rankingVisible: false } })
  row.value.other = '유지'
  assert.equal(await account.save(true), true)
  assert.deepEqual(sent[1], { value: { rankingVisible: true, other: '유지' }, version: 1 })
  await assert.rejects(() => account.save('off'))
  assert.match(visibilityErrorText({ status: 409 }), /다른 기기/)
})

test('참여를 끈 본인 행은 순위 번호 없이 맨 뒤에 두고 다른 회원 순위를 밀어내지 않는다', () => {
  const rows = rankRows([
    { userId: 'me', nickname: '나', doneDays: 9, verifiedDays: 9, rankingHidden: true },
    { userId: 'a', nickname: 'A', doneDays: 3, verifiedDays: 1 },
    { userId: 'b', nickname: 'B', doneDays: 3, verifiedDays: 1 },
    { userId: 'c', nickname: 'C', doneDays: 1, verifiedDays: 0 },
  ], 'me')
  assert.deepEqual(rows.map((row) => [row.userId, row.rank, row.me]), [['a', 1, false], ['b', 1, false], ['c', 3, false], ['me', null, true]])
})

test('랭킹 화면은 체크박스로 바꾸고 실패하면 이전 값으로 되돌린다', () => {
  const view = readFileSync(new URL('../src/views/community/RankingView.vue', import.meta.url), 'utf8')
  assert.match(view, /type="checkbox" :checked="rankingVisible"/)
  assert.match(view, /랭킹에 나를 보이기/)
  assert.match(view, /event\.target\.checked = rankingVisible\.value/)
  assert.match(view, /r\.rank \?\? '–'/)
})

test('저장 중에 체크박스를 disabled로 만들지 않아 키보드 포커스가 남는다', () => {
  const view = readFileSync(new URL('../src/views/community/RankingView.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(view, /:disabled="visibilityState === 'saving'/)
  assert.match(view, /if \(visibilityState\.value === 'saving'\) \{ event\.target\.checked = !next; return \}/)
})
