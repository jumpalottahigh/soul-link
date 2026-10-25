# Soul Link Agent Guide

This is the canonical repository-wide guidance for coding agents. Read the relevant sections of [docs/architecture.md](docs/architecture.md) before changing a feature; see [README.md](README.md) for setup.

Soul Link is a mobile-first React app for two paired partners: moods, drawings, invites, shared trips, and named 5x5 Bingo boards. Supabase provides auth, Postgres, and realtime; there is no custom backend or router.

## Toolchain and checks

- Use Node 24 (`.nvmrc`). Native Bingo tests import TypeScript directly.
- React 19, TypeScript 7, Vite 8, Tailwind CSS 4, Supabase, lucide-react, and interactjs.
- `@typescript/native` aliases the TypeScript 7 compiler; `typescript` aliases `@typescript/typescript6` for tooling API compatibility. Keep both while typescript-eslint requires the older API.
- Vite needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep real values in gitignored `.env.local`; never print or commit credentials.

```sh
npm run dev       # Vite dev server
npm run build     # TypeScript build and production bundle
npm run lint      # ESLint
npm test          # Native Node Bingo domain tests
npm run preview   # Preview production build
```

Run focused checks during development and build/lint/tests before handing off code changes. Report failures and environment blockers rather than assuming the baseline is clean.

## Code conventions

- Functional components and hooks; named component exports except the default `App` export. Component props use a local `Props` interface.
- Single quotes in TypeScript and JSX, no semicolons, 2-space indentation, no trailing commas.
- Use `import type` for types. No enums, namespaces, parameter properties, unused declarations, or `any`; use `unknown` and `errorMessage()` from `src/lib/errors.ts` for caught errors.
- Use Tailwind utility classes and existing theme tokens from `src/styles/global.css`, not CSS modules or a new component library. Tailwind configuration lives in CSS, not `tailwind.config.js`.

## Ownership and data contracts

- All database reads/writes go through `src/lib/db.ts`; do not call `supabase.from(...)` from components. Pairing uses `pair_with_code`, not direct table writes.
- `src/contexts/AuthContext.tsx` owns auth state. The context type and `useAuth()` hook live separately in `src/contexts/useAuth.ts` for Fast Refresh and filesystem casing compatibility.
- Preserve `App`'s auth/recovery/pairing gates before rendering `MainApp`; its non-null assertions depend on them. Recovery takes priority over pairing.
- Shared types live in `src/lib/types.ts`, trip types/helpers in `src/lib/trip/`, and Bingo types/line counting in `src/lib/bingo.ts`. Keep database row shapes aligned with app types.
- Trip and Bingo UI live in their respective `src/components/` subfolders; optimistic state and realtime handling belong in `useTripPlanner` and `useBingo`.
- Preserve optimistic updates and failure recovery: MainApp logs write failures; trip/Bingo hooks recover from the server and show error banners. Clean up realtime channels on unmount, including under StrictMode.
- Only theme and the last-opened trip/Bingo IDs use `src/lib/storage.ts` (`us-app-` prefix). Feature contents and progress are remote.
- Apply `supabase/trip-planner.sql` and `supabase/bingo.sql` manually in the Supabase SQL editor for their features. They are idempotent and configure their own RLS/realtime entries; Bingo is independent of the trip schema.
- Bingo cell text is shared, but marks are per user. Use the RPCs for board creation, cell text, and marks; only toggle the signed-in user's mark. Clearing text resets both partners' marks atomically. Blank cells never count toward a bingo, and there is no free center.
- Drawings remain `Stroke[]` with normalized 0..1 points in `profiles.drawing`; preserve that stored shape.

## UI invariants

- Reuse `ActionsMenu` for trip/Bingo actions, including keyboard behavior. Popovers must stay inside the app's `main` column, not merely the viewport.
- Focus text inputs after native `showModal()`. Trip rename/date/event dialogs and Bingo rename/item dialogs use top positioning, safe-area spacing, and scrollable content for mobile keyboards.
- Existing Bingo boards open in Play; new boards open in Edit. Play toggles your marks and leaves empty cells blank; Edit changes shared text and shows a centered plus in empty cells.
- Theme changes must cover every theme block and Tailwind `@theme` registration, plus the theme types/constants and App color maps where applicable.
- Preserve the mobile app column, safe-area padding, and bottom-navigation clearance. Gender-dependent copy retains male/female/other branches.

## Documentation

Keep this file concise and authoritative. Put implementation details in [docs/architecture.md](docs/architecture.md) and user-facing setup in [README.md](README.md); update the relevant document when behavior changes instead of creating a second agent rulebook.
