# 개발 도구·필수 서버·환경 설정과 서버 설치

작성일 2026-10-31. 수정일 2026-10-31. 로컬 기동 명령의 기준은 [로컬 실행 가이드](../handbook/source/01-로컬-실행-가이드.md)입니다. 이 문서는 설치 전 준비와 환경별 설정을 담당합니다.

## 목차

- [환경과 필수 구성](#환경과-필수-구성)
- [Windows 개발 도구 설치](#windows-개발-도구-설치)
- [Linux 개발·운영 호스트 설치](#linux-개발운영-호스트-설치)
- [설정 파일과 환경변수](#설정-파일과-환경변수)
- [설치 후 확인과 인수인계](#설치-후-확인과-인수인계)

## 환경과 필수 구성

| 목적 | 필수 | 선택·추가 |
| --- | --- | --- |
| 웹 화면만 개발 | Git, Node >=22.12, npm >=10 | 에디터·브라우저 개발 도구 |
| 웹·인증·기록 API | 위 도구, JDK 17, 프로젝트 Gradle Wrapper, MySQL | DB 관리 클라이언트 |
| 실제 채팅 | API와 MySQL, Redis | Docker 격리 환경 권장 |
| Linux 컨테이너 실행 | Git·OpenSSH·OpenSSL·curl·Docker Engine·Compose plugin | HTTPS는 도메인·80/443·Caddy overlay |
| Linux에서 직접 빌드 | 위 도구와 JDK 17·Node·npm | CI 산출물 실행만 하면 호스트 빌드 도구 불필요 |
| Android / iOS / 데스크톱 | Capacitor·Android Studio / macOS·Xcode / Electron | SDK·서명·스토어 계정과 실기기 검수 |
| 향후 AI | 서버 작업자·모델 제공자·허용 자료·작업/원장 | Python·객체 저장소. GPU·자체 모델은 조건부 |

검증했던 개발 런타임은 Node 24.22.1·npm 10.8.2·JDK 17.0.12입니다. 이는 당시 실행 증거이며 최신 패치·보안 지원을 영구 보장하지 않습니다. PC 기본 Node 20.18.0은 프로젝트 요구에 미달했으며 기존 검증에서 전역 PATH를 교체하지 않았습니다.

## Windows 개발 도구 설치

1. Git을 준비하고 [GitHub 저장소](https://github.com/jsw0115/vue-timeflow)를 작업 폴더로 clone합니다. 조직 정책에 맞는 HTTPS·SSH 인증을 사용하고 URL에 토큰을 넣지 않습니다.
2. [Node 공식 다운로드](https://nodejs.org/en/download)에서 프로젝트 요구를 만족하는 지원 버전을 설치합니다. 다른 프로젝트가 쓰는 Node가 있으면 버전 관리 도구나 세션별 PATH를 사용하고 확인한 실행 파일 경로를 기록합니다.
3. [Adoptium 설치 안내](https://adoptium.net/installation/) 등 검증된 배포판의 **JDK 17**을 설치합니다. JAVA_HOME과 PATH가 JRE나 다른 Java를 가리키지 않는지 확인합니다. 최신 JDK를 설치하는 것과 이 프로젝트 toolchain 충족은 다릅니다.
4. [Docker Desktop Windows 안내](https://docs.docker.com/desktop/setup/install/windows-install/)의 OS·가상화·WSL 조건을 확인하고 설치합니다. Linux containers 엔진을 시작하고 초기 준비를 마칩니다. 설치·WSL 설정에서 요구하는 관리자 권한·재시작은 해당 화면을 따릅니다.
5. 새 PowerShell에서 아래 도구를 확인한 뒤 로컬 실행 가이드의 격리 DB·API·웹 순서로 진행합니다.

```powershell
git --version
Get-Command node, npm, java, docker
node --version
npm --version
java -version
docker version
docker compose version
```

Docker named pipe 접근 거부는 엔진 미준비·계정 권한을 먼저 확인합니다. 다른 프로젝트의 컨테이너나 현재 사용 중인 DB를 종료하지 않습니다. 이미 있는 backend/.env를 예시 파일로 덮어쓰지 않습니다.

## Linux 개발·운영 호스트 설치

개발·검증과 운영은 서로 다른 호스트 또는 명확하게 격리한 네트워크·계정·볼륨·비밀값을 사용합니다. 같은 Compose project와 .env로 두 환경을 동시에 기동하지 않습니다. 저장소의 기본 운영 구성은 단일 호스트 설치이며 고가용성·자동 장애 조치 구성이 아닙니다.

다음은 Docker가 아직 없는 **새 Ubuntu 호스트**의 준비 예시입니다. 지원 배포판·충돌 패키지·설치 방식은 [Docker 공식 Ubuntu 안내](https://docs.docker.com/engine/install/ubuntu/)를 2026-10-31에 확인했습니다. 이미 다른 Docker 작업이 있는 서버는 기존 설치·볼륨을 먼저 확인하고 일괄 삭제·제거하지 않습니다.

```bash
sudo apt update
sudo apt install -y ca-certificates curl git openssh-client openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo docker run --rm hello-world
docker compose version
```

위 호스트 설치 명령은 이 Windows 작업 환경에서 실행하지 않았습니다. 운영에서는 검증한 패키지 버전을 기록하고 업그레이드를 별도 검수합니다. 배포 계정의 Docker 실행 권한은 운영 정책에 맞게 부여합니다. Docker 그룹은 호스트 관리 권한에 준하므로 범위를 제한합니다.

호스트 준비 후 [Linux 배포 가이드](../deployment/gitlab-cicd.md)의 저장소 준비 → Registry 읽기 인증 → .env → 첫 배포 → HTTPS 순서를 따릅니다. 개발·검증 서버는 운영 자료를 복사하지 않은 별도 환경으로 먼저 설치합니다. 호스트 최소 CPU·RAM·디스크는 실측하지 않았으므로 가용성·부하·백업량으로 산정하고 임의 사양을 보장하지 않습니다. Compose의 API 1GiB 제한·Redis 256MB는 전체 호스트 권장 사양과 다릅니다.

## 설정 파일과 환경변수

| 위치 | 목적 | 적용 시점 |
| --- | --- | --- |
| backend/.env | 기본 API의 DB·JWT·Redis 등 | API 시작. 선택 로딩, 기존 값 덮어쓰기 금지 |
| application.yml | 기본값·스키마 검사·업로드·UTC | Spring 설정 |
| application-chat-local.yml | 격리 DB·Redis·개발 키 | chat-local 선택 시 |
| frontend/.env.local | 개발 프록시·API 주소 | Vite 재시작 |
| frontend/.env.pages.example | Pages 설정 예시 | 실제 환경·CI에 맞춰 빌드 |
| infra/deploy/.env | 이미지 SHA·운영 비밀·도메인 | Compose 보간·서버 배포 |

| 변수 | 역할·필수 조건 | 비밀 여부 |
| --- | --- | --- |
| DB_URL·DB_DRIVER·DB_SCHEMA | JDBC 주소·MySQL 드라이버·실제 DB명 일치 | 주소에 자격정보 포함 금지 |
| DB_USERNAME·DB_PASSWORD | API용 DB 계정·비밀번호 | 비밀번호 비밀 |
| JWT_SECRET | UTF-8 32바이트 이상 무작위 키, 환경별 분리 | 비밀 |
| JWT_ISSUER·JWT_*_TTL_SECONDS | 발급자·만료 정책 | 설정값 |
| CHAT_ENABLED | 채팅 활성화와 chat migration | true면 DB·Redis 필요 |
| REDIS_HOST·REDIS_PORT·REDIS_PASSWORD | Redis 접속 | 비밀번호 비밀 |
| APP_CORS_ALLOWED_ORIGINS | 실제 웹·앱 허용 출처 | 운영 와일드카드 대신 실제 범위 |
| CHAT_DEV_DB_PASSWORD | 격리 Compose·API 양쪽 같은 값 | 개발 전용 |
| SERVER_PORT | API 포트 | Vite target도 함께 확인 |
| DEV_API_TARGET | Vite 서버의 upstream API | 브라우저 공개 API 주소와 다름 |
| VITE_API_BASE_URL | 브라우저·설치형 앱의 API origin | 공개 값. 키·비밀번호 금지 |
| REGISTRY_IMAGE·IMAGE_TAG | 이미지 경로·성공한 전체 SHA | 인증값과 분리 |
| MYSQL_PASSWORD·MYSQL_ROOT_PASSWORD | 운영 앱·관리 DB 계정 | 서로 다른 비밀값 |
| APP_DOMAIN·APP_ORIGIN·WEB_PORT | HTTPS 도메인·웹 출처·loopback 포트 | 실제 환경값 |
| AI_PROVIDER·AI_API_KEY·AI_MODEL | 향후 제공자 설정 자리 | 키 비밀. 값 입력만으로 현재 503 기능이 연결되지 않음 |

OS 환경변수·실행 인자와 프로필이 예시 파일보다 우선할 수 있습니다. 격리 개발은 새 터미널에서 시작하고 다른 프로젝트의 DB/JWT 환경이 섞이지 않게 확인합니다. 설정 값을 그대로 문서·로그에 출력하지 않습니다.

## 설치 후 확인과 인수인계

웹은 5173, API는 8080, 격리 MySQL은 13316, 격리 Redis는 16389입니다. 운영 DB·Redis·API 포트를 공인망에 열지 않습니다. 도메인·TLS·프록시·SSE·파일 한도와 내부 API health를 각각 확인합니다.

설치 기록에는 환경명·설치일·담당 역할·OS/도구 버전·전체 SHA·DB 이력·접근 경로·검증 결과·백업 위치만 남깁니다. 비밀번호·토큰·사용자 원문은 별도 비밀 저장소에서 관리합니다. 실제 운영 설치 결과는 [배포 계획](../deployment/release-plan.md)에 기록하고 로컬 성공으로 대신하지 않습니다.
