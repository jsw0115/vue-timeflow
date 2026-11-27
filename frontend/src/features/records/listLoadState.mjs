// 서버 목록(로그인 상태)을 아직 받지 못한 상태를 고른다. 이때 화면은 빈 목록 문구 대신 불러오는 중·실패 안내를 보인다(BUG-007).
const onServer = (store) => (store.mode?.value ?? store.mode) === 'server' && !store.state.loaded
export const listLoading = (store) => onServer(store) && !!store.state.loading
export const listFailed = (store) => onServer(store) && !store.state.loading && !!store.state.error
/** 빈 목록 문구를 숨길 때: 불러오는 중이거나 불러오지 못했다 */
export const listPending = (store) => listLoading(store) || listFailed(store)
