// ==========================================
// GEMINI API UTILITY
// ==========================================

export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

/**
 * Call the Gemini API to process content and return a structured response.
 * We use the v1beta generateContent endpoint with JSON output enabled.
 */
export async function callGemini(prompt: string, jsonSchema?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        ...(jsonSchema ? { responseSchema: JSON.parse(jsonSchema) } : {}),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as GeminiResponse;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

/**
 * Normalizes organization data returned by the LLM to strictly match
 * database check constraints and types.
 */
export function normalizeIngestedOrg(org: any): any {
  const validCategories = ["financial_literacy", "startup", "leadership", "community", "grassroots"];
  const validDeliveryModels = ["in_person", "virtual", "hybrid", "app", "platform"];
  const validEvidenceTypes = ["media_coverage", "research", "self_reported", "government_data"];

  // 1. Normalize Category
  let category = String(org.category || "community").toLowerCase().trim().replace(/[\s-]/g, "_");
  if (!validCategories.includes(category)) {
    if (category.includes("finance") || category.includes("wealth") || category.includes("literacy")) {
      category = "financial_literacy";
    } else if (category.includes("startup") || category.includes("company") || category.includes("business")) {
      category = "startup";
    } else if (category.includes("leader")) {
      category = "leadership";
    } else if (category.includes("grass")) {
      category = "grassroots";
    } else {
      category = "community";
    }
  }

  // 2. Normalize Delivery Model
  let deliveryModel = String(org.delivery_model || "virtual").toLowerCase().trim().replace(/[\s-]/g, "_");
  if (!validDeliveryModels.includes(deliveryModel)) {
    if (deliveryModel.includes("person") || deliveryModel.includes("physical")) {
      deliveryModel = "in_person";
    } else if (deliveryModel.includes("hybrid")) {
      deliveryModel = "hybrid";
    } else if (deliveryModel.includes("app")) {
      deliveryModel = "app";
    } else if (deliveryModel.includes("platform")) {
      deliveryModel = "platform";
    } else {
      deliveryModel = "virtual";
    }
  }

  // 3. Normalize Evidence Type
  let evidenceType = String(org.evidence_type || "media_coverage").toLowerCase().trim().replace(/[\s-]/g, "_");
  if (!validEvidenceTypes.includes(evidenceType)) {
    evidenceType = "media_coverage";
  }

  // 4. Clean numeric fields
  const fundingAmount = org.funding_amount ? Math.floor(Number(org.funding_amount)) : null;
  const cohortSize = org.cohort_size ? Math.floor(Number(org.cohort_size)) : null;
  const yearFeatured = org.year_featured ? Math.floor(Number(org.year_featured)) : 2026;
  const yearFounded = org.year_founded ? Math.floor(Number(org.year_founded)) : null;
  
  // 5. Ensure coordinates are float numbers
  const lat = org.lat ? parseFloat(String(org.lat)) : null;
  const lng = org.lng ? parseFloat(String(org.lng)) : null;

  return {
    ...org,
    category,
    delivery_model: deliveryModel,
    evidence_type: evidenceType,
    funding_amount: fundingAmount,
    cohort_size: cohortSize,
    year_featured: yearFeatured,
    year_founded: yearFounded,
    lat,
    lng,
    status: "pending_review"
  };
}

