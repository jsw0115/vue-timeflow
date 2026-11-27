# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 갱신 실패 처리(`refresh()`의 catch)만 서버가 세션을 끝낸 경우다. `logout()`도 `clearSession()`을 쓰므로 안내 표시는 catch 안에서만 켠다. 다시 로그인하면 `save()`가 userId를 넣을 때 끈다.
- 선택한 대안/이유: 안내는 기존 `.callout`과 `.inline-link`·`.button-text`를 써서 새 스타일을 만들지 않았다. 탭 제목은 머리글과 같은 `pageName`을 써서 화면 이름과 탭 제목이 어긋나지 않게 했다. 관리자 화면은 권한 확인 전에는 "관리자 화면"으로 둔다.
- BUG-017: Vite 6.4.3에서 의존성 최적화가 도는 동안 `vite.close()`가 끝나지 않는다. 시험은 미리보기 경로만 보므로 `optimizeDeps.noDiscovery`로 탐색을 껐다. 앱 설정(`vite.config.js`)은 바꾸지 않았다.
- 오탐/예외와 근거·승인 상태: 없음.
- 다음 작업·미확인: IMP-023~IMP-025 결정. PR-06 완료 조건(사용자 PC에서 TS-09)은 남는다.
- 마지막 실행 명령·종료 코드·증거 경로: `frontend`에서 `node --test --test-concurrency=1 tests/*.test.mjs` 종료 0(403개), `npm run build:web` 종료 0. 브라우저 증거는 07 RUN-294.
- 완료한 체크리스트 항목과 남은 작업: checklist.md 전부 완료.
- 중단 원인과 재개 시 첫 명령: 중단 아님. 재개 첫 명령: `cd frontend && node --test tests/browser-check-fixes.test.mjs`.
- 사용자 변경과 자체 변경 구분: 시작 시 작업 트리가 깨끗했고 이번 변경은 모두 자체 변경이다.
