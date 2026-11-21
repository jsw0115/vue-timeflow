// 랭킹 참여 여부를 계정 설정 share-visibility 구역의 rankingVisible에 읽고 저장한다(PR-19 UF-136). 서버가 다른 회원의 랭킹 응답에서 빼 준다.

export const VISIBILITY_PATH = '/api/settings/share-visibility'

/** 값이 없으면 기존처럼 참여한다. false일 때만 끈 것으로 본다. */
export const isRankingVisible = (value) => !(value && typeof value === 'object' && value.rankingVisible === false)

/**
 * request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다.
 * 저장은 같은 구역의 다른 값을 지우지 않게 읽어서 합친 뒤 version과 함께 보낸다.
 */
export function createRankingVisibility({ request }) {
  return {
    async load() {
      const row = await request(VISIBILITY_PATH)
      return isRankingVisible(row?.value)
    },
    async save(visible) {
      if (typeof visible !== 'boolean') throw new Error('랭킹 참여 값은 참·거짓만 받아요.')
      const row = await request(VISIBILITY_PATH)
      const value = { ...(row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {}), rankingVisible: visible }
      const body = row?.version ? { value, version: row.version } : { value }
      const saved = await request(VISIBILITY_PATH, { method: 'POST', body: JSON.stringify(body) })
      return isRankingVisible(saved?.value)
    },
  }
}

export function visibilityErrorText(error) {
  if (error?.status === 409) return '다른 기기에서 설정이 바뀌었어요. 화면을 새로 고친 뒤 다시 바꿔 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못해 바꾸지 못했어요. 이전 설정을 유지했어요.'
  return '랭킹 참여 설정을 저장하지 못했어요. 이전 설정을 유지했어요.'
}
