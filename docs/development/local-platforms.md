# PC·모바일 로컬 실행 가이드

2026-09-25. 이번에 추가한 기능은 실제 Vue 화면을 서로 다른 viewport에서 비교하는 개발 전용 페이지다.
API 목록과 목표 구현은 [API 목록서](../api/api-catalog.md), 화면 구조는 [플랫폼 화면 설계](../product/platform-preview-design.md)를 참고한다.

## 1. 준비

프로젝트 frontend/package.json은 Node >=22.12, npm>=10을 요구한다. node --version / npm --version 확인 후 해당 버전 또는 그 이상을 사용한다.
잠금파일이 있으므로 최초 설치는 npm ci. 기존 node_modules가 있으면 실행부터 가능하지만 엔진 버전 차이를 확인한다.

~~~powershell
cd E:\vscode-proj\vue-timeflow-proj\frontend
node --version
npm --version
npm ci
npm run dev:devices
~~~

개발 서버는 하나만 실행한다. 5173이 사용 중이면 기존 터미널에서 Ctrl+C로 종료하고 선택한 명령 하나를 실행한다. strictPort를 유지하므로 다른 포트로 몰래 전환하지 않는다.

| 명령 | 주소 | 용도 |
|---|---|---|
| npm run dev:devices | http://127.0.0.1:5173/__preview | PC + 모바일 나란히 |
| npm run dev:mobile | http://127.0.0.1:5173/__preview?view=mobile | 모바일 프레임만 |
| npm run dev:web | http://127.0.0.1:5173/ | 실제 앱 PC 브라우저 |
| npm run dev | http://127.0.0.1:5173/ | 브라우저 자동 열기 없이 서버 |
| npm run demo:mock | http://127.0.0.1:5173/mock-demo/ | API·DB 없는 독립 시연 |

서버가 이미 실행 중이면 위 주소를 직접 연다. 웹과 모바일을 보기 위해 서버를 두 번 실행할 필요가 없다.
앱 화면은 기존 샘플/메모리/브라우저 저장소를 사용하며 현재 모든 화면이 실 API에 연결된 것은 아니다.

## 2. 미리보기 조작

화면 선택: 홈·캘린더·일/주/월 플래너·일정·할 일·루틴·다이어리·메모·통계·설정·로그인·독립 목업.
모바일 폭: 320/360/390/430/768px. 기본390×844, PC1440×900.
실제 CSS media query가 iframe 내부 너비를 기준으로 동작한다. 화면을 축소한 이미지를 보여주는 방식이 아니다.
좁은 모니터에서는 PC 프레임 안에서 가로 스크롤한다. 이는 고정1440 비교 viewport이며 앱 자체 overflow와 구분한다.

예:
~~~text
http://127.0.0.1:5173/__preview?view=both&screen=%2Ftasks&width=390
~~~

두 iframe은 같은 origin이라 localStorage/세션을 공유한다. 저장 상태를 다시 읽으려면 '두 화면 새로고침'. 서로 다른 계정 테스트는 브라우저 프로필을 분리한다.
현재 store가 메모리만 쓰는 데이터는 두 프레임 사이 실시간 공유되지 않고 새로고침 시 초기화될 수 있다.

## 3. 같은 Wi-Fi의 실제 휴대폰 브라우저

~~~powershell
cd E:\vscode-proj\vue-timeflow-proj\frontend
npm run dev:lan
~~~

