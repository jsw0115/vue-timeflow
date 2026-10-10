# 검증 기록.

2026-10-10의 최종 소스 기준이다. 백엔드 테스트 결과 XML에서 **178개, 실패 0, 오류 0, 건너뜀 0, 18개 suite**를 확인했다. 프런트엔드 전체 Node 테스트는 **47개 통과**다. 생성 문서는 **277개 operation / 190개 schema**다.

## 실제 실행한 명령과 결과.

| 위치 | 명령 | 결과 |
|---|---|---|
| backend | `.\gradlew.bat test bootJar --offline --console=plain` | 통과. 178개 테스트. 실행용 `build/libs/timeflow-api-0.1.0.jar` 생성 |
| backend | `.\gradlew.bat test --tests kr.timebar.diary.planner.PlannerPersistenceTest --offline --console=plain` | 통과. 실제 JPA 테스트 2개. 이후 전체 테스트 재실행 통과 |
| frontend | `$testFiles = (Get-ChildItem tests/*.test.mjs).FullName; node --test $testFiles` | 47/47 통과 |
| frontend | `npm run build` | 통과. Vite production bundle 생성 |
| frontend | `node scripts/frontend-api-contract.mjs --check` | 통과. 277개 operation / 190개 schema가 소스와 일치 |
| frontend | `node scripts/api-inventory.mjs --check` | 통과. API 목록 277개 경로가 소스와 일치 |
| frontend | `node --test tests/frontend-api-contract.test.mjs` | 4/4 통과. 최종 schema 수정 후 재실행 |

환경의 Gradle 캐시는 `GRADLE_USER_HOME=C:\Users\jsw01\.gradle`로 지정했다. 새 테스트용 H2 의존성 확보 후 최종 검증은 offline으로 실행했다. 실제 DB 비밀값·운영 파일에 접근하거나 값을 출력하지 않았다.

## 이번에 추가한 테스트의 범위.

| 테스트 파일 | 개수 | 실제 검증한 동작 |
|---|---|---|
| `feature/FeatureHttpTest.java` | 21 | 실제 JDBC 서비스를 MockMvc에 연결. 15개 기록 리소스 생성·상세·페이지·수정·오래된 버전 409·타인 404·삭제. 잘못된 날짜/owner 입력·인증 없음, 설정 버전/비밀값 거부/2FA 503, 다건 일기 달력, 실제 첨부 바이트/만료/purge, 제공자 503·ADMIN 거부, 선택 포트폴리오 익명 조회·폐기 |
| `feature/FeaturePersistenceTest.java` | 8 | V6 SQL을 H2 MySQL 모드에 적용. 저장 재조회·소유자 격리, 두 동시 수정 중 하나만 성공, 전체 구간 금액 합계, WBS 순환/가중 계산/삭제, 위키 이력 보호/자식 승격, 잘못된 입력, 월말·윤년·요일·횟수 반복, 다일 겹침·루틴 인증 멱등 |
| `social/SocialPersistenceTest.java` | 6 | 실제 SQL 친구 수락 권한·차단, 중복/위조 초대, 그룹 초대 수락/owner 관리, 커뮤니티 승인/정원/비공개 정보, 글 작성자/댓글/좋아요 수/삭제, 챌린지 중복 인증과 랭킹 격리 |
| `operations/AccountSecurityTest.java` | 4 | 실제 JWT 생성/필터와 mock 계정 저장소. 전체 로그아웃·정지 후 access token 거부, refresh 폐기, 감사 기록, 현재 ADMIN 권한 검사, 자기 관리자 삭제 거부 |
| `planner/PlannerPersistenceTest.java` | 2 | H2와 실제 JPA repository에서 저장·새 서비스 재조회·타인 목록/수정/삭제 거부·상태 변경·삭제, 기존 소유자 없는 행 숨김·역전 시간 거부 |
| `frontend-api-contract.test.mjs` | 4 | 모든 OpenAPI schema 참조 해소, path parameter/operationId 일관성, 공개 링크·ADMIN 보안 명세, 외부 실행에 503만 선언, 신규 수정의 version/unknown-field 계약 |

추가 백엔드 테스트는 총 41개다. 기존 인증·일정·할 일·루틴·체크리스트·플래너 설정·채팅 테스트를 포함한 전체 178개를 실행했다. MockMvc는 standalone 등록과 SecurityContext로 권한 경계를 검사하며 실제 전체 SecurityFilterChain/MySQL 서버 E2E를 대체하지 않는다. 계정 저장소는 일부 테스트에서 mock이고 새로운 개인 저장소·소셜 관계는 실제 H2 SQL이다.

## 발견한 오류와 보완.

- 실제 첨부 HTTP 검증에서 H2 JDBC 컬럼 키 대소문자 때문에 응답 ID가 누락된 것을 확인했다. `SqlResponses`로 공개 필드명을 정규화하고 재검증했다.
- JPA 플래너 테스트 초기 구성에 기존 Querydsl fragment의 JPAQueryFactory가 없어 컨텍스트가 실패했다. 실제 오류 로그를 확인하고 기존 QuerydslConfig·JPA auditing을 테스트에 포함한 후 단독 및 전체 테스트가 통과했다.
- 초기 OpenAPI의 Void·generic chat page 참조 누락을 발견하고 concrete schema로 생성하도록 보완했다. 생성 시 누락 참조를 검사하고 Node 계약 테스트로 확인한다.

## 남아 있는 검증·연결 범위.

실제 로컬 MySQL에 V6 migration을 적용하거나 Redis/외부 제공자/전체 Spring 애플리케이션 운영 연결을 검증하지 않았다. 제공자 호출은 사용자 지시에 따라 연동 경계만 작성했다. 프런트엔드 기존 store의 백엔드 연결도 이번 범위에 포함하지 않았다. 277개 매핑의 모든 개별 route에 대해 HTTP·실 DB 테스트를 완료한 것은 아니다.

노드는 실제 환경의 20.18.0으로 실행했으며 프로젝트 권장 engines는 22.12 이상이다. 테스트 중 기존 Vite HMR port 24678 점유 로그가 출력됐지만 테스트는 모두 통과했다. production build는 기존 약 710 kB JS chunk 크기 경고를 출력했다. 이 작업에서는 관련 없는 번들 분할·테스트 포트 구성을 변경하지 않았다.
