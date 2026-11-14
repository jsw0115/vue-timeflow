# 릴리스 검토 진입점

[배포 계획](docs/deployment/release-plan.md), [GitLab·Linux](docs/deployment/gitlab-cicd.md), [Pages](docs/gitlab-pages-guide.md), [운영 매뉴얼](docs/operations/runbook.md)을 대상 환경에 맞춰 읽는다.

- Pages와 선택적 Linux 컨테이너, Capacitor·Electron 포장 구성을 구분한다. 구성 존재를 운영 배포·실기기 검증 완료로 표현하지 않는다.
- 정확한 변경·SHA·산출물, 빌드·테스트, DB 호환·백업·복구, 환경·비밀값 공급, 보안·접근성 미검증을 확인한다.
- [개발 보안 게이트](security/DEVELOPMENT_SECURITY_GATE.md)의 결과를 실제 증거와 연결한다. 미해결 위험과 후속 책임을 기록한다.
- 검증한 자체 변경의 로컬 커밋은 기존 AGENTS 규칙을 따른다. 푸시·배포·운영 DB 변경 권한을 로컬 커밋 권한으로 확대하지 않는다.
- 키트 적용 요청은 운영 배포 요청이 아니다. 실제 배포는 사용자가 지정한 대상과 승인 범위에서 수행한다.
