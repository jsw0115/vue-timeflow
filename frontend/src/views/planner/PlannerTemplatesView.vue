<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import PageActions from '../../components/PageActions.vue'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { saveFailureMessage } from '../../features/records/saveState.mjs'
import { localDate } from '../../utils/postValidation.mjs'
import { plannerTemplateStore } from '../../store/plannerTemplates'
import { loadPublicContent, parseTemplateText, publicTemplates } from '../../features/content/publicContent.mjs'

/** 플래너 템플릿 — 자주 쓰는 하루 구성을 저장했다가 오늘에 적용한다. */
const router = useRouter()
const COLORS = ['mint', 'purple', 'blue', 'amber']

// 로그아웃 상태의 예시 템플릿. 저장하지 않고 실제 플래너에도 넣지 않는다
const demoTemplates = ref([
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
// 로그인하면 계정 템플릿(서버)을 쓰고, 관리자가 공개한 공용 템플릿을 가져올 수 있다(Q-29)
const onServer = computed(() => Boolean(session.userId))
const templates = computed(() => (onServer.value ? plannerTemplateStore.list.value : demoTemplates.value))
const activeId = ref(1)
const active = computed(() => templates.value.find((t) => t.id === activeId.value) ?? templates.value[0])
const applied = ref('')
const failure = ref('')
const shared = ref([])
const sharedStatus = ref('idle')
async function loadShared() {
  if (!onServer.value) { shared.value = []; sharedStatus.value = 'idle'; return }
  sharedStatus.value = 'loading'
  try { shared.value = publicTemplates(await loadPublicContent(apiRequest)); sharedStatus.value = 'ready' } catch { sharedStatus.value = 'error' }
}
onMounted(loadShared)
watch(() => session.userId, loadShared)
async function importShared(t) {
  failure.value = ''
  try {
    const row = await plannerTemplateStore.create({ title: t.title, color: 'mint', blocks: t.blocks })
    activeId.value = row?.id ?? activeId.value
    applied.value = '‘' + t.title + '’를 내 템플릿으로 가져왔어요.'
  } catch (error) { failure.value = saveFailureMessage(error) }
}

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
/** "07:00 아침 스트레칭" 형태의 각 줄을 타임블록으로 바꾼다. 서버는 시각이 있는 줄만 받는다 */
const draftBlocks = computed(() => parseTemplateText(draft.value.blockText))
const hasInvalid = computed(() => draftBlocks.value.some((b) => !b.valid))
const canSave = computed(() => draft.value.title.trim() && draftBlocks.value.length > 0 && !(onServer.value && hasInvalid.value))
const blocksOf = () => draftBlocks.value.map(({ time, title }) => ({ time, title }))

async function save() {
  if (!canSave.value) return
  const blocks = blocksOf()
  if (onServer.value) {
    failure.value = ''
    try {
      const values = { title: draft.value.title.trim(), color: draft.value.color, blocks }
      if (editing.value === 'new') { const row = await plannerTemplateStore.create(values); activeId.value = row?.id ?? activeId.value }
      else await plannerTemplateStore.update(templates.value.find((t) => t.id === editing.value), values)
      editing.value = null
    } catch (error) { failure.value = saveFailureMessage(error) }
    return
  }
  if (editing.value === 'new') {
    const id = Math.max(0, ...demoTemplates.value.map((t) => t.id)) + 1
    demoTemplates.value.push({ id, title: draft.value.title.trim(), color: draft.value.color, uses: 0, blocks })
    activeId.value = id
  } else {
    const target = templates.value.find((t) => t.id === editing.value)
    if (target) Object.assign(target, { title: draft.value.title.trim(), color: draft.value.color, blocks })
  }
  editing.value = null
}
async function remove(t) {
  if (!window.confirm('‘' + t.title + '’ 템플릿을 삭제할까요?')) return
  if (onServer.value) {
    failure.value = ''
    try { await plannerTemplateStore.remove(t) } catch (error) { failure.value = saveFailureMessage(error); return }
  } else demoTemplates.value = demoTemplates.value.filter((x) => x.id !== t.id)
  if (activeId.value === t.id) activeId.value = templates.value[0]?.id ?? null
}
/** 로그인 상태는 서버가 오늘 날짜에 플래너 블록을 만든 뒤에만 완료 문구를 보인다. 예시는 넣은 것처럼 보이지 않는다 */
async function applyToday(t) {
  failure.value = ''; applied.value = ''
  if (!onServer.value) { failure.value = '예시 템플릿이라 실제 플래너에는 넣지 않았어요. 로그인하면 오늘 플래너에 넣을 수 있어요.'; return }
  try {
    const items = await apiRequest(`/api/planner/templates/${encodeURIComponent(t.id)}/apply`, { method: 'POST', body: JSON.stringify({ date: localDate() }) })
    applied.value = '‘' + t.title + '’의 타임블록 ' + (items?.length ?? t.blocks.length) + '개를 오늘 플래너에 넣었어요.'
  } catch (error) { failure.value = saveFailureMessage(error) }
}
</script>

<template>
  <div class="page-tools">
    <span class="form-note" style="margin: 0">템플릿 {{ templates.length }}개</span>
    <span></span>
    <PageActions><button class="primary" @click="openAdd">+ 템플릿 추가</button></PageActions>
  </div>

  <p v-if="!onServer" class="input-field-help">지금 보이는 템플릿은 예시예요. 로그인하면 계정에 저장하고, 공용 템플릿을 가져와 오늘 플래너에 넣을 수 있어요.</p>
  <p v-if="applied" class="badge ok" role="status" style="display: inline-block; margin-bottom: 12px">
    {{ applied }} <a href="#" style="margin-left: 6px" @click.prevent="router.push('/planner/daily')">플래너에서 보기</a>
  </p>
  <p v-if="failure" class="input-field-help" data-state="error" role="alert">{{ failure }}</p>

  <section v-if="onServer" class="card shared-templates" aria-labelledby="shared-templates-title">
    <h3 id="shared-templates-title">공용 템플릿</h3>
    <p v-if="sharedStatus === 'loading'" class="input-field-help" role="status">공용 템플릿을 불러오는 중이에요.</p>
    <p v-else-if="sharedStatus === 'error'" class="input-field-help" data-state="error">공용 템플릿을 불러오지 못했어요. <button type="button" class="button-text" @click="loadShared">다시 시도</button></p>
    <ul v-else-if="shared.length" class="shared-template-list">
      <li v-for="t in shared" :key="t.id">
        <span><b>{{ t.title }}</b><small>{{ t.blocks.map((b) => b.time + ' ' + b.title).join(' · ') }}</small></span>
        <button type="button" class="button-secondary" :aria-label="t.title + ' 내 템플릿으로 가져오기'" @click="importShared(t)">내 템플릿으로 가져오기</button>
      </li>
    </ul>
    <p v-else class="empty-state">아직 공용 템플릿이 없어요. 내 템플릿은 '+ 템플릿 추가'로 만들 수 있어요.</p>
  </section>

  <div class="manage">
    <section class="card list">
      <div class="list-head" style="grid-template-columns: 2fr 1fr .8fr 1.4fr"><span>템플릿명</span><span>구성</span><span>{{ onServer ? '' : '사용 횟수' }}</span><span>관리</span></div>
      <div class="row" style="grid-template-columns: 2fr 1fr .8fr 1.4fr" :class="{ picked: activeId === t.id }" v-for="t in templates" :key="t.id" @click="activeId = t.id">
        <label><i :class="['tpl-dot', t.color]"></i>{{ t.title }}</label>
        <span>타임블록 {{ t.blocks.length }}개</span>
        <span class="figure">{{ onServer ? '' : t.uses + '회' }}</span>
        <span style="display: flex; gap: 6px">
          <button class="review" style="margin: 0" @click.stop="applyToday(t)">적용</button>
          <button class="review" style="margin: 0" @click.stop="openEdit(t)">수정</button>
          <button class="review" style="margin: 0" @click.stop="remove(t)">삭제</button>
        </span>
      </div>
      <p v-if="!templates.length" class="empty-state">저장된 템플릿이 없어요. '+ 템플릿 추가'로 자주 쓰는 하루를 저장해 보세요.</p>
    </section>

    <aside class="card detail" v-if="active">
      <h3>{{ active.title }}</h3>
      <p>타임블록 {{ active.blocks.length }}개<template v-if="!onServer"> · {{ active.uses }}회 사용</template></p>
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
    <p class="form-note">시간 뒤에 한 칸 띄우고 내용을 적어주세요. {{ onServer ? '시간이 없는 줄은 저장할 수 없어요.' : '시간이 없으면 --:--로 저장돼요.' }}</p>
    <p v-if="onServer && hasInvalid" class="input-field-help" data-state="error" role="alert">시간을 읽지 못한 줄이 있어요. "09:00 팀 스탠드업"처럼 고쳐 주세요.</p>

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

<style scoped>
.shared-templates { display: grid; gap: var(--space-md); margin-bottom: var(--space-xl); }
.shared-templates h3, .shared-templates p { margin: 0; }
.shared-template-list { display: grid; gap: var(--space-sm); margin: 0; padding: 0; list-style: none; }
.shared-template-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-sm) var(--space-lg); padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-hairline); }
.shared-template-list span { display: grid; gap: var(--space-xs); min-width: 0; }
.shared-template-list small { color: var(--color-muted); overflow-wrap: anywhere; }
</style>
