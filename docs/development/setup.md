# Development guide

Prerequisites: JDK 17, Node.js 22.12+, MariaDB 10.6+, Android Studio, and Xcode/CocoaPods on macOS for iOS.

```powershell
mariadb -u root -p
CREATE DATABASE timeflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'timeflow'@'localhost' IDENTIFIED BY 'replace-this-password';
GRANT ALL PRIVILEGES ON timeflow.* TO 'timeflow'@'localhost';
FLUSH PRIVILEGES;

cd backend
$env:DB_USERNAME='timeflow'; $env:DB_PASSWORD='replace-this-password'
$env:JWT_SECRET='at-least-32-random-characters-for-local-use'
.\gradlew.bat bootRun
```

In another terminal run `cd frontend; npm ci; npm run dev`. Vite is `http://localhost:5173`; API docs are at `http://localhost:8080/swagger-ui.html`. Use `./gradlew test` and `npm run build:web` before a merge. Never commit database dumps, JWT keys, `.env`, or signing files.

