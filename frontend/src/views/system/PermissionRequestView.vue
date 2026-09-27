<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const state = ref('')

/** 브라우저 권한을 실제로 요청한다. 거부되면 대체 경로를 안내한다. */
async function allow() {
  try {
    const media = navigator.mediaDevices
    if (!media?.getUserMedia) {
      state.value = '이 브라우저는 마이크를 지원하지 않아요. 텍스트로 작성해주세요.'
      return
    }
    const stream = await media.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    state.value = '권한을 허용했어요. 이제 음성으로 기록할 수 있어요.'
  } catch {
    state.value = '권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 다시 허용할 수 있어요.'
  }
}
function skip() {
  router.push({ path: '/memos', query: { new: String(Date.now()) } })
}</script>

<template>
  <div class="sheet-scrim">
    <div class="sheet">
      <div class="grabber"></div>
      <div style="width: 56px; height: 56px; border-radius: 16px; background: var(--color-surface); color: var(--color-foreground); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 1.375rem">🎙</div>
      <h2 style="font-size: 1.0625rem">마이크 접근을 허용해주세요</h2>
      <p>음성으로 메모를 남기려면 마이크 권한이 필요해요.<br />거부하셔도 텍스트로 계속 작성할 수 있어요.</p>
      <button class="primary" @click="allow">권한 허용하기</button>
      <button class="review" style="width: 100%; margin-top: 8px" @click="skip">텍스트로 계속 작성</button>
      <p v-if="state" class="form-note">{{ state }}</p>
    </div>
  </div>
</template>
