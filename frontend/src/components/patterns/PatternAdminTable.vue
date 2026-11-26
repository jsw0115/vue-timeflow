<script setup>
import { tr } from '../../store/locale'
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 8)
const states = ['정상', '검토 필요', '보류', '처리 완료']
</script>

<template>
  <div class="page-tools">
    <div class="filter"><button class="selected">{{ tr('전체') }}</button><button>{{ tr('대기') }}</button><button>{{ tr('완료') }}</button></div>
    <input :placeholder="tr('이름/ID로 검색')" />
    <button class="primary">{{ tr('내보내기') }}</button>
  </div>
  <section class="card admin-table">
    <table>
      <thead>
        <tr><th>ID</th><th>{{ tr('대상') }}</th><th>{{ tr('분류') }}</th><th>{{ tr('상태') }}</th><th>{{ tr('처리일') }}</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.id">
          <td>#{{ 1000 + i }}</td>
          <td><b>{{ row.title }}</b><small>{{ row.person }}</small></td>
          <td><span class="tag">{{ tr(row.category) }}</span></td>
          <td><span class="state">{{ tr(states[i % states.length]) }}</span></td>
          <td>{{ row.time }}</td>
          <td><button class="icon" style="width:30px;height:30px;font-size:0.875rem" :aria-label="tr('더보기')">⋯</button></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination"><button class="icon" style="width:30px;height:30px" :aria-label="tr('이전 페이지')">‹</button><span>1 / 4</span><button class="icon" style="width:30px;height:30px" :aria-label="tr('다음 페이지')">›</button></div>
  </section>
</template>
