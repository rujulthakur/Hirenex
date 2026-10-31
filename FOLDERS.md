# Folder map

| folder | why it exists |
|---|---|
| src/app | router, providers, layouts, guards |
| src/components/ui | reusable primitives (buttons, inputs, dialogs) |
| src/components/domain | presentational product components (badges, evidence, charts) |
| src/features/{auth,jobs,upload,candidates,shortlist,scheduler,invites,audit,analytics,trace,portal,demo,landing,settings,notifications} | one folder per product area, each with pages/ components/ hooks/ |
| src/services | apiClient, real and mock API layers |
| src/stores | small Zustand stores (UI state only) |
| src/lib | copy.ts, time.ts, format.ts, motion.ts, cn.ts, config.ts |
| src/types | Zod schemas and inferred types |
| src/tests | Vitest setup and tests |
