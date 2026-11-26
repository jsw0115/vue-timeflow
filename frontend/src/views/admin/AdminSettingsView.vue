<script setup>
// 관리자 설정 → 현재 적용 정책 보기(Q-30). 서버가 지금 실제로 쓰는 값만 읽기 전용으로 보인다.
// 화면에서 바꿔도 서버가 적용하지 않는 값을 편집하게 두면 보안 정책이 바뀐 것처럼 보이므로 편집 입력을 두지 않는다.
import { tr } from '../../store/locale'
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { loadPolicy, policySections } from '../../features/admin/policy.mjs'

const policy = ref(null)
const status = ref('loading')
const error = ref('')
const section = ref('service')
const sections = computed(() => policySections(policy.value, tr))
const current = computed(() => sections.value.find((s) => s.id === section.value) ?? sections.value[0])

async function load() {
  status.value = 'loading'; error.value = ''
  try { policy.value = await loadPolicy(apiRequest); status.value = 'ready' } catch (e) { error.value = adminErrorText(e); status.value = 'error' }
}
onMounted(load)
</script>

<template>
  <div class="settings">
    <nav class="setting-menu card" :aria-label="tr('정책 구획')">
      <button v-for="s in sections" :key="s.id" type="button" :class="{ active: section === s.id }" :aria-current="section === s.id ? 'true' : undefined" @click="section = s.id">
        {{ tr(s.label) }}<span aria-hidden="true">›</span>
      </button>
    </nav>

    <section class="card setting-content" aria-labelledby="policy-title">
      <div class="setting-head">
        <div>
          <h2 id="policy-title">{{ tr(current.label) }}</h2>
          <p>{{ tr('서버에 지금 적용된 정책이에요. 이 화면에서는 바꿀 수 없어요.') }}</p>
        </div>
      </div>
      <!-- 좁은 화면에서는 왼쪽 구획 메뉴가 숨으므로 같은 구획을 여기서 고른다 -->
      <label class="policy-pick">{{ tr('구획') }}
        <select v-model="section"><option v-for="s in sections" :key="s.id" :value="s.id">{{ tr(s.label) }}</option></select>
      </label>

      <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('정책을 불러오는 중이에요.') }}</p>
      <div v-else-if="status === 'error'" class="empty-state" role="alert"><p>{{ tr(error) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
      <dl v-else class="policy-list">
        <div v-for="row in current.rows" :key="row.label" class="policy-row">
          <dt>{{ tr(row.label) }}</dt>
          <dd><span v-if="row.unsupported" class="badge">{{ tr('지원하지 않음') }}</span><span v-else class="figure">{{ row.value }}</span></dd>
        </div>
      </dl>

      <p class="form-note policy-note">{{ tr('로그인 유지 시간처럼 바꿀 수 있는 값은 배포 설정(환경 변수)에서 바꾸고 다시 배포해요. 계정 역할은') }} <router-link to="/admin">{{ tr('사용자 관리') }}</router-link>{{ tr('에서, 관리자 조치 기록은') }} <router-link to="/admin/audit">{{ tr('감사 로그') }}</router-link>{{ tr('에서 봐요.') }}</p>
    </section>
  </div>
</template>

<style scoped>
/* 전역 .form-note는 inline-flex라 글과 링크가 칸으로 나뉘어 좁은 화면에서 세로로 쪼개졌다. 이 안내는 한 문단으로 흐르게 한다 */
.policy-note { display: block; }
.policy-pick { display: none; }
.policy-list { display: grid; gap: 0; margin: var(--space-lg) 0; }
.policy-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-xs) var(--space-lg); padding: var(--space-md) 0; border-bottom: 1px solid var(--color-hairline); }
.policy-row dt { color: var(--color-foreground); font-weight: 600; }
.policy-row dd { margin: 0; color: var(--color-foreground); }
@media (max-width: 760px) { .policy-pick { display: grid; gap: var(--space-xs); } }
</style>
