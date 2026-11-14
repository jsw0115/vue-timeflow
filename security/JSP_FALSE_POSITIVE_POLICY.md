# JSP_FALSE_POSITIVE_POLICY.md — JSP/JSTL/HTML 태그 오탐 처리 및 보안 예외 관리

## 핵심 결정
**JSP 태그를 모두 제거하거나 'JSP이므로 보안 진단 제외'로 처리하지 않는다.** 진단기가 JSP 태그를 공격 문자열로 잘못 인식한 사례와 실제 사용자 입력을 위험 문맥에 출력하는 코드를 구분한다. 오탐은 **항목 자체 삭제가 아닌 승인된 탐지 결과만 추적 가능한 상태로 제외**한다.

## 1. 자동 후보 분류해도 되는 정적 태그 유형
| 탐지 형태 | 기본 판단 | 사전 증빙 |
|---|---|---|
| `<%@ taglib ... %>`, `<%@ page ... %>` | 태그 지시문 그 자체는 보안 취약점이 아닐 가능성 | 파일·스캐너 rule ID·해당 라인과 실제 보안 Sink 관계 |
| `<c:if>`, `<c:choose>`, `<c:forEach>` | 제어문 태그 자체는 오탐 후보 | 조건/반복 결과가 위험 HTML/속성/JS로 출력되는지 확인 |
| `<fmt:message>`, `<spring:message>` | 정적 번역 키 출력만으로는 XSS 단정 불가 | 메시지 원본이 고정·신뢰 가능한지, 출력 문맥 확인 |
| `<jsp:include>`, `<%@ include %>` | 태그 사용 자체는 취약점이 아님 | 동적으로 선택되는 경로와 포함된 페이지 코드의 신뢰 경계 확인 |
| `<c:out value="${...}"/>` | HTML/XML 텍스트 출력에서 기본 escapeXml은 XSS 감소 | `escapeXml=false`가 없고 **HTML 텍스트 문맥**이며 다른 Sink로 연결되지 않음을 검증 |
| `<form:...>`, `<input>`, `<button>`, `<label>` | 폼 태그 존재 자체는 취약점 아님 | CSRF·서버 검증·권한·레이블/접근성 별도 평가 |

### 절대 자동 제외하면 안 되는 경우
- `<c:out escapeXml="false">`, `${userInput}`을 `onclick`, `<script>`, `style`, `href`, `src` 또는 HTML 문자열에 삽입한 곳.
- `innerHTML`, `document.write`, `insertAdjacentHTML`, 문자열 결합 이벤트 핸들러, 위험한 URL 스킴.
- `<jsp:include page="${...}">`처럼 사용자 입력이 경로나 리소스 선택에 영향 주는 곳.
- `<form:form>` 존재만으로 CSRF 토큰이 실제 검증된다고 주장하는 경우.
- HTML의 `<script>`, `<iframe>`, `<object>`, `<form>` 등 특정 태그 이름만으로 취약 또는 안전 판정을 하는 경우.
- 권한/세션/파일 업로드/다운로드·인증·인가·SQL·SSRF·XXE 등 서버 보안 문제는 JSP 마크업 여부와 무관.

## 2. 오탐 분류 절차
1. **탐지 ID·규칙·파일/라인·스캐너 버전·원본 메시지**를 확인한다.
2. 입력 데이터의 출처를 추적하여 외부 조작 가능 여부를 구분한다.
3. 데이터가 도달하는 출력 Sink(HTML 텍스트, 속성, JavaScript, CSS, URL, 서버 API)를 분류한다.
4. 사용한 이스케이프/인코딩이 실제 출력 문맥에 적합한지 확인한다. HTML 이스케이프가 JavaScript·URL 문맥까지 보장하지 않는다.
5. 허용된 시험 환경에서 최소 안전한 테스트 입력을 사용해 렌더링된 HTML/DOM·실행 결과를 확인한다.
6. 결과를 `TRUE_POSITIVE`, `FALSE_POSITIVE_CANDIDATE`, `FALSE_POSITIVE_APPROVED`, `NEEDS_REVIEW`, `N/A`로 분류한다.
7. **승인 전 자동 삭제/무시 처리 금지.** 검토 담당자, 이유, 증빙 위치, 만료일, 재검토 조건을 `security/templates/FALSE_POSITIVE_REGISTER.md`에 기록한다.

## 3. 개발 원칙 예시
```jsp
<%-- HTML 텍스트로 표시되는 신뢰되지 않은 값: 기본 escapeXml 활성 상태를 명시적으로 유지 --%>
<c:out value="${displayName}" />
```

```jsp
<%-- 잘못된 예: 신뢰되지 않은 값이 스크립트 코드 문자열의 일부로 들어감 --%>
<script>
  const name = '${displayName}';
</script>
```

위의 잘못된 예는 단순히 `<c:out>`로 감싼다고 완전히 안전해지는 것이 아니다. **데이터를 HTML `data-*` 속성에 안전하게 인코딩한 후 DOM API로 읽거나, 안전한 JSON 직렬화·스크립트 데이터 전달 방식을 프로젝트 표준에 맞게 설계**한다.

## 4. 자동 보조 도구
`scripts/triage_jsp_findings.py`는 CSV 보고서에서 정적 태그 관련 행을 **검토 후보**로 표기할 뿐 최종 제외하지 않는다. 이것은 템플릿 종류만으로 진짜 취약점을 완벽히 판별할 수 없기 때문이다.

```powershell
python scripts/triage_jsp_findings.py --input findings.csv --output jsp_triage.csv
```

입력 CSV 열: `finding_id,file,line,rule_id,snippet` (민감정보를 마스킹하여 저장). 실제 개인정보/인증값이 포함된 원본 스캐너 보고서는 외부 서비스로 보내지 않는다.

보조 스크립트는 기존 출력 파일을 덮어쓰지 않는다. 재검토할 때 새 출력 파일명을 사용한다. 필수 값이 누락되거나 열 수가 다른 CSV는 거부한다. 현재 Timebar Diary의 Vue 소스에는 JSP 전용 예외를 적용하지 않는다.

## 5. 명시 승인한 탐지 결과만 보고서에서 분리

1. `triage_jsp_findings.py` 출력의 `fingerprint`를 승인장부 CSV로 복사한다.
2. 담당자가 실제 데이터 흐름·렌더링 결과를 확인한 뒤 **승인장부에** `decision=FALSE_POSITIVE_APPROVED`, `reviewer`, `evidence`, `expires_on`을 기록한다.
3. `scripts/apply_approved_exclusions.py`가 **정확히 같은 원본 탐지 fingerprint**에 대해서만 `remaining.csv`와 `excluded.csv`로 나눈다. 원본 CSV는 수정하지 않는다.
4. 승인 유효성·기한·승인장부와 현재 스캔 결과의 일치 여부가 불충분하면 실행은 오류로 종료한다.
5. 제외된 행은 결과에서 완전히 사라지는 것이 아니라 별도 증빙 파일에 남는다. 스캐너에 독립된 suppress 설정이 필요하다면 해당 제품의 승인 프로세스를 준수한다.

승인장부 헤더는 `security/templates/APPROVED_EXCLUSIONS.example.csv`를 참고한다.
