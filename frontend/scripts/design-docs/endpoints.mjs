import { helpers } from './model.mjs'
const {str,num,bool,en,date,timezone,id} = helpers
export const groups = [
  ['01-auth-users','인증·사용자·기기'],['02-planner-events-tasks','플래너·일정·할 일'],
  ['03-routines-time','루틴·타임바·집중'],['04-diary-memos-tags','다이어리·메모·태그·멘션'],
  ['05-work-career','WBS·근무·휴가·이직'],['06-community-challenges','커뮤니티·챌린지'],
  ['07-chat-sharing','채팅·친구·그룹·공유'],['08-home-statistics','홈·통계·알림'],
  ['09-settings-integrations-admin','설정·연동·동기화·관리자'],
]
export const params = {
  from:date('조회 시작 지역 날짜 포함; to와 함께 지정, 범위 최대 93일'),to:{...date('조회 종료 지역 날짜 미포함'),example:'2026-09-27'},
  timezone:timezone(),date:date('지역 날짜; 생략하면 사용자 기준 오늘'),
  types:str('쉼표 구분 ENUM, 중복 불가; 기본 EVENT,TASK,ROUTINE','EVENT,TASK',{pattern:'^(EVENT|TASK|ROUTINE)(,(EVENT|TASK|ROUTINE))*$'}),
  searchTypes:str('쉼표 구분: EVENT,TASK,ROUTINE,DIARY,MEMO,POST,WBS,WORK_RECORD','TASK,MEMO'),
  resourceTypes:str('통합함 원본 종류. PLANNER,DDAY,EVENT,TASK,ROUTINE,CHALLENGE,POST,DIARY,COMMUNITY,MEMO,CHAT,WBS,WORK_RECORD. 생략하면 접근 가능한 전체 종류; 플래너 화면 필터는 PLANNER,EVENT,TASK,ROUTINE으로 확장한다.','DDAY,DIARY',{pattern:'^(PLANNER|DDAY|EVENT|TASK|ROUTINE|CHALLENGE|POST|DIARY|COMMUNITY|MEMO|CHAT|WBS|WORK_RECORD)(,(PLANNER|DDAY|EVENT|TASK|ROUTINE|CHALLENGE|POST|DIARY|COMMUNITY|MEMO|CHAT|WBS|WORK_RECORD))*$'}),
  statuses:str('쉼표 구분: PENDING,IN_PROGRESS,DONE,SKIPPED,CANCELED','PENDING,DONE'),
  categoryIds:str('쉼표 구분 소유/공유 가능한 카테고리 ID 최대20개','01J00000000000000000000001'),categoryId:id('본인에게 접근 가능한 카테고리'),
  q:str('앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자','검토',{minLength:1,maxLength:100}),
  cursor:str('사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략','opaque-cursor',{maxLength:2048}),limit:{...num('페이지 크기',30,1,100),default:30},
  includeUndated:{...bool('기한 없는 할 일 포함',false),default:false},scope:{...en('조회 범위',['OWN','SHARED','ALL']),default:'OWN'},
  dueFrom:date('기한 시작 포함'),dueTo:{...date('기한 종료 미포함'),example:'2026-09-27'},status:en('할 일 상태',['TODO','DOING','DONE','CANCELED']),
  memoStatus:en('메모 상태',['INBOX','ARCHIVED']),active:bool('활성 루틴만 true'),unread:bool('읽지 않은 항목만 true',true),
  occurrenceDate:date('시리즈에서 조회할 지역 발생일'),type:en('타임바 구분',['PLAN','ACTUAL']),groupBy:{...en('통계 그룹',['DAY','WEEK','MONTH','CATEGORY']),default:'DAY'},
  categoryScope:en('분류 범위',['ALL','EVENT','TASK','ROUTINE','TIME']),friendStatus:en('친구 관계',['PENDING','ACCEPTED','REJECTED']),
  trashType:en('휴지통 종류',['EVENT','TASK','ROUTINE','DIARY','MEMO']),period:en('기간',['DAY','WEEK','MONTH'],'WEEK'),groupId:id('가입한 그룹 ID'),
  role:en('계정 역할',['USER','ADMIN']),userStatus:en('계정 상태',['ACTIVE','SUSPENDED','DELETED']),actorId:id('감사로그 실행자 ID'),
  mode:en('하루 모드',['J','P','B'],'B'),breakpoint:en('레이아웃 크기',['MOBILE','DESKTOP']),parentId:id('부모 WBS ID'),
  workType:en('업무 기록 종류',['ANNUAL_LEAVE','HALF_DAY','OFFSITE','BUSINESS_TRIP','JOB_CHANGE','OTHER']),
  communityId:id('승인된 참여 커뮤니티 ID'),joined:bool('내 참여 항목만',true),category:en('커뮤니티 분류',['EXERCISE','STUDY','DAILY','LIFE']),
  joinStatus:en('멤버 상태',['PENDING','MEMBER','OWNER']),tag:str('앞의 # 없는 태그','업무',{maxLength:40}),
  occurrenceScope:en('반복 일정 처리 범위',['SINGLE','FUTURE']),
}
const aliases={searchTypes:'types',memoStatus:'status',categoryScope:'scope',friendStatus:'status',trashType:'type',userStatus:'status',workType:'type',joinStatus:'status',occurrenceScope:'scope'}
export function queryParameters(text='') { return text.split(',').filter(Boolean).map(token=>{
  const required=token.endsWith('!'), key=token.replace(/!$/,'')
  if(!params[key]) throw Error('Unknown parameter '+key)
  return {name:aliases[key]??key,in:'query',required,description:params[key].description,schema:params[key],example:params[key].example}
}) }
export const endpoints=[]
function batch(group,text) { for(const line of text.trim().split('\n')) {
  const [id,method,path,summary,request,response,query='',flags='']=line.split('|')
  endpoints.push({id,group,method,path,summary,request:request==='-'?null:request,response:response==='-'?null:response,parameters:queryParameters(query),flags:flags.split(',')})
} }
batch(0,`
AUTH-01|POST|/auth/signup|이메일 회원가입|SignupWrite|SignupResult||public
AUTH-02|POST|/auth/login|브라우저 로그인|LoginWrite|Session||public,cookieSet
AUTH-03|POST|/auth/refresh|브라우저 토큰 회전|-|Session||cookie,csrf
AUTH-04|POST|/auth/logout|브라우저 현재 세션 폐기|-|-||cookie,csrf
AUTH-05|POST|/auth/password-reset-requests|재설정 이메일 요청|ResetRequest|Accepted||public,accepted
AUTH-06|POST|/auth/password-resets|비밀번호 재설정|ResetWrite|-||public
AUTH-07|GET|/me|내 프로필 조회|-|User
AUTH-08|PATCH|/me|내 프로필 수정|ProfileWrite|User
AUTH-09|PUT|/me/onboarding|최초 모드·시간대 설정|Onboarding|Settings
SESSION-01|GET|/me/sessions|내 기기 세션 조회|-|@DeviceSession|cursor,limit
SESSION-02|DELETE|/me/sessions/{id}|기기 세션 폐기|-|-
DEVICE-01|PUT|/me/devices/{deviceId}|알림 수신 기기 등록|DeviceWrite|DeviceResult
DEVICE-02|DELETE|/me/devices/{deviceId}|기기 등록 해제|-|-
OAUTH-01|POST|/auth/oauth/{provider}/exchange|브라우저 OAuth 코드 교환|OAuthWrite|Session||public,cookieSet
OAUTH-02|POST|/auth/oauth/authorizations|OAuth 인증 시도 생성|OAuthStart|OAuthStartResult||public
NATIVE-01|POST|/auth/native/login|네이티브 로그인|LoginWrite|NativeSession||public
NATIVE-02|POST|/auth/native/refresh|네이티브 토큰 회전|RefreshWrite|NativeSession||public
NATIVE-03|POST|/auth/native/logout|네이티브 세션 폐기|RefreshWrite|-
NATIVE-04|POST|/auth/native/oauth/{provider}/exchange|네이티브 OAuth 코드 교환|OAuthWrite|NativeSession||public
`)
batch(1,`
PLAN-01|GET|/planner/items|일정 탭 통합 필터 조회|-|@PlannerItem|from!,to!,types,statuses,categoryIds,q,timezone,includeUndated,scope,cursor,limit
PLAN-02|GET|/planner/summary|필터 적용 전체 기간 집계|-|[]DaySummary|from!,to!,types,statuses,categoryIds,q,timezone,includeUndated,scope
EVENT-01|GET|/events/{id}|일정 상세|-|Event|occurrenceDate
EVENT-02|POST|/events|일정 생성|EventWrite|Event
EVENT-03|PATCH|/events/{id}|일정 부분 수정|EventPatch|Event||version
EVENT-04|DELETE|/events/{id}|일정 휴지통 이동|-|-||version
EVENT-05|GET|/events|일정 목록|-|@Event|from!,to!,categoryId,q,timezone,cursor,limit
REPEAT-01|POST|/events/series|반복 일정 생성|EventSeriesWrite|Event
REPEAT-02|PATCH|/events/{id}/occurrences/{occurrenceKey}|반복 회차 수정|OccurrencePatch|Event||version
REPEAT-03|DELETE|/events/{id}/occurrences/{occurrenceKey}|반복 회차 취소|-|-|occurrenceScope!|version
TASK-01|GET|/tasks|할 일 목록|-|@Task|dueFrom,dueTo,status,categoryId,cursor,limit
TASK-02|GET|/tasks/{id}|할 일 상세|-|Task
TASK-03|POST|/tasks|할 일 작성|TaskWrite|Task
TASK-04|PATCH|/tasks/{id}|할 일 부분 수정|TaskPatch|Task||version
TASK-05|PUT|/tasks/{id}/status|할 일 목표 상태 지정|TaskStatusWrite|Task||version
TASK-06|DELETE|/tasks/{id}|할 일 삭제|-|-||version
TASK-07|POST|/tasks/{id}/duplicates|할 일 복제|DuplicateWrite|Task
TASK-08|GET|/tasks/{id}/rollovers|자동 이월 이력|-|@Rollover|cursor,limit
POLICY-01|GET|/me/task-rollover-policy|자동 이월 정책 조회|-|RolloverPolicy
POLICY-02|PUT|/me/task-rollover-policy|자동 이월 정책 저장|RolloverPolicy|RolloverPolicy
DDAY-01|GET|/ddays|D-Day 목록|-|@Dday|cursor,limit
DDAY-02|POST|/ddays|D-Day 생성|DdayWrite|Dday
DDAY-03|PATCH|/ddays/{id}|D-Day 수정|DdayPatch|Dday||version
DDAY-04|DELETE|/ddays/{id}|D-Day 삭제|-|-||version
`)
batch(2,`
ROUTINE-01|GET|/routines|루틴 목록|-|@Routine|active,date,cursor,limit
ROUTINE-02|POST|/routines|루틴 만들기|RoutineWrite|Routine
ROUTINE-03|GET|/routines/{id}|루틴 상세|-|Routine
ROUTINE-04|PATCH|/routines/{id}|루틴 수정|RoutinePatch|Routine||version
ROUTINE-05|DELETE|/routines/{id}|루틴 삭제|-|-||version
ROUTINE-06|PUT|/routines/{id}/logs/{date}|날짜별 목표 달성 상태|RoutineLogWrite|RoutineLog||upsert
ROUTINE-07|GET|/routines/{id}/history|루틴 달성 이력|-|RoutineHistory|from!,to!
TIME-01|GET|/time-entries|계획·실제 시간 블록|-|@TimeEntry|from!,to!,type,timezone,cursor,limit
TIME-02|POST|/time-entries|시간 블록 생성|TimeWrite|TimeEntry
TIME-03|PATCH|/time-entries/{id}|시간 블록 수정|TimePatch|TimeEntry||version
TIME-04|DELETE|/time-entries/{id}|시간 블록 삭제|-|-||version
FOCUS-01|POST|/focus-sessions|집중 시작|FocusWrite|FocusSession
FOCUS-02|PUT|/focus-sessions/{id}/completion|집중 종료 및 타임바 연결|FocusComplete|FocusSession||version
`)
batch(3,`
DIARY-01|GET|/diaries|일간 회고 캘린더·목록|-|@Diary|from!,to!,cursor,limit
DIARY-02|GET|/diaries/{date}|일간 회고 상세|-|Diary
DIARY-03|PUT|/diaries/{date}|일간 회고 저장|DiaryWrite|Diary||upsert
DIARY-04|DELETE|/diaries/{date}|일간 회고 삭제|-|-||version
MEMO-01|GET|/memos|메모 인박스|-|@Memo|memoStatus,q,cursor,limit
MEMO-02|POST|/memos|메모 작성|MemoWrite|Memo
MEMO-03|GET|/memos/{id}|메모 상세|-|Memo
MEMO-04|PATCH|/memos/{id}|메모 수정|MemoPatch|Memo||version
MEMO-05|DELETE|/memos/{id}|메모 삭제|-|-||version
TAG-01|GET|/tags|내 태그 및 사용 횟수|-|@Tag|q,cursor,limit
TAG-02|GET|/tags/{tag}/posts|태그에 해당하는 권한 내 글|-|@SearchHit|resourceTypes,q,cursor,limit
MENTION-01|GET|/mentions|나를 언급한 글 알림|-|@Mention|resourceTypes,q,unread,cursor,limit
MENTION-02|PUT|/mentions/{id}/read|멘션 읽음 지정|ReadWrite|Mention
MENTION-03|GET|/mention-candidates|주소록 기반 멘션 후보|-|@ContactCandidate|q!,cursor,limit
AI-01|POST|/memos/{id}/task-suggestions|메모에서 할 일 후보 생성|SuggestionWrite|Job||accepted
AI-02|POST|/diaries/{date}/suggestions|회고 초안 작업|SuggestionWrite|Job||accepted
AI-03|GET|/ai-jobs/{id}|AI·STT 작업 결과|-|Suggestion
STT-01|POST|/memos/{id}/transcriptions|음성 메모 텍스트 변환|TranscriptionWrite|Job||accepted
`)
batch(4,`
WBS-01|GET|/work/wbs|WBS 계층 조회|-|@Wbs|parentId,cursor,limit
WBS-02|POST|/work/wbs|WBS 작업 추가|WbsWrite|Wbs
WBS-03|GET|/work/wbs/{id}|WBS 상세|-|Wbs
WBS-04|PATCH|/work/wbs/{id}|WBS 기간·담당·공수 수정|WbsPatch|Wbs||version
WBS-05|DELETE|/work/wbs/{id}|말단 WBS 작업 삭제|-|-||version
WORK-01|GET|/work/records|근무·휴가·커리어 목록|-|@WorkRecord|from!,to!,workType,cursor,limit
WORK-02|POST|/work/records|연차·반차·외근·출장·이직 작성|WorkWrite|WorkRecord
WORK-03|GET|/work/records/{id}|업무 기록 상세|-|WorkRecord
WORK-04|PATCH|/work/records/{id}|업무 기록 수정|WorkPatch|WorkRecord||version
WORK-05|DELETE|/work/records/{id}|업무 기록 삭제|-|-||version
`)
batch(5,`
COMMUNITY-01|GET|/community/posts|커뮤니티 게시글 목록|-|@Post|communityId,cursor,limit
COMMUNITY-02|POST|/community/posts|공유 미리보기 확정 후 사본 게시|PostWrite|Post
COMMUNITY-03|DELETE|/community/posts/{id}|본인·운영자 게시글 삭제|-|-||version
COMMUNITY-04|GET|/communities|커뮤니티 검색·내 가입 목록|-|@Community|joined,category,q,cursor,limit
COMMUNITY-05|POST|/communities|커뮤니티 생성|CommunityWrite|Community
COMMUNITY-06|GET|/communities/{id}|커뮤니티 상세|-|Community
COMMUNITY-07|PATCH|/communities/{id}|방장 커뮤니티 설정 수정|CommunityPatch|Community||owner,version
COMMUNITY-08|DELETE|/communities/{id}|방장 커뮤니티 삭제|-|-||owner,version
COMMUNITY-09|POST|/communities/{id}/join-requests|가입 또는 승인 신청|JoinWrite|Membership
COMMUNITY-10|PUT|/communities/{id}/join-requests/{userId}|가입 신청 승인·거절|JoinDecision|Membership||owner
COMMUNITY-11|DELETE|/communities/{id}/members/me|커뮤니티 탈퇴|-|-
COMMUNITY-12|GET|/communities/{id}/members|승인 멤버·신청자 조회|-|@Membership|joinStatus,cursor,limit
COMMUNITY-13|PATCH|/community/posts/{id}|내 게시글 수정|PostPatch|Post||version
COMMUNITY-14|GET|/community/posts/{id}|게시글 상세|-|Post
CHALLENGE-01|GET|/challenges|참여 가능한 챌린지|-|@Challenge|communityId,joined,cursor,limit
CHALLENGE-02|POST|/challenges|가입 커뮤니티에 챌린지 생성|ChallengeWrite|Challenge
CHALLENGE-03|GET|/challenges/{id}|챌린지 상세|-|Challenge
CHALLENGE-04|PATCH|/challenges/{id}|생성자 챌린지 수정|ChallengePatch|Challenge||owner,version
CHALLENGE-05|DELETE|/challenges/{id}|생성자 챌린지 취소|-|-||owner,version
CHALLENGE-06|PUT|/challenges/{id}/participants/me|챌린지 참여|-|Challenge
CHALLENGE-07|DELETE|/challenges/{id}/participants/me|챌린지 참여 취소|-|-
CHALLENGE-08|PUT|/challenges/{id}/check-ins/{date}|일일 인증|CheckInWrite|CheckIn
RANK-01|GET|/community/rankings|동의 기반 달성률 순위|-|@Ranking|period!,groupId,cursor,limit
STICKER-01|GET|/me/achievements|달성 스티커|-|@Achievement|period,cursor,limit
`)
batch(6,`
SHARE-01|GET|/friends|친구 목록|-|@Friend|friendStatus,cursor,limit
SHARE-02|POST|/friend-invitations|친구 초대|FriendInviteWrite|Friend
SHARE-03|PUT|/friend-invitations/{id}/response|받은 친구 초대 처리|FriendResponseWrite|Friend
SHARE-04|DELETE|/friends/{id}|친구 관계 해제|-|-
GROUP-01|GET|/calendar-groups|내 캘린더 그룹|-|@Group|cursor,limit
GROUP-02|POST|/calendar-groups|캘린더 그룹 생성|GroupWrite|Group
GROUP-03|PATCH|/calendar-groups/{id}|그룹 수정|GroupPatch|Group||owner,version
GROUP-04|DELETE|/calendar-groups/{id}|그룹 삭제|-|-||owner,version
GROUP-05|GET|/calendar-groups/{id}/members|그룹 멤버|-|@Member|cursor,limit
GROUP-06|POST|/calendar-groups/{id}/invitations|그룹 초대|GroupInviteWrite|GroupInvitation||owner
GROUP-07|PUT|/calendar-groups/{id}/members/{userId}|그룹 권한 변경|RoleWrite|Member||owner
GROUP-08|DELETE|/calendar-groups/{id}/members/{userId}|그룹 멤버 제거|-|-||owner
GROUP-09|PUT|/calendar-group-invitations/{id}/response|받은 그룹 초대 수락·거절|FriendResponseWrite|GroupInvitation
ACL-01|GET|/events/{id}/shares|일정 공유 정책|-|@Share|cursor,limit|owner
ACL-02|PUT|/events/{id}/shares/{userId}|일정 공유 권한 지정|ShareWrite|Share||owner
ACL-03|DELETE|/events/{id}/shares/{userId}|일정 공유 철회|-|-||owner
BLOCK-01|PUT|/me/blocks/{userId}|사용자 차단|-|Block
BLOCK-02|DELETE|/me/blocks/{userId}|차단 해제|-|-
CHAT-01|GET|/chat/rooms/{id}/messages|대화방 메시지 조회|-|@Message|cursor,limit
CHAT-02|POST|/chat/rooms/{id}/messages|메시지 전송|MessageWrite|Message
CHAT-03|GET|/chat/rooms|내 채팅방|-|@Room|cursor,limit
CHAT-04|POST|/chat/rooms|DM·그룹 채팅 생성|RoomWrite|Room
CHAT-05|PUT|/chat/rooms/{id}/read|읽음 위치 지정|ReadPosition|ReadState
CHAT-06|DELETE|/chat/rooms/{id}/members/me|대화방 나가기|-|-
`)
batch(7,`
HOME-01|GET|/home/summary|오늘 요약|-|DaySummary|date,timezone
HOME-02|GET|/notifications|알림 인박스|-|@Notification|unread,cursor,limit
HOME-03|PUT|/notifications/{id}/read|알림 읽음 지정|ReadWrite|Notification
HOME-04|POST|/notifications/read-all|지정 시각 이전 알림 읽음|ReadAllWrite|CountResult||action
STAT-01|GET|/statistics/overview|달성률 통합 통계|-|Statistics|from!,to!,timezone
STAT-02|GET|/statistics/plan-actual|계획·실제 시간 비교|-|[]TimeComparison|from!,to!,timezone,groupBy
`)
batch(8,`
SET-01|GET|/me/settings|환경설정 조회|-|Settings
SET-02|PATCH|/me/settings|환경설정 수정|SettingsPatch|Settings
SET-03|GET|/categories|시스템·내 분류|-|@Category|categoryScope,cursor,limit
SET-04|POST|/categories|사용자 분류 생성|CategoryWrite|Category
SET-05|PATCH|/categories/{id}|사용자 분류 수정|CategoryPatch|Category||version
SET-06|DELETE|/categories/{id}|분류 삭제·기존 스냅샷 유지|-|-||version
DASH-01|GET|/me/dashboard-layout|모드·기기별 홈 배치|-|Dashboard|mode!,breakpoint!
DASH-02|PUT|/me/dashboard-layout|홈 포틀릿 배치 저장|DashboardWrite|Dashboard||upsert
SYNC-01|GET|/sync/changes|변경·삭제 증분 조회|-|ChangePage|cursor,limit
SYNC-02|POST|/sync/mutations|오프라인 변경 배치|MutationBatch|MutationResults||action
SEARCH-01|GET|/search|권한 내 통합 검색|-|@SearchHit|q!,searchTypes,from,to,cursor,limit
TRASH-01|GET|/trash|휴지통 목록|-|@TrashItem|trashType,cursor,limit
TRASH-02|POST|/trash/{type}/{id}/restore|보관기간 내 복구|-|SearchHit||action
EXPORT-01|POST|/data-jobs|데이터 내보내기·가져오기 작업|DataJobWrite|Job||accepted
EXPORT-02|GET|/data-jobs/{id}|데이터 작업 상태|-|Job
FILE-01|POST|/uploads|제한된 업로드 URL 발급|UploadWrite|Upload
FILE-02|POST|/uploads/{id}/complete|업로드 검증·검사 접수|-|UploadStatus||accepted
FILE-03|GET|/files/{id}/download|소유·공유 권한 확인 후 다운로드 URL|-|Download
FILE-04|GET|/uploads/{id}|파일 검사 상태 조회|-|UploadStatus
CALSYNC-01|POST|/calendar-connections|외부 캘린더 연결|CalendarConnectionWrite|CalendarConnection
CALSYNC-02|POST|/calendar-connections/{id}/sync-jobs|외부 캘린더 동기화 접수|-|Job||accepted
CALSYNC-03|GET|/calendar-connections|외부 캘린더 연결 목록|-|@CalendarConnection|cursor,limit
CALSYNC-04|DELETE|/calendar-connections/{id}|토큰 폐기·캘린더 연결 해제|-|-
CALSYNC-05|GET|/calendar-sync-jobs/{id}|캘린더 동기화 작업 상태|-|Job
CALSYNC-06|POST|/calendar-connections/authorizations|캘린더 OAuth 시도 생성|CalendarAuthorization|OAuthStartResult||action
REPORT-01|POST|/reports/jobs|보고서 생성 작업|ReportWrite|Job||accepted
REPORT-02|GET|/reports/{id}|보고서 조회|-|Report
REPORT-03|GET|/report-jobs/{id}|보고서 작업 상태|-|Job
ADMIN-01|GET|/admin/users|관리자 사용자 조회|-|@User|q,userStatus,cursor,limit|admin
ADMIN-02|PATCH|/admin/users/{id}/status|관리자 계정 상태 변경|AdminStatusWrite|User||admin
ADMIN-03|GET|/admin/audit-logs|관리자 감사 로그 조회|-|@Audit|from!,to!,actorId,cursor,limit|admin
`)
export const domainRules = [
  '브라우저는 refresh를 HttpOnly/Secure/SameSite 쿠키로 전달합니다. refresh/logout에는 Origin 및 CSRF 검증이 필수입니다. 네이티브는 별도 경로와 OS 보안 저장소를 사용하며 public client의 client secret을 앱에 넣지 않습니다. 가입 비밀번호는 bcrypt의 72바이트 상한도 검증합니다. refresh 회전·재사용 탐지·비밀번호 변경 후 세션 폐기가 필요합니다. OAuth state/nonce/redirect URI/provider issuer를 서버에서 확인합니다.',
  '통합 일정 필터는 필드 간 AND, 같은 CSV 필드 내 OR입니다. EVENT는 기간 겹침, TASK는 due, ROUTINE은 날짜별 예정 회차로 조회합니다. PATCH는 누락 필드 유지, 허용된 null만 제거; 저장 전 기존 값과 합쳐 검증합니다. 종일/시간 일정 필드는 혼용하지 않습니다. 반복 RRULE은 무한 전개 금지, 지원 범위 밖 문법은 422. 시작·종료의 지역 시각이 DST 모호/누락 시 명시적인 UTC offset 확인을 요구합니다.',
  '루틴은 1~1440분, 요일 중복 불가입니다. 로그 생성 If-None-Match: *, 수정 If-Match를 구분합니다. ACTUAL 겹침은 409, PLAN 겹침은 허용합니다. 실제 블록은 최대24시간이며 날짜별 통계에서만 자정 경계를 분할합니다. 집중 완료 재전송으로 타임바가 중복 생성되지 않도록 focus_session_id UNIQUE를 둡니다.',
  '다이어리는 서버 목표 모델에서 사용자·날짜당 1개입니다. 현재 로컬 시연에서 같은 날 여러 글을 만들 수 있으므로 이관 때 합치기/선택 화면이 필요합니다. 태그 최대20개, 멘션 최대20명; 원본 조회 권한이 없는 멘션 수신자에게 본문을 노출하지 않습니다. AI/STT는 외부 전송 동의를 검사하고 초안만 반환하며 자동으로 할 일을 저장하지 않습니다.',
  'WBS parentId는 같은 사용자 내에서만 허용하고 순환·깊이20 초과를 422로 거절합니다. 상위 공수/진척은 서버 롤업이며 직접 수정은 409. 자식이 있는 작업 삭제는 HAS_CHILDREN 409로 막고 먼저 하위 작업을 정리합니다. 근무 기록은 공수 집계에서 제외합니다. 반차는 같은 지역 날짜·0.5일, 연차는 0.5일 단위, 외근/출장은 장소, 이직은 toCompany/jobRole 필수입니다. 유형 변경 시 무관한 상세값을 제거합니다. 승인 상태는 HR 결재 연동이 아닌 개인 기록입니다.',
  '생성자는 커뮤니티 OWNER입니다. 가입 대기자는 챌린지를 만들 수 없으며 가입 여부는 저장 트랜잭션에서 재확인합니다. 정원 초과 가입은 409. private 커뮤니티는 초대/가입 권한 없는 사용자에게 숨깁니다. 챌린지 시작일은 사용자 기준 오늘부터30일 이내, 기간3~100일. 일일 인증은 챌린지 시간대의 오늘만, (challenge,user,date) UNIQUE로 멱등 처리합니다. 진행 중인 챌린지 기간 변경은 409. 방장 탈퇴는 소유권 이전 전 OWNER_REQUIRED 409. 랭킹은 별도 공개 동의한 회원만 집계합니다.',
  '받은 초대는 수신자만 처리합니다. 그룹 초대 수락 전에는 멤버로 등록하지 않습니다. 그룹/공유 설정은 owner만 변경하며 마지막 owner 제거는 409입니다. CHAT recordRef는 전송 시와 열람 시 모두 접근 권한을 확인합니다. 차단된 사용자에게 새 DM/초대 금지, 그룹 메시지 노출 정책도 적용합니다. 메시지 목록은 최근 순 커서, UI는 역순 표시; 실시간 이벤트는 보조이고 REST 데이터가 기준입니다.',
  '알림은 멱등한 읽음 지정이며 토글이 아닙니다. read-all은 before 경계까지 한정합니다. 통계 분모가 0이면 rate=null이고 미래 날짜·SKIP은 분모에서 제외합니다. 같은 시간대·동일 기간 단위로 전일/전주를 비교합니다. 화면의 데모 값은 실제 집계 성공으로 간주하지 않습니다.',
  '기본 설정 변경이 과거 기록을 덮어쓰지 않도록 분류 스냅샷을 유지합니다. 동기화 batch는 TASK SET_STATUS부터 제한적으로 도입하며 개별 APPLIED/CONFLICT/REJECTED를 반환합니다. 변화 커서는 사용자별 revision, 보관기간30일 초과 시 410 후 전체 재동기화입니다. 파일은 목적/MIME/크기/실제 파일 매직/악성코드 검사 후 사용합니다. 관리자 API는 ADMIN 역할과 사유·행위자 감사 로그가 필요합니다. 외부 API 호출은 DB 트랜잭션 밖 outbox worker에서 처리합니다.',
]
