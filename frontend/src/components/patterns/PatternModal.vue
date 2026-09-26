<script setup>
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 5)
</script>

<template>
  <div class="modal-stage">
    <p class="eyebrow">이 화면은 {{ screen.type }} 타입 — 다른 화면 위에 뜨는 모달/피커입니다</p>
    <div class="modal-preview">
      <div class="head">
        <div><p class="eyebrow">PICKER</p><h2>{{ screen.name }}</h2></div>
        <button class="icon" type="button">×</button>
      </div>
      <input placeholder="이름으로 검색" />
      <div class="picker-list">
        <label class="picker-row" v-for="row in rows" :key="row.id">
          <input type="checkbox" :checked="row.done" />
          <i>{{ row.person.slice(0, 1) }}</i>
          <span><b>{{ row.person }}</b><small>{{ row.category }} · {{ row.title }}</small></span>
        </label>
      </div>
      <button class="primary">선택 완료</button>
    </div>
  </div>
</template>
