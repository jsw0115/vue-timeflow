// 커뮤니티 하위 화면이 주소의 ?id=로 커뮤니티 하나를 불러오고 로그인·주소가 바뀌면 다시 부르게 한다(PR-10 3단계).
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { session } from '../auth/session.js'
import { communityClient } from './community.js'
import { communityErrorText, communityTabs } from './communityClient.mjs'

export function useCommunity() {
  const route = useRoute()
  const id = computed(() => String(route.query.id ?? ''))
  const community = ref(null)
  // idle(로그아웃)·loading·ready·missing(없거나 볼 수 없음)·error
  const status = ref('idle')
  const error = ref('')
  const isOwner = computed(() => community.value?.membership === 'ACTIVE' && community.value?.role === 'owner')
  const isMember = computed(() => community.value?.membership === 'ACTIVE')
  const tabs = computed(() => (id.value ? communityTabs(id.value, isOwner.value) : []))

  async function load() {
    if (!session.userId) { community.value = null; status.value = 'idle'; return }
    if (!id.value) { community.value = null; status.value = 'missing'; return }
    if (status.value !== 'ready') status.value = 'loading'
    try { community.value = await communityClient.get(id.value); status.value = 'ready' } catch (e) {
      error.value = communityErrorText(e)
      status.value = e?.status === 404 ? 'missing' : 'error'
    }
  }
  watch(() => [session.userId, id.value], () => { status.value = 'idle'; load() }, { immediate: true })
  return { id, community, status, error, isOwner, isMember, tabs, load }
}
