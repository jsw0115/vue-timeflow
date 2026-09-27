<script setup>
import { computed } from 'vue'
import { monitoring, ackIncident, toggleAlertRule } from '../../store/adminOps'

const openIncidents = computed(() => monitoring.incidents.filter((i) => !i.ack && i.level !== 'info'))
const activeRules = computed(() => monitoring.alertRules.filter((r) => r.on).length)
</script>

<template>
  <div class="admin-page-head">
    <div><h2>시스템 모니터링</h2><p>지표·장애·알림 규칙을 한 화면에서 확인해요</p></div>
    <span class="badge" :class="openIncidents.length ? 'danger' : 'ok'">
      {{ openIncidents.length ? '확인 필요 ' + openIncidents.length + '건' : '미확인 장애 없음' }}
    </span>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>API 성공률</span><b class="figure">{{ monitoring.apiSuccess }}<small>%</small></b></article>
    <article><span>평균 응답시간</span><b class="figure">{{ monitoring.latencyMs }}<small>ms</small></b></article>
    <article><span>오늘 에러</span><b class="figure">{{ monitoring.errorsToday }}<small>건</small></b></article>
    <article><span>서버 상태</span><b class="figure" style="font-size: 1.1875rem">{{ monitoring.status }}</b></article>
  </div>

  <h3 style="margin: 0 0 12px">최근 이벤트</h3>
  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.4fr .7fr 2fr 1.4fr 1fr">
      <span>시각</span><span>레벨</span><span>메시지</span><span>API</span><span>처리</span>
    </div>
    <div class="row" style="grid-template-columns: 1.4fr .7fr 2fr 1.4fr 1fr" v-for="l in monitoring.incidents" :key="l.id">
      <label class="figure">{{ l.at }}</label>
      <span class="badge" :class="l.level">{{ l.label }}</span>
      <span>{{ l.msg }}</span>
      <span class="tag">{{ l.api }}</span>
      <span>
        <button v-if="!l.ack" class="review" style="margin: 0" @click="ackIncident(l)">확인 처리</button>
        <span v-else class="badge ok">확인됨</span>
      </span>
    </div>
  </section>

  <h3 style="margin: 24px 0 12px">알림 규칙 · {{ activeRules }}개 켜짐</h3>
  <section class="card">
    <div class="trow" v-for="r in monitoring.alertRules" :key="r.id">
      <span style="flex: 1"><b>{{ r.label }}</b><small style="display: block; color: var(--color-muted)">발송 채널: {{ r.channel }}</small></span>
      <button type="button" role="switch" class="toggle" :aria-checked="r.on" :class="{ on: r.on }" @click="toggleAlertRule(r)"><em></em></button>
    </div>
    <p class="form-note">규칙을 켜고 끄면 감사 로그에 기록돼요. 구독 결제 실패와 CS 미답변도 여기서 감시합니다.</p>
  </section>
</template>
