<script setup>
// 커리어 활동 타임라인(docs/design 03 MN-131·04 FD-85 후보). 업무·학습·프로젝트 활동을 날짜순으로 남기고 경력·근거 링크에 연결한다.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import PageActions from '../../components/PageActions.vue'
import ActivitySourcePanel from '../../components/ActivitySourcePanel.vue'
import { session } from '../../features/auth/session.js'
import { activityStore } from '../../store/careerLedger'
import { careerStore } from '../../store/career'
import { achievementsFromText } from '../../features/records/featureKinds.mjs'
import { createSaveState, saveFailureMessage } from '../../features/records/saveState.mjs'
import { ACTIVITY_TYPES, activityTypeLabel, groupByMonth, isWebUrl, listFromText } from '../../features/career/careerModel.mjs'
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { localDate } from '../../utils/postValidation.mjs'

const route = useRoute()
const router = useRouter()
const signedIn = computed(() => Boolean(session.userId))
const filter = ref('all')
const items = computed(() => (signedIn.value ? activityStore.list.value : []))
const shown = computed(() => (filter.value === 'all' ? items.value : items.value.filter((item) => item.activityType === filter.value)))
const months = computed(() => groupByMonth(shown.value))
// 월 제목은 표시 언어 형식으로 보인다(PR-32). 날짜가 아닌 묶음 이름은 그대로다
const monthTitle = (group) => (/^\d{4}-\d{2}$/.test(group.month) && bodyLocale.value !== 'ko' ? formatDate(new Date(Number(group.month.slice(0, 4)), Number(group.month.slice(5)) - 1, 1), bodyLocale.value, { year: 'numeric', month: 'long' }) : group.label)
const experiences = computed(() => careerStore.list.value)
function experienceLabel(id) {
  if (!id) return ''
  const found = experiences.value.find((item) => String(item.id) === String(id))
  if (found) return found.title
  return careerStore.state.loaded ? tr('연결한 경력을 찾을 수 없어요(삭제됨)') : ''
}
const listMessage = ref('')

const editor = ref(null)
const saving = createSaveState({ fields: { title: ['title', '제목'], date: ['date', '날짜'], endDate: ['endDate', '끝난 날'], links: ['links', '근거 링크'], experienceId: ['experienceId', '연결 경력'] } })
const conflict = ref(null)
function open(item = null) {
  saving.reset()
  conflict.value = null
  editor.value = {
    base: item ? { ...item } : null,
    draft: {
      title: item?.title ?? '', activityType: item?.activityType ?? 'work', date: item?.date ?? localDate(), endDate: item?.endDate ?? '',
      experienceId: item?.experienceId ?? '', role: item?.role ?? '', skillsText: (item?.skillTags ?? []).join(', '),
      achievementsText: (item?.achievements ?? []).join('\n'), linksText: (item?.links ?? []).join('\n'), body: item?.body ?? '',
    },
  }
}
const badLinks = computed(() => (editor.value ? achievementsFromText(editor.value.draft.linksText).filter((link) => !isWebUrl(link)) : []))
const tooManyLinks = computed(() => (editor.value ? achievementsFromText(editor.value.draft.linksText).length > 10 : false))
const dateOrderOk = computed(() => !editor.value?.draft.endDate || editor.value.draft.endDate >= editor.value.draft.date)
const canSave = computed(() => Boolean(editor.value?.draft.title.trim() && editor.value.draft.date) && dateOrderOk.value && !badLinks.value.length && !tooManyLinks.value)
function values() {
  const draft = editor.value.draft
  return {
    title: draft.title.trim(), activityType: draft.activityType, date: draft.date, endDate: draft.endDate, experienceId: draft.experienceId,
    role: draft.role.trim(), skillTags: listFromText(draft.skillsText), achievements: achievementsFromText(draft.achievementsText),
    links: achievementsFromText(draft.linksText), body: draft.body,
  }
}
async function save() {
  if (!canSave.value) return
  const { base } = editor.value
  conflict.value = null
  const result = await saving.run(() => (base ? activityStore.update(base, values()) : activityStore.create(values())))
  if (result.ok) { editor.value = null; return }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? base) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = values()
  return [
    { label: '제목', mine: mine.title, latest: latest.title ?? '' },
    { label: '유형 · 날짜', mine: activityTypeLabel(mine.activityType) + ' · ' + mine.date, latest: activityTypeLabel(latest.activityType) + ' · ' + (latest.date ?? '') },
    { label: '성과', mine: mine.achievements.join('\n'), latest: (latest.achievements ?? []).join('\n') },
  ]
})
function keepMine() { editor.value.base = { ...conflict.value.latest }; conflict.value = null; save() }
function useLatest() { open(conflict.value.latest) }
async function remove(item) {
  if (!window.confirm(tr('‘{title}’ 활동을 삭제할까요?', { title: item.title }))) return
  listMessage.value = ''
  try { await activityStore.remove(item) } catch (error) {
    if (error.kind !== 'stale' && error.kind !== 'notFound') listMessage.value = error.kind === 'conflict' ? tr('다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.') : tr(saveFailureMessage(error).replace('저장하지', '삭제하지'))
  }
}
onMounted(() => {
  if (route.query.new && signedIn.value) open()
  if (route.query.new) router.replace({ query: {} })
})
</script>

