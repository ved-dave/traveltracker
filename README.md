# World Map Tracker

A personal travel tracker built with Next.js and Supabase. Click regions on a world map to mark countries, US states, and Canadian provinces as visited, lived in, or home. Maps can be kept private or shared publicly at `/[username]`.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database + Auth:** Supabase (Postgres + Supabase Auth)
- **Map rendering:** D3 v7 + TopoJSON
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## Project Structure

```
/
├── supabase/                         # SQL migration files
│   ├── 001_create_users.sql
│   ├── 002_create_maps.sql
│   ├── 003_rls_policies.sql
│   └── 004_functions_and_triggers.sql
├── website/                          # Next.js app
│   ├── src/
│   │   ├── app/                      # Pages and API routes
│   │   ├── components/               # React components
│   │   ├── data/                     # Bundled GeoJSON
│   │   └── lib/                      # Supabase clients, map utilities
│   └── public/topo/                  # TopoJSON/GeoJSON served at runtime
├── .gitignore
├── README.md
└── world-map-tracker.html            # Original prototype (reference only)
```

---

## Local Development

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd traveltracker
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com), or deploy it locally with docker
2. Open the **SQL Editor** in your Supabase dashboard
3. Run each migration file in order:
   - `supabase/001_create_users.sql`
   - `supabase/002_create_maps.sql`
   - `supabase/003_rls_policies.sql`
   - `supabase/004_functions_and_triggers.sql`

### 3. Configure environment variables

```bash
cp website/.env.local.example website/.env.local
```

Or create `website/.env.local` manually:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase project under **Settings → API**.

### 4. Install and run

```bash
cd website
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push
```

### 2. Import into Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repository
3. Under **Root Directory**, set it to `website`
4. Framework Preset will auto-detect as **Next.js**

### 3. Add environment variables

In the Vercel project settings under **Environment Variables**, add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

### 4. Deploy

Click **Deploy**. Vercel will build from the `website` directory and assign you a URL. Future pushes to `main` deploy automatically.

---

## How It Works

### Map

The landing page (`/`) shows a decorative read-only map. Sign up at `/login` to get your own editable map at `/[username]`.

Clicking a region cycles it through three states:

| Status | Default color |
|---|---|
| Visited | Green `#1D9E75` |
| Lived | Orange `#D85A30` |
| Home | Purple `#9B59B6` |

Colors are customizable per map. One region can be marked as home at a time — setting a new home demotes the previous one to "lived".

### Privacy

Maps are private by default. Owners can toggle them public from their map page. A public map is visible to anyone at `/[username]`; a private map shows a "this map is private" message to anyone else.

### Data

Changes auto-save to the database 800ms after the last interaction.

---

## Supabase Free Tier Note

Free tier projects pause after 7 days of inactivity. To keep your project alive, set up a daily ping via a GitHub Actions cron job or Vercel cron that hits your Supabase health endpoint.
