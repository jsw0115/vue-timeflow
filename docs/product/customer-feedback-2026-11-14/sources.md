# 참고 자료와 조사 범위

작성일·확인일 2026-11-14. 공식 문서 확인은 제공자 지원 범위를 검토하기 위한 것이며 실제 계정 연결·승인·비용·실기기 동작을 검증한 결과가 아니다.

## 현재 저장소 근거

| 근거 | 확인 내용 |
| --- | --- |
| [프로젝트 README](../../../README.md) | 다수 화면의 로컬 시연 저장과 AI·음성·캘린더·결제 제공자 미연결을 명시함 |
| [API 안내](../../api/README.md) | 소스와 생성 계약이 기준이며 화면 연결 여부는 별도임 |
| [외부 연동 경계](../../api/frontend-backend-2026-10-10/integrations.md) | 실제 제공자 호출 전에 구현해야 할 인증·권한·입력·503 경계 |
| [IntegrationController](../../../backend/src/main/java/kr/timebar/diary/integration/IntegrationController.java) | capabilities의 available=false, 빈 동기화 상태, 미연결 실행 경계 |
| [RecordsController](../../../backend/src/main/java/kr/timebar/diary/records/RecordsController.java) | 기존 집중 세션 조회·생성·변경·삭제 경로 |
| [FeatureType](../../../backend/src/main/java/kr/timebar/diary/feature/FeatureType.java) · [FeatureInput](../../../backend/src/main/java/kr/timebar/diary/feature/FeatureInput.java) | 허용 필드·모드·duration 범위·시각 검증. 새로운 필드를 임의 전송할 수 없음 |
| [FeatureStore](../../../backend/src/main/java/kr/timebar/diary/feature/FeatureStore.java) | 소유자와 version을 사용한 저장·충돌 처리 |
| [SettingsService](../../../backend/src/main/java/kr/timebar/diary/operations/SettingsService.java) | 허용 설정 섹션과 기존 export 포함 범위 |
| [플래너 화면](../../../frontend/src/views/planner/PlannerDailyView.vue) · [집중 화면](../../../frontend/src/views/focus/FocusView.vue) | 컴포넌트 내부 타이머·고정 자유 모드·세션 저장 연결 필요 |
| [데이터 설정](../../../frontend/src/views/settings/SettingsDataView.vue) · [동기화 화면](../../../frontend/src/views/sync/SyncStatusView.vue) | 실행 핸들러 없는 데이터 메뉴와 로컬 동기화 시연 |
| [AI 리포트](../../../frontend/src/views/insight/AiInsightView.vue) · [구독 화면](../../../frontend/src/views/settings/SettingsBillingView.vue) | 고정 분석 문구와 시연 구독 값 |
| [기존 AI 성장 설계](../ai-growth-2026-10-31/README.md) | 동의·출처·승인 실행·이용권 제안을 중복 설계하지 않기 위한 참고 |
| [디자인 계약](../../../DESIGN.md) · [보류 중 선호](../../../.omd/preferences.md) | 실제 기록 3탭·미완료 벌점화 금지·접근성 원칙. 아래 계약 불일치 참고 |

## 공식 제공자 문서

<a id="s01"></a>
### S01. Google Calendar 증분 동기화