Vite의 Network 주소(예: http://192.168.0.20:5173)를 휴대폰에서 연다. 휴대폰의 localhost는 PC가 아니다.
주소가 안 보이면 Windows ipconfig로 현재 Wi-Fi IPv4를 확인한다. VPN/게스트 Wi-Fi 격리 여부도 확인한다.
방화벽 허용이 필요하면 개인 네트워크의 Node/5173만 허용한다. 자동 방화벽 변경·포트포워딩은 하지 않는다.
LAN 모드는 소스 파일이 접근 가능하므로 신뢰하는 사설망에서만 사용한다. 개발 종료 시 Ctrl+C.
일반 HTTP LAN에서는 보안 컨텍스트가 필요한 마이크·푸시 등은 동작이 제한될 수 있다.

## 4. 백엔드 연결 방식

PC/모바일 브라우저의 API는 상대경로 /api/...를 사용한다.
Vite가 해당 요청을 기본 http://127.0.0.1:8080으로 전달하므로 휴대폰에 백엔드 포트를 직접 노출할 필요가 없다.
선택적으로 .env.local에 DEV_API_TARGET=http://127.0.0.1:8081을 넣고 Vite를 다시 시작한다.
DEV_API_TARGET은 Vite 서버 설정이며 클라이언트의 API 주소가 아니다. DB 비밀번호/JWT secret을 VITE_ 변수에 넣지 않는다.

실 서버 테스트가 필요한 경우 별도 터미널에서:
~~~powershell
cd E:\vscode-proj\vue-timeflow-proj\backend
$env:JWT_SECRET = '<로컬 전용으로 생성한 충분히 긴 무작위 비밀키>'
.\gradlew.bat bootRun
~~~
MariaDB 연결 값은 백엔드의 실제 설정을 확인한다. 이 가이드는 DB 생성/삭제나 Flyway repair를 실행하지 않는다.
프록시 검증은 mock HTTP upstream으로 수행했으며 DB 기동 성공을 의미하지 않는다.

## 5. Android / iOS 앱

화면 너비 비교는 WebView/키보드/권한/푸시 테스트를 대체하지 않는다.
기존 Capacitor 설정(webDir=dist)을 유지했다. Windows에서 Android Studio, macOS에서 Xcode가 필요하다.

~~~powershell
# frontend에서 Android
npm run mobile:sync
npm run android:open
~~~

Android Studio에서 emulator 또는 USB 디바이스를 선택하고 Run. Vue 수정 후에는 다시 mobile:sync를 수행한다.
iOS는 Mac에서:
~~~sh
npm ci
npm run mobile:sync
npm run ios:open
~~~
Xcode에서 simulator/서명된 실기기를 선택한다. Windows에서 iOS simulator를 실행할 수는 없다.

패키징된 앱에는 Vite 프록시가 없다. 실제 API 연동 단계에서 HTTPS API origin을 앱 환경별로 설정하고 Spring CORS를 정확한 origin으로 제한한다.
Android emulator의 호스트 PC 주소는 보통 10.0.2.2이나 기본 HTTP 허용을 운영 앱에 켜지 않는다.
이번 작업에서는 native project·ATS·cleartext·server.url을 수정하지 않았다. iOS/Android의 네이티브 빌드·실기기 동작은 별도 검증 대상이다.

## 6. Electron 데스크톱

~~~powershell
# frontend에서, 다른 Vite 실행은 먼저 종료
npm run desktop:dev
~~~
기존 명령이 Vite와 Electron을 함께 실행한다. Electron 설치 및 호환 Node 런타임이 필요하다.
이번 PC 미리보기 검증은 브라우저 반응형 화면 기준이며 패키징된 Electron 설치파일 검증은 아니다.
현재 Vue router는 WebHistory이므로 file:// 배포 시 deep link 처리는 별도 점검해야 한다.

## 7. 검증 재실행

~~~powershell
cd E:\vscode-proj\vue-timeflow-proj\frontend
npm run docs:api
node scripts/api-inventory.mjs --check
npm run build:web
npm run check:preview
~~~

증상별 확인: 5173 충돌→기존 서버 종료, 화면 안 바뀜→새로고침/URL 확인, API502→backend와 DEV_API_TARGET 확인,
API401→실 access token 확인, 흰화면→F12 Console/Network, LAN 접속실패→동일망/방화벽/Network 주소 확인.

공식 근거: [Vite CLI](https://vite.dev/guide/cli), [Vite server options](https://vite.dev/config/server-options),
[Capacitor workflow](https://capacitorjs.com/docs/basics/workflow).
