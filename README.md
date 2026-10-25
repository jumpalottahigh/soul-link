# Soul Link

A mobile-first web app for two paired partners to share moods, small drawings, and date invites in real time, with a shared trip planner. Single-page React app; [Supabase](https://supabase.com) is the entire backend.

## Features

- **Mood**: set your mood (recent, default, or custom emoji) and see your partner's live. Draw a small doodle for your partner on a canvas.
- **Invites**: send date ideas with a time, and accept or decline the ones you receive.
- **Trip Planner**: plan multiple trips with your partner, switching between them with pills. The selected trip's three-dot menu offers rename, date adjustment in a modal, and confirmed deletion. Each trip has an hourly day-by-day grid; drag events to move them and pull the edges to resize. Changes sync in real time.
- **Bingo**: create named, shared 5x5 boards. Edit shared items, then switch to Play to mark your own progress. Each partner has their own initial badges and bingo count. Clearing an item resets both partners' marks; changes sync in real time.
- **Pairing**: link two accounts with a 6-character code.
- **Themes**: Rose, Night, and Cute.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, `lucide-react`, `interactjs`, `@supabase/supabase-js`.

## Setup

Requires the Node version in `.nvmrc`.

```sh
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:5173/.

Environment variables (Vite):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Trip Planner schema is in [supabase/trip-planner.sql](supabase/trip-planner.sql). Run it in the Supabase SQL editor (it is idempotent, so re-running after updates is safe). The rest of the schema (`profiles`, `invites`, the `pair_with_code` RPC, RLS) lives in Supabase, not in this repo. Realtime must be enabled for `profiles`, `invites`, `trips` and `trip_events`.

For Bingo, also run [supabase/bingo.sql](supabase/bingo.sql) in the Supabase SQL editor. It creates the board, cell, and per-user mark tables, partner-access policies, transactional save functions, and realtime publication entries. It is safe to re-run and does not require the Trip Planner schema. New boards start with 25 empty cells and no free center. Either partner can edit or delete a board, but completion marks can only be changed by their owner (except when shared cell text is cleared). Only the last-opened board ID is stored locally.

## Deploying

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your host's build environment, then run `npm run build` and serve `dist/`.
- Run `supabase/trip-planner.sql` against the production Supabase project before releasing a version that uses it.
- Run [supabase/bingo.sql](supabase/bingo.sql) against the production Supabase project before releasing Bingo.
- In Supabase Auth settings, add your production URL as the Site URL / redirect URL; password reset emails redirect to the app's origin.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build to `dist/`
- `npm run lint`: run ESLint
- `npm test`: run Bingo domain checks with Node 24's native TypeScript support
- `npm run preview`: preview the production build

See [AGENTS.md](AGENTS.md) for architecture notes and conventions.
