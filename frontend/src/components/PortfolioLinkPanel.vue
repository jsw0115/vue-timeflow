<script setup>
// 계정 포트폴리오의 공개 링크 관리(Q-22). 고른 항목만 열고, 링크 공개 주소는 만든 직후 한 번만 보인다.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../features/auth/apiRequest.js'
import { tr } from '../store/locale'
import { LINK_DAYS, PASSWORD_MAX, PASSWORD_MIN, SCOPES, createPortfolioLinkClient, expiryText, linkErrorText, publicPagePath, scopeLabel } from '../features/career/portfolioLinks.mjs'

const props = defineProps({ items: { type: Array, default: () => [] } })
const router = useRouter()
const client = createPortfolioLinkClient(apiRequest)
const selected = ref([])
const scope = ref('link')
// 링크 공개의 선택 비밀번호(Q-39). 비우면 비밀번호 없이 만든다
const password = ref('')
const passwordOk = computed(() => !password.value || (password.value.length >= PASSWORD_MIN && password.value.length <= PASSWORD_MAX))
const days = ref(7)
const links = ref([])
const status = ref('loading')
const message = ref('')
const created = ref(null)
const busy = ref(false)
const titleOf = (id) => props.items.find((item) => item.id === id)?.title ?? tr('지운 항목')
const absoluteUrl = (token) => new URL(router.resolve(publicPagePath(token)).href, window.location.href).href
const canCreate = computed(() => selected.value.length > 0 && !busy.value && (scope.value !== 'link' || passwordOk.value))

async function load() {
  status.value = 'loading'
  try { links.value = (await client.list()) ?? []; status.value = 'ready' } catch (error) { message.value = linkErrorText(error); status.value = 'error' }
}
onMounted(load)
function toggle(id) { selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id] }
async function create() {
  if (!canCreate.value) return
  busy.value = true; message.value = ''; created.value = null
  try {
    const row = await client.create({ itemIds: selected.value, scope: scope.value, expiresInDays: days.value, password: scope.value === 'link' ? password.value : '' })
    created.value = { ...row, href: absoluteUrl(row.token) }
    selected.value = []; password.value = ''
    await load()
  } catch (error) { message.value = linkErrorText(error) } finally { busy.value = false }
}
async function revoke(link) {
  busy.value = true; message.value = ''
  try { await client.revoke(link.id); if (created.value?.id === link.id) created.value = null; await load() } catch (error) { message.value = linkErrorText(error) } finally { busy.value = false }
}
const copied = ref('')
async function copy(text) {
  try { await navigator.clipboard.writeText(text); copied.value = tr('주소를 복사했어요.') } catch { copied.value = tr('복사하지 못했어요. 주소를 직접 선택해 복사해 주세요.') }
}
</script>

