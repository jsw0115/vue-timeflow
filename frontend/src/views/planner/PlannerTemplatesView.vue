<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'

/** 플래너 템플릿 — 자주 쓰는 하루 구성을 저장했다가 오늘에 적용한다. */
const router = useRouter()
const COLORS = ['mint', 'purple', 'blue', 'amber']

const templates = ref([
  {
    id: 1, title: '출근 루틴 세트', color: 'purple', uses: 28,
    blocks: [
      { time: '07:00', title: '아침 스트레칭' },
      { time: '09:00', title: '팀 스탠드업' },
      { time: '10:00', title: '집중 개발' },
      { time: '12:00', title: '점심 휴식' },
    ],
  },
  {
    id: 2, title: '주말 자기계발', color: 'blue', uses: 15,
    blocks: [
      { time: '09:30', title: '독서 1시간' },
      { time: '11:00', title: '사이드 프로젝트' },
      { time: '14:00', title: '온라인 강의' },
      { time: '16:00', title: '산책' },
      { time: '20:00', title: '주간 회고' },
      { time: '21:00', title: '다음 주 계획' },
    ],
  },
  {
    id: 3, title: '운동 집중 데이', color: 'mint', uses: 9,
    blocks: [{ time: '06:30', title: '러닝 5km' }, { time: '18:00', title: '웨이트' }, { time: '21:30', title: '스트레칭' }],
  },
  {
    id: 4, title: '마감 스프린트', color: 'amber', uses: 4,
    blocks: [
      { time: '09:00', title: '우선순위 정리' }, { time: '09:30', title: '집중 블록 1' },
      { time: '13:00', title: '집중 블록 2' }, { time: '16:00', title: '리뷰 반영' }, { time: '18:00', title: '배포 점검' },
    ],
  },
])
const activeId = ref(1)
const active = computed(() => templates.value.find((t) => t.id === activeId.value) ?? templates.value[0])
const applied = ref('')

/* ---------- 템플릿 추가 / 수정 ---------- */
const editing = ref(null) // 'new' | id
const draft = ref({ title: '', color: 'mint', blockText: '' })

function openAdd() {
  editing.value = 'new'
  draft.value = { title: '', color: 'mint', blockText: '07:00 아침 스트레칭\n09:00 집중 블록' }
}
function openEdit(t) {
  editing.value = t.id
  draft.value = {
    title: t.title,
    color: t.color,
    blockText: t.blocks.map((b) => b.time + ' ' + b.title).join('\n'),
  }
}
/** "07:00 아침 스트레칭" 형태의 각 줄을 타임블록으로 바꾼다 */
function parseBlocks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{1,2}:\d{2})\s+(.*)$/)
      return m ? { time: m[1], title: m[2] } : { time: '--:--', title: line }
    })
}
const draftBlocks = computed(() => parseBlocks(draft.value.blockText))
const canSave = computed(() => draft.value.title.trim() && draftBlocks.value.length > 0)

function save() {
  if (!canSave.value) return
  const blocks = draftBlocks.value
  if (editing.value === 'new') {
    const id = Math.max(0, ...templates.value.map((t) => t.id)) + 1
    templates.value.push({ id, title: draft.value.title.trim(), color: draft.value.color, uses: 0, blocks })
    activeId.value = id
  } else {
    const target = templates.value.find((t) => t.id === editing.value)
    if (target) Object.assign(target, { title: draft.value.title.trim(), color: draft.value.color, blocks })
  }
  editing.value = null
}
function remove(t) {
  if (!window.confirm('‘' + t.title + '’ 템플릿을 삭제할까요?')) return
  templates.value = templates.value.filter((x) => x.id !== t.id)
  if (activeId.value === t.id) activeId.value = templates.value[0]?.id ?? null
}
function applyToday(t) {
  t.uses += 1
  applied.value = '‘' + t.title + '’의 타임블록 ' + t.blocks.length + '개를 오늘 플래너에 넣었어요.'
  setTimeout(() => (applied.value = ''), 3000)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">템플릿 관리</b>
    <span class="form-note" style="margin: 0">템플릿 {{ templates.length }}개</span>
    <span></span>
    <button class="primary" @click="openAdd">+ 템플릿 추가</button>
  </div>

  <p v-if="applied" class="badge ok" style="display: inline-block; margin-bottom: 12px">
    {{ applied }} <a href="#" style="margin-left: 6px" @click.prevent="router.push('/planner/daily')">플래너에서 보기</a>
  </p>

  <div class="manage">
    <section class="card list">
      <div class="list-head" style="grid-template-columns: 2fr 1fr .8fr 1.4fr"><span>템플릿명</span><span>구성</span><span>사용 횟수</span><span>관리</span></div>
      <div class="row" style="grid-template-columns: 2fr 1fr .8fr 1.4fr" :class="{ picked: activeId === t.id }" v-for="t in templates" :key="t.id" @click="activeId = t.id">
        <label><i :class="['tpl-dot', t.color]"></i>{{ t.title }}</label>
        <span>타임블록 {{ t.blocks.length }}개</span>
        <span class="figure">{{ t.uses }}회</span>
        <span style="display: flex; gap: 6px">
          <button class="review" style="margin: 0" @click.stop="applyToday(t)">적용</button>
          <button class="review" style="margin: 0" @click.stop="openEdit(t)">수정</button>
          <button class="review" style="margin: 0" @click.stop="remove(t)">삭제</button>
        </span>
      </div>
      <p v-if="!templates.length" class="form-note" style="margin: 12px 0 0">저장된 템플릿이 없어요. 새로 추가해보세요.</p>
    </section>

    <aside class="card detail" v-if="active">
      <h3>{{ active.title }}</h3>
      <p>타임블록 {{ active.blocks.length }}개 · {{ active.uses }}회 사용</p>
      <div class="event" v-for="(b, i) in active.blocks" :key="i" :style="{ borderBottom: i === active.blocks.length - 1 ? 'none' : '' }">
        <i :class="['tpl-bar', active.color]"></i>
        <span><b class="figure">{{ b.time }}</b><small>{{ b.title }}</small></span>
      </div>
      <button class="primary" @click="applyToday(active)">오늘에 적용하기</button>
    </aside>
  </div>

  <Modal v-if="editing" :title="editing === 'new' ? '템플릿 추가' : '템플릿 수정'" wide @close="editing = null">
    <label>템플릿 이름<input v-model="draft.title" placeholder="예: 재택 근무 하루" autofocus /></label>
    <label>색상</label>
    <div class="swatch-row">
      <button v-for="c in COLORS" :key="c" type="button" class="cat-swatch tpl-dot" :class="[c, { picked: draft.color === c }]" @click="draft.color = c"></button>
    </div>
    <label>타임블록<textarea v-model="draft.blockText" rows="7" placeholder="한 줄에 하나씩 · 예) 09:00 팀 스탠드업"></textarea></label>
    <p class="form-note">시간 뒤에 한 칸 띄우고 내용을 적어주세요. 시간이 없으면 --:--로 저장돼요.</p>

    <div v-if="draftBlocks.length" class="doc-preview">
      <span class="pill">미리보기 · {{ draftBlocks.length }}개</span>
      <div v-for="(b, i) in draftBlocks" :key="i" class="tpl-preview-row">
        <b class="figure">{{ b.time }}</b><span>{{ b.title }}</span>
      </div>
    </div>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button class="primary" :disabled="!canSave" @click="save">{{ editing === 'new' ? '템플릿 저장' : '변경 저장' }}</button>
    </template>
  </Modal>
</template>
