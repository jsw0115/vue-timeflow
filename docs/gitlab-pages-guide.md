# GitLab Deploy → Pages 배포 가이드

2026-10-04. 이 프로젝트의 기본 배포는 **GitLab Pages 웹 배포**입니다. GitLab 원격 이름은 `gitlab`, 주소는 `https://gitlab.com/githubgroup4094208/vue-timeflow.git`입니다. `origin`은 GitHub이므로 유지합니다. 현재 로컬 브랜치는 master이며 GitLab 실제 기본 브랜치는 설정에서 확인합니다.

API 서버가 아직 없으므로 지금은 웹 화면·브라우저 로컬 저장 기능을 먼저 배포합니다. 실제 회원가입·로그인·서버 채팅·사용자 간 실시간 상태는 별도 HTTPS API 서버를 등록한 뒤 사용할 수 있습니다. Pages는 정적 파일 호스팅이며 Java·MySQL·Redis를 실행하지 않습니다. [GitLab 공식 설명](https://docs.gitlab.com/user/project/pages/)을 참고하세요.

## 1. 생성·수정한 파일

| 파일 | 용도 |
|---|---|
| [CI](../.gitlab-ci.yml) | Node 22 설치·테스트·Pages 빌드 후 기본 브랜치의 pages 작업에서 public 배포 |
| [Pages 빌드](../frontend/scripts/build-pages.mjs)·[설정 검사](../frontend/scripts/pages-settings.mjs) | 해시 라우팅·상대 자산 경로·HTTPS API 검사 |
| [Pages 환경 예시](../frontend/.env.pages.example) | 선택적 API 주소·배포 경로·API 필수 여부 |
| [API 주소 처리](../frontend/src/features/auth/apiEndpoint.mjs) | 로그인·토큰 갱신·채팅·SSE를 동일한 외부 API 주소로 연결 |
| [라우터](../frontend/src/router/index.js) | Pages 모드만 해시 라우팅 사용; 기존 웹 모드 유지 |
| [배포 테스트](../frontend/tests/pages-deployment.test.mjs) | API 주소·HTTPS·미설정·경로·인증 정보 검사 |
| [선택적 Linux CI](../.gitlab/ci/linux.yml) | ENABLE_CONTAINER_BUILD=true일 때만 Java·컨테이너 빌드 실행 |

기존 CI에 남아 있던 잘못된 구분선과 timeflow:lts 이미지 설정을 제거했습니다. 기본 Pages 작업은 Java·Docker 이미지 빌드 없이 실행됩니다. npm ci에 필요한 frontend/package-lock.json도 저장소에 포함되어야 합니다.

## 2. GitLab 프로젝트 설정

1. GitLab에서 프로젝트를 엽니다.
2. **Settings → General**의 기본 브랜치를 확인합니다. master를 사용 중이면 master, 이미 main을 사용 중이면 main을 대상으로 병합합니다. CI는 CI_DEFAULT_BRANCH를 사용하므로 이름을 강제로 변경할 필요가 없습니다.
3. **Settings → CI/CD → Runners**에서 Linux 컨테이너 작업을 실행할 Runner가 사용 가능한지 확인합니다. GitLab.com 호스팅 Runner도 사용할 수 있습니다.
4. **Settings → General → Visibility, project features, permissions**에서 Pages 기능을 사용할 수 있는지 확인합니다. 메뉴 이름은 GitLab 버전에 따라 다를 수 있습니다.
5. 지금은 API 서버가 없으므로 CI 변수는 추가하지 않아도 됩니다. ENABLE_CONTAINER_BUILD는 설정하지 않거나 false로 둡니다.

## 3. 파일 커밋 및 GitLab 업로드

PowerShell에서 실행합니다. 사용자 로컬 설정과 비밀 파일은 커밋하지 않습니다.

```powershell
cd E:\vscode-proj\vue-timeflow-proj
git remote -v
git status --short
git fetch gitlab
git switch -c chore/gitlab-pages
git add .gitlab-ci.yml .gitlab/ci/linux.yml .gitignore frontend/package.json frontend/package-lock.json frontend/.env.example frontend/.env.pages.example frontend/scripts/build-pages.mjs frontend/scripts/pages-settings.mjs frontend/src/features/auth/apiEndpoint.mjs frontend/src/features/auth/session.js frontend/src/router/index.js frontend/tests/pages-deployment.test.mjs docs/gitlab-pages-guide.md docs/deployment/gitlab-cicd.md README.md
git diff --cached --stat
git status --short
git commit -m "chore: GitLab Pages 배포 구성 및 API 연결 준비 (Codex)"
git push -u gitlab chore/gitlab-pages
```

GitLab에서 chore/gitlab-pages → 실제 기본 브랜치로 Merge Request를 만듭니다. build_pages가 성공하면 병합합니다. 이미 해당 브랜치를 만들었다면 새로 만들지 않고 git switch chore/gitlab-pages를 사용합니다.

HTTPS Git 인증은 계정 및 write_repository 권한의 Personal Access Token을 사용하거나 등록한 SSH 키를 사용합니다. 토큰을 remote URL에 넣지 않습니다. 기존 GitHub origin을 GitLab으로 바꾸거나 force push하지 않습니다. `.claude/settings.local.json`, `.env`, DB 백업은 위 커밋 대상이 아닙니다.

## 4. 파이프라인 확인

기본 브랜치에 병합하면 **Build → Pipelines**에서 다음 두 작업이 실행됩니다.

1. **build_pages**: npm ci → Pages용 빌드 → 전체 웹 테스트 → API 문서 정적 대조. 빌드 HTML을 읽는 테스트가 있어 빌드를 먼저 수행합니다. 결과는 frontend/dist에 저장합니다.
2. **pages**: 성공한 dist를 public으로 복사하고 pages.publish: public으로 게시합니다.

기능 브랜치와 Merge Request는 build_pages까지만 실행하며 Pages 사이트를 덮어쓰지 않습니다. 공개 배포는 실제 기본 브랜치만 수행합니다. 현재 nested pages.publish 문법은 GitLab.com에 맞췄습니다. 자체 GitLab은 17.9 이상인지 확인합니다. [publish 설정](https://docs.gitlab.com/user/project/pages/introduction/)을 참고하세요.

CI 파일은 **Build → Pipeline editor → Validate**에서 검증합니다. 로컬 테스트는 실제 GitLab CI Lint·Runner·Pages 게시 성공을 대신하지 않습니다.

## 5. Deploy → Pages에서 열기

1. pages 작업이 성공한 뒤 **Deploy → Pages**로 이동합니다.
2. Deployments에 활성 배포가 있는지 확인합니다.
3. **Access pages**에 표시된 실제 URL을 엽니다. 첫 배포 직후에는 공개될 때까지 잠시 걸릴 수 있습니다.
4. 화면 이동 후 새로고침하고 복사한 주소를 새 탭에서도 열어봅니다.

GitLab 기본 unique domain은 `https://vue-timeflow-<고유값>.gitlab.io/` 같은 주소일 수 있습니다. unique domain을 끄면 프로젝트 경로를 포함한 `https://githubgroup4094208.gitlab.io/vue-timeflow/` 형태일 수 있습니다. 실제 주소는 Pages 화면의 값을 기준으로 합니다. 주소를 추정해 확정하지 않습니다.

기본 빌드는 상대 자산 경로 `./`와 해시 라우팅을 사용하므로 두 경우 모두 처리합니다. 화면 주소는 `.../#/planner`처럼 표시됩니다. 해시 뒤의 경로는 서버로 전송되지 않아 새로고침에 별도 서버 rewrite가 필요하지 않습니다. [Vue Router 설명](https://router.vuejs.org/guide/essentials/history-mode)을 참고하세요.

PAGES_BASE_PATH는 보통 설정하지 않습니다. 절대 경로가 필요한 경우 `/` 또는 `/vue-timeflow/`처럼 앞뒤 슬래시를 포함해 지정하고 파이프라인을 다시 실행합니다. 도메인·경로 변경 시 브라우저 로컬 저장은 출처별로 분리되므로 기존 로컬 데이터가 다른 주소에 자동 이전되지는 않습니다.

## 6. 현재 API 미설정 상태

API 주소 없이도 웹 배포는 성공합니다. 서버 요청이 필요한 기능은 연결 준비 안내를 표시하며 Pages 도메인의 /api에 잘못 요청하지 않습니다. 실제 계정·채팅 DB가 생성되는 것은 아닙니다. UI에서 로컬 저장 기능·시연 데이터가 보이더라도 서버 저장 완료로 해석하지 않습니다.

## 7. 나중에 API 서버 연결

별도 서버에 Spring Boot·DB·Redis를 배포하고 유효한 HTTPS 주소를 확보합니다. [Linux 서버 구성](deployment/gitlab-cicd.md)은 선택적으로 사용할 수 있습니다. Pages 자체에는 DB/JWT 비밀값을 등록하지 않습니다.

GitLab **Settings → CI/CD → Variables**에 다음 값을 추가합니다.

| 키 | 예시·설명 |
|---|---|
| VITE_API_BASE_URL | https://api.example.com/api. 실제 공개 API 주소로 변경. origin만 넣어도 /api를 붙임 |
| PAGES_REQUIRE_API | true. 이후 API 주소가 없으면 빌드를 실패시키려는 경우 |
| PAGES_BASE_PATH | 보통 생략. 기본 ./ |
| ENABLE_CONTAINER_BUILD | 기본 false. 별도 Linux 이미지까지 만들 때만 true |

VITE_API_BASE_URL은 공개 주소이며 브라우저 번들에 포함됩니다. DB 비밀번호·JWT_SECRET·토큰·SSH 키를 VITE_ 변수에 넣지 않습니다. Pages는 HTTPS이므로 HTTP API는 빌드에서 거절합니다. 변수는 빌드 시 적용되므로 변경한 뒤 **Build → Pipelines → New pipeline**에서 기본 브랜치를 다시 실행해야 합니다.

Protected 변수를 사용한다면 기본 브랜치도 Protected branch인지 확인합니다. API 서버의 CORS 환경변수는 실제 Pages 출처와 일치시킵니다.

```dotenv
APP_CORS_ALLOWED_ORIGINS=https://vue-timeflow-<고유값>.gitlab.io
```

프로젝트 경로와 해시는 출처에 포함하지 않습니다. 예를 들어 `https://githubgroup4094208.gitlab.io/vue-timeflow/`의 출처는 `https://githubgroup4094208.gitlab.io`입니다. CORS 값 변경 후 API 서버도 재시작합니다. unique domain을 재생성하거나 커스텀 도메인으로 바꾸면 CORS도 갱신합니다.

API는 JSON Content-Type 및 Authorization 헤더의 OPTIONS preflight를 허용해야 합니다. 로그인·토큰 갱신·채팅·SSE가 새 API 주소를 공유합니다. 백엔드 health·인증·DB 반영을 별도로 점검한 뒤 실제 서버 기능을 확인합니다.

## 8. 로컬 Pages 빌드 점검

Node 22.12 이상에서 실행합니다. 지금처럼 API 없이 빌드하려면 별도 환경 파일이 필요 없습니다.

```powershell
cd frontend
npm ci
npm run build:pages
node --test --test-concurrency=1 tests/*.test.mjs
npm run preview -- --host 127.0.0.1
```

터미널에 표시된 preview 주소로 열고 `/#/planner`처럼 해시 경로로 이동·새로고침합니다. API 주소를 로컬에서 테스트하려면 `.env.pages.example`을 `.env.production.local`로 복사하고 실제 HTTPS 주소를 입력한 뒤 다시 빌드합니다. 이 파일은 Git에서 제외됩니다.

## 9. 문제 해결

| 현상 | 확인 |
|---|---|
| YAML 오류 | 충돌 구분선·중복 Pages 작업이 없는지, Pipeline editor Validate |
| npm ci 실패 | 잠금 파일 커밋 여부·package.json과의 일치 |
| Runner pending | 사용 가능한 Runner·일시 중지·CI 실행 한도 |
| pages 작업 없음 | 실제 기본 브랜치에 병합했는지 |
| Deploy → Pages에 사이트 없음 | pages 작업 성공 및 public/index.html 존재 |
| 화면 404·흰 화면 | Pages 화면의 실제 URL·브라우저 Network 자산 404·PAGES_BASE_PATH |
| 로그인·채팅 연결 준비 안내 | API 미설정 상태. HTTPS API 서버를 준비한 뒤 변수 추가·재빌드 |
| CORS 오류 | API 허용 출처가 실제 Pages 출처인지, API 재시작·preflight |
| 변수 바꿔도 이전 주소 사용 | 새 기본 브랜치 파이프라인을 실행했는지 |
| 비공개 사이트 접근 불가 | Pages Access Control 설정·GitLab 로그인 권한 |

## 10. 이번 검증 결과

- Node 22 Linux 컨테이너에서 npm ci 성공, API 미설정 Pages 빌드 성공.
- 프런트 테스트 43개 통과. 신규 Pages/API 설정 검사 8개를 포함합니다.
- CI YAML 두 파일 파싱 및 Pages artifact 의존성·Linux 선택 조건 검사 통과.
- 정적 서버의 / 및 /vue-timeflow/에서 HTML·실제 JS/CSS 자산 모두 200 응답 확인.
- 현재 API 문서 117개 소스 대조 및 변경 공백 검사 통과.
- 자동화 도구에 연결된 브라우저가 없어 실제 화면 이동·새로고침 검증은 수행하지 못했습니다. 게시 후 5번 절차를 확인하세요.

실제 GitLab 푸시·CI Lint·Runner 실행·Pages 게시·외부 API 연결은 아직 수행하지 않았습니다. 가이드에 따라 GitLab 기본 브랜치에 병합한 뒤 Pages에서 확인합니다. 로컬 결과는 ignored backend/build/pages-verification/results.json에 기록했습니다.
