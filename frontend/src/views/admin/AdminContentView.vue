<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { contents, CONTENT_TABS, addContent, toggleContentLive, removeContent } from '../../store/adminOps'

const tab = ref('명언')
const query = ref('')
const visible = computed(() => {
  const k = query.value.trim()
  return contents.value.filter((c) => c.kind === tab.value && (!k || c.body.includes(k) || c.where.includes(k)))
})
const liveCount = computed(() => contents.value.filter((c) => c.kind === tab.value && c.live).length)

const showAdd = ref(false)
const draft = ref({ body: '', where: '' })
function openAdd() {
  draft.value = { body: '', where: '' }
  showAdd.value = true
}
function submit() {
  if (!draft.value.body.trim()) return
  addContent({ kind: tab.value, body: draft.value.body, where: draft.value.where })
  showAdd.value = false
}
function onRemove(c) {
  if (!window.confirm('‘' + c.body.slice(0, 20) + '’ 콘텐츠를 삭제할까요?')) return
  removeContent(c)
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>콘텐츠 관리</h2><p>앱 곳곳에 노출되는 문구·템플릿·스티커를 관리해요</p></div>
    <button class="primary" @click="openAdd">+ 콘텐츠 추가</button>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="t in CONTENT_TABS" :key="t" :class="{ selected: tab === t }" @click="tab = t">{{ t }}</button>
    </div>
    <input v-model="query" placeholder="내용·노출 위치 검색" />
    <span class="badge ok">노출중 {{ liveCount }}건</span>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 2.4fr 1.2fr 1fr .8fr 1fr">
      <span>내용</span><span>노출 위치</span><span>등록일</span><span>상태</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 2.4fr 1.2fr 1fr .8fr 1fr" v-for="c in visible" :key="c.id">
      <label>{{ c.body }}</label>
      <span class="tag">{{ c.where }}</span>
      <span class="figure">{{ c.date }}</span>
      <span class="badge" :class="c.live ? 'ok' : ''">{{ c.live ? '노출중' : '숨김' }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="toggleContentLive(c)">{{ c.live ? '숨기기' : '노출' }}</button>
        <button class="review" style="margin: 0" @click="onRemove(c)">삭제</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">등록된 {{ tab }} 콘텐츠가 없어요.</p>
  </section>

  <Modal v-if="showAdd" :title="tab + ' 추가'" @close="showAdd = false">
    <label>내용<textarea v-model="draft.body" placeholder="노출할 문구나 이름을 입력하세요" autofocus></textarea></label>
    <label>노출 위치<input v-model="draft.where" placeholder="예: 홈 대시보드" @keyup.enter="submit" /></label>
    <p class="form-note">추가하면 ‘숨김’ 상태로 등록돼요. 검수 후 노출로 바꿔주세요.</p>
    <button class="primary" @click="submit">추가하기</button>
  </Modal>
</template>
