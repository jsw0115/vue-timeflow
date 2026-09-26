<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { contacts, groups, membersOf, isBlocked, toggleBlock, toggleMember, contactById } from '../../store/contacts'

const router = useRouter()
const keyword = ref('')
const scope = ref('전체')

const scopes = computed(() => ['전체', '차단', ...groups.value.map((g) => g.title)])

const rows = computed(() => {
  const k = keyword.value.trim()
  let list = contacts.value
  if (scope.value === '차단') list = list.filter((c) => isBlocked(c.id))
  else if (scope.value !== '전체') {
    const g = groups.value.find((x) => x.title === scope.value)
    list = g ? membersOf(g) : []
  }
  return list.filter((c) => !k || c.name.includes(k) || c.relation.includes(k) || c.email.includes(k))
})

function groupsOf(id) {
  return groups.value.filter((g) => g.memberIds.includes(id)).map((g) => g.title)
}

// 참석자 피커 — 별도 페이지 대신 이 화면의 모달로 동작한다
const showPicker = ref(false)
const picked = ref([])
const pickerKeyword = ref('')
const pickerCandidates = computed(() => {
  const k = pickerKeyword.value.trim()
  return contacts.value.filter((c) => !k || c.name.includes(k) || c.relation.includes(k))
})
function togglePick(c) {
  if (isBlocked(c.id)) return
  picked.value = picked.value.includes(c.id) ? picked.value.filter((i) => i !== c.id) : [...picked.value, c.id]
}
function confirmPick() {
  showPicker.value = false
}

// 그룹 초대 모달
const inviteFor = ref(null)
function openInvite(c) {
  inviteFor.value = c
}
function inviteToGroup(g) {
  if (!inviteFor.value) return
  toggleMember(g, inviteFor.value.id)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">주소록</b>
    <span></span>
    <button class="primary" @click="showPicker = true">참석자 선택</button>
  </div>

  <ListFilterBar
    v-model:query="keyword"
    :filters="{ scope }"
    :groups="[{ id: 'scope', all: '전체', options: scopes.map((s) => ({ value: s, label: s })) }]"
    placeholder="이름·관계·메일 검색"
    :result-count="rows.length"
    :total-count="contacts.length"
    @update:filters="scope = $event.scope"
  />

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.6fr 1.4fr 0.8fr 1.2fr"><span>이름</span><span>소속 그룹</span><span>관계</span><span>관리</span></div>
    <div class="row" style="grid-template-columns: 1.6fr 1.4fr 0.8fr 1.2fr" v-for="c in rows" :key="c.id">
      <label>{{ c.name }}<small style="display: block; color: var(--color-muted)">{{ c.email }}</small></label>
      <span style="display: flex; gap: 4px; flex-wrap: wrap">
        <span v-for="t in groupsOf(c.id)" :key="t" class="tag">{{ t }}</span>
        <span v-if="!groupsOf(c.id).length" class="form-note" style="margin: 0">-</span>
      </span>
      <span class="tag">{{ c.relation }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="openInvite(c)">그룹 초대</button>
        <button class="review" style="margin: 0" @click="toggleBlock(c.id)">{{ isBlocked(c.id) ? '차단 해제' : '차단' }}</button>
      </span>
    </div>
    <p v-if="!rows.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 연락처가 없어요.</p>
  </section>

  <p class="form-note" style="margin-top: 12px">
    차단하면 주소록 초대 후보와 캘린더 그룹 멤버에서 즉시 제외돼요.
    <a href="#" @click.prevent="router.push('/share/blocked')">차단 목록 보기</a>
  </p>

  <Modal v-if="showPicker" title="참석자 선택" wide @close="showPicker = false">
    <input v-model="pickerKeyword" placeholder="이름으로 검색" autofocus />
    <div class="picker-list invite-list" style="margin-top: 10px">
      <label class="picker-row" v-for="p in pickerCandidates" :key="p.id" :style="{ opacity: isBlocked(p.id) ? 0.45 : 1 }">
        <input type="checkbox" :checked="picked.includes(p.id)" :disabled="isBlocked(p.id)" @change="togglePick(p)" />
        <i>{{ p.name[0] }}</i>
        <span style="flex: 1"><b>{{ p.name }}</b><small>{{ p.relation }} · {{ p.email }}</small></span>
        <span v-if="isBlocked(p.id)" class="badge danger">차단됨</span>
      </label>
    </div>
    <p class="form-note">선택한 사람: {{ picked.map((i) => contactById(i)?.name).filter(Boolean).join(', ') || '없음' }}</p>
    <button class="primary" @click="confirmPick">{{ picked.length }}명 선택 완료</button>
  </Modal>

  <Modal v-if="inviteFor" :title="`${inviteFor.name} 그룹 초대`" @close="inviteFor = null">
    <p class="form-note" style="margin-top: 0">추가할 그룹을 선택하세요. 다시 누르면 해당 그룹에서 빠집니다.</p>
    <label class="picker-row" v-for="g in groups" :key="g.id" style="border-bottom: 1px solid var(--color-hairline)">
      <input type="checkbox" :checked="g.memberIds.includes(inviteFor.id)" :disabled="isBlocked(inviteFor.id)" @change="inviteToGroup(g)" />
      <i>{{ g.title[0] }}</i>
      <span><b>{{ g.title }}</b><small>멤버 {{ g.memberIds.length }}명</small></span>
    </label>
    <p v-if="isBlocked(inviteFor.id)" class="form-note">차단된 사용자는 그룹에 초대할 수 없어요.</p>
    <button class="primary" @click="inviteFor = null">완료</button>
  </Modal>
</template>
