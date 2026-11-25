<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { localDate } from '../../utils/postValidation.mjs'
import { eventOccurrences, occurrenceLink } from '../../utils/recurrence.mjs'
import { events, tasks } from '../../store/appState'
import { ddays, isPast } from '../../store/ddays'
import { ddayCellDate } from '../../utils/dday.mjs'
import { posts, ME } from '../../store/tagging'

/**
 * 통합 캘린더 — 일정·D-Day·할 일 마감·내 기록을 한 달 위에 겹쳐 본다.
 * 종류별로 켜고 끌 수 있고, 날짜를 누르면 그날 항목만 아래에 모아 보여준다.
 */
const router = useRouter()
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TODAY = localDate()

const cursor = ref(new Date(TODAY))
const selected = ref(TODAY)

const KINDS = [
  // 종류 색은 콘텐츠 색 토큰이다(서비스 accent와 따로). 모양도 함께 달라 색만으로 구분하지 않는다
  { id: 'event', label: '일정', color: 'var(--color-content-sage)' },
  { id: 'dday', label: 'D-Day', color: 'var(--color-foreground)' },
  { id: 'task', label: '할 일', color: 'var(--color-content-slate)' },
  { id: 'post', label: '내 기록', color: 'var(--color-content-ochre)' },
]
const on = ref({ event: true, dday: true, task: true, post: true })
function toggleKind(id) {
  on.value[id] = !on.value[id]
}

