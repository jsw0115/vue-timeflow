<script setup>
import AppIcon from '../../components/icons/AppIcon.vue'
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { diaries, diaryStore } from '../../store/writing'
import { MOODS, moodCode } from '../../utils/mood.mjs'
import { createSaveState } from '../../features/records/saveState.mjs'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import StorageNote from '../../components/StorageNote.vue'
import { localDate } from '../../utils/postValidation.mjs'
import { events } from '../../store/appState'
import TagMentionInput from '../../components/TagMentionInput.vue'
import EditPresence from '../../components/EditPresence.vue'
import DayRecords from '../../components/DayRecords.vue'
import PageActions from '../../components/PageActions.vue'

const written = [1, 4, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21, 24]


const route = useRoute()
const entryId = ref(null)
const entryDate = ref(localDate())
const entryTitle = ref('')
const saved = ref({ body: '', tags: [], mood: 'calm', date: localDate(), title: '' })

const body = ref(saved.value.body)
const tags = ref([...saved.value.tags])
const mood = ref(saved.value.mood)
const tagInput = ref('')

const TEMPLATES = [
  { label: 'KPT 회고', text: 'Keep (좋았던 점):\n- \n\nProblem (아쉬운 점):\n- \n\nTry (시도할 점):\n- ' },
  { label: '4Ls 회고', text: 'Liked (좋았던 것):\n- \n\nLearned (배운 것):\n- \n\nLacked (부족했던 것):\n- \n\nLonged for (바랐던 것):\n- ' },
  { label: '감사 일기', text: '오늘 감사한 일 세 가지\n1. \n2. \n3. ' },
]

const isDirty = computed(() => entryTitle.value !== saved.value.title || entryDate.value !== saved.value.date || body.value !== saved.value.body || mood.value !== saved.value.mood || JSON.stringify(tags.value) !== JSON.stringify(saved.value.tags))

const diaryMode = diaryStore.mode
// 연 때의 다이어리. 저장은 이 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84)
const base = ref(null)
const saving = createSaveState({ fields: { title: ['title', '제목'], date: ['date', '날짜'] } })
const conflict = ref(null)
async function save() {
  if (!isDirty.value || !entryTitle.value.trim() || !entryDate.value) return
  const payload = { title: entryTitle.value.trim(), date: entryDate.value, body: body.value, tags: [...tags.value], mood: mood.value }
  conflict.value = null
  const result = await saving.run(() => (base.value ? diaryStore.update(base.value, payload) : diaryStore.create(payload)))
  if (result.ok) {
    base.value = { ...result.value }
    entryId.value = result.value.id
    saved.value = { ...payload, tags: [...tags.value] }
    return
  }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? base.value) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest
  const label = (code) => MOODS.find((item) => item.code === moodCode(code))?.label ?? ''
  return [
    { label: '제목', mine: entryTitle.value.trim(), latest: latest.title },
    { label: '날짜', mine: entryDate.value, latest: latest.date },
    { label: '기분', mine: label(mood.value), latest: label(latest.mood) },
    { label: '내용', mine: body.value, latest: latest.body ?? '' },
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
  entryTitle.value = latest.title
  entryDate.value = latest.date
  body.value = latest.body ?? ''
  tags.value = [...(latest.tags ?? [])]
  mood.value = moodCode(latest.mood) ?? 'calm'
  saved.value = { title: entryTitle.value, date: entryDate.value, body: body.value, tags: [...tags.value], mood: mood.value }
}

// 로그인 상태에서는 목록을 불러온 뒤에 열 수 있어 목록 길이도 본다. 같은 주소를 이미 열었으면(목록을 다시 불러왔거나 방금 저장함) 입력을 지우지 않는다
let openedFor
watch(() => [route.query.id, diaries.value.length], ([id]) => {
  const entry = diaries.value.find(d => String(d.id) === String(id))
  if (openedFor === String(id ?? '') && (entry || id == null)) return
  if (id != null && !entry) return
  openedFor = String(id ?? '')
  base.value = entry ? { ...entry } : null
  conflict.value = null
  saving.reset()
  entryId.value = entry?.id ?? null
  entryDate.value = entry?.date ?? localDate()
  entryTitle.value = entry?.title ?? ''
  body.value = entry?.body ?? ''
  tags.value = [...(entry?.tags ?? [])]
  mood.value = moodCode(entry?.mood) ?? 'calm'
  saved.value = { title: entryTitle.value, date: entryDate.value, body: body.value, tags: [...tags.value], mood: mood.value }
}, { immediate: true })
function insertTemplate(text) {
  if (body.value.trim() && body.value !== saved.value.body) {
    if (!confirm('이미 작성 중인 내용이 있어요. 템플릿을 이어서 추가할까요?')) return
    body.value = `${body.value}\n\n${text}`
  } else {
    body.value = text
  }
}

