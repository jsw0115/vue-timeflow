<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import Modal from '../../components/Modal.vue'
import ShareConsentModal from '../../components/ShareConsentModal.vue'
import { mediaState, currentStream, startRecording, stopRecording, stopShare, formatElapsed } from '../../store/mediaShare'

const rooms = ref([
  { id: 1, title: '스터디 크루 · 저녁 집중 세션', meta: '3명 참여중 · 다음 세션까지 4분', joined: true },
  { id: 2, title: '운동 갓생방 · 아침 루틴 집중', meta: '8명 참여중 · 07:00 시작', joined: false },
  { id: 3, title: '고요한 독서방', meta: '2명 참여중 · 21:00 시작', joined: false },
])
const activeRoom = ref(rooms.value[0])

// 참가자 타일: 내 화면은 실제 스트림, 다른 참가자는 시그널링 서버 연결 전이라 대기 상태로 표시
const participants = ref([
  { id: 'me', name: '나', self: true },
  { id: 'p1', name: '박민준', self: false },
  { id: 'p2', name: '이서연', self: false },
])

const showConsent = ref(false)
const showCreate = ref(false)
const newRoomTitle = ref('')
const videoEl = ref(null)
const recordingAllowed = ref(false)

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
function joinRoom(room) {
  rooms.value.forEach((r) => (r.joined = r.id === room.id))
  activeRoom.value = room
}
function createRoom() {
  if (!newRoomTitle.value.trim()) return
  const id = Math.max(0, ...rooms.value.map((r) => r.id)) + 1
  const room = { id, title: newRoomTitle.value.trim(), meta: '1명 참여중 · 방금 생성', joined: true }
  rooms.value.forEach((r) => (r.joined = false))
  rooms.value.unshift(room)
  activeRoom.value = room
  newRoomTitle.value = ''
  showCreate.value = false
}
onBeforeUnmount(() => stopShare())
</script>

<template>
  <div class="page-tools">
    <span></span>
    <button class="primary" @click="showCreate = true">+ 방 만들기</button>
  </div>

  <section class="card hero" style="min-height: auto; padding: 24px 28px; flex-direction: column; align-items: flex-start">
    <span class="pill">참여중인 방</span>
    <h2 style="margin: 10px 0 4px">{{ activeRoom.title }}</h2>
    <p>{{ activeRoom.meta }}</p>
    <button v-if="!mediaState.sharing" class="primary" style="margin-top: 14px" @click="showConsent = true">화면 공유하고 참여하기</button>
    <div v-else class="form-row" style="margin-top: 14px">
      <button v-if="recordingAllowed && !mediaState.recording" class="review" style="margin: 0" @click="startRecording">녹화 시작</button>
      <button v-else-if="mediaState.recording" class="review" style="margin: 0" @click="stopRecording">녹화 중지</button>
      <button class="review" style="margin: 0" @click="stopShare">공유 종료</button>
      <a v-if="mediaState.lastRecordingUrl" class="review" style="margin: 0" :href="mediaState.lastRecordingUrl" :download="mediaState.lastRecordingName">녹화본 내려받기</a>
    </div>
  </section>

  <h3 style="margin: 20px 0 12px">참가자 화면</h3>
  <div class="cofocus-grid">
    <article v-for="p in participants" :key="p.id" class="card cofocus-tile">
      <template v-if="p.self && mediaState.sharing">
        <video ref="videoEl" muted playsinline class="share-preview"></video>
        <div class="share-meta">
          <b>{{ p.name }}</b>
          <span class="tag">{{ mediaState.sourceKind === 'screen' ? '화면' : '캠' }}</span>
          <span class="share-timer">{{ formatElapsed(mediaState.elapsedSec) }}</span>
          <span v-if="mediaState.recording" class="badge danger">● 녹화</span>
        </div>
      </template>
      <template v-else>
        <div class="cofocus-placeholder">
          <span>{{ p.self ? '공유하면 여기에 내 화면이 보여요' : '연결 대기 중' }}</span>
        </div>
        <div class="share-meta"><b>{{ p.name }}</b><span class="tag">{{ p.self ? '나' : '참가자' }}</span></div>
      </template>
    </article>
  </div>
  <p class="form-note" style="margin-top: 12px">
    내 화면·녹화는 브라우저에서 실제로 동작해요. 다른 참가자에게 실시간 전송하려면 시그널링 서버(WebRTC)가 필요해서, 지금은 상대 타일이 연결 대기로 표시됩니다.
  </p>

  <h3 style="margin: 24px 0 12px">참여 가능한 방</h3>
  <section class="card">
    <div class="event" v-for="r in rooms" :key="r.id">
      <i></i>
      <span style="flex: 1"><b>{{ r.title }}</b><small>{{ r.meta }}</small></span>
      <button class="review" style="margin: 0" :disabled="r.joined" @click="joinRoom(r)">{{ r.joined ? '참여중' : '참여하기' }}</button>
    </div>
  </section>

  <ShareConsentModal v-if="showConsent" @close="showConsent = false" @started="onStarted" />
  <Modal v-if="showCreate" title="집중 방 만들기" @close="showCreate = false">
    <label>방 이름<input v-model="newRoomTitle" placeholder="예: 새벽 코딩방" autofocus /></label>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showCreate = false">취소</button>
      <button class="primary" @click="createRoom">방 만들기</button>
    </template>
  </Modal>
</template>