function iso(d) {
  return localDate(d)
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
const monthLabel = computed(() => (bodyLocale.value === 'ko' ? cursor.value.getFullYear() + '년 ' + (cursor.value.getMonth() + 1) + '월' : formatDate(cursor.value, bodyLocale.value, { year: 'numeric', month: 'long' })))

/** 날짜 → 항목 목록 */
const itemsByDate = computed(() => {
  const map = new Map()
  const add = (date, item) => {
    if (!date) return
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(item)
  }
  if (on.value.event) {
    const from = iso(new Date(cursor.value.getFullYear(), cursor.value.getMonth(), -6)), to = iso(new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 7))
    for (const event of eventOccurrences(events.value, from, to)) {
      const date = new Date((event.startDate < from ? from : event.startDate) + 'T12:00:00')
      while (iso(date) <= event.endDate && iso(date) <= to) {
        // 반복 일정은 그 회차를 연 상태로 일정 화면에 연결한다(PR-22 2단계). 회차만 바꾼 일정은 그 사실을 함께 보인다
        add(iso(date), { kind: 'event', title: event.title, meta: tr(event.category ?? event.tag ?? '') + (event.overridden ? ' · ' + tr('이 회차만 변경') : ''), link: occurrenceLink(event) })
        date.setDate(date.getDate() + 1)
      }
    }
  }
  if (on.value.dday) ddays.value.forEach((d) => add(ddayCellDate(d, TODAY), { kind: 'dday', title: d.title, meta: d.dday, link: '/dday/' + d.id }))
  if (on.value.task) {
    tasks.value.forEach(t => add(t.date, { kind: 'task', title: t.title, meta: t.done ? tr('완료') : tr(t.category), link: '/tasks/' + t.id, done: t.done }))
  }
  if (on.value.post) posts.value.filter((p) => p.author === ME).forEach((p) => add(p.at, { kind: 'post', title: p.title, meta: tr(p.kind), link: p.link }))
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
// 날짜 이름은 본문 언어 형식이다(예전에는 늘 ko-KR이었다)
const dayFormat = computed(() => new Intl.DateTimeFormat(bodyLocale.value === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'short' }))
// 요일 머리글(일요일부터). 2024-01-07은 일요일이다
const weekdayName = (i) => (bodyLocale.value === 'ko' ? WEEKDAYS[i] : formatDate(new Date(2024, 0, 7 + i), bodyLocale.value, { weekday: 'short' }))
const dayName = (c) => dayFormat.value.format(new Date(c.key + 'T12:00:00')) + (c.today ? tr(', 오늘') : '')
const selectedLabel = computed(() => dayFormat.value.format(new Date(selected.value + 'T12:00:00')) + (selected.value === TODAY ? ' · ' + tr('오늘') : ''))
function labelOf(kind) {
  return tr(KINDS.find((k) => k.id === kind)?.label ?? kind)
}
</script>

<template>
  <!-- 달 이동(왼쪽)과 종류 켜기·끄기(오른쪽)를 한 줄에 둔다. 종류는 색과 모양(동그라미·마름모·네모·고리)을 함께 쓴다 -->
  <div class="cal-toolbar">
    <div class="cal-period" role="group" :aria-label="tr('달 이동')">
      <button type="button" class="icon-button" :aria-label="tr('이전 달')" :title="tr('이전 달')" @click="shiftMonth(-1)">‹</button>
      <h2 class="cal-month" aria-live="polite">{{ monthLabel }}</h2>
      <button type="button" class="icon-button" :aria-label="tr('다음 달')" :title="tr('다음 달')" @click="shiftMonth(1)">›</button>
      <button type="button" class="button-text" @click="goToday">{{ tr('오늘') }}</button>
      <span class="cal-count">{{ tr('이 달') }} <b class="figure">{{ monthCount }}</b><template v-if="bodyLocale === 'ko'">개</template></span>
    </div>
    <div class="segmented-tab cal-kinds" role="group" :aria-label="tr('보일 종류')">
      <button v-for="k in KINDS" :key="k.id" type="button" :aria-pressed="on[k.id]" @click="toggleKind(k.id)"><i class="kind-mark" :class="'kind-' + k.id" :style="{ '--kind-color': k.color }" aria-hidden="true"></i>{{ tr(k.label) }}</button>
    </div>
  </div>

  <div class="cal-layout">
    <section class="card cal-board" :aria-label="tr('월간 캘린더')">
      <div class="cal-grid cal-head" aria-hidden="true">
        <span v-for="(w, i) in WEEKDAYS" :key="w">{{ weekdayName(i) }}</span>
      </div>
      <div class="cal-grid">
        <button
          v-for="c in grid"
          :key="c.key"
          type="button"
          class="cal-cell"
          :class="{ out: c.out, today: c.today, selected: selected === c.key }"
          :aria-pressed="selected === c.key"
          :aria-label="dayName(c) + (c.items.length === 1 ? tr(', 항목 1개') : c.items.length ? tr(', 항목 {n}개', { n: c.items.length }) : '')"
          @click="selected = c.key"
        >
          <b class="cal-date">{{ c.date }}</b>
          <ul class="cal-items" aria-hidden="true">
            <li v-for="(it, i) in c.items.slice(0, 2)" :key="i"><i class="kind-mark" :class="'kind-' + it.kind" :style="{ '--kind-color': colorOf(it.kind) }"></i><span>{{ it.title }}</span></li>
          </ul>
          <span v-if="c.items.length" class="cal-dots" aria-hidden="true">
            <i v-for="(it, i) in c.items.slice(0, 4)" :key="i" class="kind-mark" :class="'kind-' + it.kind" :style="{ '--kind-color': colorOf(it.kind) }"></i>
          </span>
          <em v-if="c.items.length > 2" class="cal-more" aria-hidden="true">+{{ c.items.length - 2 }}</em>
        </button>
      </div>
    </section>

    <aside class="card cal-side" aria-labelledby="cal-day-title">
      <h3 id="cal-day-title">{{ selectedLabel }}</h3>
      <p class="cal-side-count">{{ selectedItems.length ? tr('항목 {n}개', { n: selectedItems.length }) : tr('항목 없음') }}</p>
      <ul v-if="selectedItems.length" class="cal-day-list">
        <li v-for="(it, i) in selectedItems" :key="i">
          <RouterLink :to="it.link">
            <i class="kind-mark" :class="'kind-' + it.kind" :style="{ '--kind-color': colorOf(it.kind) }" aria-hidden="true"></i>
            <span><b :class="{ done: it.done }">{{ it.title }}</b><small>{{ labelOf(it.kind) }}{{ it.meta ? ' · ' + it.meta : '' }}</small></span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="empty-state">{{ tr('이 날에는 기록이 없어요. 다른 날짜를 고르거나 \'새 글 작성\'으로 남겨 보세요.') }}</p>

      <h4 class="cal-side-sub">{{ tr('다가오는 D-Day') }}</h4>
      <ul v-if="upcomingDdays.length" class="cal-day-list">
        <li v-for="d in upcomingDdays" :key="d.id">
          <RouterLink :to="'/dday/' + d.id">
            <i class="kind-mark kind-dday" :style="{ '--kind-color': colorOf('dday') }" aria-hidden="true"></i>
            <span><b>{{ d.title }}</b><small class="figure">{{ bodyLocale === 'ko' || !d.isoDate ? tr(d.date) : formatDate(d.isoDate + 'T00:00:00', bodyLocale, { month: 'short', day: 'numeric' }) }}</small></span>
            <b class="figure cal-dday">{{ d.dday }}</b>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="empty-state">{{ tr('예정된 D-Day가 없어요. D-Day 관리에서 기념일을 추가해 보세요.') }}</p>
    </aside>
  </div>
</template>

<style scoped>
.cal-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-lg) var(--space-xl); margin-bottom: var(--space-xxl); }
.cal-period { display: flex; align-items: center; gap: var(--space-sm); }
.cal-month { margin: 0 var(--space-xs); font-size: var(--type-title-md-size); white-space: nowrap; }
.cal-count { margin-left: var(--space-sm); font-size: var(--type-body-sm-size); color: var(--color-muted); }
.cal-kinds > button { display: inline-flex; align-items: center; gap: var(--space-sm); }
.cal-kinds > button[aria-pressed='false'] { color: var(--color-muted); text-decoration: line-through; }
/* 종류 표식: 색 + 모양. 일정 동그라미, D-Day 마름모, 할 일 네모, 내 기록 고리 */
.kind-mark { display: inline-block; flex: none; width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--kind-color); }
.kind-mark.kind-dday { border-radius: 1px; transform: rotate(45deg) scale(.85); }
/* 종류 표식은 모양(원·마름모·사각형)으로 구분한다. 8px 칸에 radius-xs(4px)를 주면 원이 되어 구분이 사라지므로 사각형만 2px로 둔다(DESIGN.md 색만으로 구분하지 않기) */
.kind-mark.kind-task { border-radius: 2px; }
.kind-mark.kind-post { background: transparent; box-shadow: inset 0 0 0 2px var(--kind-color); }
.cal-layout { grid-template-columns: minmax(0, 1fr) minmax(280px, 320px); }
.cal-board { padding: var(--space-lg); }
.cal-grid { gap: 0; }
.cal-head span { padding: 0 0 var(--space-sm); }
.cal-cell { position: relative; min-height: 104px; gap: var(--space-xs); padding: var(--space-sm); border: 0; border-top: 1px solid var(--color-hairline); border-radius: 0; background: transparent; text-align: left; overflow: hidden; }
.cal-cell:hover { background: var(--color-surface); }
.cal-cell.out { opacity: 1; color: var(--color-muted); }
.cal-cell.out .cal-date { font-weight: 400; }
.cal-date { display: grid; place-items: center; width: 26px; height: 26px; border-radius: var(--radius-full); font-family: var(--font-mono); font-size: var(--type-time-size); font-weight: 600; }
.cal-cell.today { border-color: var(--color-hairline); }
.cal-cell.today .cal-date { background: transparent; color: var(--color-accent); box-shadow: inset 0 0 0 2px var(--color-accent); width: 26px; height: 26px; }
.cal-cell.selected { background: var(--color-accent-soft); border-color: var(--color-hairline); outline: 0; box-shadow: inset 0 2px 0 var(--color-accent); }
.cal-items { display: grid; gap: 2px; width: 100%; min-width: 0; margin: 0; padding: 0; list-style: none; }
.cal-items li { display: flex; align-items: center; gap: var(--space-xs); min-width: 0; font-size: var(--type-caption-size); line-height: 1.4; color: var(--color-foreground); }
.cal-items span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cal-dots { display: none; }
.cal-more { font-style: normal; font-size: var(--type-caption-size); color: var(--color-muted); }
.cal-side h3 { font-size: var(--type-title-md-size); }
.cal-side-count { margin: var(--space-xs) 0 var(--space-md); color: var(--color-muted); }
.cal-side-sub { margin: var(--space-xxl) 0 var(--space-sm); padding-top: var(--space-xl); border-top: 1px solid var(--color-hairline); font-size: var(--type-body-sm-size); font-weight: 600; }
.cal-day-list { margin: 0; padding: 0; list-style: none; }
.cal-day-list a { display: flex; align-items: center; gap: var(--space-md); min-height: 52px; padding: var(--space-sm) var(--space-md); margin: 0 calc(var(--space-md) * -1); border-radius: var(--radius-sm); color: var(--color-foreground); text-decoration: none; }
.cal-day-list a:hover { background: var(--color-surface); }
.cal-day-list a > span { display: grid; gap: 2px; flex: 1; min-width: 0; }
.cal-day-list b { font-size: var(--type-body-sm-size); font-weight: 500; overflow-wrap: anywhere; }
.cal-day-list small { font-size: var(--type-caption-size); color: var(--color-muted); }
.cal-day-list .cal-dday { flex: none; font-weight: 600; }
.cal-side .empty-state { padding: var(--space-md) 0; }
@media (max-width: 1150px) { .cal-layout { grid-template-columns: minmax(0, 1fr); } }
/* 좁은 화면: 칸 안 제목 대신 모양 점만 보이고, 고른 날 목록은 아래 패널에서 읽는다 */
@media (max-width: 760px) {
  .cal-board { padding: var(--space-sm); }
  .cal-cell { min-height: 56px; padding: var(--space-xs); align-items: center; }
  .cal-items, .cal-more { display: none; }
  .cal-dots { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; }
  .cal-date { width: 24px; height: 24px; }
  .cal-kinds { width: 100%; }
}
</style>