[Google Calendar — Synchronize resources efficiently](https://developers.google.com/workspace/calendar/api/guides/sync).

초기 전체 조회 후 syncToken으로 변경을 조회하며, 페이지 처리와 삭제를 포함한다. 토큰 무효화의 410에 대한 복구가 필요하다. CF-016에서 토큰 재설정과 로컬 미전송 변경 보존을 함께 설계한다.

<a id="s02"></a>
### S02. Microsoft Graph 일정 변경 조회

[Microsoft Graph — Get incremental changes to events in a calendar view](https://learn.microsoft.com/en-us/graph/delta-query-events).

calendarView delta는 캘린더와 날짜 범위에 연결된다. nextLink·deltaLink를 그대로 이어 사용한다. CF-016에서 Google과 동일한 cursor 형식이나 요청 조건을 강제하지 않는다.

<a id="s03"></a>
### S03. iOS 위젯 갱신 제약

[Apple WidgetKit — Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date).

위젯 갱신에는 동적인 시스템 예산이 있다. CF-023은 주기적인 서버 호출로 매초 갱신하는 방식을 전제로 하지 않는다. 시간 표시와 데이터 재조회는 구분해 설계한다.

<a id="s04"></a>
### S04. Health Connect 읽기와 권한

[Android Developers — Read raw data](https://developer.android.com/health-and-fitness/health-connect/read-data).

백그라운드 읽기에는 별도 권한이 필요하며, 누적 자료는 여러 출처의 중복을 고려해야 한다. CF-028의 최소 권한·데이터 종류별 읽기·중복 처리 설계 근거다. Samsung Health가 공유하는 실제 항목은 별도 검증 대상이다.

<a id="s05"></a>
### S05. HealthKit 동의

[Apple HealthKit — Authorizing access to health data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data).

건강 데이터의 종류와 읽기·쓰기 접근에 맞춘 사용자 권한이 필요하다. CF-028은 읽기 권한과 서버 업로드·AI 이용 동의를 분리한다. 앱이 모든 읽기 거부 상태를 완벽하게 판별할 수 있다고 가정하지 않는다.

<a id="s06"></a>
### S06. Capacitor의 네이티브 확장

[Capacitor — Plugins](https://capacitorjs.com/docs/plugins).

웹 앱과 네이티브 기능은 플러그인 경계로 연결한다. 이는 원하는 위젯·워치·공유 확장이 이미 프로젝트에 구현됐다는 뜻이 아니다. 현재 프로젝트의 Capacitor 버전과 대상 OS에 맞는 API·플러그인 호환성 검증이 선행되어야 한다.

<a id="s07"></a>
### S07. SmartThings 권한과 연결

[SmartThings — Authorization and Permissions](https://developer.smartthings.com/docs/getting-started/authorization-and-permissions).

리소스 접근에 OAuth 권한 범위를 적용한다. CF-030~CF-034에서 선택한 기기의 읽기·제어 권한과 철회를 검토한다. 서비스 연동 등록·운영 플랜·비용·호출 한도는 출시 시점의 실제 계정 조건으로 다시 확인한다.

<a id="s08"></a>
### S08. Home Assistant 기기 동작과 상태

[Home Assistant — REST API](https://contributors.home-assistant.io/core/internals/rest-api/).

상태 값을 변경하는 요청은 실제 장치 제어와 다르며 장치 동작에는 해당 action 호출이 필요하다. CF-030의 성공 판정은 UI 상태 변경만으로 완료하지 않는다. 서버와 가정 내 허브 간 네트워크 연결 방식도 별도 검증한다.

## 아직 조사·확정하지 않은 사항

- Apple 캘린더의 기기 접근과 iCloud 서버 동기화 경로, 네이버 캘린더의 제공 범위.
- Notion·Todoist·Microsoft To Do의 지원 필드·권한·이벤트·호출량·앱 등록 조건.
- Slack·Teams의 선택 메시지 액션과 조직 관리자 정책, Gmail·Outlook의 선택 메일 연동 방식.
- GitHub·GitLab·Jira의 저장소·프로젝트 범위와 webhook 권한.
- 네이버지도·카카오맵·Google Maps의 지역·교통수단·경로 API·재사용·비용 조건.
- Zapier·Make·IFTTT의 공식 서비스 등록과 배포 조건. 일반 웹훅 지원은 공식 앱 등록과 다르다.
- Philips Hue 직접 연결과 허브 경유 방식, NFC·물리 버튼·센서·전자잉크의 구체 모델·펌웨어·전원·네트워크.
- STT·OCR·AI·결제의 제공자 선택, 처리 지역·보관·원가·사용량 정책.

이 항목들은 불가능하다는 판정이 아니라 조사 전인 범위다. 지원을 확인하지 못한 기능은 대체 흐름과 함께 제안하며 실제 제공 약속에 포함하지 않는다.

## 디자인 계약 불일치

DESIGN.md 전체와 .omd/preferences.md를 읽었다. DESIGN.md에는 Timebar Diary 규칙 뒤에 다른 프로젝트 ezConference의 색·타이포그래피 규칙이 함께 존재한다. 선호 로그는 확인 범위에서 ambient/inferred이며 명시적인 사용자 수정으로 취급하지 않았다.

로컬 Get-FileHash로 manifest의 네 아티팩트를 비교한 결과 graph·coverage·provenance는 일치했고 design_md는 불일치했다. adoption-receipt의 adopted 표시만으로 현재 전체 파일 묶음을 정확히 유효한 채택 계약이라고 확정하지 않는다. 이번 작업은 시각 변경을 수행하지 않으며 구체 색·폰트·모션 선택은 제안하지 않는다. 실제 UI 구현 전 계약·projection 정합성을 지정된 디자인 워크플로로 확인한다.

## 조사 한계

소스의 존재와 공식 문서 설명을 확인했으나 브라우저 사용자 흐름·실제 계정 연결·기기·결제·복원 실험을 이번 작업에서 수행하지 않았다. 이전 검토의 HTTP 200 결과를 기능 동작 성공으로 확대하지 않는다.
