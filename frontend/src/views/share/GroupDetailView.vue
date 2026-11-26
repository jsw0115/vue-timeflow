<!-- 공유 그룹 하나의 멤버·초대·내 공개 범위·이번 주 그룹 일정·상대방 시점 미리보기를 서버 응답으로 보인다(PR-10 2단계, UF-110~UF-113). -->
<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import PersonFinder from '../../components/share/PersonFinder.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { SHARE_LEVELS, levelLabel, shareErrorText, weekRange } from '../../features/share/shareClient.mjs'
import PageActions from '../../components/PageActions.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))
const range = weekRange()

const group = ref(null)
const members = ref([])
const invited = ref([])
const status = ref('idle')
const shared = ref({ status: 'idle', rows: [] })
const previewFor = ref('')
const preview = ref({ status: 'idle', rows: [] })
const notice = ref('')
const error = ref('')
const busy = ref('')
const showInvite = ref(false)

const isOwner = computed(() => group.value?.role === 'owner')
const others = computed(() => members.value.filter((m) => m.userId !== session.userId))
const previewName = computed(() => others.value.find((m) => m.userId === previewFor.value)?.nickname || tr('그 멤버'))
const currentLevel = computed(() => SHARE_LEVELS.find((level) => level.id === (group.value?.shareLevel ?? 'none')))

