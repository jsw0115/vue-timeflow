# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 링크 색은 `styles.css`의 `a:not([class])`에만 있다. `RouterLink`는 활성 상태가 아니면 `class=""`를 남긴다. 대화 상자는 `Modal.vue`의 기본 `<dialog>`(`showModal()`)다. 관리자 버튼 표시는 `/api/admin/stats` 응답으로 정한다. 메모 화면에는 수정·삭제가 없고 변환은 `POST /api/tasks`만 보낸다.
- 선택한 대안/이유: Claude in Chrome 도구가 없어 컨테이너 Chromium(Playwright)을 썼다. 200% 확대는 1440px 창의 CSS 너비 720px로 대신했다. 실제 백엔드는 `infra/chat/compose.yml`(격리 MySQL·Redis)과 `chat-local` 프로필로 띄웠다. 로그인 시도 제한은 계정이 잠길 수 있어 시험하지 않았다.
- 오탐/예외와 근거·승인 상태: `[role=dialog]` 0개(기본 dialog의 암묵 역할), 대화 상자에서 body로 나간 초점(브라우저 쪽으로 넘어감), 월 입력칸 초점 표시, 테마 미리보기의 "저장 실패" 견본, `vite preview`의 두 단계 주소 새로고침(빌드 base './', 배포는 `--base=/`·해시 주소). 근거는 결과서 "오탐으로 판단한 것".
- 다음 작업·미확인: BUG-012~BUG-014 수정, IMP-019~IMP-022 결정. 화면 읽기 프로그램·실기기·Pretendard 글꼴 적용 상태·채팅·공유·파일 올리기·관리자 계정 화면은 확인하지 못했다.
- 마지막 실행 명령·종료 코드·증거 경로: 점검 스크립트는 저장소 밖(세션 임시 폴더)에 두었다. 결과는 `docs/quality/browser-test-2026-11-27.md`와 07 RUN-291. 문서 검사 `python3 scripts/docs/verify_documentation.py` 종료 0.
- 완료한 체크리스트 항목과 남은 작업: checklist.md 전부 완료.
- 중단 원인과 재개 시 첫 명령: 중단 아님. 격리 DB를 다시 띄우려면 `docker compose -f infra/chat/compose.yml up -d --wait`.
- 사용자 변경과 자체 변경 구분: 시작 시 작업 트리가 깨끗했고 이번 변경은 모두 자체 문서 변경이다.
