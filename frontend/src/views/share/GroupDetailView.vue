<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import { groupById, membersOf, contacts, isBlocked, toggleBlock, toggleMember, groups } from '../../store/contacts'

const route = useRoute()
const router = useRouter()
const group = computed(() => groupById(route.params.id))

const showPicker = ref(false)
const keyword = ref('')

// 주소록 전체를 후보로 보여주되, 차단한 사람은 선택할 수 없도록 잠근다
const candidates = computed(() => {
  const k = keyword.value.trim()
  return contacts.value.filter((c) => !k || c.name.includes(k) || (c.relation ?? '').includes(k))
})
const memberList = computed(() => (group.value ? membersOf(group.value) : []))

function isMember(id) {
  return !!group.value && group.value.memberIds.includes(id)
}
function pick(c) {
  if (!group.value || isBlocked(c.id)) return
  toggleMember(group.value, c.id)
}
function kick(m) {
  if (!window.confirm(m.name + '님을 이 그룹에서 내보낼까요?')) return
  toggleMember(group.value, m.id)
}
function block(m) {
  if (!window.confirm(m.name + '님을 차단할까요? 모든 그룹에서 함께 제외되고 초대 후보에서도 사라져요.')) return
  toggleBlock(m.id)
}
function removeGroup() {
  if (!group.value) return
  if (!window.confirm('‘' + group.value.title + '’ 그룹을 삭제할까요? 멤버와 공유 설정이 함께 사라지고 되돌릴 수 없어요.')) return
  const id = group.value.id
  groups.value = groups.value.filter((g) => g.id !== id)
  router.push('/share/groups')
}
</script>

<template>
  <template v-if="group">
    <div class="page-tools">
      <button class="review" style="margin: 0" @click="router.push('/share/groups')">← 캘린더 그룹</button>
      <div class="form-row" style="margin: 0">
        <button class="review" style="margin: 0" @click="showPicker = true">주소록에서 초대</button>
        <button class="review" style="margin: 0" @click="removeGroup">그룹 삭제</button>
      </div>
    </div>

    <section class="card">
      <div class="head">
        <div>
          <h3 style="margin: 0">{{ group.title }}</h3>
          <p style="margin: 4px 0 0">{{ group.description || '설명이 없어요' }}</p>
        </div>
        <span class="badge" :class="group.role === '방장' ? 'brand' : ''">{{ group.role }}</span>
      </div>
      <p class="form-note" style="margin-top: 12px">멤버 {{ memberList.length }}명 · 일정 공유중</p>
    </section>

    <h3 style="margin: 24px 0 12px">멤버</h3>
    <section class="card">
      <p v-if="!memberList.length" class="form-note" style="margin: 0">아직 멤버가 없어요. 주소록에서 초대해보세요.</p>
      <div class="event" v-for="m in memberList" :key="m.id">
        <i></i>
        <span style="flex: 1"><b>{{ m.name }}</b><small>{{ m.relation }} · {{ m.email }}</small></span>
        <button class="review" style="margin: 0" @click="kick(m)">내보내기</button>
        <button class="review" style="margin: 0" @click="block(m)">차단</button>
      </div>
    </section>

    <Modal v-if="showPicker" title="주소록에서 초대" wide @close="showPicker = false">
      <input v-model="keyword" placeholder="이름 또는 관계로 검색" autofocus />
      <div class="picker-list invite-list" style="margin-top: 10px">
        <label class="picker-row" v-for="c in candidates" :key="c.id" :style="{ opacity: isBlocked(c.id) ? 0.45 : 1 }">
          <input type="checkbox" :checked="isMember(c.id)" :disabled="isBlocked(c.id)" @change="pick(c)" />
          <i>{{ c.name[0] }}</i>
          <span style="flex: 1"><b>{{ c.name }}</b><small>{{ c.relation }} · {{ c.email }}</small></span>
          <span v-if="isBlocked(c.id)" class="badge danger">차단됨</span>
        </label>
      </div>
      <p class="form-note">차단 목록에 있는 사용자는 초대할 수 없어요. 차단을 해제하면 후보에 다시 나타납니다.</p>
      <button class="primary" @click="showPicker = false">{{ memberList.length }}명 선택 완료</button>
    </Modal>
  </template>

  <section v-else class="card">
    <p>그룹을 찾을 수 없어요.</p>
    <button class="primary" @click="router.push('/share/groups')">캘린더 그룹으로</button>
  </section>
</template>
