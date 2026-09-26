<script setup>
import { openProfile } from '../store/people'

/**
 * 사람 이름 + ⓘ 버튼. 화면 어디서든 이 컴포넌트를 쓰면 같은 프로필 모달이 열린다.
 * ⓘ만 클릭 대상이라 부모 행의 클릭(이동 등)과 겹치지 않도록 stop 처리한다.
 */
defineProps({
  name: { type: String, required: true },
  bold: { type: Boolean, default: false },
})
</script>

<template>
  <span class="person-tag">
    <b v-if="bold">{{ name }}</b>
    <template v-else>{{ name }}</template>
    <button class="person-info" type="button" :title="name + ' 프로필 보기'" :aria-label="name + ' 프로필 보기'" @click.stop="openProfile(name)">ⓘ</button>
  </span>
</template>
