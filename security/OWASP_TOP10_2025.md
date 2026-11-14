# OWASP_TOP10_2025.md — 개발·테스트 교차 점검

> OWASP Top 10:2025 공식 발표 분류. 상위 위험 인식·설계 보완용이며 49개 소스 약점·웹 28개 점검표를 완전히 대체하지 않는다.

| ID | 2025 범주 | 개발 중 점검 | 관련 예시 |
|---|---|---|---|
| A01 | Broken Access Control | 리소스 소유권/서버 인가, 수평·수직 권한 우회 | SC-19, IN, AE |
| A02 | Security Misconfiguration | 기본 권한, 보안 헤더/TLS/CORS, 디버그·민감 설정 | IL, DI, PL |
| A03 | Software Supply Chain Failures | 의존성/SBOM/패키지 저장소/배포무결성/시크릿 | SC-32 등 |
| A04 | Cryptographic Failures | 적정 암호·키·TLS·비밀번호 해시 | SC-21~24, SN |
| A05 | Injection | SQL/XSS/XML/LDAP/셸/템플릿 입력 경계 | SI, XS, LI, OC |
| A06 | Insecure Design | 비즈니스 남용·위협 모델·상태 전이·기본 거부 | PV, AU |
| A07 | Authentication Failures | 로그인/복구/세션/속도제한·다중인증 정책 | IA, PR, SC, SF |
| A08 | Software or Data Integrity Failures | 코드/데이터/서명/업데이트/역직렬화 무결성 | SC-27, SC-32, SC-43 |
| A09 | Security Logging and Alerting Failures | 보안 이벤트 기록·탐지·로그 노출 최소화 | IL, SC-36 |
| A10 | Mishandling of Exceptional Conditions | 실패 시 안전·예외 처리·자원 고갈·복구 | SC-36~38 |

**주의:** `SC-xx` 번호는 이 패키지 내부 식별자이며 공인 CWE/ASVS 번호가 아니다. 테이블의 연계는 참고용, 1:1 공식 매핑을 의미하지 않는다.

## 방법
1. 각 변경 범주에 대해 방어·실패 사례를 1개 이상 검토한다.
2. 인증/인가·소프트웨어 공급망·예외 처리 등 웹 28개 항목에서 빠질 수 있는 영역을 추가한다.
3. 설계·코드 리뷰·테스트 증빙을 분리 기록한다.

- OWASP 공식: https://top10.owasp.org/
- OWASP ASVS 5.0.0: https://asvs.owasp.org/
- OWASP WSTG 안정판: https://owasp.org/www-project-web-security-testing-guide/
