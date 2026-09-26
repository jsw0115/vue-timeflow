# GitLab connection and CI/CD guide

```powershell
cd E:\vscode-proj\vue-timeflow-proj
git remote add origin https://gitlab.com/<group>/<project>.git
git add .
git commit -m "chore: initialize timeflow"
git branch -M main
git push -u origin main
```

Use a GitLab token with `write_repository` scope or SSH keys. In **Settings → CI/CD → Variables**, add masked/protected `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_PRIVATE_KEY` values. GitLab Pages serves only the frontend; build it with `VITE_API_BASE_URL` pointing at a separate HTTPS API.

