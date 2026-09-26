<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { navGroups } from '../../router'

const route = useRoute()
const items = computed(() => navGroups.find((g) => g.label === '설정')?.items ?? [])
</script>

<template>
  <nav class="setting-menu card">
    <router-link v-for="item in items" :key="item.path" :to="item.path" custom v-slot="{ navigate }">
      <button :class="{ active: route.path === item.path }" @click="navigate">{{ item.name }}<span>›</span></button>
    </router-link>
  </nav>
</template>
