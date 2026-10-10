# 작업 맥락

## 2026-10-10

- 기존 백엔드는 Gradle / Java 17 / Spring Boot 3.5이며 MySQL·Flyway·JWT·JPA를 사용한다. 루트 README의 Maven 실행 안내는 실제 빌드 파일과 다르다.
- 기존 API 문서는 117개 endpoint, stub 52개, 공용 메모리 플래너 5개를 구분한다. 이미 서비스가 있는 인증·일정·할 일·루틴·채팅·체크리스트·플래너 설정은 재사용한다.
- Vue의 localCollection과 store, 실제 router를 기준으로 조사한다. 기존 목표 `/api/v1` 문서의 계획 API를 구현 완료로 오인하지 않는다.
- 프런트엔드에는 AI·결제·동기화·파일 다운로드의 시연 흐름이 있다. 제공자 자격 증명과 실제 파일 없이 성공했다고 응답하지 않는다.
- 사용자 작업 중인 파일을 보존한다. 이번 기능의 명세와 소스는 별도 경로에 작성하고 필요한 기존 컨트롤러만 교체한다.


## 구현·검증 중 결정.

- 사용자는 AI·음성·결제·외부 캘린더의 제공자를 추후 결정하고 연동 명세와 경계 소스만 작성하도록 명시했다. IntegrationController의 실행은 503, 상태 조회는 미연결 응답이다.
- 기존 Java/Spring/Gradle/MySQL 스택을 유지했다. 기능 레코드는 사용자·종류·ID 복합키와 JSON payload 및 version으로 저장한다. 128 KiB 크기 제한과 종류별 허용 필드 검증을 적용했다.
- 기존 일정·루틴 DTO가 다일 일정과 목표·복잡한 반복 규칙을 표현하지 못하므로 /schedules, /routine-records를 별도 추가했다. 레거시 /events, /routines와 데이터는 자동 동기화하지 않는다.
- 플래너의 공유 메모리 샘플을 소유자별 JPA 저장으로 대체했다. 과거 user_id 없는 행은 자동 귀속하지 않는다.
- 업무·위키·WBS·경력·이력서는 비공개다. 명시적으로 선택한 포트폴리오 항목만 만료 7일 토큰 링크로 공개한다. DB에는 토큰 해시만 저장한다.
- 로그아웃 전체·비밀번호 변경·정지·역할 변경은 auth_version을 증가시켜 이미 발급된 access token도 무효화한다. 세션 하나 삭제는 해당 refresh token만 폐기한다.
- H2 MySQL 모드에서 실제 V6 SQL, JDBC 저장, 트랜잭션, MockMvc HTTP 계약을 검증했다. JDBC 응답 키 대소문자 차이를 발견해 정규화했고 재검증했다. 실제 MySQL/Redis 운영 환경과 모든 route의 통합 검증은 별개다.
- 위키 이력의 직접 수정·삭제를 막고 게시글 목록에 실제 좋아요·댓글 수를 추가했다. 그룹 파일 목록에서도 차단한 업로더를 제외한다.
- frontend UI와 store를 서버 호출로 교체하지 않았다. 명세 생성기와 문서만 frontend 변경에 포함한다.

- 플래너의 실제 JPA 검증을 추가했다. 테스트 컨텍스트에서 기존 Querydsl repository fragment가 요구하는 JPAQueryFactory가 빠진 오류를 확인했고 기존 QuerydslConfig를 테스트에도 포함했다.


## 최종 검증.

- gradlew.bat test bootJar --offline --console=plain이 통과했다. 최종 XML 합계는 178개, 실패/오류/skip 0, 18개 suite다. 이번 추가 테스트는 41개다.
- 프런트엔드 전체 Node 테스트 47개와 npm run build가 통과했다. 최신 계약 schema 수정 후 문서 계약 테스트 4개도 다시 통과했다.
- API 목록과 OpenAPI의 --check가 통과했다. 277개 매핑 중 13개는 외부 경계, 190개 schema다. 아직 소스 연결 상태와 모든 API 운영 검증 완료를 구분한다.
- 실제 MySQL/Redis 실행·DB migration·프런트엔드 store 서버 전환은 하지 않았다. 환경 Node 20과 프로젝트 권장 Node 22 차이, 기존 chunk/HMR 경고를 검증 기록에 남겼다.
