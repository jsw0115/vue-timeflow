<script setup>
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const sessions = buildItems(props.screen, 4)
</script>

<template>
  <div class="focus">
    <div class="orb">
      <span>{{ screen.name }}</span>
      <b>25:00</b>
      <small>{{ screen.role }}</small>
      <button>시작하기</button>
    </div>
    <section class="card">
      <h3>{{ screen.id.includes('002') ? '같이 집중 중인 멤버' : '최근 세션' }}</h3>
      <div class="session" v-for="s in sessions" :key="s.id">
        <b>{{ s.time }}</b>
        <span><b>{{ s.person }}</b><small>{{ s.category }}</small></span>
        <small>{{ s.done ? '완료' : '진행 중' }}</small>
      </div>
    </section>
  </div>
</template>
