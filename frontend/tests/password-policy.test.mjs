// 화면 비밀번호 검사가 서버 PasswordPolicy와 같은 결과를 내는지 확인한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { passwordProblem } from '../src/features/auth/passwordPolicy.mjs'

test('서버 정책과 같은 기준으로 통과·실패를 가른다', () => {
  for (const ok of ['abcd1234', 'abcdefg!', '12345678!', 'Passw0rd!'.padEnd(72, 'x')]) assert.equal(passwordProblem(ok), '', ok)
  assert.match(passwordProblem('abc123'), /8~72자/)
  assert.match(passwordProblem('a1'.repeat(37)), /8~72자/)
  assert.match(passwordProblem('abcd 1234'), /공백/)
  assert.match(passwordProblem('abcdefgh'), /2가지 이상/)
  assert.match(passwordProblem('12345678'), /2가지 이상/)
})

test('서버 PasswordPolicy의 길이·종류 기준이 바뀌면 이 검사도 함께 고친다', () => {
  const server = readFileSync(new URL('../../backend/src/main/java/kr/timebar/diary/auth/PasswordPolicy.java', import.meta.url), 'utf8')
  assert.match(server, /length\(\) < 8 \|\| rawPassword\.length\(\) > 72/)
  assert.match(server, /kinds < 2/)
})
