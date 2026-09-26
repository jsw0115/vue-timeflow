<script setup>
import { ref, computed } from 'vue'
import { items as buildItems } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const threads = buildItems(props.screen, 6)
const activeId = ref(threads[0]?.id ?? 0)
const active = computed(() => threads.find((t) => t.id === activeId.value))

const messages = [
  { mine: false, text: '안녕하세요! 이번 주 계획 공유드려요.' },
  { mine: true, text: '넵 확인했습니다 :) 이 시간대로 맞춰볼게요.' },
  { mine: false, text: '좋아요, 그럼 승인해둘게요.' },
]
</script>

<template>
  <div class="chat-pattern card">
    <aside class="chat-threads">
      <div class="chat-thread" v-for="t in threads" :key="t.id" :class="{ active: t.id === activeId }" @click="activeId = t.id">
        <i>{{ t.person.slice(0, 1) }}</i>
        <span><b>{{ t.person }}</b><small>{{ t.title }}</small></span>
        <small v-if="!t.done" class="unread">●</small>
      </div>
    </aside>
    <section class="chat-room">
      <div class="chat-room-head"><b>{{ active?.person }}</b><small>{{ screen.name }}</small></div>
      <div class="chat-bubbles">
        <div class="bubble" v-for="(m, i) in messages" :key="i" :class="{ mine: m.mine }">{{ m.text }}</div>
      </div>
      <form class="chat-input" @submit.prevent>
        <input placeholder="메시지를 입력하세요" />
        <button class="primary" type="submit">전송</button>
      </form>
    </section>
  </div>
</template>
