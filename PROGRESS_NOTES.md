# Progress snapshot (31 Oct 2026, ~01:10)

## Fixes applied so far
1. backend src/seed/resumeContent.ts: `const bullets: string[]` (was literal-union type, would break `tsc` build).
2. frontend src/features/landing/pages/LandingPage.tsx: removed unused `Button` import (would fail `tsc -b` with noUnusedLocals).
3. frontend src/services/apiClient.ts: added `X-Requested-By: trusthire` header on all requests (backend CSRF middleware rejects every non-GET without it, so login/upload/approve would 403 with mocks off).

## Checks done
- npm registry is BLOCKED in this sandbox: no npm install, no real build/tests. Backend PROGRESS.md also says code was never compiled.
- Offline typecheck with stubbed-out libs: no unresolved relative imports in either project; all third-party imports declared in package.json.
- Contract diff: every frontend call matches a backend route (method+path).

## Still to do
- Check frontend real-mode response shapes vs backend (flat user object, paged lists `{items,meta}`, etc.), esp. jobs list, candidates list, audit list.
- Frontend calls missing from real services: shortlist.approve, invites.send, schedule.markUnavailable, portal accept/decline/reschedule, auth.sendOtp/logout/refresh, jobs.list, candidates.list, audit.list, demo seed/reset, notifications.markRead (my script likely missed multi-line ones, verify).
- Frontend .env.example has VITE_USE_MOCKS=true: set false for integrated deploy.
- Read frontend/design PDFs for requirement coverage; grep UI copy for banned words (legally compliant, unhackable, proven) and "reuse".
- Run on your machine: `npm install && npm run build && npm test` in both folders.

## Update (31 Oct): real compile + tests run (registry reachable this time)
- Backend: `tsc` clean, build OK, 381/381 tests pass. Fixes: winston arg order in 9 log calls, logger redact format dropped winston Symbol keys (crashed every log line), null rank typing, pdf-parse typings, 3 test bugs (hash-chain forge, counter mock, hoisted mocks), seed count constants (11 pdf / 11 docx).
- Frontend: `tsc -b` clean, build OK, 23/23 tests pass. Fix: readonly shortcut rows type.
- All 15 real services exist and match the contract paths (earlier "missing calls" list was a script false alarm).
- Defaults now: LLM_PROVIDER=groq, LLM_MODEL=llama-3.3-70b-versatile, VITE_USE_MOCKS=false. Added `npm run llm:check`.
- NOT verified: live run against Mongo/Redis/Groq (sandbox cannot reach them). First real run is on your machine: see RUN_ME.md.

## Update (31 Oct, later): contract mismatches fixed
- Root cause of the zod errors: backend and UI used different field names. Added trusthire-frontend/src/services/real/adapters.ts (single place for all translation) and switched every real service to requestMapped/requestListMapped.
- Mapped: job (interviewMinutes<->durationMinutes, dates[]<->startDate/endDate, breaks start/end<->from/to), interviewers (date+HH:mm <-> ISO windows, no email on backend), uploads (status/reason), candidates (no displayName/blindLabel on backend: derived), scores (backend 0-10 <-> UI 0-100), shortlist, schedule, shortfall, repairs, invites (draft->queued), portal, audit, trace, analytics, notifications, backend-only flags folded into UI flags.
- Override reason now needs 10+ characters (backend rule). Override score entered 0-100 is stored as 0-10.
- adapters.test.ts feeds backend-shaped payloads through each mapper and parses with the UI schemas (12 tests). Frontend 35/35, backend 381/381, both build.
- Still not run against live Mongo/Redis/Groq in the sandbox.

## Step 7 (31 Oct): premium branded emails
- New src/domain/emailLayout.ts: shared table-based HTML shell (dark brand header, details card, gradient CTA button, copy-link fallback, footer). Colours match the web app.
- meetingEmail.ts, emailTemplates.ts (invitation/reminder/etc.) and otpMailer.ts now use it. Plain-text bodies unchanged.

