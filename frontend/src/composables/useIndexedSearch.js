import { onBeforeUnmount, ref, watch } from 'vue'
import { SearchIndex } from '../utils/searchIndex.mjs'
export function useIndexedSearch(entries, query, scope) {
  const result = ref({ items: [], counts: {}, total: 0 }), busy = ref(false), offset = ref(0)
  const worker = typeof Worker !== 'undefined' ? new Worker(new URL('../workers/search.worker.js', import.meta.url), { type: 'module' }) : null
  const fallback = worker ? null : new SearchIndex()
  let request = 0, timer
  function search() {
    const id = ++request
    if (worker) { busy.value = !!query.value.trim(); worker.postMessage({ type: 'search', id, query: query.value, scope: scope.value, offset: offset.value, limit: 40 }) }
    else { result.value = fallback.search(query.value, scope.value, offset.value); busy.value = false }
  }
  if (worker) worker.onmessage = ({ data }) => { if (data.id === request) { result.value = data; busy.value = false } }
  watch(entries, value => {
    offset.value = 0
    if (worker) worker.postMessage({ type: 'sync', entries: value })
    else fallback.sync(value)
    search()
  }, { immediate: true })
  watch([query, scope], () => { request++; busy.value = !!query.value.trim(); offset.value = 0; clearTimeout(timer); timer = setTimeout(search, 120) })
  onBeforeUnmount(() => { clearTimeout(timer); worker?.terminate() })
  return { result, busy, offset, search }
}
