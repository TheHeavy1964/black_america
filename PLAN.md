# 🏗️ PLAN.md — Black America Dashboard
> **Project:** Multi-Layer Dashboard of Black-Led Startups, Leadership, Community & Grassroots Orgs (2020–2026)  
> **Stack:** Next.js App Router · Lucide React · Supabase · Mapbox GL JS  
> **Created:** 2026-06-10

---

## 🗺️ Master Roadmap

| # | Milestone | Description | Status |
|---|-----------|-------------|--------|
| 1 | **Data Architecture & Schema** | Define master table, 5 categories, inclusion rules, JSON schema | ✅ Complete |
| 2 | **Seed Dataset & Supabase DB** | Establish Supabase instance, run schema, seed 25 master records | ✅ Complete |
| 3 | **Dashboard Shell** | Next.js app with 5-tab navigation, dark-mode design system, responsive layout | ✅ Complete |
| 4 | **Core Views & Mapping** | Mapbox GL JS dark map integration with custom marker popups and bounds | ✅ Complete |
| 5 | **Financial Literacy Layer** | Dedicated tab for Black-led financial ed, investment ed, and fintech programs | ✅ Complete |
| 6 | **Search, Filter & Drill-down** | Year, state, theme filters + interactive click-to-detail popups | ✅ Complete |
| 7 | **Footer & Brand Styling** | Integrate Innov8Edge partner branding and logo styling | ✅ Complete |
| 8a | **Database Status & Seeding** | Add `pending_review` to Supabase schema check and types | ✅ Complete |
| 8b | **RSS Ingestion Pipeline** | Next.js API route fetching feeds, parsing via Gemini, and writing to draft stage | ✅ Complete |
| 8c | **Email Webhook Ingestion** | Inbound webhook route parsing Google Alerts into DB drafts | ✅ Complete |
| 8d | **Admin Moderation Portal** | Dashboard `/admin` page to view, edit, approve, or reject pending entries | ✅ Complete |

---

## 🚀 Current Trajectory

**Active Milestone:** `None — All Milestones Successfully Completed!`  
**Next Action:** Continue monitoring moderation queue and scale external ingestion sources as desired.



---

## ✏️ Squad Status

| Agent | Task | Status |
|-------|------|--------|
| Antigravity | Research & Planning | ✅ Complete |
| Antigravity | Data Model + Schema | ✅ Complete |
| Antigravity | Dashboard Shell + Views | ✅ Complete |
| Antigravity | Mapbox Component (Fixed Collapsing & Hover-Persistence) | ✅ Complete |
| Antigravity | Supabase Integration & RLS | ✅ Complete |
| Antigravity | Brand Logo Integration & Footer | ✅ Complete |
| User | Supabase SQL schema execution | ✅ Complete |
| User | Provided Service Role Key for Seeding | ✅ Complete |

---

## 📌 Key Decisions Made

1. **Backend:** Configured Supabase with client-side fallback to local seed data.
2. **Map View:** Integrated Mapbox GL JS with dark style (`dark-v11`), manual hover/click persistence, and no-pan selection.
3. **Deployment Target:** Setup for easy hosting on Vercel.
4. **Branding:** Placed CSS-cropped, centered Innov8Edge logo at footer matching text proportions.
5. **Intro Video:** Added a premium full-screen intro overlay playing the Innov8Edge animated logo video on load, with manual skip controls and a smooth fade-out transition.
6. **Interactive Hit Box:** Enlarged the interactive hit box of map markers to 36px while maintaining a centered 14px visual circle, solving mobile/desktop hover/click unresponsiveness.
