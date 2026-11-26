<!-- 새 커뮤니티를 서버에 만들고 커뮤니티 홈으로 이동한다. 로그아웃 상태에서는 로그인 안내만 보인다(PR-10 3단계). -->
<script setup>
import { tr } from '../store/locale'
import { useId as modalUseId } from 'vue'
const modalFormId1 = modalUseId()

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import TagMentionInput from './TagMentionInput.vue'
import { integerBetween, localDate } from '../utils/postValidation.mjs'
import { session } from '../features/auth/session.js'
import { communityClient } from '../features/community/community.js'
import { COMMUNITY_CATEGORIES, communityErrorText } from '../features/community/communityClient.mjs'
const emit = defineEmits(['close'])

const router = useRouter()
const CATEGORIES = COMMUNITY_CATEGORIES
const VISIBILITY = [
  { id: 'public', label: '공개', desc: '누구나 찾고 둘러볼 수 있어요' },
  { id: 'private', label: '비공개', desc: '초대받은 사람만 들어올 수 있어요' },
]
const JOIN_POLICY = [
  { id: 'approval', label: '승인 후 가입', desc: '방장이 확인한 뒤 가입돼요' },
  { id: 'open', label: '자유 가입', desc: '신청하면 바로 가입돼요' },
]

const draft = ref({
  title: '',
  category: '운동',
  intro: '',
  capacity: 50,
  deadline: '',
  visibility: 'public',
  joinPolicy: 'approval',
})

const error = computed(() => {
  if (!draft.value.title.trim()) return tr('커뮤니티 이름을 입력해주세요.')
  if (draft.value.title.trim().length < 2) return tr('이름은 2자 이상이어야 해요.')
  if (!integerBetween(draft.value.capacity, 2, 500)) return tr('정원은 2~500명 사이의 정수로 입력해주세요.')
  if (draft.value.deadline && draft.value.deadline < localDate()) return tr('모집 마감은 오늘 이후로 선택해주세요.')
  return ''
})
const busy = ref(false)
const saveError = ref('')
async function create() {
  if (error.value || busy.value) return
  busy.value = true
  saveError.value = ''
  const { title, intro, category, capacity, deadline, visibility, joinPolicy } = draft.value
  try {
    const created = await communityClient.create({ title: title.trim(), desc: intro.trim(), category, capacity, visibility, joinPolicy, ...(deadline ? { deadline } : {}) })
    emit('close')
    router.push({ path: '/community/home', query: { id: created.id } })
  } catch (e) { saveError.value = communityErrorText(e) } finally { busy.value = false }
}
</script>

<template>
  <Modal :title="tr('커뮤니티 만들기')" wide @close="emit('close')">
    <div v-if="!session.userId" class="empty-state" role="status"><p>{{ tr('커뮤니티는 로그인한 계정끼리 함께해요. 로그인하면 커뮤니티를 만들 수 있어요.') }}</p></div>
    <form v-else @submit.prevent="create" :id="modalFormId1">
        <label>{{ tr('커뮤니티 이름') }}<input v-model="draft.title" :placeholder="tr('예: 주말 러닝 크루')" autofocus /></label>
        <label>{{ tr('카테고리') }}<select v-model="draft.category"><option v-for="c in CATEGORIES" :key="c" :value="c">{{ tr(c) }}</option></select></label>
        <label>{{ tr('소개 · 태그 · 멘션') }}<TagMentionInput v-model="draft.intro" :placeholder="tr('함께할 활동을 소개해주세요. #태그 @이름')" /></label>
        <div class="form-row">
          <label style="flex: 1">{{ tr('정원(명)') }}<input type="number" min="2" max="500" v-model.number="draft.capacity" /></label>
          <label style="flex: 1">{{ tr('모집 마감') }}<input type="date" v-model="draft.deadline" /></label>
        </div>

        <div class="section-label">{{ tr('공개 설정') }}</div>
        <div class="policy-row">
          <button
            v-for="v in VISIBILITY"
            :key="v.id"
            type="button"
            :class="{ selected: draft.visibility === v.id }"
            @click="draft.visibility = v.id"
          >
            <b>{{ tr(v.label) }}</b><small>{{ tr(v.desc) }}</small>
          </button>
        </div>

        <div class="section-label" style="margin-top: 18px">{{ tr('가입 정책') }}</div>
        <div class="policy-row">
          <button
            v-for="j in JOIN_POLICY"
            :key="j.id"
            type="button"
            :class="{ selected: draft.joinPolicy === j.id }"
            @click="draft.joinPolicy = j.id"
          >
            <b>{{ tr(j.label) }}</b><small>{{ tr(j.desc) }}</small>
          </button>
        </div>

        <p v-if="error" class="input-field-help">{{ tr(error) }}</p>
        <p v-if="saveError" class="input-field-help" data-state="error" role="alert">{{ tr(saveError) }}</p>

    </form>

    <template #footer>
      <button type="button" class="modal-secondary" @click="emit('close')">{{ tr('취소') }}</button>
      <button v-if="session.userId" :form="modalFormId1" type="submit" class="primary" :disabled="Boolean(error) || busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? tr('만드는 중') : tr('커뮤니티 만들기') }}</button>
    </template>
  </Modal>
</template>
