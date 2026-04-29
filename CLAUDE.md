# World Map Tracker — Project Spec for Claude Code

## Overview

A world map travel tracker built with Next.js and Supabase. The landing page is a decorative empty map. Users can sign up, track visited regions on their personal map, and optionally share it publicly. The public-facing URL format is `/[username]`.

---

## Tech Stack

- **Framework:** Next.js (App Router) deployed on Vercel
- **Database + Auth:** Supabase (Postgres + Supabase Auth)
- **Map rendering:** D3 v7 + TopoJSON v3
- **Map data:**
  - World countries: `world-atlas` npm package (`countries-110m.json` for default, `countries-50m.json` lazy-loaded at zoom ≥ 4x)
  - US states: `us-atlas` npm package (`states-10m.json`)
  - Canada provinces: bundled locally as `website/src/data/canada-provinces.geojson` — do NOT load from any CDN. Source this from the `@highcharts/map-collection` npm package (`countries/ca/ca-all.geo.json`), deduplicate Nunavut, and fix any null names before bundling.
- **Styling:** Tailwind CSS
- **Auth helpers:** `@supabase/ssr`

---

## Project Structure

```
/
├── supabase/
│   ├── 001_create_users.sql          # Users table + username constraint + index
│   ├── 002_create_maps.sql           # Maps table + index
│   ├── 003_rls_policies.sql          # Row-level security policies for both tables
│   └── 004_functions_and_triggers.sql# updated_at trigger function
├── website/                          # Next.js app — run from here with npm run dev
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page — decorative map
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Sign in / sign up
│   │   │   ├── [username]/
│   │   │   │   └── page.tsx          # Public or editable map profile
│   │   │   └── not-found.tsx         # Global 404
│   │   ├── components/
│   │   │   ├── WorldMap.tsx          # Core D3 map component
│   │   │   ├── MapControls.tsx       # Legend, color pickers, home mode button
│   │   │   ├── StatsBar.tsx          # Visited / lived / home counts
│   │   │   ├── ThemeToggle.tsx       # Dark / light mode switch
│   │   │   └── PrivacyToggle.tsx     # Public / private toggle (owner only)
│   │   ├── data/
│   │   │   └── canada-provinces.geojson  # Bundled locally — see sourcing note above
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts         # Browser Supabase client
│   │   │   │   └── server.ts         # Server Supabase client (uses @supabase/ssr)
│   │   │   └── map-utils.ts          # Region ID helpers, status cycle logic
│   │   └── middleware.ts             # Auth session refresh via Supabase SSR
│   ├── public/
│   │   └── topo/                     # TopoJSON/GeoJSON served at runtime
│   │       ├── countries-110m.json
│   │       ├── countries-50m.json
│   │       ├── states-10m.json
│   │       └── canada-provinces.geojson
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── CLAUDE.md
├── README.md
└── world-map-tracker.html            # Original reference prototype
```

---

## Routes

### `GET /`
- Renders the world map in **decorative mode**: map is visible but all regions are unclickable and uncolored (unvisited neutral theme color).
- No sign-in button, no navigation links anywhere on the page.
- Page title: **World Map Tracker**
- Dark/light mode toggle is visible.
- The map should render server-side shell with D3 initializing client-side.

### `GET /login`
- Not linked from any public page — users navigate here directly.
- Two tabs or toggle: **Sign in** and **Sign up**.
- Sign up flow:
  1. Email + password + desired username
  2. Username validated: lowercase letters, numbers, hyphens only. Min 3 chars, max 30 chars.
  3. Check username availability in real time (debounced 400ms) against the `users` table.
  4. On success: insert row into `users`, create row in `maps`, redirect to `/[username]`.
- Sign in flow:
  1. Email + password
  2. On success: look up username from `users` table, redirect to `/[username]`.
- Supabase Auth handles sessions via cookies (use `@supabase/ssr`).

### `GET /[username]`
- Server component fetches the user row and map row.
- **If username does not exist OR map is private and viewer is not the owner:**
  - Render a styled message page: *"This map is private or doesn't exist."*
  - Include a subtle back link to `/`
  - Do NOT return a 404 status — return 200 with the message page. Reserve 404 for truly missing routes.
- **If map is public OR viewer is the authenticated owner:**
  - Render the full map with saved `regions` and `colors` from DB.
- **Owner view (authenticated, viewing own map):**
  - Map is fully editable (click to cycle status, home mode, color customization).
  - Public/private toggle visible (small, unobtrusive — top right corner).
  - Changes auto-save to DB debounced 800ms after last interaction.
- **Visitor view (not owner, map is public):**
  - Map is read-only. No controls visible. Stats bar visible.

---

## Database Schema

