<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { moneyEntries as entries } from '../../store/money'
import { localDate } from '../../utils/postValidation.mjs'
import { openPostComposer } from '../../store/appState'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'

/**
 * 머니로그 — 내역 CRUD와 카테고리 집계.
 * 외부(은행/카드) 연동은 검토 결과를 화면에 그대로 적어 두었다. 실제 연동은 백엔드와
 * 마이데이터 사업자 자격이 필요해 지금은 CSV 가져오기만 제공한다.
 */
const CATEGORIES = ['식비', '여가', '건강', '교통', '주거', '수입', '기타']
const currency = ref('KRW')
const route = useRoute()
const month = ref(localDate().slice(0, 7))
watch(() => route.query.month, value => { if (typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) month.value = value }, { immediate: true })

const query = ref('')
const filters = ref({ type: '전체' })
const FILTER_GROUPS = [
  {
    id: 'type',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: 'in', label: '수입' },
      { value: 'out', label: '지출' },
    ],
  },
]
const monthly = computed(() => entries.value.filter((e) => e.date.startsWith(month.value)))
const visible = computed(() => {
  const k = query.value.trim()
  return monthly.value.filter((e) => {
    if (filters.value.type !== '전체' && e.type !== filters.value.type) return false
    if (k && !e.title.includes(k) && !e.category.includes(k)) return false
    return true
  })
})
const income = computed(() => monthly.value.filter((e) => e.amount > 0).reduce((a, e) => a + e.amount, 0))
const expense = computed(() => monthly.value.filter((e) => e.amount < 0).reduce((a, e) => a + e.amount, 0))
const balance = computed(() => income.value + expense.value)
const won = (n) => (n < 0 ? '-' : '+') + Math.abs(n).toLocaleString('ko-KR') + '원'

const byCategory = computed(() => {
  const total = Math.abs(expense.value) || 1
  const map = new Map()
  monthly.value
    .filter((e) => e.amount < 0)
    .forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Math.abs(e.amount)))
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount, pct: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount)
})

function openAdd() { openPostComposer('머니로그') }
function removeEntry(e) {
  if (!window.confirm('‘' + e.title + '’ 내역을 삭제할까요?')) return
  entries.value = entries.value.filter((x) => x.id !== e.id)
}

/* 외부 연동 검토 결과 */
const showIntegration = ref(false)
const INTEGRATIONS = [
  {
    name: '은행·카드 자동 연동 (마이데이터)',
    verdict: '지금은 불가',
    detail: '금융위 마이데이터 사업자 등록과 보안 심사가 선행돼야 해요. 개인 개발 단계에서는 신청 자격 자체가 없어요.',
    risk: '높음',
  },
  {
    name: '오픈뱅킹 잔액·거래내역 API',
    verdict: '조건부 가능',
    detail: '금융결제원 이용기관 등록과 사업자 등록이 필요하고, 토큰을 다룰 백엔드가 반드시 있어야 해요. 프론트에서 직접 호출하면 키가 노출돼요.',
    risk: '높음',
  },
  {
    name: '카드사 명세서 CSV 가져오기',
    verdict: '바로 가능',
    detail: '사용자가 내려받은 CSV를 브라우저에서 파싱해 등록해요. 외부로 데이터가 나가지 않아 가장 안전합니다.',
    risk: '낮음',
  },
  {
    name: '가계부 앱 내보내기 파일 연동',
    verdict: '바로 가능',
    detail: '뱅크샐러드·편한가계부 등의 내보내기 파일을 같은 방식으로 읽어요. 포맷이 앱마다 달라 매핑 UI가 필요해요.',
    risk: '낮음',
  },
]

