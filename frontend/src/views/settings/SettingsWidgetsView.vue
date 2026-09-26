<script setup>
import { ref, computed } from 'vue'
import { dashboardState, WIDGET_CATALOG, toggleVisible, cycleSize, resetLayout } from '../../store/dashboard'

const query = ref('')
const sizeLabel = { sm: '1×1 크기', md: '2×1 크기', lg: '2×2 크기' }
const filtered = computed(() =>
  dashboardState.layout.filter((w) => WIDGET_CATALOG[w.id].title.toLowerCase().includes(query.value.toLowerCase())),
)
</script>

<template>
  <section class="card setting-content">
    <h2>위젯 설정 <span class="badge new">보충 반영 · SET-009</span></h2>
    <p>홈 화면에 표시할 위젯을 켜고, 드래그로 순서를 바꿔보세요. 크기는 홈 화면 편집 모드에서 바꿀 수 있어요.</p>
    <input v-model="query" placeholder="위젯 검색" style="display: block; width: 100%; margin: 12px 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); padding: 10px; background: var(--color-canvas)" />
    <div class="widget-row" v-for="w in filtered" :key="w.id">
      <span class="grip">⠿</span>
      <i>▦</i>
      <span style="flex: 1"><b>{{ WIDGET_CATALOG[w.id].title }}</b><br /><small>{{ WIDGET_CATALOG[w.id].desc }} · {{ sizeLabel[w.size] }}</small></span>
      <button class="icon" style="width: 30px; height: 30px; font-size: 12px" title="크기 변경" aria-label="크기 변경" @click="cycleSize(w.id)">⤢</button>
      <button type="button" role="switch" class="toggle" :aria-checked="w.visible" :class="{ on: w.visible }" @click="toggleVisible(w.id)"><em></em></button>
    </div>
    <button class="review" style="margin-top: 16px" @click="resetLayout">레이아웃 초기화</button>
  </section>
</template>