Run the migration files in order in the Supabase SQL editor:

1. `supabase/001_create_users.sql` — users table, username constraint, index
2. `supabase/002_create_maps.sql` — maps table, index
3. `supabase/003_rls_policies.sql` — RLS policies for both tables
4. `supabase/004_functions_and_triggers.sql` — `updated_at` trigger

No client should ever be able to bypass RLS.

---

## API Design

All data access goes through Supabase client directly (no custom API routes needed for MVP). The exception is username availability checking, which should use a Next.js Route Handler to avoid exposing direct DB queries to the client.

### Route Handlers

#### `GET /api/username/[username]`
- Checks if a username is available.
- Returns `{ available: boolean }`.
- Rate limit consideration: debounce on client side (400ms), no server-side rate limiting needed for MVP.
- Uses the **server** Supabase client.

### Direct Supabase calls (client-side, protected by RLS)

| Action | Table | Operation |
|---|---|---|
| Load map data | `maps` joined with `users` | SELECT via server component |
| Save regions | `maps` | UPDATE `regions` (debounced) |
| Save colors | `maps` | UPDATE `colors` |
| Toggle privacy | `maps` | UPDATE `is_public` |
| Username availability | `users` | Via `/api/username/[username]` route handler |
| Sign up | `auth.users` + `users` + `maps` | Supabase Auth + INSERT |
| Sign in | `auth.users` | Supabase Auth |
| Sign out | — | Supabase Auth |

---

## Map Component Behavior

### Region IDs
Regions are identified by a consistent string ID stored in the `regions` JSONB:
- World countries: `c_{numeric_id}` (e.g. `c_356` for India)
- US states: `us_{numeric_id}` (e.g. `us_53` for Washington)
- Canada provinces: `ca_{hc-a2_code}` (e.g. `ca_BC` for British Columbia)

### Status Cycle
Clicking a region cycles through: `unvisited → visited → lived → unvisited`

Home is set separately via the "set home" button — not part of the click cycle. Only one region can be home at a time. Setting a new home converts the previous home to `lived`.

### Statuses
| Status | Color source |
|---|---|
| `unvisited` | Theme-controlled. Not user-customizable. Light mode: `#c8d8e0`. Dark mode: `#2a3a42`. |
| `visited` | User-customizable, saved to DB. Default: `#1D9E75` |
| `lived` | User-customizable, saved to DB. Default: `#D85A30` |
| `home` | User-customizable, saved to DB. Default: `#9B59B6` |

### Zoom Behavior
- Projection: Mercator
- Zoom range: 1x–300x
- At zoom ≥ 4x: swap world countries layer from `countries-110m` to `countries-50m` (lazy load once, then cache)
- Stroke widths scale inversely with zoom (`stroke-width / k`) so borders stay crisp
- Map container: `overflow-x: auto`, `min-width: 900px`, `-webkit-overflow-scrolling: touch`
- Drag detection: suppress click events if pointer moved > 4px during mousedown (prevents accidental region clicks while panning)

### Dark / Light Mode
- Implemented with Tailwind `dark:` classes and a `ThemeToggle` component
- Store preference in `localStorage` under `wmt-theme`
- Unvisited region color changes with theme (see above)
- Ocean/water background: light mode `#b8d4e8`, dark mode `#1a2a35`
- All UI chrome follows Tailwind dark mode conventions

---

## Auth Middleware

`website/src/middleware.ts` should use `@supabase/ssr` to refresh the session cookie on every request. Protect no routes at the middleware level — access control is handled at the page/component level and enforced by RLS.

```ts
// Refresh session on every request so cookies don't expire mid-session
export async function middleware(request: NextRequest) {
  return await updateSession(request) // from @supabase/ssr
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These are the only two needed. The anon key is safe to expose publicly — RLS enforces all access control.

---

## Vercel Deployment

- Connect GitHub repo to Vercel
- Set **Root Directory** to `website` in Vercel project settings (Framework Preset: Next.js)
- Add the two environment variables above in Vercel project settings
- Vercel free tier is sufficient indefinitely for this project

---

## Supabase Free Tier Notes

- Free tier projects **pause after 7 days of inactivity**
- To prevent this: add a GitHub Actions cron job or Vercel cron that pings the Supabase health endpoint once daily
- All features used (Auth, Postgres, RLS) are available on the free tier with no limits relevant to this project

---

## What Is Explicitly Out of Scope

Do not implement any of the following unless explicitly asked:

- Social features (who else visited X, followers, likes)
- Multiple maps per user
- Image uploads or avatars
- Email verification flow beyond what Supabase provides by default
- Admin dashboard
- Any analytics or tracking
- Any advertising or monetization hooks
- Mobile app
- Rate limiting beyond client-side debouncing