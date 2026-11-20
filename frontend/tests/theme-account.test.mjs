// 화면 테마의 계정 저장(appearance 구역)이 다른 설정을 지우지 않고 version을 지키며, 알 수 없는 값을 걸러 내는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanTheme, createThemeAccount, sameTheme, themeErrorText, THEME_DEFAULT, SECTION_PATH } from '../src/features/settings/themeAccount.mjs'

const keys = { surfaces: ['light', 'dark', 'sepia', 'contrast'], accents: ['forest', 'ink', 'plum', 'clay', 'moss'] }
function server(initial) {
  const calls = []
  let row = initial
  const request = async (path, options = {}) => {
    calls.push([options.method ?? 'GET', path, options.body ? JSON.parse(options.body) : undefined])
    if (options.method === 'POST') { const body = JSON.parse(options.body); row = { id: 'appearance', version: (row?.version ?? 0) + 1, value: body.value }; return row }
    return row
  }
  return { request, calls }
}

test('알 수 없는 표면·색상 키는 null, 잘못된 사용자 색은 기본값으로 바꾼다', () => {
  assert.equal(cleanTheme({ theme: 'neon', accent: 'forest' }, keys), null)
  assert.equal(cleanTheme({ theme: 'dark', accent: 'rainbow' }, keys), null)
  assert.equal(cleanTheme(null, keys), null)
  assert.deepEqual(cleanTheme({ theme: 'dark', accent: 'custom', customAccent: 'red', followSystem: 'yes' }, keys), { theme: 'dark', accent: 'custom', customAccent: THEME_DEFAULT.customAccent, followSystem: false })
  assert.equal(sameTheme(THEME_DEFAULT, { ...THEME_DEFAULT }), true)
  assert.equal(sameTheme(THEME_DEFAULT, { ...THEME_DEFAULT, accent: 'ink' }), false)
})

test('처음 저장은 version 없이, 다음 저장은 받은 version으로 보내고 appearance의 다른 값을 지우지 않는다', async () => {
  const first = server({ id: 'appearance', version: 0, value: {} })
  const account = createThemeAccount({ request: first.request, keys })
  await account.save({ theme: 'sepia', accent: 'plum', customAccent: '#2f5d46', followSystem: false })
  assert.deepEqual(first.calls.at(-1), ['POST', SECTION_PATH, { value: { theme: { theme: 'sepia', accent: 'plum', customAccent: '#2f5d46', followSystem: false } } }])

  const second = server({ id: 'appearance', version: 3, value: { density: 'roomy' } })
  const saved = await createThemeAccount({ request: second.request, keys }).save({ theme: 'dark', accent: 'ink', customAccent: '#2F5D46', followSystem: true })
  assert.deepEqual(second.calls.at(-1)[2], { value: { density: 'roomy', theme: { theme: 'dark', accent: 'ink', customAccent: '#2f5d46', followSystem: true } }, version: 3 })
  assert.equal(saved.theme, 'dark')
  assert.deepEqual(await createThemeAccount({ request: second.request, keys }).load(), { theme: 'dark', accent: 'ink', customAccent: '#2f5d46', followSystem: true })
})

test('저장한 적이 없으면 불러오기는 null이고, 잘못된 값은 보내지 않는다', async () => {
  const empty = server({ id: 'appearance', version: 0, value: {} })
  assert.equal(await createThemeAccount({ request: empty.request, keys }).load(), null)
  await assert.rejects(createThemeAccount({ request: empty.request, keys }).save({ theme: 'neon', accent: 'forest' }))
  assert.equal(empty.calls.filter(c => c[0] === 'POST').length, 0)
  assert.match(themeErrorText({ status: 409 }), /기존 설정을 유지했어요/)
  assert.equal(themeErrorText(new Error('x')), '테마를 저장하지 못했어요. 기존 설정을 유지했어요.')
})
