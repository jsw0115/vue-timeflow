<script setup>
import { computed, reactive, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import EventDateFields from './EventDateFields.vue'
import TagMentionInput from './TagMentionInput.vue'
import { composer, composerKind, composerSeed, events, tasks } from '../store/appState'
import { diaries, memos } from '../store/writing'
import { localDate, rangeError } from '../utils/postValidation.mjs'
const router = useRouter()
const kinds = ['일정', '할 일', '다이어리', '메모']
const kind = ref(kinds.includes(composerKind.value) ? composerKind.value : '일정')
const tabsId = useId()
const makeDraft = () => ({ title: '', body: '', category: '개인', date: localDate(), startDate: localDate(), endDate: localDate(), startTime: '09:00', endTime: '10:00', priority: '보통', mood: '평온' })
const drafts = reactive(Object.fromEntries(kinds.map(k => [k, makeDraft()])))
drafts[kind.value].title = composerSeed.value
const draft = computed(() => drafts[kind.value])
const error = computed(() => {
  if (!draft.value.title.trim()) return '제목을 입력해주세요.'
  if (kind.value === '일정') return rangeError(draft.value.startDate, draft.value.startTime, draft.value.endDate, draft.value.endTime)
  if (kind.value === '다이어리' && !draft.value.date) return '기록 날짜를 입력해주세요.'
  return ''
})
function selectTab(event) {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!offset && !['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? kinds.length - 1 : (kinds.indexOf(kind.value) + offset + kinds.length) % kinds.length
  kind.value = kinds[next]
  document.getElementById(tabsId + '-tab-' + next)?.focus()
}
function save() {
  if (error.value) return
  const data = { ...draft.value, title: draft.value.title.trim(), body: draft.value.body.trim() }
  const list = { '일정': events, '할 일': tasks, '다이어리': diaries, '메모': memos }[kind.value]
  const id = Math.max(0, ...list.value.map(item => item.id)) + 1
  if (kind.value === '일정') Object.assign(data, { date: data.startDate + ' ' + data.startTime, time: data.startTime, tag: data.category, state: '예정', color: '#2f5d46', attendeeIds: [] })
  if (kind.value === '할 일') data.done = false
  if (kind.value === '메모') Object.assign(data, { time: localDate(), color: '', actionable: false })
  list.value.unshift({ id, ...data })
  composer.value = false
  if (kind.value === '다이어리') { router.push({ path: '/diary', query: { month: data.date.slice(0, 7) } }); return }
  router.push({ '일정': '/events', '할 일': '/tasks', '다이어리': '/diary', '메모': '/memos' }[kind.value])
}
</script>
<template>
  <Modal title="새 글 작성" wide @close="composer = false">
    <div class="compose-tabs" role="tablist" aria-label="글 종류" @keydown="selectTab">
      <button v-for="(tab, i) in kinds" :id="tabsId + '-tab-' + i" :key="tab" type="button" role="tab"
        :aria-selected="kind === tab" :aria-controls="tabsId + '-panel'" :tabindex="kind === tab ? 0 : -1"
        :class="{ selected: kind === tab }" @click="kind = tab">{{ tab }}</button>
    </div>
    <form :id="tabsId + '-panel'" role="tabpanel" :aria-labelledby="tabsId + '-tab-' + kinds.indexOf(kind)" @submit.prevent="save">
      <label>제목<input v-model="draft.title" required maxlength="200" placeholder="무엇을 남기고 싶으세요?" /></label>
      <EventDateFields v-if="kind === '일정'" :draft="draft" />
      <div v-if="kind === '할 일' || kind === '다이어리'" class="form-row">
        <label>{{ kind === '할 일' ? '마감일 (선택)' : '기록 날짜' }}<input v-model="draft.date" type="date" :required="kind === '다이어리'" /></label>
        <label v-if="kind === '할 일'">우선순위<select v-model="draft.priority"><option>높음</option><option>보통</option><option>낮음</option></select></label>
        <label v-else>기분<select v-model="draft.mood"><option>좋음</option><option>평온</option><option>피곤</option><option>속상함</option><option>뿌듯함</option></select></label>
      </div>
      <label v-if="kind === '일정' || kind === '할 일'">분류<select v-model="draft.category"><option>개인</option><option>업무</option><option>공부</option><option>건강</option><option>휴식</option></select></label>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
      <p class="form-note">이 브라우저에 저장되는 로컬 시연입니다. 멘션은 자동완성과 검색에 반영되며 상대방에게 전송되지 않습니다.</p>
      <p v-if="error" class="form-note" role="status">{{ error }}</p>
      <button type="submit" class="primary" :disabled="!!error">{{ kind }} 저장</button>
    </form>
  </Modal>
</template>
