# 6-step demo smoke script (mock mode, `npm run dev`)
Pass/fail each step. Reset data with the demo panel before starting.
1. Sign in: `/login` -> "Judge demo login". PASS if dashboard opens.
2. Create job: Jobs -> new job -> weights sum 100 -> save.
3. Upload and score: upload resumes (or Load demo data) -> run scoring -> progress completes; trace shows tools.
4. Attack demo: run the hidden-instruction resume. PASS if it is flagged and the score is unchanged. Run the swap test and read the limit sentence.
5. Shortlist and approve: open the shortlist, change weights, approve via the 2-step dialog. PASS if Invites are blocked before approval and open after.
6. Schedule, invite, portal: run scheduler, send invites, open the portal link (QR page) on a phone width, accept / decline / reschedule. Audit page: verify chain shows valid.
