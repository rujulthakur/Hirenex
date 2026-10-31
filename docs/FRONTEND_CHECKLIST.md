# Frontend checklist (tick before the freeze)

## Routes
- [ ] / landing  - [ ] /login  - [ ] /login/verify  - [ ] /app dashboard  - [ ] jobs list and wizard  - [ ] upload  - [ ] candidates and detail  - [ ] shortlist  - [ ] schedule  - [ ] invites  - [ ] audit  - [ ] analytics  - [ ] trace  - [ ] notifications  - [ ] settings  - [ ] help  - [ ] swap test, attack, QR (demo)  - [ ] portal and portal status  - [ ] 404  - [ ] 500

## Pages x states (each page: loading / empty / error / success / offline)
- [ ] Every page above shows all five states.

## Components x states
- [ ] Buttons: default, hover, focus, disabled, loading  - [ ] Inputs: error, disabled  - [ ] Dialogs: open, close, Esc, focus return  - [ ] Drawer, palette, OTP, dropzone (reject), weights (lock), badges, charts

## Animations
- [ ] Each animation has a reduced-motion fallback  - [ ] No more than 12 staggered items  - [ ] Landing mini-demo toggles

## Shortcuts
- [ ] Palette hotkey  - [ ] Shortcuts dialog lists every key  - [ ] No shortcut fires inside inputs

## Responsive
- [ ] 360  - [ ] 768  - [ ] 1024  - [ ] 1280  - [ ] 1536  - [ ] 1920  - [ ] Tables become cards  - [ ] Drawer becomes full-screen sheet

## Accessibility
- [ ] 15-point script in A11Y_PERF_AUDIT.md passes

## Performance
- [ ] `npm run build` passes  - [ ] No route over 250 KB gzipped  - [ ] Polling pauses on hidden tab

## Content
- [ ] All strings come from lib/copy.ts  - [ ] Banned-words search is empty: `grep -rniE "legally compliant|unhackable|proven" src`
- [ ] Every statistic has a source tag and "According to" phrasing; landing placeholders replaced
- [ ] No dead buttons  - [ ] "Synthetic demo data" and "Test inbox" chips visible
- [ ] Limit sentence shown with the swap test and bias panel

## Tests
- [ ] `npm test` passes  - [ ] `npx tsc --noEmit` clean  - [ ] `npm run lint` clean

## 6-step demo (e2e/smoke.md)
- [ ] 1 sign in  - [ ] 2 job  - [ ] 3 upload and score  - [ ] 4 attack and swap  - [ ] 5 approve  - [ ] 6 schedule, invite, portal
