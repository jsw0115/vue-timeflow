<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'

/** 프로필 — 닉네임 저장과 비밀번호 변경이 실제로 동작한다. */
const saved = ref({ nickname: '지수', email: 'jisu@timebar.app' })
const draft = ref({ ...saved.value })
const notice = ref('')

const isDirty = computed(() => draft.value.nickname.trim() !== saved.value.nickname)
const canSave = computed(() => Boolean(draft.value.nickname.trim()) && isDirty.value)

function save() {
  if (!canSave.value) return
  saved.value = { ...saved.value, nickname: draft.value.nickname.trim() }
  flash('프로필을 저장했어요.')
}
function flash(text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 2500)
}

/* 비밀번호 변경 */
const showPassword = ref(false)
const pw = ref({ current: '', next: '', confirm: '' })
const pwError = computed(() => {
  if (!pw.value.current) return '현재 비밀번호를 입력해주세요.'
  if (pw.value.next.length < 8) return '새 비밀번호는 8자 이상이어야 해요.'
  if (pw.value.next !== pw.value.confirm) return '새 비밀번호가 서로 달라요.'
  return ''
})
function openPassword() {
  pw.value = { current: '', next: '', confirm: '' }
  showPassword.value = true
}
function changePassword() {
  if (pwError.value) return
  showPassword.value = false
  flash('비밀번호를 변경했어요.')
}

/* 계정 삭제 */
function deleteAccount() {
  if (!window.confirm('계정을 삭제할까요? 기록과 공유 설정이 모두 사라지고 되돌릴 수 없어요.')) return
  flash('삭제 요청을 접수했어요. 7일 내에 취소할 수 있어요.')
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>프로필</h2>
        <p>다른 사용자에게 보이는 이름과 사진이에요</p>
      </div>
      <span v-if="notice" class="badge ok">{{ notice }}</span>
    </div>

    <div style="display: flex; align-items: center; gap: 14px; margin: 16px 0">
      <span class="profile-avatar" style="width: 56px; height: 56px; font-size: 18px">{{ saved.nickname[0] }}</span>
      <button class="review" style="margin: 0" @click="flash('사진 변경은 준비 중이에요.')">사진 변경</button>
    </div>

    <label>닉네임<input v-model="draft.nickname" placeholder="표시할 이름" /></label>
    <label>이메일<input :value="saved.email" disabled /></label>
    <p class="form-note">이메일은 보안/계정 구역에서 변경할 수 있어요.</p>

    <div class="section-label" style="margin-top: 20px">비밀번호</div>
    <button class="review" style="margin-top: 6px" @click="openPassword">비밀번호 변경하기</button>

    <button class="primary" :disabled="!canSave" @click="save">저장하기</button>
    <p v-if="isDirty" class="form-note">저장하지 않은 변경사항이 있어요.</p>

    <div class="section-label" style="margin-top: 22px">계정</div>
    <button class="review" style="margin-top: 6px" @click="deleteAccount">계정 삭제</button>
  </section>

  <Modal v-if="showPassword" title="비밀번호 변경" @close="showPassword = false">
    <label>현재 비밀번호<input type="password" v-model="pw.current" autocomplete="current-password" autofocus /></label>
    <label>새 비밀번호<input type="password" v-model="pw.next" autocomplete="new-password" placeholder="8자 이상" /></label>
    <label>새 비밀번호 확인<input type="password" v-model="pw.confirm" autocomplete="new-password" @keyup.enter="changePassword" /></label>
    <p v-if="pwError" class="form-note">{{ pwError }}</p>
    <button class="primary" :disabled="Boolean(pwError)" @click="changePassword">변경하기</button>
  </Modal>
</template>