<template>
  <PageActions><button v-if="signedIn" type="button" class="primary" @click="open()">{{ tr('활동 기록하기') }}</button></PageActions>

  <div v-if="!signedIn" class="empty-state activity-signed-out" role="status">
    <p>{{ tr('로그인하면 업무·학습·프로젝트 활동을 계정에 남기고 경력에 연결할 수 있어요. 로그아웃 상태에서는 활동을 저장하지 않아요.') }}</p>
    <router-link class="button-secondary" to="/auth/login">{{ tr('로그인') }}</router-link>
  </div>

  <template v-else>
    <p class="input-field-help activity-note">{{ tr('활동은 나만 보기로 저장돼요. 계획·실제 기록은 그대로 두고, 여기에는 역할·성과·근거를 덧붙여요.') }}</p>
    <div class="filter activity-filter" role="group" :aria-label="tr('활동 유형 거르기')">
      <button type="button" :class="{ selected: filter === 'all' }" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ tr('전체 {n}', { n: items.length }) }}</button>
      <button v-for="type in ACTIVITY_TYPES" :key="type.id" type="button" :class="{ selected: filter === type.id }" :aria-pressed="filter === type.id" @click="filter = type.id">{{ tr(type.label) }}</button>
    </div>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="status">{{ listMessage }}</p>
    <p v-if="activityStore.state.loading && !activityStore.state.loaded" class="input-field-help" role="status">{{ tr('활동을 불러오는 중이에요.') }}</p>
    <div v-else-if="activityStore.state.error && !activityStore.state.loaded" class="empty-state" role="status"><p>{{ tr('활동을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="activityStore.reload()">{{ tr('다시 시도') }}</button></div>
    <div v-else-if="!items.length" class="empty-state" role="status"><p>{{ tr('아직 남긴 활동이 없어요. 최근 업무 성과나 학습 기록을 한 줄이라도 남겨 보세요.') }}</p><button type="button" class="button-secondary" @click="open()">{{ tr('활동 기록하기') }}</button></div>
    <p v-else-if="!shown.length" class="empty-state" role="status">{{ tr('이 유형으로 남긴 활동이 없어요. 다른 유형을 고르거나 전체를 눌러 모든 활동을 보세요.') }}</p>

    <section v-for="group in months" :key="group.month" class="activity-month" :aria-labelledby="'month-' + group.month">
      <h2 :id="'month-' + group.month">{{ monthTitle(group) }}<small>{{ tr('{n}건', { n: group.items.length }) }}</small></h2>
      <ol class="activity-list">
        <li v-for="item in group.items" :key="item.id" class="card activity-item">
          <div class="head">
            <div class="activity-main">
              <p class="activity-meta"><span class="figure">{{ item.date }}<template v-if="item.endDate"> ~ {{ item.endDate }}</template></span><span class="tag">{{ tr(activityTypeLabel(item.activityType)) }}</span><span v-if="activityStore.isPending(item)" class="tag">{{ tr('전송 대기') }}</span></p>
              <h3>{{ item.title }}</h3>
              <p v-if="item.role || item.experienceId" class="input-field-help">{{ [item.role, experienceLabel(item.experienceId)].filter(Boolean).join(' · ') }}</p>
            </div>
            <span class="activity-actions">
              <button type="button" class="button-text" :aria-label="tr('{name} 수정', { name: item.title })" @click="open(item)">{{ tr('수정') }}</button>
              <button type="button" class="button-text" :aria-label="tr('{name} 삭제', { name: item.title })" @click="remove(item)">{{ tr('삭제') }}</button>
            </span>
          </div>
          <ul v-if="item.achievements.length" class="activity-points"><li v-for="point in item.achievements" :key="point">{{ point }}</li></ul>
          <p v-if="item.skillTags.length" class="activity-tags"><span v-for="skill in item.skillTags" :key="skill" class="tag">{{ skill }}</span></p>
          <p v-if="item.links.length" class="activity-links">
            <template v-for="link in item.links" :key="link">
              <a v-if="isWebUrl(link)" :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
              <span v-else>{{ link }}</span>
            </template>
          </p>
        </li>
      </ol>
    </section>
  </template>

  <Modal v-if="editor" :title="editor.base ? tr('활동 수정') : tr('활동 기록하기')" @close="editor = null">
    <label>{{ tr('제목') }}<input v-model="editor.draft.title" maxlength="200" required /></label>
    <div class="form-row">
      <label style="flex: 1">{{ tr('유형') }}<select v-model="editor.draft.activityType"><option v-for="type in ACTIVITY_TYPES" :key="type.id" :value="type.id">{{ tr(type.label) }}</option></select></label>
      <label style="flex: 1">{{ tr('역할') }}<input v-model="editor.draft.role" maxlength="200" :placeholder="tr('예: 프런트엔드 개발')" /></label>
    </div>
    <div class="form-row">
      <label style="flex: 1">{{ tr('날짜') }}<input v-model="editor.draft.date" type="date" required /></label>
      <label style="flex: 1">{{ tr('끝난 날(선택)') }}<input v-model="editor.draft.endDate" type="date" :min="editor.draft.date" :aria-invalid="dateOrderOk ? undefined : 'true'" /></label>
    </div>
    <p v-if="!dateOrderOk" class="input-field-help" data-state="error" role="alert">{{ tr('끝난 날은 시작 날짜와 같거나 그 뒤여야 해요.') }}</p>
    <label>{{ tr('연결할 경력(선택)') }}
      <select v-model="editor.draft.experienceId">
        <option value="">{{ tr('연결하지 않음') }}</option>
        <option v-for="exp in experiences" :key="exp.id" :value="exp.id">{{ exp.title }}{{ exp.role ? ' · ' + exp.role : '' }}</option>
      </select>
    </label>
    <p v-if="careerStore.state.loaded && !experiences.length" class="form-note">{{ tr('경력·포트폴리오 화면에서 경력 프로젝트를 추가하면 여기에서 연결할 수 있어요.') }}</p>
    <label>{{ tr('성과 (한 줄에 하나)') }}<textarea v-model="editor.draft.achievementsText" rows="4" :placeholder="tr('예: 결제 화면 오류 문의를 줄였다')"></textarea></label>
    <label>{{ tr('기술 (쉼표로 구분)') }}<input v-model="editor.draft.skillsText" maxlength="2000" :placeholder="tr('예: Vue 3, Spring Boot')" /></label>
    <label>{{ tr('근거 링크 (한 줄에 하나, 최대 10개)') }}<textarea v-model="editor.draft.linksText" rows="3" placeholder="https://" :aria-invalid="badLinks.length || tooManyLinks ? 'true' : undefined" aria-describedby="activity-link-help"></textarea></label>
    <p id="activity-link-help" class="input-field-help" :data-state="badLinks.length || tooManyLinks ? 'error' : undefined">{{ badLinks.length ? tr('http 또는 https로 시작하는 주소만 넣을 수 있어요: {links}', { links: badLinks.join(', ') }) : tooManyLinks ? tr('근거 링크는 10개까지 넣을 수 있어요.') : tr('PR·문서·결과물 주소를 남겨요. 서버가 이 주소를 열어 보지는 않아요.') }}</p>
    <label>{{ tr('메모(선택)') }}<textarea v-model="editor.draft.body" rows="3"></textarea></label>
    <!-- 근거 원본(PR-24)은 저장한 활동에만 잇는다. 연결은 바로 저장되고 활동 저장과는 따로다 -->
    <ActivitySourcePanel v-if="editor.base?.id && typeof editor.base.id === 'string'" :activity-id="editor.base.id" :activity-date="editor.draft.date" />
    <p v-else class="form-note">{{ tr('활동을 저장한 뒤 다시 열면 일정·실제 기록·WBS 작업을 근거로 이을 수 있어요.') }}</p>
    <p class="form-note">{{ tr('나만 보기로 저장돼요. 공유·공개 기능은 아직 없어요.') }}</p>
    <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <SaveStatus :state="saving.state" mode="server" @retry="save" />
    <template #footer>
      <button type="button" class="modal-secondary" @click="editor = null">{{ tr('취소') }}</button>
      <button type="button" class="primary" :disabled="!canSave || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.activity-signed-out { display: grid; justify-items: start; gap: var(--space-md); }
.activity-note { display: block; margin: 0 0 var(--space-md); }
.activity-filter { display: flex; flex-wrap: wrap; width: fit-content; max-width: 100%; margin-bottom: var(--space-lg); }
.activity-month { margin-bottom: var(--space-xl); }
.activity-month h2 { display: flex; align-items: baseline; gap: var(--space-sm); margin: 0 0 var(--space-sm); font-size: var(--type-title-md-size); }
.activity-month h2 small { color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 500; }
.activity-list { display: grid; gap: var(--space-sm); margin: 0; padding: 0; list-style: none; }
.activity-item { padding: var(--space-lg); min-width: 0; }
.activity-item .head { gap: var(--space-md); }
.activity-main { min-width: 0; }
.activity-main h3 { margin: var(--space-xs) 0 0; font-size: var(--type-body-size); overflow-wrap: anywhere; }
.activity-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); margin: 0; }
.activity-meta .tag, .activity-tags .tag { padding: 0 var(--space-xs); }
.activity-actions { display: flex; flex-shrink: 0; gap: var(--space-xs); }
.activity-points { margin: var(--space-sm) 0 0; padding-left: var(--space-lg); }
.activity-tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin: var(--space-sm) 0 0; }
.activity-links { display: grid; gap: var(--space-xs); margin: var(--space-sm) 0 0; font-size: var(--type-body-sm-size); overflow-wrap: anywhere; }
.figure { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
@media (max-width: 600px) { .activity-item .head { flex-wrap: wrap; } }
</style>
