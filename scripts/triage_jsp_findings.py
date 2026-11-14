#!/usr/bin/env python3
# JSP 정적 분석 보고서에서 태그 지시문 오탐 검토 후보만 찾아 별도 CSV로 기록한다.
"""Input CSV: finding_id,file,line,rule_id,snippet (UTF-8). No suppression performed."""
import argparse
import csv
import hashlib
from pathlib import Path

REQUIRED = ('finding_id', 'file', 'line', 'rule_id', 'snippet')
# Only syntactic directives with literal patterns, not expressions or dangerous sinks.
SAFE_DIRECTIVES = ('<%@ taglib ', '<%@ page ', '<%@ include file="')
SUSPICIOUS = ('escapexml="false"', "escapexml='false'", '<script', 'onclick', 'onerror', 'onload', 'innerhtml', 'document.write', 'javascript:', 'eval(', 'exec(', '<jsp:include page="${')

def evaluate(row):
    text = row['snippet'].strip().lower()
    path = row['file'].lower()
    if not path.endswith(('.jsp', '.jspx', '.tag', '.tagx')):
        return 'NEEDS_REVIEW', 'JSP 계열 파일이 아니거나 파일 유형 확인 필요'
    if any(word in text for word in SUSPICIOUS):
        return 'NEEDS_REVIEW', '스크립트/위험 Sink 또는 안전성 확인이 필요한 패턴'
    if text.startswith(SAFE_DIRECTIVES) and text.endswith('%>') and '${' not in text and '<%=' not in text:
        return 'REVIEW_CANDIDATE', 'JSP 정적 지시문으로 보이나 데이터 흐름 확인 필요'
    return 'NEEDS_REVIEW', '태그 존재만으로 오탐 확정 불가'

def main():
    ap = argparse.ArgumentParser(description='JSP 오탐 검토 후보 분류(취약점 삭제/억제 없음)')
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    args = ap.parse_args()
    src, dst = Path(args.input), Path(args.output)
    if src.resolve() == dst.resolve():
        ap.error('입력과 출력 경로는 달라야 합니다.')
    if dst.exists() or dst.is_symlink():
        ap.error('기존 출력 파일을 덮어쓰지 않습니다.')
    with src.open('r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or len(set(reader.fieldnames)) != len(reader.fieldnames) or any(k not in reader.fieldnames for k in REQUIRED):
            ap.error('CSV 필수 열: ' + ','.join(REQUIRED))
        rows = []
        for row in reader:
            if None in row or any(row[k] is None or not row[k].strip() for k in REQUIRED):
                ap.error('CSV 행의 필수 값이 비어 있거나 열 수가 맞지 않습니다.')
            status, reason = evaluate(row)
            rows.append({'finding_id': row['finding_id'], 'file': row['file'], 'line': row['line'], 'rule_id': row['rule_id'], 'classification':status, 'reason':reason, 'approved_exclusion':'NO', 'fingerprint': hashlib.sha256('\x1f'.join((row[k] or '' for k in REQUIRED)).encode('utf-8')).hexdigest()})
    dst.parent.mkdir(parents=True, exist_ok=True)
    with dst.open('x', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['finding_id','file','line','rule_id','classification','reason','approved_exclusion','fingerprint'])
        writer.writeheader(); writer.writerows(rows)
    print(f'분류 완료: {len(rows)}건; 승인 제외: 0건. 검증 전 모든 경고는 유지합니다.')
if __name__=='__main__': main()
