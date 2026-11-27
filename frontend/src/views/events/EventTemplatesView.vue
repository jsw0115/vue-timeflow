<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import PageActions from '../../components/PageActions.vue'

/** 일정 템플릿 — 자주 쓰는 일정을 저장했다가 새 일정으로 바로 만든다. */
const router = useRouter()
const COLORS = ['mint', 'purple', 'blue', 'amber']

const templates = ref([
  { id: 1, title: '주간 팀 회의', color: 'purple', category: '업무', duration: 60, repeat: '매주 월 09:00', alarm: 10, uses: 24 },
  { id: 2, title: '병원 정기 검진', color: 'mint', category: '건강', duration: 30, repeat: '반복 없음', alarm: 1440, uses: 3 },
  { id: 3, title: '친구 모임', color: 'amber', category: '개인', duration: 120, repeat: '반복 없음', alarm: 60, uses: 7 },
])

const query = ref('')
const filters = ref({ category: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'category',
    all: '전체',
    options: [{ value: '전체', label: '분류 전체' }, ...[...new Set(templates.value.map((t) => t.category))].map((c) => ({ value: c, label: c }))],
  },
])
const visible = computed(() => {
  const k = query.value.trim()
  return templates.value.filter((t) => {
    if (filters.value.category !== '전체' && t.category !== filters.value.category) return false
    if (k && !t.title.includes(k) && !t.category.includes(k)) return false
    return true
  })
})

const editing = ref(null)
const draft = ref(empty())
function empty() {
  return { title: '', color: 'mint', category: '업무', duration: 60, repeat: '반복 없음', alarm: 10 }
}
function openAdd() {
  editing.value = 'new'
  draft.value = empty()
}
function openEdit(t) {
  editing.value = t.id
  draft.value = { title: t.title, color: t.color, category: t.category, duration: t.duration, repeat: t.repeat, alarm: t.alarm }
}
const canSave = computed(() => Boolean(draft.value.title.trim()) && draft.value.duration > 0)
function save() {
  if (!canSave.value) return
  if (editing.value === 'new') {
    templates.value.push({ id: Math.max(0, ...templates.value.map((t) => t.id)) + 1, ...draft.value, title: draft.value.title.trim(), uses: 0 })
  } else {
    const target = templates.value.find((t) => t.id === editing.value)
    if (target) Object.assign(target, { ...draft.value, title: draft.value.title.trim() })
  }
  editing.value = null
}
function remove(t) {
  if (!window.confirm(tr('‘{title}’ 템플릿을 삭제할까요?', { title: t.title }))) return
  templates.value = templates.value.filter((x) => x.id !== t.id)
}
/** 템플릿으로 새 일정 만들기 — 일정 화면의 생성 모달을 연다 */
function apply(t) {
  t.uses += 1
  router.push({ path: '/events', query: { new: String(Date.now()), template: t.title } })
}
function alarmLabel(min) {
  if (!min) return tr('알림 없음')
  if (min >= 1440) return Math.round(min / 1440) === 1 ? tr('1일 전') : tr('{n}일 전', { n: Math.round(min / 1440) })
  if (min >= 60) return tr('{n}시간 전', { n: Math.round(min / 60) })
  return tr('{n}분 전', { n: min })
}
</script>

<template>
  <div class="page-tools">
    <span class="form-note" style="margin: 0">{{ tr('자주 만드는 일정을 저장해두세요') }}</span>
    <span></span>
    <PageActions><button class="primary" @click="openAdd">{{ tr('+ 템플릿 저장') }}</button></PageActions>
  </div>

  <!-- 템플릿 목록과 사용 횟수는 화면 안에만 있는 고정 예시다. 저장하지 않는다(IMP-016) -->
  <p class="sample-label">{{ tr('템플릿 목록과 사용 횟수는 시연용 예시예요. 추가·수정·삭제한 내용은 저장되지 않아 화면을 다시 열면 처음 목록으로 돌아가요.') }}</p>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    :placeholder="tr('템플릿 이름·분류 검색')"
    :result-count="visible.length"
    :total-count="templates.length"
  />

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.8fr .8fr .8fr 1.2fr 1fr .8fr 1.4fr">
      <span>{{ tr('템플릿') }}</span><span>{{ tr('분류') }}</span><span>{{ tr('소요') }}</span><span>{{ tr('반복') }}</span><span>{{ tr('알림') }}</span><span>{{ tr('사용') }}</span><span>{{ tr('관리') }}</span>
    </div>
    <div class="row" style="grid-template-columns: 1.8fr .8fr .8fr 1.2fr 1fr .8fr 1.4fr" v-for="t in visible" :key="t.id">
      <label><i :class="['tpl-dot', t.color]"></i>{{ t.title }}</label>
      <span class="tag">{{ tr(t.category) }}</span>
      <span class="figure">{{ tr('{n}분', { n: t.duration }) }}</span>
      <span>{{ tr(t.repeat) }}</span>
      <span>{{ alarmLabel(t.alarm) }}</span>
      <span class="figure">{{ tr('{n}회', { n: t.uses }) }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="apply(t)">{{ tr('적용') }}</button>
        <button class="review" style="margin: 0" @click="openEdit(t)">{{ tr('수정') }}</button>
        <button class="review" style="margin: 0" @click="remove(t)">{{ tr('삭제') }}</button>
      </span>
    </div>
    <p v-if="!visible.length" class="empty-state" role="status">{{ tr('조건에 맞는 템플릿이 없어요. 검색어를 바꾸거나 \'+ 템플릿 저장\'으로 만들어 보세요.') }}</p>
  </section>

  <Modal v-if="editing" :title="editing === 'new' ? tr('템플릿 저장') : tr('템플릿 수정')" wide @close="editing = null">
    <label>{{ tr('템플릿 이름') }}<input v-model="draft.title" :placeholder="tr('예: 주간 팀 회의')" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">{{ tr('분류') }}<select v-model="draft.category"><option value="업무">{{ tr('업무') }}</option><option value="공부">{{ tr('공부') }}</option><option value="건강">{{ tr('건강') }}</option><option value="휴식">{{ tr('휴식') }}</option><option value="개인">{{ tr('개인') }}</option></select></label>
      <label style="flex: 1">{{ tr('소요 시간(분)') }}<input type="number" min="5" step="5" v-model.number="draft.duration" /></label>
    </div>
    <div class="form-row">
      <label style="flex: 1">{{ tr('반복') }}<select v-model="draft.repeat"><option value="반복 없음">{{ tr('반복 없음') }}</option><option value="매주 월 09:00">{{ tr('매주 월 09:00') }}</option><option value="매일">{{ tr('매일') }}</option><option value="매월 1일">{{ tr('매월 1일') }}</option></select></label>
      <label style="flex: 1">{{ tr('알림') }}<select v-model.number="draft.alarm"><option :value="0">{{ tr('알림 없음') }}</option><option :value="10">{{ tr('10분 전') }}</option><option :value="60">{{ tr('1시간 전') }}</option><option :value="1440">{{ tr('1일 전') }}</option></select></label>
    </div>
    <label>{{ tr('색상') }}</label>
    <div class="swatch-row">
      <button v-for="c in COLORS" :key="c" type="button" class="cat-swatch tpl-dot" :class="[c, { picked: draft.color === c }]" @click="draft.color = c"></button>
    </div>
    <p v-if="!canSave" class="form-note">{{ tr('이름을 입력하고 소요 시간을 1분 이상으로 설정해주세요.') }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!canSave" @click="save">{{ editing === 'new' ? tr('저장하기') : tr('변경 저장') }}</button>
    </template>
  </Modal>
</template>
