# 한국어 개발 안내 원문을 날짜 필드와 자동 목차가 있는 Word 문서로 변환한다.
from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
HANDBOOK = ROOT / 'docs' / 'handbook'
FONT = 'Malgun Gothic'


def xml_element(tag, **attrs):
    node = OxmlElement('w:' + tag)
    for key, value in attrs.items():
        node.set(qn('w:' + key), str(value))
    return node


def font(style, name, size, bold=False):
    style.font.name = name
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor(0, 0, 0)
    fonts = style.element.get_or_add_rPr().rFonts
    for attribute in list(fonts.attrib):
        if 'theme' in attribute.lower():
            del fonts.attrib[attribute]
    for role in ('ascii', 'hAnsi', 'eastAsia', 'cs'):
        fonts.set(qn('w:' + role), name)
    lang = xml_element('lang', val='ko-KR', eastAsia='ko-KR')
    style.element.get_or_add_rPr().append(lang)


def inline(paragraph, text):
    for index, chunk in enumerate(text.split('`')):
        run = paragraph.add_run(chunk)
        if index % 2:
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)


def field(paragraph, instruction, cached=''):
    paragraph.add_run()._r.append(xml_element('fldChar', fldCharType='begin', dirty='true'))
    code = OxmlElement('w:instrText')
    code.set(qn('xml:space'), 'preserve')
    code.text = ' ' + instruction + ' '
    paragraph.add_run()._r.append(code)
    paragraph.add_run()._r.append(xml_element('fldChar', fldCharType='separate'))
    if cached:
        paragraph.add_run(cached)
    paragraph.add_run()._r.append(xml_element('fldChar', fldCharType='end'))


def setup(document):
    section = document.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(.72)
    section.bottom_margin = Inches(.72)
    section.left_margin = Inches(.8)
    section.right_margin = Inches(.8)
    section.footer_distance = Inches(.32)
    styles = document.styles
    for name, size, bold in [('Normal', 11, False), ('Title', 25, False),
                             ('Subtitle', 11, False), ('Heading 1', 16, True),
                             ('Heading 2', 12, True), ('List Bullet', 11, False),
                             ('List Number', 11, False)]:
        font(styles[name], FONT, size, bold)
        fmt = styles[name].paragraph_format
        fmt.line_spacing = 1.3
        fmt.space_after = Pt(7)
        fmt.widow_control = True
    styles['Title'].paragraph_format.space_after = Pt(16)
    for name in ('Title', 'Subtitle'):
        for border in list(styles[name].element.findall('.//' + qn('w:pBdr'))):
            border.getparent().remove(border)
    for name in ('Heading 1', 'Heading 2'):
        styles[name].paragraph_format.keep_with_next = True
        styles[name].paragraph_format.space_before = Pt(16)
        styles[name].paragraph_format.space_after = Pt(9)
    for name, size in [('Code', 9), ('Metadata', 9), ('TOC 1', 11), ('TOC 2', 10)]:
        if name not in styles:
            styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        font(styles[name], 'Consolas' if name == 'Code' else FONT, size)
        fmt = styles[name].paragraph_format
        fmt.line_spacing = 1.15 if name == 'Code' else 1.3
        fmt.space_after = Pt(3 if name == 'Code' else 7)
    styles['Code'].element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), FONT)
    styles['Code'].paragraph_format.keep_with_next = False
    styles['TOC 1'].paragraph_format.tab_stops.add_tab_stop(Inches(6.7))
    settings = document.settings.element
    settings.append(xml_element('updateFields', val='true'))
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.style = styles['Metadata']
    field(p, 'PAGE', '1')
    p.add_run(' / ')
    field(p, 'NUMPAGES', '1')


