<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { tokenize } from '../store/tagging'
import { openProfile } from '../store/people'

/** 본문의 #태그와 @멘션을 눌러서 이동할 수 있게 렌더한다. */
const props = defineProps({
  text: { type: String, default: '' },
  clickable: { type: Boolean, default: true },
})

const router = useRouter()
const parts = computed(() => tokenize(props.text))

function onTag(tag) {
  if (!props.clickable) return
  router.push({ path: '/tags', query: { tag } })
}
function onMention(name) {
  if (!props.clickable) return
  openProfile(name)
}
</script>

<template>
  <span class="rich-text">
    <template v-for="(p, i) in parts" :key="i">
      <button v-if="p.type === 'tag'" type="button" class="rt-tag" @click.stop="onTag(p.value)">#{{ p.value }}</button>
      <button v-else-if="p.type === 'mention'" type="button" class="rt-mention" @click.stop="onMention(p.value)">@{{ p.value }}</button>
      <template v-else>{{ p.value }}</template>
    </template>
  </span>
</template>