## Step 8 (31 Oct): HR point of view wording
- Start page, upload page and job list copy rewritten for an HR team (no "your resume", no public-facing pitch).
- Removed "Synthetic demo data" / "Test inbox" chips and test-inbox wording from login, invites, shortlist and portal.
- Product name is one constant: src/lib/config.ts APP_NAME (VITE_APP_NAME). Still "TrustHire": waiting for the new name.

## Step 9 (31 Oct): demo data removed
- useDemoMode() is now always false: no demo panel, demo card, demo login button or demo commands anywhere.
- Removed routes /qr, /app/demo/attack, /app/demo/swap-test, /app/_dev.
- Backend .env.example: DEMO_MODE=false (demo routes 404 when off). Demo seed code kept but unreachable.
- Only resumes HR uploads appear on Candidates / Scores / Shortlist pages.

## Step 10 (31 Oct): dashboard simplified
- Dashboard is now: next step card, four numbers (received / shortlisted / invited / confirmed) and a plain 'Recent history' list. Removed chain verify, trust meter, funnel chart, live trace, onboarding and the audit block.

## Step 11 (31 Oct): simple interview schedule
- Schedule page now: HR interview hours + one reusable Meet link (MeetingSettingsForm), tomorrow's slot usage, and the booked list with Cancel. Invites are always for tomorrow (checkbox + Send is on Candidates).
- Backend: unique partial index on meetings (ownerId, start, status=scheduled) so two interviews can never share a time; sendInvites moves to the next free slot if one is taken at the same moment.
- Removed the interviewer timeline, repair panel and unavailable-interviewer dialog.

