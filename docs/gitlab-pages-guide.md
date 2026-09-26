# Git과 GitLab Pages 배포 가이드

## 1. 로컬 Git 저장소 만들기

프로젝트 루트에서 다음을 실행한다. 이 프로젝트는 아직 첫 커밋이 없으므로, GitLab 연결 전 소스와 비밀 파일을 꼭 확인한다.

```powershell
git status
git add .
git commit -m "feat: timebar diary initial UI and API contracts"
git branch -M main
```

## 2. GitLab 저장소 연결

1. [GitLab](https://gitlab.com)에서 **New project > Create blank project**를 선택한다.
2. 프로젝트 이름을 `timebar-diary`로 정하고, 처음에는 **Private**으로 만든다.
3. 빈 저장소의 HTTPS 또는 SSH 주소를 복사한다.
4. 아래처럼 원격 저장소를 등록하고 푸시한다.

```powershell
git remote add origin https://gitlab.com/<내-계정-또는-그룹>/timebar-diary.git
git push -u origin main
```

SSH를 쓸 경우 GitLab 계정에 SSH 공개키를 먼저 등록한 뒤 `git@gitlab.com:<namespace>/timebar-diary.git` 주소를 사용한다. 이미 `origin`이 있다면 `git remote set-url origin <주소>`로 바꾼다.

## 3. 무료 웹 배포: GitLab Pages

루트의 [`.gitlab-ci.yml`](../.gitlab-ci.yml)은 Vue 앱을 빌드해 GitLab Pages에 배포한다.

1. `main` 브랜치에 푸시한다.
2. GitLab 프로젝트의 **Build > Pipelines**에서 `pages` 작업이 성공했는지 확인한다.
3. **Deploy > Pages**에서 생성된 주소를 연다.

프로젝트 페이지는 보통 `https://<namespace>.gitlab.io/timebar-diary/` 같은 하위 경로로 제공된다. CI는 Vite의 `base`를 이 프로젝트 경로로 설정하므로, HTML 자산 경로가 깨지지 않는다.

## 4. 중요한 제한

GitLab Pages는 **정적 프런트엔드 호스팅**이다. Spring Boot API와 MariaDB는 Pages에서 실행할 수 없다. API는 별도의 서버/컨테이너 호스팅 서비스에 배포하고, 프런트 환경 변수 `VITE_API_BASE_URL`을 해당 HTTPS API 주소로 설정해야 한다. 토큰, DB 비밀번호, JWT 키는 Git에 커밋하지 말고 GitLab의 **Settings > CI/CD > Variables**에 등록한다.

## 5. 일반 작업 흐름

```powershell
git switch -c feature/daily-planner
# 작업 후
git add frontend backend docs
git commit -m "feat: daily planner"
git push -u origin feature/daily-planner
```

GitLab에서 Merge Request를 만들고 `main`에 병합하면 Pages가 다시 배포된다.

