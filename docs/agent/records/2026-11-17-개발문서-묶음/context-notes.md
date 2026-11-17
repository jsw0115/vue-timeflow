# 결정·근거·인수인계 메모

- 2026-11-17. 저장 방식(서버/로컬)은 `frontend/src`의 서버 호출 모듈 사용 화면을 찾아 정한 정적 확인 값이다. 실제 호출 실측은 아니다.
- 05 작성 중 V5가 Java migration(`db.core.V5__account_identifier_width`)이고 V1은 체크섬만 보존하는 역사적 DDL이라는 사실을 `docs/database/environment.md`에서 확인해 바로잡았다. 다음 Core·workspace 번호는 V8, 채팅은 V5다.
- P0-2 확인. `PlannerItemEntity`에 `@Version`이 추가되어 있고 공개 버전은 내부 version+1이다. Service는 조회 version과 비교해 409를 낸다. 06 IM-01 작성 시 이 구조를 근거로 쓴다.
- 06 IM ID(IM-01~IM-13)는 01 문서에 이미 예약되어 있다. 06 작성 시 같은 번호·제목을 써서 앵커를 다시 연결한다.
- 2026-11-17 재요청. 06 구현 방안·07 테스트 시나리오 및 결과서를 작성하고 작성 예정 표시를 링크로 복원했다. 06 작성 중 ApiExceptionHandler가 낙관적 잠금 예외를 이미 409로 변환함을 확인했다. 07 결과는 11-15·11-16 기록과 오늘 실행분만 옮겼고 플래너 테스트는 NOT_RUN이다.
