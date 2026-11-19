<!-- 들어간 공유 그룹마다 내 일정을 보일 범위를 서버에 저장한다. 공유 안 함이 철회다(PR-10 2단계, UF-112·UF-113). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { SHARE_LEVELS, levelLabel, shareErrorText } from '../../features/share/shareClient.mjs'

const router = useRouter()
const groups = ref([])
const status = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')
const joined = computed(() => groups.value.filter((g) => g.membership === 'ACTIVE'))

async function load() {
  if (!session.userId) { groups.value = []; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try { groups.value = await shareClient.groups(); status.value = 'ready' } catch (e) { error.value = shareErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })

async function setLevel(g, level) {
  if (busy.value || g.shareLevel === level) return
  busy.value = g.id
  notice.value = ''
  error.value = ''
  try {
    await shareClient.setLevel(g.id, level)
    g.shareLevel = level
    notice.value = `‘${g.title}’ 그룹에 보일 범위를 '${levelLabel(level)}'으로 저장했어요.`
  } catch (e) { error.value = shareErrorText(e) } finally { busy.value = '' }
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" />
  <div v-else class="form-pattern">
    <section class="card form-card">
      <div class="setting-head">
        <div>
          <h2>공개 범위 설정</h2>
          <p>그룹마다 내 일정이 어떻게 보일지 정해요. 고른 범위 밖의 내용은 서버가 보내지 않아요.</p>
        </div>
      </div>

      <dl class="level-guide">
        <template v-for="level in SHARE_LEVELS" :key="level.id"><dt>{{ level.label }}</dt><dd>{{ level.desc }}</dd></template>
      </dl>
      <p v-if="notice" class="input-field-help" data-state="success" role="status">{{ notice }}</p>
      <p v-if="error && status === 'ready'" class="input-field-help" data-state="error" role="alert">{{ error }}</p>

      <p v-if="status === 'loading'" class="input-field-help" role="status">그룹을 불러오는 중이에요.</p>
      <div v-else-if="status === 'error'" class="empty-state" role="status"><p>그룹을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
      <template v-else>
        <div v-for="g in joined" :key="g.id" class="level-row">
          <div :id="'level-' + g.id" class="level-name"><b>{{ g.title }}</b><small>멤버 {{ g.members }}명</small></div>
          <div class="segmented-tab level-tabs" role="group" :aria-labelledby="'level-' + g.id">
            <button v-for="level in SHARE_LEVELS" :key="level.id" type="button" :aria-pressed="(g.shareLevel ?? 'none') === level.id" :disabled="busy === g.id" @click="setLevel(g, level.id)">{{ level.label }}</button>
          </div>
        </div>
        <div v-if="!joined.length" class="empty-state"><p>아직 들어간 캘린더 그룹이 없어요. 캘린더 그룹 화면에서 그룹을 만들거나 받은 초대를 수락해 보세요.</p><button type="button" class="button-secondary" @click="router.push('/share/groups')">캘린더 그룹으로</button></div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.level-guide { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--space-xs) var(--space-lg); margin: 0 0 var(--space-xl); font-size: var(--type-body-size); }
.level-guide dt { font-weight: 600; }
.level-guide dd { margin: 0; color: var(--color-muted); }
.level-row { display: grid; gap: var(--space-md); padding: var(--space-lg) 0; border-bottom: 1px solid var(--color-hairline); }
.level-name { display: grid; gap: var(--space-xs); }
.level-name small { color: var(--color-muted); font-size: var(--type-caption-size); }
.level-tabs { flex-wrap: wrap; justify-self: start; }
@media (max-width: 600px) { .level-guide { grid-template-columns: minmax(0, 1fr); } }
</style>
