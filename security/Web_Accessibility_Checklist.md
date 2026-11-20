# Web Accessibility Checklist: 6 Original Report Items

> Technology: Spring Boot / Java / JSP / JavaScript  
> Prepared and official sources checked: **2026-11-09 (Asia/Seoul)**  
> Purpose: Inspect JSP, HTML, JavaScript, and actual web screens for accessibility; record remediation.  
> Status: **Review preparation document**, not inspection results for an actual application.

## Contents

1. [Scope and use](#scope)
2. [Original report figures and interpretation notes](#original)
3. [Review workflow and searches](#workflow)
4. [Detailed checklist: 6 accessibility items](#accessibility)
5. [Implementation example](#examples)
6. [Results and retest templates](#records)
7. [Official standards and sources](#sources)
8. [Translated source excerpt](#raw)

<a id="scope"></a>
## 1. Scope and Use

> **Scope clarification:** The six source items previously described as "web vulnerabilities" are **web accessibility** checks: text alternatives, titles, default language, new-window warnings, labels, and markup. This is not a complete web application security checklist. SQL injection, XSS, CSRF, and the other supplied security items are in `Software_Security_Weakness_Checklist.md`.

- Preserve all six parent rows and 19 detail patterns, their identifiers, and their numeric values. Names are English translations, not reconstructed official English labels. Do not invent missing element names or a meaning for `-`.
- Includes searches, procedures, failing/improved examples, decision rules, and screen-level record templates. This file can be used independently for its accessibility scope.
- Historical figures and new review results are separate baselines. An original `100.0` is not a Pass for newly reviewed content.
- These six items do not replace all 33 KWCAG 2.2 checks or a complete WCAG assessment. [NIA revision announcement][NIA]

### 1.1 Review Setup

| Field | Value |
| --- | --- |
| Project / service / responsible organization | To be completed |
| Repository / branch / commit | To be completed |
| Scope and excluded paths / reasons | To be completed |
| JDK / Spring Boot / Spring Security / Servlet and JSTL versions | To be completed |
| Front end / templates / database / ORM / authentication | To be completed |
| Applicable contract / accessibility standard and version | To be completed |
| Tool / version / ruleset / execution date / unsupported items | To be completed |
| URLs / login roles / screen states / browser and assistive-technology versions | To be completed |
| Assessor / reviewer / period / result baseline | To be completed |

### 1.2 Reading the Code Examples

- Examples compare failure patterns with improvement approaches; they were not executed or verified in the user's project.
- JSP `c:out` requires JSTL declarations. Use `jakarta.tags.core` or the legacy URI appropriate to the actual version.
- Distinguish full HTML documents from fragments. Do not paste alternative examples into a page as duplicate elements.
- Correct snippets do not establish whole-page conformance. Inspect final HTML, DOM, the accessibility tree, and manual operation.
- Visible example text has been localized to English. Language declarations in examples must match the actual content when adapted.

<a id="original"></a>
## 2. Original Report Figures and Interpretation Notes

### 2.1 Interpretation Notes

These figures followed the security report in the referenced conversation. No separate accessibility report title, tool, inspection date, or URL inventory was supplied.

> **R-03 — Missing column headers:** The source contains three values after each label without a header row. This document calls them **original A / B / C**. Interpreting A as inspected count, B as failing count, and C as conformance percentage is a plausible **inference**, not a confirmed report definition.
>
> **R-04 — Dashes and missing element names:** Do not replace `-` with zero, Not reviewed, or N/A. Three "missing alternative text" rows and two "missing title" rows lack element names. Do not assign them to `area`, `input`, `iframe`, `h1`, or another element. The original token `image` is retained; whether it means HTML `img` or a tool category is unknown.
>
> **R-05 — Counts cannot simply be added:** The markup parent B is 212; missing end tags also have B=212, while missing start tags have B=178. Do not replace the parent 212 with the detail sum 390. Overlap on the same page, a maximum, or another counting method could explain the figures, but none is confirmed. Do not add different accessibility items into a claimed total such as 837 errors or invent an overall rate; their units may differ.
>
> **R-06 — Arithmetic relationship:** Every numeric C agrees with `(A-B)/A*100` rounded to one decimal place. Examples: `(323-273)/323*100` is approximately 15.5; `(885-339)/885*100` is approximately 61.7. This supports a possible interpretation but does not establish the report's counting unit, denominator, or rounding policy. No arithmetic error was identified; **aggregation meaning remains uncertain**.
>
> **R-07 — Paste artifacts:** The source ends with `<!--EndFragment--> </body> </html>`. These may be copy/paste artifacts. Do not treat them as proof of markup errors in the actual service.

### 2.2 Six Parent Items and 19 Detail Patterns

`A11Y-xx-Pyy` is an editorial tracking ID. A/B/C are temporary labels because the original column headers are absent. All numeric strings and dashes are preserved; textual labels are translated.

| Tracking ID | Translated original item/pattern | Original A | Original B | Original C | Interpretation note |
| --- | --- | ---: | ---: | ---: | --- |
| A11Y-01 | `1. Text Alternatives` | 323 | 273 | 15.5 | — |
| A11Y-01-P01 | `image missing alternative text` | 273 | 273 | 0.0 | Meaning of image is unconfirmed |
| A11Y-01-P02 | `Missing alternative text` | 50 | 0 | 100.0 | Element name missing |
| A11Y-01-P03 | `Missing alternative text` | - | - | - | Element name and dash meaning unknown |
| A11Y-01-P04 | `Missing alternative text` | - | - | - | Element name and dash meaning unknown |
| A11Y-02 | `2. Titles` | 230 | 3 | 98.7 | — |
| A11Y-02-P01 | `Missing page title` | 217 | 3 | 98.6 | — |
| A11Y-02-P02 | `Missing title` | - | - | - | Element name and dash meaning unknown |
| A11Y-02-P03 | `Missing title` | 13 | 0 | 100.0 | Element name missing |
| A11Y-03 | `3. Default Language` | 217 | 0 | 100.0 | — |
| A11Y-03-P01 | `Default language undefined` | 217 | 0 | 100.0 | — |
| A11Y-04 | `4. Advance Warning of New Windows` | 22 | 10 | 54.5 | — |
| A11Y-04-P01 | `<a> unannounced new window` | 22 | 10 | 54.5 | — |
| A11Y-04-P02 | `<area> unannounced new window` | - | - | - | Dash meaning unknown |
| A11Y-05 | `5. Labels` | 885 | 339 | 61.7 | — |
| A11Y-05-P01 | `<input> missing label` | 885 | 339 | 61.7 | — |
| A11Y-05-P02 | `<textarea> missing label` | - | - | - | Dash meaning unknown |
| A11Y-05-P03 | `<select> missing label` | - | - | - | Dash meaning unknown |
| A11Y-06 | `6. Markup Syntax` | 217 | 212 | 2.3 | Parent aggregation method unknown |
| A11Y-06-P01 | `Duplicate id error` | 217 | 0 | 100.0 | — |
| A11Y-06-P02 | `Duplicate attribute name error` | 217 | 0 | 100.0 | — |
| A11Y-06-P03 | `Start/end tag mismatch error` | 217 | 0 | 100.0 | — |
| A11Y-06-P04 | `Missing end tag error` | 217 | 212 | 2.3 | May overlap with parent or other patterns |
| A11Y-06-P05 | `Missing start tag error` | 217 | 178 | 18.0 | May overlap with parent or other patterns |
| A11Y-06-P06 | `Improper tag nesting error` | 217 | 0 | 100.0 | — |

<a id="workflow"></a>
## 3. Review Workflow and Searches

### 3.1 Decision Rules

| Decision | Use when | Required evidence |
| --- | --- | --- |
| Not reviewed | Screens or states have not been inspected | Planned URLs, roles, and states |
| Needs verification | An automated candidate exists, but actual impact or criterion applicability is unresolved | Open questions and next checks |
| Fail | Failure of the applicable criterion is confirmed | HTML/DOM location, reproduction, screen-reader or keyboard results |
| Pass | The entire applicable reviewed scope meets the criterion | Scope and automated/manual evidence |
| N/A | The relevant element or function does not exist in scope | Screen and dynamic-state investigation; reviewer rationale |
| False positive | A specific tool alert is disproven | Alert ID and counterevidence; separate from the item decision |

A checked box `[x]` means review and documentation completed, not Pass. Track remediation separately as `Open / In progress / Awaiting retest / Resolved / Exception managed`. An approved exception does not turn a failure into a pass.

### 3.2 Review Sequence

1. Fix the source commit, deployment version, standard, URL inventory, roles, languages, and screen states.
2. Search JSP/tag files, shared layouts, JavaScript components, and dynamic-content creation paths.
3. Save complete server response HTML and compare it with the post-script DOM and accessibility tree. Do not judge a JSP fragment as a complete document.
4. Include initial, error, search-results, empty-list, repeated-list, modal, and login states.
5. Manually review automated candidates. Use a keyboard and screen reader to verify meaning, labels, and new-window announcements.
6. Define page counts, element counts, unique failures, and deduplication separately. Do not sum parent/detail rows indiscriminately.
7. Retest the fix commit under the same conditions. Check that new labels or alternatives do not introduce output-security issues.

### 3.3 Read-Only Search Examples

Run from the repository root and adapt `src` to the actual layout. Match counts are not accessibility failure counts.

```powershell
rg --files -g '*.jsp' -g '*.jspx' -g '*.tag' -g '*.html' -g '*.js' -g '*.ts' -g '*.css' -g '!node_modules/**' -g '!target/**' -g '!build/**'
rg -n -g '*.jsp' -g '*.tag' -g '*.html' -g '*.js' '<img|<area|<input|<textarea|<select|<iframe|<title|<h[1-6]|<html|target\s*=|window\.open|aria-label|aria-labelledby|<label' src
rg -n -g '*.jsp' -g '*.tag' -g '*.html' -g '*.js' 'document\.title|innerHTML|insertAdjacentHTML|createElement|include|forEach' src
```

Check ignored/hidden files and external template directories. Do not upload sensitive HTML, screenshots, or personal data to public validators. Automated checks alone do not establish conformance.

<a id="accessibility"></a>
## 4. Detailed Web Accessibility Checklist: 6 Items

**A failure in this section is an accessibility finding, not a security vulnerability count.** The supplied data resembles automated inspection output, but the tool, inspection date, and target list were not supplied. The mapping below is an editorial comparison with official guidance, not a mapping recovered from the original report.

| ID | Translated original item | Related KWCAG 2.2 clause | Supplementary WCAG 2.2 reference |
| --- | --- | --- | --- |
| A11Y-01 | Text Alternatives | 5.1.1 Appropriate Text Alternatives | 1.1.1 Non-text Content (A) |
| A11Y-02 | Titles | 6.4.2 Titles | 2.4.2 Page Titled (A), 2.4.6 Headings and Labels (AA); inspect frame purpose separately |
| A11Y-03 | Default Language | 7.1.1 Default Language Identification | 3.1.1 Language of Page (A); 3.1.2 Language of Parts (AA) as a supplement |
| A11Y-04 | Advance Warning of New Windows | 7.2.1 Execution on User Request | G201 advisory technique; context changes under 3.2.1/3.2.2. Do not describe every new-window warning as a separate universal WCAG A/AA requirement |
| A11Y-05 | Labels | 7.3.2 Labels; 6.5.3 Label and Name as a supplement | 1.3.1 (A), 3.3.2 (A), 4.1.2 (A), 2.5.3 (A) |
| A11Y-06 | Markup Syntax | 8.1.1 Prevention of Markup Errors | **4.1.1 Parsing was removed from WCAG 2.2.** Assess actual effects against current criteria such as 1.3.1 and 4.1.2 |

Clause numbers were checked against the RRA's published **KS X OT0003:2022 / KWCAG 2.2**. The English clause descriptions above are translations. Do not remove a Korean-standard markup requirement solely because WCAG changed. [KWCAG publication][KWCAG] · [WCAG 2.2][WCAG] · [Parsing removal][PARSING] · [G201][G201]

### A11Y-01 — Text Alternatives

**Existing parent A/B/C: `323 / 273 / 15.5`.** Detail: `image missing alternative text 273/273/0.0`; `missing alternative text 50/0/100.0` with no element name; two further unnamed `missing alternative text` rows, each `-/-/-`.

- [ ] **Search:** `<img`, `<area`, `input type="image"`, `alt`, CSS `background-image`, SVG, canvas, dynamically generated images.
- [ ] **Procedure:** Classify images as informative, functional, or decorative. Verify that alternatives convey the same meaning or purpose. For image links, describe the destination/purpose rather than appearance. Supply adjacent explanations or tables for complex charts.
- [ ] Distinguish an absent alt attribute from `alt=""`. Empty alt may be correct for a confirmed decorative image; it fails for an informative image without an equivalent alternative.
- [ ] Check the purpose of each image-map `<area>`, image-button action names, and alternatives for SVG/canvas. These are additional inspection targets, not reconstructed names for the original unnamed rows.
- **Decision:** Fail when information or functionality is unavailable to assistive technology. Pass when equivalent information is conveyed and decorative content is not unnecessarily announced. Attribute existence alone does not establish complete conformance. [W3C images guidance][IMAGES]

```html
<!-- Fails: the logo link has no accessible name. -->
<a href="/home"><img src="/assets/logo.png"></a>
<!-- Improved: communicate the destination. -->
<a href="/home"><img src="/assets/logo.png" alt="Business communications home"></a>
<!-- Appropriate only for a confirmed decorative image. -->
<img src="/assets/divider.png" alt="">
<!-- Name each image-button and image-map action. -->
<input type="image" src="/assets/search.png" alt="Search">
<map name="navigation"><area shape="rect" coords="0,0,80,40" href="/meetings" alt="Meeting list"></map>
```

Handle dynamic alt values according to the HTML attribute context. Accessibility fixes must not introduce XSS; check output handling for the actual HTML text, attribute, or JavaScript context.

### A11Y-02 — Titles

**Existing parent A/B/C: `230 / 3 / 98.7`.** Detail: `missing page title 217/3/98.6`; an unnamed `missing title -/-/-`; an unnamed `missing title 13/0/100.0`.

- [ ] **Search:** `<title`, shared JSP heads/includes, `<iframe`, `<frame`, `<h1` through `<h6`, `document.title`, router transitions.
- [ ] **Procedure:** Verify that titles identify the current content on detail, search, error, login, and other pages and after navigation. Avoid blank or identical generic titles across all pages.
- [ ] Check a frame/iframe's purpose label and the embedded document title separately. Manually inspect content-block headings and structure. These targets do not establish what the original 13-item row measured.
- **Decision:** Fail for absent or uninformative titles. Pass when pages, frames, and content blocks have appropriate titles confirmed with assistive technology. Adding a generic `title` attribute does not replace a document title. [KWCAG][KWCAG] · [WCAG][WCAG]

```html
<!-- Fails. -->
<title>Page</title>
<iframe src="/help"></iframe>
<!-- Improved alternatives. -->
<title>Meeting details | Meeting management</title>
<h1>Meeting details</h1>
<iframe src="/help" title="Meeting management help"></iframe>
```

```javascript
// Update the document title when the displayed content changes.
document.title = "Meeting search results | Meeting management";
```

### A11Y-03 — Default Language

**Existing parent and detail A/B/C: `217 / 0 / 100.0`.** Detail pattern: `default language undefined`.

- [ ] **Search:** `<html`, `lang=`, `xml:lang`, locale settings, shared layouts, error pages.
- [ ] **Procedure:** Verify that the final HTML root language matches the page's predominant language, including language changes and exceptional pages. Use a valid BCP 47 language tag.
- **Decision:** Fail if the default language is absent or incorrect. Pass when the actual predominant language is identified. UTF-8 encoding is not a language declaration. Recheck changed content despite the original B=0. [KWCAG][KWCAG] · [WCAG][WCAG]

```html
<!-- Fails: the page language is missing. -->
<html>
<!-- Improved alternative for an English-language page. -->
<html lang="en">
<!-- Supplementary example: a passage in another language. -->
<p lang="fr">Calendrier des reunions</p>
```

The two `<html>` lines are alternatives. An actual document has one root element. This English edition localizes the example to English; for a predominantly Korean page, use `lang="ko"` instead.

### A11Y-04 — Advance Warning of New Windows

**Existing parent A/B/C: `22 / 10 / 54.5`.** Detail: `<a> unannounced new window 22/10/54.5`; `<area> unannounced new window -/-/-`.

- [ ] **Search:** `target="_blank"`, named targets, `window.open`, click/focus handlers, shared link components.
- [ ] **Procedure:** Before activation, verify that users can perceive the new-window/tab behavior visually and through assistive technology. Test Tab/Enter and screen-reader use. Avoid opening a window merely when an element receives focus.
- [ ] Check `<a>` and `<area>` separately, including dynamic links. Distinguish site-initiated behavior from a user explicitly choosing a new tab, such as with the browser's middle-click command.
- **Decision:** Under the applicable Korean item, fail when the site opens a window without warning or triggers unintended execution. Pass when advance information and deliberate user activation are verified. Do not assume `title` tooltips are available in every interaction mode. [KWCAG][KWCAG] · [W3C G201][G201]

```html
<!-- Fails. -->
<a href="/manual" target="_blank">User guide</a>
<!-- Improved. -->
<a href="/manual" target="_blank" rel="noopener">User guide (new window)</a>
<map name="helpmap">
  <area shape="rect" coords="0,0,120,60" href="/help"
        target="_blank" rel="noopener" alt="Help (new window)">
</map>
```

`rel="noopener"` is a security control for the window relationship, not advance notice. Consider `noreferrer` separately according to referrer-information policy.

### A11Y-05 — Labels

**Existing parent A/B/C: `885 / 339 / 61.7`.** Detail: `<input> missing label 885/339/61.7`; `<textarea> missing label -/-/-`; `<select> missing label -/-/-`.

- [ ] **Search:** `<input`, `<textarea`, `<select`, `<label`, `for`, `id`, `aria-label`, `aria-labelledby`, placeholder.
- [ ] **Procedure:** Compare visible instructions with the computed accessible name. Verify that `for` matches a unique id and that conditional rendering preserves the association.
- [ ] Inspect input, textarea, and select controls separately. Distinguish hidden inputs from user-operated controls. Check type-specific naming, such as button text or an image input's alt.
- [ ] Review group descriptions for radio buttons and checkboxes, such as `fieldset/legend`. `aria-describedby` usually supplies a description and should not be assumed to provide the control's name.
- **Decision:** Fail if sighted users or assistive-technology users cannot identify an input's purpose. Pass with appropriate naming, label associations, and consistent operation. A placeholder alone does not replace a persistent label. [W3C labeling guidance][LABELS]

```html
<!-- Fails. -->
<input name="meetingName" placeholder="Meeting name">
<!-- Improved: explicitly label all three control types. -->
<label for="meeting-name">Meeting name</label>
<input id="meeting-name" name="meetingName" type="text">
<label for="meeting-note">Meeting description</label>
<textarea id="meeting-note" name="meetingNote"></textarea>
<label for="meeting-type">Meeting type</label>
<select id="meeting-type" name="meetingType"><option value="regular">Regular meeting</option></select>
```

Do not override a visible label with a conflicting `aria-label`. Verify that the visible label's wording is included in the accessible name.

### A11Y-06 — Markup Syntax

**Existing parent A/B/C: `217 / 212 / 2.3`.** Track all six patterns separately. Do not replace the parent B with the sum of detail B values.

| Translated original pattern | Original A/B/C | Source/runtime inspection |
| --- | --- | --- |
| Duplicate id error | 217 / 0 / 100.0 | Check duplicate ids and `for`/ARIA targets after repeated JSP rendering, modals, and dynamic additions |
| Duplicate attribute name error | 217 / 0 / 100.0 | Inspect response source for duplicate attributes; the parsed DOM may already have discarded one |
| Start/end tag mismatch error | 217 / 0 / 100.0 | Check element pairing in response HTML and inspect validator results |
| Missing end tag error | 217 / 212 / 2.3 | Inspect conditional JSP/includes; distinguish void elements and standard-permitted omissions |
| Missing start tag error | 217 / 178 / 18.0 | Inspect orphan end tags and incorrectly combined templates; overlap with the parent 212 is unknown |
| Improper tag nesting error | 217 / 0 / 100.0 | Inspect nested forms/links, tables/lists, and browser-rearranged DOM against response source |

- [ ] **Search:** repeated `id=`, JSP conditions/includes/tag files, string-built HTML, form/table/list structure.
- [ ] **Procedure:** Use a local HTML checker on **complete response HTML** across roles, zero/one/multiple records, and error states. Do not treat raw JSP fragments as final HTML.
- [ ] Retain response source, post-script DOM, accessibility-tree evidence, and effects on labels, focus, and reading order. Do not upload sensitive HTML to a public validation service.
- **Decision:** Record failure of the applicable KWCAG item when start/end tags, attributes, nesting, or ids violate the applicable markup rules. Visual rendering alone does not prove conformance. Do not count omissions explicitly allowed by HTML as errors. [KWCAG][KWCAG] · [HTML syntax][HTML]

```html
<!-- Fails: duplicate id, duplicate attribute, and invalid nesting. -->
<label for="name">Name</label>
<input id="name" id="other">
<input id="name">
<div><span>Content</div></span>
<!-- Improved: unique ids and associated labels. -->
<label for="member-name">Participant name</label>
<input id="member-name" name="memberName">
<label for="host-name">Host name</label>
<input id="host-name" name="hostName">
<div><span>Content</span></div>
```

HTML void elements such as `input`, `img`, and `br` do not require end tags. Do not mix HTML optional-tag rules with XHTML rules. **For WCAG 2.2-only assessment, do not fail the removed criterion 4.1.1.** Instead, record any actual failures of current criteria, such as label relationships or name/role/value. [W3C Parsing explanation][PARSING]

### 4.1 Read-Only Browser Candidate Checks

The following can be run in the target page's developer tools. It was not run against the user's site while preparing this document. It does not comprehensively inspect iframe contents, Shadow DOM, CSS backgrounds, or hidden states.

```javascript
const idCounts = new Map();
for (const el of document.querySelectorAll("[id]")) {
  idCounts.set(el.id, (idCounts.get(el.id) || 0) + 1);
}
console.table({
  pageTitle: document.title,
  documentLanguage: document.documentElement.lang,
  imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
  framesWithoutTitle: document.querySelectorAll("iframe:not([title])").length,
  newWindowLinks: document.querySelectorAll('a[target="_blank"],area[target="_blank"]').length
});
console.table([...idCounts].filter(([id, count]) => id !== "" && count > 1));
```

Candidate counts are not failure counts. This code cannot judge empty titles, inappropriate alternatives, actual accessible-name computation, duplicate attributes, or missing tags. Follow automated checks with keyboard and screen-reader testing.

<a id="examples"></a>
## 5. Implementation Example

### 5.1 Complete HTML with Accessibility and Output Protection

```jsp
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Meeting details | Meeting management</title>
</head>
<body>
  <main>
    <h1>Meeting details</h1>
    <p><c:out value="${meeting.title}" /></p>
    <a href="/manual" target="_blank" rel="noopener">User guide (new window)</a>
  </main>
</body>
</html>
```

This combines language, title, HTML text output, and a new-window warning. It does not prove complete accessibility, document authorization, or data suitability. Moving `meeting.title` into JavaScript, URLs, or styles requires handling appropriate to that new context. This example assumes English content; set the language to match the actual page.

<a id="records"></a>
## 6. Results and Retest Templates

### 6.1 Item-Level Review Register: 6 Rows

Keep original A/B/C values separate from new results. Link findings for all 19 detail patterns and relevant screen states.

| Item ID | Item | Decision | Finding IDs / evidence | Owner / date | Remediation / retest |
| --- | --- | --- | --- | --- | --- |
| A11Y-01 | Text Alternatives | Not reviewed | To be completed | To be completed | To be completed |
| A11Y-02 | Titles | Not reviewed | To be completed | To be completed | To be completed |
| A11Y-03 | Default Language | Not reviewed | To be completed | To be completed | To be completed |
| A11Y-04 | Advance Warning of New Windows | Not reviewed | To be completed | To be completed | To be completed |
| A11Y-05 | Labels | Not reviewed | To be completed | To be completed | To be completed |
| A11Y-06 | Markup Syntax | Not reviewed | To be completed | To be completed | To be completed |

### 6.2 Accessibility Screen and Pattern Record

```markdown
#### Accessibility finding ID: A11Y-F-0001

- Item ID / detail pattern ID / translated original pattern name:
- Decision: Not reviewed / Needs verification / Fail / Pass / N/A
- Remediation status:
- URL / screen / role / language / state (initial, error, modal, dynamic update, etc.):
- Source commit / JSP or JS file:line / final DOM selector:
- Browser and version / operating system / screen reader and version:
- Applicable standard, version, and clause / report-specific rule:
- Counting unit: Page / Element / Unique error / Other (define)
- New inspected count / new failing count / N/A count:
- Formula / denominator / rounding / deduplication:
- Original A/B/C, for reference only and separate from new results:
- Reproduction steps, including keyboard and screen-reader use:
- Expected name, description, and behavior / actual result:
- Evidence locations: response HTML, DOM, accessibility tree, screenshot or audio:
- Remediation / owner / due date / fix commit:
- Retest outcome / impact on normal use / remaining issues:
- Final reviewer / review date:
```

**Detail-pattern register:** Retain rows whose original values were `-` and assess applicability to current screens. Mark connections between unnamed original rows and currently inspected elements as **inferred mappings** until source-report evidence confirms them.

| Detail ID | Translated original pattern | New decision | Finding ID / screen / evidence |
| --- | --- | --- | --- |
| A11Y-01-P01 | `image missing alternative text` | Not reviewed | To be completed |
| A11Y-01-P02 | `Missing alternative text` | Not reviewed | To be completed |
| A11Y-01-P03 | `Missing alternative text` | Not reviewed | To be completed |
| A11Y-01-P04 | `Missing alternative text` | Not reviewed | To be completed |
| A11Y-02-P01 | `Missing page title` | Not reviewed | To be completed |
| A11Y-02-P02 | `Missing title` | Not reviewed | To be completed |
| A11Y-02-P03 | `Missing title` | Not reviewed | To be completed |
| A11Y-03-P01 | `Default language undefined` | Not reviewed | To be completed |
| A11Y-04-P01 | `<a> unannounced new window` | Not reviewed | To be completed |
| A11Y-04-P02 | `<area> unannounced new window` | Not reviewed | To be completed |
| A11Y-05-P01 | `<input> missing label` | Not reviewed | To be completed |
| A11Y-05-P02 | `<textarea> missing label` | Not reviewed | To be completed |
| A11Y-05-P03 | `<select> missing label` | Not reviewed | To be completed |
| A11Y-06-P01 | `Duplicate id error` | Not reviewed | To be completed |
| A11Y-06-P02 | `Duplicate attribute name error` | Not reviewed | To be completed |
| A11Y-06-P03 | `Start/end tag mismatch error` | Not reviewed | To be completed |
| A11Y-06-P04 | `Missing end tag error` | Not reviewed | To be completed |
| A11Y-06-P05 | `Missing start tag error` | Not reviewed | To be completed |
| A11Y-06-P06 | `Improper tag nesting error` | Not reviewed | To be completed |

### 6.3 N/A and False-Positive Justification

```markdown
#### Exclusion / false-positive record ID:

- Item ID / tool alert ID, if applicable:
- Category: N/A / Individual alert false positive
- Repositories, files, settings, libraries, and runtime scope examined:
- Search expressions / tool version / execution results:
- Additional response HTML, DOM, screen-state, and assistive-technology checks:
- Specific evidence supporting N/A or false positive:
- Conditions under which the conclusion holds / changes requiring review:
- Other unresolved candidates under the same item:
- Assessor / reviewer / date:
```

Statements such as "no rg matches," "visible in the browser," or "zero tool errors" do not establish adequate scope on their own.

### 6.4 Final Summary and Completion Criteria

| Area | Fixed item count | Not reviewed | Needs verification | Fail | Pass | N/A | Notes |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Web accessibility | 6 | Not tallied | Not tallied | Not tallied | Not tallied | Not tallied | 19 detail patterns; distinguish screen and element units |

- [ ] Assign one final state per item and reconcile the total to 6. Do not count false-positive alert dispositions as additional checklist items.
- [ ] Do not mark an item Pass while a failure remains. Retain Not reviewed or Needs verification for unexamined scope.
- [ ] Separate item counts, findings, root causes, and affected files/screens/elements.
- [ ] Preserve original, current-review, and retest baselines separately. Do not calculate simple improvement rates when scope or denominators change.
- [ ] Check normal-use regression and security/accessibility interactions introduced by fixes.
- [ ] Do not claim overall security or accessibility beyond the assessed scope.

<a id="sources"></a>
## 7. Official Standards and Sources

This English edition retains the official-source checks made on **2026-11-09** for the earlier checklist. Translation does not constitute a new inspection or a new determination of the applicable standard edition. Record the actual contract, standard edition, and library/tool versions when reviewing a project.

### 7.1 Editions and Applicability

| Source | Verified public edition/status | Use and limitations |
| --- | --- | --- |
| KWCAG | **Korean Web Content Accessibility Guidelines 2.2**, **KS X OT0003:2022**, revision date 2022-12-28 | Clauses were checked in the RRA publication and its 2.2 attachment. The six supplied items cover only part of the 33-item standard. The posting contains both 2.1 and 2.2 attachments; select 2.2. English descriptions in this checklist are translations. [Official posting][KWCAG] · [NIA announcement][NIA] |
| WCAG | **WCAG 2.2**; the checked TR page identifies the W3C Recommendation dated 2024-12-12 | Separate from KWCAG 2.2. Distinguish removal of Parsing 4.1.1 from current success criteria. Do not replace it with a WCAG 3 draft. [Standard][WCAG] · [Change explanation][PARSING] |
| W3C WAI / WHATWG HTML | Official online references at the check date; continuously maintained | Implementation examples and HTML exceptions. Record the applicable edition and validator version. |

### 7.2 Technical References

| Topic | Official reference |
| --- | --- |
| Images and labels | [W3C Images Tutorial][IMAGES] · [W3C Labeling Controls][LABELS] |
| New-window warnings and their status | [W3C G201][G201] — an advisory implementation technique, not an independent success criterion |
| HTML void elements and optional tags | [WHATWG HTML Syntax][HTML] |

Searches, supplementary procedures, source-location tracking, and code comparisons were authored for this checklist. A citation does not certify every example. Connect actual findings to specific applicable clauses, policies, and project evidence.

[KWCAG]: https://www.rra.go.kr/ko/reference/kcsList_view.do?nb_seq=5247&nb_type=6
[NIA]: https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?bcIdx=25083&cbIdx=90549
[WCAG]: https://www.w3.org/TR/WCAG22/
[PARSING]: https://www.w3.org/WAI/WCAG22/Understanding/parsing.html
[IMAGES]: https://www.w3.org/WAI/tutorials/images/
[LABELS]: https://www.w3.org/WAI/tutorials/forms/labels/
[G201]: https://www.w3.org/WAI/WCAG22/Techniques/general/G201
[HTML]: https://html.spec.whatwg.org/multipage/syntax.html#optional-tags

<a id="raw"></a>
## 8. Translated Source Excerpt

Source: the user message in the referenced conversation, translated title "Preparing a Security Weakness Checklist," conversation ID `6af15a77-e558-83e8-98ca-83ad9d3ef5ad`. The original PDF, page images, and detailed scan logs were not supplied. **The following is an English translation, not a verbatim English report.** Numbers, row order, and unresolved markers are retained. Tags inside the block are inert source text.

````text
1. Text Alternatives 323 273 15.5   image missing alternative text 273 273 0.0    Missing alternative text 50 0 100.0    Missing alternative text - - -    Missing alternative text - - - 2. Titles 230 3 98.7 Missing page title 217 3 98.6    Missing title - - -   Missing title 13 0 100.0 3. Default Language 217 0 100.0 Default language undefined 217 0 100.0 4. Advance Warning of New Windows 22 10 54.5   <a> unannounced new window 22 10 54.5   <area> unannounced new window - - - 5. Labels 885 339 61.7   <input> missing label 885 339 61.7   <textarea> missing label - - -   <select> missing label - - - 6. Markup Syntax 217 212 2.3    Duplicate id error 217 0 100.0 Duplicate attribute name error 217 0 100.0 Start/end tag mismatch error 217 0 100.0 Missing end tag error 217 212 2.3 Missing start tag error 217 178 18.0 Improper tag nesting error 217 0 100.0 <!--EndFragment--> </body> </html>
````
