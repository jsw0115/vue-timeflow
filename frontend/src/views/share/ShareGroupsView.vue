<!-- 내가 속한 공유 그룹과 받은 초대를 서버에서 불러온다. 그룹을 만들고 초대를 수락·거절한다(PR-10 2단계, UF-110·UT-190). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { levelLabel, shareErrorText } from '../../features/share/shareClient.mjs'
import PageActions from '../../components/PageActions.vue'

const router = useRouter()
const groups = ref([])
const status = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')
const showModal = ref(false)
const draftTitle = ref('')
const draftDesc = ref('')
const createError = ref('')

const joined = computed(() => groups.value.filter((g) => g.membership === 'ACTIVE'))
const invites = computed(() => groups.value.filter((g) => g.membership === 'INVITED'))

async function load() {
  if (!session.userId) { groups.value = []; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try { groups.value = await shareClient.groups(); status.value = 'ready' } catch (e) { error.value = shareErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })

function openCreate() {
  draftTitle.value = ''
  draftDesc.value = ''
  createError.value = ''
  showModal.value = true
}
async function createGroup() {
  if (busy.value) return
  if (!draftTitle.value.trim()) { createError.value = '그룹 이름을 입력해 주세요.'; return }
  busy.value = 'create'
  createError.value = ''
  try {
    const created = await shareClient.createGroup({ title: draftTitle.value.trim(), description: draftDesc.value.trim() })
    showModal.value = false
    router.push(`/share/groups/${encodeURIComponent(created.id)}`)
  } catch (e) { createError.value = shareErrorText(e) } finally { busy.value = '' }
}
async function accept(g) {
  if (busy.value) return
  busy.value = g.id
  error.value = ''
  try { await shareClient.join(g.id); router.push(`/share/groups/${encodeURIComponent(g.id)}`) } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
async function decline(g) {
  if (busy.value || !window.confirm('‘' + g.title + '’ 그룹 초대를 거절할까요?')) return
  busy.value = g.id
  error.value = ''
  notice.value = ''
  try { await shareClient.removeMember(g.id, session.userId); notice.value = '‘' + g.title + '’ 그룹 초대를 거절했어요.'; await load() } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
function open(g) {
  router.push(`/share/groups/${encodeURIComponent(g.id)}`)
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" />
  <template v-else>
    <div class="page-tools">
      <span class="input-field-help" style="margin: 0">그룹마다 내 일정을 보일 범위를 따로 정해요. 처음에는 공유 안 함이에요</span>
      <PageActions><button type="button" class="primary" @click="openCreate">+ 그룹 만들기</button></PageActions>
    </div>
    <p v-if="notice" class="input-field-help group-message" data-state="success" role="status">{{ notice }}</p>
    <p v-if="error && status === 'ready'" class="input-field-help group-message" data-state="error" role="alert">{{ error }}</p>

    <p v-if="status === 'loading'" class="input-field-help" role="status">그룹을 불러오는 중이에요.</p>
    <section v-else-if="status === 'error'" class="card">
      <div class="empty-state" role="status"><p>그룹을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
    </section>
    <template v-else>
      <section v-if="invites.length" class="card invite-card" aria-labelledby="invite-title">
        <div id="invite-title" class="section-label">받은 초대</div>
        <div class="event" v-for="g in invites" :key="g.id">
          <span class="group-name"><b>{{ g.title }}</b><small>{{ g.description || '설명이 없어요' }} · 멤버 {{ g.members }}명</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="decline(g)">거절</button>
          <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === g.id ? 'true' : undefined" @click="accept(g)">수락</button>
        </div>
      </section>

      <div class="comm-grid">
        <section class="card group-card" v-for="g in joined" :key="g.id" role="button" tabindex="0" :aria-label="g.title + ' 그룹 열기'" @click="open(g)" @keyup.enter="open(g)">
          <div class="head">
            <b>{{ g.title }}</b>
            <span class="badge">{{ g.role === 'owner' ? '방장' : '멤버' }}</span>
          </div>
          <p>{{ g.description || '설명이 없어요' }}</p>
          <p class="input-field-help">멤버 {{ g.members }}명 · 내 공개 범위 {{ levelLabel(g.shareLevel) }}</p>
        </section>
      </div>
      <section v-if="!joined.length" class="card">
        <p class="empty-state">아직 들어간 캘린더 그룹이 없어요. '+ 그룹 만들기'로 그룹을 만들고 이메일로 멤버를 초대해 보세요.</p>
      </section>
    </template>

    <Modal v-if="showModal" title="그룹 만들기" @close="showModal = false">
      <form id="group-create" @submit.prevent="createGroup">
        <label>그룹 이름<input v-model="draftTitle" placeholder="예: 갓생 크루" maxlength="200" autofocus /></label>
        <label>설명(선택)<textarea v-model="draftDesc" placeholder="어떤 그룹인지 한 줄로 소개해 보세요"></textarea></label>
        <p class="input-field-help">멤버는 그룹을 만든 뒤 그룹 화면에서 이메일로 초대해요.</p>
        <p v-if="createError" class="input-field-help" data-state="error" role="alert">{{ createError }}</p>
      </form>
      <template #footer>
        <button type="button" class="modal-secondary" @click="showModal = false">취소</button>
        <button type="submit" form="group-create" class="primary" :disabled="busy === 'create'" :aria-busy="busy === 'create' ? 'true' : undefined">{{ busy === 'create' ? '만드는 중' : '그룹 만들기' }}</button>
      </template>
    </Modal>
  </template>
</template>

<style scoped>
.group-name { flex: 1; min-width: 0; }
.group-message { margin: 0 0 var(--space-lg); }
.invite-card { margin-bottom: var(--space-xl); }
.invite-card .event { flex-wrap: wrap; }
</style>
