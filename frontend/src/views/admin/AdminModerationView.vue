<script setup>
import { ref } from 'vue'

const tab = ref('신고 접수')
const reports = [
  { target: '정우진 게시글', group: '운동 갓생방', reason: '광고성 게시물', date: '8/23', pending: true },
  { target: '한소율 댓글', group: '고요한 독서방', reason: '부적절한 언어', date: '8/21', pending: false },
]
</script>

<template>
  <div class="admin-page-head">
    <div><h2>신고 · 제재</h2><p>신고된 콘텐츠와 제재 이력을 관리해요</p></div>
  </div>
  <div class="filter" style="width: fit-content; margin: 16px 0">
    <button :class="{ selected: tab === '신고 접수' }" @click="tab = '신고 접수'">신고 접수</button>
    <button :class="{ selected: tab === '금칙어' }" @click="tab = '금칙어'">금칙어 관리</button>
    <button :class="{ selected: tab === '매니저' }" @click="tab = '매니저'">매니저 관리</button>
  </div>
  <section class="card admin-table">
    <table>
      <tr><th>신고 대상</th><th>그룹</th><th>사유</th><th>접수일</th><th>처리</th></tr>
      <tr v-for="r in reports" :key="r.target">
        <td><b>{{ r.target }}</b></td>
        <td>{{ r.group }}</td>
        <td>{{ r.reason }}</td>
        <td>{{ r.date }}</td>
        <td>
          <span v-if="r.pending"><b style="color: #b23b3b; margin-right: 8px">제재</b><b>기각</b></span>
          <span v-else class="badge ok">처리완료</span>
        </td>
      </tr>
    </table>
  </section>
</template>
