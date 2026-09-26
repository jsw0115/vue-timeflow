<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'

/**
 * 공수 계산 — 인원 × 기간 × 투입률로 MD/MM을 산정하고,
 * 실제 투입 공수와 비교해 편차와 예상 비용을 함께 보여준다.
 */
const MD_PER_MM = 20 // 1 MM = 20 MD (월 평균 근무일)

const rows = ref([
  { id: 1, title: '타임바 리뉴얼', role: '기획', people: 1, days: 12, ratio: 80, rate: 380000, actualMd: 11.5, fixed: false },
  { id: 2, title: '타임바 리뉴얼', role: '프론트엔드', people: 2, days: 15, ratio: 100, rate: 450000, actualMd: 32, fixed: false },
  { id: 3, title: '2분기 유지보수', role: '백엔드', people: 1, days: 8, ratio: 50, rate: 450000, actualMd: 4, fixed: true },
  { id: 4, title: '내부 세미나 준비', role: '기획', people: 1, days: 4, ratio: 60, rate: 380000, actualMd: 3, fixed: false },
])

function plannedMd(r) {
  return Math.round(r.people * r.days * (r.ratio / 100) * 10) / 10
}
function diffMd(r) {
  return Math.round((r.actualMd - plannedMd(r)) * 10) / 10
}
function costOf(r) {
  return Math.round(r.actualMd * r.rate)
}
function stateOf(r) {
  if (r.fixed) return { cls: 'ok', label: '확정' }
  const d = diffMd(r)
  if (Math.abs(d) < 0.5) return { cls: '', label: '일치' }
  return { cls: 'warn', label: d > 0 ? '초과 ' + d + ' MD' : '여유 ' + Math.abs(d) + ' MD' }
}

const totalPlanned = computed(() => Math.round(rows.value.reduce((a, r) => a + plannedMd(r), 0) * 10) / 10)
const totalActual = computed(() => Math.round(rows.value.reduce((a, r) => a + r.actualMd, 0) * 10) / 10)
const totalDiff = computed(() => Math.round((totalActual.value - totalPlanned.value) * 10) / 10)
const totalCost = computed(() => rows.value.reduce((a, r) => a + costOf(r), 0))
const pendingCount = computed(() => rows.value.filter((r) => !r.fixed && Math.abs(diffMd(r)) >= 0.5).length)
const won = (n) => n.toLocaleString('ko-KR') + '원'

// 프로젝트 단위 집계
const byProject = computed(() => {
  const map = new Map()
  rows.value.forEach((r) => {
    const cur = map.get(r.title) ?? { title: r.title, planned: 0, actual: 0, cost: 0 }
    cur.planned += plannedMd(r)
    cur.actual += r.actualMd
    cur.cost += costOf(r)
    map.set(r.title, cur)
  })
  return [...map.values()].map((p) => ({
    ...p,
    planned: Math.round(p.planned * 10) / 10,
    actual: Math.round(p.actual * 10) / 10,
    rate: Math.round((p.actual / p.planned) * 100),
  }))
})

