# 작업 체크리스트

## 1단계 공유 서버

- [x] 실제 소스·변경 상태 확인(서버 공유 기능 부재, 사람 찾기 API 부재)
- [x] 결정 받기(Q-23 그룹별 공유 범위, Q-24 이메일 정확 일치)
- [x] 실패하는 테스트 먼저 작성(`ShareCalendarTest` 8개, 수정 전 컴파일 실패)
- [x] V11 `feature_member.share_level`, `ShareCalendar`, `PeopleFinder`, `ShareController` API 4개, 그룹 응답 `shareLevel`
- [x] API 계약·생성 문서 갱신(292개 operation)
- [x] 백엔드 전체 테스트, 격리 MySQL V11 적용, 실제 HTTP 점검
- [x] 문서(01·05·06·07·09·10·README) 갱신
- [ ] 커밋·푸시

## 2단계 이후

- [ ] 2 공유 화면 연결
- [ ] 3 커뮤니티 화면 연결
- [ ] 4 업무·WBS·위키 화면 연결
- [ ] 5 첨부 한도 안내, 관리 화면 403
- [ ] 6 통계에서 원본으로 이동
- [ ] 서비스 정리(bootRun, Vite, docker compose stop)
