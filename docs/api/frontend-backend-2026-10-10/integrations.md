# 외부 제공자 연동 명세와 경계.

사용자는 제공자를 추후 결정하고 명세·경계 소스만 작성하도록 지정했다. 현재 `backend/src/main/java/kr/timebar/diary/integration/IntegrationController.java`에는 제공자 클라이언트·결제 승인·OAuth 교환·동기화 작업을 넣지 않았다. 인증과 기본 요청 키 검사 뒤 실행은 503을 반환한다. 상태 조회의 available=false 또는 빈 연결 목록은 성공 연동 상태가 아니다.

| 기능 | 현재 경계 API | 추후 어댑터 책임 | 완료 기준 |
|---|---|---|---|
| AI 분석 | POST `/api/insight/generate` with from/to/features | 사용자 허용 데이터만 전송, 서버 비밀키, 모델 호출, 구조화 결과 검증·저장, 사용량/오류 처리 | 소유자·동의·마스킹 및 실제 생성 결과 검증 |
| 음성 인식 | POST `/api/memos/stt` multipart file | MIME·길이 검증, 업로드 데이터 최소 보관, STT 호출, text 응답 | 실제 음성 입력의 text와 오류 검증 |
| 캘린더 동기화 | GET `/api/sync/status`, POST `/api/sync/{provider}/run` | OAuth 자격증명 암호화, 외부/내부 ID 매핑, sync token, 충돌·삭제 처리 | 중복 없는 반복 동기화와 충돌 해결 검증 |
| 결제 | POST `/api/billing/checkout` with planId/returnUrl, POST `/api/billing/cancel` with reason | 서버 요금제/가격 조회, 허용 return URL, checkout 세션·구독 상태, idempotency | 제공자 테스트 모드 승인·취소·중복 요청 검증 |
| 관리자 결제 | POST `/api/admin/billing/{id}/refund`, `/retry` | 현재 ADMIN 검사, 본인 서버 결제 레코드 확인, 환불/재시도 멱등 처리, 감사 | 실제 승인 거래만 환불되고 권한 없는 요청 거부 |
| 소셜 계정 | GET `/api/user/social-accounts`, POST `/api/user/social-accounts/{provider}/connect` | state/PKCE, allowlist callback, 계정 연결 확인, token 암호화 | 계정 가로채기·중복 연결 방지 및 실제 callback 검증 |
| 알림톡 | POST `/api/settings/notifications/kakao/verify` with phone/code/consent | 동의·검증 코드 TTL/횟수 제한, 제공자 승인 템플릿, 발송/콜백 | 소유 전화 인증과 실제 제공자 결과 검증 |
| 공동 집중 영상 | POST `/api/cofocus/rooms` with title/recordingConsent | 방 membership·토큰·만료, 명시 녹화 동의, 제공자 webhook | 권한 없는 방 접근/녹화 거부 |
| 2단계 인증 | GET capabilities에서 two-factor=false, security 저장의 twoFactor=true는 503 | TOTP/다른 제공자 결정, enrollment·확인·복구코드·challenge | 로그인·복구를 포함한 실제 인증 검증 |

`GET /api/integrations/capabilities`는 ai/stt/calendar-sync/billing/social-login/kakao-notification/two-factor/cofocus-video 각각 `{feature,available:false,status:"PROVIDER_REQUIRED"}`를 반환한다. 구체 경계 API 필드는 [상세 명세](specification.md)와 [OpenAPI](openapi.json)를 따른다. 제공자 미설정 실행의 예시는 다음과 같다.

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{"success":false,"data":null,"message":"결제 제공자 및 서버 어댑터 설정이 필요합니다."}
```

## 제공자가 결정된 뒤 적용할 공통 규약.

서버 환경설정으로만 비밀키를 주입하며 `/settings`나 브라우저 번들에 비밀값을 저장하지 않는다. 어댑터가 연결되지 않은 기능을 available=true로 표시하지 않는다. OAuth callback·결제 webhook은 제공자 결정 뒤 별도 API로 추가하고 state/signature/replay 검증을 구현한다. 현재 해당 callback/webhook 경로는 등록하지 않았다.

결제·동기화·발송에는 서버 작업 ID와 멱등 키를 도입하고 중복 호출 결과를 재사용한다. 제공자 SDK의 timeout/retry/오류를 400·403·409·502·503에 매핑하는 상세 계약은 선택된 제공자의 공식 문서에 맞춰 확정한다. 분석·음성·영상 데이터의 전달 동의와 보관/삭제 정책도 연결 전에 확정한다. 현재 외부 네트워크 호출은 수행하지 않는다.

프런트엔드 비밀번호 분실/메일 알림 시연에 대한 별도 메일 제공자 연결과 실제 reset token 발급 API도 추후 범위다. 현재 본인 로그인 상태의 `/user/password` 변경만 구현되어 있다. 자동화·알림·AI 설정 저장은 설정 JSON 경계이며 제공자 호출·예약 워커 실행 기능은 없다.
