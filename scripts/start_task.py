#!/usr/bin/env python3
# 개발 작업별 계획·체크리스트·인수인계·검증 양식을 원본 훼손 없이 생성한다.
import argparse
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--task',required=True,help='영문/한글/숫자/하이픈/밑줄 작업 이름')
    args=parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_가-힣-]{1,60}', args.task):
        parser.error('작업 이름은 문자·숫자·언더스코어·하이픈만 사용하세요.')
    root=Path(__file__).resolve().parents[1]
    today=datetime.now(timezone(timedelta(hours=9))).date()
    target=root/'docs'/'agent'/'records'/f'{today.isoformat()}-{args.task}'
    if not target.resolve().is_relative_to(root):
        parser.error('작업 기록 경로가 프로젝트 밖을 가리킵니다.')
    templates=root/'docs'/'agent'/'templates'
    try:
        contents={name:(templates/name).read_bytes() for name in ('plan.md','checklist.md','context-notes.md','verification.md')}
        target.mkdir(parents=True,exist_ok=False)
    except FileExistsError:
        parser.error('이미 존재하는 작업 폴더를 덮어쓰지 않습니다: '+str(target))
    except OSError as error:
        parser.error(str(error))
    for name,content in contents.items():
        with (target/name).open('xb') as output:
            output.write(content)
    print('생성 완료: '+str(target))
if __name__=='__main__': main()
