# 설계 결정 및 미해결 항목

- 문서 버전: v2.1
- 기준일: 2026-11-20
- 목적: 추정으로 확정하지 말아야 할 항목을 모아 결정·담당·검증을 추적한다.

## 1. 기존 문서의 기준일 충돌

| 항목 | 문서 A | 문서 B | 처리 제안 |
|---|---|---|---|
| 시스템 구성 | 2026-09-26: 로컬 시연·stub·메모리 플래너 중심 | 2026-11-20: 일정·루틴·WBS·커뮤니티·경력 등 API/화면 연결 기록 | 9월 문서는 과거 스냅샷으로 표기, 현재 구조는 최신 소스·테스트로 재추출 |
| 경력 | 11월 20일: 기본 경력·이력서·포트폴리오 서버 저장 | 신규 요청: 경험 원장·지원 이력·문서·근거 연결 | 기존 저장 모델 재사용 범위를 확인하고 새 도메인 중복 방지 |
| 외부 연동 | 9월 문서: 설계 단계, `/api/v1` 목표 | 11월 문서: `/api` 구현 및 일부 상태 조회 | 목표 API 경로와 현재 Controller 매핑을 구분 |
| DB | 9월 DDL: 37개 tbl_ 테이블·FK 이름 충돌 | 11월 기능 원장: feature_record·record_link·idempotency 등 후속 구조 | 실제 DB/Flyway/Entity를 읽기 전 신규 migration 금지 |

## 2. 제품 정책 결정 필요

| ID | 쟁점 | 현재 제안 | 결정 전 영향 |
|---|---|---|---|
| DEC-01 | 별도 “P/B” 기능의 의미 | 기존 J/P/B 하루 모드는 유지. 별도 기능은 정확한 의미 확인 후 결정 | 메뉴 삭제/유지 판단 보류 |
| DEC-02 | 취업준비생/이직 직장인 온보딩 | 가입 후 목표 유형을 선택하되 언제든 변경 | 대시보드 기본 구성 |
| DEC-03 | 경력 활동 원장과 기존 feature_record 중복 | 기존 데이터 구조를 우선 재사용하고 부족한 정보만 확장 | ERD·migration 결정 |
| DEC-04 | 네이버 MYBOX 연결 범위 | 공식 API에서 지원되는 범위와 token 정책 확인 후 파일 선택형 도입 | 클라우드 구현 계획 |
| DEC-05 | 포트폴리오 공개 정책 | 비공개 기본, 항목 선택, 링크 만료·폐기·비밀번호 검토 | 공개 링크 API·DB |
| DEC-06 | 프로젝트 결과물 소유권 | 개인/팀/회사 자산을 구분하고 팀 공개는 프로젝트 정책에 따름 | 협업·공개 기능 |
| DEC-07 | 기여도 계산 | 점수 자동화보다 활동 근거·팀 확인을 우선 | 기여도 UI·AI 분석 |
| DEC-08 | AI provider 및 모델 | 공급자·계약·전송/학습 정책 확인 후 선택 | AI 서버 세부 설계 |
| DEC-09 | BYOK | 브라우저 저장 금지. 서버 암호화·철회·감사 구현 후 재검토 | 사용자 AI 계정 연결 |
| DEC-10 | 외부 자동화 방식 | 공식 API/Webhook 우선, 지원 불가 사이트는 미지원 | connector catalog |
| DEC-11 | 업무보고 자동 발송 | 미리보기·명시 승인·멱등 전송 기본 | 자동화 UX |
| DEC-12 | 다국어 지원 범위 | UI locale, 문서 생성 언어, 원본/번역본 분리 | i18n 구조 |
| DEC-13 | 결제/유료화 | 핵심 사용성 검증 후 상품·요금제 결정 | REQ-F22/FD-82 |
| DEC-14 | 기업/기관용 계정 | 개인 서비스 안정화 이후 별도 개인정보/공유 정책 설계 | 조직·관리자 구조 |

## 3. 기술 확인 필요

| ID | 확인 항목 | 확인 방법 | 완료 증거 |
|---|---|---|---|
| TECH-01 | 최신 프런트 프레임워크·router 상태 | `package.json`, `src/router`, 실행 빌드 확인 | 버전·라우트 inventory |
| TECH-02 | API 현재 prefix와 계약 | Controller mapping, OpenAPI 생성 파일, contract tests | 실제 API route 목록 |
| TECH-03 | DB 실제 테이블·Flyway | `information_schema`, `flyway_schema_history` read-only 조회 | schema comparison report |
| TECH-04 | JPA Entity와 DDL 정합성 | `@Table`, column, FK, index 비교 | Entity/DDL gap matrix |
| TECH-05 | 기존 경력 API/저장 구조 | `/api/work/career/projects`, `/resume`, `/portfolio`, feature_record 분석 | 재사용/확장 결정 |
| TECH-06 | 파일 저장 방식 | AttachmentController, storage adapter, proxy limits | 파일 lifecycle 문서 |
| TECH-07 | 오프라인 범위 | 현재 IndexedDB outbox가 지원하는 record type 확인 | 유형별 오프라인 표 |
| TECH-08 | Capacitor 실제 빌드/푸시 | plugin 설정·빌드·기기 테스트 | iOS/Android smoke evidence |
| TECH-09 | Electron 패키징 | build config·서명·업데이트 정책 | 설치 패키지 검증 |
| TECH-10 | 외부 provider 가용성 | 공식 개발자 문서·sandbox·심사 요건 | provider decision record |
| TECH-11 | AI 서버 인프라 | 모델, CPU/GPU, 개인정보, 비용, 배포 요구 산정 | AI deployment design |

## 4. 데이터 정책 미결정

- 직장 경력에서 회사명·부서·고객사 이름의 공개 허용 수준
- 사용자 퇴사 후 업무 기록의 보존·삭제 및 회사 자료 반환 이슈
- 포트폴리오 링크 만료와 검색 엔진 색인 기본값
- 팀 프로젝트에서 탈퇴한 멤버의 기여 기록 공개·수정 권한
- 원천 기록 삭제 후 이미 제출된 지원 문서의 보존 범위
- 외부 클라우드 복사본과 원본의 동기화/삭제 책임
- AI provider로 전송한 자료의 보존·삭제 요청이 가능한지
- 탈퇴 시 백업 파일·object storage·search index·AI job·외부 credential 정리

## 5. 결정 기록 템플릿

```text
결정 ID:
제목:
상태: 제안 / 승인 / 보류 / 폐기
작성일:
결정자:
문제와 배경:
선택지:
선택한 안:
선택 근거:
영향 받는 REQ/MN/FD/PR/API/DB:
보안·개인정보 영향:
마이그레이션·하위 호환 영향:
테스트 및 완료 증거:
재검토 조건:
```

## 6. 착수 전 필수 결정

1. 9월 26일 스냅샷 이후 적용된 DB migration과 실제 배포 환경을 확인한다.
2. 기존 경력 저장 구조를 재사용할지, 별도 career_activity 테이블을 둘지 결정한다.
3. 포트폴리오 공개 범위와 회사/팀 결과물 공개 승인 정책을 합의한다.
4. GitHub 로그인과 Repository 연동을 별도 UX·권한으로 확정한다.
5. AI provider·데이터 전송·사용량·비용 정책을 승인한다.
6. 허용 사이트 등록 및 사용자 승인형 자동화 정책을 확정한다.
