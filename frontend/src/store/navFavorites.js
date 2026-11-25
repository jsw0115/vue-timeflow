// 사이드바 즐겨찾기 상태. 이 브라우저에만 저장한다(PR-19 UF-131). 계정 서버 저장은 아니다.
// router를 직접 불러오지 않는다(설정 검색 → 설정 화면 → 이 파일 경로로 router가 끌려오면 순환·Node 렌더 실패가 생긴다).
// 메뉴 목록은 App.vue가 initNavFavorites(navGroups)로 넘긴다.
import { reactive, watch } from 'vue'
import { cleanFavorites, moveFavorite, pinnableItems, toggleFavorite } from '../features/nav/favorites.mjs'

const KEY = 'timeflow.nav.favorites'
let pinnable = []
export const pinnableMenus = () => pinnable
/** 사이드바 묶음 이름(순서대로). App.vue가 넘긴 메뉴 목록에서 얻는다. */
export const navGroupLabels = () => pinnable.map((item) => item.group).filter((label, index, list) => list.indexOf(label) === index)

export const navFavorites = reactive({ paths: [], ready: false })

export function initNavFavorites(groups) {
  if (navFavorites.ready || !groups) return
  pinnable = pinnableItems(groups)
  let raw = []
  try { raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { raw = [] }
  navFavorites.paths = cleanFavorites(raw, pinnableMenus().map((item) => item.path))
  navFavorites.ready = true
  watch(() => [...navFavorites.paths], (paths) => {
    try { localStorage.setItem(KEY, JSON.stringify(paths)) } catch { /* 저장할 수 없는 환경이면 이 창에서만 유지 */ }
  })
}

export const favoriteMenus = () => navFavorites.paths.map((path) => pinnableMenus().find((item) => item.path === path)).filter(Boolean)
export const isFavorite = (path) => navFavorites.paths.includes(path)
export function toggleMenuFavorite(path) { navFavorites.paths = toggleFavorite(navFavorites.paths, path) }
export function moveMenuFavorite(path, delta) { navFavorites.paths = moveFavorite(navFavorites.paths, path, delta) }
