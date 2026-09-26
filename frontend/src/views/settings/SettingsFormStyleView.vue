<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FIELD_CATALOG, modeState, modeMeta, currentVersion, saveNewVersion } from '../../store/modeProfiles'
import { WIDGET_CATALOG, readLayout, writeLayout, templateFor } from '../../store/dashboard'
import { STATS_CATALOG, readStatsPortlets, writeStatsPortlets, statsTemplateFor } from '../../store/statsPortlets'

const router = useRouter()
const modes = ['J', 'P', 'B']
const domains = Object.keys(FIELD_CATALOG)

const tab = ref('form') // form | screen
const editingMode = ref(modeState.activeMode)
const editingDomain = ref('event')
const draftFields = ref(cloneCurrentFields())
const justSavedVersion = ref(null)

function cloneCurrentFields() {
  return JSON.parse(JSON.stringify(currentVersion(editingMode.value).fields))
}
function switchMode(m) {
  editingMode.value = m
  draftFields.value = cloneCurrentFields()
  justSavedVersion.value = null
  homeLayout.value = readLayout(m)
  statsLayout.value = readStatsPortlets(m)
}
function toggleField(domain, key, locked) {
  if (locked) return
  const list = draftFields.value[domain]
  const i = list.indexOf(key)
  if (i >= 0) list.splice(i, 1)
  else list.push(key)
  justSavedVersion.value = null
}
function isOn(domain, key) {
  return draftFields.value[domain].includes(key)
}
const isDirty = computed(
  () => JSON.stringify(draftFields.value) !== JSON.stringify(currentVersion(editingMode.value).fields),
)
function save() {
  justSavedVersion.value = saveNewVersion(editingMode.value, draftFields.value).version
}
const versions = computed(() => [...modeState.profiles[editingMode.value].versions].reverse())
function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function fieldLabels(domain, keys) {
  const catalog = FIELD_CATALOG[domain].fields
  return keys.map((k) => catalog.find((f) => f.key === k)?.label ?? k).join(' · ')
}
const onCount = computed(() => {
  const cat = FIELD_CATALOG[editingDomain.value].fields
  return cat.filter((f) => f.locked || isOn(editingDomain.value, f.key)).length
})

/* ---------- 화면 구성(포틀릿) ---------- */
const SIZE_LABEL = { sm: '작게', md: '보통', lg: '크게' }
const SIZE_ORDER = ['sm', 'md', 'lg']
const homeLayout = ref(readLayout(editingMode.value))
const statsLayout = ref(readStatsPortlets(editingMode.value))

function toggleHome(id) {
  const w = homeLayout.value.find((x) => x.id === id)
  if (w) w.visible = !w.visible
  writeLayout(editingMode.value, homeLayout.value)
}
function cycleHomeSize(id) {
  const w = homeLayout.value.find((x) => x.id === id)
  if (!w) return
  w.size = SIZE_ORDER[(SIZE_ORDER.indexOf(w.size) + 1) % SIZE_ORDER.length]
  writeLayout(editingMode.value, homeLayout.value)
}
function moveHome(id, delta) {
  const i = homeLayout.value.findIndex((x) => x.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= homeLayout.value.length) return
  const [item] = homeLayout.value.splice(i, 1)
  homeLayout.value.splice(j, 0, item)
  writeLayout(editingMode.value, homeLayout.value)
}
function toggleStats(id) {
  const p = statsLayout.value.find((x) => x.id === id)
  if (p) p.visible = !p.visible
  writeStatsPortlets(editingMode.value, statsLayout.value)
}
function moveStats(id, delta) {
  const i = statsLayout.value.findIndex((x) => x.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= statsLayout.value.length) return
  const [item] = statsLayout.value.splice(i, 1)
  statsLayout.value.splice(j, 0, item)
  writeStatsPortlets(editingMode.value, statsLayout.value)
}
function resetScreen() {
  homeLayout.value = templateFor(editingMode.value)
  statsLayout.value = statsTemplateFor(editingMode.value)
  writeLayout(editingMode.value, homeLayout.value)
  writeStatsPortlets(editingMode.value, statsLayout.value)
}
const homeOn = computed(() => homeLayout.value.filter((w) => w.visible).length)
const statsOn = computed(() => statsLayout.value.filter((p) => p.visible).length)
</script>

