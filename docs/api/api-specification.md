# 현재 API 명세 — 구현 상태 기준

2026-09-25. 이 문서는 기존 /api의 실제 소스 계약이며 목표 /api/v1과 다르다.
전체 메서드·경로는 [자동 생성 목록](current-api-inventory.md), 신규 범위는 [API 목록서](api-catalog.md)를 참고한다.

## 공통

응답 ApiResponse<T>: {success:boolean,data:T,message:string|null}. 오류도 같은 3필드이며 목표 설계의 error/meta는 아직 없다.
JWT: Authorization: Bearer <access-token>. 공개 경로는 /api/auth/signup, /api/auth/login, /api/auth/refresh. logout은 인증 필요.
POST 생성은 201, 대부분 DELETE는 200+data:null, 단 /api/planner/items/{id} DELETE는 204.
실제 DB 기동·영속화·권한 회귀 테스트 성공 여부는 별도 검증해야 한다.

## 인증

| API | 요청 JSON | data |
|---|---|---|
| POST /api/auth/signup | email,nickname,password,agreeTerms=true,agreePrivacy=true | email,nickname,role |
| POST /api/auth/login | email,password | userId,email,nickname,role,accessToken,refreshToken |
| POST /api/auth/refresh | refreshToken | accessToken,refreshToken |
| POST /api/auth/logout | refreshToken 선택 | null |
| GET /api/auth/me | 없음 | userId,email,nickname,role |

비밀번호 재설정·온보딩·OAuth 화면이 있어도 대응 실 API가 구현되었다는 뜻이 아니다.

## 일정

GET /api/events: from,to(YYYY-MM-DD),keyword,category 모두 선택. 응답 배열; 페이지네이션 없음.
EventRequest: title 필수, date 필수, category,startTime,endTime,location,visibility,note.
EventResponse: id(Long),title,category,date,startTime,endTime,location,visibility,note,seriesId(Long),recurring.
POST /recurring: title,startDate,until,freq 필수 + category,startTime,endTime,location,visibility,note.
PUT/DELETE /{eventId}/following은 해당 날짜 이후 시리즈 수정/종료. 신규 목표 RRULE/UTC 계약과 혼동 금지.

~~~json
{
  "title": "설계 검토",
  "category": "업무",
  "date": "2026-09-25",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "visibility": "PRIVATE",
  "note": "API 목록 검토"
}
~~~

## 할 일

GET /api/tasks는 현재 쿼리 필터가 없는 사용자 전체 목록이다.
TaskRequest: title 필수; note,priority,energyLevel,durationMin,due,categoryId,categoryName,categoryColor,categoryIcon.
TaskResponse: id(String),title,note,status,priority,energyLevel,durationMin,due,categoryId,categoryName,categoryColor,categoryIcon.
PATCH /{taskId}/status는 body 없는 토글이다. 멱등하지 않으므로 네트워크 재시도 시 결과가 뒤집힐 수 있다.
POST /{taskId}/duplicate는 복제한다.

## 루틴

RoutineRequest: name,atTime(HH:mm) 필수; days(CSV mon,tue,...),icon,categoryId,categoryName,categoryColor,categoryIcon,onoff,notifyEnabled,notifyMinutesBefore.
POST /quick는 name,atTime만 받아 기본 요일을 사용한다.
GET /{routineId}/history?days=30 → routineId,entries[{date,status}],doneCount,totalDays,completionRate.
PATCH /{routineId}/history/{date}/toggle는 status 선택. 없으면 done→missed→skip 순환.
DELETE /{routineId}/history/{date}는 날짜 기록 삭제.

## 플래너

GET daily?date, weekly?start, monthly?year&month, yearly?year → {events:[],tasks:[],routines:[]}.
GET upcoming?days=7 → EventResponse[].
별도 /api/planner/items는 date,type,category,status 필터가 있지만 **PlannerService 공용 ConcurrentHashMap 시연 데이터**다. 데이터가 재시작 시 초기화되고 사용자 구분도 없어 프로덕션 통합 필터 API로 사용할 수 없다.

## Stub 계약

contract 패키지의 home/stat/focus/diary/memos/settings/share/admin/reports/user/profile 엔드포인트는
{endpoint:"...",status:"CONTRACT_READY"}를 data로 반환한다. 저장 성공이나 실제 인증·권한 처리 완료로 취급하지 않는다.
일반 API 클라이언트가 이를 실제 사용자 데이터로 캐시하지 않도록 구현 단계에서 명확한 기능 플래그 또는 501 정책을 적용한다.
