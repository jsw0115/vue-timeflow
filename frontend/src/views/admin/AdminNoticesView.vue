<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { audit } from '../../store/adminOps'

/** 공지/팝업 — 등록·수정·노출 전환·삭제가 실제로 동작하고 감사 로그에 남는다. */
const TYPES = ['배너', '팝업', '전체 알림']
const notices = ref([
  { id: 1, title: '추석 연휴 서버 점검 안내', type: '배너', from: '2026-09-14', to: '2026-09-18', live: true },
  { id: 2, title: '신규 기능: 갓생 리포트 출시!', type: '팝업', from: '2026-08-20', to: '2026-08-27', live: true },
  { id: 3, title: '여름 이벤트 종료 안내', type: '배너', from: '2026-07-01', to: '2026-07-31', live: false },
])

const filter = ref('전체')
const FILTERS = ['전체', '노출중', '종료됨']
const visible = computed(() =>
  notices.value.filter((n) => {
    if (filter.value === '노출중') return n.live
    if (filter.value === '종료됨') return !n.live
    return true
  }),
)
const liveCount = computed(() => notices.value.filter((n) => n.live).length)

const editing = ref(null)
const draft = ref(empty())
function empty() {
  return { title: '', type: '배너', from: '', to: '' }
}
function openAdd() {
  editing.value = 'new'
  draft.value = empty()
}
function openEdit(n) {
  editing.value = n.id
  draft.value = { title: n.title, type: n.type, from: n.from, to: n.to }
}
const error = computed(() => {
  if (!draft.value.title.trim()) return '공지 제목을 입력해주세요.'
  if (!draft.value.from || !draft.value.to) return '노출 기간을 지정해주세요.'
  if (draft.value.to < draft.value.from) return '종료일이 시작일보다 빠를 수 없어요.'
  return ''
})
function save() {
  if (error.value) return
  if (editing.value === 'new') {
    notices.value.unshift({ id: Math.max(0, ...notices.value.map((n) => n.id)) + 1, ...draft.value, title: draft.value.title.trim(), live: false })
    audit('공지', '공지 등록', draft.value.title.trim())
  } else {
    const target = notices.value.find((n) => n.id === editing.value)
    if (target) {
      Object.assign(target, { ...draft.value, title: draft.value.title.trim() })
      audit('공지', '공지 수정', target.title)
    }
  }
  editing.value = null
}
function toggleLive(n) {
  n.live = !n.live
  audit('공지', n.live ? '공지 노출' : '공지 내림', n.title)
}
function remove(n) {
  if (!window.confirm('\u2018' + n.title + '\u2019 공지를 삭제할까요?')) return
  notices.value = notices.value.filter((x) => x.id !== n.id)
  audit('공지', '공지 삭제', n.title)
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>공지 · 팝업</h2><p>서비스 전체에 노출되는 안내를 관리해요</p></div>
    <button class="primary" @click="openAdd">+ 새 공지</button>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="f in FILTERS" :key="f" :class="{ selected: filter === f }" @click="filter = f">{{ f }}</button>
    </div>
    <span class="badge ok">노출중 {{ liveCount }}건</span>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 2.4fr .8fr 1.6fr .8fr 1.4fr">
      <span>제목</span><span>형태</span><span>노출 기간</span><span>상태</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 2.4fr .8fr 1.6fr .8fr 1.4fr" v-for="n in visible" :key="n.id">
      <label>{{ n.title }}</label>
      <span class="tag">{{ n.type }}</span>
      <span class="figure">{{ n.from }} ~ {{ n.to }}</span>
      <span class="badge" :class="n.live ? 'ok' : ''">{{ n.live ? '노출중' : '종료됨' }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="toggleLive(n)">{{ n.live ? '내리기' : '노출' }}</button>
        <button class="review" style="margin: 0" @click="openEdit(n)">수정</button>
        <button class="review" style="margin: 0" @click="remove(n)">삭제</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">해당 상태의 공지가 없어요.</p>
  </section>

  <Modal v-if="editing" :title="editing === 'new' ? '새 공지' : '공지 수정'" wide @close="editing = null">
    <label>제목<input v-model="draft.title" placeholder="예: 정기 점검 안내" autofocus /></label>
    <label>형태<select v-model="draft.type"><option v-for="t in TYPES" :key="t">{{ t }}</option></select></label>
    <div class="form-row">
      <label style="flex: 1">시작일<input type="date" v-model="draft.from" /></label>
      <label style="flex: 1">종료일<input type="date" v-model="draft.to" /></label>
    </div>
    <p v-if="error" class="form-note">{{ error }}</p>
    <p class="form-note">등록하면 '종료됨' 상태로 저장돼요. 검수 후 노출로 바꿔주세요.</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button class="primary" :disabled="Boolean(error)" @click="save">{{ editing === 'new' ? '등록하기' : '변경 저장' }}</button>
    </template>
  </Modal>
</template>
