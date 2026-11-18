# 작업 체크리스트

- [x] 실제 소스·변경 상태 확인(사용자 미커밋 `Modal.vue`·`PlannerItemQueryRepositoryImpl.java`·`docs/output/`, 작업 중 생긴 `DESIGN-figma.md`는 건드리지 않음)
- [x] 구현 계획·영향 분석(plan.md, 06 IM-14)
- [x] 서버 테스트 먼저 작성, 수정 전 실패 확인(07 RUN-30)
- [x] 서버 `RecurrenceRule` 예외 검증·적용, `ScheduleService` 회차 판정·history Q-05 계산
- [x] 프런트 테스트 먼저 작성, 수정 전 실패 확인(07 RUN-32)
- [x] 프런트 `recurrence.mjs` 예외 검증·적용·추가·해제 도우미
- [x] 루틴 화면 쉬는 날 대화상자, 오늘 목록·홈 제외, 계산 방식 안내, "쉬기" → "중지" 이름 변경
- [x] API 계약 스키마·생성 문서·규약 README
- [x] 관련 SW 49·웹 28·OWASP 체크(context-notes)
- [x] UI KWCAG 2.2 확인(정적·SSR 범위, 브라우저 실측은 NOT_RUN)
- [x] 테스트/실제 증빙 기록(07 RUN-30~RUN-37, verification.md)
- [x] 개발 문서 01·03·04·06·07·08·09·README 갱신
- [x] 기존 사용자 변경 보존 확인, 자체 검증 변경만 의미 단위 커밋
- [x] 중단·재개를 위한 마지막 결과와 다음 작업 기록
- [ ] 2단계: 일정 회차 건너뛰기 UI·override·이후 회차 분할(다음 작업)
- [ ] 3단계: 루틴 첫 수치 "최근 4주 달성률"(PR-07에서)
- [ ] 결정 대기: 09 Q-19(지난 날짜 쉬는 날 서버 차단), Q-20(중지 시작일 적용)
