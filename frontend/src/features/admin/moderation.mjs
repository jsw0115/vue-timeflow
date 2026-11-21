// 신고 처리 상태 이름과 관리자 신고 API 호출을 정한다(PR-10 UF-117 7-7). 서버 결정 값은 REMOVE(게시글 삭제)·IGNORE(문제없음)다.
export const DECISIONS = { REMOVE: '게시글 삭제', IGNORE: '문제없음' }
export const isPending = (report) => !report?.decision
export const decisionLabel = (report) => DECISIONS[report?.decision] ?? '처리 대기'

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다. */
export function createModerationClient({ request }) {
  return {
    /** 모든 신고(ownerId=신고자). 조회 시점 글 내용(postBody, 지워졌으면 null)과 커뮤니티 이름이 붙어 온다. */
    all: () => request('/api/admin/moderation'),
    decide: (report, action) => request(`/api/admin/moderation/${encodeURIComponent(report.id)}`, {
      method: 'PUT', body: JSON.stringify({ userId: report.ownerId, version: report.version, action }),
    }),
  }
}
