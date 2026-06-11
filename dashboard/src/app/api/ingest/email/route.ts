// ==========================================
// EMAIL WEBHOOK INGESTION ROUTE — Next.js API
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { callGemini, normalizeIngestedOrg } from "@/utils/gemini";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Basic Webhook Security Check
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("secret");
    const webhookSecret = process.env.WEBHOOK_SECRET || "default_alerts_secret";

    if (token !== webhookSecret) {
      return NextResponse.json({ success: false, message: "Unauthorized webhook access." }, { status: 401 });
    }

    // 2. Parse Incoming Email Payload
    // Webhook engines (SendGrid, Mailgun, Postmark) post multipart/form-data or application/json.
    let emailText = "";
    let emailSubject = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      emailText = body.text || body.html || body.plain || "";
      emailSubject = body.subject || "";
    } else {
      // Form-data fallback (standard for SendGrid inbound parse)
      const formData = await req.formData();
      emailText = (formData.get("text") as string) || (formData.get("html") as string) || "";
      emailSubject = (formData.get("subject") as string) || "";
    }

    if (!emailText) {
      return NextResponse.json({ success: false, message: "No email body content found." }, { status: 400 });
    }

    // 3. Build Gemini prompt
    const prompt = `
You are a data curator for the Black America Dashboard. You have received a Google Alert email containing news updates regarding Black-founded businesses, Black leaders, or community organizations.

Subject: ${emailSubject}

Here is the email text:
-----------------
${emailText}
-----------------

Your Task:
CRITICAL INCLUSION RULE: You MUST ONLY extract entities (companies, startups, initiatives, programs, or leaders) that are explicitly Black-owned, Black-led, or directly and specifically designed for the advancement of the Black/African American community. 
DO NOT extract generic, mainstream companies (such as Coinbase, Better, etc.) simply because they are mentioned in financial or business stories, unless the story is about a dedicated program run by them specifically for Black community empowerment. If an entity is not explicitly Black-led, Black-owned, or specifically serving the Black/African American population, skip it completely.

1. Scan the text for mentions of specific Black-founded companies, startups, financial literacy initiatives, leadership circles, or grassroots organizations.
2. Structure them strictly into an array of JSON objects matching this format:
{
  "id": "A URL-safe unique ID starting with 'alert-', e.g., 'alert-greenwood-banking-2026'",
  "name": "Full name of the company/organization/initiative",
  "category": "One of: 'financial_literacy', 'startup', 'leadership', 'community', 'grassroots'",
  "subcategory": "A short subcategory name (e.g. 'Fintech', 'Youth Mentorship')",
  "year_featured": 2026,
  "year_founded": Year founded (integer) or null,
  "source_url": "The link to the article/website if present in the text",
  "location_city": "City name (US/Canada/International)",
  "location_state": "2-letter state/province code",
  "leaders": ["Leader/Founder Name(s)"],
  "mission": "A 1-2 sentence description of their core mission",
  "evidence_type": "media_coverage",
  "impact_metric": "Specific metric mentioned (e.g. 'Raised $5M Series A') or null",
  "tags": ["3-5 lowercase keyword tags"],
  "funding_amount": Funding amount in USD if mentioned (integer, or null)",
  "cohort_size": Number of cohort participants if mentioned (integer, or null)",
  "population_served": "Target population/demographic or null",
  "delivery_model": "One of: 'in_person', 'virtual', 'hybrid', 'app', 'platform'",
  "status": "pending_review",
  "summary": "A concise paragraph summarizing the story details.",
  "lat": Estimated latitude of the city/state,
  "lng": Estimated longitude of the city/state
}

Ensure coordinates (lat/lng) are approximate centerpoints of the specified city/state.
If no entries match the dashboard criteria, return an empty array [].
Output ONLY valid JSON.
`;

    // 4. Call Gemini
    const geminiText = await callGemini(prompt);
    
    // Clean JSON response (remove backticks if LLM added them)
    const jsonString = geminiText.trim().replace(/^```json|```$/g, "").trim();
    const rawOrganizations = JSON.parse(jsonString) as any[];

    if (!Array.isArray(rawOrganizations)) {
      return NextResponse.json({ success: false, message: "Gemini did not return a valid array." }, { status: 500 });
    }

    const organizations = rawOrganizations.map(normalizeIngestedOrg);

    if (organizations.length === 0) {
      return NextResponse.json({ success: true, message: "Webhook processed. No matching dashboard items extracted." });
    }

    // 5. Ingest into Supabase
    const { data, error } = await supabase
      .from("organizations")
      .upsert(organizations, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ success: false, message: `Database write failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${organizations.length} draft entries from email webhook.`,
      count: organizations.length,
      organizations: organizations.map(o => ({ id: o.id, name: o.name, category: o.category })),
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "An error occurred during email parsing." }, { status: 500 });
  }
}
