<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { modeState, modeMeta } from '../../store/modeProfiles'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'

const router = useRouter()
const modes = ['J', 'P', 'B']
const startScreen = ref('홈 대시보드')
const dateFormat = ref('2026.08.24 (월) · 24시간제')
const weekStart = ref('월요일')
const saved = ref(false)

function save() {
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>환경 설정</h2>
        <p>기본 모드에 맞춰 홈 화면 구성과 글양식이 달라져요</p>
      </div>
      <span v-if="saved" class="badge ok">저장했어요</span>
    </div>

    <div class="section-label">기본 모드</div>
    <div class="mode-picker">
      <button v-for="m in modes" :key="m" :class="{ selected: modeState.activeMode === m }" @click="modeState.activeMode = m">
        <b>{{ m }}</b>
        <span>{{ modeMeta(m).name }}<small>{{ modeMeta(m).desc }}</small></span>
      </button>
    </div>

    <div class="form-style-cta">
      <div>
        <b>일정·루틴·업무 글양식 · 화면 구성</b>
        <p>모드별로 작성 항목과 홈·통계 포틀릿 구성을 직접 고를 수 있어요. 바꿔도 이미 쓴 글은 그대로 유지돼요.</p>
      </div>
      <button class="primary" @click="router.push('/settings/forms')">설정하기 ›</button>
    </div>

    <div class="section-label" style="margin-top: 22px">화면 밀도</div>
    <p class="form-note" style="margin-top: 0">간격과 글자 크기를 바꾸면 앱 전체에 바로 적용돼요.</p>
    <div class="density-picker">
      <button
        v-for="(d, key) in DENSITIES"
        :key="key"
        :class="{ selected: appearance.density === key }"
        @click="appearance.density = key"
      >
        <span class="density-preview" :style="{ '--p': d.scale }"><i></i><i></i><i></i></span>
        <b>{{ d.label }}</b>
        <small>{{ d.desc }}</small>
      </button>
    </div>

    <div class="section-label" style="margin-top: 20px">글자 크기</div>
    <div class="filter" style="width: fit-content; margin-top: 8px">
      <button v-for="(f, key) in FONT_SIZES" :key="key" :class="{ selected: appearance.fontSize === key }" @click="appearance.fontSize = key">
        {{ f.label }}
      </button>
    </div>

    <label class="task" style="border: 0; margin-top: 14px; display: inline-flex;">
      <input type="checkbox" v-model="appearance.reduceMotion" />
      <span style="flex: 1"><b>동작 줄이기</b><small>전환 효과와 애니메이션을 최소화해요</small></span>
    </label>

    <div class="section-label" style="margin-top: 22px">기본값</div>
    <label>시작 화면<select v-model="startScreen"><option>홈 대시보드</option><option>플래너</option><option>할 일</option><option>통계 보드</option></select></label>
    <label>날짜/시간 포맷<select v-model="dateFormat"><option>2026.08.24 (월) · 24시간제</option><option>2026-08-24 · 12시간제</option><option>8월 24일 토요일 · 24시간제</option></select></label>
    <label>한 주의 시작<select v-model="weekStart"><option>월요일</option><option>일요일</option></select></label>

    <button class="primary" @click="save">저장하기</button>
  </section>
</template>
