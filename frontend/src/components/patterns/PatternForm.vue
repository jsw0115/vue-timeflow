<script setup>
import { tr } from '../../store/locale'
import { roleParts } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const fields = roleParts(props.screen.role)
</script>

<template>
  <div class="form-pattern">
    <section class="card form-card">
      <p class="eyebrow">{{ screen.id }}</p>
      <h2>{{ screen.name }}</h2>
      <p>{{ screen.role }}</p>
      <label v-for="(field, i) in fields" :key="i">
        {{ field }}
        <input v-if="i % 2 === 0" :placeholder="tr('{field} 입력', { field })" />
        <select v-else><option>{{ field }}</option><option value="기타">{{ tr('기타') }}</option></select>
      </label>
      <div class="form-row" style="margin-top:15px">
        <button class="icon" type="button" style="width:auto;padding:0 15px">{{ tr('취소') }}</button>
        <button class="primary" style="flex:1">{{ tr('저장하고 계속하기') }}</button>
      </div>
    </section>
  </div>
</template>
