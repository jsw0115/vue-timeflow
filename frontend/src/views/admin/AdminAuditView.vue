<script setup>
import { computed, ref } from 'vue'
import { auditLogs, AUDIT_CATEGORIES } from '../../store/adminOps'

const filter = ref('전체')
const query = ref('')
const FILTERS = ['전체', ...AUDIT_CATEGORIES]

const visible = computed(() => {
  const k = query.value.trim()
  return auditLogs.value.filter((l) => {
    if (filter.value !== '전체' && l.category !== filter.value) return false
    if (!k) return true
    return (l.admin + l.action + l.target + l.memo).includes(k)
  })
})
const byCategory = computed(() =>
  AUDIT_CATEGORIES.map((c) => ({ c, n: auditLogs.value.filter((l) => l.category === c).length })).filter((x) => x.n),
)

/** 감사 로그는 조작 불가가 원칙이므로 내보내기만 제공한다 */
function exportCsv() {
  const header = '시각,관리자,분류,액션,대상,메모'
  const rows = visible.value.map((l) => [l.at, l.admin, l.category, l.action, l.target, l.memo].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'audit-log.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>감사 로그</h2><p>관리자가 상태를 바꾼 모든 행위가 자동으로 기록돼요</p></div>
    <button class="review" style="margin: 0" @click="exportCsv">CSV 내보내기</button>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="f in FILTERS" :key="f" :class="{ selected: filter === f }" @click="filter = f">{{ f }}</button>
    </div>
    <input v-model="query" placeholder="관리자·대상·내용 검색" />
    <span class="badge">{{ visible.length }}건</span>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); margin-bottom: 16px">
    <article v-for="b in byCategory" :key="b.c"><span>{{ b.c }}</span><b class="figure">{{ b.n }}<small>건</small></b></article>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.4fr .9fr .8fr 1.2fr 2fr">
      <span>시각</span><span>관리자</span><span>분류</span><span>액션</span><span>대상 · 메모</span>
    </div>
    <div class="row" style="grid-template-columns: 1.4fr .9fr .8fr 1.2fr 2fr" v-for="l in visible" :key="l.id">
      <label class="figure">{{ l.at }}</label>
      <span>{{ l.admin }}</span>
      <span class="tag">{{ l.category }}</span>
      <span>{{ l.action }}</span>
      <span>{{ l.target }}<small v-if="l.memo" style="display: block; color: var(--color-muted)">{{ l.memo }}</small></span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 기록이 없어요.</p>
  </section>
  <p class="form-note" style="margin-top: 12px">감사 로그는 수정·삭제할 수 없어요. 필요하면 CSV로 내보내 보관하세요.</p>
</template>
