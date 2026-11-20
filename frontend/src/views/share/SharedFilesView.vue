<script setup>
import PageActions from '../../components/PageActions.vue'
import { computed, ref, watch } from 'vue'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { attachmentClient } from '../../features/attachments/attachments.js'
import {
  FILE_LIMIT_TEXT, RETENTION_PRESETS, fileError, formatBytes, toFileRow, mergeFiles, isExpired, daysLeft, expiryLabel, expiryDate, attachmentErrorText,
} from '../../features/attachments/attachmentClient.mjs'

/**
 * 공유 첨부. 내가 올린 파일과 내가 속한 그룹에 올라온 파일을 서버에서 불러온다(PR-10 5단계, UF-116).
 * 파일당 10 MiB 한도는 고르는 순간 확인하고, 넘으면 요청을 보내지 않는다(UT-198).
 */
const tab = ref('all')
const TABS = [
  { id: 'all', label: '전체' },
  { id: 'image', label: '이미지' },
  { id: 'expiring', label: '만료 임박' },
]

const files = ref([])
const groups = ref([])
const status = ref('idle')
const loadError = ref('')
async function load() {
  if (!session.userId) { files.value = []; groups.value = []; status.value = 'idle'; return }
  status.value = 'loading'
  loadError.value = ''
  try {
    const joined = (await shareClient.groups()).filter((g) => g.membership === 'ACTIVE')
    const lists = await Promise.all([attachmentClient.list(), ...joined.map((g) => attachmentClient.list(g.id))])
    const names = Object.fromEntries(joined.map((g) => [g.id, g.title]))
    groups.value = joined
    files.value = mergeFiles(lists).map((row) => toFileRow(row, { me: session.userId, groups: names }))
    status.value = 'ready'
  } catch (e) {
    loadError.value = attachmentErrorText(e)
    status.value = 'error'
  }
}
watch(() => session.userId, load, { immediate: true })

const images = computed(() => files.value.filter((f) => f.kind === 'image'))
const expiringSoon = computed(() => files.value.filter((f) => { const d = daysLeft(f); return d !== null && d >= 0 && d <= 7 }))
const myExpired = computed(() => files.value.filter((f) => f.mine && isExpired(f)))
const mine = computed(() => files.value.filter((f) => f.mine && !isExpired(f)))
const totalBytes = computed(() => files.value.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0))

const query = ref('')
const filters = ref({ source: '전체', state: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'source',
    all: '전체',
    options: [
      { value: '전체', label: '출처 전체' },
      ...[...new Set(files.value.map((f) => f.sourceKind))].map((s) => ({ value: s, label: s })),
    ],
  },
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '모든 상태' },
      { value: '유효', label: '내려받기 가능' },
      { value: '만료', label: '만료됨' },
    ],
  },
])
const base = computed(() => {
  if (tab.value === 'image') return images.value
  if (tab.value === 'expiring') return expiringSoon.value
  return files.value
})
const visible = computed(() => {
  const k = query.value.trim()
  return base.value.filter((f) => {
    if (filters.value.source !== '전체' && f.sourceKind !== filters.value.source) return false
    if (filters.value.state === '유효' && isExpired(f)) return false
    if (filters.value.state === '만료' && !isExpired(f)) return false
    if (k && !f.name.includes(k) && !f.from.includes(k) && !f.source.includes(k)) return false
    return true
  })
})

