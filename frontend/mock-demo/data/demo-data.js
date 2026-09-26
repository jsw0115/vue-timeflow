export const demo = {
  date: '2026년 9월 20일 토요일',
  profile: { name: '지수', mode: 'Balance' },
  summary: [
    { label: '오늘 일정', value: '3', detail: '다음: 디자인 싱크 · 11:00' },
    { label: '할 일 진행', value: '4 / 7', detail: '완료율 57%' },
    { label: '루틴 달성률', value: '67%', detail: '2 / 3 완료' }
  ],
  timeline: [
    { time: '08:00', title: '아침 루틴', kind: '루틴' },
    { time: '10:00', title: '서비스 API 명세 검토', kind: '할 일' },
    { time: '11:00', title: '디자인 싱크 미팅', kind: '일정' },
    { time: '14:00', title: 'Spring Boot 인증 흐름 구현', kind: '할 일' },
    { time: '19:00', title: '가족 저녁 약속', kind: '일정' }
  ],
  routines: [
    { name: '물 2L 마시기', done: true },
    { name: '영어 단어 20개', done: true },
    { name: '하루 회고 5분', done: false }
  ]
}
