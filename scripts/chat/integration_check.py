"""Black-box chat checks against isolated chat-local servers; never production.

python scripts/chat/integration_check.py [--redis-outage]
Requires servers at 127.0.0.1:18080 and :18081 and infra/chat/compose.yml.
Creates disposable example.test users. Does not print or persist access tokens.
"""
import concurrent.futures
import json
from pathlib import Path
import queue
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

BASE='http://127.0.0.1:18080'
ROOT=Path(__file__).resolve().parents[2]
results=[]


def call(path, user=None, method='GET', body=None, expected=200):
    headers={'Content-Type':'application/json'}
    if user: headers['Authorization']='Bearer '+user['accessToken']
    request=urllib.request.Request(BASE+path,headers=headers,method=method,data=None if body is None else json.dumps(body).encode())
    try:
        response=urllib.request.urlopen(request,timeout=15)
    except urllib.error.HTTPError as error:
        response=error
    raw=response.read()
    data=json.loads(raw) if raw else {}
    assert response.status==expected,(path,response.status,data)
    return data.get('data')


def passed(name):
    results.append(name)
    print('PASS:',name,flush=True)


def user(label):
    email=f'chat-{label}-{uuid.uuid4().hex[:10]}@example.test'
    password='ChatLocal!927'
    call('/api/auth/signup',method='POST',body={'email':email,'password':password,'nickname':label,'agreeTerms':True,'agreePrivacy':True},expected=201)
    return call('/api/auth/login',method='POST',body={'email':email,'password':password})


owner,peer,outsider=user('Owner'),user('Peer'),user('Outsider')
passed('signup and login return real sessions')
call('/api/chat/rooms',expected=401)
passed('unauthenticated API is rejected')
room=call('/api/chat/rooms',owner,'POST',{'kind':'DM','memberIds':[peer['userId']]})
room_id=room['id']
same=call('/api/chat/rooms',peer,'POST',{'kind':'DM','memberIds':[owner['userId']]})
assert same['id']==room_id
passed('reciprocal DM creation reuses one room')
base=f'/api/chat/rooms/{room_id}'
call(base+'/messages',outsider,expected=404)
passed('non-member cannot read room history')
events=queue.Queue()
def stream():
    request=urllib.request.Request('http://127.0.0.1:18081/api/chat/events',headers={'Authorization':'Bearer '+peer['accessToken']})
    try:
        with urllib.request.urlopen(request,timeout=20) as response:
            event=''
            for line in response:
                text=line.decode().strip()
                if text.startswith('event:'): event=text[6:].strip()
                if text.startswith('data:'):
                    try:
                        events.put((event,json.loads(text[5:].strip())))
                        if event=='changed': break
                    except ValueError: pass
    except Exception as error: events.put(('error',str(error)))
threading.Thread(target=stream,daemon=True).start()
first=events.get(timeout=20)
assert first[0]=='connected',first
client=str(uuid.uuid4())
payload={'clientMessageId':client,'body':'@Peer #회고 #Plan 함께 계획을 나눠요.','mentionUserIds':[peer['userId']]}
message=call(base+'/messages',owner,'POST',payload)
signal=events.get(timeout=20)
assert signal[0]=='changed',signal
passed('Redis delivers an SSE notification across two backend nodes')
assert call(base+'/messages',owner,'POST',payload)['id']==message['id']
call(base+'/messages',owner,'POST',{**payload,'body':'changed'},409)
call(base+'/messages',owner,'POST',{**payload,'mentionUserIds':[]},409)
passed('retry is idempotent; changed body or mentions conflict')
assert call(base,peer)['unreadCount']==1
assert call('/api/chat/mentions',peer)['items'][0]['message']['id']==message['id']
assert call('/api/chat/mentions',outsider)['items']==[]
assert call('/api/chat/tags',outsider)['items']==[]
passed('unread, mention inbox and tag permissions use persisted membership')
assert set(message['tags'])=={'plan','회고'}
tag_query=urllib.parse.urlencode({'tag':'회고'})
assert call('/api/chat/tagged-messages?'+tag_query,peer)['items'][0]['message']['id']==message['id']
assert call(base+'/messages?'+tag_query,peer)['items'][0]['id']==message['id']
passed('Korean tags, global tag inbox and room tag filter return the same message')
call('/api/chat/mentions/'+message['id']+'/read',peer,'PUT')
assert call('/api/chat/mentions?unread=true',peer)['items']==[]
call('/api/chat/mentions/'+message['id']+'/read',outsider,'PUT',expected=404)
passed('mention read state is per recipient and authorized')
call(base+'/read',peer,'PUT',{'sequence':'1'})
assert call(base+'/read',peer,'PUT',{'sequence':'0'})['lastReadSequence']=='1'
call(base+'/read',peer,'PUT',{'sequence':'999'},400)
passed('read cursor is monotonic and cannot exceed persisted history')
call(base+'/messages',owner,'POST',{'clientMessageId':str(uuid.uuid4()),'body':'unauthorized mention','mentionUserIds':[outsider['userId']]},404)
call(base+'/messages',owner,'POST',{'clientMessageId':str(uuid.uuid4()),'body':' '},400)
call(base+'/messages?before=invalid',owner,expected=400)
passed('invalid mentions, blank bodies and malformed cursors are rejected')

