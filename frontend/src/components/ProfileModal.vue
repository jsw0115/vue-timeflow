<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from './Modal.vue'
import { tr, bodyLocale, unit } from '../store/locale'
import { modeText } from '../features/i18n/locale.mjs'
import { profileModal, profileOf, closeProfile, blockFromProfile } from '../store/people'
import { modeMeta } from '../store/modeProfiles'

/** 어느 화면에서든 이름 옆 ⓘ를 누르면 뜨는 공통 프로필 모달 */
const router = useRouter()
const p = computed(() => profileOf(profileModal.name))
// 보기 전용 창이라 화면이 바뀌면(뒤로 가기 포함) 닫는다(IMP-025)
const route = useRoute()
watch(() => route.path, () => { if (profileModal.open) closeProfile() })

function onBlock() {
  const label = p.value.blocked ? tr('차단을 해제할까요?') : tr('{name}님을 차단할까요? 모든 그룹에서 함께 제외돼요.', { name: p.value.name })
  if (!window.confirm(label)) return
  if (!blockFromProfile(p.value.name)) window.alert(tr('주소록에 없는 사용자는 차단할 수 없어요.'))
}
function onChat() {
  closeProfile()
  router.push('/chat')
}

</script>

<template>
  <Modal v-if="profileModal.open" :title="tr('프로필')" @close="closeProfile">
    <div class="profile-head">
      <i class="profile-avatar">{{ p.name[0] }}</i>
      <div style="min-width: 0">
        <b class="profile-name">{{ p.name }}</b>
        <p style="margin: 2px 0 0">{{ p.intro || tr('소개가 없어요') }}</p>
      </div>
      <span v-if="p.blocked" class="badge danger">{{ tr('차단됨') }}</span>
    </div>

    <div class="metrics" style="--metric-cols: 3; margin: 16px 0">
      <article><span>{{ tr('연속 기록') }}</span><b class="figure">{{ p.streak }}<small>{{ unit('일', p.streak) }}</small></b></article>
      <article><span>{{ tr('사용 모드') }}</span><b class="figure" style="font-size: 1.0625rem">{{ p.mode }}</b><small>{{ modeText(p.mode, bodyLocale, modeMeta(p.mode)).name }}</small></article>
      <article><span>{{ tr('가입') }}</span><b class="figure" style="font-size: 1.0625rem">{{ p.joined }}</b></article>
    </div>

    <div class="profile-rows">
      <div><span>{{ tr('관계') }}</span><b>{{ tr(p.relation) }}</b></div>
      <div><span>{{ tr('메일') }}</span><b>{{ p.email }}</b></div>
      <div>
        <span>{{ tr('함께한 그룹') }}</span>
        <b>
          <template v-if="p.groups.length"><span v-for="g in p.groups" :key="g" class="tag">{{ g }}</span></template>
          <template v-else>{{ tr('없음') }}</template>
        </b>
      </div>
    </div>

    <p class="form-note">{{ tr('업무·경력 기록은 프로필에 표시되지 않아요. 본인만 볼 수 있습니다.') }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="closeProfile">{{ tr('취소') }}</button>
      <div class="form-row">
      <button class="primary" style="flex: 1" @click="onChat">{{ tr('메시지 보내기') }}</button>
      <button class="review" style="margin: 0" @click="onBlock">{{ p.blocked ? tr('차단 해제') : tr('차단') }}</button>
          </div>
    </template>
  </Modal>
</template>
