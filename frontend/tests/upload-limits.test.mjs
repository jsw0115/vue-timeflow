// 프록시·Spring·첨부 컨트롤러의 업로드 한도가 같은 기준을 가리키는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = path => readFileSync(root + path, 'utf8')
const MiB = 1024 * 1024

// Nginx의 m과 Spring DataSize의 MB는 모두 1024*1024 바이트다.
const mebibytes = (text, pattern, label) => {
  const match = text.match(pattern)
  assert.ok(match, `${label} 설정을 찾지 못했습니다.`)
  return Number(match[1]) * MiB
}

const proxy = mebibytes(read('infra/deploy/nginx.conf'), /client_max_body_size\s+(\d+)m;/, 'Nginx 본문 한도')
const springFile = mebibytes(read('backend/src/main/resources/application.yml'), /max-file-size:\s*(\d+)MB/, 'Spring 파일 한도')
const springRequest = mebibytes(read('backend/src/main/resources/application.yml'), /max-request-size:\s*(\d+)MB/, 'Spring 요청 한도')
const attachment = (() => {
  const match = read('backend/src/main/java/kr/timebar/diary/records/AttachmentController.java').match(/MAX_BYTES\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/)
  assert.ok(match, '첨부 MAX_BYTES를 찾지 못했습니다.')
  return Number(match[1]) * MiB
})()

test('첨부 최대 크기와 Spring 파일 한도가 같다', () => {
  assert.equal(attachment, springFile)
})

test('Spring 요청 한도는 최대 첨부에 multipart 여유를 더한 크기다', () => {
  assert.ok(springRequest > springFile, '요청 한도가 파일 한도보다 커야 multipart 경계와 필드를 받을 수 있습니다.')
})

test('Nginx는 Spring이 받는 요청을 먼저 거절하지 않는다', () => {
  assert.ok(proxy >= springRequest, `Nginx ${proxy / MiB}m가 Spring 요청 한도 ${springRequest / MiB}MB보다 작습니다.`)
})
