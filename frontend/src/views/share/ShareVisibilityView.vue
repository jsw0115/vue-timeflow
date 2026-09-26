<script setup>
import { computed, ref } from 'vue'
import { groups, membersOf } from '../../store/contacts'

/** 공유 가시성 — 그룹별로 공개 범위를 정하고 저장한다. */
const LEVELS = [
  { id: 'title', icon: '\u25d1', label: '일정 제목만 공개', desc: "그룹원에게 '바쁨'으로만 표시돼요" },
  { id: 'full', icon: '\u25f7', label: '전체 내용 공개', desc: '제목, 시간, 장소가 모두 표시돼요' },
  { id: 'none', icon: '\u2298', label: '나만 보기', desc: '공유 캘린더에 표시하지 않아요' },
]

const level = ref('title')
const targetIds = ref(groups.value.map((g) => g.id))
const saved = ref('')
const notice = ref('')

function toggleTarget(id) {
  const i = targetIds.value.indexOf(id)
  if (i >= 0) targetIds.value.splice(i, 1)
  else targetIds.value.push(id)
}
function snapshot() {
  return JSON.stringify({ level: level.value, targets: [...targetIds.value].sort() })
}
saved.value = snapshot()
const isDirty = computed(() => saved.value !== snapshot())
const canSave = computed(() => targetIds.value.length > 0 && isDirty.value)

function save() {
  if (!canSave.value) return
  saved.value = snapshot()
  notice.value = '공개 범위를 저장했어요.'
  setTimeout(() => (notice.value = ''), 2500)
}
</script>

<template>
  <div class="form-pattern">
    <section class="card form-card">
      <div class="setting-head">
        <div>
          <h2>공개 범위 설정</h2>
          <p>선택한 그룹에 내 일정이 어떻게 보일지 정해요</p>
        </div>
        <span v-if="notice" class="badge ok">{{ notice }}</span>
      </div>

      <div class="section-label">공개 수준</div>
      <button
        v-for="l in LEVELS"
        :key="l.id"
        type="button"
        class="mode"
        :class="{ selected: level === l.id }"
        @click="level = l.id"
      >
        <b>{{ l.icon }}</b>
        <span><span style="display: block; font-weight: 700">{{ l.label }}</span><small>{{ l.desc }}</small></span>
      </button>

      <div class="section-label" style="margin-top: 20px">적용 대상 그룹 ({{ targetIds.length }}/{{ groups.length }})</div>
      <label class="task" v-for="g in groups" :key="g.id" style="border-bottom: 1px solid var(--color-hairline)">
        <input type="checkbox" :checked="targetIds.includes(g.id)" @change="toggleTarget(g.id)" />
        <span style="flex: 1"><b>{{ g.title }}</b><small>멤버 {{ membersOf(g).length }}명</small></span>
      </label>
      <p v-if="!groups.length" class="form-note">아직 캘린더 그룹이 없어요.</p>

      <p v-if="!targetIds.length" class="form-note">적용할 그룹을 하나 이상 선택해주세요.</p>
      <button class="primary" :disabled="!canSave" @click="save">저장하기</button>
      <p v-if="isDirty && targetIds.length" class="form-note">저장하지 않은 변경사항이 있어요.</p>
    </section>
  </div>
</template>
