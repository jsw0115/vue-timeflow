<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { navGroups } from '../router'
import { tasks, routines, events } from '../store/appState'
import { ddays } from '../store/ddays'

const emit = defineEmits(['close'])
const router = useRouter()
const query = ref('')
const scope = ref('전체')

/** 통합검색 대상 중 목업으로만 존재하는 소스(게시글/댓글/첨부파일) */
const POSTS = [
  { title: '이번 주 갓생 인증합니다', meta: '커뮤니티 · 운동 갓생방', path: '/community/board' },
  { title: '아침 루틴 30일 후기', meta: '커뮤니티 · 게시판', path: '/community/board' },
]
const COMMENTS = [
  { title: '저도 아침 회의 전에 정리하는 편이에요', meta: '댓글 · 아침 루틴 30일 후기', path: '/community/board' },
  { title: '회의록 템플릿 공유 부탁드려요', meta: '댓글 · 이번 주 갓생 인증합니다', path: '/community/board' },
]
const FILES = [
  { title: '분기_보고서_초안.pptx', meta: '첨부파일 · 2.4MB · 8/24', path: '/settings/data' },
  { title: '회의록_20260824.md', meta: '첨부파일 · 12KB · 8/24', path: '/settings/data' },
]

const SCOPES = ['전체', '메뉴·설정', '일정', '할 일', '루틴', 'D-Day', '게시글', '댓글', '첨부파일']

const allEntries = computed(() => {
  const entries = []
  navGroups.forEach((group) => {
    group.items.forEach((item) => {
      entries.push({ kind: '메뉴·설정', title: item.name, meta: `${group.label} · ${item.title}`, path: item.path })
    })
  })
  events.value.forEach((e) => entries.push({ kind: '일정', title: e.title, meta: `일정 · ${e.time} · ${e.tag}`, path: '/events' }))
  tasks.value.forEach((t) => entries.push({ kind: '할 일', title: t.title, meta: `할 일 · ${t.category}${t.done ? ' · 완료' : ''}`, path: `/tasks/${t.id}` }))
  routines.value.forEach((r) => entries.push({ kind: '루틴', title: r.title, meta: `루틴 · ${r.time}`, path: '/routines' }))
  ddays.value.forEach((d) => entries.push({ kind: 'D-Day', title: d.title, meta: `D-Day · ${d.dday} · ${d.date}`, path: `/dday/${d.id}` }))
  POSTS.forEach((p) => entries.push({ kind: '게시글', ...p }))
  COMMENTS.forEach((c) => entries.push({ kind: '댓글', ...c }))
  FILES.forEach((f) => entries.push({ kind: '첨부파일', ...f }))
  return entries
})

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return []
  return allEntries.value
    .filter((e) => scope.value === '전체' || e.kind === scope.value)
    .filter((e) => `${e.title} ${e.meta}`.toLowerCase().includes(keyword))
    .slice(0, 40)
})

function countOf(kind) {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return 0
  return allEntries.value.filter((e) => (kind === '전체' || e.kind === kind) && `${e.title} ${e.meta}`.toLowerCase().includes(keyword)).length
}

function go(entry) {
  router.push(entry.path)
  emit('close')
}
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="modal-card search-modal">
      <div class="search-modal-input">
        <span>⌕</span>
        <input v-model="query" autofocus placeholder="메뉴·설정·일정·할 일·메모·게시글·첨부파일까지 한 번에 검색" @keydown.esc="$emit('close')" />
        <button class="icon" style="width: 30px; height: 30px; font-size: 0.875rem" @click="$emit('close')">×</button>
      </div>

      <div class="filter" style="margin: 14px 0; flex-wrap: wrap; display: flex">
        <button v-for="s in SCOPES" :key="s" :class="{ selected: scope === s }" @click="scope = s">
          {{ s }}<template v-if="query.trim()"> {{ countOf(s) }}</template>
        </button>
      </div>

      <div class="search-results">
        <p v-if="!query.trim()" style="padding: 8px 0">검색어를 입력하면 메뉴·설정과 내 기록, 커뮤니티 글·댓글·첨부파일을 한 번에 찾아드려요.</p>
        <p v-else-if="results.length === 0" style="padding: 8px 0">‘{{ query }}’에 대한 결과가 없어요.</p>
        <button v-for="(r, i) in results" :key="i" class="search-result-row" @click="go(r)">
          <span class="tag">{{ r.kind }}</span>
          <span style="flex: 1; text-align: left"><b>{{ r.title }}</b><small>{{ r.meta }}</small></span>
          <span style="color: var(--color-muted)">›</span>
        </button>
      </div>
    </div>
  </div>
</template>
