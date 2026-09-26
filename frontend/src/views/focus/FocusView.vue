<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import ShareConsentModal from '../../components/ShareConsentModal.vue'
import { mediaState, currentStream, startRecording, stopRecording, stopShare, formatElapsed } from '../../store/mediaShare'

const mode = ref('포모도로')
const sessions = ref([
  { min: 25, title: '기획안 초안 작성', time: '09:10' },
  { min: 50, title: '스터디 자료 정리', time: '10:20' },
])

/* 집중 타이머 — 실제로 흐르고, 끝나면 세션 기록에 남는다 */
const DURATION = computed(() => (mode.value === '포모도로' ? 25 * 60 : 50 * 60))
const remain = ref(25 * 60)
const running = ref(false)
const doneCount = ref(2)
const sessionTitle = ref('기획안 초안 작성')
let ticker = null

watch(mode, () => {
  stop()
  remain.value = DURATION.value
})

function tick() {
  if (remain.value <= 1) {
    finish()
    return
  }
  remain.value -= 1
}
function start() {
  if (running.value) return
  running.value = true
  ticker = setInterval(tick, 1000)
}
function pause() {
  running.value = false
  if (ticker) clearInterval(ticker)
  ticker = null
}
function stop() {
  pause()
}
function reset() {
  pause()
  remain.value = DURATION.value
}
function finish() {
  pause()
  doneCount.value += 1
  sessions.value.unshift({
    min: Math.round(DURATION.value / 60),
    title: sessionTitle.value || '집중 세션',
    time: new Date().toTimeString().slice(0, 5),
  })
  remain.value = DURATION.value
}
const clock = computed(() => String(Math.floor(remain.value / 60)).padStart(2, '0') + ':' + String(remain.value % 60).padStart(2, '0'))
const goalClock = computed(() => String(Math.floor(DURATION.value / 60)).padStart(2, '0') + ':00')
const totalMinutes = computed(() => sessions.value.reduce((a, s) => a + s.min, 0))
function hm(min) {
  return Math.floor(min / 60) + '시간 ' + (min % 60) + '분'
}
onBeforeUnmount(() => ticker && clearInterval(ticker))

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
    <div class="tabs">
      <button :class="{ selected: mode === '포모도로' }" @click="mode = '포모도로'">포모도로</button>
      <button :class="{ selected: mode === '자유 타이머' }" @click="mode = '자유 타이머'">자유 타이머</button>
    </div>
  </div>
  <div class="focus">
    <div style="text-align: center">
      <span class="pill" style="margin-bottom: 20px">‘기획안 초안 작성’ 집중 중 · 2/4 세션</span>
      <div class="orb">
        <span>남은 시간</span>
        <b>{{ clock }}</b>
        <small>목표 {{ goalClock }}</small>
        <div class="form-row" style="justify-content: center; margin-top: 16px">
          <button v-if="!running" @click="start">시작</button>
          <button v-else @click="pause">일시정지</button>
          <button @click="reset">초기화</button>
        </div>
      </div>
      <label class="orb-title"><input v-model="sessionTitle" placeholder="무엇에 집중할까요?" /></label>
      <p style="margin-top: 12px">{{ running ? '집중 중이에요 · 방해 금지 켜짐' : '시작을 누르면 타이머가 흘러요' }}</p>
    </div>
    <div>
      <h3>오늘의 집중 세션</h3>
      <p>누적 {{ hm(totalMinutes) }} · {{ sessions.length }}세션</p>
      <div class="session" v-for="(s, i) in sessions" :key="i"><b>{{ s.min }}분</b><span>{{ s.title }}</span><small>{{ s.time }}</small></div>

      <section class="card" style="margin-top: 20px">
        <div class="head">
          <div><h3>화면 공유·녹화</h3><p>동의하면 내 화면이나 캠을 세션에 올릴 수 있어요</p></div>
          <span class="badge" :class="{ ok: mediaState.sharing }">{{ mediaState.sharing ? '공유 중' : '대기' }}</span>
        </div>

        <div v-if="!mediaState.sharing" style="margin-top: 12px">
          <button class="primary" @click="showConsent = true">화면 공유 시작</button>
        </div>

        <div v-else style="margin-top: 12px">
          <video ref="videoEl" muted playsinline class="share-preview"></video>
          <div class="share-meta">
            <span class="tag">{{ mediaState.sourceKind === 'screen' ? '화면' : '캠' }}</span>
            <span class="share-timer">{{ formatElapsed(mediaState.elapsedSec) }}</span>
            <span v-if="mediaState.recording" class="badge danger">● 녹화 중</span>
          </div>
          <div class="form-row" style="margin-top: 10px">
            <button v-if="recordingAllowed && !mediaState.recording" class="review" style="margin: 0; flex: 1" @click="startRecording">녹화 시작</button>
            <button v-else-if="mediaState.recording" class="review" style="margin: 0; flex: 1" @click="stopRecording">녹화 중지</button>
            <button class="review" style="margin: 0; flex: 1" @click="stopShare">공유 종료</button>
          </div>
          <p v-if="!recordingAllowed" class="form-note" style="margin-top: 8px">녹화는 동의하지 않아 꺼져 있어요. 다시 공유를 시작하면 선택할 수 있어요.</p>
          <a v-if="mediaState.lastRecordingUrl" class="review" style="display: inline-block; margin-top: 10px" :href="mediaState.lastRecordingUrl" :download="mediaState.lastRecordingName">녹화본 내려받기</a>
        </div>
        <p v-if="mediaState.error" class="form-error">{{ mediaState.error }}</p>
      </section>
    </div>
  </div>

  <ShareConsentModal v-if="showConsent" @close="showConsent = false" @started="onStarted" />
</template>
