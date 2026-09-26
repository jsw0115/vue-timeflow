# Timeflow 멀티플랫폼 적용 가이드

## 1. 적용 구조

하나의 `frontend/` Vue 3 애플리케이션을 공통 UI로 사용합니다. 웹은 Vite 정적 산출물을 배포하고, 모바일은 Capacitor WebView로, 데스크톱은 Electron 보안 창으로 같은 산출물을 감쌉니다. 비즈니스 데이터의 진실 공급원은 Spring Boot API와 MariaDB이며 `localStorage`는 UI 설정과 오프라인 임시 캐시만 맡습니다.

```text
Vue 3 + Vite ──> Web/PWA
       ├──────> Capacitor ──> Android / iOS
       └──────> Electron ───> Windows / macOS / Linux
                         │
                    Spring Boot API
                         │
                       MariaDB
```

## 2. 웹/PWA

`frontend`에서 `npm install` 뒤 `npm run build:web`을 실행합니다. 결과물 `dist/`를 HTTPS CDN 또는 정적 호스팅에 배포합니다. PWA는 다음 단계에서 Service Worker, 오프라인 화면, 웹 푸시 VAPID 키를 추가합니다. 로그인 토큰은 브라우저 저장소 대신 `HttpOnly`, `Secure`, `SameSite` 쿠키로 전환합니다.

## 3. Android / iOS

```powershell
cd frontend
npm install
npm run mobile:sync
npm run android:open
# iOS는 macOS/Xcode 환경에서만 가능
npm run ios:open
```

`npx cap add android` 및 `npx cap add ios`는 최초 한 번만 실행합니다. Android Studio/Xcode에서 서명 키, 앱 아이콘, 권한, 푸시 인증서를 설정해 스토어용 AAB/IPA를 생성합니다. 카메라·알림·파일은 반드시 Capacitor 공식 플러그인을 통해 권한 요청 후 사용합니다.

## 4. 데스크톱

```powershell
cd frontend
npm run desktop:dev
npm run desktop:build
```

`desktop:build`는 Windows NSIS 설치 파일, macOS DMG, Linux AppImage의 기반 구성을 만듭니다. Electron 41 계열은 Node.js 22.12 이상을 요구하므로, 현재 개발 PC의 Node 20.18은 Node 22 LTS 이상으로 먼저 올려야 합니다. 실제 배포 전 Windows Authenticode 및 Apple Developer ID 서명이 필수에 가깝고, 자동 업데이트 서버와 개인정보 처리방침을 준비합니다.

## 5. API 및 보안 체크리스트

- `VITE_API_BASE_URL` 및 MariaDB/JWT/AI/메일 값은 `.env` 또는 배포 Secret Manager로 주입하고 저장소에 커밋하지 않습니다.
- 프로덕션 API는 HTTPS, 짧은 access token, 회전 refresh token, 기기별 세션 폐기를 사용합니다.
- 모바일/데스크톱 앱의 API origin과 딥링크를 백엔드 CORS 허용 목록에 명시합니다.
- 오프라인 변경은 IndexedDB outbox에 저장한 뒤 네트워크 복구 시 idempotency key로 동기화합니다.

## 6. Gradle 백엔드

`backend/build.gradle`이 정식 빌드 정의입니다. 이 PC에는 Gradle이 설치되어 있지 않으므로, Gradle 8.14.3 이상을 한 번 설치한 뒤 `gradle wrapper --gradle-version 8.14.3 --distribution-type bin`을 실행합니다. 생성된 `gradlew`, `gradlew.bat`, `gradle/wrapper/`는 팀 전체가 같은 Gradle 버전을 사용하도록 하므로 반드시 커밋하고, 이후에는 `gradlew.bat test`로 실행합니다.
