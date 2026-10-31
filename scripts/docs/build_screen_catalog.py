# Vue 라우터의 명시적 화면 경로와 컴포넌트를 추출해 화면 목록을 생성한다.
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'frontend/src/router/index.js'
OUTPUT = ROOT / 'docs/product/screen-catalog.md'


def render():
    source = SOURCE.read_text(encoding='utf-8')
    imports = dict(re.findall(r"import (\w+) from '([^']+\.vue)'", source))
    routes = {}
    for match in re.finditer(r"\{\s*path:\s*'([^']+)'([^{}]*?)component:\s*(\w+)", source):
        route, body, component = match.groups()
        label = re.search(r"name:\s*'([^']+)'", body)
        routes[route] = (label.group(1) if label else {'/chat/mentions': '채팅 멘션', '/chat/tags': '채팅 태그'}.get(route, '하위 화면'), component)
    for route, component in re.findall(r"\['(/planner/[^']+)',\s*(\w+)\]", source):
        routes[route] = ('플래너 ' + {'daily': '일간', 'weekly': '주간', 'monthly': '월간', 'yearly': '연간'}[route.rsplit('/', 1)[1]], component)
    if not {'/', '/auth/signup', '/settings/:section?', '/planner/yearly', '/tasks/:id'} <= routes.keys():
        raise SystemExit('라우터 형식이 변경되었습니다. 추출 규칙을 검토하세요.')
    lines = ['# 현재 화면 경로 목록', '', '작성일 2026-10-31. 수정일 2026-10-31. Vue 라우터의 명시적 경로와 플래너 매핑을 정적으로 추출한 생성 문서입니다.', '',
             f'경로 {len(routes)}개입니다. 동일 컴포넌트의 여러 경로·선택 파라미터를 별개 목록 행으로 표시합니다. 라우트 개수는 기능 완성도나 실제 접근 권한·서버 연결 검증 수가 아닙니다. 설정의 section별 탭과 모달은 별도 경로로 세지 않습니다.', '',
             '상세 입력·레이아웃·상태·흐름은 [화면 명세](screen-design.md)에 관리합니다. 화면 카탈로그 데이터의 기획 항목과 실제 라우트는 다를 수 있습니다.', '',
             '## 목차', '', '- [화면 목록](#화면-목록)', '- [재생성](#재생성)', '', '## 화면 목록', '',
             '| 경로 | 표시 역할 | 컴포넌트 소스 | 확인할 경계 |', '| --- | --- | --- | --- |']
    for route, (label, component) in sorted(routes.items()):
        target = (SOURCE.parent / imports[component]).resolve()
        if not target.is_file():
            raise SystemExit(f'컴포넌트 파일이 없습니다: {component}')
        link = '../../' + target.relative_to(ROOT).as_posix()
        if route.startswith('/admin') or route in ('/sitemap', '/screens/:id'):
            boundary = '관리자 셸·서버 ADMIN·운영 프록시 확인'
        elif route.startswith('/chat') or route in ('/mentions', '/tags'):
            boundary = '인증 API·채팅 시연·개인 기록 출처 구분'
        elif route in ('/insight', '/sync', '/auth/social', '/auth/reset-password'):
            boundary = '화면 존재와 제공자 실행 가능 여부 구분'
        elif route.startswith('/auth'):
            boundary = '가입·로그인 서버 연결과 화면별 실제 저장 확인'
        else:
            boundary = '로컬 store·API·소유권·갱신 실패를 실제 호출로 확인'
        lines.append(f'| `{route}` | {label} | [{component}]({link}) | {boundary} |')
    lines += ['', '## 재생성', '', '```powershell', 'python scripts/docs/build_screen_catalog.py',
              'python scripts/docs/build_screen_catalog.py --check', '```', '',
              '동적으로 구성하는 라우터로 바뀌면 이 정적 추출기를 함께 수정하고 실제 화면 이동을 별도 검증합니다.', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = render()
    if args.check:
        if OUTPUT.read_text(encoding='utf-8') != content:
            raise SystemExit('화면 목록이 라우터와 다릅니다. 재생성하세요.')
        print('화면 목록·라우터·컴포넌트 경로 일치.')
    else:
        OUTPUT.write_text(content, encoding='utf-8')
        print('화면 목록 생성.')


if __name__ == '__main__':
    main()
