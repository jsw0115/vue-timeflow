# 운영 배포 시작 안내

[주제별 한국어 배포 가이드](../handbook/source/02-배포-가이드.md)와 [Word 문서](../handbook/02-배포-가이드.docx)에 실행 명령, 설정과 복구 절차를 정리했습니다.

- 화면 게시에는 [GitLab Pages](../gitlab-pages-guide.md)를 사용합니다. Pages는 Java와 MySQL을 실행하지 않으며 서버 기능에는 별도 HTTPS API가 필요합니다.
- 웹과 API 운영에는 [Linux 컨테이너 배포](gitlab-cicd.md)를 사용합니다. ENABLE_CONTAINER_BUILD=true로 이미지를 만들고 전체 SHA를 release.sh에 전달합니다.

현재 컨테이너 구성은 MySQL 8.4와 Redis 7.4를 사용합니다. 환경별 DB와 비밀키를 분리하고 배포 전에 백업합니다. Flyway 마이그레이션과 JPA validate를 사용하며 ddl-auto=update, 이력 삭제와 볼륨 삭제로 오류를 우회하지 않습니다.

직접 빌드하려면 backend에서 ./gradlew check bootJar, frontend에서 npm ci와 npm run build:web을 실행합니다. 실행용 JAR는 backend/build/libs/timeflow-api-0.1.0.jar이고 웹은 frontend/dist입니다. DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, CORS 출처와 HTTPS 프록시를 준비해야 합니다.

모바일과 Electron 설치 파일은 기본 Pages 및 Linux CI가 만들지 않습니다. 서명과 실제 기기 검증은 별도 절차입니다. 로컬 빌드 성공을 운영 배포 성공으로 기록하지 마세요.