const importNotice = ref('')
function importCsv(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    // 날짜,내용,금액 형식의 단순 CSV를 읽는다(헤더 한 줄 건너뜀)
    const lines = String(reader.result).split(/\r?\n/).filter(Boolean).slice(1)
    let added = 0
    lines.forEach((line) => {
      const [date, title, amount] = line.split(',').map((s) => s?.trim().replace(/^"|"$/g, ''))
      const value = Number(String(amount).replace(/[^0-9-]/g, ''))
      if (!date || !title || !value) return
      entries.value.unshift({
        id: Math.max(0, ...entries.value.map((e) => e.id)) + 1 + added,
        title,
        date,
        amount: value,
        type: value < 0 ? 'out' : 'in',
        category: value < 0 ? '기타' : '수입',
      })
      added += 1
    })
    importNotice.value = added ? added + '건을 가져왔어요.' : '읽을 수 있는 행이 없어요. 날짜,내용,금액 형식인지 확인해주세요.'
    setTimeout(() => (importNotice.value = ''), 4000)
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">머니로그</b>
    <input type="month" v-model="month" style="margin-left: 0" />
    <span></span>
    <span class="currency-picker">₩ {{ currency }}</span>
    <button class="review" style="margin: 0" @click="showIntegration = true">외부 연동</button>
    <button class="primary" @click="openAdd">+ 내역 추가</button>
  </div>

  <div class="money-summary">
    <article><span>이번 달 수입</span><b class="in figure">{{ won(income) }}</b></article>
    <article><span>이번 달 지출</span><b class="out figure">{{ won(expense) }}</b></article>
    <article><span>순 잔액</span><b class="figure">{{ won(balance) }}</b></article>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="내역·분류 검색"
    :result-count="visible.length"
    :total-count="monthly.length"
  />

  <div class="planner">
    <section class="card list">
      <div class="list-head" style="grid-template-columns: 2fr 1fr 1fr 1.2fr .6fr">
        <span>내역</span><span>분류</span><span>날짜</span><span>금액</span><span></span>
      </div>
      <div class="row" style="grid-template-columns: 2fr 1fr 1fr 1.2fr .6fr" v-for="e in visible" :key="e.id">
        <label>{{ e.title }}</label>
        <span class="tag">{{ e.category }}</span>
        <span class="figure">{{ e.date.slice(5) }}</span>
        <b class="figure" :class="e.type">{{ won(e.amount) }}</b>
        <span><button class="review" style="margin: 0; padding: 4px 8px" @click="removeEntry(e)">삭제</button></span>
      </div>
      <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">이 달에는 기록이 없어요.</p>
    </section>

    <section class="card">
      <h3>지출 카테고리</h3>
      <div v-for="c in byCategory" :key="c.category" class="rate-row">
        <span>{{ c.category }}</span>
        <div class="progress"><em :style="{ width: c.pct + '%' }"></em></div>
        <b class="figure">{{ c.pct }}%</b>
      </div>
      <p v-if="!byCategory.length" class="form-note" style="margin: 12px 0 0">지출 기록이 없어요.</p>
    </section>
  </div>

<Modal v-if="showIntegration" title="외부 연동 검토" wide @close="showIntegration = false">
    <p class="form-note" style="margin-top: 0">
      은행·카드 자동 연동을 실제로 붙일 수 있는지 검토한 결과예요. 지금 바로 쓸 수 있는 방법은 CSV 가져오기입니다.
    </p>
    <div class="integration-row" v-for="i in INTEGRATIONS" :key="i.name">
      <div>
        <b>{{ i.name }}</b>
        <p>{{ i.detail }}</p>
      </div>
      <div class="integration-verdict">
        <span class="badge" :class="i.verdict === '바로 가능' ? 'ok' : i.verdict === '조건부 가능' ? 'warn' : 'danger'">{{ i.verdict }}</span>
        <small>구현 난이도 {{ i.risk }}</small>
      </div>
    </div>

    <div class="callout" style="margin-top: 16px">
      <b>지금 쓸 수 있는 방법 · CSV 가져오기</b>
      <p>카드사에서 내려받은 명세서를 <b>날짜,내용,금액</b> 순서의 CSV로 저장한 뒤 올려주세요. 파일은 브라우저에서만 처리되고 서버로 전송되지 않아요.</p>
      <input type="file" accept=".csv,text/csv" @change="importCsv" style="margin-top: 10px" />
      <p v-if="importNotice" class="badge ok" style="display: inline-block; margin-top: 8px">{{ importNotice }}</p>
    </div>

    <template #footer>
      <button class="primary" @click="showIntegration = false">닫기</button>
    </template>
  </Modal>
</template>