async function load() {
  if (!session.userId) { group.value = null; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try {
    const [row, list] = await Promise.all([shareClient.group(id.value), shareClient.members(id.value)])
    group.value = row
    members.value = list
    invited.value = row.role === 'owner' ? await shareClient.invited(id.value) : []
    status.value = 'ready'
    if (previewFor.value && !list.some((m) => m.userId === previewFor.value)) previewFor.value = ''
    await Promise.all([loadShared(), loadPreview()])
  } catch (e) {
    error.value = shareErrorText(e)
    status.value = e?.status === 403 || e?.status === 404 ? 'denied' : 'error'
  }
}
async function loadShared() {
  shared.value = { status: 'loading', rows: shared.value.rows }
  try { shared.value = { status: 'ready', rows: await shareClient.schedules(id.value, range) } } catch { shared.value = { status: 'error', rows: [] } }
}
async function loadPreview() {
  if (!previewFor.value) { preview.value = { status: 'idle', rows: [] }; return }
  preview.value = { status: 'loading', rows: preview.value.rows }
  try { preview.value = { status: 'ready', rows: await shareClient.preview(id.value, previewFor.value, range) } } catch { preview.value = { status: 'error', rows: [] } }
}
watch(() => [session.userId, id.value], () => { status.value = 'idle'; previewFor.value = ''; load() }, { immediate: true })
watch(previewFor, loadPreview)

/** 서버 변경 하나를 보내고 다시 불러온다. 성공하면 true다. */
async function act(key, run, done) {
  if (busy.value) return false
  busy.value = key
  notice.value = ''
  error.value = ''
  try { await run(); notice.value = done; await load(); return true } catch (e) { error.value = shareErrorText(e); return false } finally { busy.value = '' }
}
const setLevel = (level) => level !== group.value?.shareLevel && act('level', () => shareClient.setLevel(id.value, level), tr('내 공개 범위를 \'{level}\'(으)로 바꿨어요.', { level: tr(levelLabel(level)) }))
const invite = (person) => act('invite', () => shareClient.inviteMember(id.value, person.id), tr('{name}님을 초대했어요. 상대가 수락하면 멤버가 돼요.', { name: person.nickname }))
function kick(m) {
  if (window.confirm(tr('{name}님을 이 그룹에서 내보낼까요?', { name: m.nickname }))) act(m.userId, () => shareClient.removeMember(id.value, m.userId), tr('{name}님을 내보냈어요.', { name: m.nickname }))
}
function cancelInvite(m) {
  if (window.confirm(tr('{name}님에게 보낸 초대를 취소할까요?', { name: m.nickname }))) act(m.userId, () => shareClient.removeMember(id.value, m.userId), tr('{name}님에게 보낸 초대를 취소했어요.', { name: m.nickname }))
}
function block(m) {
  if (window.confirm(tr('{name}님을 차단할까요? 서로의 일정이 그룹 캘린더에서 보이지 않고, 내가 만든 그룹에서는 빠져요.', { name: m.nickname }))) act(m.userId, () => shareClient.block(m.userId), tr('{name}님을 차단했어요.', { name: m.nickname }))
}
async function leave() {
  if (busy.value || !window.confirm(tr('‘{name}’ 그룹에서 나갈까요? 내 일정도 이 그룹에 더는 보이지 않아요.', { name: group.value.title }))) return
  busy.value = 'leave'
  error.value = ''
  try { await shareClient.removeMember(id.value, session.userId); router.push('/share/groups') } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
async function removeGroup() {
  if (busy.value || !window.confirm(tr('‘{name}’ 그룹을 삭제할까요? 멤버와 공유 설정이 함께 사라지고 되돌릴 수 없어요.', { name: group.value.title }))) return
  busy.value = 'delete'
  error.value = ''
  try { await shareClient.deleteGroup(group.value); router.push('/share/groups') } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
function openInvite() {
  notice.value = ''
  error.value = ''
  showInvite.value = true
}
const timeText = (row) => `${row.startDate.slice(5)} ${row.startTime || ''}${row.endTime ? '–' + row.endTime : ''}`.trim()
</script>

<template>
  <ShareSignIn v-if="!session.userId" />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">{{ tr('그룹을 불러오는 중이에요.') }}</p>
  <section v-else-if="status === 'denied'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('이 그룹을 볼 수 없어요. 그룹에서 빠졌거나 초대를 아직 수락하지 않았을 수 있어요.') }}</p><button type="button" class="button-secondary" @click="router.push('/share/groups')">{{ tr('캘린더 그룹으로') }}</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('그룹을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  </section>
  <template v-else-if="group">
    <div class="page-tools">
      <button type="button" class="button-secondary" @click="router.push('/share/groups')">{{ tr('← 캘린더 그룹') }}</button>
      <div class="form-row" style="margin: 0">
        <template v-if="isOwner">
          <button type="button" class="button-secondary" :disabled="!!busy" @click="removeGroup">{{ tr('그룹 삭제') }}</button>
          <PageActions><button type="button" class="primary" @click="openInvite">{{ tr('이메일로 초대') }}</button></PageActions>
        </template>
        <button v-else type="button" class="button-secondary" :disabled="!!busy" @click="leave">{{ tr('그룹 나가기') }}</button>
      </div>
    </div>
    <p v-if="notice && !showInvite" class="input-field-help detail-message" data-state="success" role="status">{{ tr(notice) }}</p>
    <p v-if="error && !showInvite" class="input-field-help detail-message" data-state="error" role="alert">{{ tr(error) }}</p>

    <section class="card">
      <div class="head">
        <div>
          <h3 style="margin: 0">{{ group.title }}</h3>
          <p style="margin: 4px 0 0">{{ group.description || tr('설명이 없어요') }}</p>
        </div>
        <span class="badge">{{ isOwner ? tr('방장') : tr('멤버') }}</span>
      </div>
      <p class="input-field-help detail-gap">{{ tr('멤버') }} <span class="figure">{{ members.length }}</span><template v-if="bodyLocale === 'ko'">명</template></p>

      <div id="level-title" class="section-label" style="margin-top: 20px">{{ tr('이 그룹에 보일 내 일정') }}</div>
      <div class="segmented-tab level-tabs" role="group" aria-labelledby="level-title">
        <button v-for="level in SHARE_LEVELS" :key="level.id" type="button" :aria-pressed="(group.shareLevel ?? 'none') === level.id" :disabled="busy === 'level'" @click="setLevel(level.id)">{{ tr(level.label) }}</button>
      </div>
      <p class="input-field-help">{{ tr(currentLevel?.desc) }} {{ tr('고른 범위 밖의 내용은 서버가 보내지 않아요.') }}</p>
    </section>

    <h3 class="detail-heading">{{ tr('이번 주 그룹 일정') }} <span class="figure">{{ range.from.slice(5) }}–{{ range.to.slice(5) }}</span></h3>
    <section class="card">
      <p v-if="shared.status === 'loading' && !shared.rows.length" class="input-field-help" role="status">{{ tr('그룹 일정을 불러오는 중이에요.') }}</p>
      <div v-else-if="shared.status === 'error'" class="empty-state" role="status"><p>{{ tr('그룹 일정을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="loadShared">{{ tr('다시 시도') }}</button></div>
      <template v-else>
        <div class="event" v-for="(row, index) in shared.rows" :key="row.ownerId + index">
          <time class="figure">{{ timeText(row) }}</time>
          <span class="detail-name"><b>{{ row.level === 'busy' ? tr('바쁨') : row.title }}</b><small>{{ row.ownerName }} · {{ tr(levelLabel(row.level)) }}<template v-if="row.level === 'detail' && row.category"> · {{ tr(row.category) }}</template></small><small v-if="row.level === 'detail' && row.body">{{ row.body }}</small></span>
        </div>
        <p v-if="!shared.rows.length" class="empty-state">{{ tr('이번 주에 보이는 다른 멤버의 일정이 없어요. 멤버가 공개 범위를 고르면 그 범위만큼 여기에 보여요.') }}</p>
      </template>
    </section>

    <template v-if="others.length">
      <h3 class="detail-heading">{{ tr('상대방 시점 미리보기') }}</h3>
      <section class="card">
        <label class="input-field">{{ tr('누구에게 보이는 모습을 볼까요') }}<select v-model="previewFor"><option value="">{{ tr('멤버 고르기') }}</option><option v-for="m in others" :key="m.userId" :value="m.userId">{{ m.nickname || tr('이름 없음') }}</option></select></label>
        <template v-if="previewFor">
          <p v-if="preview.status === 'loading' && !preview.rows.length" class="input-field-help" role="status">{{ tr('미리보기를 불러오는 중이에요.') }}</p>
          <p v-else-if="preview.status === 'error'" class="input-field-help" data-state="error" role="alert">{{ tr('미리보기를 불러오지 못했어요. 연결을 확인하고 멤버를 다시 골라 주세요.') }}</p>
          <template v-else>
            <div class="event" v-for="(row, index) in preview.rows" :key="index">
              <time class="figure">{{ timeText(row) }}</time>
              <span class="detail-name"><b>{{ row.level === 'busy' ? tr('바쁨') : row.title }}</b><small>{{ tr(levelLabel(row.level)) }}<template v-if="row.level === 'detail' && row.category"> · {{ tr(row.category) }}</template></small><small v-if="row.level === 'detail' && row.body">{{ row.body }}</small></span>
            </div>
            <p v-if="!preview.rows.length && group.shareLevel === 'none'" class="empty-state">{{ tr('지금은 공유 안 함이라 {name}님에게 보이는 내 일정이 없어요. 위에서 공개 범위를 고르면 그만큼 보여요.', { name: previewName }) }}</p>
            <p v-else-if="!preview.rows.length" class="empty-state">{{ tr('이번 주에 {name}님에게 보이는 내 일정이 없어요. 이번 주 일정을 추가하면 고른 범위만큼 보여요.', { name: previewName }) }}</p>
          </template>
        </template>
        <p v-else class="input-field-help">{{ tr('멤버를 고르면 그 사람이 이 그룹에서 실제로 받는 내 일정을 그대로 보여 줘요.') }}</p>
      </section>
    </template>

    <h3 class="detail-heading">{{ tr('멤버') }}</h3>
    <section class="card">
      <div class="event" v-for="m in members" :key="m.userId">
        <span class="detail-name"><b>{{ m.nickname || tr('이름 없음') }}<template v-if="m.userId === session.userId"> {{ tr('(나)') }}</template></b><small>{{ m.role === 'owner' ? tr('방장') : tr('멤버') }}</small></span>
        <button v-if="isOwner && m.role !== 'owner'" type="button" class="button-secondary" :disabled="!!busy" @click="kick(m)">{{ tr('내보내기') }}</button>
        <button v-if="m.userId !== session.userId" type="button" class="button-secondary" :disabled="!!busy" @click="block(m)">{{ tr('차단') }}</button>
      </div>
      <p v-if="members.length < 2" class="empty-state">{{ tr('아직 나 말고 멤버가 없어요. 방장이 이메일로 초대하면 수락한 사람이 여기에 보여요.') }}</p>
    </section>

    <template v-if="isOwner">
      <h3 class="detail-heading">{{ tr('수락을 기다리는 초대') }}</h3>
      <section class="card">
        <div class="event" v-for="m in invited" :key="m.userId">
          <span class="detail-name"><b>{{ m.nickname || tr('이름 없음') }}</b><small>{{ tr('초대함 · 수락하기를 기다려요') }}</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="cancelInvite(m)">{{ tr('초대 취소') }}</button>
        </div>
        <p v-if="!invited.length" class="empty-state">{{ tr('수락을 기다리는 초대가 없어요. \'이메일로 초대\'로 멤버를 초대해 보세요.') }}</p>
      </section>
    </template>

    <Modal v-if="showInvite" :title="tr('이메일로 초대')" @close="showInvite = false">
      <PersonFinder v-slot="{ person }">
        <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === 'invite' ? 'true' : undefined" @click="invite(person)">{{ busy === 'invite' ? tr('초대하는 중') : tr('초대') }}</button>
      </PersonFinder>
      <p v-if="notice" class="input-field-help" data-state="success" role="status">{{ tr(notice) }}</p>
      <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ tr(error) }}</p>
      <p class="input-field-help">{{ tr('초대받은 사람이 캘린더 그룹 화면에서 수락하면 멤버가 돼요. 차단한 사이에서는 초대할 수 없어요.') }}</p>
    </Modal>
  </template>
</template>

<style scoped>
.detail-heading { margin: var(--space-xl) 0 var(--space-lg); }
.detail-name { flex: 1; min-width: 0; }
.detail-message { margin: 0 0 var(--space-lg); }
.detail-gap { margin-top: var(--space-lg); }
.event { flex-wrap: wrap; }
.level-tabs { flex-wrap: wrap; }
</style>
