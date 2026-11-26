<script setup>
import { tr } from '../../store/locale'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const state = ref('')

/** 브라우저 권한을 실제로 요청한다. 거부되면 대체 경로를 안내한다. */
async function allow() {
  try {
    const media = navigator.mediaDevices
    if (!media?.getUserMedia) {
      state.value = tr('이 브라우저는 마이크를 지원하지 않아요. 텍스트로 작성해주세요.')
      return
    }
    const stream = await media.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    // 음성 기록은 아직 연결되지 않았다(FD-84). 예전 문구 "이제 음성으로 기록할 수 있어요"는 사실과 달라 고쳤다(PR-32 16단계)
    state.value = tr('권한을 허용했어요. 음성 기록은 아직 준비 중이라 지금은 텍스트로 작성해 주세요.')
  } catch {
    state.value = tr('권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 다시 허용할 수 있어요.')
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
      <h2 style="font-size: 1.0625rem">{{ tr('마이크 접근을 허용해주세요') }}</h2>
      <p>{{ tr('음성으로 메모를 남기려면 마이크 권한이 필요해요.') }}<br />{{ tr('거부하셔도 텍스트로 계속 작성할 수 있어요.') }}</p>
      <button class="primary" @click="allow">{{ tr('권한 허용하기') }}</button>
      <button class="review" style="width: 100%; margin-top: 8px" @click="skip">{{ tr('텍스트로 계속 작성') }}</button>
      <p v-if="state" class="form-note">{{ state }}</p>
    </div>
  </div>
</template>
