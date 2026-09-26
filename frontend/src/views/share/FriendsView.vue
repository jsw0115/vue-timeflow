<script setup>
import { ref, computed } from 'vue'
import Modal from '../../components/Modal.vue'
import PersonTag from '../../components/PersonTag.vue'
import { contacts, blockedIds, toggleBlock } from '../../store/contacts'

const tab = ref('친구')
const friends = ref([
  { name: '박민준', status: '온라인', online: true },
  { name: '이서연', status: '5분 전 활동', online: false },
  { name: '최지우', status: '1시간 전 활동', online: false },
])

const ALL_USERS = ['이현우', '정다은', '한소율', '오지훈', '배수아']
const showModal = ref(false)
const query = ref('')
const requested = ref([])
const searchResults = computed(() => {
  if (!query.value.trim()) return []
  return ALL_USERS.filter((n) => n.includes(query.value.trim()) && !friends.value.some((f) => f.name === n))
})
function sendRequest(name) {
  if (!requested.value.includes(name)) requested.value.push(name)
}

/* 받은 친구 요청 — 수락하면 친구 목록에 들어가고 거절하면 사라진다 */
const incoming = ref([
  { id: 1, name: '이현우', mutual: 3 },
  { id: 2, name: '정다은', mutual: 1 },
])
function accept(req) {
  friends.value.push({ name: req.name, status: '방금 친구가 됐어요', online: false })
  incoming.value = incoming.value.filter((r) => r.id !== req.id)
}
function reject(req) {
  if (!window.confirm(req.name + '님의 친구 요청을 거절할까요?')) return
  incoming.value = incoming.value.filter((r) => r.id !== req.id)
}
function unfriend(f) {
  if (!window.confirm(f.name + '님을 친구 목록에서 삭제할까요?')) return
  friends.value = friends.value.filter((x) => x.name !== f.name)
}
</script>

<template>
  <div class="page-tools">
    <div class="tabs">
      <button :class="{ selected: tab === '친구' }" @click="tab = '친구'">친구 {{ friends.length }}</button>
      <button :class="{ selected: tab === '요청' }" @click="tab = '요청'">요청 {{ incoming.length }}</button>
      <button :class="{ selected: tab === '차단' }" @click="tab = '차단'">차단 {{ blockedIds.length }}</button>
    </div>
    <span></span>
    <button class="primary" @click="((showModal = true), (query = ''))">+ 친구 찾기</button>
  </div>
  <!-- 받은 요청 -->
  <section class="card" v-if="tab === '요청'">
    <div class="event" v-for="r in incoming" :key="r.id">
      <i></i>
      <span style="flex: 1"><PersonTag :name="r.name" bold /><small>공통 친구 {{ r.mutual }}명</small></span>
      <button class="primary" style="padding: 6px 12px" @click="accept(r)">수락</button>
      <button class="review" style="margin: 0" @click="reject(r)">거절</button>
    </div>
    <p v-if="!incoming.length" class="form-note" style="margin: 0">받은 친구 요청이 없어요.</p>
  </section>

  <!-- 차단 목록 -->
  <section class="card" v-else-if="tab === '차단'">
    <div class="event" v-for="c in contacts.filter((x) => blockedIds.includes(x.id))" :key="c.id">
      <i></i>
      <span style="flex: 1"><PersonTag :name="c.name" bold /><small>{{ c.relation }} · {{ c.email }}</small></span>
      <button class="review" style="margin: 0" @click="toggleBlock(c.id)">차단 해제</button>
    </div>
    <p v-if="!blockedIds.length" class="form-note" style="margin: 0">차단한 사용자가 없어요.</p>
  </section>

  <!-- 친구 목록 -->
  <section class="card" v-else>
    <div class="event" v-for="f in friends" :key="f.name">
      <i></i>
      <span style="flex: 1"><PersonTag :name="f.name" bold /><small>{{ f.status }}</small></span>
      <span :style="{ width: '8px', height: '8px', borderRadius: '50%', background: f.online ? 'var(--color-accent)' : 'var(--color-hairline)' }"></span>
      <button class="review" style="margin: 0" @click="unfriend(f)">삭제</button>
    </div>
    <p v-if="!friends.length" class="form-note" style="margin: 0">아직 친구가 없어요.</p>
  </section>

  <Modal v-if="showModal" title="친구 찾기" @close="showModal = false">
    <label>이름으로 검색<input v-model="query" placeholder="친구 이름 입력" autofocus /></label>
    <p v-if="query.trim() && searchResults.length === 0" style="margin-top: 10px">일치하는 사용자를 찾지 못했어요.</p>
    <div class="modal-search-result" v-for="n in searchResults" :key="n">
      <i style="display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--color-foreground); color: var(--color-on-primary); font-style: normal; font-size: 11px; font-weight: 600">{{ n[0] }}</i>
      <span style="flex: 1; font-size: 12px; font-weight: 600">{{ n }}</span>
      <button v-if="requested.includes(n)" disabled style="font-size: 11px; color: var(--color-muted)">요청됨</button>
      <button v-else class="primary" style="width: auto; margin: 0; padding: 7px 12px; font-size: 11px" @click="sendRequest(n)">친구 요청</button>
    </div>
  </Modal>
</template>
