<script setup>
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 8)
const states = ['정상', '검토 필요', '보류', '처리 완료']
</script>

<template>
  <div class="page-tools">
    <div class="filter"><button class="selected">전체</button><button>대기</button><button>완료</button></div>
    <input placeholder="이름/ID로 검색" />
    <button class="primary">내보내기</button>
  </div>
  <section class="card admin-table">
    <table>
      <thead>
        <tr><th>ID</th><th>대상</th><th>분류</th><th>상태</th><th>처리일</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.id">
          <td>#{{ 1000 + i }}</td>
          <td><b>{{ row.title }}</b><small>{{ row.person }}</small></td>
          <td><span class="tag">{{ row.category }}</span></td>
          <td><span class="state">{{ states[i % states.length] }}</span></td>
          <td>{{ row.time }}</td>
          <td><button class="icon" style="width:30px;height:30px;font-size:13px">⋯</button></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination"><button class="icon" style="width:30px;height:30px">‹</button><span>1 / 4</span><button class="icon" style="width:30px;height:30px">›</button></div>
  </section>
</template>
