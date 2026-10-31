# 개발 안내 Word 문서의 필드와 원문 대응 및 저장소 근거를 검사한다.
from pathlib import Path
import json
import re
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from docx import Document

ROOT = Path(__file__).resolve().parents[2]
HANDBOOK = ROOT / 'docs' / 'handbook'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def verify():
    sources = sorted((HANDBOOK / 'source').glob('*.md'))
    assert len(sources) == 6, '원문은 여섯 개여야 합니다.'
    for source in sources:
        target = HANDBOOK / (source.stem + '.docx')
        assert target.is_file(), target
        with ZipFile(target) as archive:
            assert archive.testzip() is None, target
            xml = ET.fromstring(archive.read('word/document.xml'))
            instructions = [''.join(node.itertext()).strip() for node in xml.findall('.//w:instrText', NS)]
            for required in ('CREATEDATE', 'SAVEDATE', 'TOC'):
                assert any(re.match(r'^' + required + r'\b', code) for code in instructions), (target, required)
            assert not any(name.endswith('vbaProject.bin') for name in archive.namelist()), target
            settings = ET.fromstring(archive.read('word/settings.xml'))
            update = settings.find('w:updateFields', NS)
            assert update is not None and update.get('{' + NS['w'] + '}val') in ('true', '1'), target
        document = Document(target)
        expected = [line[3:] for line in source.read_text(encoding='utf-8').splitlines() if line.startswith('## ')]
        actual = [p.text for p in document.paragraphs if p.style.name == 'Heading 1']
        assert actual == expected, (target, actual, expected)
        text = '\n'.join(p.text for p in document.paragraphs)
        assert '\ufffd' not in text and '[[TOC]]' not in text, target
        assert document.core_properties.language == 'ko-KR', target
        assert document.core_properties.created and document.core_properties.modified, target
        assert not document.styles['Title'].element.findall('.//{' + NS['w'] + '}pBdr'), target
        assert not any(re.search(r'[가-힣].*:\s*$', line) for line in source.read_text(encoding='utf-8').splitlines() if not line.startswith('http')), source
        print(f'PASS {target.name}: 날짜 및 목차 필드, 제목 {len(actual)}개, 한국어 속성, ZIP 무결성')
    package = json.loads((ROOT / 'frontend/package.json').read_text(encoding='utf-8'))
    assert package['version'] == '0.1.0'
    assert "version = '0.1.0'" in (ROOT / 'backend/build.gradle').read_text(encoding='utf-8')
    operations = json.loads((ROOT / 'docs/api/frontend-backend-2026-10-10/operations.json').read_text(encoding='utf-8'))
    assert len(operations) == 277, len(operations)
    assert (ROOT / 'backend/src/main/java/kr/timebar/diary/security/SecurityConfig.java').is_file()
    print('PASS 소스 기준: 웹 및 API 0.1.0, 선언된 API 277개, 관리자 보안 소스 경로')


if __name__ == '__main__':
    verify()
