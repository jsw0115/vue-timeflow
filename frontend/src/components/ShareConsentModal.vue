<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import { giveConsent, startShare, mediaState } from '../store/mediaShare'

const emit = defineEmits(['close', 'started'])
const agreeShare = ref(false)
const agreeRecord = ref(false)
const kind = ref('screen')

async function proceed() {
  if (!agreeShare.value) return
  giveConsent()
  const ok = await startShare(kind.value)
  if (ok) {
    emit('started', { kind: kind.value, allowRecording: agreeRecord.value })
    emit('close')
  }
}
</script>

<template>
  <Modal title="화면 공유·녹화 동의" wide @close="$emit('close')">
    <p class="form-note" style="margin: 0 0 12px">
      집중 세션을 함께 보려면 내 화면 또는 캠 영상을 공유해야 해요. 동의한 뒤 브라우저 권한 창에서 공유할 화면을 직접 선택합니다.
    </p>

    <label>공유할 소스</label>
    <div class="filter" style="width: fit-content; margin-top: 6px">
      <button type="button" :class="{ selected: kind === 'screen' }" @click="kind = 'screen'">화면 공유</button>
      <button type="button" :class="{ selected: kind === 'camera' }" @click="kind = 'camera'">캠 공유</button>
    </div>

    <div class="callout" style="margin-top: 16px">
      <b>공유되는 범위를 확인해주세요</b>
      <p>선택한 화면(또는 캠)의 영상만 전송돼요. 알림 팝업이나 다른 창이 함께 노출될 수 있으니, 공유 전 민감한 창을 닫는 걸 권장해요.</p>
    </div>

    <label class="task" style="border: 0"><input type="checkbox" v-model="agreeShare" /><span style="flex: 1"><b>화면·캠 공유에 동의합니다</b><small>동의해야 세션에 영상을 올릴 수 있어요 (필수)</small></span></label>
    <label class="task" style="border: 0"><input type="checkbox" v-model="agreeRecord" /><span style="flex: 1"><b>세션 녹화에 동의합니다</b><small>녹화본은 내 기기에만 저장되고, 원할 때 파일로 내려받을 수 있어요 (선택)</small></span></label>

    <p v-if="mediaState.error" style="color: #b23b3b; font-weight: 600; margin-top: 8px">{{ mediaState.error }}</p>
    <button class="primary" :disabled="!agreeShare" @click="proceed">동의하고 공유 시작</button>
  </Modal>
</template>
