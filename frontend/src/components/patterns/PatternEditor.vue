<script setup>
import { roleParts } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const fields = roleParts(props.screen.role)
</script>

<template>
  <section class="editor card">
    <div class="head">
      <div><span class="pill">{{ screen.id }}</span><h2>{{ screen.name }}</h2></div>
      <button>AI 초안 ✦</button>
    </div>
    <div class="moods">😌 <b>🙂</b> 😮 😔</div>
    <label v-for="(f, i) in fields" :key="i">{{ f }}<textarea :placeholder="`${f}에 대해 자유롭게 기록해보세요.`"></textarea></label>
    <button class="primary">저장하기</button>
  </section>
</template>