def table(document, rows):
    headers = rows[0]
    data = rows[2:]
    count = len(headers)
    widths = [2.15, 4.75] if count == 2 else [1.65, 2.5, 2.75]
    if count == 3 and headers[0] == '순서':
        widths = [.45, 2.6, 3.85]
    if len(widths) != count:
        widths = [6.9 / count] * count
    result = document.add_table(rows=1, cols=count)
    result.autofit = False
    for column, width in zip(result.columns, widths):
        column.width = Inches(width)
    borders = xml_element('tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        borders.append(xml_element(edge, val='single', sz='4', color='D9D9D9'))
    result._tbl.tblPr.append(borders)
    margin = xml_element('tblCellMar')
    for side in ('top', 'left', 'bottom', 'right'):
        margin.append(xml_element(side, w='95', type='dxa'))
    result._tbl.tblPr.append(margin)
    all_rows = [headers] + data
    for index, values in enumerate(all_rows):
        row = result.rows[0] if index == 0 else result.add_row()
        row._tr.get_or_add_trPr().append(xml_element('cantSplit'))
        if index == 0:
            row._tr.get_or_add_trPr().append(xml_element('tblHeader'))
        for cell, value, width in zip(row.cells, values, widths):
            cell.width = Inches(width)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cell._tc.get_or_add_tcPr().append(xml_element('shd', fill='E8EBE8' if index == 0 else 'FFFFFF'))
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.25
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.space_before = Pt(3)
            inline(p, value)
            for run in p.runs:
                run.font.size = Pt(10)
                run.bold = index == 0
    document.add_paragraph().paragraph_format.space_after = Pt(1)


def add_toc(document, headings):
    p = document.add_paragraph()
    p.add_run('목차').bold = True
    p = document.add_paragraph(style='TOC 1')
    p.add_run()._r.append(xml_element('fldChar', fldCharType='begin', dirty='true'))
    instruction = OxmlElement('w:instrText')
    instruction.set(qn('xml:space'), 'preserve')
    instruction.text = ' TOC \\o "1-2" \\h \\z \\u '
    p.add_run()._r.append(instruction)
    p.add_run()._r.append(xml_element('fldChar', fldCharType='separate'))
    for index, heading in enumerate(headings):
        if index:
            p = document.add_paragraph(style='TOC 1')
        p.add_run(heading)
    p.add_run()._r.append(xml_element('fldChar', fldCharType='end'))


def build(source):
    lines = source.read_text(encoding='utf-8').splitlines()
    assert lines[0].startswith('# ')
    document = Document()
    setup(document)
    props = document.core_properties
    now = datetime.now(timezone.utc)
    target = HANDBOOK / (source.stem + '.docx')
    props.created = now
    if target.exists():
        props.created = Document(target).core_properties.created or now
    props.modified = now
    props.title = lines[0][2:]
    props.subject = 'Timebar Diary 신규 개발자 안내'
    props.author = 'Timebar Diary'
    props.keywords = '개발 안내, 로컬 실행, 배포, 기능 명세'
    props.language = 'ko-KR'
    document.add_paragraph(props.title, style='Title')
    first_heading = next(i for i, line in enumerate(lines) if line.startswith('## '))
    for line in lines[1:first_heading]:
        if line.strip():
            inline(document.add_paragraph(), line)
    p = document.add_paragraph(style='Metadata')
    p.add_run('생성일  ')
    field(p, 'CREATEDATE \\@ "yyyy년 MM월 dd일"', '2026년 10월 31일')
    p.add_run('    수정일  ')
    field(p, 'SAVEDATE \\@ "yyyy년 MM월 dd일"', '2026년 10월 31일')
    document.add_paragraph('소스 기준 2026년 10월 31일  |  기준 커밋 98ae7c7', style='Metadata')
    document.add_paragraph('갱신 방법  저장 후 Ctrl+A와 F9를 누르고 목차 전체 업데이트를 선택합니다.', style='Metadata')
    add_toc(document, [line[3:] for line in lines if line.startswith('## ')])
    document.add_page_break()
    index = first_heading
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith('```'):
            index += 1
            while index < len(lines) and not lines[index].startswith('```'):
                p = document.add_paragraph(lines[index], style='Code')
                p.paragraph_format.keep_with_next = index + 1 < len(lines) and not lines[index + 1].startswith('```')
                index += 1
        elif line.startswith('|'):
            rows = []
            while index < len(lines) and lines[index].startswith('|'):
                rows.append([cell.strip() for cell in lines[index].strip().strip('|').split('|')])
                index += 1
            table(document, rows)
            continue
        elif line.startswith('## '):
            document.add_paragraph(line[3:], style='Heading 1')
        elif line.startswith('### '):
            document.add_paragraph(line[4:], style='Heading 2')
        elif line.startswith('- '):
            inline(document.add_paragraph(style='List Bullet'), line[2:])
        elif re.match(r'^\d+\. ', line):
            inline(document.add_paragraph(style='List Number'), re.sub(r'^\d+\. ', '', line))
        else:
            inline(document.add_paragraph(), line)
        index += 1
    document.save(target)
    print(target.relative_to(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='특정 원문만 변환합니다.')
    args = parser.parse_args()
    sources = [args.source.resolve()] if args.source else sorted((HANDBOOK / 'source').glob('*.md'))
    if not sources:
        raise SystemExit('변환할 원문이 없습니다.')
    for source in sources:
        build(source)


if __name__ == '__main__':
    main()
