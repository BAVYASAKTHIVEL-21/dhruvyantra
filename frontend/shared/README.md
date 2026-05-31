# Shared — Next.js app root

All frontend **config** and the **Next.js app** live here.

## Run

```bash
cd frontend/shared
npm install
npm run dev
```

Open http://localhost:3001

## Sibling folders (same `frontend/` level)

| Folder | Contents |
|--------|----------|
| `../loginpage/` | Login page UI only |
| `../dashboard/` | Dashboard page UI only |
| `shared/` | `package.json`, configs, `src/`, `public/`, logo, tokens |

There is **no** `package.json` at the repo root or under `frontend/` alone — only here in `shared/`.
