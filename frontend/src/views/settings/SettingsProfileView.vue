<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'

/**
 * 프로필 — 시연 화면이다. 서버에 닉네임·사진·비밀번호 변경과 계정 삭제 경로가 없어(`/api/auth`는 가입·로그인·로그아웃·갱신·내 정보뿐)
 * 이 화면 안에서만 값이 바뀐다. 예전 문구("비밀번호를 변경했어요" 등)는 실제로 바뀐 것처럼 보여 사실대로 고쳤다(PR-32 12단계).
 */
const saved = ref({ nickname: '지수', email: 'jisu@timebar.app' })
const draft = ref({ ...saved.value })
const notice = ref('')

const isDirty = computed(() => draft.value.nickname.trim() !== saved.value.nickname)
const canSave = computed(() => Boolean(draft.value.nickname.trim()) && isDirty.value)

function save() {
  if (!canSave.value) return
  saved.value = { ...saved.value, nickname: draft.value.nickname.trim() }
  flash(tr('이 화면에서만 바꿨어요. 계정에는 저장되지 않아요.'))
}
function flash(text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 2500)
}

/* 비밀번호 변경 */
const showPassword = ref(false)
const pw = ref({ current: '', next: '', confirm: '' })
const pwError = computed(() => {
  if (!pw.value.current) return tr('현재 비밀번호를 입력해주세요.')
  if (pw.value.next.length < 8) return tr('새 비밀번호는 8자 이상이어야 해요.')
  if (pw.value.next !== pw.value.confirm) return tr('새 비밀번호가 서로 달라요.')
  return ''
})
function openPassword() {
  pw.value = { current: '', next: '', confirm: '' }
  showPassword.value = true
}
function changePassword() {
  if (pwError.value) return
  showPassword.value = false
  flash(tr('시연 화면이라 실제 비밀번호는 바뀌지 않았어요.'))
}

/* 계정 삭제 */
function deleteAccount() {
  if (!window.confirm(tr('계정을 삭제할까요? 기록과 공유 설정이 모두 사라지고 되돌릴 수 없어요.'))) return
  flash(tr('시연 화면이라 계정 삭제 요청을 보내지 않았어요.'))
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>{{ tr('프로필') }}</h2>
        <p>{{ tr('다른 사용자에게 보이는 이름과 사진이에요') }}</p>
      </div>
      <span v-if="notice" class="badge ok" role="status">{{ notice }}</span>
    </div>
    <p class="sample-label">{{ tr('이 화면은 시연용이에요. 닉네임·사진·비밀번호 변경과 계정 삭제는 아직 계정에 반영되지 않아요.') }}</p>

    <div style="display: flex; align-items: center; gap: 14px; margin: 16px 0">
      <span class="profile-avatar" style="width: 56px; height: 56px; font-size: 1.125rem">{{ saved.nickname[0] }}</span>
      <button class="review" style="margin: 0" @click="flash(tr('사진 변경은 준비 중이에요.'))">{{ tr('사진 변경') }}</button>
    </div>

    <label>{{ tr('닉네임') }}<input v-model="draft.nickname" :placeholder="tr('표시할 이름')" /></label>
    <label>{{ tr('이메일') }}<input :value="saved.email" disabled /></label>
    <p class="form-note">{{ tr('이메일은 보안/계정 구역에서 변경할 수 있어요.') }}</p>

    <div class="section-label" style="margin-top: 20px">{{ tr('비밀번호') }}</div>
    <button class="review" style="margin-top: 6px" @click="openPassword">{{ tr('비밀번호 변경하기') }}</button>

    <button class="primary" :disabled="!canSave" @click="save">{{ tr('저장하기') }}</button>
    <p v-if="isDirty" class="form-note">{{ tr('저장하지 않은 변경사항이 있어요.') }}</p>

    <div class="section-label" style="margin-top: 22px">{{ tr('계정') }}</div>
    <button class="review" style="margin-top: 6px" @click="deleteAccount">{{ tr('계정 삭제') }}</button>
  </section>

  <Modal v-if="showPassword" :title="tr('비밀번호 변경')" @close="showPassword = false">
    <label>{{ tr('현재 비밀번호') }}<input type="password" v-model="pw.current" autocomplete="current-password" autofocus /></label>
    <label>{{ tr('새 비밀번호') }}<input type="password" v-model="pw.next" autocomplete="new-password" :placeholder="tr('8자 이상')" /></label>
    <label>{{ tr('새 비밀번호 확인') }}<input type="password" v-model="pw.confirm" autocomplete="new-password" @keyup.enter="changePassword" /></label>
    <p v-if="pwError" class="form-note">{{ pwError }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showPassword = false">{{ tr('취소') }}</button>
      <button type="button" class="button-secondary" :disabled="Boolean(pwError)" @click="changePassword">{{ tr('비밀번호 변경') }}</button>
    </template>
  </Modal>
</template>
