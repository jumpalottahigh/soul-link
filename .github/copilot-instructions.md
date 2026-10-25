# Soul Link — Copilot instructions

Auto-loaded by GitHub Copilot Chat in this repo. Keep short and current.

## What this is

A two-person (partner) web app for moods, small drawings, casual activity invites, shared trip planning, and named 5x5 Bingo boards with individual progress. Realtime sync via Supabase. See [AGENTS.md](../AGENTS.md) for detailed architecture notes.

## Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **Tailwind CSS 4** (via `@tailwindcss/vite`, no `tailwind.config.js` — config lives in CSS)
- **Supabase** (`@supabase/supabase-js`) for auth, Postgres, and realtime
- **lucide-react** for icons
- ESLint 10 + typescript-eslint

## Commands

Use Node 24 (see `.nvmrc`); native Bingo tests import TypeScript directly.

```
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm test          # native Node Bingo domain tests
npm run preview   # preview production build
```

## Env vars

Required at build/dev time (Vite `import.meta.env`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep real values in gitignored `.env.local`; never print or commit credentials.

## Structure

- [src/App.tsx](src/App.tsx) — root; gates on auth → recovery → pairing → `MainApp`
- [src/main.tsx](src/main.tsx) — entry, wraps in `AuthProvider`
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) — session, profile, partnerProfile, recovery flow. Single source of truth for auth.
- [src/contexts/useAuth.ts](src/contexts/useAuth.ts) — auth context type and `useAuth()` hook (separate for fast refresh)
- [src/lib/supabase.ts](src/lib/supabase.ts) — Supabase client
- [src/lib/db.ts](src/lib/db.ts) — all DB reads/writes (profiles, invites, pairing, trips, Bingo)
- [src/lib/types.ts](src/lib/types.ts) — domain types + constants (`THEMES`, `DEFAULT_MOODS`, `GENDER_OPTIONS`, `SUGGESTIONS`)
- [src/lib/storage.ts](src/lib/storage.ts) — tiny typed `localStorage` wrapper, prefix `us-app-`
- [src/components/](src/components) — one file per screen/modal (`AuthScreen`, `PairingScreen`, `MoodView`, `InvitesView`, `SettingsModal`, `CustomMoodModal`, `DrawingCanvas`, `DrawingPreview`, `ResetPasswordScreen`)
- [src/components/trip/](src/components/trip/) / [src/hooks/useTripPlanner.ts](src/hooks/useTripPlanner.ts) — trip UI and optimistic state; trip types/helpers in `src/lib/trip/`
- [src/components/bingo/](src/components/bingo/) / [src/hooks/useBingo.ts](src/hooks/useBingo.ts) — Bingo UI and optimistic state; types and line counting in `src/lib/bingo.ts`
- [src/components/ActionsMenu.tsx](src/components/ActionsMenu.tsx) — shared native popover for trip/Bingo actions, keyboard navigation, and app-bound positioning
- [src/styles/global.css](src/styles/global.css) — Tailwind + theme tokens

## Domain model (Supabase)

- `profiles` — id, display_name, mood_emoji, mood_label, drawing (JSON strokes), gender, partner_id, invite_code, recent_moods
- `invites` — id, sender_id, receiver_id, activity, time, status (`pending` | `accepted` | `declined`)
- RPC `pair_with_code(code)` — server-side pairing; returns `{ success, partner_id, error? }`
- Realtime channel `invites-sync` subscribes to `postgres_changes` on `public.invites`
- Trips use `trips` / `trip_events`; Bingo uses `bingo_boards` / `bingo_cells` / `bingo_marks`.
- Run `supabase/trip-planner.sql` and `supabase/bingo.sql` manually in the Supabase SQL editor before deploying their features. Both are idempotent and configure their own RLS and realtime publication entries; Bingo does not depend on the trip schema.
- Bingo text is shared, but marks belong to individual users. Use the Bingo RPCs for board creation, cell text, and marks; only the signed-in user's mark can be toggled. Clearing a cell resets both partners' marks atomically. Empty cells never count toward a bingo; there is no free center.

## Conventions

- Functional components, hooks only. No class components.
- All DB access goes through `src/lib/db.ts` — do not call `supabase.from(...)` from components.
- Optimistic UI: update local state first, then persist. MainApp logs write failures; trip/Bingo hooks recover from the server and show an error banner. Preserve that recovery behavior.
- Shared types live in `src/lib/types.ts`, trip types in `src/lib/trip/types.ts`, and Bingo types in `src/lib/bingo.ts`; keep DB row shapes and app types aligned.
- Only theme and the last-opened trip/Bingo IDs are local (`storage.ts`); board contents and progress are remote.
- Tailwind utility classes; theme tokens (e.g. `bg-page`, `text-text`, `from-gradient-from`) are defined in `global.css` and switched via `data-theme` on `<html>`.
- Single quotes, no semicolons (match existing files).

## Gotchas

- `useAuth()` throws if used outside `AuthProvider` — `main.tsx` wraps the tree.
- `profile!` / `partnerProfile!` non-null assertions in `MainApp` rely on `App.tsx`'s gate — don't render `MainApp` without both.
- `PASSWORD_RECOVERY` auth event flips `recoveryMode`; `App` shows `ResetPasswordScreen` regardless of pairing state until `exitRecoveryMode()`.
- Pairing requires the RPC, not a direct table write (RLS).
- Drawings are stored as `Stroke[]` (array of `{ points: {x,y}[] }`) in a JSON column — keep the shape stable.
- Reuse `ActionsMenu` for trip/Bingo actions: popovers must stay inside the app's `main` column, not merely the browser viewport.
- Text-entry dialogs focus inputs after `showModal()`. Trip rename/date adjustment/event dialogs and Bingo rename/item dialogs open near the top with safe-area spacing and scrollable content for mobile keyboards.
- Bingo opens existing boards in Play and new boards in Edit. Play toggles only your own mark; Edit changes shared text. Empty cells are blank in Play and show a centered plus in Edit.
