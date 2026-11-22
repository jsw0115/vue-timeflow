<script setup>
import AppIcon from '../../components/icons/AppIcon.vue'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findDday, togglePin, updateDday, removeDday, ddayStore, ddayNotice } from '../../store/ddays'
import { createSaveState } from '../../features/records/saveState.mjs'
import TagMentionInput from '../../components/TagMentionInput.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import StorageNote from '../../components/StorageNote.vue'

const route = useRoute()
const router = useRouter()
const item = computed(() => findDday(route.params.id))

const ddayMode = ddayStore.mode
const draft = ref({ title: '', category: '개인', date: '', body: '' })
// 연 때의 D-Day. 저장은 이 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84). 목록을 다시 불러와도 입력을 지우지 않는다
const base = ref(null)
const saving = createSaveState({ fields: { title: ['title', '제목'], date: ['date', '날짜'] } })
const removing = createSaveState()
const conflict = ref(null)
watchEffect(() => {
  if (!item.value || base.value?.id === item.value.id) return
  base.value = { ...item.value }
  draft.value = { title: item.value.title, category: item.value.category, date: '', body: item.value.body || '' }
})

async function save() {
  if (!item.value || !draft.value.title.trim()) return
  conflict.value = null
  const result = await saving.run(() => updateDday(item.value.id, { title: draft.value.title.trim(), category: draft.value.category, date: draft.value.date, body: draft.value.body }, base.value))
  if (result.ok) { base.value = { ...result.value }; return }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? base.value) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = draft.value
  return [
    { label: '제목', mine: mine.title.trim(), latest: latest.title },
    { label: '날짜', mine: mine.date || base.value?.date || '', latest: latest.date },
    { label: '카테고리', mine: mine.category, latest: latest.category },
    { label: '내용', mine: mine.body, latest: latest.body ?? '' },
  ]
})
function keepMine() {
  base.value = { ...conflict.value.latest }
  conflict.value = null
  save()
}
function useLatest() {
  const latest = conflict.value.latest
  base.value = { ...latest }
  conflict.value = null
  saving.reset()
  draft.value = { title: latest.title, category: latest.category, date: '', body: latest.body || '' }
}
// 고정도 연 때의 version으로 보내고, 내 변경이면 기준 version을 따라 올린다(이어서 저장할 때 내 변경과 충돌하지 않게)
async function pin() {
  if (!item.value) return
  const saved = await togglePin({ ...item.value, version: base.value?.version ?? item.value.version })
  if (saved && base.value) base.value = { ...base.value, version: saved.version, pinned: saved.pinned }
}
const removeMessage = computed(() => (removing.state.status === 'failed' || removing.state.status === 'conflict') ? (removing.state.error?.kind === 'conflict' ? '다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.' : removing.state.message.replace('저장하지', '삭제하지')) : '')
async function remove() {
  if (!item.value) return
  const result = await removing.run(() => removeDday(item.value.id, base.value))
  if (result.ok || result.error?.kind === 'notFound') router.push('/dday')
}
</script>

<template>
  <div class="crumbs"><a @click="router.push('/dday')">D-Day</a> / 상세</div>
  <section v-if="item" class="card" style="max-width: 480px; margin: 0 auto">
    <div class="head">
      <div>
        <span class="badge brand">{{ item.category }}</span>
        <h2 style="margin: 10px 0 4px">{{ item.title }}</h2>
        <p>{{ item.date }}</p>
      </div>
      <button class="icon" :class="{ pinned: item.pinned }" :title="item.pinned ? '고정 해제' : '고정하기'" :aria-label="item.pinned ? '고정 해제' : '고정하기'" :aria-pressed="item.pinned ? 'true' : 'false'" @click="pin"><AppIcon name="star" :size="18" :class="{ filled: item.pinned }" /></button>
    </div>
    <b class="dday-num" style="display: block; margin: 12px 0">{{ item.dday }}</b>
    <p v-if="ddayNotice.message" class="input-field-help" data-state="error" role="status">{{ ddayNotice.message }}</p>
    <StorageNote :mode="ddayMode" />

    <div style="margin-top: 10px; padding-top: 20px; border-top: 1px solid var(--color-hairline)">
      <label>제목<input v-model="draft.title" /></label>
      <label>날짜 변경<input v-model="draft.date" type="date" /></label>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
      <label>카테고리<select v-model="draft.category"><option>개인</option><option>업무</option><option>가족</option><option>건강</option><option>공부</option></select></label>
      <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
      <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
      <SaveStatus :state="saving.state" :mode="ddayMode" @retry="save" />
      <button class="primary" style="width: 100%; margin-top: 16px" :disabled="!!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? '저장하는 중' : '저장하기' }}</button>
      <button style="width: 100%; margin-top: 8px; color: var(--color-status-danger); font-weight: 600; padding: 10px" :aria-busy="removing.state.status === 'saving' ? 'true' : undefined" @click="remove">{{ removing.state.status === 'saving' ? '삭제하는 중' : '삭제하기' }}</button>
      <p v-if="removeMessage" class="input-field-help" data-state="error" role="status">{{ removeMessage }}</p>
    </div>
  </section>
  <p v-else>D-Day 항목을 찾을 수 없어요. <a @click="router.push('/dday')" style="color: var(--color-accent); font-weight: 600; cursor: pointer">목록으로 돌아가기</a></p>
</template>
