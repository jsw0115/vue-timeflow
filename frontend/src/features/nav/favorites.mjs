// 사이드바 메뉴 즐겨찾기 규칙(PR-19 UF-131, CF-001). 고정·순서 변경·해제만 하고 메뉴 접근 권한과는 무관하다.

export const MAX_FAVORITES = 8
/** 즐겨찾기로 둘 수 없는 메뉴: 사이드바에 따로 있거나(채팅·플래너 묶음 머리) 화면이 아니라 동작인 것(커뮤니티 만들기). */
export const NOT_PINNABLE = ['/chat', '/planner', '/community/new']

/** 메뉴 묶음에서 즐겨찾기 후보를 펼친다. */
export function pinnableItems(groups) {
  return groups.flatMap((group) => group.items.filter((item) => !NOT_PINNABLE.includes(item.path)).map((item) => ({ ...item, group: group.label })))
}

/** 저장값을 믿지 않는다. 없는 메뉴·중복·한도 초과를 빼고 순서는 지킨다. */
export function cleanFavorites(raw, validPaths, max = MAX_FAVORITES) {
  const out = []
  for (const path of Array.isArray(raw) ? raw : []) {
    if (typeof path === 'string' && validPaths.includes(path) && !out.includes(path)) out.push(path)
    if (out.length >= max) break
  }
  return out
}

/** 있으면 빼고 없으면 끝에 더한다. 한도가 차면 그대로 돌려준다(화면이 이유를 보인다). */
export function toggleFavorite(list, path, max = MAX_FAVORITES) {
  if (list.includes(path)) return list.filter((entry) => entry !== path)
  return list.length >= max ? list : [...list, path]
}

/** 한 칸 위(-1)·아래(+1)로 옮긴다. 끝을 넘으면 그대로다. */
export function moveFavorite(list, path, delta) {
  const from = list.indexOf(path)
  const to = from + delta
  if (from < 0 || to < 0 || to >= list.length) return list
  const next = [...list]
  next.splice(from, 1)
  next.splice(to, 0, path)
  return next
}
