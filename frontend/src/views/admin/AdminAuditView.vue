<script setup>
// 감사 로그. 서버가 관리자 조치마다 남긴 기록을 불러 거르고 CSV로 내보낸다. 수정·삭제는 없다(PR-10 UF-117 7-4).
import { bodyLocale, tr } from '../../store/locale'
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminClient } from '../../features/admin/admin.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { AUDIT_CATEGORIES, auditCsv, createAuditClient, describeAudit } from '../../features/admin/auditLog.mjs'

const client = createAuditClient({ request: apiRequest })
const rows = ref([])
const total = ref(0)
const names = ref(new Map())
const status = ref('loading')
const loadError = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try {
    const page = await client.all()
    rows.value = page.items
    total.value = page.total
    status.value = 'ready'
  } catch (error) { loadError.value = adminErrorText(error); status.value = 'error'; return }
  try {
    const users = await adminClient.allUsers()
    names.value = new Map((users?.items ?? []).map((user) => [user.id, user.nickname || user.email || user.id]))
  } catch { names.value = new Map() }
}
onMounted(load)
const nameOf = (id) => names.value.get(id) ?? tr('계정 {id}', { id: String(id ?? '').slice(0, 8) })

const filter = ref('all')
const query = ref('')
const views = computed(() => rows.value.map((row) => ({ row, ...describeAudit(row, tr) })))
const visible = computed(() => {
  const keyword = query.value.trim()
  return views.value.filter((item) => (filter.value === 'all' || item.category === filter.value)
    && (!keyword || [nameOf(item.row.actor), item.label, item.row.target, item.detail].some((value) => String(value ?? '').includes(keyword))))
})
const byCategory = computed(() => AUDIT_CATEGORIES.map((category) => ({ category, count: views.value.filter((item) => item.category === category).length })).filter((item) => item.count))

function exportCsv() {
  const blob = new Blob(['﻿' + auditCsv(visible.value.map((item) => item.row), nameOf)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'audit-log.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>{{ tr('감사 로그') }}</h2><p>{{ tr('서버가 관리자 조치(계정·문의·신고·공지·콘텐츠·설정)마다 남긴 기록이에요') }}</p></div>
    <button type="button" class="review" style="margin: 0" :disabled="status !== 'ready' || !visible.length" @click="exportCsv">{{ tr('CSV 내보내기') }}</button>
  </div>

  <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('감사 로그를 불러오는 중이에요.') }}</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ tr(loadError) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  <template v-else>
    <div class="page-tools">
      <div class="filter" role="group" :aria-label="tr('분류 거르기')">
        <button type="button" :class="{ selected: filter === 'all' }" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ tr('전체') }}</button>
        <button v-for="category in AUDIT_CATEGORIES" :key="category" type="button" :class="{ selected: filter === category }" :aria-pressed="filter === category" @click="filter = category">{{ tr(category) }}</button>
      </div>
      <input v-model="query" type="search" :aria-label="tr('관리자·동작·대상·내용 검색')" :placeholder="tr('관리자·동작·대상·내용 검색')" />
      <span class="badge">{{ tr('{n}건 / 전체 {total}건', { n: visible.length, total }) }}</span>
    </div>
    <p v-if="rows.length < total" class="input-field-help" role="status">{{ tr('기록이 많아 최근 {n}건만 불러왔어요.', { n: rows.length }) }}</p>

    <div v-if="byCategory.length" class="metrics audit-metrics">
      <article v-for="item in byCategory" :key="item.category"><span>{{ tr(item.category) }}</span><b class="figure">{{ item.count }}<small v-if="bodyLocale === 'ko'">건</small></b></article>
    </div>

    <section class="card list">
      <div class="list-head audit-row"><span>{{ tr('시각(UTC)') }}</span><span>{{ tr('관리자') }}</span><span>{{ tr('분류') }}</span><span>{{ tr('동작') }}</span><span>{{ tr('대상 · 내용') }}</span></div>
      <div v-for="item in visible" :key="item.row.id" class="row audit-row">
        <label class="figure">{{ item.at }}</label>
        <span>{{ nameOf(item.row.actor) }}</span>
        <span class="tag">{{ tr(item.category) }}</span>
        <span>{{ tr(item.label) }}</span>
        <span class="audit-target"><span class="figure">{{ item.row.target }}</span><small v-if="item.detail">{{ item.detail }}</small></span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ rows.length ? tr('조건에 맞는 감사 기록이 없어요. 검색어나 분류를 바꿔 보세요.') : tr('아직 감사 기록이 없어요. 관리자가 계정·문의·공지 등을 바꾸면 여기에 남아요.') }}</p>
    </section>
    <p class="form-note audit-foot">{{ tr('감사 로그는 화면에서 고치거나 지울 수 없어요. 필요하면 CSV로 내보내 보관하세요.') }}</p>
  </template>
</template>

<style scoped>
.audit-metrics { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); margin: 0 0 var(--space-md); }
.audit-row { grid-template-columns: minmax(0, 1.4fr) minmax(0, .9fr) minmax(0, .7fr) minmax(0, 1.2fr) minmax(0, 2fr); }
.audit-target { display: grid; gap: var(--space-xs); min-width: 0; overflow-wrap: anywhere; }
.audit-target small { color: var(--color-muted); }
.audit-foot { margin-top: var(--space-sm); }
</style>
