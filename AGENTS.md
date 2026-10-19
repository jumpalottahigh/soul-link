# Soul Link – Agent Notes

Mobile-first PWA-style web app for two paired partners to share moods, small drawings, and date invites in real time. Single-page React app; Supabase is the entire backend (no custom server).

## Stack and commands

- React 19, TypeScript (~6), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react` icons, `@supabase/supabase-js`.
- Node version in `.nvmrc` (v24). Scripts: `npm run dev` (http://localhost:5173), `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.
- No test framework is configured. `npm run lint` and `npm run build` are both clean; keep them that way.
- Env vars (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`; `.env.local` is gitignored). Never commit or print real values.
- TS config: `verbatimModuleSyntax` (use `import type` for types), `erasableSyntaxOnly` (no enums/namespaces/parameter properties), `noUnusedLocals`/`noUnusedParameters`. `strict` is not enabled, but avoid `any` (lint rejects it); use `unknown` + `errorMessage()` from `lib/errors.ts` in `catch` blocks and cast realtime payloads (`payload.new as DbInvite`).

## Code style

- No semicolons, single quotes in TS, single quotes for JSX attributes (`className='...'`), 2-space indent, no trailing commas.
- Function components with named exports (except `App`, default export). Props interfaces are named `Props`, declared in the same file.
- Styling is Tailwind utility classes only, using theme tokens (below). No CSS modules, no component library.

## Architecture

```
main.tsx  -> <StrictMode><AuthProvider><App/></AuthProvider></StrictMode>
App.tsx   -> gatekeeper + MainApp
src/contexts/AuthContext.tsx  AuthProvider: session, profile, partnerProfile, auth actions
src/contexts/useAuth.ts       AuthContext object, value type and `useAuth()` hook (separate file for fast refresh; not `authContext.ts`, which clashes with `AuthContext.tsx` on case-insensitive filesystems)
src/lib/db.ts                 all Supabase queries (profiles, pairing, invites, trips, trip events)
src/lib/errors.ts             `errorMessage(err: unknown)` (handles Supabase's non-Error error objects)
src/lib/supabase.ts           client singleton
src/lib/storage.ts            localStorage wrapper, key prefix `us-app-`
src/lib/types.ts              types + constants (themes, default moods, genders, suggestions)
src/components/*              screens, views, modals
src/components/trip/*         Trip Planner tab (TripPlanner, TripPills, TripDialog, DayPlanner, EventBlock, EventEditor, PlannerHeader)
src/lib/trip/*                Trip Planner types and date/schedule helpers
src/hooks/useTripPlanner.ts   Trip Planner state (trips + per-trip event cache), Supabase writes (optimistic), realtime
supabase/trip-planner.sql     Trip Planner tables, RLS (idempotent; run manually in the Supabase SQL editor)
src/styles/global.css         theme tokens + Tailwind theme registration
```

### Screen flow (`App.tsx`)

`loading` -> splash; no `session` -> `AuthScreen`; `recoveryMode` -> `ResetPasswordScreen`; no `profile.partner_id` or no `partnerProfile` -> `PairingScreen`; otherwise `MainApp` (tabs: Mood / Invites / Trip Planner, plus `SettingsModal` and `CustomMoodModal`). There is no router.

### Auth (`AuthContext`)

- `useAuth()` (from `contexts/useAuth`) exposes `session`, `user`, `profile`, `partnerProfile`, `loading`, `signUp`, `signIn`, `signOut`, `refreshProfile`, `sendPasswordReset`, `updatePassword`, `recoveryMode`, `exitRecoveryMode`.
- Auth actions return `string | null` (error message or null) instead of throwing.
- Sign-up passes `display_name` via user metadata; the `profiles` row is expected to be created server-side (DB trigger, not in this repo).
- `PASSWORD_RECOVERY` auth event sets `recoveryMode`; reset emails redirect to `window.location.origin`.
- `loadProfile` loads the user's profile and then the partner's profile if `partner_id` is set. `refreshProfile()` re-runs it (used after pairing).

### Data model (Supabase; only the Trip Planner schema is in this repo)

- `profiles`: `id` (= auth user id), `display_name`, `mood_emoji`, `mood_label`, `drawing` (JSON array of strokes), `gender` (`male|female|other`), `partner_id`, `invite_code`, `recent_moods` (JSON array of `{emoji,label}`), `updated_at`.
- `invites`: `id`, `sender_id`, `receiver_id`, `activity`, `time` (free text), `status` (`pending|accepted|declined`), `created_at`.
- RPC `pair_with_code(code)` returns `{ success?, partner_id?, error? }`. Pairing logic and RLS live in Supabase; check there before changing queries.
- Pair codes: 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous chars), generated client-side in `generatePairCode()`, stored in `profiles.invite_code`.
- Supabase Realtime (`postgres_changes`) must be enabled for `profiles`, `invites`, `trips` and `trip_events`.

### `MainApp` state and sync patterns

- Local state is initialized once from `profile`/`partnerProfile` (mood, drawing, gender, display name, recent moods). Updates are optimistic: set local state, then fire the `db.ts` write with `.catch(console.error)`.
- Drawing writes are debounced 500 ms (`drawingTimer`); mood/gender/name writes are immediate.
- Realtime channels (cleaned up with `supabase.removeChannel`):
  - `partner-profile`: `UPDATE` on `profiles` filtered by `id=eq.<partnerId>` -> updates partner mood, drawing, gender.
  - `invites-sync`: all events on `invites` (unfiltered; relies on RLS) -> INSERT prepends, UPDATE replaces. DELETE is not handled.
- Invites are fetched once on mount via `fetchInvites`, then kept fresh by realtime. `mapDbInviteToInvite` converts rows to `Invite` with `sender: 'me' | 'partner'`.
- Gender drives labels: "Her/His/Partner's Mood", "Draw for Her/Him/Partner", "Linked with Her/Him/Partner". Keep these three-way branches consistent when adding new copy.
- Recent moods: max 5, most recent first, de-duplicated by emoji+label (`addToRecentMoods`). `MoodView.getDisplayMoods` pads with `DEFAULT_MOODS` to 5 slots, plus a "Custom" button opening `CustomMoodModal` (grapheme-aware single emoji input via `Intl.Segmenter`).

### Drawing

- `Drawing = Stroke[]`, `Stroke = { points: Point[] }`, points are normalized 0..1 so they scale across screen sizes. Aspect ratio is fixed at 2.2:1.
- `DrawingCanvas` (editable, own drawing): touch handlers are registered natively with `{ passive: false }` so `preventDefault` works on iOS Safari; mouse uses React handlers. Uses refs (`onChangeRef`, `drawingRef`) so native listeners see current values. A stroke is committed on end only if it has >= 2 points. Trash button clears all.
- `DrawingPreview` (read-only partner drawing): renders at 0.4 alpha, returns `null` when empty.
- Stroke color is read from the `--color-accent` CSS variable at draw time, so the drawing follows the theme.
- The entire drawing is stored in one `profiles.drawing` JSON column and overwritten on each change; large drawings mean larger payloads.

### Theming

- Three themes: `default` (Rose), `dark` (Night), `cute` (Cute). Stored in localStorage (`us-app-theme`), applied via `data-theme` on `<html>`. Initial theme falls back to `prefers-color-scheme`.
- Tokens are CSS variables in `global.css` per theme, re-registered under `@theme` so Tailwind classes like `bg-page`, `bg-card`, `bg-card-alt`, `text-text`, `text-text-soft`, `text-accent`, `border-border-accent`, `bg-accent-soft`, `bg-input`, `bg-muted`, `bg-success` work. Adding a theme or token requires updating all three theme blocks plus `@theme`, `Theme` and `THEMES` in `types.ts`, and the `themeCardColors`/`themePageColors` maps in `App.tsx`.
- `App.tsx` also updates `<meta name="theme-color">` (card color when logged in, page color otherwise).
- Prefer tokens over hard-coded colors (error text uses `text-red-500`).

### Trip Planner (third tab)

- Many trips per couple, shared with the partner, stored in Supabase (`trips`, `trip_events`; schema in `supabase/trip-planner.sql`). Uses `interactjs` for drag/resize of events.
- `trips`: `id` (client-generated uuid), `owner_id`, `name`, `start_date`, `end_date`. `trip_events`: `id` (client-generated uuid), `trip_id`, `title`, `date`, `start_minute`, `end_minute`. RLS uses `can_access_trip(owner_id)` (caller or caller's partner) for select/update/delete; insert requires `owner_id = auth.uid()`. Either partner can rename or delete any trip (events cascade).
- `useTripPlanner` keeps `trips` plus `eventsByTrip` (events loaded lazily for the active trip; missing key = not loaded). Active trip is remembered in localStorage (`us-app-active-trip`) and falls back to the first trip. Writes are optimistic (sync boolean returns); on a failed write it clears the cache, refetches and shows the error. Realtime channel `trip-planner` handles `trip_events` and `trips` (all events, unfiltered; DELETE by id).
- `TripPills` switches/creates trips and renames/deletes the active one (two-step delete); `TripDialog` handles new-trip (name + dates) and rename.
- Hourly grid 07:00-23:00, same-day events, overlaps shown side by side. Events outside the date range are kept but hidden.
- Grid geometry constants (`DAY_WIDTH`, `HOUR_HEIGHT`, `TIME_WIDTH`) live in `lib/trip/schedule.ts` and are shared by the grid and drag math.
- Event colors are `--event-color-1..5` in `:root` of `global.css` (not theme-specific). Event text is fixed dark.
- Tailwind v4 preflight zeroes margins, so the native `<dialog>` in `EventEditor` needs `m-auto`; buttons need explicit `cursor-pointer`.
- `PlannerHeader` initializes from props and is remounted via `key` when the saved range changes (avoids set-state-in-effect).

### Mobile/PWA specifics

- `index.html` disables zoom, uses `viewport-fit=cover`, Apple web-app meta tags. Layout is a `max-w-md` column, `h-screen`, with safe-area padding (`env(safe-area-inset-top)`) in the header and a bottom nav pinned absolutely (content has bottom spacer `h-20` / `pb-24` to clear it). There is no service worker or manifest.
- Only asset in `public/` is `favicon.png`.

## Gotchas

- Only `theme` and the active Trip Planner trip id are local (`localStorage`); everything else lives in Supabase.
- `MainApp` uses non-null assertions on `profile!`/`partnerProfile!`/`user!`; this is safe only because `App` gates rendering. Keep that gating if refactoring.
- State is initialized from props once; if profile data is refreshed while `MainApp` is mounted it will not re-sync except through the realtime handlers.
- Unpairing is not implemented (no UI to clear `partner_id`).
- `StrictMode` double-invokes effects in dev; realtime subscriptions rely on cleanup functions to avoid duplicate channels.
- Errors from DB writes in `MainApp` are only logged to the console (no toasts); auth/pairing screens show inline error text. The Trip Planner is the exception: it shows an error banner.
