# Hirenex

Monorepo with two apps:

| Folder | What | Deploy to |
|---|---|---|
| `trusthire-frontend/` | React + Vite UI | Vercel (Root Directory = `trusthire-frontend`) |
| `trusthire-backend/` | Express + MongoDB + Redis API (Docker) | Render (Root Directory = `trusthire-backend`) |

Keep-alive / uptime probe: `GET /health` (cheap, no DB). Deep check: `GET /api/v1/health`.

Local run: see `RUN_ME.md`.
