// 서버 기록의 조회·생성·수정·삭제·상태 명령을 한곳에서 처리하고, 응답의 version을 다음 요청에 그대로 보낸다(PR-07, UF-80).

/** 실패를 화면이 다르게 다룰 종류로 나눈다. 409는 다른 곳에서 바뀜, 400은 입력 확인, 상태 코드가 없으면 연결 실패다. */
export function errorKind(error) {
  const status = error?.status
  if (status === 409) return 'conflict'
  if (status === 400) return 'invalid'
  if (status === 404) return 'notFound'
  if (status == null || status === 0) return 'network'
  return 'server'
}

/**
 * request는 features/auth/apiRequest.js처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다.
 * 기록 API 규칙은 PUT 본문 version, DELETE·상태 명령 ?version=이다. 생성 요청에는 version을 보내지 않는다.
 * 생성에 idempotencyKey를 주면 Idempotency-Key 헤더로 보내, 같은 키로 다시 보내도 서버가 처음 만든 기록을 돌려준다(Q-13).
 */
export function createRecordClient({ request, path }) {
  const item = (id) => `${path}/${encodeURIComponent(id)}`
  const versioned = (url, record) => `${url}?version=${encodeURIComponent(record.version)}`
  async function call(run, id) {
    try {
      return await run()
    } catch (error) {
      error.kind = errorKind(error)
      // 충돌이면 비교 화면에 쓸 최신 서버 값을 함께 준다. 자동으로 덮어쓰지 않는다(UF-84)
      if (error.kind === 'conflict' && id != null) {
        try { error.latest = await request(item(id)) } catch { error.latest = null }
      }
      throw error
    }
  }
  return {
    list: () => call(() => request(path)),
    get: (id) => call(() => request(item(id))),
    create: ({ version, ...body }, { idempotencyKey } = {}) => call(() => request(path, { method: 'POST', body: JSON.stringify(body), ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}) })),
    update: (record, body) => call(() => request(item(record.id), { method: 'PUT', body: JSON.stringify({ ...body, version: record.version }) }), record.id),
    remove: (record) => call(() => request(versioned(item(record.id), record), { method: 'DELETE' }), record.id),
    command: (record, action, method = 'PATCH') => call(() => request(versioned(`${item(record.id)}/${action}`, record), { method }), record.id),
  }
}