<template>
  <section class="card portfolio-links" aria-labelledby="portfolio-links-title">
    <h3 id="portfolio-links-title">{{ tr('공개 링크') }}</h3>
    <p class="form-note">{{ tr('아래에서 고른 항목만 링크로 열려요. 고르지 않은 항목과 경력·이력서는 공개되지 않아요.') }}</p>

    <fieldset class="portfolio-pick">
      <legend>{{ tr('공개할 항목') }}</legend>
      <label v-for="item in items" :key="item.id" class="portfolio-check"><input type="checkbox" :checked="selected.includes(item.id)" @change="toggle(item.id)" />{{ item.title }}</label>
      <p v-if="!items.length" class="input-field-help">{{ tr('먼저 포트폴리오 항목을 추가해 주세요.') }}</p>
    </fieldset>

    <fieldset class="portfolio-scope">
      <legend>{{ tr('공개 범위') }}</legend>
      <label v-for="s in SCOPES" :key="s.id" class="portfolio-check"><input v-model="scope" type="radio" name="portfolio-scope" :value="s.id" /><span><b>{{ tr(s.label) }}</b><small>{{ tr(s.desc) }}</small></span></label>
      <label v-if="scope === 'link'" class="portfolio-days">{{ tr('열어 둘 기간') }}<select v-model.number="days"><option v-for="d in LINK_DAYS" :key="d" :value="d">{{ d === 1 ? tr('1일') : tr('{n}일', { n: d }) }}</option></select></label>
      <label v-if="scope === 'link'" class="portfolio-days">{{ tr('비밀번호(선택)') }}<input v-model="password" type="password" autocomplete="new-password" :maxlength="PASSWORD_MAX" :aria-invalid="passwordOk ? undefined : 'true'" aria-describedby="portfolio-password-help" /></label>
      <p v-if="scope === 'link'" id="portfolio-password-help" class="input-field-help" :data-state="passwordOk ? undefined : 'error'">{{ tr('넣으면 받는 사람이 이 비밀번호를 알아야 볼 수 있어요. {min}~{max}자이고, 열 번 틀리면 링크가 잠겨요. 비밀번호는 링크와 다른 길로 알려 주세요.', { min: PASSWORD_MIN, max: PASSWORD_MAX }) }}</p>
    </fieldset>
    <button type="button" class="button-secondary" :disabled="!canCreate" :aria-busy="busy ? 'true' : undefined" @click="create">{{ busy ? tr('만드는 중') : tr('링크 만들기') }}</button>

    <div v-if="created" class="portfolio-created" role="status">
      <p><b>{{ tr('{scope} 링크를 만들었어요.', { scope: tr(scopeLabel(created.scope)) }) }}</b><template v-if="created.scope === 'link'"> {{ tr('이 주소는 지금만 보여요. 복사해 두세요.') }}</template></p>
      <input :value="created.href" readonly :aria-label="tr('공개 링크 주소')" @focus="$event.target.select()" />
      <button type="button" class="button-text" @click="copy(created.href)">{{ tr('주소 복사') }}</button>
      <span v-if="copied" class="input-field-help">{{ copied }}</span>
    </div>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ tr(message) }}</p>

    <h4>{{ tr('열려 있는 링크') }}</h4>
    <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('링크를 불러오는 중이에요.') }}</p>
    <ul v-else-if="links.length" class="portfolio-link-list">
      <li v-for="link in links" :key="link.id">
        <span class="portfolio-link-info"><b>{{ tr(scopeLabel(link.scope)) }}</b> · {{ link.itemIds.map(titleOf).join(', ') }}<small>{{ expiryText(link, Date.now(), tr) }}<template v-if="link.protected"> {{ tr('· 비밀번호 있음') }}</template><template v-if="link.token"> · <a :href="absoluteUrl(link.token)" target="_blank" rel="noopener noreferrer">{{ tr('공개 화면 열기') }}</a></template></small></span>
        <button type="button" class="button-secondary" :disabled="busy" :aria-label="tr('{scope} 링크 닫기', { scope: tr(scopeLabel(link.scope)) })" @click="revoke(link)">{{ tr('닫기') }}</button>
      </li>
    </ul>
    <p v-else-if="status === 'ready'" class="empty-state">{{ tr('열려 있는 링크가 없어요. 위에서 항목과 공개 범위를 고르고 \'링크 만들기\'를 눌러 보세요.') }}</p>
  </section>
</template>

<style scoped>
.portfolio-links { display: grid; gap: var(--space-md); margin-bottom: var(--space-xl); }
.portfolio-links h3, .portfolio-links h4, .portfolio-links p { margin: 0; }
.portfolio-pick, .portfolio-scope { display: grid; gap: var(--space-xs); margin: 0; padding: 0; border: 0; }
.portfolio-pick legend, .portfolio-scope legend { margin-bottom: var(--space-xs); font-weight: 600; }
.portfolio-check { display: flex; align-items: flex-start; gap: var(--space-sm); min-height: var(--input-height); margin: 0; font-weight: 400; }
.portfolio-check span { display: grid; gap: var(--space-xs); }
.portfolio-check small { color: var(--color-muted); }
.portfolio-days { display: inline-grid; gap: var(--space-xs); margin: 0; }
.portfolio-created { display: grid; gap: var(--space-sm); padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.portfolio-created input { min-width: 0; }
.portfolio-created .button-text { justify-self: start; }
.portfolio-link-list { display: grid; gap: var(--space-sm); margin: 0; padding: 0; list-style: none; }
.portfolio-link-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-sm); padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-hairline); }
.portfolio-link-info { display: grid; gap: var(--space-xs); min-width: 0; overflow-wrap: anywhere; }
.portfolio-link-info small { color: var(--color-muted); }
</style>
