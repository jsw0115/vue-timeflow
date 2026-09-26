<script setup>
import { ref, computed } from 'vue'
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 6)
const activeId = ref(rows[0]?.id ?? 0)
const active = computed(() => rows.find((r) => r.id === activeId.value) ?? rows[0])
</script>

<template>
  <div class="page-tools">
    <div class="filter"><button class="selected">전체</button><button>진행 중</button><button>완료</button></div>
    <input placeholder="제목으로 검색" />
    <button class="primary">＋ {{ screen.name }} 추가</button>
  </div>
  <div class="manage">
    <section class="card list">
      <div class="list-head"><span>이름</span><span>분류</span><span>상태</span><span>일정</span></div>
      <div class="row" v-for="row in rows" :key="row.id" @click="activeId = row.id" :class="{ picked: activeId === row.id }">
        <label><input type="checkbox" :checked="row.done" @click.stop /><b :class="{ done: row.done }">{{ row.title }}</b></label>
        <span class="tag">{{ row.category }}</span>
        <span class="state">{{ row.done ? '완료' : '진행 전' }}</span>
        <small>{{ row.time }}</small>
      </div>
    </section>
    <aside class="card detail">
      <p class="eyebrow">DETAIL</p>
      <h3>{{ active?.title }}</h3>
      <p>{{ screen.role }}</p>
      <label>카테고리<select><option v-for="c in ['업무','공부','건강']" :key="c">{{ c }}</option></select></label>
      <label>메모<textarea placeholder="추가 정보를 남겨보세요"></textarea></label>
      <button class="primary">변경사항 저장</button>
    </aside>
  </div>
</template>