<template>
  <section class="card setting-content form-style">
    <div class="crumbs"><a @click="router.push('/settings/env')">환경 설정</a> / 글양식 · 화면 구성</div>

    <div class="setting-head">
      <div>
        <h2>모드별 글양식 · 화면 구성</h2>
        <p>J/P/B 모드마다 작성 항목과 화면 구성이 달라져요. 기본 템플릿에서 시작해 직접 바꿀 수 있어요.</p>
      </div>
      <span class="badge" :class="editingMode === modeState.activeMode ? 'ok' : ''">
        {{ editingMode === modeState.activeMode ? '현재 사용중인 모드' : '다른 모드 편집중' }}
      </span>
    </div>

    <div class="mode-picker">
      <button v-for="m in modes" :key="m" :class="{ selected: editingMode === m }" @click="switchMode(m)">
        <b>{{ m }}</b>
        <span>{{ modeMeta(m).name }}<small>{{ modeMeta(m).desc }}</small></span>
      </button>
    </div>

    <div class="tabs" style="width: fit-content; margin: 20px 0 18px">
      <button :class="{ selected: tab === 'form' }" @click="tab = 'form'">글양식</button>
      <button :class="{ selected: tab === 'screen' }" @click="tab = 'screen'">화면 구성</button>
    </div>

    <!-- ============ 글양식 ============ -->
    <template v-if="tab === 'form'">
      <div class="callout">
        <b>이미 작성한 글은 바뀌지 않아요</b>
        <p>
          여기서 바꾼 설정은 <b>지금부터 새로 쓰는 글</b>부터 적용돼요. 과거에 쓴 일정·루틴·업무는 작성 당시의
          양식 그대로 보존되고, 이후 설정을 다시 바꿔도 수정되지 않아요.
        </p>
      </div>

      <div class="domain-tabs">
        <button v-for="d in domains" :key="d" :class="{ selected: editingDomain === d }" @click="editingDomain = d">
          {{ FIELD_CATALOG[d].label }}
        </button>
        <span class="domain-count">표시 항목 {{ onCount }}개</span>
      </div>

      <div class="field-list">
        <label class="field-toggle" v-for="f in FIELD_CATALOG[editingDomain].fields" :key="f.key" :class="{ locked: f.locked }">
          <span>
            <b>{{ f.label }}</b>
            <small v-if="f.locked">항상 표시되는 필수 항목이에요</small>
            <small v-else>{{ modeMeta(editingMode).name }} 작성 화면에 이 항목을 보여줘요</small>
          </span>
          <button
            type="button"
            class="switch"
            :class="{ on: f.locked || isOn(editingDomain, f.key) }"
            :disabled="f.locked"
            @click="toggleField(editingDomain, f.key, f.locked)"
          >
            <i />
          </button>
        </label>
      </div>

      <div class="form-style-save">
        <button class="primary" :disabled="!isDirty" @click="save">이 모드에 새 버전으로 저장</button>
        <span v-if="justSavedVersion" class="badge new">v{{ justSavedVersion }}로 저장했어요 · 이제부터 새 글에 적용돼요</span>
        <span v-else-if="isDirty" class="badge warn">저장하지 않은 변경사항이 있어요</span>
      </div>

      <div class="version-history">
        <h3>{{ modeMeta(editingMode).name }} 버전 기록</h3>
        <div class="version-item" v-for="(v, i) in versions" :key="v.version">
          <div class="version-item-head">
            <b>v{{ v.version }}</b>
            <span class="badge" :class="i === 0 ? 'ok' : ''">{{ i === 0 ? '현재 적용 중' : '이전 버전 · 수정 불가' }}</span>
            <small>{{ formatDate(v.updatedAt) }}</small>
          </div>
          <p v-for="d in domains" :key="d">
            <span class="tag">{{ FIELD_CATALOG[d].label }}</span> {{ fieldLabels(d, v.fields[d]) || '기본 항목만' }}
          </p>
        </div>
      </div>
    </template>

    <!-- ============ 화면 구성 ============ -->
    <template v-else>
      <div class="callout">
        <b>모드마다 화면이 다르게 시작해요</b>
        <p>
          J형은 계획·진척 지표를 촘촘히, P형은 지금 할 것만 크게, 밸런스형은 그 중간으로 기본 구성이 잡혀 있어요.
          아래에서 바꾸면 <b>이 모드에만</b> 저장되고, 다른 모드 구성은 그대로 남아요.
        </p>
      </div>

      <div class="section-label">홈 포틀릿 · {{ homeOn }}개 표시중</div>
      <div class="portlet-config">
        <div v-for="(w, i) in homeLayout" :key="w.id" class="portlet-row">
          <label class="portlet-toggle">
            <input type="checkbox" :checked="w.visible" @change="toggleHome(w.id)" />
            <span><b>{{ WIDGET_CATALOG[w.id].title }}</b><small>{{ WIDGET_CATALOG[w.id].desc }}</small></span>
          </label>
          <button class="review" style="margin: 0" @click="cycleHomeSize(w.id)">{{ SIZE_LABEL[w.size] }}</button>
          <button class="review" style="margin: 0" :disabled="i === 0" @click="moveHome(w.id, -1)">↑</button>
          <button class="review" style="margin: 0" :disabled="i === homeLayout.length - 1" @click="moveHome(w.id, 1)">↓</button>
        </div>
      </div>

      <div class="section-label" style="margin-top: 20px">통계 포틀릿 · {{ statsOn }}개 표시중</div>
      <div class="portlet-config">
        <div v-for="(p, i) in statsLayout" :key="p.id" class="portlet-row">
          <label class="portlet-toggle">
            <input type="checkbox" :checked="p.visible" @change="toggleStats(p.id)" />
            <span><b>{{ STATS_CATALOG[p.id].title }}</b><small>{{ STATS_CATALOG[p.id].desc }}</small></span>
          </label>
          <span class="tag">{{ STATS_CATALOG[p.id].kind }}</span>
          <button class="review" style="margin: 0" :disabled="i === 0" @click="moveStats(p.id, -1)">↑</button>
          <button class="review" style="margin: 0" :disabled="i === statsLayout.length - 1" @click="moveStats(p.id, 1)">↓</button>
        </div>
      </div>

      <div class="form-style-save">
        <button class="review" style="margin: 0" @click="resetScreen">{{ modeMeta(editingMode).name }} 기본 구성으로 되돌리기</button>
        <span class="badge">바꾸는 즉시 저장돼요</span>
      </div>
    </template>
  </section>
</template>
