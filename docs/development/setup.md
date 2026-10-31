# 로컬 개발 시작 안내

상세 절차는 [한국어 로컬 실행 가이드 원문](../handbook/source/01-로컬-실행-가이드.md) 또는 [Word 문서](../handbook/01-로컬-실행-가이드.docx)를 확인하세요. Node.js 22.12 이상, npm 10 이상과 JDK 17을 사용합니다. 기본 데이터베이스는 MySQL입니다.

## 화면만 실행하기

프로젝트 루트에서 PowerShell로 실행합니다.

```powershell
cd frontend
npm ci
npm run dev
```

http://127.0.0.1:5173/을 엽니다. 로그인과 실제 채팅은 API가 필요하며 다수 화면은 브라우저 로컬 시연 데이터를 사용합니다.

## 격리 MySQL과 Redis 및 API 실행하기

Docker Desktop의 Linux 엔진을 시작하고 프로젝트 루트에서 실행합니다.

```powershell
docker compose -f infra/chat/compose.yml up -d --wait
cd backend
.\gradlew.bat bootRun --args="--spring.profiles.active=chat-local"
```

위 웹은 별도 터미널에서 실행합니다. API 상태는 http://127.0.0.1:8080/actuator/health로 확인하고 웹의 /auth/signup에서 테스트 계정을 만듭니다. 이 프로필은 timeflow_chat_dev 전용이며 기존 업무 DB에 적용하지 않습니다. 종료 시 서버는 Ctrl+C, DB는 프로젝트 루트에서 docker compose -f infra/chat/compose.yml stop으로 멈춥니다. -v를 붙이지 않습니다.

기존 MySQL을 연결하려면 상세 가이드의 backend/.env, 스키마 준비, JWT와 Flyway 주의사항을 따르세요. DB 덤프와 .env 및 서명 키는 Git에 올리지 않습니다.

