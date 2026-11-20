# 결정·근거·인수인계 메모

- 연결 방법: Vite 기본 프록시(8080)를 바꾸지 않고 로컬 실행 가이드(`docs/handbook/source/01-로컬-실행-가이드.md` 'API 연결과 플랫폼 확인')대로 `frontend/.env.local`에 DEV_API_TARGET을 둔다. 8081은 사용자 미커밋 변경이라 저장소 기본값을 그에 맞춰 바꾸지 않았다.
- CORS: 가이드가 여는 주소(127.0.0.1:5173)와 기본 허용 출처(localhost:5173)가 어긋나 있었다. 기본값과 .env.example에 127.0.0.1:5173을 더했다(chat-local 프로파일과 같은 범위). application.yml은 사용자 포트 변경과 다른 줄이다 — 커밋할 때 줄 단위로 나눠야 한다.
- 가입 화면 위치: 라우터가 쓰는 `features/auth/views/SignupView.vue`를 고쳤다. 처음에 쓰이지 않는 `views/auth/SignupView.vue`를 고쳤다가 되돌렸다(HEAD 상태).
- 가입 후 흐름: /chat 대신 온보딩(하루 모드) → 홈. 로그인 기본 도착도 홈. 채팅은 떠 있는 대화 버튼으로 연다.
- 휴대폰 인증은 서버 항목이 없고 실제 발송도 없어 넣지 않았다.
- 사용자 변경과 자체 변경: 사용자 미커밋(backend PlannerItemQueryRepositoryImpl.java, application.yml 포트 줄, Modal.vue, security/ 문서, docs/output/)은 그대로. 자체 변경: application.yml CORS 줄, backend/.env.example, session.js, features/auth/views/SignupView.vue, passwordPolicy.mjs(+테스트), LoginView, OnboardingView, LegalViewerView, 이 기록.
- 실행 중: 백엔드 8081(gradlew bootRun), Vite 5173(npm run dev), 격리 Redis 16389(compose). 끄려면 각 터미널을 종료하고 `docker compose -f infra/chat/compose.yml stop`.
- 커밋: application.yml은 CORS 줄만 인덱스에 올려 커밋했다(d6dbcf0). .env.example 정리(fb007ac), .gitignore .env 묶음(0646a93), 화면과 이 기록은 뒤이은 커밋.
- 다음: 원하면 로컬 DB의 테스트 계정 정리, 예전 `views/auth/SignupView.vue` 삭제 검토, 포트 8081을 application.yml 대신 backend/.env의 SERVER_PORT로 옮기기.
