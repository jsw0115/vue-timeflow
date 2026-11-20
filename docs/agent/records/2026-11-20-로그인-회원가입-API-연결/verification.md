# 검증 기록

- 실행 일시/환경: 2026-11-20 21:40~22:00 KST, Windows 11, Node v20.18.0, 백엔드 기본 프로파일 `gradlew bootRun`(8081, DB localhost:3307/timeflow, Redis 16389), Vite `npm run dev`(127.0.0.1:5173, `.env.local` DEV_API_TARGET=8081), Chrome headless(playwright-core).

| 검사 | 명령/방법 | 결과 |
|---|---|---|
| 가입·로그인 브라우저 종단 점검 | scratchpad `pw/auth-e2e.mjs`(실제 화면 → Vite 프록시 → 8081) | PASS 14/14: 브라우저 출처 POST가 CORS 403 없이 닿음, 빈 양식 칸별 오류, 비밀번호 정책 안내, 가입→자동 로그인→온보딩, 세션 토큰 저장, 닉네임 표시, 모드 저장 후 홈, 사이드바 계정, 중복 이메일 서버 문구, 틀린 비밀번호 안내, 로그인 후 홈, redirect·Enter 제출, 320px 넘침 0, 페이지 오류 0 |
| 수정 전 재현 | 같은 화면에서 가입 제출 | FAIL 재현: `POST /api/auth/signup 403`(허용되지 않은 출처) → 화면 '서버에 연결하지 못했습니다' |
| 프런트 테스트 전체 | `node --test --test-concurrency=1 tests/*.test.mjs` | PASS 224/224(새 password-policy 2개 포함) |
| 빌드 | `npm run build:web` | PASS |
| API 계약 생성 | `node scripts/frontend-api-contract.mjs` | PASS(298 operations, 파일 변경 없음) |
| 백엔드 설정 테스트 | `gradlew test --tests ApplicationStartupTest --tests JwtConfigurationTest` | PASS(BUILD SUCCESSFUL) |

## 보안(SW 49 / 웹 28 / OWASP)
- CORS: 허용 출처에 로컬 루프백 `http://127.0.0.1:5173`만 추가. 와일드카드 없음. 운영은 `APP_CORS_ALLOWED_ORIGINS`로 덮어쓴다(기존과 같음).
- 인증: 서버 검증·비밀번호 해시·로그인 잠금(점검 중 같은 이메일 반복 실패로 403 잠금 동작 확인)은 그대로. 화면 비밀번호 검사는 안내용이고 서버가 최종 판단.
- 비밀값: backend/.env 값은 읽거나 출력하지 않았다(키 이름만 확인, DB 확인 명령은 환경변수로 전달). `.env.local`에는 비밀값 없음.
- 열린 리다이렉트: 로그인 redirect는 기존처럼 같은 사이트 경로(`/`로 시작, `//` 제외)만 허용.

## 웹 접근성
- PASS: 입력마다 label for/id, 도움말·오류를 aria-describedby로 연결(라벨 안에 도움말을 넣어 이름이 길어지던 문제 수정), aria-invalid, 서버 오류 role=alert, 상태 안내 role=status, Enter 제출, 동의 fieldset/legend, 320px.
- REVIEW: 스크린리더 실제 낭독.

## 남은 위험
- 점검으로 사용자 로컬 DB(3307)에 테스트 계정 `ui-signup-mwoz4xly@example.test` 1개가 생겼고, `nobody@example.test`는 잠시 로그인 잠금 상태다. 지우려면 사용자가 판단해 정리한다.
- `views/auth/SignupView.vue`는 라우터가 쓰지 않는 예전 시연 파일로 남아 있다.
