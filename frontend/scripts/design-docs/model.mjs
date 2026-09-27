// Declarative target contracts. These describe unimplemented /api/v1 APIs, not live endpoints.
export const schemas = {}
const str = (description, example, extra = {}) => ({ type: 'string', description, example, ...extra })
const num = (description, example, minimum = 0, maximum = 1000000) => ({ type: 'integer', description, example, minimum, maximum })
const bool = (description, example = false) => ({ type: 'boolean', description, example })
const en = (description, values, example = values[0]) => str(description, example, { enum: values })
const ref = name => ({ $ref: '#/components/schemas/' + name })
const arr = (description, items, maxItems = 100, extra = {}) => ({ type: 'array', description, items, maxItems, ...extra })
const id = (description = '불투명 리소스 ID; 숫자로 변환하지 않음') => str(description, '01J00000000000000000000001', { minLength: 1, maxLength: 128 })
const date = description => str(description, '2026-09-26', { format: 'date' })
const instant = description => str(description, '2026-09-26T00:00:00Z', { format: 'date-time' })
const title = () => str('공백만 입력 불가; 앞뒤 공백 제거', '설계 검토', { minLength: 1, maxLength: 200 })
const body = () => str('일반 텍스트; HTML 실행 금지', '오늘의 기록 #업무', { maxLength: 50000 })
const timezone = () => str('유효한 IANA ZoneId; 사용자 설정 기본값', 'Asia/Seoul', { maxLength: 64 })
const time = () => str('사용자 지역 시각 HH:mm', '09:00', { pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' })
const nullable = field => ({ anyOf: [field, { type: 'null' }], description: (field.description ?? field.$ref?.split('/').at(-1) ?? '객체') + '; null 허용', example: null })
function S(name, properties, required = Object.keys(properties)) {
  schemas[name] = { type: 'object', additionalProperties: false, properties, required }
  return name
}
function patch(name, source) { schemas[name] = { ...schemas[source], required: [], minProperties: 1 }; return name }
function entity(name, source, extra = {}) {
  const properties = { id: id(), ...schemas[source].properties, ...extra, version: num('낙관적 잠금 버전; ETag와 동일', 1, 1), createdAt: instant('생성 UTC'), updatedAt: instant('수정 UTC') }
  // Responses expose optional write fields as well; examples include them unless overridden.
  S(name, properties, ['id', ...schemas[source].required, ...Object.keys(extra), 'version','createdAt','updatedAt'])
}
const rich = { tags: arr('중복 제거, 최대 20개, 앞의 # 제외', str('태그', '업무', { minLength: 1, maxLength: 40 }), 20, { uniqueItems: true }), mentionUserIds: arr('주소록의 비차단 사용자 ID; 서버에서 재검증', id(), 20, { uniqueItems: true }) }
const email = str('정규화된 이메일', 'demo@example.test', { format: 'email', maxLength: 255 })
const password = str('새 비밀번호 정책은 서버에서 검증; 비밀값 로깅 금지', 'Example-Password-2026!', { minLength: 12, maxLength: 72, writeOnly: true })
S('Consent', { type: en('동의 문서 종류',['TERMS','PRIVACY','MARKETING']), version: str('문서 버전','2026-09'), accepted: bool('필수 약관은 true',true) })
S('SignupWrite', { email, nickname: str('닉네임','김지수',{minLength:1,maxLength:80}), password, consents: arr('TERMS/PRIVACY 각각 1개 필수, 중복 종류 거부',ref('Consent'),3,{minItems:2}) })
schemas.SignupWrite.example={email:'demo@example.test',nickname:'김지수',password:'Example-Password-2026!',consents:[{type:'TERMS',version:'2026-09',accepted:true},{type:'PRIVACY',version:'2026-09',accepted:true}]}
S('LoginWrite', {email,password: str('가입한 비밀번호','Example-Password-2026!',{minLength:1,maxLength:72,writeOnly:true}),deviceId:id('설치별 임의 ID; 인증 수단이 아님')})
S('RefreshWrite', { refreshToken: str('OS 보안 저장소의 refresh credential','example-refresh-token',{minLength:1,writeOnly:true}) })
S('User', {id:id(),email,nickname:str('닉네임','김지수'),role:en('서버 지정 역할',['USER','ADMIN']),timezone:timezone(),onboarded:bool('온보딩 완료',true)})
S('SignupResult', {userId:id(),emailVerificationRequired:bool('이메일 검증 필요',true)})
S('Session', {accessToken:str('예시 전용; 실제 토큰이 아님','example-access-token'),expiresIn:num('access 유효 초',900,1),sessionId:id(),user:ref('User')})
S('NativeSession', {...schemas.Session.properties,refreshToken:str('OS 보안 저장소에 보관; 로그 금지','example-refresh-token')})
S('ResetRequest', {email})
S('Accepted', {accepted:bool('처리 접수; 이메일 존재 여부 의미 아님',true)})
S('ResetWrite', {token:str('단회 재설정 토큰','example-reset-token',{writeOnly:true}),newPassword:password})
S('ProfileWrite', {nickname:str('닉네임','김지수',{minLength:1,maxLength:80}),timezone:timezone()},[])
schemas.ProfileWrite.minProperties=1
S('Onboarding', {mode:en('하루 모드',['J','P','B'],'B'),timezone:timezone(),startScreen:en('시작 화면',['HOME','PLANNER','DIARY','TASKS'])})
S('DeviceSession', {id:id(),deviceName:str('기기 이름','개발 PC'),platform:en('플랫폼',['WEB','ANDROID','IOS','DESKTOP']),lastUsedAt:instant('최근 사용'),current:bool('현재 세션',true)})
S('DeviceWrite', {platform:en('플랫폼',['WEB','ANDROID','IOS','DESKTOP']),pushToken:nullable(str('발급 푸시 토큰; 서버 내부 암호화','example-push-token',{maxLength:4096,writeOnly:true})),appVersion:str('클라이언트 버전','0.1.0',{maxLength:32})})
S('DeviceResult', {deviceId:id(),platform:en('플랫폼',['WEB','ANDROID','IOS','DESKTOP']),registered:bool('등록 여부',true)})
S('OAuthWrite', {authorizationCode:str('서버에서 1회 교환','example-code',{writeOnly:true}),codeVerifier:str('PKCE verifier; S256 사용','abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~',{minLength:43,maxLength:128,writeOnly:true}),state:str('서버 발급 세션에 묶인 state','example-state'),redirectUri:str('등록된 redirect URI와 정확히 일치','https://app.example.test/auth/callback',{format:'uri'})})
S('OAuthStart', {provider:en('등록된 provider',['GOOGLE','APPLE','KAKAO']),redirectUri:str('등록된 URI','https://app.example.test/auth/callback',{format:'uri'}),codeChallenge:str('S256 base64url PKCE challenge','abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',{minLength:43,maxLength:128})})
S('CalendarAuthorization',{...schemas.OAuthStart.properties,provider:en('초기 연동 범위',['GOOGLE'])})
S('OAuthStartResult', {authorizationUrl:str('allowlist provider 인증 페이지','https://provider.example.test/authorize',{format:'uri'}),state:str('10분 이내 사용, 서버 보관','example-state'),expiresAt:instant('만료')})
S('CategoryWrite', {name:str('분류명','업무',{minLength:1,maxLength:60}),color:str('HEX 색상','#2f5d46',{pattern:'^#[0-9A-Fa-f]{6}$'}),scope:en('적용 범위',['ALL','EVENT','TASK','ROUTINE','TIME']),parentId:nullable(id())},['name','color','scope'])
patch('CategoryPatch','CategoryWrite');entity('Category','CategoryWrite')
S('EventWrite', {title:title(),allDay:bool('false: startAt/endAt, true: startDate/endDateExclusive'),timezone:timezone(),startAt:instant('시간 일정 시작 UTC'),endAt:{...instant('시간 일정 종료 UTC; 시작보다 이후'),example:'2026-09-26T01:00:00Z'},startDate:date('종일 시작 날짜'),endDateExclusive:{...date('종일 종료일 미포함'),example:'2026-09-27'},categoryId:nullable(id()),location:str('장소','회의실 A',{maxLength:255}),body:body(),visibility:en('공개 범위',['PRIVATE','SHARED','PUBLIC']),attendeeIds:arr('동의/권한 검증된 사용자',id(),100,{uniqueItems:true}),...rich},['title','allDay','timezone'])
schemas.EventWrite.oneOf=[{properties:{allDay:{const:false}},required:['startAt','endAt'],not:{anyOf:[{required:['startDate']},{required:['endDateExclusive']}]}},{properties:{allDay:{const:true}},required:['startDate','endDateExclusive'],not:{anyOf:[{required:['startAt']},{required:['endAt']}]}}]
schemas.EventWrite.example={title:'설계 검토',allDay:false,timezone:'Asia/Seoul',startAt:'2026-09-26T00:00:00Z',endAt:'2026-09-26T01:00:00Z',body:'API 계약 확인 #업무',tags:['업무'],mentionUserIds:[]}
patch('EventPatch','EventWrite');delete schemas.EventPatch.oneOf;delete schemas.EventPatch.example
schemas.EventPatch.example={title:'설계 검토 수정',endAt:'2026-09-26T02:00:00Z'}
entity('Event','EventWrite');schemas.Event.example={...schemas.EventWrite.example,id:'1',version:1,createdAt:'2026-09-26T00:00:00Z',updatedAt:'2026-09-26T00:00:00Z'}
S('EventSeriesWrite',{...schemas.EventWrite.properties,rrule:str('지원 RFC5545 하위집합; FREQ DAILY/WEEKLY/MONTHLY','FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12',{maxLength:512})},[...schemas.EventWrite.required,'rrule'])
schemas.EventSeriesWrite.oneOf=schemas.EventWrite.oneOf
schemas.EventSeriesWrite.example={...schemas.EventWrite.example,rrule:'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12'}
S('OccurrencePatch',{scope:en('변경 범위',['SINGLE','FUTURE']),changes:ref('EventPatch')})
S('TaskWrite',{title:title(),body:body(),due:nullable(date('기한; null은 기한 없음')),priority:en('우선순위',['LOW','MEDIUM','HIGH'],'MEDIUM'),energyLevel:en('필요 에너지',['LOW','MEDIUM','HIGH'],'MEDIUM'),durationMin:num('예상 진행 분',30,1,1440),categoryId:nullable(id()),...rich},['title'])
patch('TaskPatch','TaskWrite');entity('Task','TaskWrite',{status:en('목표 상태',['TODO','DOING','DONE','CANCELED'])})
S('TaskStatusWrite',{status:en('토글이 아닌 목표 상태',['TODO','DOING','DONE','CANCELED'],'DONE')})
S('DuplicateWrite',{due:nullable(date('복제한 작업의 새 기한'))},[])
S('Rollover',{id:id(),taskId:id(),fromDate:date('이전 기한'),toDate:{...date('새 기한'),example:'2026-09-27'},reason:str('이월 사유','미완료 자동 이월'),at:instant('처리 UTC')})
S('RolloverPolicy',{enabled:bool('사용 여부',true),target:en('이월일 정책',['NEXT_DAY','NEXT_WORKDAY']),maxCount:num('최대 이월 횟수',7,1,365)})
S('Permission',{canRead:bool('조회',true),canEdit:bool('수정',true),canDelete:bool('삭제',true)})
S('PlannerItem',{key:str('유형/ID/발생일 복합 UI key','TASK:01J00000000000000000000001:2026-09-26'),id:id(),type:en('필터 유형',['EVENT','TASK','ROUTINE']),title:title(),date:date('표시 지역 날짜'),startAt:nullable(instant('시작 UTC')),endAt:nullable(instant('종료 UTC')),status:en('통합 상태',['PENDING','IN_PROGRESS','DONE','SKIPPED','CANCELED']),sourceStatus:str('원본 도메인 상태','TODO'),category:nullable(ref('Category')),permissions:ref('Permission'),version:num('버전',1,1)})
S('DaySummary',{date:date('지역 날짜'),events:num('일정 수',2),tasks:num('할 일 수',3),routines:num('예정 루틴 수',2),completed:num('할 일/루틴 완료 수',1),actualMinutes:num('실제 기록 분',60)})
S('RoutineWrite',{name:title(),atTime:time(),timezone:timezone(),weekdays:arr('반복 요일; 중복 불가',en('요일',['MON','TUE','WED','THU','FRI','SAT','SUN']),7,{minItems:1,uniqueItems:true}),durationMin:num('진행 분',30,1,1440),active:bool('활성',true),notifyEnabled:bool('알림 설정',true),reminderMinutes:num('시작 전 알림 분',10,0,1440),goalCount:num('목표 수량',1,1,9999),goalUnit:str('목표 단위','회',{minLength:1,maxLength:20}),categoryId:nullable(id()),body:body(),...rich},['name','atTime','timezone','weekdays','durationMin'])
patch('RoutinePatch','RoutineWrite');entity('Routine','RoutineWrite')
S('RoutineLogWrite',{status:en('날짜별 목표 상태',['DONE','MISSED','SKIP'],'DONE')})
S('RoutineLog',{routineId:id(),date:date('발생 지역 날짜'),status:schemas.RoutineLogWrite.properties.status,version:num('기록 버전',1,1)})
S('RoutineHistory',{routineId:id(),entries:arr('날짜별 이력',ref('RoutineLog'),366),doneCount:num('완료 횟수',1),eligibleCount:num('SKIP과 미래 제외 예정 횟수',2),rate:nullable({type:'number',description:'백분율; 분모 0이면 null',example:50,minimum:0,maximum:100})})
S('TimeWrite',{type:en('계획/실제',['PLAN','ACTUAL'],'ACTUAL'),title:title(),startAt:instant('시작 UTC'),endAt:{...instant('종료 UTC; 최대 24시간'),example:'2026-09-26T01:00:00Z'},timezone:timezone(),categoryId:nullable(id()),eventId:nullable(id()),body:body(),...rich},['type','title','startAt','endAt','timezone'])
patch('TimePatch','TimeWrite');entity('TimeEntry','TimeWrite')
S('FocusWrite',{goal:title(),durationMin:num('계획 집중 분',25,1,1440),categoryId:nullable(id())},['goal','durationMin']);entity('FocusSession','FocusWrite',{status:en('세션 상태',['RUNNING','COMPLETED','CANCELED']),startedAt:instant('서버 시작 시각')})
S('FocusComplete',{actualEnd:instant('실제 종료 시각; 서버 허용 오차 내')})
S('DiaryWrite',{title:title(),mood:en('기분',['GREAT','GOOD','SOSO','BAD','TERRIBLE'],'GOOD'),summary:str('하루 요약','설계를 정리했다',{maxLength:1000}),body:body(),gratitude:str('감사한 일','도움을 주신 분들',{maxLength:5000}),...rich},['mood']);entity('Diary','DiaryWrite',{date:date('사용자 지역 일자')})
S('MemoWrite',{title:title(),body:body(),status:en('인박스 상태',['INBOX','ARCHIVED']),...rich},[]);schemas.MemoWrite.anyOf=[{required:['title']},{required:['body'],properties:{body:{minLength:1}}}]
patch('MemoPatch','MemoWrite');delete schemas.MemoPatch.anyOf;entity('Memo','MemoWrite')
S('Tag',{name:str('태그명','업무',{minLength:1,maxLength:40}),count:num('권한 범위 글 수',3)})
S('Mention',{id:id(),fromUserId:id(),resourceType:en('원본 종류',['PLANNER','DDAY','EVENT','TASK','ROUTINE','CHALLENGE','POST','DIARY','COMMUNITY','MEMO','CHAT','WBS','WORK_RECORD']),resourceId:id(),excerpt:str('권한 확인 후 일부 텍스트','확인 부탁드려요',{maxLength:120}),read:bool('읽음'),createdAt:instant('생성 UTC')})
S('ContactCandidate',{id:id(),nickname:str('사용자 표시명','이서연'),avatarUrl:nullable(str('프록시/허용된 아바타 URL','https://assets.example.test/avatar.png',{format:'uri'}))})
S('DdayWrite',{title:title(),targetDate:date('기준 날짜'),repeatYearly:bool('매년 반복'),timezone:timezone()},['title','targetDate']);patch('DdayPatch','DdayWrite');entity('Dday','DdayWrite',{daysRemaining:{type:'integer',description:'사용자 날짜와 기준 날짜 차이',example:7}})
S('WbsWrite',{title:title(),parentId:nullable(id('부모 작업; 같은 소유자, 순환 금지')),ownerLabel:str('담당자 표시명; 접근권한 부여와 무관','김지수',{maxLength:80}),effortMd:{type:'number',description:'말단 작업 공수',example:2.5,minimum:0,maximum:100000,multipleOf:0.5},progress:num('말단 진척 %',30,0,100),startDate:nullable(date('시작 날짜')),endDate:nullable(date('종료 날짜; 시작 이후/같은 날')),body:body(),...rich},['title']);patch('WbsPatch','WbsWrite');entity('Wbs','WbsWrite',{rollupMd:{type:'number',description:'하위 공수 합',example:2.5},rollupProgress:num('공수 가중 진척',30,0,100)})
S('WorkWrite',{type:en('개인 업무 기록 종류',['ANNUAL_LEAVE','HALF_DAY','OFFSITE','BUSINESS_TRIP','JOB_CHANGE','OTHER']),title:title(),ownerLabel:str('담당자','김지수',{minLength:1,maxLength:80}),wbsId:nullable(id()),startAt:instant('시작 UTC'),endAt:{...instant('종료 UTC'),example:'2026-09-26T09:00:00Z'},timezone:timezone(),status:en('메모용 상태; 실제 HR 결재 아님',['PLANNED','REQUESTED','APPROVED','IN_PROGRESS','DONE','CANCELED']),halfDay:nullable(en('반차 구분',['AM','PM'])),leaveDays:{type:'number',description:'연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음',example:1,minimum:0,maximum:365,multipleOf:0.5},location:str('외근/출장 장소','서울',{maxLength:255}),partner:str('방문처/담당자','고객사',{maxLength:200}),transport:str('교통/숙박','기차',{maxLength:255}),expenseKrw:num('예상 경비; KRW 정수',0,0,100000000),fromCompany:str('이전 회사','이전회사',{maxLength:200}),toCompany:str('이직 회사','새회사',{maxLength:200}),jobRole:str('직무/직급','개발자',{maxLength:100}),handover:body(),body:body(),...rich},['type','title','ownerLabel','startAt','endAt','timezone']);patch('WorkPatch','WorkWrite');entity('WorkRecord','WorkWrite')
S('CommunityWrite',{name:title(),category:en('카테고리',['EXERCISE','STUDY','DAILY','LIFE']),description:body(),capacity:num('정원',50,2,500),deadline:nullable(date('모집 마감일')),visibility:en('커뮤니티 공개 설정',['PUBLIC','PRIVATE']),joinPolicy:en('가입 방식',['OPEN','APPROVAL']),...rich},['name','category','capacity','visibility','joinPolicy']);patch('CommunityPatch','CommunityWrite');entity('Community','CommunityWrite',{membership:en('현재 내 가입 상태',['NONE','PENDING','MEMBER','OWNER'],'OWNER'),memberCount:num('승인된 멤버 수',1)})
S('JoinWrite',{message:str('가입 메시지','함께 참여하고 싶어요',{maxLength:1000})},[])
S('Membership',{communityId:id(),userId:id(),status:en('가입 상태',['PENDING','MEMBER','OWNER','REJECTED']),version:num('버전',1,1)})
S('JoinDecision',{decision:en('승인 결정',['ACCEPT','REJECT']),reason:str('처리 사유','가입 승인',{maxLength:500})},['decision'])
S('ChallengeWrite',{communityId:id('현재 승인된 회원인 커뮤니티'),title:title(),description:body(),startDate:date('커뮤니티 기준 시작일'),days:num('진행 기간',21,3,100),timezone:timezone(),...rich},['communityId','title','startDate','days','timezone']);patch('ChallengePatch','ChallengeWrite');entity('Challenge','ChallengeWrite',{joined:bool('참여중',true),doneDays:num('인증 날짜 수',0),memberCount:num('참여 인원',1)})
S('CheckInWrite',{body:body(),fileIds:arr('검사 완료 인증 파일',id(),5)},[])
S('CheckIn',{challengeId:id(),date:date('챌린지 지역 날짜'),accepted:bool('인증됨',true),doneDays:num('누적 인증 일수',1)})
S('PostWrite',{communityId:id(),title:title(),body:body(),recordType:nullable(en('공유할 개인 기록 종류',['DIARY','TASK','ROUTINE','TIME'])),recordId:nullable(id()),shareConfirmed:bool('공유 미리보기 후 명시적 확인',true),...rich},['communityId','title','body','shareConfirmed']);patch('PostPatch','PostWrite');entity('Post','PostWrite',{authorId:id()})
S('Ranking',{userId:id(),nickname:str('공개 동의한 표시명','김지수'),rank:num('순위',1,1),score:{type:'number',description:'동일 기간의 완료율; 비교 동의 필요',example:80,minimum:0,maximum:100}})
S('Achievement',{id:id(),code:str('달성 코드','ROUTINE_7_DAYS'),label:str('스티커명','7일의 꾸준함'),awardedAt:instant('지급 시각')})
S('FriendInviteWrite',{recipientId:id()});S('FriendResponseWrite',{decision:en('본인에게 온 초대 응답',['ACCEPT','REJECT'])})
S('Friend',{id:id(),userId:id(),status:en('관계 상태',['PENDING','ACCEPTED','REJECTED']),nickname:str('상대 이름','이서연')})
S('GroupWrite',{name:str('그룹명','우리 가족',{minLength:1,maxLength:80}),note:str('설명','가족 일정',{maxLength:255})},['name']);patch('GroupPatch','GroupWrite');entity('Group','GroupWrite',{ownerId:id()})
S('GroupInviteWrite',{recipientId:id(),role:en('부여 역할',['VIEWER','EDITOR'])})
S('RoleWrite',{role:en('부여 역할; OWNER는 별도 소유권 이전 절차',['VIEWER','EDITOR'])})
S('Member',{userId:id(),nickname:str('멤버명','이서연'),role:en('역할',['OWNER','EDITOR','VIEWER'])})
S('GroupInvitation',{id:id(),groupId:id(),recipientId:id(),role:en('초대 역할',['VIEWER','EDITOR']),status:en('초대 상태',['PENDING','ACCEPTED','REJECTED'])})
S('ShareWrite',{role:en('공유 역할',['VIEWER','EDITOR']),editScope:en('수정 범위',['NONE','SINGLE','FUTURE']),deleteScope:en('삭제 범위',['NONE','SINGLE','FUTURE'])})
S('Share',{userId:id(),...schemas.ShareWrite.properties})
S('Block',{userId:id(),blocked:bool('차단 여부',true)})
S('RoomWrite',{kind:en('대화 유형',['DM','GROUP']),memberIds:arr('초대할 비차단 사용자',id(),100,{minItems:1,uniqueItems:true}),name:str('그룹 대화명','설계 스터디',{maxLength:80})},['kind','memberIds']);entity('Room','RoomWrite',{unreadCount:num('안 읽은 메시지 수',0)})
S('RecordRef',{type:en('공유 기록 종류',['EVENT','TASK','DIARY','MEMO']),id:id()})
S('MessageWrite',{text:str('메시지 일반 텍스트','안녕하세요 #스터디',{minLength:1,maxLength:5000}),recordRef:ref('RecordRef'),...rich},[]);schemas.MessageWrite.anyOf=[{required:['text']},{required:['recordRef']}];entity('Message','MessageWrite',{senderId:id(),roomId:id()})
S('ReadPosition',{lastReadMessageId:id()});S('ReadState',{roomId:id(),lastReadMessageId:id(),unreadCount:num('안 읽은 수',0)})
S('Notification',{id:id(),type:str('알림 유형','ROUTINE_REMINDER'),title:title(),body:str('민감정보 제외 안내','루틴을 확인해보세요',{maxLength:500}),read:bool('읽음'),resourceType:str('내부 허용된 종류','ROUTINE'),resourceId:id(),createdAt:instant('생성')})
S('ReadWrite',{read:bool('읽음 상태',true)});S('ReadAllWrite',{before:instant('이 시각 이전의 알림만 처리')});S('CountResult',{count:num('처리된 개수',3)})
S('Rate',{done:num('완료',2),eligible:num('분모',3),rate:nullable({type:'number',description:'0~100; 분모 0이면 null',example:66.67,minimum:0,maximum:100})})
S('Statistics',{from:date('포함 시작일'),to:{...date('미포함 종료일'),example:'2026-09-27'},timezone:timezone(),tasks:ref('Rate'),routines:ref('Rate'),diaries:ref('Rate'),actualMinutes:num('ACTUAL 분',60)})
S('TimeComparison',{key:str('groupBy에 따른 집계 키','2026-09-26'),planMinutes:num('계획 분',120),actualMinutes:num('실제 분',100)})
S('NotificationSettings',{push:bool('푸시 수신',true),email:bool('메일 수신'),inApp:bool('인앱 수신',true),quietStart:nullable(time()),quietEnd:nullable(time())})
S('Settings',{mode:en('모드',['J','P','B'],'B'),startScreen:en('시작 화면',['HOME','PLANNER','DIARY','TASKS']),defaultVisibility:en('기본 공개범위',['PRIVATE','SHARED','PUBLIC']),timezone:timezone(),notifications:ref('NotificationSettings')});patch('SettingsPatch','Settings')
S('Widget',{id:en('허용된 위젯',['events','routine','tasksProgress','routineRate','eventsCount','focusTime','dday','categoryDonut','weekdayBar','planVsActual','streak','godlifeScore']),size:en('크기',['sm','md','lg']),visible:bool('표시 여부',true),order:num('순서',0,0,100)})
S('DashboardWrite',{mode:en('모드',['J','P','B'],'B'),breakpoint:en('기기 레이아웃',['MOBILE','DESKTOP']),widgets:arr('중복 widget id 거부',ref('Widget'),12)});entity('Dashboard','DashboardWrite')
S('UploadWrite',{filename:str('표시용 파일명','note.png',{minLength:1,maxLength:255}),mimeType:en('허용 MIME',['image/png','image/jpeg','audio/mpeg','audio/mp4','application/json','text/csv']),sizeBytes:num('첨부 10MiB, 음성 25MiB, import 50MiB 이하',1024,1,52428800),purpose:en('사용 목적',['ATTACHMENT','VOICE','IMPORT'])})
S('Upload',{id:id(),uploadUrl:str('짧게 만료하는 허용 저장소 URL','https://storage.example.test/upload/example',{format:'uri'}),method:en('URL에 지정된 방법',['PUT']),expiresAt:instant('10분 만료'),requiredContentType:str('서명과 동일한 Content-Type','image/png')})
S('UploadStatus',{id:id(),status:en('검사 전 사용 금지',['PENDING','SCANNING','CLEAN','REJECTED'],'SCANNING')})
S('DataJobWrite',{type:en('비동기 데이터 작업',['EXPORT','IMPORT']),format:en('형식',['JSON','CSV']),fileId:nullable(id('IMPORT는 CLEAN 상태 파일 필수'))})
S('Job',{id:id(),status:en('작업 상태',['PENDING','RUNNING','SUCCEEDED','FAILED'],'PENDING'),progress:num('진행률',0,0,100),resultFileId:nullable(id()),errorCode:nullable(str('실패 원인 코드','UPSTREAM_UNAVAILABLE')),expiresAt:nullable(instant('결과 만료'))})
S('Download',{url:str('본인 파일의 5분 서명 URL','https://storage.example.test/download/example',{format:'uri'}),expiresAt:instant('만료')})
S('SuggestionWrite',{sourceIds:arr('본인이 허용한 원본 기록 ID',id(),100),consent:bool('AI 외부 전송 별도 동의',true)},['consent'])
S('TranscriptionWrite',{voiceFileId:id('VOICE 목적 및 CLEAN 파일'),consent:bool('STT 처리 동의',true)})
S('Suggestion',{id:id(),status:en('처리 상태',['PENDING','RUNNING','SUCCEEDED','FAILED']),drafts:arr('자동 저장되지 않는 후보',str('후보 텍스트','오늘 일정 검토'),20),errorCode:nullable(str('실패 코드','UPSTREAM_UNAVAILABLE'))})
S('CalendarConnectionWrite',{provider:en('연동 제공자',['GOOGLE']),authorizationCode:str('인가 코드','example-code',{writeOnly:true}),codeVerifier:schemas.OAuthWrite.properties.codeVerifier,state:str('연동 세션 state','example-state'),redirectUri:schemas.OAuthWrite.properties.redirectUri})
S('CalendarConnection',{id:id(),provider:en('제공자',['GOOGLE']),status:en('연결 상태',['CONNECTED','REAUTH_REQUIRED','DISCONNECTED']),lastSyncedAt:nullable(instant('최근 동기화'))})
S('ReportWrite',{from:date('포함 시작'),to:{...date('미포함 끝'),example:'2026-09-27'},template:en('보고서 종류',['DAILY','WEEKLY','MONTHLY']),timezone:timezone()})
S('Report',{id:id(),title:title(),from:date('시작'),to:{...date('종료'),example:'2026-09-27'},body:body(),createdAt:instant('생성')})
S('AdminStatusWrite',{status:en('계정 상태',['ACTIVE','SUSPENDED','DELETED']),reason:str('필수 감사 사유','운영 정책 위반 검토',{minLength:10,maxLength:500})})
S('Audit',{id:id(),actorId:id(),action:str('조작 종류','USER_STATUS_CHANGED'),targetId:id(),reason:str('마스킹된 처리 사유','운영 정책 위반 검토'),at:instant('처리')})
S('TrashItem',{id:id(),type:en('복구 대상',['EVENT','TASK','ROUTINE','DIARY','MEMO']),title:title(),deletedAt:instant('삭제'),expiresAt:instant('복구 만료')})
S('Change',{revision:str('서버 단조 증가값; 문자열','101'),type:en('종류',['EVENT','TASK','ROUTINE','DIARY','MEMO']),id:id(),version:num('버전',2,1),deleted:bool('tombstone'),changedAt:instant('변경 시각')})
S('Mutation',{clientMutationId:str('기기별 중복 방지 UUID','00000000-0000-4000-8000-000000000001',{format:'uuid'}),type:en('초기 지원 범위',['TASK']),id:id(),baseVersion:num('편집 기준 버전',1,1),operation:en('초기 지원 연산',['SET_STATUS']),payload:ref('TaskStatusWrite')})
S('MutationBatch',{deviceId:id(),mutations:arr('각 항목 독립 트랜잭션; 전체 원자성 없음',ref('Mutation'),50,{minItems:1})})
S('MutationResult',{clientMutationId:schemas.Mutation.properties.clientMutationId,status:en('항목 결과',['APPLIED','CONFLICT','REJECTED']),id:id(),version:num('현재 버전',2,1),errorCode:nullable(str('실패 원인','VERSION_CONFLICT'))})
S('MutationResults',{results:arr('요청 순서와 동일한 개별 결과',ref('MutationResult'),50)})
S('ChangePage',{items:arr('revision 순서의 변경',ref('Change'),100),nextCursor:str('변경 없음에도 다음 동기화에 사용할 커서','opaque-sync-cursor'),hasNext:bool('남은 변경 여부')})
S('SearchHit',{id:id(),type:en('종류',['PLANNER','DDAY','EVENT','TASK','ROUTINE','CHALLENGE','POST','DIARY','COMMUNITY','MEMO','CHAT','WBS','WORK_RECORD']),title:title(),excerpt:str('권한 내 발췌','오늘의 기록',{maxLength:200})})
schemas.Rate.example={done:2,eligible:3,rate:66.67}
schemas.WorkWrite.example={type:'ANNUAL_LEAVE',title:'연차 사용',ownerLabel:'김지수',startAt:'2026-09-26T00:00:00Z',endAt:'2026-09-26T09:00:00Z',timezone:'Asia/Seoul',status:'PLANNED',leaveDays:1,body:'개인 일정 #휴가',tags:['휴가'],mentionUserIds:[]}
schemas.WorkPatch.example={title:'연차 사용 일정 변경',body:'변경 사유 #휴가'}
schemas.WorkRecord.example={...schemas.WorkWrite.example,id:'01J00000000000000000000001',version:1,createdAt:'2026-09-26T00:00:00Z',updatedAt:'2026-09-26T00:00:00Z'}
schemas.Upload.properties.expiresAt.example='2026-09-26T00:10:00Z'
schemas.Download.properties.expiresAt.example='2026-09-26T00:05:00Z'
schemas.OAuthStartResult.properties.expiresAt.example='2026-09-26T00:10:00Z'
export const helpers = {ref,arr,str,num,bool,en,id,date,instant,timezone,nullable}
