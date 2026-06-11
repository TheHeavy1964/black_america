# ✊🏾 Black America Dashboard
A premium, interactive multi-layer dashboard visualizing Black-led startups, leadership circles, community advancement programs, and grassroots organizations from 2020 to 2026.

## 🚀 Features
- **Mapbox GL JS Integration:** Dark-themed geographic visualization of organizations across the US, featuring responsive, interactive popups.
- **Interactive Map Popups:** Hover over pins to preview details; click pins to persist the popup, select info, visit the organization's site directly, or open the detailed profile modal without auto-panning the map.
- **Supabase Real-Time Backend:** Live synchronized data ingestion from a Supabase PostgreSQL instance with full fallback to client-side seed data if unconfigured.
- **Timeline Filtering:** Track organizations featured or established per year from 2020 to 2026.
- **Advanced Searching & Sorting:** Filter by US State, query names/tags/missions, or jump between categorized tabs.
- **Branded Design System:** Fully custom dark-themed UI featuring glassmorphic cards, custom category color accents, and partner footer alignment featuring the CSS-cropped **Innov8Edge** logo.

---

## 🛠️ Tech Stack & Setup

### Requirements
- **Next.js 15+** (App Router architecture)
- **Mapbox Account** (for Mapbox access token)
- **Supabase Project** (for database hosting)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
   NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Run the development server (configured on Port **3020** to avoid conflicts):
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3020](http://localhost:3020) to view the application.

---

## 💾 Ingesting & Seeding Data

To seed the initial database schema and ingest the 25 master records:
1. Execute the SQL schema script in `docs/supabase_schema.sql` inside your Supabase SQL Editor.
2. Run the seeding script locally:
   ```bash
   npx ts-node src/scripts/seed-supabase.ts
   ```
