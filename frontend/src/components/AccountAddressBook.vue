<script setup>
// 로그인 계정의 주소록(Q-21). 연락처를 추가·수정·삭제하고, 이메일로 가입 계정과 연결하면 할 일 체크리스트 담당자로 고를 수 있다.
import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import PageActions from './PageActions.vue'
import { accountContactStore, accountContacts, linkContact, unlinkContact } from '../store/accountContacts'
import { contactDraftError, linkErrorText } from '../features/address/accountContacts.mjs'
import { saveFailureMessage } from '../features/records/saveState.mjs'

const state = accountContactStore.state
const keyword = ref('')
const rows = computed(() => {
  const k = keyword.value.trim()
  return accountContacts.value.filter((c) => !k || c.name.includes(k) || (c.relation ?? '').includes(k) || (c.email ?? '').includes(k))
})
const editing = ref(null)
const draft = ref({ name: '', relation: '', email: '' })
const draftError = computed(() => contactDraftError(draft.value))
const saving = ref(false)
const formMessage = ref('')
const rowMessage = ref('')
const busyId = ref(null)

function open(contact = null) {
  editing.value = contact ?? { id: null }
  draft.value = { name: contact?.name ?? '', relation: contact?.relation ?? '', email: contact?.email ?? '' }
  formMessage.value = ''
}
async function save() {
  if (draftError.value || saving.value) return
  saving.value = true; formMessage.value = ''
  try {
    if (editing.value.id) await accountContactStore.update(editing.value, draft.value)
    else await accountContactStore.create(draft.value)
    editing.value = null
  } catch (error) { formMessage.value = saveFailureMessage(error) } finally { saving.value = false }
}
async function run(contact, action) {
  busyId.value = contact.id; rowMessage.value = ''
  try { await action(contact) } catch (error) {
    rowMessage.value = linkErrorText(error)
    if (error?.status === 409) await accountContactStore.reload()
  } finally { busyId.value = null }
}
async function remove(contact) {
  busyId.value = contact.id; rowMessage.value = ''
  try { await accountContactStore.remove(contact) } catch (error) { rowMessage.value = saveFailureMessage(error) } finally { busyId.value = null }
}
</script>

<template>
  <PageActions><button type="button" class="primary" @click="open()">연락처 추가</button></PageActions>
  <p class="form-note">연락처 이메일과 같은 이메일로 가입한 계정과 연결하면, 할 일 체크리스트 담당자로 고를 수 있어요. 연결은 이메일이 정확히 같을 때만 되고, 이메일을 바꾸면 연결이 풀려요.</p>
  <label class="address-search">연락처 검색<input v-model="keyword" type="search" placeholder="이름·관계·이메일" /></label>

  <p v-if="state.loading && !state.loaded" class="input-field-help" role="status">주소록을 불러오는 중이에요.</p>
  <div v-else-if="state.error && !state.loaded" class="card empty-state" role="alert"><p>주소록을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="accountContactStore.reload()">다시 시도</button></div>
  <section v-else class="card list" aria-label="내 주소록">
    <p v-if="rowMessage" class="input-field-help" data-state="error" role="alert">{{ rowMessage }}</p>
    <div v-for="c in rows" :key="c.id" class="row account-contact">
      <span class="account-contact-name"><b>{{ c.name }}</b><small>{{ [c.relation, c.email].filter(Boolean).join(' · ') || '이메일 없음' }}</small></span>
      <span class="account-contact-link">
        <span v-if="c.accountId" class="badge ok">계정 연결됨<template v-if="c.accountNickname"> · {{ c.accountNickname }}</template></span>
        <span v-else class="badge">연결 안 됨</span>
      </span>
      <span class="account-contact-actions">
        <button v-if="c.accountId" type="button" class="button-secondary" :disabled="busyId === c.id" :aria-label="c.name + ' 계정 연결 해제'" @click="run(c, unlinkContact)">연결 해제</button>
        <button v-else type="button" class="button-secondary" :disabled="busyId === c.id || !c.email" :aria-label="c.name + ' 계정과 연결'" @click="run(c, linkContact)">계정 연결</button>
        <button type="button" class="button-text" :aria-label="c.name + ' 수정'" @click="open(c)">수정</button>
        <button type="button" class="button-text" :disabled="busyId === c.id" :aria-label="c.name + ' 삭제'" @click="remove(c)">삭제</button>
      </span>
    </div>
    <p v-if="!rows.length" class="empty-state" role="status">{{ accountContacts.length ? '검색어와 맞는 연락처가 없어요.' : "아직 연락처가 없어요. '연락처 추가'로 함께 일하는 사람을 넣어 보세요." }}</p>
  </section>

  <Modal v-if="editing" :title="editing.id ? '연락처 수정' : '연락처 추가'" @close="editing = null">
    <form id="account-contact-form" @submit.prevent="save">
      <label>이름<input v-model="draft.name" maxlength="100" required autofocus /></label>
      <label>관계<input v-model="draft.relation" maxlength="50" placeholder="예: 동료" /></label>
      <label>이메일<input v-model="draft.email" type="email" maxlength="255" aria-describedby="account-contact-email-help" /></label>
      <p id="account-contact-email-help" class="input-field-help">계정과 연결하려면 그 사람이 가입한 이메일을 적어 주세요.<template v-if="editing.accountId"> 이메일을 바꾸면 지금 연결이 풀려요.</template></p>
      <p v-if="draftError || formMessage" class="input-field-help" data-state="error" role="alert">{{ formMessage || draftError }}</p>
    </form>
    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button type="submit" form="account-contact-form" class="primary" :disabled="!!draftError || saving" :aria-busy="saving ? 'true' : undefined">{{ saving ? '저장하는 중' : '저장' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.address-search { display: grid; gap: var(--space-xs); margin: var(--space-lg) 0; }
.account-contact { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm) var(--space-lg); }
.account-contact-name { flex: 1 1 200px; display: grid; gap: var(--space-xs); min-width: 0; }
.account-contact-name small { color: var(--color-muted); overflow-wrap: anywhere; }
.account-contact-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
</style>
