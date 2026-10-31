# P17 audit: responsive, a11y, performance
Static review only. No build was run, so bundle sizes are NOT measured.
Run `npm run build` and check each route chunk's gzip size before the demo; flag any over 250 KB.

| issue | file | fix |
|---|---|---|
| Small controls under 44px on touch screens | src/styles/globals.css | Added `pointer: coarse` rule: 44px min height for buttons, tabs, switches, menu items, selects, text inputs; 24px for checkbox and radio |
| Possible horizontal page scroll | src/styles/globals.css | `overflow-x: clip` on html; media max-width 100% |
| In-page anchors land flush under edge | src/styles/globals.css | `scroll-padding-top` |
| Landing nav link and error-page links under 44px | LandingPage.tsx, NotFoundPage.tsx, ServerErrorPage.tsx | `min-h-11` |
| Error screens not announced | ErrorBoundary.tsx, ServerErrorPage.tsx | `role="alert"` (done in P16) |
| Landing mini-demo not usable by keyboard or screen reader | LandingPage.tsx | Toggle is `role="switch"` with `aria-checked`; result in `aria-live="polite"`; SVG diagram has `role="img"` and label (P16) |

## Checked, already fine
- Skip link, `<main id="main">` landmark: AppShell.tsx, LandingPage.tsx
- Focus ring: global `:focus-visible` outline
- Reduced motion: global media query plus `useReducedMotion` in motion helpers
- Code splitting: routes use `lazy()` in router.tsx
- manualChunks for recharts, framer-motion, react: vite.config.ts
- Polling pauses in background: usePolling.ts (`refetchIntervalInBackground: false`)
- Fonts: preconnect plus `display=swap`
- Table sort ARIA: CandidatesTable.tsx (`aria-sort`); Tabs.tsx has tab roles

## Not verified (needs a browser)
Breakpoint checks at 360/768/1024/1280/1536/1920, kanban keyboard moves, chart text alternatives per chart, virtualization thresholds, per-route bundle sizes.

## 15-point manual a11y script
1 Tab through landing, 2 skip link works, 3 visible focus on every control, 4 login by keyboard, 5 dialog traps and restores focus, 6 Esc closes dialog/drawer/palette, 7 Cmd/Ctrl+K palette arrows and Enter, 8 tab arrows, 9 table sort by keyboard, 10 toasts announced, 11 scoring progress announced, 12 colour is never the only cue, 13 reduced motion on, 14 200% zoom no loss, 15 phone width 360px no sideways scroll.
