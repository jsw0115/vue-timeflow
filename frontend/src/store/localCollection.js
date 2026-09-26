import { ref, watch } from 'vue'
// 로컬 시연 데이터. 서버 권한/동기화 저장소가 아니므로 민감정보를 저장하지 않습니다.
export const storageWarning = ref('')
export function localCollection(name, seed = []) {
  const key = 'timeflow.demo.v1.' + name
  let initial = seed
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (Array.isArray(saved) && saved.every(x => x && typeof x === 'object' && x.id != null)) initial = saved
  } catch { storageWarning.value = '로컬 저장소를 읽을 수 없어 기본 데이터를 표시합니다.' }
  const list = ref(initial)
  watch(list, value => {
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch { storageWarning.value = '로컬 저장에 실패했습니다. 현재 탭에서는 유지되지만 새로고침하면 사라질 수 있어요.' }
  }, { deep: true, flush: 'sync' })
  return list
}
