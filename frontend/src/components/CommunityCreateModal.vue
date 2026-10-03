<script setup>
import { useId as modalUseId } from 'vue'
const modalFormId1 = modalUseId()

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import TagMentionInput from './TagMentionInput.vue'
import { communities } from '../store/communities'
import { integerBetween, localDate } from '../utils/postValidation.mjs'
import { syncPostCollection } from '../store/tagging'
const emit = defineEmits(['close'])

/** 새 커뮤니티 만들기 — 입력이 모두 바인딩되고 생성 후 커뮤니티 목록으로 이동한다. */
const router = useRouter()
const CATEGORIES = ['운동', '공부', '일상', '갓생']
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
  if (!draft.value.title.trim()) return '커뮤니티 이름을 입력해주세요.'
  if (draft.value.title.trim().length < 2) return '이름은 2자 이상이어야 해요.'
  if (!integerBetween(draft.value.capacity, 2, 500)) return '정원은 2~500명 사이의 정수로 입력해주세요.'
  if (draft.value.deadline && draft.value.deadline < localDate()) return '모집 마감은 오늘 이후로 선택해주세요.'
  return ''
})
function create() {
  if (error.value) return
  const group = { ...draft.value, id: Math.max(0, ...communities.value.map(c => c.id)) + 1, title: draft.value.title.trim(), desc: draft.value.intro.trim(), joined: true, owner: true, members: 1, todayPosts: 0, createdDays: 0, emoji: '' }
  communities.value.unshift(group)
  syncPostCollection('community', communities.value, '커뮤니티', item => '/community/home?id=' + item.id)
  emit('close')
  router.push({ path: '/community/home', query: { id: group.id } })
}
</script>

<template>
  <Modal title="커뮤니티 만들기" wide @close="emit('close')">
    <form @submit.prevent="create" :id="modalFormId1">
        <label>커뮤니티 이름<input v-model="draft.title" placeholder="예: 주말 러닝 크루" autofocus /></label>
        <label>카테고리<select v-model="draft.category"><option v-for="c in CATEGORIES" :key="c">{{ c }}</option></select></label>
        <label>소개 · 태그 · 멘션<TagMentionInput v-model="draft.intro" placeholder="함께할 활동을 소개해주세요. #태그 @이름" /></label>
        <div class="form-row">
          <label style="flex: 1">정원(명)<input type="number" min="2" max="500" v-model.number="draft.capacity" /></label>
          <label style="flex: 1">모집 마감<input type="date" v-model="draft.deadline" /></label>
        </div>

        <div class="section-label">공개 설정</div>
        <div class="policy-row">
          <button
            v-for="v in VISIBILITY"
            :key="v.id"
            type="button"
            :class="{ selected: draft.visibility === v.id }"
            @click="draft.visibility = v.id"
          >
            <b>{{ v.label }}</b><small>{{ v.desc }}</small>
          </button>
        </div>

        <div class="section-label" style="margin-top: 18px">가입 정책</div>
        <div class="policy-row">
          <button
            v-for="j in JOIN_POLICY"
            :key="j.id"
            type="button"
            :class="{ selected: draft.joinPolicy === j.id }"
            @click="draft.joinPolicy = j.id"
          >
            <b>{{ j.label }}</b><small>{{ j.desc }}</small>
          </button>
        </div>

        <p v-if="error" class="form-note">{{ error }}</p>

    </form>

    <template #footer>
      <button type="button" class="modal-secondary" @click="emit('close')">취소</button>
      <button :form="modalFormId1" type="submit" class="primary" :disabled="Boolean(error)">커뮤니티 만들기</button>
    </template>
  </Modal>
</template>
