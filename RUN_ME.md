# Hirenex: run it for real (Groq, no mock data)

## 0. What you need (all free tiers)
- Node 20+
- MongoDB Atlas free cluster -> copy the connection string
- Redis: Upstash or Redis Cloud free database -> copy the redis:// (or rediss://) URL, or `docker run -p 6379:6379 redis`
- Groq key: https://console.groq.com/keys (starts with gsk_)

## 1. Backend  (the Groq key goes HERE, and only here)
cd trusthire-backend
cp .env.example .env
Edit .env:
  MONGODB_URI=<atlas string>
  REDIS_URL=<redis url>
  JWT_ACCESS_SECRET=<32+ random chars>
  JWT_REFRESH_SECRET=<different 32+ random chars>
  LLM_PROVIDER=groq
  GROQ_API_KEY=gsk_xxxxxxxx          <-- HERE
  LLM_MODEL=llama-3.3-70b-versatile
  DEMO_MODE=false
npm install
npm run llm:check      # must print PASS. If FAIL, fix the key before anything else
npm run dev            # http://localhost:4000

## 2. Frontend (NO key here)
cd trusthire-frontend
cp .env.example .env   # VITE_USE_MOCKS=false, VITE_API_URL=http://localhost:4000
npm install
npm run dev            # http://localhost:5173 -> "Demo login"

## 3. Make the demo bulletproof (do once, ~10 min before presenting)
cd trusthire-backend
npm run demo:prescore  # real Groq run on the 22 resumes -> src/seed/prescored.json (offline fallback)
npm run demo:warmup    # 10 min before you present
