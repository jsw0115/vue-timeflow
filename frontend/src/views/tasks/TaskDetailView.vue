<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, toggle } from '../../store/appState'

import ChecklistEditor from '../../components/ChecklistEditor.vue'
import EditPresence from '../../components/EditPresence.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'

const route = useRoute()
const router = useRouter()
const task = computed(() => tasks.value.find((t) => String(t.id) === String(route.params.id)))

const draft = ref({ title: '', category: '업무' })
watch(task, value => {
  if (value) draft.value = { title: value.title, category: value.category, body: value.body ?? '', date: value.date ?? '', priority: value.priority ?? '보통', subtasks: (value.subtasks ?? []).map(item => ({ ...item })) }
}, { immediate: true })
const canSave = computed(() => !!draft.value.title.trim() && (draft.value.subtasks ?? []).every(item => item.title.trim()))
const saved = ref(false)
watch(draft, () => { saved.value = false }, { deep: true })

function save() {
  if (!task.value || !canSave.value) return
  task.value.title = draft.value.title.trim()
  Object.assign(task.value, { category: draft.value.category, body: draft.value.body, date: draft.value.date, priority: draft.value.priority, subtasks: draft.value.subtasks.map(item => ({ ...item, title: item.title.trim() })) })
  saved.value = true
}
function remove() {
  if (!task.value) return
  if (!window.confirm('‘' + task.value.title + '’ 할 일을 삭제할까요? 하위 항목도 함께 사라져요.')) return
  tasks.value = tasks.value.filter((t) => t.id !== task.value.id)
  router.push('/tasks')
}
</script>

<template>
  <div class="crumbs"><a @click="router.push('/tasks')">할 일</a> / 상세</div>
  <section v-if="task" class="card" style="max-width: 520px; margin: 0 auto">
    <EditPresence :resource="'task:' + task.id" />
    <div class="head">
      <div>
        <span class="tag">{{ task.category }}</span>
        <h2 style="margin: 10px 0 4px">{{ task.title }}</h2>
        <p>{{ task.done ? '완료됨' : '진행중' }}</p>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 600">
        <input type="checkbox" :checked="task.done" @change="toggle(task)" />완료
      </label>
    </div>

    <div style="margin-top: 16px; padding-top: 20px; border-top: 1px solid var(--color-hairline)">
      <label>제목<input v-model="draft.title" /></label>
      <label>카테고리<select v-model="draft.category"><option>업무</option><option>공부</option><option>건강</option><option>휴식</option><option>개인</option></select></label>
      <label>마감일<input type="date" v-model="draft.date" /></label>
      <label>우선순위<select v-model="draft.priority"><option>높음</option><option>보통</option><option>낮음</option></select></label>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
      <ChecklistEditor v-model="draft.subtasks" />
      <p v-if="!canSave" class="form-note" role="status">제목과 체크리스트 항목 이름을 입력해주세요.</p>
      <p v-if="saved" class="form-note" role="status">저장했어요.</p>
      <button class="primary" :disabled="!canSave" style="width: 100%; margin-top: 14px" @click="save">저장하기</button>
    </div>


    <button style="width: 100%; margin-top: 20px; color: #b23b3b; font-weight: 700; padding: 10px" @click="remove">삭제하기</button>
  </section>
  <p v-else>할 일을 찾을 수 없어요. <a @click="router.push('/tasks')" style="color: var(--color-accent); font-weight: 700; cursor: pointer">목록으로 돌아가기</a></p>
</template>
