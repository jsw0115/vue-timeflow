# Timebar Diary

Vue 3 + Spring Boot 기반의 시간관리 OS MVP입니다.

## 실행

```bash
# API (JDK 17+, Maven 필요)
cd backend
mvn spring-boot:run

# Web (Node 20+)
cd frontend
npm install
npm run dev
```

웹은 `http://localhost:5173`, API는 `http://localhost:8080/api`에서 실행됩니다.

## 이번 MVP 범위

- 오늘 대시보드, 일/주/월 플래너와 Actual 타임바
- 일정/할 일/루틴/회고를 한 화면에서 유형·상태·카테고리로 필터링
- 할 일 상태 및 간단한 이월, 루틴 체크/달성률, 메모와 회고
- Spring Boot의 회원가입/로그인 및 planner CRUD API 골격

확장 기능(AI·음성·소셜·공유)은 API 경계를 분리해 두었고, 외부 제공자 및 개인정보 정책을 정한 뒤 연동하는 것이 안전합니다.

