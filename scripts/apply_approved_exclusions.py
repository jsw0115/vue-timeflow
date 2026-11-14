#!/usr/bin/env python3
# 승인된 개별 오탐만 스캐너 결과에서 별도로 분리하며 원본을 보존한다.
"""Manually approved exact-fingerprint suppressions only. No default automatic ignoring."""
import argparse
import csv
import hashlib
from datetime import date
from pathlib import Path

FIELDS=('finding_id','file','line','rule_id','snippet')
APPROVAL=('fingerprint','decision','reviewer','evidence','expires_on')

def fingerprint(row):
    return hashlib.sha256('\x1f'.join((row.get(k) or '' for k in FIELDS)).encode('utf-8')).hexdigest()

def read_rows(path, required):
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or len(set(reader.fieldnames)) != len(reader.fieldnames) or any(k not in reader.fieldnames for k in required):
            raise ValueError(f'{path}: CSV 필수 열 누락 {required}')
        rows=list(reader)
        if any(None in row or any(row[k] is None or not row[k].strip() for k in required) for row in rows):
            raise ValueError(f'{path}: CSV 필수 값 누락 또는 열 수 불일치')
        return rows, reader.fieldnames

def write(path, rows, names):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('x',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=names,extrasaction='ignore')
        w.writeheader();w.writerows(rows)

def main():
    ap=argparse.ArgumentParser(description='증빙·검토자·기한이 있는 승인 오탐만 분리(원본 보존)')
    ap.add_argument('--input',required=True,help='원본 스캐너 결과 CSV')
    ap.add_argument('--approvals',required=True,help='승인장부 CSV')
    ap.add_argument('--remaining',required=True,help='검토 대상/미승인 탐지')
    ap.add_argument('--excluded',required=True,help='승인 제외된 탐지: 추적용 별도 파일')
    args=ap.parse_args()
    paths=[Path(x).resolve() for x in (args.input,args.approvals,args.remaining,args.excluded)]
    if len(set(paths))!=4: ap.error('입력/승인장부/출력 파일은 모두 다른 경로여야 합니다.')
    if any(path.exists() or path.is_symlink() for path in paths[2:]):
        ap.error('기존 출력 파일을 덮어쓰지 않습니다.')
    try:
        findings,columns=read_rows(paths[0],FIELDS)
        approvals,_=read_rows(paths[1],APPROVAL)
        valid={}
        for apv in approvals:
            if apv['decision']!='FALSE_POSITIVE_APPROVED':
                raise ValueError('승인장부 decision은 FALSE_POSITIVE_APPROVED만 허용')
            fp=apv['fingerprint'].strip().lower()
            if not re_fullmatch_sha256(fp): raise ValueError('유효하지 않은 fingerprint: '+fp[:12])
            if fp in valid: raise ValueError('중복 fingerprint 승인 거부: '+fp[:12])
            if not apv['reviewer'].strip() or not apv['evidence'].strip():
                raise ValueError('검토자·증빙이 없는 오탐 제외 불가: '+fp[:12])
            try: expiry=date.fromisoformat(apv['expires_on'])
            except ValueError as e: raise ValueError('만료일은 YYYY-MM-DD: '+fp[:12]) from e
            if expiry<date.today(): raise ValueError('만료된 오탐 승인: '+fp[:12])
            valid[fp]=apv
        remaining,excluded=[],[]
        matched=set()
        for finding in findings:
            fp=fingerprint(finding)
            if fp in valid:
                item=dict(finding)
                item.update({'exclusion_decision':'FALSE_POSITIVE_APPROVED','exclusion_evidence':valid[fp]['evidence'],'exclusion_reviewer':valid[fp]['reviewer'],'exclusion_expires_on':valid[fp]['expires_on'],'fingerprint':fp})
                excluded.append(item);matched.add(fp)
            else:
                remaining.append(finding)
        if valid.keys()-matched:
            raise ValueError('현재 스캐너 결과와 일치하지 않는 승인 fingerprint 존재: '+str(len(valid.keys()-matched))+'건. 결과 변경 시 재심사 필요.')
        write(paths[2],remaining,columns)
        write(paths[3],excluded,columns+['fingerprint','exclusion_decision','exclusion_evidence','exclusion_reviewer','exclusion_expires_on'])
        print(f'원본 {len(findings)}건: 검토 유지 {len(remaining)}건, 근거·승인 충족 제외 {len(excluded)}건. 원본은 변경하지 않음.')
    except (ValueError, OSError) as e:
        ap.error(str(e))

def re_fullmatch_sha256(value):
    return len(value)==64 and all(c in '0123456789abcdef' for c in value)

if __name__=='__main__': main()
