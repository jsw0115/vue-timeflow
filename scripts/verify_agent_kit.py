#!/usr/bin/env python3
# 프로젝트에 적용한 Codex 문서·스킬·보조 스크립트의 구성을 검사한다.
import ast
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
GUIDES = (
    'AGENTS.md', 'PROJECT_CONTEXT.md', 'PROJECT_RULES.md', 'CODING_GUIDE.md',
    'DESIGN_GUIDE.md', 'DB_SCHEMA.md', 'API_SPEC.md', 'BUILD_GUIDE.md',
    'TEST_GUIDE.md', 'RELEASE_GUIDE.md', 'README_적용가이드.md', 'PROMPT_LIBRARY.md',
)
SECURITY = (
    'README.md', 'SECURITY_POLICY.md', 'SW_SECURE_CODING_49.md',
    'WEB_VULNERABILITY_28.md', 'WEB_ACCESSIBILITY_KWCAG22_33.md',
    'JSP_FALSE_POSITIVE_POLICY.md', 'DEVELOPMENT_SECURITY_GATE.md',
    'OWASP_TOP10_2025.md', 'SAST_DAST_TOOLING.md', 'REFERENCES.md',
    'templates/APPROVED_EXCLUSIONS.example.csv', 'templates/FALSE_POSITIVE_REGISTER.md',
    'templates/PR_SECURITY_CHECKLIST.md', 'templates/SECURITY_TEST_REPORT.md',
)
TEMPLATES = ('plan.md', 'checklist.md', 'context-notes.md', 'verification.md')
SCRIPTS = ('start_task.py', 'verify_agent_kit.py', 'triage_jsp_findings.py', 'apply_approved_exclusions.py')
EXPECTED_SKILLS = (
    'api-contract-review', 'database-change-review', 'document-evidence-handoff',
    'feature-with-security', 'jsp-finding-triage', 'release-security-gate',
    'safe-debug', 'secure-code-review', 'ui-with-accessibility',
    'web-accessibility-review', 'web-vulnerability-review',
)
CHECKLISTS = (
    ('SW_SECURE_CODING_49.md', r'^\| (SC-\d+) \|', {f'SC-{n:02}' for n in range(1, 50)}),
    ('WEB_VULNERABILITY_28.md', r'^\| ([A-Z]{2}) \|',
     set('BO FS LI OC SI SS XI DI IL CS XS BF IA PR CF SE IN SC SF AU PV FU FD AE PT PL SN CC'.split())),
    ('WEB_ACCESSIBILITY_KWCAG22_33.md', r'^\| (\d+\.\d+\.\d+) \|',
     set(('5.1.1 5.2.1 5.3.1 5.3.2 5.3.3 5.4.1 5.4.2 5.4.3 5.4.4 '
          '6.1.1 6.1.2 6.1.3 6.1.4 6.2.1 6.2.2 6.3.1 6.4.1 6.4.2 6.4.3 6.4.4 '
          '6.5.1 6.5.2 6.5.3 6.5.4 7.1.1 7.2.1 7.2.2 7.3.1 7.3.2 7.3.3 7.3.4 8.1.1 8.2.1').split())),
)


def verify(root=ROOT):
    root = root.resolve()
    required = list(GUIDES) + [f'security/{name}' for name in SECURITY]
    required += ['docs/agent/README.md', 'docs/agent/records/README.md']
    required += [f'docs/agent/templates/{name}' for name in TEMPLATES]
    required += [f'scripts/{name}' for name in SCRIPTS]
    required += ['scripts/tests/test_agent_kit.py']
    required += [f'.agents/skills/{name}/SKILL.md' for name in EXPECTED_SKILLS]
    errors = [f'누락: {name}' for name in required if not (root/name).is_file()]

    for name in EXPECTED_SKILLS:
        path = root/'.agents/skills'/name/'SKILL.md'
        if not path.is_file():
            continue
        content = path.read_text(encoding='utf-8')
        header = re.match(r'\A---\n(.*?)\n---\n', content, re.S)
        if not header or not re.search(rf'^name: {re.escape(name)}$', header[1], re.M) or not re.search(r'^description: \S.+$', header[1], re.M):
            errors.append(f'스킬 메타데이터 오류: {name}')

    for name, pattern, expected in CHECKLISTS:
        path = root/'security'/name
        if path.is_file():
            identifiers = re.findall(pattern, path.read_text(encoding='utf-8'), re.M)
            if len(identifiers) != len(expected) or set(identifiers) != expected:
                errors.append(f'{name}: 중복·누락·잘못된 항목 ID, {len(expected)}개 고유 항목 필요')

    paths = {root/name for name in required if name.endswith('.md')}
    paths.update((root/'docs/agent/records').rglob('*.md'))
    for path in sorted(paths):
        if not path.is_file():
            continue
        content = path.read_text(encoding='utf-8')
        for target in re.findall(r'\[[^\]\n]+\]\(([^)\s]+)\)', content):
            link = urlsplit(target)
            if link.scheme or link.netloc or not link.path:
                continue
            resolved = (path.parent/unquote(link.path)).resolve()
            if not resolved.is_relative_to(root) or not resolved.exists():
                errors.append(f'문서 경로 오류: {path.relative_to(root)} -> {target}')

    for name in (*SCRIPTS, 'tests/test_agent_kit.py'):
        path = root/'scripts'/name
        if path.is_file():
            try:
                ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
            except SyntaxError as error:
                errors.append(f'Python 구문 오류: {name}: {error}')
    return errors


def main():
    errors = verify()
    for error in errors:
        print('FAIL:', error)
    if errors:
        return 1
    print('PASS: Codex 스킬 11종, 필수 문서·로컬 링크·Python 구문 및 고유 49/28/33 항목 확인')
    print('실제 앱의 SAST/DAST/접근성 검사나 외부 표준의 정확성 검증을 대신하지 않습니다.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
