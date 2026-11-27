# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 기록 저장소(`createFeatureStore` → `useRecordCollection`)는 `state.loading`·`state.loaded`·`state.error`와 `reload()`를 이미 준다. 할 일·일정 화면만 이 값을 썼다.
- 선택한 대안/이유: 다섯 화면에 같은 마크업을 반복하지 않도록 `components/ListLoadState.vue`와 `features/records/listLoadState.mjs`(listLoading·listFailed·listPending)를 만들었다. 할 일·일정 화면은 고치지 않았다(동작 같음, 범위 밖). 입력칸은 레이아웃을 바꾸지 않으려고 보이는 라벨 대신 `aria-label`을 붙였고, `type="search"`도 기본 모양이 바뀔 수 있어 넣지 않았다. 약관 뒤로 가기는 기존 `close()`(이전 기록이 없으면 홈)를 쓴다.
- 오탐/예외와 근거·승인 상태: 자동 점검이 글양식 스위치를 "이름 없는 버튼"으로 센 것은 `<label>`에서 이름을 얻는 오탐이다(접근성 스냅숏에서 이름 확인).
- 다음 작업·미확인: IMP-015(소셜 연동 G 대비), IMP-016(시연 숫자 표시), IMP-017(고칠 수 있는 기본값 언어), IMP-018(점검 안내 링크)은 사용자 결정 대기. 업무 히스토리 실제 집계는 없다.
- 마지막 실행 명령·종료 코드·증거 경로: `frontend`에서 `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` 종료 0(387개), `npm run build:web` 종료 0. 브라우저 증거는 dev-docs 07 RUN-289.
- 완료한 체크리스트 항목과 남은 작업: checklist.md 전부 완료.
- 중단 원인과 재개 시 첫 명령: 중단 아님. 재개 첫 명령: `cd frontend && node --test tests/browser-check-fixes.test.mjs`.
- 사용자 변경과 자체 변경 구분: 시작 시 작업 트리가 깨끗했고 이번 변경은 모두 자체 변경이다.

## 이어서: IMP-015~IMP-018

- 결정과 근거: 사전의 '할 일'은 메뉴 이름("Task")이라 열 이름으로 쓰면 뜻이 어긋난다. 단위 표(`UNITS_EN`)처럼 사전과 따로 `STORED_DEFAULTS_EN`을 두고, `storedDefault()`는 글자가 처음 값과 같을 때만 바꿔 보인다. 루틴 단위는 '회'만 `unit()`으로 바꾸고, 다른 단위는 사용자가 쓴 그대로 보인다(`unit()`은 표에 없는 단위를 영어에서 지우므로 그대로 쓰지 않았다).
- 컬럼 관리 입력칸은 `:value`와 `@change`라 화면에 "To do"가 보여도 고치지 않으면 저장값이 그대로다. 브라우저에서 확인했다. 새 루틴 창의 단위 입력칸은 `v-model`이라 화면용 번역을 넣지 않았다.
- 일정 템플릿·공수 계산은 목록을 화면 안(`ref`)에만 들고 `keep-alive`가 없어 다시 열면 처음 상태로 돌아간다. 그래서 MN-22 저장 방식을 로컬에서 시연으로 고쳤다.
- `vite preview`에서는 깊은 주소를 바로 열거나 새로 고치면 빈 화면이 된다. 브라우저 확인은 `/`를 연 뒤 주소만 바꿔서 했다(앱 문제로 보지 않음, 이전 점검과 같은 방식).
- 마지막 실행 명령·종료 코드: `frontend`에서 전체 시험 종료 0(391개), `npm run build:web` 종료 0. 브라우저 증거는 dev-docs 07 RUN-290.
- 다음 작업·미확인: 다크·세피아·고대비 표면의 "G" 대비, 업무 히스토리·일정 템플릿·공수 계산의 실제 저장은 없다.
