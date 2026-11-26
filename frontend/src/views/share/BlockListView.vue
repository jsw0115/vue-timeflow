<!-- 내가 차단한 사용자를 서버에서 불러와 차단을 풀 수 있게 한다(PR-10 2단계, UF-110·UT-195). -->
<script setup>
import { tr } from '../../store/locale'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { shareErrorText } from '../../features/share/shareClient.mjs'

const router = useRouter()
const blocked = ref([])
const status = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')

async function load() {
  if (!session.userId) { blocked.value = []; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try { blocked.value = await shareClient.blocks(); status.value = 'ready' } catch (e) { error.value = shareErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })

async function unblock(row) {
  if (busy.value) return
  busy.value = row.userId
  notice.value = ''
  error.value = ''
  try { await shareClient.unblock(row.userId); notice.value = tr('{name}님의 차단을 풀었어요.', { name: row.nickname || tr('그 사용자') }); await load() } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" />
  <template v-else>
    <div class="page-tools">
      <span class="input-field-help" style="margin: 0">{{ tr('차단하면 친구 관계가 끊기고, 내가 만든 그룹에서 빠지며, 그룹 캘린더에서 서로의 일정이 보이지 않아요') }}</span>
      <button type="button" class="button-secondary" @click="router.push('/share')">{{ tr('친구 화면으로') }}</button>
    </div>
    <p v-if="notice" class="input-field-help block-message" data-state="success" role="status">{{ tr(notice) }}</p>
    <p v-if="error && status === 'ready'" class="input-field-help block-message" data-state="error" role="alert">{{ tr(error) }}</p>

    <section class="card">
      <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('차단 목록을 불러오는 중이에요.') }}</p>
      <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ tr('차단 목록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
      <template v-else>
        <p v-if="!blocked.length" class="empty-state">{{ tr('차단한 사용자가 없어요. 필요하면 친구 화면이나 그룹 멤버 목록에서 차단할 수 있어요.') }}</p>
        <div class="event" v-for="b in blocked" :key="b.userId">
          <span class="block-name"><b>{{ b.nickname || tr('이름 없음') }}</b><small>{{ tr('차단함') }}</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === b.userId ? 'true' : undefined" @click="unblock(b)">{{ busy === b.userId ? tr('푸는 중') : tr('차단 해제') }}</button>
        </div>
      </template>
    </section>
  </template>
</template>

<style scoped>
.block-name { flex: 1; min-width: 0; }
.block-message { margin: 0 0 var(--space-lg); }
</style>
