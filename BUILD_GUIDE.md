# 빌드·실행 안내

Node >=22.12.0, npm >=10, JDK 17을 준비한다. 아래는 실제 [npm scripts](frontend/package.json), [Gradle](backend/build.gradle), [CI](.gitlab-ci.yml) 기준이다. 자세한 환경은 [도구 준비](docs/development/environments.md)와 [로컬 실행](docs/handbook/source/01-로컬-실행-가이드.md)을 따른다.

프런트엔드 폴더에서 실행한다.

```powershell
cd frontend
npm ci
npm run dev
# 웹 빌드 또는 Pages 빌드가 필요한 경우.
npm run build:web
npm run build:pages
```

백엔드 폴더의 검증·패키징 명령이다.

```powershell
cd backend
.\gradlew.bat test bootJar --console=plain
```

격리 MySQL·Redis 개발 실행은 프로젝트 루트에서 `docker compose -f infra/chat/compose.yml up -d --wait`, 별도 backend 터미널에서 `.\gradlew.bat bootRun --args="--spring.profiles.active=chat-local"`을 사용한다. 기존 DB나 운영 환경에 이 예시를 그대로 적용하지 않는다.

에이전트 스크립트는 Python 표준 라이브러리만 사용하며 [TEST_GUIDE.md](TEST_GUIDE.md)의 명령으로 검증한다. 도구 설치·의존성 다운로드 실패와 코드 실패를 구분하고 실행하지 않은 결과를 성공으로 기록하지 않는다.
