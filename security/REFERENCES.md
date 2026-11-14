# REFERENCES.md — 자료 근거, 우선순위, 주의사항

사용자 제공 ZIP의 참고 목록을 2026-11-14에 가져왔다. 아래 링크와 판본은 제공 자료가 제시한 출처이며 이번 설치에서 외부 원문의 최신성·내용을 독립 검증한 것은 아니다. 계약/감리 대상이라면 발주처 적용 판본과 공식 원문을 확인한다.

## 제공 자료에 포함된 6개 링크
1. 개인 블로그: 웹 취약점 진단 체크리스트(OWASP 2021 중심, 오래된 분류): https://velog.io/@suuung/%EC%9B%B9-%EC%B7%A8%EC%95%BD%EC%A0%90-%EC%A7%84%EB%8B%A8-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8
2. 웹 취약점 분류 소개(2023년 블로그): https://yang-wistory1009.tistory.com/200
3. KGcT 웹 취약점 진단 시험의 **28개 예시 항목**: https://kolas.kgct.or.kr/front/webtest
4. 과거 시큐어코딩 **43개 기준** 소개(현행 49개와 혼용 금지): https://plummmm.tistory.com/288
5. 행안부 2019년 SW 보안약점 진단가이드: https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000045&nttId=71950
6. KISA 2021년 SW 개발보안 가이드: https://www.kisa.or.kr/2060204/form?postSeq=5&lang_type=KO&page=1

## 공식/보완 기준
- 행안부 2021 소프트웨어 개발보안 가이드: https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000015&nttId=88956
- KISA 웹 등 기술적 취약점 상세 가이드 페이지: https://www.kisa.or.kr/2060204/form?postSeq=12&lang_type=KO&page=1
- OWASP Top 10:2025: https://top10.owasp.org/
- OWASP ASVS 5.0.0 (안정판): https://asvs.owasp.org/
- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- 국가표준 KWCAG 2.2(KS X OT0003:2022), 온라인 전사본: https://a11ykr.github.io/kwcag22/
- W3C WCAG 2.2 (보완 국제 기준, KWCAG 2.2와 **버전명이 같더라도 별개의 표준**): https://www.w3.org/TR/WCAG22/

## 판본 선택 주의
- 2019 행안부 공개물은 2021 소프트웨어 개발보안 가이드보다 오래되었다.
- 블로그의 43개는 당시 분류를 설명한다. 이 패키지의 **SW 49개**는 2021년 개정판을 기준으로 한다.
- 블로그 OWASP Top 10:2021 분류는 배경 자료로만 쓰고, 최신 교차검토는 **Top 10:2025**를 사용한다.
- KGcT 28개는 진단기관의 안내용 예시다. 대상 사업에서 요구하는 표준 점검 목록 수·중요도는 발주 문서를 따르며 자동으로 법적 요구사항이라고 주장하지 않는다.
- KWCAG 2.2의 33개(2022 국내 기준)와 WCAG 2.2(국제 기준)는 별개로 관리한다.
