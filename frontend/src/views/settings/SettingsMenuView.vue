<script setup>
// 메뉴 즐겨찾기 설정. 고정·순서 변경·해제를 버튼과 체크박스로만 해 키보드로도 모두 된다(PR-19 UF-131, UT-233).
import { bodyLocale, tr } from '../../store/locale'
import { groupLabel, navName } from '../../features/i18n/locale.mjs'
import { computed, nextTick, ref } from 'vue'
import { MAX_FAVORITES } from '../../features/nav/favorites.mjs'
import { favoriteMenus, initNavFavorites, isFavorite, moveMenuFavorite, navFavorites, pinnableMenus, toggleMenuFavorite } from '../../store/navFavorites'

// 메뉴 목록은 App.vue가 먼저 넘겨 둔다. 이 화면은 router를 직접 불러오지 않는다
initNavFavorites()
const favorites = computed(() => favoriteMenus())
const full = computed(() => navFavorites.paths.length >= MAX_FAVORITES)
const groups = computed(() => {
  const out = []
  for (const item of pinnableMenus()) {
    let group = out.find((entry) => entry.label === item.group)
    if (!group) out.push((group = { label: item.group, items: [] }))
    group.items.push(item)
  }
  return out
})
// 메뉴·묶음 이름은 사이드바와 같은 번역을 쓴다(PR-32)
const name = (item) => navName(item, bodyLocale.value)
const announce = ref('')
const list = ref(null)
const groupsRoot = ref(null)

function toggle(item) {
  const had = isFavorite(item.path)
  toggleMenuFavorite(item.path)
  announce.value = had ? tr('‘{name}’ 즐겨찾기를 해제했어요.', { name: name(item) }) : tr('‘{name}’ 즐겨찾기에 추가했어요({n}번째).', { name: name(item), n: navFavorites.paths.length })
}
/** 옮긴 뒤에도 같은 항목의 버튼에 포커스를 둔다. 끝에 닿아 그 버튼이 막히면 반대 방향 버튼으로 옮긴다. */
async function move(item, delta) {
  moveMenuFavorite(item.path, delta)
  const place = navFavorites.paths.indexOf(item.path) + 1
  announce.value = tr('‘{name}’ 순서를 {n}번째로 바꿨어요.', { name: name(item), n: place })
  await nextTick()
  const row = list.value?.querySelector(`[data-path="${CSS.escape(item.path)}"]`)
  const same = row?.querySelector(delta < 0 ? '[data-move="up"]' : '[data-move="down"]')
  const other = row?.querySelector(delta < 0 ? '[data-move="down"]' : '[data-move="up"]')
  ;(same && !same.disabled ? same : other)?.focus()
}
/** 해제하면 그 행이 사라지므로 같은 자리의 다음 행(없으면 앞 행)의 해제 버튼, 목록이 비면 전체 메뉴 첫 체크박스로 포커스를 옮긴다. */
async function remove(item) {
  const index = navFavorites.paths.indexOf(item.path)
  toggle(item)
  await nextTick()
  const rows = list.value?.querySelectorAll('[data-remove]') ?? []
  const target = rows[Math.min(index, rows.length - 1)] ?? groupsRoot.value?.querySelector('input:not(:disabled)')
  target?.focus()
}
</script>

<template>
  <section class="card setting-content">
    <h2>{{ tr('메뉴 · 즐겨찾기') }}</h2>
    <p>{{ tr('자주 쓰는 메뉴를 사이드바 맨 위에 모아 둬요. 원래 자리의 메뉴는 그대로 있고, 접근 권한도 바뀌지 않아요. 설정은 이 브라우저에만 저장돼요.') }}</p>

    <div class="section-label">{{ tr('즐겨찾기') }} <span class="figure">{{ navFavorites.paths.length }}/{{ MAX_FAVORITES }}</span></div>
    <p v-if="!favorites.length" class="empty-state">{{ tr('아직 즐겨찾기가 없어요. 아래 전체 메뉴에서 고르면 사이드바 맨 위에 보여요.') }}</p>
    <ol v-else ref="list" class="favorite-list">
      <li v-for="(item, index) in favorites" :key="item.path" :data-path="item.path">
        <span class="favorite-name"><b>{{ name(item) }}</b><small>{{ groupLabel(item.group, bodyLocale) }}</small></span>
        <span class="favorite-actions">
          <button type="button" class="button-secondary" data-move="up" :disabled="index === 0" :aria-label="tr('{name} 위로 옮기기', { name: name(item) })" @click="move(item, -1)">{{ tr('위로') }}</button>
          <button type="button" class="button-secondary" data-move="down" :disabled="index === favorites.length - 1" :aria-label="tr('{name} 아래로 옮기기', { name: name(item) })" @click="move(item, 1)">{{ tr('아래로') }}</button>
          <button type="button" class="button-text" data-remove :aria-label="tr('{name} 즐겨찾기 해제', { name: name(item) })" @click="remove(item)">{{ tr('해제') }}</button>
        </span>
      </li>
    </ol>
    <p class="sr-only" role="status">{{ announce }}</p>

    <div ref="groupsRoot">
      <div class="section-label">{{ tr('전체 메뉴') }}</div>
      <p v-if="full" class="input-field-help">{{ tr('즐겨찾기는 {n}개까지예요. 더 넣으려면 먼저 하나를 해제해 주세요.', { n: MAX_FAVORITES }) }}</p>
      <fieldset v-for="group in groups" :key="group.label" class="menu-group">
        <legend>{{ groupLabel(group.label, bodyLocale) }}</legend>
        <label v-for="item in group.items" :key="item.path" class="menu-check">
          <input type="checkbox" :checked="isFavorite(item.path)" :disabled="full && !isFavorite(item.path)" @change="toggle(item)" />{{ name(item) }}
        </label>
      </fieldset>
    </div>
  </section>
</template>

<style scoped>
.favorite-list { display: grid; gap: var(--space-sm); margin: var(--space-md) 0 var(--space-xl); padding: 0; list-style: none; }
.favorite-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-sm) var(--space-lg); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); }
.favorite-name { display: grid; gap: var(--space-xs); min-width: 0; }
.favorite-name small { color: var(--color-muted); font-size: var(--type-caption-size); }
.favorite-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.menu-group { margin: 0 0 var(--space-lg); padding: 0; border: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0 var(--space-lg); }
.menu-group legend { margin-bottom: var(--space-sm); padding: 0; color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 600; }
/* 설정 화면 전역 label 규칙(위 여백 16px·굵은 글씨)을 체크박스 줄에서는 쓰지 않는다 */
.menu-check { display: flex; align-items: center; gap: var(--space-sm); min-height: var(--input-height); margin: 0; font-size: var(--type-body-sm-size); font-weight: 400; }
.menu-check input { margin: 0; }
</style>
