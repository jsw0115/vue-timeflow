export const screens = Object.freeze([
  ['/', '오늘 요약'], ['/calendar', '통합 캘린더'], ['/planner', '일간 플래너'],
  ['/planner/weekly', '주간 플래너'], ['/planner/monthly', '월간 플래너'],
  ['/events', '일정'], ['/tasks', '할 일'], ['/routines', '루틴'],
  ['/diary', '다이어리'], ['/memos', '메모'], ['/stats', '통계'],
  ['/settings', '설정'], ['/auth/login', '로그인'], ['/mock-demo/', '독립 목업 시연'],
])
export const widths = Object.freeze([320, 360, 390, 430, 768])
export function readPreviewState(search) {
  const params = new URLSearchParams(search)
  return {
    view: ['both', 'pc', 'mobile'].includes(params.get('view')) ? params.get('view') : 'both',
    route: screens.some(([path]) => path === params.get('screen')) ? params.get('screen') : '/',
    width: widths.includes(Number(params.get('width'))) ? Number(params.get('width')) : 390,
  }
}
