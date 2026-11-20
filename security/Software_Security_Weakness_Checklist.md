# Software Security Weakness Checklist: 49 Source Review Items

> Technology: Spring Boot / Java / JSP / JavaScript  
> Prepared and official sources checked: **2026-11-09 (Asia/Seoul)**  
> Purpose: Review source, configuration, and execution paths; record findings and remediation.  
> Status: **Review preparation document**, not the results of an inspection of an actual project or running system.

## Contents

1. [Scope and use](#scope)
2. [Original report figures and interpretation notes](#original)
3. [Review workflow and searches](#workflow)
4. [Detailed checklist: 49 security items](#security)
5. [Implementation examples](#examples)
6. [Results and retest templates](#records)
7. [Official standards and sources](#sources)
8. [Translated source excerpt](#raw)

<a id="scope"></a>
## 1. Scope and Use

- Covers the 49 items in the user's Software Development Security Guide report. **Item numbers and original figures are unchanged. Names and narrative are English translations, not claims of official English terminology.**
- Includes search terms, procedures, vulnerable/safer examples, decision criteria, and record templates. This file supports independent review of the security scope.
- Original `0 / 0` figures do not constitute a Pass in the new review. Keep historical counts, new findings, and retests separate.
- The six web accessibility items are in `Web_Accessibility_Checklist.md`. Web security weaknesses such as SQL injection, XSS, and CSRF remain here because they belong to the supplied 49-item list.
- ASVS 5.0.0 provides supplementary verification guidance; it is not a one-to-one replacement for these 49 items. [Official ASVS][ASVS]

### 1.1 Review Setup

| Field | Value |
| --- | --- |
| Project / service / responsible organization | To be completed |
| Repository / branch / commit | To be completed |
| Scope and excluded paths / reasons | To be completed |
| JDK / Spring Boot / Spring Security / Servlet and JSTL versions | To be completed |
| Front end / templates / database / ORM / authentication | To be completed |
| Production profile / deployment / proxies and WAF / session store | To be completed |
| Applicable contract / organizational security policy / standard and version | To be completed |
| Tool / version / ruleset / execution date / unsupported items | To be completed |
| Assessor / reviewer / period / result baseline | To be completed |

### 1.2 Reading the Code Examples

- Examples are **excerpts comparing unsafe patterns with improvement approaches**. Add imports, classes, exception mapping, transactions, and input limits appropriate to the project. The snippets have not been compiled or integration-tested for the user's application.
- Java examples assume Java 17 or later. Spring examples assume Spring Security 6/7-style `SecurityFilterChain` and lambda configuration. Check APIs and support for the actual dependency versions.
- JSP `c:out` requires JSTL declarations. Select `jakarta.tags.core` or the legacy JSTL URI according to the deployment. Do not mix incompatible `javax.*` and `jakarta.*` APIs.
- Functions marked **pseudocode** or **project implementation required** are not standard APIs. A helper's name alone is not evidence of a security control.
- Code comments and illustrative messages have been translated. Comparison snippets are alternatives, not necessarily one compilable block.

<a id="original"></a>
## 2. Original Report Figures and Interpretation Notes

### 2.1 Report Identification and Notes

Translated headings: `1.3 Summary of Project Results by Inspection Item` / `Security Weakness Detections by Inspection Item`.  
Translated project label: `[Default Group] Next-Generation Financial Services Commission Information System Development Project (Business Communications and Meeting Body Management) (Round 3)`.  
The original wraps the round marker across two lines. The English appendix translates the provided excerpt; it does not present English wording as a verbatim original report.

> **R-01 — Standalone `5`, `6`, and `7`:** These appear around repeated report headings. They may be page numbers, but the original PDF was unavailable, so that interpretation is unconfirmed. Do not treat the first `5` as five total detections or alter the zero values in the 49 rows.
>
> **R-02 — Security counting units:** The original headers identify a cause-pattern count and a detection count. Deduplication rules, analyzed file counts, the tool/ruleset, and scan success were not provided. Preserve each `0 / 0` as reported.

### 2.2 The 49 Original Security Rows

Both numeric columns contain **historical report values**. Enter new decisions in Section 6. Names below are translated from the Korean source.

| No. | Translated original item | Original cause-pattern count | Original detection count | Detail ID |
| ---: | --- | ---: | ---: | --- |
| 1 | 1.1. SQL Injection | 0 | 0 | SEC-1.1 |
| 2 | 1.2. Code Injection | 0 | 0 | SEC-1.2 |
| 3 | 1.3. Path Manipulation and Resource Injection | 0 | 0 | SEC-1.3 |
| 4 | 1.4. Cross-Site Scripting | 0 | 0 | SEC-1.4 |
| 5 | 1.5. Operating System Command Injection | 0 | 0 | SEC-1.5 |
| 6 | 1.6. Upload of Files with Dangerous Types | 0 | 0 | SEC-1.6 |
| 7 | 1.7. Automatic Redirection to an Untrusted URL | 0 | 0 | SEC-1.7 |
| 8 | 1.8. Improper XML External Entity References | 0 | 0 | SEC-1.8 |
| 9 | 1.9. XML Injection | 0 | 0 | SEC-1.9 |
| 10 | 1.10. LDAP Injection | 0 | 0 | SEC-1.10 |
| 11 | 1.11. Cross-Site Request Forgery | 0 | 0 | SEC-1.11 |
| 12 | 1.12. Server-Side Request Forgery | 0 | 0 | SEC-1.12 |
| 13 | 1.13. HTTP Response Splitting | 0 | 0 | SEC-1.13 |
| 14 | 1.14. Integer Overflow | 0 | 0 | SEC-1.14 |
| 15 | 1.15. Improper Input Used in Security Decisions | 0 | 0 | SEC-1.15 |
| 16 | 1.16. Memory Buffer Overflow | 0 | 0 | SEC-1.16 |
| 17 | 1.17. Format String Injection | 0 | 0 | SEC-1.17 |
| 18 | 2.1. Critical Functionality Allowed Without Proper Authentication | 0 | 0 | SEC-2.1 |
| 19 | 2.2. Improper Authorization | 0 | 0 | SEC-2.2 |
| 20 | 2.3. Incorrect Permissions for Critical Resources | 0 | 0 | SEC-2.3 |
| 21 | 2.4. Use of Weak Cryptographic Algorithms | 0 | 0 | SEC-2.4 |
| 22 | 2.5. Unencrypted Sensitive Information | 0 | 0 | SEC-2.5 |
| 23 | 2.6. Hard-Coded Sensitive Information | 0 | 0 | SEC-2.6 |
| 24 | 2.7. Insufficient Cryptographic Key Length | 0 | 0 | SEC-2.7 |
| 25 | 2.8. Use of Inappropriate Random Values | 0 | 0 | SEC-2.8 |
| 26 | 2.9. Allowing Weak Passwords | 0 | 0 | SEC-2.9 |
| 27 | 2.10. Improper Digital Signature Verification | 0 | 0 | SEC-2.10 |
| 28 | 2.11. Improper Certificate Validation | 0 | 0 | SEC-2.11 |
| 29 | 2.12. Information Exposure Through Cookies Stored on the User's Disk | 0 | 0 | SEC-2.12 |
| 30 | 2.13. Critical System Information in Comments | 0 | 0 | SEC-2.13 |
| 31 | 2.14. Unsalted One-Way Hashing | 0 | 0 | SEC-2.14 |
| 32 | 2.15. Downloading Code Without Integrity Verification | 0 | 0 | SEC-2.15 |
| 33 | 2.16. Missing Limits on Repeated Authentication Attempts | 0 | 0 | SEC-2.16 |
| 34 | 3.1. Race Condition: Time of Check to Time of Use (TOCTOU) | 0 | 0 | SEC-3.1 |
| 35 | 3.2. Non-Terminating Loops or Recursive Functions | 0 | 0 | SEC-3.2 |
| 36 | 4.1. Information Exposure Through Error Messages | 0 | 0 | SEC-4.1 |
| 37 | 4.2. Missing Handling of Error Conditions | 0 | 0 | SEC-4.2 |
| 38 | 4.3. Improper Exception Handling | 0 | 0 | SEC-4.3 |
| 39 | 5.1. Null Pointer Dereference | 0 | 0 | SEC-5.1 |
| 40 | 5.2. Improper Resource Release | 0 | 0 | SEC-5.2 |
| 41 | 5.3. Use of Released Resources | 0 | 0 | SEC-5.3 |
| 42 | 5.4. Use of Uninitialized Variables | 0 | 0 | SEC-5.4 |
| 43 | 5.5. Deserialization of Untrusted Data | 0 | 0 | SEC-5.5 |
| 44 | 6.1. Data Exposure Caused by Incorrect Session Handling | 0 | 0 | SEC-6.1 |
| 45 | 6.2. Debug Code Left in the Application | 0 | 0 | SEC-6.2 |
| 46 | 6.3. Private Array Returned by a Public Method | 0 | 0 | SEC-6.3 |
| 47 | 6.4. Publicly Supplied Data Assigned to a Private Array | 0 | 0 | SEC-6.4 |
| 48 | 7.1. Security Decisions Based on DNS Lookups | 0 | 0 | SEC-7.1 |
| 49 | 7.2. Use of Vulnerable APIs | 0 | 0 | SEC-7.2 |

<a id="workflow"></a>
## 3. Review Workflow and Searches

### 3.1 Decision Rules

| Decision | Use when | Required evidence |
| --- | --- | --- |
| Not reviewed | Scope or data flow has not been examined | Planned scope |
| Needs verification | A candidate exists but reachability, controls, or runtime evidence are incomplete | Open questions and next checks |
| Fail | A security-control failure is confirmed | Code/configuration location, reachable flow, impact, reproduction |
| Pass | Controls work across the entire applicable reviewed scope | Scope, protected flows/settings, positive and negative tests |
| N/A | The feature, language construct, or execution path is absent from scope | Scope investigation and reviewer rationale |
| False positive | A specific tool alert is disproven | Alert ID, effective control, counterevidence; separate from the item decision |

A checked box `[x]` means **review and documentation completed**, not Pass. Accepting risk does not turn a failure into a pass. Track remediation separately as `Open / In progress / Awaiting retest / Resolved / Risk accepted`.

### 3.2 Review Sequence

1. Fix the source commit and deployment version. Inventory authentication boundaries, roles, sensitive data, external integrations, and JNI/native dependencies.
2. Include Java/JSP/JS, MyBatis XML, configuration, deployment files, dependency lockfiles, static assets, and production profiles. Record generated-file exclusions.
3. Search for **candidate locations**, then trace request parameters, headers, cookies, uploads, external APIs, and stored data to sensitive operations.
4. Verify actual execution of central filters, encoders, interceptors, method authorization, and exception paths. Client checks or a WAF alone do not establish source-level protection.
5. Use test accounts/data in a development or verification environment. Check normal, rejected, boundary, and exception cases, including roles and session isolation.
6. Link multiple locations to their root cause while keeping root-cause counts, code locations, and affected URLs separate.
7. Retest the fix commit under the same conditions and check normal-function regression. Do not close items without adequate evidence.

### 3.3 Read-Only Search Examples

Run from the repository root and adapt `src` to the project. Single quotes protect the expressions in PowerShell. Match counts are not vulnerability counts.

```powershell
# Candidate source, configuration, and deployment files.
rg --files -g '*.java' -g '*.jsp' -g '*.jspx' -g '*.tag' -g '*.js' -g '*.ts' -g '*.html' -g '*.xml' -g '*.yml' -g '*.yaml' -g '*.properties' -g 'pom.xml' -g '*gradle*' -g '*lock*' -g 'Dockerfile*' -g '!node_modules/**' -g '!target/**' -g '!build/**'

# Input sources.
rg -n -g '*.java' 'getParameter|getHeader|getCookies|@RequestParam|@PathVariable|@RequestBody|MultipartFile|@MessageMapping' src

# Injection and sensitive operations: review MyBatis ${} in context.
rg -n -g '*.java' -g '*.xml' 'createStatement|createNativeQuery|\$\{|Runtime\.getRuntime|ProcessBuilder|parseExpression|ObjectInputStream|XMLDecoder' src

# JSP/JavaScript output sinks.
rg -n -g '*.jsp' -g '*.tag' -g '*.js' -g '*.html' 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|<%=|escapeXml|window\.open' src

# Authentication, authorization, sessions, CSRF, and debugging.
rg -n 'SecurityFilterChain|securityMatcher|requestMatchers|permitAll|ignoringRequestMatchers|csrf|PreAuthorize|EnableMethodSecurity|HttpSession|ThreadLocal|management\.endpoints|h2\.console|include-stacktrace' src
```

`rg` may skip ignored or hidden files. Inventory `.gitignore`, external configuration/templates, and deployment paths separately. For secret-search evidence, record file/line/key names and masked details, not secret values. SCA, SAST, and runtime tests complement one another; none alone establishes overall security.

<a id="security"></a>
## 4. Detailed Checklist: 49 Security Items

Headings translate the supplied item names. Every historical cause-pattern/detection count is **0 / 0**; every new decision starts as **Not reviewed**.

### SEC-1.1 — SQL Injection

- [ ] **Search:** `Statement`, `createNativeQuery`, `JdbcTemplate`, `@Query`, MyBatis `${...}`, SQL string concatenation.
- [ ] **Procedure:** Trace request values, cookies, and stored data into queries and verify actual parameter binding. Select structural components that cannot be bound, such as column or table names, from a fixed server-side allowlist. Test quotation marks and boundary values without changing query structure.
- **Decision:** Fail if external values can change SQL structure. Pass when values are bound and dynamic structure comes only from fixed server-side choices. Using an ORM alone is insufficient. [SQL injection prevention][SQL]

```java
// Vulnerable: name is external input.
stmt.executeQuery("SELECT id FROM member WHERE name='" + name + "'");
// Safer: bind values.
jdbcTemplate.queryForList("SELECT id FROM member WHERE name = ?", name);
```

Use `#{name}` for MyBatis values. Replacing `${orderBy}` with `#{orderBy}` does not implement column selection for sorting; select the allowed column in server code.

### SEC-1.2 — Code Injection

- [ ] **Search:** `eval`, `new Function`, `ScriptEngine.eval`, `GroovyShell`, `parseExpression`, dynamic template compilation.
- [ ] **Procedure:** Trace input interpreted as executable code, SpEL, or template syntax. Include configuration administrators and database content in the trust-boundary review. Verify rejection of unsupported operation names.
- **Decision:** Fail if external input reaches an evaluator and permits arbitrary behavior. Pass when the application selects fixed operations or parses data without executing it. String replacement or renaming the evaluator is insufficient.

```javascript
// Vulnerable.
const result = eval(userText);
// Safer: parse JSON data, then validate its schema and size.
const data = JSON.parse(userText);
if (data.action !== "preview") throw new Error("Unsupported operation");
```

### SEC-1.3 — Path Manipulation and Resource Injection

- [ ] **Search:** `Paths.get`, `Path.resolve`, `File`, `ResourceLoader`, `ZipEntry`, download paths, JSP include paths.
- [ ] **Procedure:** Check whether user filenames or archive entries escape the allowed area through parent paths, absolute paths, other drives, UNC paths, or symbolic links. Trace reads, writes, and archive extraction separately. Verify authorization for the selected file.
- **Decision:** Fail if input selects files or resources outside the permitted area. Pass when server-issued identifiers resolve to authorized resources within enforced boundaries. `normalize()` alone does not address symbolic links or TOCTOU.

```java
// Vulnerable.
Path target = uploadRoot.resolve(request.getParameter("name"));
// Safer for an existing file: assumes a trusted, read-only root.
Path base = uploadRoot.toRealPath();
Path candidate = base.resolve(fileName).toRealPath();
if (!candidate.startsWith(base)) throw new SecurityException("Disallowed path");
// Separately check file authorization and replacement before/during opening.
```

For writes, use server-generated names, directories that attackers cannot modify, atomic creation, and secure directory handles where needed. [Java security guidance][JAVA]

### SEC-1.4 — Cross-Site Scripting

- [ ] **Search:** JSP `${...}`, `<%=...%>`, `c:out escapeXml="false"`, `innerHTML`, `insertAdjacentHTML`, `document.write`, URL attributes, event handlers.
- [ ] **Procedure:** Review reflected, stored, and DOM-based XSS. Identify the final context: HTML text, attributes, JavaScript, CSS, or URLs. Check later string reconstruction and transformations applied after HTML sanitization.
- **Decision:** Fail if external values enter an executable context. Pass when context-appropriate output handling and safe DOM APIs prevent execution. CSP is a supplementary control. [XSS prevention][XSS]

```jsp
<%-- Vulnerable: JSP EL generally does not automatically HTML-escape output. --%>
<div>${param.memo}</div>
<%-- Safer for HTML text content only. --%>
<div><c:out value="${param.memo}" /></div>
```

```javascript
// Vulnerable.
output.innerHTML = userText;
// Safer for displaying text.
output.textContent = userText;
```

Do not use `c:out` as a substitute for JavaScript/event-handler protection or URL scheme validation. Rich-text functionality needs a maintained HTML sanitizer and an explicit allowlist policy.

### SEC-1.5 — Operating System Command Injection

- [ ] **Search:** `Runtime.exec`, `ProcessBuilder`, `cmd /c`, `powershell`, `sh -c`, external conversion tools.
- [ ] **Procedure:** Inspect control over executables, shell strings, arguments, working directories, and environment variables. Even without a shell, check whether input becomes an unintended command-line option. Limit process duration and output volume.
- **Decision:** Fail if external input changes the command, options, or executable. Pass when a library API replaces command execution or a fixed executable receives strictly validated arguments. [Command injection defense][CMD]

```java
// Vulnerable.
new ProcessBuilder("sh", "-c", "cat " + userPath).start();
// Safer: a small text file whose path and authorization satisfy SEC-1.3.
String content = Files.readString(validatedPath, StandardCharsets.UTF_8);
```

### SEC-1.6 — Upload of Files with Dangerous Types

- [ ] **Search:** `MultipartFile`, `transferTo`, `getOriginalFilename`, `getContentType`, `multipart`, publicly served upload directories.
- [ ] **Procedure:** Verify an extension allowlist, actual file structure/content, limits on size/count/decompression, generated filenames, non-executable storage, and download authorization. Identify checks that trust only MIME headers or extensions. For images, assess re-encoding, active content, and parser risks.
- **Decision:** Fail if uploaded content enables execution, script activity, or resource exhaustion. Pass when content validation, isolation, and access controls are verified. [File upload guidance][UPLOAD]

```text
Vulnerable Java pattern:
  file.transferTo(webRoot.resolve(file.getOriginalFilename()));
Safer approach (pseudocode; project implementation required):
  Read within a size limit -> parse/validate an allowed format
  -> re-encode and scan for malware where appropriate
  -> atomically store under a server-generated ID in private, non-executable storage
  -> expose only through an authorized download API
```

### SEC-1.7 — Automatic Redirection to an Untrusted URL

- [ ] **Search:** `sendRedirect`, `redirect:`, `location.href`, `location.assign`, `returnUrl`, `next`, `forward:`.
- [ ] **Procedure:** Determine whether users control the browser destination. Examine scheme-relative URLs, encodings, backslashes, user-info syntax, and misleading host prefixes. Recheck authorization for internal forwarding targets.
- **Decision:** Fail if users can select arbitrary external destinations or unauthorized functions. Pass when the server maps destination identifiers to fixed locations. [Redirect defense][REDIRECT]

```java
// Vulnerable.
return "redirect:" + next;
// Safer: choose only fixed internal paths.
Map<String, String> destinations = Map.of("home", "/home", "profile", "/profile");
return "redirect:" + destinations.getOrDefault(next, "/home");
```

### SEC-1.8 — Improper XML External Entity References

- [ ] **Search:** `DocumentBuilderFactory`, `SAXParserFactory`, `XMLInputFactory`, `TransformerFactory`, `SchemaFactory`, JAXB.
- [ ] **Procedure:** Inspect DTD, external entity, external schema, and XSLT access settings for every parser and transformation path. In a test environment, verify that external references and entity expansion are rejected. Do not ignore configuration failures.
- **Decision:** Fail if XML input causes unauthorized file access, outbound communication, or excessive expansion. Pass when each applicable parser restricts those features and fails safely. [XXE prevention][XXE]

```java
// Potentially vulnerable: untrusted XML parsed with defaults only.
DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(input);
// Safer: use the factory defined in Section 5.2.
DocumentBuilderFactory hardened = newSecureDocumentBuilderFactory();
hardened.newDocumentBuilder().parse(input);
```

Defaults vary by JDK and implementation, so the first line alone does not prove a vulnerability. `newSecureDocumentBuilderFactory` is the example helper defined in Section 5.2.

### SEC-1.9 — XML Injection

- [ ] **Search:** XML string concatenation, `StringBuilder`, `XPath.compile`, `XPath.evaluate`, dynamic XPath conditions.
- [ ] **Procedure:** Distinguish XML text, attributes, element names, and XPath expressions. Check whether input changes document structure or query conditions. Review XML generation and parser security separately.
- **Decision:** Fail if external values alter XML structure or XPath expressions. Pass when structure is fixed and text APIs or XPath variable binding handle values.

```java
// Vulnerable.
String xml = "<name>" + name + "</name>";
// Safer: XMLStreamWriter serializes text content.
writer.writeStartElement("name");
writer.writeCharacters(name);
writer.writeEndElement();
```

Do not use external input directly as an element name. Supply XPath variables through an appropriate `XPathVariableResolver`.

### SEC-1.10 — LDAP Injection

- [ ] **Search:** `DirContext.search`, `LdapTemplate`, `LdapQueryBuilder`, concatenated LDAP filters, DN construction.
- [ ] **Procedure:** Distinguish filter values from DN components. Verify that special characters cannot change search scope. Fix or allowlist the server URL and search base.
- **Decision:** Fail if input changes filter or DN structure. Pass when binding or encoding matches the specific context. [LDAP injection prevention][LDAP]

```java
// Vulnerable.
ctx.search(base, "(uid=" + uid + ")", controls);
// Safer: JNDI overload with filter argument binding.
ctx.search(base, "(uid={0})", new Object[]{uid}, controls);
```

For DNs, consider DN-specific APIs such as `LdapName` and `Rdn`; do not reuse filter escaping.

### SEC-1.11 — Cross-Site Request Forgery

- [ ] **Search:** `csrf.disable`, `ignoringRequestMatchers`, state-changing GET requests, cookie authentication, forms/AJAX, logout.
- [ ] **Procedure:** Find every state-changing route authenticated with credentials the browser attaches automatically, including session cookies and Basic authentication. Verify rejection of missing/invalid CSRF tokens and acceptance of valid requests. CORS configuration does not by itself solve CSRF.
- **Decision:** Fail if a third-party request can cause a change using automatically transmitted credentials. Pass when token checks or equivalent controls actually apply. Justify N/A for a cookie-free Bearer API using its real credential transport. [Spring CSRF][SPRING-CSRF]

```java
// Vulnerable configuration example for session-authenticated state changes.
http.csrf(csrf -> csrf.disable());
// Safer: retain CSRF protection.
http.csrf(Customizer.withDefaults());
```

See Section 5.1 for JSP/JavaScript token submission. Verify token storage, deferred loading, and refresh behavior for the actual Spring version. SameSite alone does not justify a pass.

### SEC-1.12 — Server-Side Request Forgery

- [ ] **Search:** `RestClient`, `RestTemplate`, `WebClient`, `HttpClient`, `URL.openConnection`, remote images/documents, webhooks, PDF renderers.
- [ ] **Procedure:** Trace schemes, hosts, ports, full destinations, and redirects. Check loopback, private networks, link-local addresses, metadata endpoints, IPv6, DNS changes, and proxies. Verify that validation and actual connections enforce the same destination policy.
- **Decision:** Fail if users can make the server access disallowed destinations. Pass when fixed destinations, redirect restrictions, actual connection controls, and network egress controls are verified. [SSRF prevention][SSRF]

```java
// Vulnerable.
restTemplate.getForObject(userUrl, String.class);
// Part of a safer approach: do not derive the destination URL from user input.
URI endpoint = URI.create("https://api.example.com/catalog");
HttpClient client = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NEVER)
    .connectTimeout(Duration.ofSeconds(3)).build();
```

`example.com` is illustrative. Use actual approved destinations and network policy. Hostname string validation alone does not prevent DNS rebinding. Also limit read time and response size.

### SEC-1.13 — HTTP Response Splitting

- [ ] **Search:** `setHeader`, `addHeader`, `Content-Disposition`, `Location`, hand-built HTTP strings or responses.
- [ ] **Procedure:** Trace external header values, CR/LF handling, decoding order, and proxy/container rejection behavior. Dedicated header builders do not eliminate the need to validate the original value policy.
- **Decision:** Fail if input changes header or response boundaries. Pass when header names are fixed, control characters are rejected, appropriate APIs are used, and runtime behavior is verified. Record container-level blocking when applicable.

```java
// Potentially vulnerable.
response.setHeader("X-Display-Name", input);
// Safer: allow only the ASCII characters needed by this custom header.
if (input == null || !input.matches("[A-Za-z0-9 _.-]{1,80}"))
    throw new IllegalArgumentException("Invalid header value");
response.setHeader("X-Display-Name", input);
```

### SEC-1.14 — Integer Overflow

- [ ] **Search:** length, price, and count arithmetic; integer addition/multiplication/casts; `parseInt`, `intValue`, JavaScript `Number`.
- [ ] **Procedure:** Check negatives, extrema, and narrowing after multiplication. Restrict business ranges before calculation and detect overflow in the operation itself. For JavaScript, verify `Number.isSafeInteger` and business limits.
- **Decision:** Fail if overflow bypasses amount, permission, or length checks. Pass when boundary cases are rejected and arithmetic errors are handled safely. [Java Math][MATH]

```java
// Vulnerable: multiplication occurs as int before conversion.
long total = quantity * unitPrice;
// Safer: validate business ranges first; map arithmetic errors appropriately.
long totalChecked = Math.multiplyExact((long) quantity, (long) unitPrice);
int bounded = Math.toIntExact(totalChecked); // Only if int is required.
```

### SEC-1.15 — Improper Input Used in Security Decisions

- [ ] **Search:** `role`, `isAdmin`, `ownerId`, `tenantId`, `price`, `approved`, automatic DTO binding, `BeanUtils.copyProperties`.
- [ ] **Procedure:** Determine whether client-supplied roles, ownership, approval state, or prices drive security decisions. Hidden and disabled fields are untrusted. Check allowed-field DTOs, server lookups, and recalculation.
- **Decision:** Fail if changing request data changes permissions or protected workflow state. Pass when decisions use the trusted authenticated principal and server state. [Authorization guidance][AUTHZ]

```java
// Vulnerable.
if ("ADMIN".equals(request.getParameter("role"))) deleteAll();
// Safer: requires enabled method security and calls through the Spring proxy.
@PreAuthorize("hasRole('ADMIN')")
public void deleteAll() { /* Actual deletion service. */ }
```

### SEC-1.16 — Memory Buffer Overflow

- [ ] **Search:** `native`, JNI/JNA, `Unsafe`, external C/C++ libraries, direct memory, image/archive parsers.
- [ ] **Procedure:** In native code, inspect copy length, actual buffer capacity, terminator space, and size arithmetic. Do not equate Java array or `ByteBuffer` bounds exceptions with native memory corruption.
- **Decision:** Fail if a native write can cross buffer boundaries. A pass needs evidence for native implementations and libraries. N/A may be appropriate for a path proven to use only managed code. [Java/JNI guidance][JAVA]

```text
Vulnerable native-integration pattern (pseudocode):
  nativeCopy(data, data.length) // No capacity check.
Safer approach (pseudocode):
  Limit input length at the Java boundary
  + recheck actual destination capacity and size arithmetic inside native code
  + return an error without copying when capacity would be exceeded
```

### SEC-1.17 — Format String Injection

- [ ] **Search:** `String.format`, `printf`, `Formatter`, `String.formatted`, native `printf`-family APIs.
- [ ] **Procedure:** Identify externally controlled format strings. For Java, assess exceptions and excessive allocation from format/width directives; distinguish native memory read/write effects. Verify fixed formats and input length limits.
- **Decision:** Fail if external values interpreted as format controls cause a security impact. Pass when the format is constant and input is only a data argument. Do not describe Java behavior as identical to C memory-write vulnerabilities.

```java
// Potentially vulnerable.
String message = String.format(userFormat, value);
// Safer: userText has an enforced maximum length.
String messageSafe = String.format("User input: %s", userText);
```

### SEC-2.1 — Critical Functionality Allowed Without Proper Authentication

- [ ] **Search:** `SecurityFilterChain`, `securityMatcher`, `requestMatchers`, `permitAll`, `web.ignoring`, administration, download, and Actuator routes.
- [ ] **Procedure:** Call critical functions as an anonymous user and with expired or tampered authentication. Inspect filter-chain order, unmatched routes, alternative HTTP methods, and internal APIs.
- **Decision:** Fail if anonymous users can execute critical functions. Pass when server-side authentication covers every entry point and failure has no side effects. [Spring method security][SPRING-METHOD]

```java
// Vulnerable configuration example.
http.authorizeHttpRequests(a -> a.anyRequest().permitAll());
// Safer: explicitly identify public routes; authenticate all others.
http.authorizeHttpRequests(a -> a
    .requestMatchers("/login", "/assets/**").permitAll()
    .anyRequest().authenticated());
```

This configuration does not establish object-level or business authorization. Review the next item as well.

### SEC-2.2 — Improper Authorization

- [ ] **Search:** `findById`, `deleteById`, role checks, owner/department/tenant predicates, `@PreAuthorize`, batch queries/downloads.
- [ ] **Procedure:** Request the same object ID as another user with the same role, a lower-privilege user, and a user from another tenant. Distinguish hiding UI buttons from API authorization. Inspect proxy-bypassing self-invocation and ownership changes at update/delete time.
- **Decision:** Fail for horizontal or vertical privilege escalation or cross-tenant access. Pass when every action checks subject, object, and operation permissions. [Authorization guidance][AUTHZ]

```java
// Vulnerable: checks only that the ID exists.
return repository.findById(documentId).orElseThrow();
// Safer: restrict object scope using a trusted authenticated user ID.
return repository.findByIdAndOwnerId(documentId, trustedUserId).orElseThrow();
```

`findByIdAndOwnerId` is an example project repository method. Explicitly extend the policy for administrators, shared documents, or tenant-specific rules.

### SEC-2.3 — Incorrect Permissions for Critical Resources

- [ ] **Search:** file ACLs, `setReadable/setWritable`, upload/backup directories, database accounts, public storage, `static`, container users.
- [ ] **Procedure:** Inspect actual production permissions on critical files, secrets, logs, backups, and databases. Compare application-account privileges with the minimum required and with access available to other users/services.
- **Decision:** Fail if unauthorized subjects can read, modify, or execute critical resources. Pass when least privilege is verified in deployment. Source code alone cannot establish filesystem ACLs or cloud policies.

```java
// Vulnerable intent: make a file writable by all users.
file.setWritable(true, false);
// Safer on a POSIX-capable filesystem: specify permissions at creation.
Files.createFile(path,
    PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
```

On Windows, inspect NTFS ACLs and service accounts instead of applying the POSIX example directly. Restrict the parent directory as well.

### SEC-2.4 — Use of Weak Cryptographic Algorithms

- [ ] **Search:** `DES`, `RC4`, `MD5`, `SHA1`, `AES/ECB`, custom cryptography, `Cipher.getInstance`.
- [ ] **Procedure:** Distinguish confidentiality, integrity, signatures, and password storage. Review algorithms, modes, nonces/IVs, authentication-tag validation, and key storage/rotation. Separate non-security checksums from security-sensitive hashing.
- **Decision:** Fail when an algorithm, mode, or usage is unsuitable for its security purpose. Pass when a vetted implementation and policy-appropriate settings are verified. [Cryptographic storage][CRYPTO]

```java
// Vulnerable.
Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
// Part of a safer approach.
Cipher aead = Cipher.getInstance("AES/GCM/NoPadding");
```

Changing the algorithm name alone is insufficient. Never reuse a GCM nonce under the same key, and do not use plaintext when tag verification fails. Apply SEC-2.14 to passwords instead of reversible encryption.

### SEC-2.5 — Unencrypted Sensitive Information

- [ ] **Search:** HTTP URLs, sensitive database columns, logs/dumps/backups, token output, `localStorage`, personal data in files.
- [ ] **Procedure:** Map data in storage, transport, and logs, including internal hops after TLS termination, backups, queues, and browser storage. Check separation of access to encryption keys and protected data.
- **Decision:** Fail if information requiring protection is exposed in plaintext. Pass when encryption, data minimization, and masking follow the data classification. Base64 is not encryption. [Cryptographic storage][CRYPTO]

```text
Vulnerable Java:
  log.info("password={}, token={}", password, token);
Safer Java:
  log.info("Authentication failed requestId={}", trustedRequestId);
Storage approach (pseudocode):
  Sensitive data -> authenticated encryption with managed keys -> restricted storage
```

### SEC-2.6 — Hard-Coded Sensitive Information

- [ ] **Search:** `password`, `secret`, `apiKey`, `privateKey`, database URLs, PEM, JavaScript bundles, test settings, Git history.
- [ ] **Procedure:** Check code, resources, images, and deployment artifacts for actual credentials. After externalization, review logs, processes, configuration APIs, and fallback defaults for exposure.
- **Decision:** Fail if actual secrets are fixed in a repository or deployment artifact. Pass when access-controlled secret storage supplies them and missing secrets prevent startup. Replace/revoke exposed secrets in addition to removing them.

```java
// Vulnerable pattern when an actual secret is embedded in source.
String key = "example-hardcoded-secret";
// Part of a safer approach: secret store injects the value; do not log it.
String keyFromEnv = Objects.requireNonNull(System.getenv("SERVICE_API_KEY"));
if (keyFromEnv.isBlank()) throw new IllegalStateException("Missing secret configuration");
```

### SEC-2.7 — Insufficient Cryptographic Key Length

- [ ] **Search:** `KeyPairGenerator.initialize`, `KeyGenerator.init`, `SecretKeySpec`, certificate public keys, hard-coded sizes.
- [ ] **Procedure:** Review algorithm-specific strength, generated/imported key sizes, certificate chains, and intended lifetime. Do not compare RSA and ECC bit counts directly.
- **Decision:** Fail for keys weaker or shorter than the applicable policy permits. Pass when strength matches purpose, algorithm, and retention period. Supplementary guidance includes at least 128-bit AES and at least 2048-bit RSA, subject to longer-term protection policies. [Cryptographic storage][CRYPTO]

```java
// Vulnerable.
rsaGenerator.initialize(1024);
// Safer example: 3072-bit RSA after checking policy and interoperability.
rsaGenerator.initialize(3072, new SecureRandom());
```

This example is neither the sole valid size for every environment nor a guarantee of long-term post-quantum security.

### SEC-2.8 — Use of Inappropriate Random Values

- [ ] **Search:** `Random`, `Math.random`, `ThreadLocalRandom`, time-based seeds, token/OTP/nonce generation.
- [ ] **Procedure:** Separate non-security randomness, such as animation, from authentication randomness. Check predictable seeds, restart collisions, token length, expiry, single use, and storage.
- **Decision:** Fail if tokens or keys are predictable. Pass when a cryptographically secure generator supplies enough entropy for the purpose. [Java security guidance][JAVA]

```java
// Vulnerable password-reset token example.
String token = Long.toString(new Random().nextLong());
// Safer: a token with 256 bits of random input.
byte[] bytes = new byte[32];
new SecureRandom().nextBytes(bytes);
String safeToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
```

Do not seed `SecureRandom` with a constant or time value. Avoid logging raw tokens and enforce expiry and replay prevention.

### SEC-2.9 — Allowing Weak Passwords

- [ ] **Search:** registration/change/reset policies, `minLength`, password regexes, default passwords, server checks, client-only checks.
- [ ] **Procedure:** Verify length and breached/common-password blocking on every setting/change route. Record Unicode, whitespace, long-input handling, full-value comparison, truncation, and MFA status.
- **Decision:** Fail if users can bypass the agreed policy or choose easily guessed passwords. Pass when server-side policy is enforced consistently.

```text
Vulnerable pattern (pseudocode):
  Browser checks only eight characters; server stores the value without validation.
Safer approach (pseudocode; project implementation required):
  Server checks minimum length for the authentication mode
  + blocks breached/common passwords
  -> verifies maximum length and character handling
  -> stores using an adaptive password hash
```

**Current supplementary guidance:** NIST SP 800-63B-4 requires at least 15 characters for a single-factor password and at least eight when used as part of MFA, and recommends allowing a maximum length of at least 64 characters. It prohibits arbitrary character-composition rules and unsupported periodic changes, while requiring changes when compromise is evidenced. This summarizes U.S. digital identity guidance; it does not automatically replace Korean contracts or organizational policy. [NIST password verification][NIST]

### SEC-2.10 — Improper Digital Signature Verification

- [ ] **Search:** `Signature.verify`, decode-only JWS/JWT processing, `alg`, XML signatures, update signatures.
- [ ] **Procedure:** Verify trusted issuer keys, allowed algorithms, equivalence between signed and processed data, and failure branches. For JWTs, also validate issuer, audience, expiry, and intended use.
- **Decision:** Fail if verification results are ignored or attacker-provided keys/algorithms are trusted without validation. Pass when trust and verification targets are established and failures are rejected.

```java
// Vulnerable: ignores the return value.
signature.verify(signatureBytes);
process(payload);
// Safer: assumes initVerify(trustedPublicKey) and update(payload) were performed.
if (!signature.verify(signatureBytes)) throw new SecurityException("Signature verification failed");
process(payload);
```

These are alternative flows, not one sequence to execute. Inspect key trust and algorithm configuration separately.

### SEC-2.11 — Improper Certificate Validation

- [ ] **Search:** empty `checkServerTrusted`, `TrustAll`, `NoopHostnameVerifier`, unconditional `true` in `HostnameVerifier`, custom `SSLContext`.
- [ ] **Procedure:** Check certificate chains, trust stores, expiry, and hostname matching. Trust only the intended private CA where applicable. Verify connection failure against test servers with expired, untrusted, or wrong-host certificates.
- **Decision:** Fail if bypasses allow an invalid server to be trusted. Pass when chain and hostname validation apply. Review revocation checks according to policy and the PKI environment.

```java
// Vulnerable.
HttpsURLConnection.setDefaultHostnameVerifier((host, session) -> true);
// Safer: retain the JDK's default chain and hostname validation.
HttpClient client = HttpClient.newBuilder().build();
```

Also verify that global properties, custom TrustManagers, and proxies have not changed validation behavior.

### SEC-2.12 — Information Exposure Through Cookies Stored on the User's Disk

- [ ] **Search:** `Cookie`, `ResponseCookie`, `Set-Cookie`, `document.cookie`, `Max-Age`, `Expires`, remember-me functionality.
- [ ] **Procedure:** Inspect contents, lifetime, scope, `Secure`, `HttpOnly`, and `SameSite`. Check for passwords, personal information, or trusted authorization data, and for reuse after logout. A signed JWT payload is not necessarily encrypted.
- **Decision:** Fail if persistent cookies expose sensitive data. Pass when only necessary opaque tokens are used and server-side expiry, revocation, and authorization are enforced. Browser session restoration may retain session cookies, so server expiry remains necessary.

```java
// Vulnerable.
response.addCookie(new Cookie("password", password));
// Safer example: server-managed random token, without persistent Max-Age.
ResponseCookie cookie = ResponseCookie.from("sid", randomSessionToken)
    .httpOnly(true).secure(true).sameSite("Lax").path("/").build();
response.addHeader("Set-Cookie", cookie.toString());
```

Configure actual Spring session cookies through the framework rather than creating a duplicate `sid`. Select SameSite together with external login flows and CSRF requirements. [Spring sessions][SPRING-SESSION]

### SEC-2.13 — Critical System Information in Comments

- [ ] **Search:** accounts, passwords, internal addresses, or bypass instructions in Java/JSP/JS/HTML comments; TODOs; source maps; bundles.
- [ ] **Procedure:** Inspect returned HTML, JavaScript, and source maps as well as repositories. Distinguish server-side JSP comments from HTML comments delivered to browsers.
- **Decision:** Fail when comments expose important information to accessible audiences. Pass after removal/replacement of secrets and verification of deployment artifacts.

```jsp
<%-- Vulnerable practice: placing real production secrets in comments. --%>
<!-- Production account/password: [illustrative placeholder] -->
<%-- Safer: record purpose and issue references without secrets. --%>
<%-- AUTH-123: see the authorization policy change record. --%>
```

Moving a secret into a server-only comment does not remove the repository's hard-coded-secret issue.

### SEC-2.14 — Unsalted One-Way Hashing

- [ ] **Search:** password use of `MessageDigest`, `SHA-256`, `MD5`, fixed salts, `NoOpPasswordEncoder`, `PasswordEncoder` settings.
- [ ] **Procedure:** Verify that identical passwords stored for two accounts produce different hashes. Review per-password random salts, adaptive cost, algorithm identification/upgrades, and verification APIs. Adding a salt to a fast hash alone is insufficient for password storage.
- **Decision:** Fail for unsalted password hashes or inappropriate fast hashing. Pass when a vetted password-specific algorithm, cost, and salt handling are verified. [OWASP password storage][PASSWORD] · [Spring PasswordEncoder][SPRING-PASSWORD]

```java
// Vulnerable pattern: plain SHA-256(password).
byte[] hash = MessageDigest.getInstance("SHA-256")
    .digest(password.getBytes(StandardCharsets.UTF_8));
// Safer example: Argon2id; measure and tune cost for the server.
PasswordEncoder encoder = new Argon2PasswordEncoder(16, 32, 1, 19456, 2);
String stored = encoder.encode(password);
boolean matches = encoder.matches(password, stored);
```

Check the cryptographic provider dependency required by this Spring implementation. `19456` is an illustrative memory cost in KiB; validate performance under production concurrency. Let the encoder generate the salt. Ordinary file-integrity hashes have a different purpose and should not be judged as password storage.

### SEC-2.15 — Downloading Code Without Integrity Verification

- [ ] **Search:** remote scripts, automatic updates, `URLClassLoader`, download-then-execute flows, CDN `<script>` elements, dynamic plugins.
- [ ] **Procedure:** Trace download through execution. Verify trusted signatures/hashes obtained through an independently trusted path, version pinning, rollback protection, and no execution after failure. Fetching a file and its hash from the same untrusted location is insufficient.
- **Decision:** Fail if modified code can execute without verification. Pass when a trusted reference verifies the exact file subsequently executed.

```text
Vulnerable (pseudocode): download(url) -> loadAndExecute(file)
Safer (pseudocode; project implementation required):
  Verify a signed manifest using a pinned publisher public key
  -> check version, expiry, and approved hash
  -> compare downloaded bytes with the hash
  -> execute the verified file while preventing replacement
```

For fixed external browser scripts, consider SRI generated from the actual file and appropriate `crossorigin`. Never copy a placeholder hash into production.

### SEC-2.16 — Missing Limits on Repeated Authentication Attempts

- [ ] **Search:** login, OTP, password reset, API-key authentication, failure counters, `rateLimit`, lockout/retry settings.
- [ ] **Procedure:** Cover all authentication routes. Check limits by account/source/device, shared state across nodes, atomic counters under concurrency, delays, and recovery. Verify that new sessions or source-address changes do not trivially bypass controls.
- **Decision:** Fail if repeated guessing is not effectively limited. Pass when agreed limits, delays, lockout, or additional authentication apply consistently on the server. Also assess account-lockout denial of service. [NIST authentication limits][NIST]

```text
Vulnerable (pseudocode): authenticate(id, password) // Unlimited attempts.
Safer (pseudocode; project implementation required):
  Check distributed atomic attempt limits -> authenticate
  -> accumulate failures and apply delays/protection
  -> reset counters after success according to policy
```

Do not present one fixed attempt count as a universal legal requirement. Record the authentication method, risk, and policy supporting the threshold.

### SEC-3.1 — Race Condition: Time of Check to Time of Use (TOCTOU)

- [ ] **Search:** `exists` followed by create/open, balance read then debit, authorization then modification, `synchronized`, database locking/version checks.
- [ ] **Procedure:** Determine whether another request/process can modify a resource between checking and using it. Include multiple instances, file replacement, and symbolic links. Reproduce concurrent requests and inspect failure handling.
- **Decision:** Fail if races permit unauthorized modification, duplicate processing, or file access. Pass when atomic operations or suitable transactions/locking preserve the invariant. JVM-local `synchronized` does not protect multiple servers.

```java
// Vulnerable: race between checking and creating.
if (!Files.exists(path)) Files.writeString(path, content);
// Safer: atomically create in a trusted directory; fail if the file exists.
Files.writeString(path, content, StandardOpenOption.CREATE_NEW,
    StandardOpenOption.WRITE);
```

`CREATE_NEW` addresses the existence-check race. Parent-directory replacement, permissions, and object authorization still require separate controls.

### SEC-3.2 — Non-Terminating Loops or Recursive Functions

- [ ] **Search:** `while(true)`, retries, recursion, cyclic graphs, input-controlled counts/depth, complex regular expressions.
- [ ] **Procedure:** Inspect termination conditions, decreasing state, maximum attempts, depth, and duration. Check termination for cycles, failure responses, and stalled connections. Apply both size and time limits.
- **Decision:** Fail if input or errors can cause nontermination or resource exhaustion. Pass when count/depth/time limits and cancellation are verified. [Denial-of-service guidance][DOS]

```java
// Vulnerable.
while (!remoteReady()) { /* Unbounded polling. */ }
// Part of a safer approach: remoteReady must also have network timeouts.
boolean ready = false;
for (int attempt = 0; attempt < 3 && !ready; attempt++) ready = remoteReady();
if (!ready) throw new IllegalStateException("Retry limit exceeded");
```

### SEC-4.1 — Information Exposure Through Error Messages

- [ ] **Search:** `getMessage`, `printStackTrace`, `@ExceptionHandler`, `/error`, `include-message`, `include-stacktrace`, JSP error pages.
- [ ] **Procedure:** Inspect HTML/JSON, headers, and logs for invalid input, missing objects, and database outages. Look for internal paths, SQL, secrets, and library versions exposed to users.
- **Decision:** Fail if responses disclose unnecessary internal or sensitive information. Pass when generalized user messages are separated from access-controlled diagnostic records. [Error handling][ERROR]

```java
// Vulnerable.
return ResponseEntity.internalServerError().body(exception.toString());
// Safer: keep masked diagnostic details in controlled logs.
return ResponseEntity.internalServerError().body("An error occurred while processing the request.");
```

### SEC-4.2 — Missing Handling of Error Conditions

- [ ] **Search:** missing null/return-value checks, missing timeouts, transaction boundaries, defaults on external-service failure.
- [ ] **Procedure:** Inject database, file, authentication, and policy-service failures. Check partial writes, authorization bypasses, and indefinite waits. Verify idempotency and recovery for retried operations.
- **Decision:** Fail if foreseeable failures break security controls or data consistency. Pass when safe denial, rollback, bounded retries, and operational alerts are implemented. [Error handling][ERROR]

```text
Vulnerable (pseudocode): allow access by default when the authorization service is unavailable.
Safer (pseudocode; project implementation required):
  Enforce a response timeout -> deny on errors or no response
  -> roll back changes -> return a generic error and issue an internal alert
```

### SEC-4.3 — Improper Exception Handling

- [ ] **Search:** empty `catch`, `catch(Exception)`, success after exceptions, `return` in `finally`, ignored `InterruptedException`.
- [ ] **Procedure:** Trace execution after each catch. Check failures converted to success, swallowed exceptions preventing rollback, and ignored interruption signals.
- **Decision:** Fail if exceptions disable security checks or produce false success. Pass with appropriate exception handling, failure propagation, and cleanup. [Error handling][ERROR]

```java
// Vulnerable.
try { verify(); } catch (Exception ignored) { }
grantAccess();
// Safer: propagate failure without granting access.
try { verify(); }
catch (GeneralSecurityException e) { throw new SecurityException("Verification failed", e); }
grantAccess();
```

These are alternative snippets. Apply SEC-4.1 so the internal cause is not exposed in user responses.

### SEC-5.1 — Null Pointer Dereference

- [ ] **Search:** `getParameter`, `Map.get`, `find...`, nullable fields, automatic unboxing, `Optional.get`.
- [ ] **Procedure:** Check missing/empty input, absent query results, and concurrent changes. Trace whether NPEs lead to authentication bypass, partial processing, information exposure, or repeated outages.
- **Decision:** Fail when null paths cause unexpected termination or security impact. Pass when required-input rejection and absence handling are verified.

```java
// Vulnerable.
String role = request.getParameter("role").trim();
// Safer example for ordinary input, not for deciding a user's role.
String value = request.getParameter("query");
if (value == null || value.isBlank())
    throw new IllegalArgumentException("A search term is required.");
```

Adding `Objects.requireNonNull` merely to move the exception is insufficient. Verify appropriate error responses and data consistency.

### SEC-5.2 — Improper Resource Release

- [ ] **Search:** streams, files, sockets, JDBC connections, `close`, `ExecutorService`, schedulers, lock release.
- [ ] **Procedure:** Verify cleanup on normal execution, exceptions, early returns, and cancellation. Distinguish framework-owned resources from resources created by the application. Check recovery of connection/file counts after repeated calls.
- **Decision:** Fail if resource leaks harm availability. Pass when owned resources are released on all relevant paths.

```java
// Vulnerable: parse failure skips close.
InputStream input = Files.newInputStream(path);
parse(input);
input.close();
// Safer.
try (InputStream safeInput = Files.newInputStream(path)) { parse(safeInput); }
```

### SEC-5.3 — Use of Released Resources

- [ ] **Search:** access after `close`, JNI pointers/handles, `free`, direct memory, reuse after returning an object to a pool.
- [ ] **Procedure:** Trace ownership and lifetime, including asynchronous references after release. Distinguish closed Java stream errors from native memory use-after-free.
- **Decision:** Fail if post-release use causes outages, data corruption, or memory safety violations. Pass when use stays within the valid lifetime. Absence of native code does not justify skipping checks for reuse of closed external resources.

```java
// Unsafe pattern: reading a file stream after closing it.
FileInputStream stream = new FileInputStream(file);
stream.close();
stream.read();
// Safer: use the resource within its lifetime.
try (FileInputStream active = new FileInputStream(file)) { consume(active); }
```

This Java example demonstrates closed-resource misuse, not the same primitive as freed-memory access in C/C++. Review native paths separately.

### SEC-5.4 — Use of Uninitialized Variables

- [ ] **Search:** default-valued fields, partial constructors, lazy initialization, state flags, JNI buffers, JavaScript `undefined`.
- [ ] **Procedure:** Verify assignment before use on every path. Reading an uninitialized Java local variable is a compile-time error; default fields, partial initialization, and unsafe publication are separate concerns.
- **Decision:** Fail if an unset state causes unintended authorization or data processing. Pass when required values are validated and initial states fail safely.

```java
// Risk: default false could be interpreted as "not blocked".
private boolean blocked;
// Safer: explicitly default to denial; grant only on an affirmative result.
boolean allowed = false;
allowed = policyService.check(subject, resource);
if (!allowed) throw new SecurityException("Access denied");
```

Do not continue with `allowed=true` after a policy lookup exception. A declaration alone does not establish this finding.

### SEC-5.5 — Deserialization of Untrusted Data

- [ ] **Search:** `ObjectInputStream`, `readObject`, `XMLDecoder`, `readResolve`, Jackson default typing, XStream, YAML object construction.
- [ ] **Procedure:** Trace external input, session stores, queues, and uploads into object creation. Check allowed types, graph depth, reference counts, array sizes, polymorphism, and dependency risks.
- **Decision:** Fail if untrusted data can instantiate unexpected objects or trigger code behavior. Pass with fixed DTOs, restricted data formats, and size/field validation. [Deserialization prevention][DESERIAL] · [ObjectInputFilter][FILTER]

```java
// Vulnerable.
Object object = new ObjectInputStream(input).readObject();
// Part of a safer approach: no default typing or unrestricted polymorphism.
TransferRequest dto = objectMapper.readValue(json, TransferRequest.class);
```

Even a fixed DTO needs unknown-field, constraint, and input-size handling. If Java serialization is unavoidable, apply context-specific class allowlists and `ObjectInputFilter` limits; a filter alone does not remove all risk.

### SEC-6.1 — Data Exposure Caused by Incorrect Session Handling

- [ ] **Search:** user-specific fields in singleton controllers/services, `static`, `HttpSession`, `ThreadLocal`, cache keys without user identity.
- [ ] **Procedure:** Interleave requests from two users and tenants; inspect responses, caches, and temporary files. Check session-ID changes at login, logout invalidation, expiry, and propagation/cleanup of asynchronous security contexts.
- **Decision:** Fail if one session receives another session's data or permissions. Pass when request/session boundaries, authorization, and cache isolation hold. [Spring sessions][SPRING-SESSION]

```java
// Vulnerable: request-specific state in a default singleton bean.
private String currentUser;
// Safer: local variables or method arguments.
public Profile profile(Authentication authentication) {
    String current = authentication.getName();
    return profileService.findFor(current);
}
```

This assumes an authenticated request. `findFor` is a project method restricted to that user's authorized data.

### SEC-6.2 — Debug Code Left in the Application

- [ ] **Search:** `debug=true`, test authentication, `@Profile`, `h2.console`, `management.endpoints.web.exposure`, dumps, devtools, temporary admin APIs.
- [ ] **Procedure:** Inspect the production profile and deployed artifacts for enabled test functions, detailed diagnostics, and sample accounts. Check exposure and permissions on both external and internal networks.
- **Decision:** Fail if debug features expose information or enable authentication bypass/code execution. Pass when removed or constrained by verified necessity, authorization, and isolation.

```properties
# Risky example: expose all management endpoints in production.
management.endpoints.web.exposure.include=*
# Safer example: expose only required health information.
management.endpoints.web.exposure.include=health
management.endpoint.health.show-details=never
spring.h2.console.enabled=false
```

These are alternative settings; do not put duplicate keys into the actual configuration. Review network and authentication policy even when only health remains exposed.

### SEC-6.3 — Private Array Returned by a Public Method

- [ ] **Search:** `private ...[]`, getters returning original arrays, mutable collection exposure.
- [ ] **Procedure:** Check whether changes to returned values alter internal permissions or state. Inspect nested arrays and shallow copies of mutable elements.
- **Decision:** Fail if callers can mutate internal state. Pass with adequate defensive copying or immutable exposure. [Java mutability guidance][JAVA]

```java
// Vulnerable.
public byte[] getKeyData() { return keyData; }
// Safer: primitive byte elements are copied, breaking the shared array reference.
public byte[] getKeyData() { return keyData.clone(); }
```

Whether disclosing key material is appropriate remains a separate design decision. Arrays of mutable objects may require copying their elements too. These method definitions are alternatives.

### SEC-6.4 — Publicly Supplied Data Assigned to a Private Array

- [ ] **Search:** `this.array = input` in constructors/setters, stored references to caller-owned arrays or collections.
- [ ] **Procedure:** Check whether callers can modify the original after passing it in. **Copy first, validate the copy, then store it** to avoid changes between validation and use.
- **Decision:** Fail if external references can mutate internal state. Pass when the application owns an adequately deep, validated copy. [Java mutability guidance][JAVA]

```java
// Vulnerable.
this.permissions = suppliedPermissions;
// Safer for an array of immutable elements such as String.
String[] copy = Objects.requireNonNull(suppliedPermissions).clone();
validatePermissions(copy); // Project-specific policy validation.
this.permissions = copy;
```

### SEC-7.1 — Security Decisions Based on DNS Lookups

- [ ] **Search:** `getHostName`, `getCanonicalHostName`, `getRemoteHost`, reverse-DNS `endsWith`, hostname-based administrator decisions.
- [ ] **Procedure:** Identify authentication, authorization, or outbound-access decisions based only on DNS names. Include trust based solely on forward/reverse agreement. Record DNS re-resolution in SSRF separately where appropriate.
- **Decision:** Fail if DNS responses alone establish identity or authority. Pass when verified principals or service credentials drive authorization. Network-address restrictions are supplementary controls. [SSRF/DNS considerations][SSRF]

```java
// Vulnerable.
if (request.getRemoteHost().endsWith(".trusted.example")) allowAdmin();
// Safer: authorize the authenticated principal.
@PreAuthorize("hasRole('ADMIN')")
public void adminAction() { /* Business operation. */ }
```

Accept forwarded client-address headers only from trusted proxies.

### SEC-7.2 — Use of Vulnerable APIs

- [ ] **Search:** security-sensitive deprecated APIs, prohibited API lists, `Thread.stop`, direct memory, verification-bypass options, vulnerable library calls.
- [ ] **Procedure:** Check purpose, arguments, reachability, and official security advisories. Review versions, transitive dependencies, and runtime inclusion, while distinguishing this original checklist item from SCA findings.
- **Decision:** Fail when use of a known-risk API causes a security impact. Pass after verifying a suitable alternative and its usage conditions. Deprecation alone does not prove a vulnerability, and a current version alone does not prove safety.

```java
// Vulnerable: forced termination may break shared-state invariants.
worker.stop();
// Part of a safer approach: cooperative cancellation.
worker.interrupt();
```

The worker must observe interruption and clean up resources. Calling `interrupt()` alone does not guarantee termination. [Java security guidance][JAVA]

<a id="examples"></a>
## 5. Implementation Examples

### 5.1 Session Authentication and CSRF Across Spring Security, JSP, and JavaScript

This is a baseline for a session-authenticated web application. Restrict public routes, login policy, context paths, and roles to the project's requirements. Inspect the order and scope of any additional filter chains. [Spring CSRF][SPRING-CSRF] · [Spring method security][SPRING-METHOD]

```java
@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain webSecurity(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/assets/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .csrf(Customizer.withDefaults())
            .formLogin(Customizer.withDefaults());
        return http.build();
    }
}
```

Register a service with `@PreAuthorize` as a Spring bean and invoke it through its proxy. Self-invocation within the same object or direct object construction may bypass expected method security. In addition to URL-based role checks, verify document ownership, tenant boundaries, and operation-specific permissions.

```jsp
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%-- This example assumes deployment at the root context path. --%>
<form method="post" action="/meetings">
  <sec:csrfInput />
  <label for="meeting-title">Meeting title</label>
  <input id="meeting-title" name="title" type="text" required>
  <button type="submit">Save</button>
</form>
```

`required` helps users but does not replace server validation. Do not insert duplicate CSRF fields when Spring form tags already add the token automatically.

```jsp
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<meta name="_csrf" content="<c:out value='${_csrf.token}' />">
<meta name="_csrf_header" content="<c:out value='${_csrf.headerName}' />">
```

```javascript
// Same-origin state change; adapt the URL to the actual context path.
const token = document.querySelector('meta[name="_csrf"]')?.content;
const header = document.querySelector('meta[name="_csrf_header"]')?.content;
if (!token || !header) throw new Error("Request protection information is unavailable.");
const response = await fetch("/meetings", {
  method: "POST",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json", [header]: token },
  body: JSON.stringify({ title: "Regular meeting" })
});
if (!response.ok) throw new Error("Unable to save the meeting.");
```

Follow the actual Spring version's integration guidance for token refresh after login/logout and SPA requests. Do not disable protection to resolve token integration problems. Record requests with a valid token, no token, and an invalid token, together with whether data was actually saved.

### 5.2 Blocking External XML Resources

This example covers a DOM parser. SAX, StAX, XSLT, and schema-validation paths require their own settings. Propagate unsupported-setting failures instead of falling back to unsafe defaults. Apply input size, depth, and processing-time limits separately. [OWASP XXE prevention][XXE]

```java
static DocumentBuilderFactory newSecureDocumentBuilderFactory()
        throws ParserConfigurationException {
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
    factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
    factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
    factory.setXIncludeAware(false);
    factory.setExpandEntityReferences(false);
    factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
    factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
    return factory;
}
```

Required types include `javax.xml.parsers.DocumentBuilderFactory`, `javax.xml.parsers.ParserConfigurationException`, and `javax.xml.XMLConstants`. These are Java SE XML APIs; do not confuse them with the Servlet transition to `jakarta.*`. Catching a configuration exception and retrying with a default factory is not a safe alternative.

<a id="records"></a>
## 6. Results and Retest Templates

### 6.1 Item-Level Review Register: 49 Rows

Record new decisions separately from the original zero counts. Link multiple findings for one item using finding IDs. All initial decisions are **Not reviewed**.

| Item ID | Item | Decision | Finding IDs / evidence | Owner / date | Remediation / retest |
| --- | --- | --- | --- | --- | --- |
| SEC-1.1 | SQL Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.2 | Code Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.3 | Path Manipulation and Resource Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.4 | Cross-Site Scripting | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.5 | Operating System Command Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.6 | Upload of Files with Dangerous Types | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.7 | Automatic Redirection to an Untrusted URL | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.8 | Improper XML External Entity References | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.9 | XML Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.10 | LDAP Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.11 | Cross-Site Request Forgery | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.12 | Server-Side Request Forgery | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.13 | HTTP Response Splitting | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.14 | Integer Overflow | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.15 | Improper Input Used in Security Decisions | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.16 | Memory Buffer Overflow | Not reviewed | To be completed | To be completed | To be completed |
| SEC-1.17 | Format String Injection | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.1 | Critical Functionality Allowed Without Proper Authentication | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.2 | Improper Authorization | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.3 | Incorrect Permissions for Critical Resources | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.4 | Use of Weak Cryptographic Algorithms | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.5 | Unencrypted Sensitive Information | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.6 | Hard-Coded Sensitive Information | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.7 | Insufficient Cryptographic Key Length | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.8 | Use of Inappropriate Random Values | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.9 | Allowing Weak Passwords | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.10 | Improper Digital Signature Verification | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.11 | Improper Certificate Validation | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.12 | Information Exposure Through Cookies Stored on the User's Disk | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.13 | Critical System Information in Comments | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.14 | Unsalted One-Way Hashing | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.15 | Downloading Code Without Integrity Verification | Not reviewed | To be completed | To be completed | To be completed |
| SEC-2.16 | Missing Limits on Repeated Authentication Attempts | Not reviewed | To be completed | To be completed | To be completed |
| SEC-3.1 | Race Condition: Time of Check to Time of Use (TOCTOU) | Not reviewed | To be completed | To be completed | To be completed |
| SEC-3.2 | Non-Terminating Loops or Recursive Functions | Not reviewed | To be completed | To be completed | To be completed |
| SEC-4.1 | Information Exposure Through Error Messages | Not reviewed | To be completed | To be completed | To be completed |
| SEC-4.2 | Missing Handling of Error Conditions | Not reviewed | To be completed | To be completed | To be completed |
| SEC-4.3 | Improper Exception Handling | Not reviewed | To be completed | To be completed | To be completed |
| SEC-5.1 | Null Pointer Dereference | Not reviewed | To be completed | To be completed | To be completed |
| SEC-5.2 | Improper Resource Release | Not reviewed | To be completed | To be completed | To be completed |
| SEC-5.3 | Use of Released Resources | Not reviewed | To be completed | To be completed | To be completed |
| SEC-5.4 | Use of Uninitialized Variables | Not reviewed | To be completed | To be completed | To be completed |
| SEC-5.5 | Deserialization of Untrusted Data | Not reviewed | To be completed | To be completed | To be completed |
| SEC-6.1 | Data Exposure Caused by Incorrect Session Handling | Not reviewed | To be completed | To be completed | To be completed |
| SEC-6.2 | Debug Code Left in the Application | Not reviewed | To be completed | To be completed | To be completed |
| SEC-6.3 | Private Array Returned by a Public Method | Not reviewed | To be completed | To be completed | To be completed |
| SEC-6.4 | Publicly Supplied Data Assigned to a Private Array | Not reviewed | To be completed | To be completed | To be completed |
| SEC-7.1 | Security Decisions Based on DNS Lookups | Not reviewed | To be completed | To be completed | To be completed |
| SEC-7.2 | Use of Vulnerable APIs | Not reviewed | To be completed | To be completed | To be completed |

### 6.2 Security Finding Template

Copy this template for each finding. Do not record passwords, raw tokens, or actual personal data.

```markdown
#### Finding ID: SEC-F-0001

- Item ID / translated original item name:
- Decision: Not reviewed / Needs verification / Fail / Pass / N/A
- Severity: Critical / High / Medium / Low / Informational; rationale:
- Remediation: Open / In progress / Awaiting retest / Resolved / Risk accepted
- Repository / commit / production profile / relevant dependency versions:
- File:line / method / configuration / entry URL and HTTP method:
- Untrusted input -> validation/transformation -> sensitive operation:
- Reachability conditions / attacker privileges / affected assets:
- Existing defenses and actual enforcement / bypass and exception paths:
- Reproduction environment / account role / de-identified input / request-response evidence:
- Expected result / actual result / side effects:
- Root cause:
- Related finding IDs / deduplication rule / affected location count:
- Applicable policy or official reference (title, version, clause, URL):
- Remediation plan / owner / due date:
- Fix commit / before-and-after code or configuration evidence:
- Retest date and reviewer / normal, rejected, boundary, exception, and concurrency results:
- Residual risk / acceptance rationale, approver, and expiry if applicable:
- Final reviewer / review date:
```

### 6.3 N/A and False-Positive Justification

```markdown
#### Exclusion / false-positive record ID:

- Item ID / tool alert ID, if applicable:
- Category: N/A / Individual alert false positive
- Repositories, files, settings, libraries, and runtime scope examined:
- Search expressions / tool version / execution results:
- Additional call paths, central controls, and deployment checks:
- Specific evidence supporting N/A or false positive:
- Conditions under which the conclusion holds / changes requiring review:
- Other unresolved candidates under the same item:
- Assessor / reviewer / date:
```

Statements such as "no rg matches," "safe because it is Java," or "the framework handles it" do not establish sufficient scope or evidence on their own.

### 6.4 Final Summary and Completion Criteria

| Area | Fixed item count | Not reviewed | Needs verification | Fail | Pass | N/A | Notes |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Software security weaknesses | 49 | Not tallied | Not tallied | Not tallied | Not tallied | Not tallied | Item counts and finding counts are separate |

- [ ] Assign one final state per item and reconcile the total to 49. False positive is an individual alert disposition, not an additional item state to count twice.
- [ ] Do not mark an item Pass while any failure remains. Leave unexamined scope as Not reviewed or Needs verification.
- [ ] Separate item counts, findings, root causes, and affected files/screens/elements.
- [ ] Keep the original report, current review, and post-fix retest as separate baselines. Do not calculate simple improvement rates when scope or denominators differ.
- [ ] Verify normal-function regression and interactions between security and accessibility changes.
- [ ] Do not claim overall security or accessibility beyond this document's scope.

<a id="sources"></a>
## 7. Official Standards and Sources

This English edition retains the official-source checks made on **2026-11-09** for the earlier checklist. Translation does not constitute a new security assessment or a new determination of the applicable standard edition. Record the actual contract, standard edition, and dependency versions when performing the review.

### 7.1 Editions and Applicability

| Source | Verified public edition/status | Use and limitations |
| --- | --- | --- |
| MOIS/KISA Software Development Security Guide | KISA posting dated 2021-11-29; attachment title identifies the 2021.12.29 guide | Official posting and attachment edition were checked. The user's supplied report remains the basis for the 49 items and figures. A newer definitive published edition was not confirmed; this is not labeled a "2026 revised guide." The English document title is a translation. [Official posting][KISA] |
| KISA 2024 guide revision procurement | Tender notice dated 2024-03-26 | A procurement notice is **not evidence that a revised guide was published**. Do not infer a publicly released 2024 edition from this notice alone. [Notice][KISA-TENDER] |
| OWASP ASVS | **5.0.0**, published 2025-05-30; official stable release at the source-check date | Supplementary security verification scope. Do not substitute a continuously changing development build. This checklist's IDs are not ASVS requirement IDs. [Official site][ASVS] |
| NIST Digital Identity Guidelines | **SP 800-63B-4 (2025)** | Supplementary password and authentication-attempt guidance. It does not automatically replace Korean organizational requirements. [Official document][NIST] |
| Oracle Secure Coding Guidelines for Java SE | Document version **11.0**, last updated **June 2025** | Java/JNI boundaries, mutability, and language behavior. Java 21 API links establish example API semantics, not a claim that Java 21 is the latest JDK. [Java guidance][JAVA] |
| Spring Security / OWASP Cheat Sheet Series | Official online references as checked; continuously maintained | Implementation and configuration references. Recheck against the project's actual versions. |

### 7.2 Technical References

| Topic | Official reference |
| --- | --- |
| SQL parameter binding and dynamic structure | [OWASP SQL Injection Prevention][SQL] |
| Context-specific XSS prevention | [OWASP Cross Site Scripting Prevention][XSS] |
| Command execution and argument injection | [OWASP OS Command Injection Defense][CMD] |
| File uploads | [OWASP File Upload][UPLOAD] |
| Redirects | [OWASP Unvalidated Redirects and Forwards][REDIRECT] |
| XML parser hardening | [OWASP XML External Entity Prevention][XXE] |
| LDAP filters and DNs | [OWASP LDAP Injection Prevention][LDAP] |
| SSRF, DNS, and redirects | [OWASP Server Side Request Forgery Prevention][SSRF] |
| Object authorization | [OWASP Authorization][AUTHZ] |
| Cryptographic algorithms and keys | [OWASP Cryptographic Storage][CRYPTO] |
| Password storage and Argon2id | [OWASP Password Storage][PASSWORD] · [Spring Password Storage][SPRING-PASSWORD] |
| Failure handling and denial of service | [OWASP Error Handling][ERROR] · [OWASP Denial of Service][DOS] |
| Object deserialization | [OWASP Deserialization][DESERIAL] · [Oracle ObjectInputFilter][FILTER] |
| Checked integer arithmetic | [Oracle Java 21 Math][MATH] |
| Spring CSRF, method authorization, and sessions | [CSRF][SPRING-CSRF] · [Method Security][SPRING-METHOD] · [Session Management][SPRING-SESSION] |

Searches, supplementary procedures, traceability methods, and code comparisons were authored for this checklist. The cited standards do not certify every example. Link actual findings to applicable clauses, policies, and project evidence.

[KISA]: https://www.kisa.or.kr/2060204/form?postSeq=5&lang_type=KO&page=1
[KISA-TENDER]: https://www.kisa.or.kr/403/form?postSeq=9588
[ASVS]: https://asvs.owasp.org/
[NIST]: https://pages.nist.gov/800-63-4/sp800-63b.html
[JAVA]: https://www.oracle.com/java/technologies/javase/seccodeguide.html
[SQL]: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
[XSS]: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
[CMD]: https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html
[UPLOAD]: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
[REDIRECT]: https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
[XXE]: https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
[LDAP]: https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html
[SSRF]: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
[AUTHZ]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
[CRYPTO]: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
[PASSWORD]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
[ERROR]: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
[DOS]: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
[DESERIAL]: https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
[MATH]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html
[FILTER]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputFilter.html
[SPRING-CSRF]: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html
[SPRING-METHOD]: https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html
[SPRING-SESSION]: https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html
[SPRING-PASSWORD]: https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html

<a id="raw"></a>
## 8. Translated Source Excerpt

Source: the user message in the referenced conversation, translated title "Preparing a Security Weakness Checklist," conversation ID `6af15a77-e558-83e8-98ca-83ad9d3ef5ad`. The original PDF, page images, and detailed scan logs were not supplied. **The following is an English translation, not a verbatim English report.** Numbers, row order, and unresolved markers are retained. Tags inside the block are inert source text.

````text
1.3 Summary of Project Results by Inspection Item
Security Weakness Detections by Inspection Item
5
[Default Group] Next-Generation Financial Services Commission Information System Development Project (Business Communications and Meeting Body Management) (Round 3)
Software Development Security Guide: 49 Items
No. Inspection Type Cause-Pattern Count Detection Count
1 1.1. SQL Injection 0 0
2 1.2. Code Injection 0 0
3 1.3. Path Manipulation and Resource Injection 0 0
4 1.4. Cross-Site Scripting 0 0
5 1.5. Operating System Command Injection 0 0
6 1.6. Upload of Files with Dangerous Types 0 0
7 1.7. Automatic Redirection to an Untrusted URL 0 0
8 1.8. Improper XML External Entity References 0 0
9 1.9. XML Injection 0 0
10 1.10. LDAP Injection 0 0
11 1.11. Cross-Site Request Forgery 0 0
12 1.12. Server-Side Request Forgery 0 0
13 1.13. HTTP Response Splitting 0 0
14 1.14. Integer Overflow 0 0
15 1.15. Improper Input Used in Security Decisions 0 0
16 1.16. Memory Buffer Overflow 0 0
17 1.17. Format String Injection 0 0
18 2.1. Critical Functionality Allowed Without Proper Authentication 0 0
19 2.2. Improper Authorization 0 0
20 2.3. Incorrect Permissions for Critical Resources 0 0
21 2.4. Use of Weak Cryptographic Algorithms 0 0
22 2.5. Unencrypted Sensitive Information 0 0
23 2.6. Hard-Coded Sensitive Information 0 0
24 2.7. Insufficient Cryptographic Key Length 0 0
6
[Default Group] Next-Generation Financial Services Commission Information System Development Project (Business Communications and Meeting Body Management) (Round 3)
Software Development Security Guide: 49 Items
No. Inspection Type Cause-Pattern Count Detection Count
25 2.8. Use of Inappropriate Random Values 0 0
26 2.9. Allowing Weak Passwords 0 0
27 2.10. Improper Digital Signature Verification 0 0
28 2.11. Improper Certificate Validation 0 0
29 2.12. Information Exposure Through Cookies Stored on the User's Disk 0 0
30 2.13. Critical System Information in Comments 0 0
31 2.14. Unsalted One-Way Hashing 0 0
32 2.15. Downloading Code Without Integrity Verification 0 0
33 2.16. Missing Limits on Repeated Authentication Attempts 0 0
34 3.1. Race Condition: Time of Check to Time of Use (TOCTOU) 0 0
35 3.2. Non-Terminating Loops or Recursive Functions 0 0
36 4.1. Information Exposure Through Error Messages 0 0
37 4.2. Missing Handling of Error Conditions 0 0
38 4.3. Improper Exception Handling 0 0
39 5.1. Null Pointer Dereference 0 0
40 5.2. Improper Resource Release 0 0
41 5.3. Use of Released Resources 0 0
42 5.4. Use of Uninitialized Variables 0 0
43 5.5. Deserialization of Untrusted Data 0 0
44 6.1. Data Exposure Caused by Incorrect Session Handling 0 0
45 6.2. Debug Code Left in the Application 0 0
46 6.3. Private Array Returned by a Public Method 0 0
47 6.4. Publicly Supplied Data Assigned to a Private Array 0 0
48 7.1. Security Decisions Based on DNS Lookups 0 0
7
[Default Group] Next-Generation Financial Services Commission Information System Development Project (Business Communications and Meeting Body Management) (Round 3)
Software Development Security Guide: 49 Items
No. Inspection Type Cause-Pattern Count Detection Count
49 7.2. Use of Vulnerable APIs 0 0
````
