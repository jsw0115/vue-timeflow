<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { diaries } from '../../store/writing'
import { localDate } from '../../utils/postValidation.mjs'
import { events } from '../../store/appState'
import TagMentionInput from '../../components/TagMentionInput.vue'
import EditPresence from '../../components/EditPresence.vue'

const written = [1, 4, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21, 24]

const MOODS = ['🙂', '😌', '😴', '😤', '🥳']

const route = useRoute()
const entryId = ref(null)
const entryDate = ref(localDate())
const entryTitle = ref('')
const saved = ref({ body: '', tags: [], mood: '😌', date: localDate(), title: '' })

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

function save() {
  if (!isDirty.value || !entryTitle.value.trim() || !entryDate.value) return
  const payload = { title: entryTitle.value.trim(), date: entryDate.value, body: body.value, tags: [...tags.value], mood: mood.value }
  let entry = diaries.value.find(d => d.id === entryId.value)
  if (entry) Object.assign(entry, payload)
  else { entry = { id: Math.max(0, ...diaries.value.map(d => d.id)) + 1, ...payload }; diaries.value.unshift(entry); entryId.value = entry.id }
  saved.value = { ...payload, tags: [...tags.value] }
}

watch(() => route.query.id, id => {
  const entry = diaries.value.find(d => String(d.id) === String(id))
  entryId.value = entry?.id ?? null
  entryDate.value = entry?.date ?? localDate()
  entryTitle.value = entry?.title ?? ''
  body.value = entry?.body ?? ''
  tags.value = [...(entry?.tags ?? [])]
  mood.value = entry?.mood ?? '😌'
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
    <button class="icon" title="사진 첨부" aria-label="사진 첨부" @click="pickPhoto">📷</button>
    <button class="primary" :disabled="!isDirty || !entryTitle.trim() || !entryDate" @click="save">{{ !entryId || isDirty ? '저장하기' : '저장됨' }}</button>
  </div>
  <div class="diary">
    <section class="card editor">
      <EditPresence v-if="entryId" :resource="'diary:' + entryId" />
      <div class="head">
        <span class="pill warm">맑음 ☀ · 서울</span>
        <button :class="{ 'chip-on': highlighted }" @click="toggleHighlight">{{ highlighted ? '★ 하이라이트' : '☆ 하이라이트로 저장' }}</button>
      </div>
      <div class="form-row"><label>기록 날짜<input type="date" v-model="entryDate" /></label><label>제목<input v-model="entryTitle" placeholder="오늘의 한 줄" maxlength="200" /></label></div>
      <p v-if="photos.length" class="form-note">사진은 미리보기 전용이며 저장되지 않습니다.</p>
      <div v-if="photos.length" class="diary-photos">
        <div v-for="(ph, i) in photos" :key="i" class="diary-photo">
          <img :src="ph.url" :alt="ph.name" />
          <button class="person-info" title="사진 제거" aria-label="사진 제거" @click="removePhoto(i)">×</button>
        </div>
      </div>
      <div class="moods">
        <template v-for="m in MOODS" :key="m">
          <b v-if="mood === m" @click="mood = m">{{ m }}</b>
          <span v-else style="cursor: pointer" @click="mood = m">{{ m }}</span>
        </template>
      </div>

      <div class="filter" style="width: fit-content; margin-bottom: 10px">
        <button v-for="t in TEMPLATES" :key="t.label" @click="insertTemplate(t.text)">{{ t.label }} 삽입</button>
      </div>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="body" :rows="10" placeholder="오늘 하루는 어땠나요? #회고 @이름" /></label>

      <label style="display: block; font-size: 0.8125rem; font-weight: 600; margin-top: 15px">태그</label>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px">
        <span class="tag" v-for="t in tags" :key="t">#{{ t }} <a style="cursor: pointer; font-weight: 700" @click="removeTag(t)">×</a></span>
        <input v-model="tagInput" @keydown.enter.prevent="addTag" placeholder="태그 입력 후 Enter" style="border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); padding: 4px 8px; width: 140px; background: var(--color-canvas)" />
      </div>
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
