<script setup>
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const pool = buildItems(props.screen, 9)
const columns = [
  { title: '할 일', cards: pool.slice(0, 3) },
  { title: '진행 중', cards: pool.slice(3, 6) },
  { title: '완료', cards: pool.slice(6, 9) },
]
</script>

<template>
  <div class="kanban">
    <section class="kanban-col" v-for="col in columns" :key="col.title">
      <div class="kanban-col-head"><b>{{ col.title }}</b><span>{{ col.cards.length }}</span></div>
      <article class="kanban-card" v-for="card in col.cards" :key="card.id">
        <span class="tag">{{ card.category }}</span>
        <b>{{ card.title }}</b>
        <small>{{ card.person }} · {{ card.time }}</small>
      </article>
      <button class="kanban-add">＋ 카드 추가</button>
    </section>
  </div>
</template>