const showAdd = ref(false)
const draft = ref({ title: '', role: '기획', people: 1, days: 5, ratio: 100, rate: 400000, actualMd: 0 })
function addRow() {
  if (!draft.value.title.trim()) return
  rows.value.push({ id: Math.max(0, ...rows.value.map((r) => r.id)) + 1, ...draft.value, title: draft.value.title.trim(), fixed: false })
  draft.value = { title: '', role: '기획', people: 1, days: 5, ratio: 100, rate: 400000, actualMd: 0 }
  showAdd.value = false
}
function removeRow(id) {
  const row = rows.value.find((r) => r.id === id)
  if (row && !window.confirm('‘' + row.title + ' · ' + row.role + '’ 공수 항목을 삭제할까요?')) return
  rows.value = rows.value.filter((r) => r.id !== id)
}
function fixAll() {
  rows.value.forEach((r) => (r.fixed = true))
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">공수 계산 · 8월</b>
    <HelpPopover
      title="공수 계산 사용법"
      summary="투입 인원과 기간으로 필요한 공수를 산정하고, 실제 투입과 비교해 편차와 비용을 확인하는 화면이에요."
      formula="산정 MD = 인원 × 기간(일) × 투입률 ÷ 100    |    MM = MD ÷ 20    |    비용 = 실제 MD × 일단가"
      :steps="[
        '‘+ 공수 항목’으로 프로젝트와 역할을 추가해요.',
        '인원·기간·투입률을 입력하면 산정 MD가 자동으로 계산돼요.',
        '실제로 투입한 MD를 적으면 편차 배지가 초과/여유로 바뀌어요.',
        '검토가 끝나면 ‘이번 달 확정하기’로 잠가요.',
      ]"
      :terms="[
        { term: 'MD (Man-Day)', desc: '한 사람이 하루 온전히 투입했을 때의 작업량이에요.' },
        { term: 'MM (Man-Month)', desc: '한 사람이 한 달 투입한 작업량. 이 서비스는 월 평균 근무일 20일 기준으로 MD ÷ 20으로 계산해요.' },
        { term: '투입률', desc: '그 기간 중 이 업무에 실제로 쓴 비율이에요. 하루 4시간만 썼다면 50%예요.' },
        { term: '일단가', desc: '1 MD당 비용이에요. 역할·등급별로 다르게 넣을 수 있어요.' },
      ]"
      :tips="[
        '산정 MD와 실제 MD 차이가 0.5 MD 미만이면 ‘일치’로 표시돼요.',
        '겸업으로 두 프로젝트를 함께 했다면 투입률을 나눠 각각 등록하세요.',
      ]"
    />
    <span class="form-note" style="margin: 0">MD = 인원 × 기간(일) × 투입률 · 1 MM = {{ MD_PER_MM }} MD</span>
    <div class="form-row" style="margin: 0">
      <button class="review" style="margin: 0" @click="showAdd = true">+ 공수 항목</button>
      <button class="primary" @click="fixAll">이번 달 확정하기</button>
    </div>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>산정 공수</span><b class="figure">{{ totalPlanned }}<small>MD</small></b><small>{{ (totalPlanned / MD_PER_MM).toFixed(2) }} MM</small></article>
    <article><span>실제 공수</span><b class="figure">{{ totalActual }}<small>MD</small></b><small>{{ (totalActual / MD_PER_MM).toFixed(2) }} MM</small></article>
    <article><span>편차</span><b class="figure">{{ totalDiff >= 0 ? '+' : '' }}{{ totalDiff }}<small>MD</small></b><small>보정 요청 {{ pendingCount }}건</small></article>
    <article><span>예상 비용</span><b class="figure" style="font-size: 19px">{{ won(totalCost) }}</b><small>실제 공수 × 일단가</small></article>
  </div>

  <section class="card list">
    <div class="list-head labor-grid"><span>프로젝트 · 역할</span><span>인원</span><span>기간(일)</span><span>투입률</span><span>산정 MD</span><span>실제 MD</span><span>비용</span><span>상태</span></div>
    <div class="row labor-grid" v-for="r in rows" :key="r.id">
      <label>{{ r.title }}<small style="display: block; color: var(--color-muted)">{{ r.role }}</small></label>
      <span><input class="labor-input" type="number" min="1" step="1" v-model.number="r.people" /></span>
      <span><input class="labor-input" type="number" min="1" step="1" v-model.number="r.days" /></span>
      <span><input class="labor-input" type="number" min="10" max="100" step="10" v-model.number="r.ratio" /></span>
      <span class="figure">{{ plannedMd(r) }}</span>
      <span><input class="labor-input" type="number" min="0" step="0.5" v-model.number="r.actualMd" /></span>
      <span class="figure">{{ won(costOf(r)) }}</span>
      <span style="display: flex; align-items: center; gap: 6px">
        <span class="badge" :class="stateOf(r).cls">{{ stateOf(r).label }}</span>
        <button class="review" style="margin: 0; padding: 4px 8px" @click="removeRow(r.id)">삭제</button>
      </span>
    </div>
  </section>

  <h3 style="margin: 24px 0 12px">프로젝트별 집계</h3>
  <section class="card">
    <div class="event" v-for="p in byProject" :key="p.title">
      <i></i>
      <span style="flex: 1"><b>{{ p.title }}</b><small>산정 {{ p.planned }} MD · 실제 {{ p.actual }} MD · {{ won(p.cost) }}</small></span>
      <span class="badge" :class="p.rate > 110 ? 'warn' : 'ok'">{{ p.rate }}%</span>
    </div>
  </section>
  <p class="form-note" style="margin-top: 12px">
    투입률은 해당 기간 중 이 업무에 쓴 비율이에요. 하루 4시간만 투입했다면 50%로 입력하세요.
  </p>

  <Modal v-if="showAdd" title="공수 항목 추가" wide @close="showAdd = false">
    <label>프로젝트<input v-model="draft.title" placeholder="예: 타임바 리뉴얼" autofocus /></label>
    <label>역할<input v-model="draft.role" placeholder="예: 프론트엔드" /></label>
    <div class="form-row">
      <label style="flex: 1">인원<input type="number" min="1" v-model.number="draft.people" /></label>
      <label style="flex: 1">기간(일)<input type="number" min="1" v-model.number="draft.days" /></label>
      <label style="flex: 1">투입률(%)<input type="number" min="10" max="100" step="10" v-model.number="draft.ratio" /></label>
    </div>
    <div class="form-row">
      <label style="flex: 1">일단가(원)<input type="number" min="0" step="10000" v-model.number="draft.rate" /></label>
      <label style="flex: 1">실제 MD<input type="number" min="0" step="0.5" v-model.number="draft.actualMd" /></label>
    </div>
    <p class="form-note">산정 공수 {{ Math.round(draft.people * draft.days * (draft.ratio / 100) * 10) / 10 }} MD · 예상 비용 {{ won(Math.round(draft.people * draft.days * (draft.ratio / 100) * draft.rate)) }}</p>
    <button class="primary" @click="addRow">추가하기</button>
  </Modal>
</template>
