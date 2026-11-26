<script setup>
import { tr } from '../../store/locale'
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
      <button>{{ tr('시작하기') }}</button>
    </div>
    <section class="card">
      <h3>{{ screen.id.includes('002') ? tr('같이 집중 중인 멤버') : tr('최근 세션') }}</h3>
      <div class="session" v-for="s in sessions" :key="s.id">
        <b>{{ s.time }}</b>
        <span><b>{{ s.person }}</b><small>{{ tr(s.category) }}</small></span>
        <small>{{ s.done ? tr('완료') : tr('진행 중') }}</small>
      </div>
    </section>
  </div>
</template>
