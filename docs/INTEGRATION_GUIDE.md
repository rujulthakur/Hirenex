# Integration guide (backend developer)

## Switch from mocks to the real API
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_USE_MOCKS=false` and `VITE_API_URL=https://<api-host>` (no trailing slash, no /api/v1; the client adds it).
3. Restart `npm run dev`. Nothing else changes: `src/services/index.ts` picks the real layer.

## CORS and cookies
- Auth uses httpOnly access and refresh cookies. The client sends `credentials: 'include'` on every call. No tokens in localStorage.
- API must send `Access-Control-Allow-Origin: <exact frontend origin>` (never `*`) and `Access-Control-Allow-Credentials: true`.
- Allow methods GET, POST, PUT, PATCH, DELETE, OPTIONS and header Content-Type.
- Cookies: `HttpOnly; Secure`. Frontend and API on different sites need `SameSite=None; Secure`. Same site can use `Lax`.
- Local dev over http: Chrome accepts `Secure` cookies on localhost; use the same host name for both (localhost), or run a proxy.
- Responses must follow Appendix A: `{data, meta}` or `{error:{code,message,details}}`. Responses that fail Zod parsing show an error state in the UI.

## Endpoints used by the UI
Generated from `src/services/real/*.ts`. Method defaults to GET when none is set in the call.
Upload (`POST /jobs/{jobId}/resumes`) is multipart with field name `files`.

| method | path | called from | Zod schema |
|---|---|---|---|
| GET | `/api/v1/jobs/{jobId}/analytics` | src/services/real/analytics.ts | `AnalyticsViewSchema` |
| GET | `/api/v1/audit/verify` | src/services/real/audit.ts | `ChainVerifySchema` |
| POST | `/api/v1/auth/verify-otp` | src/services/real/auth.ts | `UserSchema` |
| POST | `/api/v1/auth/google` | src/services/real/auth.ts | `UserSchema` |
| POST | `/api/v1/auth/demo-login` | src/services/real/auth.ts | `UserSchema` |
| GET | `/api/v1/auth/me` | src/services/real/auth.ts | `UserSchema` |
| GET | `/api/v1/candidates/{id}` | src/services/real/candidates.ts | `CandidateSchema` |
| GET | `/api/v1/candidates/{id}/scores` | src/services/real/candidates.ts | `z.array(CriterionScoreSchema` |
| PATCH | `/api/v1/candidates/{id}/scores/{criterionId}` | src/services/real/candidates.ts | `OverrideResultSchema` |
| PATCH | `/api/v1/candidates/{id}` | src/services/real/candidates.ts | `CandidateSchema` |
| POST | `/api/v1/candidates/{id}/swap-test` | src/services/real/candidates.ts | `SwapTestSchema` |
| GET | `/api/v1/demo/qr` | src/services/real/demo.ts | `QrSchema` |
| GET | `/api/v1/health` | src/services/real/demo.ts | `HealthSchema` |
| GET | `/api/v1/jobs/{jobId}/invites/preview` | src/services/real/invites.ts | `z.array(InviteSchema` |
| PATCH | `/api/v1/invites/{id}` | src/services/real/invites.ts | `InviteSchema` |
| GET | `/api/v1/jobs/{jobId}/invites` | src/services/real/invites.ts | `z.array(InviteSchema` |
| POST | `/api/v1/jobs` | src/services/real/jobs.ts | `JobSchema` |
| GET | `/api/v1/jobs/{id}` | src/services/real/jobs.ts | `JobSchema` |
| PATCH | `/api/v1/jobs/{id}` | src/services/real/jobs.ts | `JobSchema` |
| GET | `/api/v1/jobs/{id}/interviewers` | src/services/real/jobs.ts | `z.array(InterviewerSchema` |
| GET | `/api/v1/jobs/{id}/interviewers` | src/services/real/jobs.ts | `z.array(InterviewerSchema` |
| GET | `/api/v1/notifications` | src/services/real/notifications.ts | `z.array(NotificationSchema` |
| GET | `/api/v1/portal/{t}` | src/services/real/portal.ts | `PortalViewSchema` |
| GET | `/api/v1/portal/{t}/status` | src/services/real/portal.ts | `PortalStatusSchema` |
| GET | `/api/v1/jobs/{jobId}/resumes` | src/services/real/resumes.ts | `z.array(UploadResultSchema` |
| POST | `/api/v1/jobs/{jobId}/schedule` | src/services/real/schedule.ts | `RunRefSchema` |
| GET | `/api/v1/jobs/{jobId}/schedule` | src/services/real/schedule.ts | `ScheduleViewSchema` |
| GET | `/api/v1/jobs/{jobId}/shortfall` | src/services/real/schedule.ts | `ShortfallReportSchema` |
| GET | `/api/v1/jobs/{jobId}/repairs` | src/services/real/schedule.ts | `z.array(RepairDiffSchema` |
| POST | `/api/v1/jobs/{jobId}/score` | src/services/real/scoring.ts | `RunRefSchema` |
| GET | `/api/v1/jobs/{jobId}/score/status` | src/services/real/scoring.ts | `ScoreStatusSchema` |
| GET | `/api/v1/jobs/{jobId}/shortlist` | src/services/real/shortlist.ts | `ShortlistResultSchema` |
| POST | `/api/v1/jobs/{jobId}/rerank` | src/services/real/shortlist.ts | `ShortlistResultSchema` |
| GET | `/api/v1/jobs/{jobId}/trace` | src/services/real/trace.ts | `z.array(TraceEntrySchema` |

## Contract drift log (copy a row per change)
| date | endpoint | what changed | announced by | frontend file updated | schema updated | done |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | | | | | | [ ] |
