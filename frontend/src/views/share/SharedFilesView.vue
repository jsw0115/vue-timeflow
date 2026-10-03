<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import PersonTag from '../../components/PersonTag.vue'
import {
  attachments, RETENTION_PRESETS, defaultRetentionDays, images, expiringSoon, expiredCount, totalSizeKb,
  isExpired, expiryLabel, daysLeft, formatSize, setRetention, applyRetentionToAll, download, removeAttachment, purgeExpired,
} from '../../store/attachments'

/** 공유 첨부 — 이미지만 따로 보는 갤러리 탭과 다운로드 기간 관리를 함께 제공한다. */
const tab = ref('all')
const TABS = [
  { id: 'all', label: '전체' },
  { id: 'image', label: '이미지' },
  { id: 'expiring', label: '만료 임박' },
]

const query = ref('')
const filters = ref({ source: '전체', state: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'source',
    all: '전체',
    options: [
      { value: '전체', label: '출처 전체' },
      ...[...new Set(attachments.value.map((f) => f.sourceKind))].map((s) => ({ value: s, label: s })),
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
  return attachments.value
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
function flash(text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 3000)
}
function onDownload(file) {
  const r = download(file)
  flash(r.ok ? '‘' + file.name + '’을 내려받았어요.' : r.reason)
}
function onRemove(file) {
  if (!window.confirm('‘' + file.name + '’을 삭제할까요? 공유받은 사람도 더 이상 볼 수 없어요.')) return
  removeAttachment(file.id)
}
function onPurge() {
  if (!window.confirm('기간이 지난 파일을 모두 정리할까요?')) return
  const n = purgeExpired()
  flash(n ? n + '개를 정리했어요.' : '정리할 파일이 없어요.')
}

/* 다운로드 기간 설정 */
const editing = ref(null)
const draftDays = ref(30)
function openRetention(file) {
  editing.value = file
  draftDays.value = daysLeft(file) === null ? 0 : Math.max(0, daysLeft(file))
}
function applyRetention() {
  setRetention(editing.value, draftDays.value)
  editing.value = null
}
const showBulk = ref(false)
const bulkDays = ref(30)
function applyBulk() {
  applyRetentionToAll(bulkDays.value)
  defaultRetentionDays.value = bulkDays.value
  showBulk.value = false
  flash('모든 파일의 다운로드 기간을 다시 설정했어요.')
}

/* 이미지 미리보기 */
const preview = ref(null)
function kindIcon(kind) {
  return kind === 'image' ? '▣' : kind === 'video' ? '▶' : '▤'
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">공유 첨부</b>
    <HelpPopover
      title="공유 첨부 사용법"
      summary="일정·커뮤니티·채팅에 올라온 파일을 한곳에서 확인하고, 파일마다 내려받을 수 있는 기간을 정하는 화면이에요."
      :steps="[
        '이미지 탭에서 사진만 모아 크게 볼 수 있어요.',
        '‘기간 설정’으로 파일마다 언제까지 내려받을 수 있는지 정해요.',
        '만료 임박 탭에서 곧 사라질 파일을 먼저 챙겨요.',
        '‘만료 파일 정리’로 기간이 지난 파일을 한 번에 지워요.',
      ]"
      :terms="[
        { term: '다운로드 기간', desc: '파일을 내려받을 수 있는 마지막 날이에요. 지나면 목록에는 남지만 받을 수 없어요.' },
        { term: '무기한', desc: '기간 제한 없이 계속 내려받을 수 있는 상태예요.' },
        { term: '만료 임박', desc: '7일 안에 기간이 끝나는 파일이에요.' },
      ]"
      :tips="['기간을 바꿔도 이미 내려받은 파일은 회수되지 않아요.']"
    />
    <span></span>
    <button class="review" style="margin: 0" @click="showBulk = true">일괄 기간 설정</button>
    <button class="review" style="margin: 0" @click="onPurge">만료 파일 정리{{ expiredCount ? ' (' + expiredCount + ')' : '' }}</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>전체 파일</span><b class="figure">{{ attachments.length }}<small>개</small></b></article>
    <article><span>이미지</span><b class="figure">{{ images.length }}<small>개</small></b></article>
    <article><span>만료 임박</span><b class="figure">{{ expiringSoon.length }}<small>개</small></b><small>7일 이내</small></article>
    <article><span>총 용량</span><b class="figure" style="font-size: 1.125rem">{{ formatSize(totalSizeKb) }}</b></article>
  </div>

  <div class="tabs" style="width: fit-content; margin-bottom: 14px">
    <button v-for="t in TABS" :key="t.id" :class="{ selected: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="파일명·올린 사람·출처 검색"
    :result-count="visible.length"
    :total-count="base.length"
  />

  <p v-if="notice" class="badge ok" style="display: inline-block; margin-bottom: 12px">{{ notice }}</p>

  <!-- 이미지 갤러리 -->
  <div v-if="tab === 'image'" class="file-gallery">
    <button v-for="f in visible" :key="f.id" class="file-thumb" :class="{ expired: isExpired(f) }" @click="preview = f">
      <span class="file-thumb-img" :style="{ '--seed': (f.id * 47) % 360 }">
        <em>{{ kindIcon(f.kind) }}</em>
        <small>{{ f.name.split('.').pop().toUpperCase() }}</small>
      </span>
      <b>{{ f.name }}</b>
      <small>{{ f.from }} · {{ expiryLabel(f) }}</small>
    </button>
    <p v-if="!visible.length" class="form-note">조건에 맞는 이미지가 없어요.</p>
  </div>

  <!-- 목록 -->
  <section v-else class="card list">
    <div class="list-head file-grid">
      <span>파일</span><span>출처</span><span>올린 사람</span><span>크기</span><span>다운로드 기간</span><span>관리</span>
    </div>
    <div class="row file-grid" v-for="f in visible" :key="f.id" :class="{ 'file-expired': isExpired(f) }">
      <label><span class="file-icon">{{ kindIcon(f.kind) }}</span>{{ f.name }}</label>
      <span><span class="tag">{{ f.sourceKind }}</span><small style="display: block; color: var(--color-muted)">{{ f.source }}</small></span>
      <span><PersonTag :name="f.from" /></span>
      <span class="figure">{{ formatSize(f.sizeKb) }}</span>
      <span>
        <b class="figure" :class="{ 'sla-over': isExpired(f) }">{{ expiryLabel(f) }}</b>
        <small v-if="f.expiresAt" style="display: block; color: var(--color-muted)">{{ f.expiresAt }}까지</small>
      </span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" :disabled="isExpired(f)" @click="onDownload(f)">받기</button>
        <button class="review" style="margin: 0" @click="openRetention(f)">기간</button>
        <button class="review" style="margin: 0" @click="onRemove(f)">삭제</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 파일이 없어요.</p>
  </section>

  <!-- 이미지 미리보기 -->
  <Modal v-if="preview" :title="preview.name" wide @close="preview = null">
    <div class="file-preview" :style="{ '--seed': (preview.id * 47) % 360 }">
      <em>{{ kindIcon(preview.kind) }}</em>
      <small>{{ preview.name }}</small>
    </div>
    <div class="profile-rows">
      <div><span>출처</span><b>{{ preview.sourceKind }} · {{ preview.source }}</b></div>
      <div><span>올린 사람</span><b><PersonTag :name="preview.from" /></b></div>
      <div><span>올린 날짜</span><b class="figure">{{ preview.at }}</b></div>
      <div><span>크기</span><b class="figure">{{ formatSize(preview.sizeKb) }}</b></div>
      <div><span>다운로드</span><b class="figure">{{ preview.downloads }}회</b></div>
      <div><span>기간</span><b :class="{ 'sla-over': isExpired(preview) }">{{ expiryLabel(preview) }}</b></div>
    </div>

    <template #footer>
      <button type="button" class="modal-secondary" @click="preview = null">취소</button>
      <div class="form-row">
      <button class="primary" style="flex: 1" :disabled="isExpired(preview)" @click="onDownload(preview)">내려받기</button>
      <button class="review" style="margin: 0" @click="openRetention(preview)">기간 설정</button>
          </div>
    </template>
  </Modal>

  <!-- 개별 기간 설정 -->
  <Modal v-if="editing" title="다운로드 기간 설정" @close="editing = null">
    <p class="form-note" style="margin-top: 0">‘{{ editing.name }}’을 언제까지 내려받을 수 있게 할까요?</p>
    <div class="filter" style="width: fit-content; margin: 8px 0">
      <button v-for="p in RETENTION_PRESETS" :key="p.days" type="button" :class="{ selected: draftDays === p.days }" @click="draftDays = p.days">{{ p.label }}</button>
    </div>
    <label>직접 입력(일)<input type="number" min="0" max="365" v-model.number="draftDays" /></label>
    <p class="form-note">{{ draftDays ? '오늘부터 ' + draftDays + '일 뒤까지 내려받을 수 있어요.' : '기간 제한 없이 계속 내려받을 수 있어요.' }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button class="primary" @click="applyRetention">적용하기</button>
    </template>
  </Modal>

  <!-- 일괄 기간 설정 -->
  <Modal v-if="showBulk" title="일괄 다운로드 기간 설정" @close="showBulk = false">
    <p class="form-note" style="margin-top: 0">모든 공유 첨부의 기간을 한 번에 다시 설정해요. 앞으로 올라오는 파일의 기본값으로도 저장됩니다.</p>
    <div class="filter" style="width: fit-content; margin: 8px 0">
      <button v-for="p in RETENTION_PRESETS" :key="p.days" type="button" :class="{ selected: bulkDays === p.days }" @click="bulkDays = p.days">{{ p.label }}</button>
    </div>
    <p class="form-note">현재 기본값: {{ defaultRetentionDays ? defaultRetentionDays + '일' : '무기한' }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showBulk = false">취소</button>
      <button class="primary" @click="applyBulk">{{ attachments.length }}개 파일에 적용</button>
    </template>
  </Modal>
</template>
