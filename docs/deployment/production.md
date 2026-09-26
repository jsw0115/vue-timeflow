# Deployment guide

Use separate MariaDB databases and secrets for local, staging, and production. Required variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS`.

```bash
cd backend && ./gradlew bootJar
cd frontend && npm ci && npm run build:web
```

Deploy `backend/build/libs/*.jar` behind a reverse proxy/service manager and `frontend/dist/` to static hosting. Back up the database before release; Flyway applies migrations on startup. Do not use JPA `ddl-auto=update` in production.

Use `npm run mobile:sync`, then Android Studio for AAB and Xcode on macOS for IPA. Use `npm run desktop:build` with Node 22.12+ for installers. Keep all signing keys in protected secret storage.

