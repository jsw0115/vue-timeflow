<!-- 지원 범위가 명시된 수동 백업 다운로드와 미리보기 기반 병합 복원을 제공한다. -->
<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { createBackupClient } from '../../features/backup/backupClient.mjs'

const client = createBackupClient(apiRequest)
const status = ref(null), selectedFile = ref(null), preview = ref(null), busy = ref(false), error = ref(''), message = ref(''), fileInput = ref(null)
const creates = computed(() => preview.value?.items.filter(item => item.action === 'CREATE').length || 0)
const skips = computed(() => preview.value?.items.filter(item => item.action === 'SKIP').length || 0)
let generation = 0
async function run(action) {
  if (busy.value || !session.userId) return
  const expected = generation
  busy.value = true; error.value = ''; message.value = ''
  try { await action(() => expected === generation) }
  catch (e) { if (expected === generation) error.value = e.message }
  finally { if (expected === generation) busy.value = false }
}
async function load() {
  await run(async current => { const value = await client.status(); if (current()) status.value = value })
}
watch(() => session.userId, () => {
  generation++; busy.value = false; status.value = null; selectedFile.value = null; preview.value = null; message.value = ''; error.value = ''
  if (fileInput.value) fileInput.value.value = ''
  if (session.userId) load()
  else error.value = '로그인 후 서버에 저장된 기록을 백업할 수 있습니다.'
}, { immediate: true })
onBeforeUnmount(() => { generation++ })
async function download() {
  await run(async current => {
    const backup = await client.download()
    if (!current()) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `timebar-backup-${backup.exportedAt.slice(0, 10)}.json`
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    message.value = '다운로드를 요청했습니다. 저장된 파일을 확인하고 안전한 위치에 보관해주세요.'
    const value = await client.status(); if (current()) status.value = value
  })
}
function choose(event) { selectedFile.value = event.target.files?.[0] || null; preview.value = null; error.value = ''; message.value = '' }
async function inspect() {
  await run(async current => { preview.value = null; const value = await client.preview(selectedFile.value); if (current()) preview.value = value })
}
async function restore() {
  if (!preview.value || !selectedFile.value) return
  const file = selectedFile.value, id = preview.value.id
  await run(async current => {
    const result = await client.restore(file, id)
    if (!current()) return
    preview.value = result; message.value = '서버 복원이 완료됐습니다. 기존 기록은 보존했습니다. 서버 조회를 지원하는 화면에서 확인할 수 있습니다.'
    const value = await client.status(); if (current()) status.value = value
  })
}
</script>

<template>
  <section class="card setting-content" :aria-busy="busy">
    <h2>수동 백업과 복원</h2>
    <p>서버에 저장된 일기·메모·디데이·가계부·회고·완료한 집중/실제 기록과 개인 첨부를 JSON 파일로 보관합니다.</p>
    <p>최대 기록 500개, 첨부 50개·합계 5 MiB, 백업 JSON 8 MiB입니다. 한도를 넘으면 일부 자료를 누락한 파일을 만들지 않습니다.</p>
    <details><summary>포함되지 않는 자료 확인</summary><ul><li>브라우저 로컬·시연 자료와 진행 중인 기록.</li><li>일정·할 일·루틴·기존 플래너 항목·업무·경력·소셜·채팅 자료.</li><li>프로필·설정·토큰·비밀키·공유 권한과 공유 그룹·만료 첨부.</li></ul></details>
    <p>자동 백업은 제공하지 않습니다. 백업 생성 시각은 서버에서 파일을 만든 시각이며 기기에 저장됐다는 확인은 아닙니다.</p>
    <div class="trow"><b>마지막 파일 생성</b><span>{{ status?.lastExport?.finishedAt ? new Date(status.lastExport.finishedAt).toLocaleString('ko-KR') : '확인된 기록 없음' }}</span></div>
    <div class="trow"><b>마지막 복원 완료</b><span>{{ status?.lastRestore?.finishedAt ? new Date(status.lastRestore.finishedAt).toLocaleString('ko-KR') : '확인된 기록 없음' }}</span></div>
    <button type="button" class="primary" :disabled="busy || !session.userId" @click="download">JSON 백업 다운로드</button>
    <button type="button" class="review" :disabled="busy || !session.userId" @click="load">처리 이력 다시 확인</button>
    <h3>파일 확인 후 병합 복원</h3>
    <label for="backup-file">복원할 JSON 백업 파일</label>
    <input id="backup-file" ref="fileInput" type="file" accept=".json,application/json" :disabled="busy" @change="choose" />
    <button type="button" class="review" :disabled="busy || !selectedFile || !session.userId" @click="inspect">복원 미리보기</button>
    <p v-if="busy" role="status">서버에서 확인하고 있습니다.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <section v-if="preview" class="review" aria-label="복원 미리보기">
      <h3>{{ preview.state === 'COMPLETED' ? '이미 완료한 복원 결과' : '복원 예정 내용' }}</h3>
      <p>새로 생성 {{ creates }}개 · 기존 자료 보존 {{ skips }}개. 새 ID와 현재 계정 소유권을 사용하며 공유 권한은 복원하지 않습니다.</p>
      <ul><li v-for="item in preview.items" :key="item.kind + ':' + item.sourceId"><b>{{ item.title }}</b> · {{ item.kind }} · {{ item.action === 'SKIP' ? '건너뛰기' : '새로 생성' }}<p>{{ item.reason }}</p></li></ul>
      <button type="button" class="primary" :disabled="busy || preview.state === 'COMPLETED'" @click="restore">확인한 내용으로 병합 복원</button>
      <p>연결이 끊기면 같은 파일과 미리보기로 다시 시도할 수 있습니다. 완료한 작업은 중복 실행하지 않습니다.</p>
    </section>
  </section>
</template>
