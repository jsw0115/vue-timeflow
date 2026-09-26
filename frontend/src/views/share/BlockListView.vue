<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { contacts, blockedIds, toggleBlock, groups } from '../../store/contacts'

const router = useRouter()
const blocked = computed(() => contacts.value.filter((c) => blockedIds.value.includes(c.id)))
</script>

<template>
  <div class="page-tools">
    <span class="form-note" style="margin: 0">차단하면 주소록 초대와 캘린더 그룹 멤버에서 함께 제외돼요</span>
    <button class="primary" @click="router.push('/address')">주소록에서 차단하기</button>
  </div>

  <section class="card">
    <p v-if="!blocked.length" class="form-note" style="margin: 0">차단한 사용자가 없어요.</p>
    <div class="event" v-for="b in blocked" :key="b.id">
      <i></i>
      <span style="flex: 1"><b>{{ b.name }}</b><small>{{ b.relation }} · {{ b.email }}</small></span>
      <button class="review" style="margin: 0" @click="toggleBlock(b.id)">차단 해제</button>
    </div>
  </section>

  <p class="form-note" style="margin-top: 12px">
    현재 그룹 {{ groups.length }}개에 차단 사용자가 남아 있지 않은지 자동으로 확인해요.
  </p>
</template>