const notice = ref('')
const actionError = ref('')
const busy = ref('')
function flash(text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 3000)
}
/** 서버 요청을 하나씩 처리한다. 실패하면 문구를 보이고, 없어진 파일이면 목록을 다시 부른다. */
async function act(key, task) {
  if (busy.value) return false
  busy.value = key
  actionError.value = ''
  try { await task(); return true } catch (e) {
    actionError.value = attachmentErrorText(e)
    if (e?.status === 404) await load()
    return false
  } finally { busy.value = '' }
}
async function onDownload(file) {
  await act('download:' + file.id, async () => {
    const blob = await attachmentClient.download(file)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    flash('‘' + file.name + '’을 내려받았어요.')
  })
}
async function onRemove(file) {
  if (!window.confirm('‘' + file.name + '’을 삭제할까요? 공유받은 사람도 더 이상 볼 수 없어요.')) return
  if (await act('remove:' + file.id, () => attachmentClient.remove(file))) {
    files.value = files.value.filter((f) => f.id !== file.id)
    if (preview.value?.id === file.id) preview.value = null
    flash('‘' + file.name + '’을 삭제했어요.')
  }
}
async function onPurge() {
  if (!window.confirm('기간이 지난 내 파일을 모두 정리할까요?')) return
  let deleted = 0
  if (await act('purge', async () => { deleted = (await attachmentClient.purgeExpired())?.deleted ?? 0 })) {
    await load()
    flash(deleted ? deleted + '개를 정리했어요.' : '정리할 파일이 없어요.')
  }
}

/* 올리기 */
const defaultRetentionDays = ref(30)
const uploading = ref(false)
const picked = ref(null)
const pickedError = ref('')
const uploadGroup = ref('')
const uploadDays = ref(30)
const uploadError = ref('')
function openUpload() {
  picked.value = null
  pickedError.value = ''
  uploadError.value = ''
  uploadGroup.value = ''
  uploadDays.value = defaultRetentionDays.value
  uploading.value = true
}
/** 고르는 순간 크기를 확인한다. 한도를 넘으면 올리기 버튼을 막고 서버에 보내지 않는다. */
function onPick(event) {
  const file = event.target.files?.[0] ?? null
  picked.value = file
  pickedError.value = file ? fileError(file) : ''
  uploadError.value = ''
}
const canUpload = computed(() => picked.value && !pickedError.value && busy.value !== 'upload')
async function upload() {
  if (!canUpload.value) return
  busy.value = 'upload'
  uploadError.value = ''
  try {
    await attachmentClient.upload(picked.value, { retentionDays: uploadDays.value, groupId: uploadGroup.value })
    uploading.value = false
    await load()
    flash('‘' + picked.value.name + '’을 올렸어요.')
  } catch (e) {
    uploadError.value = e?.local ? e.message : attachmentErrorText(e)
  } finally { busy.value = '' }
}

/* 다운로드 기간 설정. 내가 올린 파일만 바꿀 수 있다 */
const editing = ref(null)
const draftDays = ref(30)
function openRetention(file) {
  actionError.value = ''
  editing.value = file
  draftDays.value = daysLeft(file) === null ? 0 : Math.max(1, daysLeft(file))
}
const draftDaysError = computed(() => (Number.isInteger(draftDays.value) && draftDays.value >= 0 && draftDays.value <= 365 ? '' : '0~365일 사이로 입력해 주세요. 0은 무기한이에요.'))
async function applyRetention() {
  if (draftDaysError.value) return
  const file = editing.value
  if (await act('retention', () => attachmentClient.setRetention(file, draftDays.value))) {
    editing.value = null
    await load()
    flash('‘' + file.name + '’의 다운로드 기간을 바꿨어요.')
  }
}
const showBulk = ref(false)
const bulkDays = ref(30)
async function applyBulk() {
  const targets = mine.value
  if (await act('bulk', async () => { for (const f of targets) await attachmentClient.setRetention(f, bulkDays.value) })) {
    defaultRetentionDays.value = bulkDays.value
    showBulk.value = false
    await load()
    flash('내 파일 ' + targets.length + '개의 다운로드 기간을 다시 설정했어요.')
  } else await load()
}

