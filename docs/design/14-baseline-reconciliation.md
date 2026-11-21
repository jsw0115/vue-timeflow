# 0단계 기준선 대조와 1단계 적용 기록

- 문서 버전: v2.1 보완
- 작성일: 2026-11-21
- 성격: `docs/design/01~13`(v2.1)의 진술을 현재 저장소 소스와 대조한 결과와, 이번에 코드에 반영한 범위를 기록한다.
- 근거 우선순위: [13 §2](13-source-reconciliation.md)를 따른다. 이 문서의 "확인"은 저장소 소스·테스트 실행 기준이며 운영 배포·운영 DB 조회 결과가 아니다.

## 1. 문서 진술과 현재 소스의 차이

| 문서 진술 | 현재 소스에서 확인한 사실 | 근거 | 처리 |
|---|---|---|---|
| 05 §3: 트랜잭션 DB는 MariaDB | 격리 개발 DB는 MySQL 8.4다. 백엔드에는 MariaDB·MySQL JDBC 드라이버가 함께 있다. 운영 DB 종류는 저장소만으로 확정할 수 없다 | `infra/chat/compose.yml`, `backend/build.gradle` | 05 문서를 고치지 않고 차이만 기록한다. 운영 DB 확인은 TECH-03에 남긴다 |
| 04 §4·05 §9: `/api/v1`은 목표 경로 | `@RequestMapping("/api/v1…")`는 0개다. 컨트롤러는 `/api` 접두어를 쓴다 | `backend/src/main/java` 검색 | 신규 API도 `/api/career/*`로 만들었다 |
| 06 §2: 9월 DDL은 `tbl_` 37개 테이블 | Flyway 경로는 `db/migration`(V1), `db/core`(V3), `db/workspace`(V4·V6~V12)다. `feature_record`는 workspace V6에 있다 | `backend/src/main/resources/db` | 새 테이블·마이그레이션을 만들지 않았다 |
| 12 DEC-03: 활동 원장과 `feature_record` 중복 여부 결정 필요 | 경력·이력서·포트폴리오가 이미 `feature_record`의 kind(`CAREER`·`RESUME`·`PORTFOLIO`)로 저장된다. `kind`는 제약 없는 `VARCHAR(40)`이다 | `FeatureType.java`, `V6__frontend_feature_records.sql` | DEC-03의 현재 제안(기존 구조 재사용)대로 새 kind 두 개를 추가했다. 별도 테이블로 옮길지는 여전히 결정 대기다 |
| 03 §8-5: 관리자 메뉴는 서버 권한 검사 결과로 노출 | 사용자 앱 사이드바의 `관리자 콘솔` 버튼이 권한과 관계없이 보였다. 관리자 창 자체는 `/api/admin/stats` 응답으로 권한을 판정하고 있었다 | `App.vue`, `AdminApp.vue`, `features/admin/admin.js` | 같은 서버 판정을 사용자 앱에도 적용했다 |
| 03 §8-2: 화면 경로 생성기로 `screen-catalog.md` 재생성 | 생성기가 플래너 경로 배열의 세 번째 값(라벨)을 읽지 못해 HEAD에서도 실패하고 있었다 | `scripts/docs/build_screen_catalog.py` | 정규식만 고쳐 재생성했다(경로 87 → 90개) |

## 2. 이번에 반영한 범위

상태 용어는 [13 §6](13-source-reconciliation.md)을 따른다.

| 후보 ID | 내용 | 상태 | 소스 |
|---|---|---|---|
| 03 §2 IA | 사이드바 묶음을 메인 → 커리어 → 플래너 → 업무·프로젝트 → 기록 → 인사이트 → 소셜 순서로 재구성. 기존 경로 87개는 그대로 두고 3개를 추가했다 | 구현 | `frontend/src/router/index.js` |
| MN-130 | 커리어 대시보드 `/career`. 커리어 목표에 따라 영역 순서만 바꾸고 숫자에 기간·분모를 함께 보인다 | 서버(지원·활동·경력·이력서·포트폴리오 조회) | `views/career/CareerDashboardView.vue` |
| MN-131 · FD-85 · REQ-F24 | 활동 타임라인 `/career/activities`, `/api/career/activities` | 서버. 범위 일부(아래 §3) | `career/CareerController.java`, `views/career/CareerActivitiesView.vue` |
| MN-133 · FD-88 · REQ-F27 | 취업·이직 지원 `/career/applications`, `/api/career/applications`. 단계별 보드와 마감순 목록 | 서버. 범위 일부(아래 §3) | `views/career/JobApplicationsView.vue` |
| MN-51 | 경력·포트폴리오는 기존 `/work/career` 경로 그대로 커리어 묶음으로 옮겼다 | 기존 서버 연결 유지 | `views/work/CareerDocsView.vue`(변경 없음) |
| DEC-02 | 커리어 목표(취업 준비·이직 준비·재직 중 성장·프로젝트 참여)를 온보딩·환경설정·대시보드에서 고른다. 로그인하면 `/api/settings/career`, 로그아웃이면 이 브라우저에 저장한다. 권한·공개 범위는 바꾸지 않는다 | 서버·로컬 | `store/careerGoal.js`, `SettingsService.java` |
| 03 §8-5 | 관리자 콘솔 버튼은 서버가 관리자 권한을 확인한 계정에만 보인다 | 구현 | `App.vue` |