def concurrent_send(number):
    return call(base+'/messages',owner,'POST',{'clientMessageId':str(uuid.uuid4()),'body':f'Concurrent {number}'})
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    sent=list(executor.map(concurrent_send,range(8)))
assert sorted(int(item['sequence']) for item in sent)==list(range(2,10))
passed('concurrent sends receive unique contiguous room sequence numbers')
latest=call(base+'/messages?limit=3',peer)
older=call(base+'/messages?limit=3&before='+latest['nextCursor'],peer)
assert not set(m['id'] for m in latest['items']) & set(m['id'] for m in older['items'])
assert len(call(base+'/messages?after=1&limit=100',peer)['items'])==8
passed('older-page and reconnect cursors have no overlap or missing messages')
group=call('/api/chat/rooms',owner,'POST',{'kind':'GROUP','name':'회고 모임','memberIds':[peer['userId'],outsider['userId']]})
group_base='/api/chat/rooms/'+group['id']
call(group_base+'/messages',owner,'POST',{'clientMessageId':str(uuid.uuid4()),'body':'#privategroup hello','mentionUserIds':[peer['userId']]})
call(group_base+'/members/me',owner,'DELETE',expected=409)
call(group_base+'/owner',owner,'PUT',{'userId':outsider['userId']})
call(group_base+'/members/me',peer,'DELETE',expected=204)
call(group_base+'/messages',peer,expected=404)
assert not any(item['message']['roomId']==group['id'] for item in call('/api/chat/mentions',peer)['items'])
assert call('/api/chat/tagged-messages?tag=privategroup',peer)['items']==[]
passed('owner transfer, leave and inbox permission revocation work together')
tokens=call('/api/auth/refresh',method='POST',body={'refreshToken':owner['refreshToken']})
tokens2=call('/api/auth/refresh',method='POST',body={'refreshToken':tokens['refreshToken']})
assert tokens['refreshToken']!=tokens2['refreshToken']
owner.update(tokens2)
passed('same-second token rotation returns distinct refresh tokens')
if '--redis-outage' in sys.argv:
    compose=['docker','compose','-f',str(ROOT/'infra/chat/compose.yml')]
    subprocess.run(compose+['stop','redis'],check=True,capture_output=True)
    try:
        saved=call(base+'/messages',owner,'POST',{'clientMessageId':str(uuid.uuid4()),'body':'Saved during Redis outage'})
        assert any(m['id']==saved['id'] for m in call(base+'/messages?after=9',peer)['items'])
    finally:
        subprocess.run(compose+['up','-d','--wait','redis'],check=True,capture_output=True)
    passed('Redis outage does not lose acknowledged messages; REST catches up')

report={'date':'2026-09-27','scenarioCount':len(results),'passed':results,'environment':'MySQL 8.4 + Redis 7.4 + two Spring Boot nodes; isolated chat-local profile'}
target=ROOT/'docs/chat/verification/api-results.json'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(results)} scenarios passed. No tokens written to report.')