/* 미리보기 */
const preview = ref(null)
function kindIcon(kind) {
  return kind === 'image' ? '▣' : kind === 'video' ? '▶' : '▤'
}
const extension = (name) => (name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE')
</script>

<template>
  <div class="page-tools">
    <HelpPopover
      title="공유 첨부 사용법"
      summary="내가 올린 파일과 내가 속한 캘린더 그룹에 올라온 파일을 한곳에서 확인하고, 내 파일마다 내려받을 수 있는 기간을 정하는 화면이에요."
      :steps="[
        '‘파일 올리기’로 파일을 올리고, 나만 볼지 그룹과 나눌지 골라요. 파일당 10 MiB까지 올릴 수 있어요.',
        '‘기간’으로 내 파일을 언제까지 내려받을 수 있는지 정해요.',
        '만료 임박 탭에서 곧 받을 수 없게 될 파일을 먼저 챙겨요.',
        '‘만료 파일 정리’로 기간이 지난 내 파일을 한 번에 지워요.',
      ]"
      :terms="[
        { term: '다운로드 기간', desc: '파일을 내려받을 수 있는 마지막 날이에요. 지나면 목록에는 남지만 받을 수 없어요.' },
        { term: '무기한', desc: '기간 제한 없이 계속 내려받을 수 있는 상태예요.' },
        { term: '만료 임박', desc: '7일 안에 기간이 끝나는 파일이에요.' },
      ]"
      :tips="['기간을 바꿔도 이미 내려받은 파일은 회수되지 않아요.', '다른 사람이 올린 파일의 기간과 삭제는 올린 사람만 바꿀 수 있어요.']"
    />
    <span></span>
    <template v-if="session.userId">
      <button class="review" style="margin: 0" :disabled="!mine.length || !!busy" @click="showBulk = true">일괄 기간 설정</button>
      <button class="review" style="margin: 0" :disabled="!!busy" @click="onPurge">만료 파일 정리{{ myExpired.length ? ' (' + myExpired.length + ')' : '' }}</button>
      <PageActions><button class="primary" @click="openUpload">파일 올리기</button></PageActions>
    </template>
  </div>

  <ShareSignIn v-if="!session.userId" message="공유 첨부는 로그인한 계정에서만 쓸 수 있어요. 로그인하면 파일을 올리고 그룹과 나눌 수 있어요." />
  <p v-else-if="status === 'loading' && !files.length" class="input-field-help" role="status">파일을 불러오는 중이에요.</p>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ loadError }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  </section>
  <template v-else>
    <p class="input-field-help files-limit">{{ FILE_LIMIT_TEXT }} 기본 다운로드 기간은 {{ defaultRetentionDays ? defaultRetentionDays + '일' : '무기한' }}이에요.</p>

    <div class="metrics" style="--metric-cols: 4; margin-bottom: 16px">
      <article><span>전체 파일</span><b class="figure">{{ files.length }}<small>개</small></b></article>
      <article><span>이미지</span><b class="figure">{{ images.length }}<small>개</small></b></article>
      <article><span>만료 임박</span><b class="figure">{{ expiringSoon.length }}<small>개</small></b><small>7일 이내</small></article>
      <article><span>총 용량</span><b class="figure" style="font-size: 1.125rem">{{ formatBytes(totalBytes) }}</b></article>
    </div>

    <div class="tabs" style="width: fit-content; margin-bottom: 14px">
      <button v-for="t in TABS" :key="t.id" :class="{ selected: tab === t.id }" :aria-pressed="tab === t.id" @click="tab = t.id">{{ t.label }}</button>
    </div>

    <ListFilterBar
      v-model:query="query"
      v-model:filters="filters"
      :groups="FILTER_GROUPS"
      placeholder="파일명·올린 사람·출처 검색"
      :result-count="visible.length"
      :total-count="base.length"
    />

    <p v-if="notice" class="badge ok" style="display: inline-block; margin-bottom: 12px" role="status">{{ notice }}</p>
    <p v-if="actionError && !editing && !showBulk" class="input-field-help files-message" data-state="error" role="alert">{{ actionError }}</p>

    <!-- 이미지 모아 보기 -->
    <div v-if="tab === 'image'" class="file-gallery">
      <button v-for="f in visible" :key="f.id" class="file-thumb" :class="{ expired: isExpired(f) }" @click="preview = f">
        <span class="file-thumb-img">
          <em>{{ kindIcon(f.kind) }}</em>
          <small>{{ extension(f.name) }}</small>
        </span>
        <b>{{ f.name }}</b>
        <small>{{ f.from }} · {{ expiryLabel(f) }}</small>
      </button>
      <p v-if="!visible.length" class="empty-state" role="status">{{ files.length ? '조건에 맞는 이미지가 없어요. 검색어나 필터를 바꿔 보세요.' : '아직 올라온 이미지가 없어요. 파일 올리기로 사진을 나눠 보세요.' }}</p>
    </div>

    <!-- 목록 -->
    <section v-else class="card list">
      <div class="list-head file-grid">
        <span>파일</span><span>출처</span><span>올린 사람</span><span>크기</span><span>다운로드 기간</span><span>관리</span>
      </div>
      <div class="row file-grid" v-for="f in visible" :key="f.id" :class="{ 'file-expired': isExpired(f) }">
        <label><span class="file-icon">{{ kindIcon(f.kind) }}</span>{{ f.name }}</label>
        <span><span class="tag">{{ f.sourceKind }}</span><small style="display: block; color: var(--color-muted)">{{ f.source }}</small></span>
        <span>{{ f.from }}</span>
        <span class="figure">{{ formatBytes(f.sizeBytes) }}</span>
        <span>
          <b class="figure" :class="{ 'sla-over': isExpired(f) }">{{ expiryLabel(f) }}</b>
          <small v-if="f.expiresAt" style="display: block; color: var(--color-muted)">{{ expiryDate(f) }}까지</small>
        </span>
        <span style="display: flex; gap: 6px">
          <button class="review" style="margin: 0" :disabled="isExpired(f) || !!busy" :aria-busy="busy === 'download:' + f.id ? 'true' : undefined" @click="onDownload(f)">{{ busy === 'download:' + f.id ? '받는 중' : '받기' }}</button>
          <template v-if="f.mine">
            <button class="review" style="margin: 0" :disabled="isExpired(f) || !!busy" @click="openRetention(f)">기간</button>
            <button class="review" style="margin: 0" :disabled="!!busy" @click="onRemove(f)">삭제</button>
          </template>
        </span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ files.length ? '조건에 맞는 파일이 없어요. 검색어나 필터를 바꿔 보세요.' : '아직 올라온 파일이 없어요. 파일 올리기로 첫 파일을 나눠 보세요.' }}</p>
    </section>
  </template>

  <!-- 파일 올리기 -->
  <Modal v-if="uploading" title="파일 올리기" @close="uploading = false">
    <label>파일
      <input type="file" aria-describedby="file-limit-help" :aria-invalid="pickedError ? 'true' : undefined" @change="onPick" />
    </label>
    <p id="file-limit-help" class="input-field-help" :data-state="pickedError ? 'error' : undefined" :role="pickedError ? 'alert' : undefined">{{ pickedError || FILE_LIMIT_TEXT }}</p>
    <p v-if="picked && !pickedError" class="form-note">{{ picked.name }} · <span class="figure">{{ formatBytes(picked.size) }}</span></p>
    <label>누구와 나눌까요?
      <select v-model="uploadGroup">
        <option value="">나만 보기</option>
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.title }} 그룹</option>
      </select>
    </label>
    <p class="form-note">다운로드 기간</p>
    <div class="filter" style="width: fit-content; margin: 8px 0">
      <button v-for="p in RETENTION_PRESETS" :key="p.days" type="button" :class="{ selected: uploadDays === p.days }" :aria-pressed="uploadDays === p.days" @click="uploadDays = p.days">{{ p.label }}</button>
    </div>
    <p v-if="uploadError" class="input-field-help" data-state="error" role="alert">{{ uploadError }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="uploading = false">취소</button>
      <button class="primary" :disabled="!canUpload" :aria-busy="busy === 'upload' ? 'true' : undefined" @click="upload">{{ busy === 'upload' ? '올리는 중' : '올리기' }}</button>
    </template>
  </Modal>

  <!-- 미리보기 -->
  <Modal v-if="preview" :title="preview.name" wide @close="preview = null">
    <div class="file-preview">
      <em>{{ kindIcon(preview.kind) }}</em>
      <small>{{ preview.name }}</small>
    </div>
    <div class="profile-rows">
      <div><span>출처</span><b>{{ preview.sourceKind }} · {{ preview.source }}</b></div>
      <div><span>올린 사람</span><b>{{ preview.from }}</b></div>
      <div><span>올린 날짜</span><b class="figure">{{ preview.at }}</b></div>
      <div><span>크기</span><b class="figure">{{ formatBytes(preview.sizeBytes) }}</b></div>
      <div><span>기간</span><b :class="{ 'sla-over': isExpired(preview) }">{{ expiryLabel(preview) }}</b></div>
    </div>

    <template #footer>
      <button type="button" class="modal-secondary" @click="preview = null">닫기</button>
      <div class="form-row">
        <button class="primary" style="flex: 1" :disabled="isExpired(preview) || !!busy" @click="onDownload(preview)">내려받기</button>
        <button v-if="preview.mine" class="review" style="margin: 0" :disabled="isExpired(preview) || !!busy" @click="openRetention(preview)">기간 설정</button>
      </div>
    </template>
  </Modal>

  <!-- 개별 기간 설정 -->
  <Modal v-if="editing" title="다운로드 기간 설정" @close="editing = null">
    <p class="form-note" style="margin-top: 0">‘{{ editing.name }}’을 언제까지 내려받을 수 있게 할까요?</p>
    <div class="filter" style="width: fit-content; margin: 8px 0">
      <button v-for="p in RETENTION_PRESETS" :key="p.days" type="button" :class="{ selected: draftDays === p.days }" :aria-pressed="draftDays === p.days" @click="draftDays = p.days">{{ p.label }}</button>
    </div>
    <label>직접 입력(일)<input type="number" min="0" max="365" v-model.number="draftDays" aria-describedby="retention-help" :aria-invalid="draftDaysError ? 'true' : undefined" /></label>
    <p id="retention-help" class="input-field-help" :data-state="draftDaysError ? 'error' : undefined">{{ draftDaysError || (draftDays ? '오늘부터 ' + draftDays + '일 뒤까지 내려받을 수 있어요.' : '기간 제한 없이 계속 내려받을 수 있어요.') }}</p>
    <p v-if="actionError" class="input-field-help" data-state="error" role="alert">{{ actionError }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button class="primary" :disabled="!!draftDaysError || busy === 'retention'" :aria-busy="busy === 'retention' ? 'true' : undefined" @click="applyRetention">{{ busy === 'retention' ? '저장하는 중' : '적용하기' }}</button>
    </template>
  </Modal>

  <!-- 일괄 기간 설정 -->
  <Modal v-if="showBulk" title="일괄 다운로드 기간 설정" @close="showBulk = false">
    <p class="form-note" style="margin-top: 0">내가 올린 파일 중 아직 받을 수 있는 파일의 기간을 한 번에 다시 설정해요. 이 화면에서 새로 올리는 파일의 기본값으로도 씁니다.</p>
    <div class="filter" style="width: fit-content; margin: 8px 0">
      <button v-for="p in RETENTION_PRESETS" :key="p.days" type="button" :class="{ selected: bulkDays === p.days }" :aria-pressed="bulkDays === p.days" @click="bulkDays = p.days">{{ p.label }}</button>
    </div>
    <p v-if="actionError" class="input-field-help" data-state="error" role="alert">{{ actionError }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showBulk = false">취소</button>
      <button class="primary" :disabled="busy === 'bulk'" :aria-busy="busy === 'bulk' ? 'true' : undefined" @click="applyBulk">{{ busy === 'bulk' ? '저장하는 중' : '내 파일 ' + mine.length + '개에 적용' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.files-limit { margin: 0 0 var(--space-lg); }
.files-message { margin: 0 0 var(--space-lg); }
</style>
