<script setup>
// 집중 타이머 세 가지(포모도로·카운트다운·스톱워치)를 실제 기록 API로 서버 시각에 맞춰 돌리고(PR-09 2단계), 화면 공유·녹화를 제공한다.
import { tr } from '../../store/locale'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ShareConsentModal from '../../components/ShareConsentModal.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { useRecording } from '../../features/recording/useRecording.js'
import { recordingSeconds, targetEndAt } from '../../features/recording/recordingClient.mjs'
import { MODES, POMODORO_MINUTES, modeLabel, minutesError, clockText, timerStatus, dateIn, todayTimerRecords } from '../../features/recording/timer.mjs'
import { formatMinutes } from '../../features/stats/statsClient.mjs'
import { mediaState, currentStream, startRecording, stopRecording, stopShare, formatElapsed } from '../../store/mediaShare'

const { active, records, pending, error, busy, loaded, saved, elapsed, serverNow, startTimer, pause, resume, finish, retry, cancel } = useRecording()
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
const mode = ref('pomodoro')
const countdownMinutes = ref(30)
const title = ref('')

// 진행 중 기록이 있으면 그 기록의 종류·목표를 보인다. 플래너에서 시작한 기록은 모드가 없어 목표 없는 기록이다
const shownMode = computed(() => (active.value ? active.value.mode ?? null : mode.value))
const plannedMinutes = computed(() => (mode.value === 'pomodoro' ? POMODORO_MINUTES : mode.value === 'countdown' ? countdownMinutes.value : null))
const target = computed(() => (active.value ? active.value.targetMinutes ?? null : plannedMinutes.value))
const inputError = computed(() => (!active.value && mode.value === 'countdown' ? minutesError(countdownMinutes.value) : ''))
// 포모도로·카운트다운은 남은 시간을, 스톱워치·플래너 기록은 기록한 시간을 보인다. 분 입력이 틀리면 시계를 비운다
const timed = computed(() => (active.value ? !!active.value.targetMinutes : mode.value !== 'stopwatch'))
const clock = computed(() => (inputError.value ? '--:--' : clockText(timed.value ? target.value * 60 - elapsed.value : elapsed.value)))
const clockLabel = computed(() => tr(timed.value ? '남은 시간' : '기록한 시간'))
const goal = computed(() => (!timed.value ? tr('목표 없음') : inputError.value ? tr('목표를 정해 주세요') : tr('목표 {time}', { time: clockText(target.value * 60) })))
const status = computed(() => timerStatus(active.value, pending.value))
const finishing = computed(() => pending.value?.kind === 'finish')

// 목표에 닿으면 목표 도달 시각으로 끝낸다. 화면을 닫았다가 늦게 열어도 그 뒤 시간은 기록하지 않는다(UF-121)
let autoFinished = ''
watch(serverNow, (at) => {
  const end = targetEndAt(active.value)
  if (!end || busy.value || pending.value || autoFinished === active.value.id || at < Date.parse(end)) return
  autoFinished = active.value.id
  finish(end)
})

function onStart() {
  if (inputError.value) return
  startTimer(title.value.trim() || tr('집중 시간'), { mode: mode.value, targetMinutes: plannedMinutes.value ?? undefined })
}
function onCancel() {
  if (window.confirm(tr('기록하지 않고 타이머를 취소할까요? 지금까지 잰 시간은 남지 않아요.'))) cancel()
}

const today = computed(() => dateIn(serverNow.value, zone))
const sessions = computed(() => todayTimerRecords(records.value, today.value, zone))
const minutesOf = (row) => Math.floor(recordingSeconds(row) / 60)
const totalMinutes = computed(() => sessions.value.reduce((sum, row) => sum + minutesOf(row), 0))
const timeOf = (value) => new Date(value).toTimeString().slice(0, 5)

const showConsent = ref(false)
const videoEl = ref(null)
const recordingAllowed = ref(false)

