import { reactive } from 'vue'

/**
 * 화면 공유 / 캠 공유 / 녹화를 담당하는 공용 상태.
 * 실제 브라우저 API(getDisplayMedia·getUserMedia·MediaRecorder)를 사용하므로
 * 사용자가 브라우저 권한 창에서 동의해야만 스트림이 시작된다.
 *
 * 주의: 여기서 만드는 스트림은 "내 화면/캠의 로컬 미리보기 + 로컬 녹화"까지다.
 * 다른 참가자에게 실시간 전송하려면 시그널링 서버(WebSocket) + WebRTC PeerConnection이 필요하며,
 * 그 부분은 아직 백엔드가 없어 참가자 타일은 대기 상태로 표시한다.
 */
export const mediaState = reactive({
  consented: false,
  sharing: false,
  sourceKind: null, // 'screen' | 'camera'
  recording: false,
  error: '',
  elapsedSec: 0,
  lastRecordingUrl: '',
  lastRecordingName: '',
})

let stream = null
let recorder = null
let chunks = []
let timer = null

export function currentStream() {
  return stream
}

function startTimer() {
  stopTimer()
  mediaState.elapsedSec = 0
  timer = setInterval(() => {
    mediaState.elapsedSec += 1
  }, 1000)
}
function stopTimer() {
  if (timer) clearInterval(timer)
  timer = null
}

export function formatElapsed(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function giveConsent() {
  mediaState.consented = true
  mediaState.error = ''
}

export async function startShare(kind = 'screen') {
  if (!mediaState.consented) {
    mediaState.error = '먼저 화면 공유·녹화 동의가 필요해요.'
    return false
  }
  if (!navigator.mediaDevices) {
    mediaState.error = '이 브라우저에서는 화면 공유를 지원하지 않아요.'
    return false
  }
  try {
    stream =
      kind === 'screen'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    mediaState.sharing = true
    mediaState.sourceKind = kind
    mediaState.error = ''
    startTimer()
    // 사용자가 브라우저 UI에서 "공유 중지"를 누른 경우도 상태에 반영한다
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => stopShare())
    })
    return true
  } catch (e) {
    mediaState.error = e?.name === 'NotAllowedError' ? '공유 권한이 거부됐어요.' : '공유를 시작하지 못했어요.'
    return false
  }
}

export function startRecording() {
  if (!stream) {
    mediaState.error = '먼저 화면 또는 캠 공유를 시작해주세요.'
    return
  }
  if (typeof MediaRecorder === 'undefined') {
    mediaState.error = '이 브라우저에서는 녹화를 지원하지 않아요.'
    return
  }
  chunks = []
  recorder = new MediaRecorder(stream)
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
    if (mediaState.lastRecordingUrl) URL.revokeObjectURL(mediaState.lastRecordingUrl)
    mediaState.lastRecordingUrl = URL.createObjectURL(blob)
    mediaState.lastRecordingName = `timeflow-focus-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.webm`
    mediaState.recording = false
  }
  recorder.start()
  mediaState.recording = true
  mediaState.error = ''
}

export function stopRecording() {
  if (recorder && recorder.state !== 'inactive') recorder.stop()
}

export function stopShare() {
  stopRecording()
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  mediaState.sharing = false
  mediaState.sourceKind = null
  stopTimer()
}
