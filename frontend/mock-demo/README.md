# Mock demo

This folder is an API-free, static demonstration of the Timeflow daily dashboard. Run it from `frontend`:

```powershell
npm run demo:mock
```

The browser opens `http://127.0.0.1:5173/mock-demo/`. Demo data is centralized in `data/demo-data.js`. Existing application mock utilities remain in `src/data/mock.js`, while `src/data/screens.js` provides the screen catalogue. Do not move those source files because the main app imports them.