// 공유가 시작되면 로컬 미리보기 <video>에 스트림을 연결한다
watch(
  () => mediaState.sharing,
  async (sharing) => {
    if (!sharing) return
    await Promise.resolve()
    if (videoEl.value) {
      videoEl.value.srcObject = currentStream()
      videoEl.value.play?.().catch(() => {})
    }
  },
)
function onStarted({ allowRecording }) {
  recordingAllowed.value = allowRecording
}
onBeforeUnmount(() => stopShare())
</script>

<template>
  <div class="toolbar">
    <span></span>
    <div class="tabs" role="group" :aria-label="tr('타이머 종류')">
      <button v-for="item in MODES" :key="item.id" type="button" :class="{ selected: shownMode === item.id }" :aria-pressed="shownMode === item.id ? 'true' : 'false'" :disabled="!!active || busy" @click="mode = item.id">{{ tr(item.label) }}</button>
    </div>
  </div>
  <div class="focus">
    <ShareSignIn v-if="!session.userId" message="집중 타이머는 잰 시간을 계정에 실제 기록으로 남겨요. 로그인하면 시작할 수 있어요." />
    <div v-else class="timer">
      <span class="pill" role="status">{{ tr(status) }}{{ active && !active.mode ? ' · ' + tr('플래너에서 시작한 기록') : '' }}</span>
      <div class="orb" :aria-busy="busy ? 'true' : undefined">
        <span>{{ clockLabel }}</span>
        <b role="timer">{{ clock }}</b>
        <small>{{ goal }}</small>
        <div class="form-row orb-actions">
          <button v-if="finishing" type="button" :disabled="busy" @click="retry">{{ busy ? tr('저장하는 중') : tr('기록 저장 다시 시도') }}</button>
          <button v-else-if="!active" type="button" :disabled="busy || !loaded || !!inputError" @click="onStart">{{ busy || !loaded ? tr('서버 확인 중') : tr('시작') }}</button>
          <template v-else>
            <button v-if="active.state === 'PAUSED'" type="button" :disabled="busy" @click="resume">{{ tr('다시 시작') }}</button>
            <button v-else type="button" :disabled="busy" @click="pause">{{ tr('일시정지') }}</button>
            <button type="button" :disabled="busy" @click="finish()">{{ busy ? tr('저장하는 중') : tr('끝내고 저장') }}</button>
          </template>
        </div>
      </div>
      <p v-if="active" class="timer-title">{{ active.title }}</p>
      <label v-else class="orb-title"><input v-model="title" maxlength="200" :placeholder="tr('무엇에 집중할까요?')" :aria-label="tr('집중할 일')" /></label>
      <label v-if="!active && mode === 'countdown'" class="input-field timer-minutes">{{ tr('카운트다운 시간(분)') }}
        <input v-model.number="countdownMinutes" type="number" min="1" max="1440" step="1" inputmode="numeric" :aria-invalid="inputError ? 'true' : undefined" aria-describedby="countdown-help" />
        <span id="countdown-help" class="input-field-help" :data-state="inputError ? 'error' : undefined">{{ inputError ? tr(inputError) : tr('1분부터 1,440분까지 정할 수 있어요.') }}</span>
      </label>
      <button v-if="active && !finishing" type="button" class="button-secondary timer-cancel" :disabled="busy" @click="onCancel">{{ tr('기록하지 않고 취소') }}</button>
      <p v-if="error" class="form-error" role="alert">{{ tr(error) }}</p>
      <p v-if="saved" role="status">{{ tr('{title} {time}을(를) 실제 기록으로 저장했어요.', { title: saved.title, time: formatMinutes(minutesOf(saved), tr) }) }} <RouterLink :to="{ path: '/planner/daily', query: { date: dateIn(Date.parse(saved.startedAt), zone), recording: saved.id } }">{{ tr('플래너에서 보기') }}</RouterLink></p>
      <p>{{ tr('OS 방해 금지 제어는 지원하지 않습니다. 필요한 경우 기기 설정에서 직접 켜주세요.') }}</p>
    </div>
    <div>
      <h3>{{ tr('오늘 집중 기록') }}</h3>
      <p>{{ tr('타이머로 잰 시간은 일시정지를 빼고 계정에 실제 기록으로 저장돼요. 통계의 실제 기록 시간과 집중 시간에 함께 들어가요.') }}</p>
      <template v-if="session.userId && loaded">
        <p v-if="sessions.length">{{ tr('합계') }} <span class="figure-text">{{ formatMinutes(totalMinutes, tr) }}</span> · {{ tr('{n}회', { n: sessions.length }) }}</p>
        <div class="session" v-for="row in sessions" :key="row.id"><b>{{ tr('{n}분', { n: minutesOf(row) }) }}</b><span>{{ row.title }} · {{ tr(modeLabel(row.mode)) }}</span><small>{{ timeOf(row.startedAt) }}</small></div>
        <div v-if="!sessions.length" class="empty-state" role="status"><p>{{ tr('오늘 남긴 집중 기록이 아직 없어요. 타이머를 시작해 보세요.') }}</p></div>
      </template>

      <section class="card" style="margin-top: 20px">
        <div class="head">
          <div><h3>{{ tr('화면 공유·녹화') }}</h3><p>{{ tr('동의하면 내 화면이나 캠을 세션에 올릴 수 있어요') }}</p></div>
          <span class="badge" :class="{ ok: mediaState.sharing }">{{ mediaState.sharing ? tr('공유 중') : tr('대기') }}</span>
        </div>

        <div v-if="!mediaState.sharing" style="margin-top: 12px">
          <button class="primary" @click="showConsent = true">{{ tr('화면 공유 시작') }}</button>
        </div>

        <div v-else style="margin-top: 12px">
          <video ref="videoEl" muted playsinline class="share-preview"></video>
          <div class="share-meta">
            <span class="tag">{{ mediaState.sourceKind === 'screen' ? tr('화면') : tr('캠') }}</span>
            <span class="share-timer">{{ formatElapsed(mediaState.elapsedSec) }}</span>
            <span v-if="mediaState.recording" class="badge danger">{{ tr('● 녹화 중') }}</span>
          </div>
          <div class="form-row" style="margin-top: 10px">
            <button v-if="recordingAllowed && !mediaState.recording" class="review" style="margin: 0; flex: 1" @click="startRecording">{{ tr('녹화 시작') }}</button>
            <button v-else-if="mediaState.recording" class="review" style="margin: 0; flex: 1" @click="stopRecording">{{ tr('녹화 중지') }}</button>
            <button class="review" style="margin: 0; flex: 1" @click="stopShare">{{ tr('공유 종료') }}</button>
          </div>
          <p v-if="!recordingAllowed" class="form-note" style="margin-top: 8px">{{ tr('녹화는 동의하지 않아 꺼져 있어요. 다시 공유를 시작하면 선택할 수 있어요.') }}</p>
          <a v-if="mediaState.lastRecordingUrl" class="review" style="display: inline-block; margin-top: 10px" :href="mediaState.lastRecordingUrl" :download="mediaState.lastRecordingName">{{ tr('녹화본 내려받기') }}</a>
        </div>
        <p v-if="mediaState.error" class="form-error">{{ tr(mediaState.error) }}</p>
      </section>
    </div>
  </div>

  <ShareConsentModal v-if="showConsent" @close="showConsent = false" @started="onStarted" />
</template>

<style scoped>
.timer { text-align: center; min-width: 0; }
.timer .pill { margin-bottom: var(--space-xxl); }
.orb-actions { justify-content: center; margin-top: var(--space-xl); }
/* DESIGN.md 4장 공통 규칙: 비활성은 0.45 불투명도, 처리 중은 progress 커서 */
.orb-actions button:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }
.orb[aria-busy='true'] .orb-actions button { cursor: progress; }
.timer-title { margin-top: var(--space-lg); font-weight: 600; word-break: keep-all; overflow-wrap: anywhere; }
.timer-minutes { width: min(260px, 100%); margin: var(--space-lg) auto 0; text-align: left; }
.timer-cancel { margin-top: var(--space-lg); }
.session b, .session small, .figure-text { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
</style>
