// ==========================================
// RSS INGESTION ROUTE — Next.js API
// ==========================================

import { NextResponse } from "next/server";
import { callGemini, normalizeIngestedOrg } from "@/utils/gemini";
import { createAdminClient } from "@/utils/supabase/admin";

const FEEDS = [
  { name: "Black Enterprise", url: "https://www.blackenterprise.com/feed/" },
  { name: "The Grio", url: "https://thegrio.com/feed/" },
  { name: "NNPA BlackPressUSA", url: "https://blackpressusa.com/feed/" },
];

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch XML content from RSS feeds
    const feedContents: string[] = [];

    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url, { next: { revalidate: 3600 } });
        if (res.ok) {
          const text = await res.text();
          // Extract first 10 items to prevent prompt size issues
          const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];
          feedContents.push(`Feed: ${feed.name}\n${items.join("\n")}`);
        }
      } catch (e) {
        console.error(`Failed to fetch feed ${feed.name}:`, e);
      }
    }

    if (feedContents.length === 0) {
      return NextResponse.json({ success: false, message: "Could not fetch any RSS feeds." }, { status: 500 });
    }

    // 2. Build Gemini prompt
    const prompt = `
You are a data curator for the Black America Dashboard. Your job is to extract organizations, startups, community initiatives, leaders, or grassroots projects mentioned in these RSS feed items.

CRITICAL INCLUSION RULE: You MUST ONLY extract entities (companies, startups, initiatives, programs, or leaders) that are explicitly Black-owned, Black-led, or directly and specifically designed for the advancement of the Black/African American community. 
DO NOT extract generic, mainstream companies (such as Coinbase, Better, etc.) simply because they are mentioned in financial or business stories, unless the story is about a dedicated program run by them specifically for Black community empowerment. If an entity is not explicitly Black-led, Black-owned, or specifically serving the Black/African American population, skip it completely.

Target Categories:
- 'financial_literacy': programs, tools, or resources for financial coaching, wealth building, investing, homeownership, or digital banking.
- 'startup': venture-backed or bootstrapped companies led by Black founders.
- 'leadership': mid-to-senior development fellowships, panels, or business circles.
- 'community': institutional or regional media access, development grants, and nonprofit initiatives.
- 'grassroots': local healing circles, self-help groups, community-led initiatives.


Here is the RSS content:
${feedContents.join("\n\n")}

Task:
1. Identify matching organizations/startups/initiatives in the text.
2. Structure them strictly into an array of JSON objects matching this format:
{
  "id": "A URL-safe unique ID starting with 'rss-', e.g., 'rss-operation-hope-2026'",
  "name": "Full name of the company/organization/initiative",
  "category": "One of: 'financial_literacy', 'startup', 'leadership', 'community', 'grassroots'",
  "subcategory": "A short subcategory name (e.g. 'Fintech', 'Executive Mentorship')",
  "year_featured": 2026,
  "year_founded": Year founded (integer) or null,
  "source_url": "The link to the article/website if present",
  "location_city": "City name (US/Canada/International)",
  "location_state": "2-letter state/province code",
  "leaders": ["Leader/Founder Name(s)"],
  "mission": "A 1-2 sentence description of their core mission",
  "evidence_type": "media_coverage",
  "impact_metric": "Specific metric mentioned (e.g. 'Over 1M users served') or null",
  "tags": ["3-5 lowercase keyword tags"],
  "funding_amount": Funding amount in USD if mentioned (integer, or null)",
  "cohort_size": Number of cohort participants if mentioned (integer, or null)",
  "population_served": "Target population/demographic or null",
  "delivery_model": "One of: 'in_person', 'virtual', 'hybrid', 'app', 'platform'",
  "status": "pending_review",
  "summary": "A concise paragraph summarizing the story details.",
  "lat": Estimated latitude of the city/state (e.g. 33.749 for Atlanta),
  "lng": Estimated longitude of the city/state (e.g. -84.388 for Atlanta)
}

Ensure coordinates (lat/lng) are approximate centerpoints of the specified city/state.
If no entries match the dashboard criteria, return an empty array [].
Output ONLY valid JSON.
`;

    // 3. Call Gemini
    const geminiText = await callGemini(prompt);
    
    // Clean JSON response (remove backticks if LLM added them)
    const jsonString = geminiText.trim().replace(/^```json|```$/g, "").trim();
    const rawOrganizations = JSON.parse(jsonString) as any[];

    if (!Array.isArray(rawOrganizations)) {
      return NextResponse.json({ success: false, message: "Gemini did not return an array." }, { status: 500 });
    }

    const organizations = rawOrganizations.map(normalizeIngestedOrg);

    if (organizations.length === 0) {
      return NextResponse.json({ success: true, message: "Parsed feeds successfully. No new matching records found.", count: 0 });
    }

    // 4. Save to Supabase (upsert by id)
    const { data, error } = await supabase
      .from("organizations")
      .upsert(organizations, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ success: false, message: `Database write failed: ${error.message}`, data: organizations }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${organizations.length} draft entries from RSS feeds.`,
      count: organizations.length,
      organizations: organizations.map(o => ({ id: o.id, name: o.name, category: o.category })),
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "An error occurred during RSS ingestion." }, { status: 500 });
  }
}
