# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 기록 저장소(`createFeatureStore` → `useRecordCollection`)는 `state.loading`·`state.loaded`·`state.error`와 `reload()`를 이미 준다. 할 일·일정 화면만 이 값을 썼다.
- 선택한 대안/이유: 다섯 화면에 같은 마크업을 반복하지 않도록 `components/ListLoadState.vue`와 `features/records/listLoadState.mjs`(listLoading·listFailed·listPending)를 만들었다. 할 일·일정 화면은 고치지 않았다(동작 같음, 범위 밖). 입력칸은 레이아웃을 바꾸지 않으려고 보이는 라벨 대신 `aria-label`을 붙였고, `type="search"`도 기본 모양이 바뀔 수 있어 넣지 않았다. 약관 뒤로 가기는 기존 `close()`(이전 기록이 없으면 홈)를 쓴다.
- 오탐/예외와 근거·승인 상태: 자동 점검이 글양식 스위치를 "이름 없는 버튼"으로 센 것은 `<label>`에서 이름을 얻는 오탐이다(접근성 스냅숏에서 이름 확인).
- 다음 작업·미확인: IMP-015(소셜 연동 G 대비), IMP-016(시연 숫자 표시), IMP-017(고칠 수 있는 기본값 언어), IMP-018(점검 안내 링크)은 사용자 결정 대기. 업무 히스토리 실제 집계는 없다.
- 마지막 실행 명령·종료 코드·증거 경로: `frontend`에서 `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` 종료 0(387개), `npm run build:web` 종료 0. 브라우저 증거는 dev-docs 07 RUN-289.
- 완료한 체크리스트 항목과 남은 작업: checklist.md 전부 완료.
- 중단 원인과 재개 시 첫 명령: 중단 아님. 재개 첫 명령: `cd frontend && node --test tests/browser-check-fixes.test.mjs`.
- 사용자 변경과 자체 변경 구분: 시작 시 작업 트리가 깨끗했고 이번 변경은 모두 자체 변경이다.
