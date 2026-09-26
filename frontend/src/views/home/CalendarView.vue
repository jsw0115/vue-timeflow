<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { events, tasks } from '../../store/appState'
import { ddays, isPast } from '../../store/ddays'
import { posts, ME } from '../../store/tagging'

/**
 * 통합 캘린더 — 일정·D-Day·할 일 마감·내 기록을 한 달 위에 겹쳐 본다.
 * 종류별로 켜고 끌 수 있고, 날짜를 누르면 그날 항목만 아래에 모아 보여준다.
 */
const router = useRouter()
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TODAY = '2026-09-06'

const cursor = ref(new Date(TODAY))
const selected = ref(TODAY)

const KINDS = [
  { id: 'event', label: '일정', color: 'var(--color-accent)' },
  { id: 'dday', label: 'D-Day', color: 'var(--color-foreground)' },
  { id: 'task', label: '할 일', color: '#43596b' },
  { id: 'post', label: '내 기록', color: '#8a6a3c' },
]
const on = ref({ event: true, dday: true, task: true, post: true })
function toggleKind(id) {
  on.value[id] = !on.value[id]
}

function iso(d) {
  return d.toISOString().slice(0, 10)
}
function shiftMonth(delta) {
  const d = new Date(cursor.value)
  d.setMonth(d.getMonth() + delta)
  cursor.value = d
}
function goToday() {
  cursor.value = new Date(TODAY)
  selected.value = TODAY
}
const monthLabel = computed(() => cursor.value.getFullYear() + '년 ' + (cursor.value.getMonth() + 1) + '월')

/** 날짜 문자열이 없는 목업 데이터를 이 달 기준으로 해석한다 */
function eventDate(e, index) {
  const base = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const m = String(e.date ?? '').match(/(\d{1,2})\/(\d{1,2})/)
  if (m) return iso(new Date(cursor.value.getFullYear(), Number(m[1]) - 1, Number(m[2])))
  if (String(e.date ?? '').includes('오늘')) return TODAY
  base.setDate(base.getDate() + ((index * 5) % 27))
  return iso(base)
}
function ddayDate(d) {
  const m = String(d.date ?? '').match(/(\d{1,2})월\s*(\d{1,2})일/)
  if (!m) return null
  return iso(new Date(cursor.value.getFullYear(), Number(m[1]) - 1, Number(m[2])))
}

/** 날짜 → 항목 목록 */
const itemsByDate = computed(() => {
  const map = new Map()
  const add = (date, item) => {
    if (!date) return
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(item)
  }
  if (on.value.event) events.value.forEach((e, i) => add(eventDate(e, i), { kind: 'event', title: e.title, meta: e.category ?? e.tag ?? '', link: '/events' }))
  if (on.value.dday) ddays.value.forEach((d) => add(ddayDate(d), { kind: 'dday', title: d.title, meta: d.dday, link: '/dday/' + d.id }))
  if (on.value.task) {
    tasks.value.forEach((t, i) => {
      const d = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), ((i * 7) % 27) + 1)
      add(iso(d), { kind: 'task', title: t.title, meta: t.done ? '완료' : t.category, link: '/tasks/' + t.id, done: t.done })
    })
  }
  if (on.value.post) posts.value.filter((p) => p.author === ME).forEach((p) => add(p.at, { kind: 'post', title: p.title, meta: p.kind, link: p.link }))
  return map
})

const grid = computed(() => {
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = iso(d)
    return {
      key,
      date: d.getDate(),
      out: d.getMonth() !== cursor.value.getMonth(),
      today: key === TODAY,
      items: itemsByDate.value.get(key) ?? [],
    }
  })
})

const selectedItems = computed(() => itemsByDate.value.get(selected.value) ?? [])
const monthCount = computed(() => grid.value.filter((c) => !c.out).reduce((a, c) => a + c.items.length, 0))
const upcomingDdays = computed(() => ddays.value.filter((d) => !isPast(d.dday)).slice(0, 5))
function colorOf(kind) {
  return KINDS.find((k) => k.id === kind)?.color ?? 'var(--color-hairline)'
}
function labelOf(kind) {
  return KINDS.find((k) => k.id === kind)?.label ?? kind
}
</script>

<template>
  <div class="page-tools">
    <button class="review" style="margin: 0" aria-label="이전 달" @click="shiftMonth(-1)">‹</button>
    <b style="font-size: 16px">{{ monthLabel }}</b>
    <button class="review" style="margin: 0" aria-label="다음 달" @click="shiftMonth(1)">›</button>
    <button class="review" style="margin: 0" @click="goToday">오늘</button>
    <span class="form-note" style="margin: 0">이 달 항목 {{ monthCount }}개</span>
    <span></span>
    <div class="filter">
      <button v-for="k in KINDS" :key="k.id" :class="{ selected: on[k.id] }" @click="toggleKind(k.id)">{{ k.label }}</button>
    </div>
  </div>

  <div class="cal-layout">
    <section class="card">
      <div class="cal-grid cal-head">
        <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
      </div>
      <div class="cal-grid">
        <button
          v-for="c in grid"
          :key="c.key"
          class="cal-cell"
          :class="{ out: c.out, today: c.today, selected: selected === c.key }"
          @click="selected = c.key"
        >
          <b>{{ c.date }}</b>
          <span class="cal-dots">
            <i v-for="(it, i) in c.items.slice(0, 4)" :key="i" :style="{ background: colorOf(it.kind) }"></i>
            <em v-if="c.items.length > 4">+{{ c.items.length - 4 }}</em>
          </span>
        </button>
      </div>
      <div class="cal-legend">
        <span v-for="k in KINDS" :key="k.id" :class="{ off: !on[k.id] }">
          <i :style="{ background: k.color }"></i>{{ k.label }}
        </span>
      </div>
    </section>

    <aside class="card">
      <div class="head">
        <div><h3 style="margin: 0">{{ selected }}</h3><p style="margin: 4px 0 0">{{ selectedItems.length }}개 항목</p></div>
      </div>
      <div class="event" v-for="(it, i) in selectedItems" :key="i" @click="router.push(it.link)" style="cursor: pointer">
        <i :style="{ background: colorOf(it.kind) }"></i>
        <span style="flex: 1">
          <b :class="{ done: it.done }">{{ it.title }}</b>
          <small>{{ labelOf(it.kind) }} · {{ it.meta }}</small>
        </span>
      </div>
      <p v-if="!selectedItems.length" class="form-note" style="margin: 0">이 날에는 기록이 없어요.</p>

      <div class="section-label" style="margin-top: 20px">다가오는 D-Day</div>
      <div class="event" v-for="d in upcomingDdays" :key="d.id" @click="router.push('/dday/' + d.id)" style="cursor: pointer">
        <i></i>
        <span style="flex: 1"><b>{{ d.title }}</b><small>{{ d.date }}</small></span>
        <b class="figure">{{ d.dday }}</b>
      </div>
      <p v-if="!upcomingDdays.length" class="form-note" style="margin: 0">예정된 D-Day가 없어요.</p>
    </aside>
  </div>
</template>
