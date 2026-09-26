# System architecture

```text
Vue 3 / Vite ── Web/PWA, Capacitor Android/iOS, Electron desktop
                         │ HTTPS + JWT
                 Spring Boot modular monolith ── MariaDB + Flyway
```

Backend modules: auth, event, task, routine, planner, security, contract. Contract controllers are reserved API shapes that still return stubs. Frontend mock/localStorage state must be replaced by server state progressively; localStorage is for preferences and temporary offline cache only.

