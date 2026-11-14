---
name: release-security-gate
description: 릴리스 전 기능·보안약점·웹 취약점·접근성 결과, 위험 수용 및 배포 승인 점검에 사용한다.
---

# release-security-gate

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

실제 대상은 GitLab Pages·선택적 Linux 컨테이너·네이티브 포장 중 확인한다. 구성 파일 존재를 실제 배포 성공으로 표현하지 않는다.


1. `RELEASE_GUIDE.md`, `security/DEVELOPMENT_SECURITY_GATE.md`를 읽는다.
2. 실제 빌드·테스트/스캔의 버전과 성공 여부를 확인한다. 서류 계획을 PASS로 바꾸지 않는다.
3. 고위험 미해결, 오탐 승인, 접근성 미검증, 스키마 롤백 위험을 구분한다.
4. 배포 대상/승인/시간·롤백 계획을 보고하되 배포는 승인 전 실행하지 않는다.
