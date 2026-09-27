<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import { profileModal, profileOf, closeProfile, blockFromProfile } from '../store/people'
import { modeMeta } from '../store/modeProfiles'

/** 어느 화면에서든 이름 옆 ⓘ를 누르면 뜨는 공통 프로필 모달 */
const router = useRouter()
const p = computed(() => profileOf(profileModal.name))

function onBlock() {
  const label = p.value.blocked ? '차단을 해제할까요?' : p.value.name + '님을 차단할까요? 모든 그룹에서 함께 제외돼요.'
  if (!window.confirm(label)) return
  if (!blockFromProfile(p.value.name)) window.alert('주소록에 없는 사용자는 차단할 수 없어요.')
}
function onChat() {
  closeProfile()
  router.push('/chat')
}

</script>

<template>
  <Modal v-if="profileModal.open" title="프로필" @close="closeProfile">
    <div class="profile-head">
      <i class="profile-avatar">{{ p.name[0] }}</i>
      <div style="min-width: 0">
        <b class="profile-name">{{ p.name }}</b>
        <p style="margin: 2px 0 0">{{ p.intro || '소개가 없어요' }}</p>
      </div>
      <span v-if="p.blocked" class="badge danger">차단됨</span>
    </div>

    <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin: 16px 0">
      <article><span>연속 기록</span><b class="figure">{{ p.streak }}<small>일</small></b></article>
      <article><span>사용 모드</span><b class="figure" style="font-size: 1.0625rem">{{ p.mode }}</b><small>{{ modeMeta(p.mode).name }}</small></article>
      <article><span>가입</span><b class="figure" style="font-size: 1.0625rem">{{ p.joined }}</b></article>
    </div>

    <div class="profile-rows">
      <div><span>관계</span><b>{{ p.relation }}</b></div>
      <div><span>메일</span><b>{{ p.email }}</b></div>
      <div>
        <span>함께한 그룹</span>
        <b>
          <template v-if="p.groups.length"><span v-for="g in p.groups" :key="g" class="tag">{{ g }}</span></template>
          <template v-else>없음</template>
        </b>
      </div>
    </div>

    <p class="form-note">업무·경력 기록은 프로필에 표시되지 않아요. 본인만 볼 수 있습니다.</p>

    <div class="form-row">
      <button class="primary" style="flex: 1" @click="onChat">메시지 보내기</button>
      <button class="review" style="margin: 0" @click="onBlock">{{ p.blocked ? '차단 해제' : '차단' }}</button>
    </div>
  </Modal>
</template>
