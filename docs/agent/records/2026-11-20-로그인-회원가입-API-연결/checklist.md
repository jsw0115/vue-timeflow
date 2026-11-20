# 작업 체크리스트

- [x] 실제 소스·변경 상태 확인(포트·CORS·라우터 가입 화면·로컬 DB 마이그레이션 상태)
- [x] 구현 계획·영향 분석(plan.md)
- [x] 최소 변경 구현
  - [x] `frontend/.env.local`(git 제외)에 `DEV_API_TARGET=http://127.0.0.1:8081` — 로컬 실행 가이드의 방법
  - [x] 기본 CORS 허용 출처에 `http://127.0.0.1:5173` 추가(application.yml 기본값·backend/.env.example)
  - [x] 가입: 서버 정책과 같은 비밀번호 검사, 이용약관·개인정보 동의 분리, 칸별 오류(aria-invalid·aria-describedby), 서버 오류 role=alert, 가입 → 자동 로그인 → 온보딩
  - [x] 로그인: 기본 도착 홈, form 제출(Enter), label 연결, 오류 role=alert, 소셜 미연결 안내를 오류와 분리, 가입 직후 이메일 채움
  - [x] 온보딩: 가입 닉네임 표시, 하루 모드 radio로 저장, '나중에 고를게요'
  - [x] 인증 오류 문구: 네트워크 실패와 HTTP 상태(403·502 등)를 구분
  - [x] 약관 보기 링크가 해당 탭을 바로 연다(LegalViewer ?doc=)
- [x] 관련 SW 49·웹 28·OWASP 체크(verification.md)
- [x] UI라면 KWCAG 2.2 확인(라벨·오류 연결·키보드 제출·320px)
- [x] 테스트/실제 증빙 기록
- [x] 기존 사용자 변경 보존 확인(application.yml 포트 줄은 커밋하지 않고 작업 폴더에 남김). 2026-11-20 요청으로 CORS 줄·.env.example·.gitignore·화면·작업 기록을 따로 커밋
- [x] 중단·재개를 위한 마지막 결과와 다음 작업 기록