후보 ID(MN-130·131·133, FD-85·88, REQ-F24·F27)는 아직 원본 문서(`docs/planning/requirements.md` 등)에 정식 등록하지 않았다. 정식 발급은 [02 §6](02-requirements-addendum.md) 절차를 따른다.

## 3. 활동·지원 API의 서버 규칙

- 소유권: 모든 조회·수정·삭제는 JWT subject 계정 범위다. 다른 계정 기록은 404다. 요청 본문의 `userId`·`ownerId` 같은 필드는 허용되지 않은 필드로 400이다.
- 동시 수정: `version`이 다르면 409다. 생성은 `Idempotency-Key`를 받는다.
- 활동 유형: 회사 업무(`work`)·인턴(`intern`)·아르바이트(`part-time`)·프리랜서(`freelance`)·개인 프로젝트(`project`)·학습(`study`)·커뮤니티 활동(`community`). 04 §3 FD-85의 목록 그대로다.
- 연결 경력(`experienceId`): 본인 경력 프로젝트(`/api/work/career/projects`) ID만 받는다. 없는 ID와 다른 계정 ID는 같은 400으로 거부해 존재 여부를 드러내지 않는다. 경력을 지운 뒤 남은 연결은 화면이 "연결한 경력을 찾을 수 없어요(삭제됨)"로 보인다(04 §3 "깨진 출처 표시").
- 근거 링크(`links`): http·https 절대 주소 최대 10개. 서버는 주소를 저장만 하고 호출하지 않는다(07 §1-4, SSRF 경계). 화면은 같은 규칙으로 통과한 주소만 `rel="noopener noreferrer"` 링크로 그린다.
- 공개 범위(`visibility`): 공유 기능이 없으므로 `private`만 받고, 빼면 `private`로 저장한다(09 §3 기본 PRIVATE).
- 지원 상태: 관심·준비 중·지원 완료·서류 통과·면접 예정·최종 합격·불합격·보류·철회(04 §3 FD-88). 문서에 상태 전이 규칙이 없어 전이 제한은 두지 않았다.
- 공고 주소(`postingUrl`): http·https 절대 주소(최대 2,000자)만 저장한다. 공고 자동 수집·자동 지원은 하지 않는다(02 §7).
- 백업(`BackupService`)은 기존 정책대로 업무·경력 자료를 포함하지 않는다. 계정 데이터 내보내기(`SettingsService.export`)는 모든 kind를 포함하므로 새 기록도 들어간다. 통합 검색(`/api/search`)에도 두 kind를 추가했다.

## 4. 아직 하지 않은 것

| 범위 | 이유 |
|---|---|
| 활동 ↔ 기존 일정·실제 기록·WBS 원천 연결(06 §6 Career Source Link) | `record_link`의 연결 종류(`task`·`schedule`·`actual`)를 넓히는 설계 결정이 필요하다 |
| 지원 시점 문서 버전 고정(FD-88), 문서 템플릿·버전(FD-89) | 이력서가 계정당 한 건이고 버전 저장 구조가 없다. 화면에 "준비 중"으로 표시했다 |
| 포트폴리오 공개 고도화(FD-90), 팀 프로젝트·기여도(FD-91·92), 프로젝트 허브(MN-136·137) | DEC-05·06·07 결정 대기 |
| GitHub·클라우드 연동(FD-93·94), AI 서버(FD-95·96), 관리자 connector·자동화(FD-97·98) | 외부 계정·제공자 결정(DEC-04·08·10)과 보안 검토 필요 |
| 다국어(FD-99), 통합 검색·내보내기 확장(FD-100) | 03·10 로드맵상 후순위 |
| 모바일 하단 탭(03 §7), 홈 커리어 위젯(03 §4 MN-01) | 문서가 "검토"로 둔 항목. 현재 모바일은 햄버거 메뉴를 유지한다 |
| 지원 관리 캘린더 보기(11 §4.5) | 이번에는 단계별 보드와 마감순 목록만 만들었다 |

## 5. 검증

실행 명령과 결과는 작업 기록 [verification.md](../agent/records/2026-11-21-커리어OS-1단계-IA와-커리어원장/verification.md)에 있다.
