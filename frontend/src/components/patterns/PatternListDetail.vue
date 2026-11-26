<script setup>
import { tr } from '../../store/locale'
import { ref, computed } from 'vue'
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 6)
const activeId = ref(rows[0]?.id ?? 0)
const active = computed(() => rows.find((r) => r.id === activeId.value) ?? rows[0])
</script>

<template>
  <div class="page-tools">
    <div class="filter"><button class="selected">{{ tr('전체') }}</button><button>{{ tr('진행 중') }}</button><button>{{ tr('완료') }}</button></div>
    <input :placeholder="tr('제목으로 검색')" />
    <button class="primary">{{ tr('＋ {name} 추가', { name: screen.name }) }}</button>
  </div>
  <div class="manage">
    <section class="card list">
      <div class="list-head"><span>{{ tr('이름') }}</span><span>{{ tr('분류') }}</span><span>{{ tr('상태') }}</span><span>{{ tr('일정') }}</span></div>
      <div class="row" v-for="row in rows" :key="row.id" @click="activeId = row.id" :class="{ picked: activeId === row.id }">
        <label><input type="checkbox" :checked="row.done" @click.stop /><b :class="{ done: row.done }">{{ row.title }}</b></label>
        <span class="tag">{{ tr(row.category) }}</span>
        <span class="state">{{ row.done ? tr('완료') : tr('진행 전') }}</span>
        <small>{{ row.time }}</small>
      </div>
    </section>
    <aside class="card detail">
      <p class="eyebrow">DETAIL</p>
      <h3>{{ active?.title }}</h3>
      <p>{{ screen.role }}</p>
      <label>{{ tr('카테고리') }}<select><option v-for="c in ['업무','공부','건강']" :key="c" :value="c">{{ tr(c) }}</option></select></label>
      <label>{{ tr('메모') }}<textarea :placeholder="tr('추가 정보를 남겨보세요')"></textarea></label>
      <button class="primary">{{ tr('변경사항 저장') }}</button>
    </aside>
  </div>
</template>