function addTag() {
  const value = tagInput.value.trim()
  if (value && !tags.value.includes(value)) tags.value.push(value)
  tagInput.value = ''
}
function removeTag(tag) {
  tags.value = tags.value.filter((t) => t !== tag)
}
/* 사진 첨부 — 파일을 골라 본문에 참조로 남긴다 */
const photos = ref([])
const fileInput = ref(null)
onBeforeUnmount(() => photos.value.forEach(p => URL.revokeObjectURL(p.url)))
function pickPhoto() {
  fileInput.value?.click()
}
function onPhoto(e) {
  const files = [...(e.target.files ?? [])]
  files.forEach((f) => photos.value.push({ name: f.name, url: URL.createObjectURL(f) }))
  e.target.value = ''
}
function removePhoto(i) {
  URL.revokeObjectURL(photos.value[i].url)
  photos.value.splice(i, 1)
}

/* 하이라이트 — 이 기록을 따로 모아두는 표시 */
const highlighted = ref(false)
function toggleHighlight() {
  highlighted.value = !highlighted.value
}

function linkPlannerItem(title) {
  body.value += `${body.value.endsWith('\n') || !body.value ? '' : '\n'}[참조: ${title}]`
}
</script>

<template>
  <div class="page-tools">
    <span></span>
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onPhoto" />
    <button type="button" class="icon-button" title="사진 첨부" aria-label="사진 첨부" @click="pickPhoto"><AppIcon name="image" /></button>
    <PageActions><button class="primary" :disabled="!isDirty || !entryTitle.trim() || !entryDate || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? '저장하는 중' : !entryId || isDirty ? '저장하기' : '저장됨' }}</button></PageActions>
  </div>
  <StorageNote :mode="diaryMode" />
  <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
  <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
  <SaveStatus :state="saving.state" :mode="diaryMode" @retry="save" />
  <div class="diary">
    <section class="card editor">
      <EditPresence v-if="entryId" :resource="'diary:' + entryId" />
      <div class="head">
        <!-- 날씨 연동이 없어 고정 문구('맑음 · 서울')를 보이던 칩을 뺐다(DESIGN.md 1장 신뢰) -->
        <span></span>
        <button type="button" :class="{ 'chip-on': highlighted }" :aria-pressed="highlighted" @click="toggleHighlight">{{ highlighted ? '하이라이트로 저장됨' : '하이라이트로 저장' }}</button>
      </div>
      <div class="form-row"><label>기록 날짜<input type="date" v-model="entryDate" /></label><label>제목<input v-model="entryTitle" placeholder="오늘의 한 줄" maxlength="200" /></label></div>
      <p v-if="photos.length" class="form-note">사진은 미리보기 전용이며 저장되지 않습니다.</p>
      <div v-if="photos.length" class="diary-photos">
        <div v-for="(ph, i) in photos" :key="i" class="diary-photo">
          <img :src="ph.url" :alt="ph.name" />
          <button class="person-info" title="사진 제거" aria-label="사진 제거" @click="removePhoto(i)">×</button>
        </div>
      </div>
      <div class="segmented-tab diary-moods" role="group" aria-label="기분">
        <button v-for="m in MOODS" :key="m.code" type="button" :aria-pressed="mood === m.code" @click="mood = m.code">{{ m.label }}</button>
      </div>

      <div class="filter" style="width: fit-content; margin-bottom: 10px">
        <button v-for="t in TEMPLATES" :key="t.label" @click="insertTemplate(t.text)">{{ t.label }} 삽입</button>
      </div>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="body" :rows="10" placeholder="오늘 하루는 어땠나요? #회고 @이름" /></label>

      <label style="display: block; font-size: 0.8125rem; font-weight: 600; margin-top: 15px">태그</label>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px">
        <span class="tag" v-for="t in tags" :key="t">#{{ t }} <a style="cursor: pointer; font-weight: 700" @click="removeTag(t)">×</a></span>
        <input v-model="tagInput" @keydown.enter.prevent="addTag" placeholder="태그 입력 후 Enter" style="border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); padding: 4px 8px; width: 140px; background: var(--color-card)" />
      </div>
      <DayRecords :date="entryDate" />
    </section>
    <aside class="calendar card">
      <h3>이번 달</h3>
      <div>
        <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
        <span v-for="d in 31" :key="d" :class="{ written: written.includes(d) }">{{ d }}</span>
      </div>
      <h3>오늘의 플래너 항목 <span class="badge new">보충 반영 · DIARY-001-F04</span></h3>
      <p style="margin-bottom: 6px">항목을 클릭하면 일기에 참조로 삽입돼요</p>
      <div class="event" v-for="e in events" :key="e.title" style="cursor: pointer" @click="linkPlannerItem(e.title)">
        <time>{{ e.time }}</time><i></i><span><b>{{ e.title }}</b><small>{{ e.tag }}</small></span>
      </div>
      <h3>이번 주 요약</h3>
      <p>기분 좋은 날이 4일, 평온한 날이 2일이었어요. ‘팀 회의’ 키워드가 가장 자주 등장했어요.</p>
    </aside>
  </div>
</template>
