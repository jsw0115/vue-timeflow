# 작업 체크리스트

## 0. 10 통합표 정정

- [x] PR-07 완료가 빠진 곳 정정(2절 원표, 5-4, 상태 기준, PR-22 3단계, PR-12 남은 일). 커밋 `3f4879e`

## 1단계(서버 연결 기반)

- [x] 실제 소스·변경 상태 확인(작업 브랜치를 `origin/master` 기준으로 맞춤)
- [x] 단계 계획과 영향 분석(plan.md)
- [x] 서버: V10, `RecordLinks`, `RecordLinkController`, 기록 시작 원본, 일정·할 일 삭제 시 연결 해제, 백업 원본 정보 제외
- [x] 테스트 `RecordLinkTest` 7개, 수정 전 실패 확인(07 RUN-96)
- [x] API 계약 생성 문서와 목록, 마이그레이션 안내, DB 설계서(05)
- [x] 관련 SW 49·웹 28·OWASP 체크(소유권, 입력 검증, 멱등, 트랜잭션)
- [x] UI 변경 없음(KWCAG N/A)
- [x] 테스트/실제 증빙 기록(07 RUN-96~RUN-99, verification.md)
- [x] 문서 갱신(01·03·05·06·07·09·10, dev-docs README)
- [x] 의미 단위 커밋
- [x] 다음 단계와 남은 일 기록(context-notes.md)

## 2단계(날짜 기준)

- [x] 프로필 하루 경계 저장·검증(`dayStartHour` 0~6 정수)
- [x] 사용자 시간대·경계로 통계·홈 오늘·일간 블록(`DayPolicy`, `InsightService`, `InsightController`)
- [x] 테스트 `DayBoundaryTest` 6개, 수정 전 실패 확인(07 RUN-100)
- [x] 전체 회귀에서 앱 시작 실패(생성자 두 개) 발견·수정(07 RUN-102·RUN-103)
- [x] 실제 백엔드 점검(07 RUN-104), API 계약 갱신
- [x] 관련 SW 49·OWASP 체크(입력 검증: 경계 범위·정수, 시간대 `ZoneId` 검증은 기존 프로필)
- [x] UI 변경 없음(KWCAG N/A)
- [x] 문서 갱신(01·03·06·07·09·10, dev-docs README)
- [x] 의미 단위 커밋

## 3·4단계(화면)

- [ ] 연결 화면, 24시간 보기, 설정 화면
