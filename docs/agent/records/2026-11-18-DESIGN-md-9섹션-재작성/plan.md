# 작업 계획

- 요청: Figma 레퍼런스의 색상·디자인과 Timebar Diary 기능·방향을 참고해 DESIGN.md를 9개 섹션(Visual Theme ~ Agent Prompt Guide) 형식으로 다시 쓴다.
- 현재 확인한 사실: 저장소에 `DESIGN-figma.md`는 없다. 원본으로 `.claude/data/references/figma/DESIGN.md`를 썼다. 이전 DESIGN.md는 Core v2 7장 계약 + 다른 프로젝트(ezConference) Master가 섞인 상태였다.
- 범위/제외: DESIGN.md 재작성, CLAUDE.md 5절의 낡은 설명 한 줄 수정. 프런트엔드 코드·`.omd/system`·`.omd/preferences.md`는 바꾸지 않는다.
- 성공 기준: 9개 섹션 모두 작성, 모든 값에 출처(계약·Figma·코드) 표기, 코드와 다른 값은 부록 B에 기록, 문서 검증 스크립트 회귀 없음.
- 보안 관련 ID/검증: 해당 없음(문서 변경).
- 접근성 대상/검증: 색 대비를 계산해 문서에 기록(muted on surface 4.36:1 미달 발견).
- 사용자 요청으로 이미 허용된 작업과 추가 확인이 필요한 작업: DESIGN.md 작성은 요청 범위. 코드 반영, omd 그래프 재채택, 원격 푸시는 별도 확인 필요.
