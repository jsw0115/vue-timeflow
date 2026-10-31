# 기준 문서의 링크·목차·날짜·요구 추적과 중복 원문을 검증한다.
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
PRIMARY = [
    'README.md', 'docs/README.md', 'docs/project/document-register.md',
    'docs/planning/project-definition.md', 'docs/planning/requirements.md',
    'docs/planning/business-plan.md', 'docs/planning/wbs.md',
    'docs/architecture/system-architecture.md', 'docs/architecture/modules-and-interfaces.md',
    'docs/product/screen-design.md', 'docs/product/screen-catalog.md',
    'docs/database/current-database.md', 'docs/database/environment.md',
    'docs/standards/glossary.md', 'docs/standards/coding-standards.md',
    'docs/development/environments.md', 'docs/development/troubleshooting.md',
    'docs/deployment/release-plan.md', 'docs/operations/runbook.md',
    'docs/releases/README.md', 'docs/releases/backlog.md',
    'docs/quality/test-plan.md', 'docs/portfolio/README.md', 'docs/api/README.md',
]
ALIASES = [
    'docs/development/setup.md', 'docs/development/local-platforms.md',
    'docs/cross-platform-guide.md', 'docs/database/table-design.md',
    'docs/database/schema-alignment.md', 'docs/product/feature-design.md',
    'docs/product-spec-v2.md', 'docs/api/api-specification.md', 'docs/deployment/production.md',
]


def prose(content):
    result = []
    fence = None
    for line in content.splitlines():
        match = re.match(r'^\s*(`{3,}|~{3,})', line)
        if match:
            token = match[1][0]
            if fence is None:
                fence = token
            elif token == fence:
                fence = None
            continue
        if fence is None:
            result.append(line)
    return '\n'.join(result), fence


def anchors(content):
    text, _ = prose(content)
    values = re.findall(r'<a\s+(?:id|name)="([^"]+)"', text)
    seen = {}
    for title in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.M):
        title = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', title).lower().replace('`', '')
        slug = ''.join(c for c in title if c.isspace() or c in '_-' or unicodedata.category(c)[0] in 'LNM')
        slug = re.sub(r'\s', '-', slug)
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        values.append(slug if not count else f'{slug}-{count}')
    return set(values)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', help='검증 결과 JSON 저장 경로. 저장소 내부만 허용.')
    args = parser.parse_args()
    paths = {ROOT / p for p in PRIMARY + ALIASES}
    for folder in ['docs/handbook/source', 'docs/product/ai-growth-2026-10-31',
                   'docs/development/documentation-system-2026-10-31']:
        paths.update((ROOT / folder).glob('*.md'))
    paths.update(ROOT / p for p in ['docs/handbook/README.md', 'docs/design/README.md', 'docs/api-info/README.md',
                                   'docs/design-implementation-plan.md', 'docs/screen-function-list-supplement.md'])
    errors = []
    contents = {}
    count_links = count_fragments = 0
    external = set()
    for path in sorted(paths):
        if not path.is_file():
            errors.append(f'{path.relative_to(ROOT)}: 파일 없음')
            continue
        content = path.read_text(encoding='utf-8-sig')
        contents[path] = content
        text, fence = prose(content)
        if fence:
            errors.append(f'{path.relative_to(ROOT)}: 코드 블록 닫기 누락')
        if '\ufffd' in content or re.search(r'\?{3,}', text):
            errors.append(f'{path.relative_to(ROOT)}: 손상된 문자 의심')
        if not content.endswith('\n'):
            errors.append(f'{path.relative_to(ROOT)}: 파일 끝 개행 없음')
        if path.relative_to(ROOT).as_posix() in PRIMARY:
            if not re.search(r'작성일\s+\d{4}-\d{2}-\d{2}', text) or not re.search(r'수정일\s+\d{4}-\d{2}-\d{2}', text):
                errors.append(f'{path.relative_to(ROOT)}: 작성일·수정일 누락')
            if '## 목차' not in text:
                errors.append(f'{path.relative_to(ROOT)}: 목차 누락')
            for number, line in enumerate(text.splitlines(), 1):
                if re.search(r'[가-힣].*[:：]\s*$', line):
                    errors.append(f'{path.relative_to(ROOT)}:{number}: 한국어 문장 끝 콜론')
        for raw in re.findall(r'(?<!!)\[[^\]\n]+\]\(([^\n)]+)\)', text):
            dest = raw.strip().strip('<>')
            if dest.startswith(('https://', 'http://')):
                external.add(dest)
                continue
            if dest.startswith(('mailto:', 'app:', 'plugin:')):
                continue
            name, _, fragment = dest.partition('#')
            target = (path.parent / unquote(name)).resolve() if name else path
            count_links += 1
            if not target.is_file():
                errors.append(f'{path.relative_to(ROOT)}: 링크 대상 없음 {dest}')
            elif fragment and target.suffix == '.md':
                count_fragments += 1
                if unquote(fragment) not in anchors(target.read_text(encoding='utf-8-sig')):
                    errors.append(f'{path.relative_to(ROOT)}: 앵커 없음 {dest}')
    groups = [
        ('REQ-[FN]\\d{2}', ROOT/'docs/planning/requirements.md'),
        ('TC-\\d{2}', ROOT/'docs/quality/test-plan.md'),
        ('WBS-\\d{2}', ROOT/'docs/planning/wbs.md'),
    ]
    for pattern, definitions in groups:
        defined = set(re.findall(r'\| (' + pattern + r') \|', definitions.read_text(encoding='utf-8')))
        for path, content in contents.items():
            if path.relative_to(ROOT).as_posix() not in PRIMARY:
                continue
            used = set(re.findall(pattern, prose(content)[0]))
            unknown = used - defined
            if unknown:
                errors.append(f'{path.relative_to(ROOT)}: 추적 ID 미정의 {sorted(unknown)}')
    bodies = {}
    for rel in PRIMARY:
        path = ROOT / rel
        if path not in contents:
            continue
        body = '\n'.join(l for l in prose(contents[path])[0].splitlines()
                         if l.strip() and not l.startswith(('#', '작성일')))
        digest = hashlib.sha256(body.encode()).hexdigest()
        if len(body) > 300 and digest in bodies:
            errors.append(f'{rel}: 다른 기준 문서와 본문 중복 {bodies[digest]}')
        bodies[digest] = rel
    result = {'asOf': '2026-10-31', 'markdownFiles': len(contents), 'localLinks': count_links,
              'fragmentLinks': count_fragments, 'externalUrlsCountOnly': len(external),
              'scope': '기준 문서·연결 안내·안내서·AI 설계·이번 작업 기록. 외부 URL 호출·모든 과거 설계 검사는 아님.',
              'errors': errors}
    if args.report:
        report = (ROOT / args.report).resolve()
        if ROOT not in report.parents or report.suffix != '.json':
            parser.error('결과는 저장소 내부의 JSON 경로로 지정하세요.')
        report.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
