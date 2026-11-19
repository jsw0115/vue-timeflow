# 작업 체크리스트

## 1단계 공유 서버

- [x] 실제 소스·변경 상태 확인(서버 공유 기능 부재, 사람 찾기 API 부재)
- [x] 결정 받기(Q-23 그룹별 공유 범위, Q-24 이메일 정확 일치)
- [x] 실패하는 테스트 먼저 작성(`ShareCalendarTest` 8개, 수정 전 컴파일 실패)
- [x] V11 `feature_member.share_level`, `ShareCalendar`, `PeopleFinder`, `ShareController` API 4개, 그룹 응답 `shareLevel`
- [x] API 계약·생성 문서 갱신(292개 operation)
- [x] 백엔드 전체 테스트, 격리 MySQL V11 적용, 실제 HTTP 점검
- [x] 문서(01·05·06·07·09·10·README) 갱신
- [x] 커밋·푸시(aafa3f5)

## 2단계 공유 화면

- [x] 화면에 필요한 서버 값 확인(이름 없음, 초대 거절 불가, 방장이 초대 목록을 못 봄)
- [x] 실패하는 서버 테스트 먼저 작성(`ShareScreenServerTest` 4개, 수정 전 컴파일 실패)
- [x] 서버: 친구·차단·멤버 이름, `status=invited`, 초대 거절
- [x] 화면: `shareClient.mjs`, `ShareSignIn`, `PersonFinder`, 친구·차단·그룹 목록·그룹 상세·공유 가시성
- [x] DESIGN.md 점검(muted on surface인 `.form-note`를 새 화면에서 쓰지 않음, 토큰만, 320px)
- [x] 백엔드 전체·프런트 전체·빌드·계약, 실제 백엔드·브라우저 점검 22개
- [x] 문서(01·03·04·06·07·09·10·README·DESIGN 변경 기록) 갱신
- [ ] 커밋·푸시

## 3단계 이후

- [ ] 3 커뮤니티 화면 연결
- [ ] 4 업무·WBS·위키 화면 연결
- [ ] 5 첨부 한도 안내, 관리 화면 403
- [ ] 6 통계에서 원본으로 이동
- [ ] 서비스 정리(bootRun, Vite, docker compose stop)
