<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import { groups, membersOf, addGroup, blockedIds, contacts, isBlocked, toggleMember, groupById } from '../../store/contacts'

const router = useRouter()
const showModal = ref(false)
const draftTitle = ref('')
const draftDesc = ref('')
// 그룹을 만들 때 멤버도 함께 고른다 — 차단한 사람은 고를 수 없다
const draftMemberIds = ref([])
const memberKeyword = ref('')
const candidates = computed(() => {
  const k = memberKeyword.value.trim()
  return contacts.value.filter((c) => !k || c.name.includes(k) || c.relation.includes(k))
})
function toggleDraftMember(c) {
  if (isBlocked(c.id)) return
  draftMemberIds.value = draftMemberIds.value.includes(c.id)
    ? draftMemberIds.value.filter((i) => i !== c.id)
    : [...draftMemberIds.value, c.id]
}
function openCreate() {
  draftTitle.value = ''
  draftDesc.value = ''
  draftMemberIds.value = []
  memberKeyword.value = ''
  showModal.value = true
}

const blockedCount = computed(() => blockedIds.value.length)

function createGroup() {
  if (!draftTitle.value.trim()) return
  const id = addGroup({ title: draftTitle.value.trim(), description: draftDesc.value.trim() })
  // 모달에서 고른 멤버를 그대로 새 그룹에 넣는다
  const created = groupById(id)
  if (created) draftMemberIds.value.forEach((memberId) => toggleMember(created, memberId))
  showModal.value = false
  router.push(`/share/groups/${id}`)
}
function open(g) {
  router.push(`/share/groups/${g.id}`)
}
</script>

<template>
  <div class="page-tools">
    <span class="form-note" style="margin: 0">주소록과 연동돼요 · 차단한 {{ blockedCount }}명은 초대 후보에서 제외됩니다</span>
    <button class="primary" @click="openCreate">+ 그룹 만들기</button>
  </div>

  <div class="comm-grid">
    <section class="card group-card" v-for="g in groups" :key="g.id" role="button" tabindex="0" @click="open(g)" @keyup.enter="open(g)">
      <div class="head">
        <b>{{ g.title }}</b>
        <span class="badge" :class="g.role === '방장' ? 'brand' : ''">{{ g.role }}</span>
      </div>
      <p>{{ g.description || '설명이 없어요' }}</p>
      <div class="member-chips">
        <i v-for="m in membersOf(g).slice(0, 5)" :key="m.id" :title="m.name">{{ m.name[0] }}</i>
        <span v-if="!membersOf(g).length" class="form-note" style="margin: 0">아직 멤버가 없어요</span>
      </div>
      <button class="primary" style="width: 100%; margin-top: 12px" @click.stop="open(g)">멤버 관리</button>
    </section>
  </div>

  <Modal v-if="showModal" title="그룹 만들기" wide @close="showModal = false">
    <label>그룹 이름<input v-model="draftTitle" placeholder="예: 갓생 크루" autofocus /></label>
    <label>설명(선택)<textarea v-model="draftDesc" placeholder="어떤 그룹인지 한 줄로 소개해보세요"></textarea></label>

    <div class="section-label">함께할 멤버 ({{ draftMemberIds.length }}명 선택)</div>
    <input v-model="memberKeyword" placeholder="이름 또는 관계로 검색" />
    <div class="picker-list invite-list" style="margin-top: 10px">
      <label class="picker-row" v-for="c in candidates" :key="c.id" :style="{ opacity: isBlocked(c.id) ? 0.45 : 1 }">
        <input type="checkbox" :checked="draftMemberIds.includes(c.id)" :disabled="isBlocked(c.id)" @change="toggleDraftMember(c)" />
        <i>{{ c.name[0] }}</i>
        <span style="flex: 1"><b>{{ c.name }}</b><small>{{ c.relation }} · {{ c.email }}</small></span>
        <span v-if="isBlocked(c.id)" class="badge danger">차단됨</span>
      </label>
    </div>
    <p class="form-note">멤버는 나중에 그룹 상세에서도 추가·제외할 수 있어요. 차단한 사용자는 선택할 수 없습니다.</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showModal = false">취소</button>
      <button class="primary" @click="createGroup">그룹 만들기</button>
    </template>
  </Modal>
</template>
