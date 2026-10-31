# 개발·기획·운영 문서 통합 검증

작성일 2026-10-31. 수정일 2026-10-31. 작업 전 기준 SHA는 d683bc5입니다. 문서·문서 생성/검증 도구만 변경하며 기존 사용자 소스·개인 설정은 보존합니다.

## 목차

- [실제 확인한 내용](#실제-확인한-내용)
- [최종 검사](#최종-검사)
- [실행하지 않은 범위](#실행하지-않은-범위)

## 실제 확인한 내용

- Git 원격·로그·태그·웹/API 버전·소스·설정·기존 문서를 대조했습니다. 웹·API는 0.1.0이며 확인한 태그는 없습니다.
- 기존 개인 DB 대신 timeflow-manual-20261031-mysql-1 격리 컨테이너만 시작해 메타데이터와 migration 이력을 조회했습니다. 사용자 행·파일 바이트·비밀값은 조회·출력하지 않았습니다.
- 현재 DB는 28개 테이블·205개 컬럼·15개 물리 FK입니다. 애플리케이션 26개와 Core/Chat Flyway 이력 2개를 구분하고 인덱스·CHECK·NULL·기본값·소스 해시를 기록했습니다.
- 라우터의 명시적 경로·플래너 매핑 86개와 컴포넌트 파일을 추출했습니다. 동적 라우트·설정 탭·기획 화면 수와 실제 서버 연결 수를 구분했습니다.
- Node 24.22.1로 API inventory --check의 277개 route, frontend-api-contract --check의 277개 operation·190개 schema가 일치함을 확인했습니다.
- 최신 호스트 설치 안내는 2026-10-31의 Docker·Node·Adoptium 공식 문서를 확인해 작성했습니다. Ubuntu 호스트 설치를 실제 실행한 것은 아닙니다.

## 최종 검사

| 명령·확인 | 결과 |
| --- | --- |
| `node frontend/scripts/api-inventory.mjs --check` | 277개 route 일치 |
| `node frontend/scripts/frontend-api-contract.mjs --check` | 277개 operation·190개 schema 일치 |
| `python scripts/docs/build_current_database.py --check` | DB 문서·메타데이터·LF 정규화 소스 해시 일치 |
| `python scripts/docs/build_screen_catalog.py --check` | 86개 경로와 컴포넌트 소스 일치 |
| `python scripts/docs/verify_documentation.py` | 기준·연결·안내서·AI·작업 기록의 링크·목차·날짜·추적 ID·손상 문자·중복 원문 검사 통과 |
| Python 표준 입력 검증 | 새 도구 3개 AST 통과, 비격리 DB·잘못된 날짜·check/capture 동시 실행 거부, snapshot 불변 |

[문서 검사 JSON](documentation-results.json)과 [생성기 보호 검사 JSON](generator-results.json)에 결과를 남겼습니다. 외부 URL은 개수만 집계했고 모든 원격 페이지를 검사한 것은 아닙니다. 도식은 Mermaid 소스이며 외부 뷰어별 렌더링·Word 조판 검증은 하지 않았습니다.

최종 문서 검사 범위는 Markdown 56개, 로컬 링크 637개, 그중 앵커 연결 235개이며 오류 0개입니다. 기능 요구 23개·품질 요구 10개·테스트 케이스 44개·WBS 14개 ID의 참조도 확인했습니다. `git diff --check -- README.md docs scripts/docs`는 통과했으며 기존 사용자 소스는 검사·커밋 범위에 포함하지 않았습니다.

문서 생성기·검증기는 관리된 Python 3.12의 `python -X utf8`로 실행했습니다. 문서 작업에서 Java·웹 전체 테스트를 새로 실행한 것처럼 기록하지 않습니다. 실제 앱의 과거 테스트는 별도 증거를 따릅니다.

## 실행하지 않은 범위

이번 작업에서 새 AI·결제·화면 기능 구현, package 버전 변경·태그·원격 push, 실제 운영/Pages/Registry 배포, Linux 호스트 설치·네이티브 빌드를 실행하지 않았습니다. 과거 178/47 테스트와 실제 HTTP·브라우저 검증은 [별도 날짜 기록](../documentation-2026-10-31/verification.md)의 범위입니다.

외부 URL의 지속 접근성·과거 PDF 전체·모든 역사적 목표 명세·모든 API의 실제 HTTP를 검증하지 않았습니다. 디자인 계약·Java 헤더 규칙 충돌, 기본 Node·BYOK·업로드 경계·화면 서버 연결은 원장에 남겨 실제 기능 수정과 구분합니다.