## Step 12 (31 Oct): simple analytics
- Analytics page: Applied, Interviewed, Passed, Did not pass for a chosen period (7 days, 30 days, 3/6/12 months, all time) and a selectable pass mark (50-80 out of 100). 'Download report' saves a CSV with the totals plus one row per candidate.
- New backend endpoint GET /analytics/summary?range=&passMark= (all of the HR user's jobs). Passed/failed use the AI score against the pass mark; Interviewed = invited or confirmed.
- Old funnel / trust meter / bias panel / heatmap removed from the page.

## Step 13 (31 Oct): notifications
- Notifications page: grouped by day, All / Unread filter, unread dot, click opens the linked page and marks it read, 'Mark all as read'.
- Bell: badge caps at 9+, panel shows the latest 10, clicking an item marks it read and opens it.
- Backend now raises notifications for: resumes added (after upload), scoring finished / failed, interview invites sent. Notifications carry an in-app link (new optional href field).

## Step 14 (31 Oct): audit log and agent trace removed
- Frontend: audit and trace pages, routes, sidebar links, shortcuts (G L / G T), dashboard blocks, upload-page trace panel, domain components, service calls and copy are gone. Override toast now says 'Change saved'. Demo feature folder and dev gallery deleted.
- Backend: GET /audit/*, /jobs/:id/audit and /jobs/:id/trace endpoints removed. The services still write their internal records so nothing else in the pipeline changed.

## Step 15 (31 Oct): profile photo and settings saved on the account
- Backend: users now store avatar (small data URL, png/jpeg/webp, max 400k chars) and preferences. GET/PUT /settings/profile (partial, key-by-key merge). Unit test: tests/unit/profile.test.ts.
- Frontend: photo is resized to 256px and saved to the server; Settings page and the top-bar profile menu use the same code. Display name saves to the account. Theme, density, sidebar, blind mode, notification switches and time zone auto-save (0.8 s after a change) and load on every sign-in, on any device. The browser keeps only a cache for instant paint.
- Old localStorage-only photo key removed.

## Round 2 / Task 1 (31 Oct): false "flagged" + scoring never starting
- Backend shield: plain DOCX headers/footers, Word sensitivity labels and white text on dark table cells / text boxes are no longer "hidden text". PDF off-page check uses the real page box (+24pt slack) and the largest font-size reading. Invisible-char, long-URL and "10/10" rules no longer mark a resume as flagged.
- Backend scoring: AI answer check is now lenient (rounds/clamps scores, accepts "7", null quotes, extra keys). Start fails fast with AI_UNAVAILABLE if no key. Stale injection badges are re-checked when scoring.
- Frontend: only real shield flags show "flagged". Scoring starts automatically after upload. First failure reason shown under the progress bar.
- NOT build/type checked (as requested).

## Round 2 / Task 2 (part 1 of 2, backend done, frontend upload dialog still to come)
- New POST /jobs/import (multipart field "file", PDF or DOCX): reads the job document, AI extracts title, summary, required/preferred skills, 4-6 scoring criteria, openings, interview length; creates the opening straight away with HR's saved interview hours and Meet link. Files: domain/jobImport.ts, services/jobImport.service.ts, prompts.ts (job_import_v1), schemas.ts (jobImportSchema), middleware/upload.ts (documentUpload), job.controller/job.routes. Unit test: tests/unit/jobImport.test.ts.
- Still to do: frontend upload button + dialog, per-opening scoring filter, copy resumes between openings.
- NOT build/type checked (as requested).

## Round 2 / Task 2 (part 2 of 2, done)
- Frontend: "Upload job document" button + dialog on the Jobs page (also in the empty state). After upload the opening exists; dialog offers "Upload resumes now" or "Review opening". Mock + real services added.
- Per-opening scoring: opening selector on Screen resumes (/app), Upload resumes and Candidates pages (Candidates acts as the opening filter; ticks reset when you switch). Scores, ranks and shortlist were already per opening.
- "Score for another opening": tick resumes on Candidates -> pick an opening -> resumes are copied into it (stored text reused, duplicates skipped, original scores untouched) and its scoring starts. Backend: POST /jobs/:id/copy-candidates {fromJobId, candidateIds?}.
- NOT build/type checked (as requested).

## Round 2 / Task 3: renamed to Hirenex
- Product name is now Hirenex everywhere users see it: sidebar and login brand, page title, emails (header, OTP subject/sender, ICS), settings/help text, landing copy, export file name. One constant per app (frontend lib/config.ts APP_NAME, backend config/constants.ts APP_NAME).
- Kept on purpose: folder names, APP_SLUG 'trusthire' (CSRF header value and JWT issuer; changing it would sign everyone out and break the frontend header), storage keys.
- IMPORTANT: if Vercel has VITE_APP_NAME=TrustHire set, change it to Hirenex (it overrides the code default).

## Step 13 (31 Oct): review timeline (auto-reject + waiting list)
- New stages `on_hold` (waiting list) and `rejected`. New candidate fields: reviewStartedAt, holdUntil, decidedAt, decidedBy, rejectionReason.
- Per-HR settings (Settings > Review timeline): auto-reject after N days (default 2), waiting-list days (default 7), email candidates. GET/PUT /settings/hiring.
- POST /candidates/:id/decision { action: hold | reject | reopen }. Hold and reject email the candidate (Ethereal test inbox only, as before). Reopen restarts the clock.
- Sweeper (services/hiring.service.ts, started in server.ts): every 15 min rejects resumes with no HR action past the limit, and holds past holdUntil. Atomic, idempotent, audited as System, HR gets an in-app notification.
- UI: countdown chip (ReviewClock) on table, kanban card and candidate header; DecisionBar (Schedule / Hold / Reject / Back to review): inline on desktop, sticky bottom bar on phones.
- WARNING: on first deploy, existing candidates older than the limit are rejected by the first sweep. Turn auto-reject off in Settings first, or restart their clock with "Back to review".
- Not compiled or tested here (no node_modules, no network). Run `npm install && npm run build && npm test` in both folders.

## Step 16 (31 Oct): bulk Save/Reject, dashboard clean-up, History
- Candidates page selection bar now has Save for later, Reject and Send invites. History checkbox shows everything (GET .../candidates?history=1).
- Default list hides rejected candidates 1 hour after rejection and saved ones 7 days after saving. Auto-reject default is now 3 days (Settings can change it). Existing emails/notifications unchanged: invite mail has Meet link + thank-you; save = waiting-list mail; auto-reject mails the candidate and notifies HR.
- NOT build/type checked.

## Step 17: "No LLM provider configured" fix
- integrations/llm/index.ts: provider now auto-falls back to whichever key (GROQ_API_KEY / GEMINI_API_KEY) is set, even if LLM_PROVIDER is wrong; keys trimmed; model name swapped to the provider's default if mismatched. Health status uses the same logic. NOT build checked.
