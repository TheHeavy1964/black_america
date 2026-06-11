// ==========================================
// BLACK AMERICA DASHBOARD — Core Types
// ==========================================

export type OrgCategory =
  | "financial_literacy"
  | "startup"
  | "leadership"
  | "community"
  | "grassroots";

export type EvidenceType =
  | "media_coverage"
  | "research"
  | "self_reported"
  | "government_data";

export type DeliveryModel =
  | "in_person"
  | "virtual"
  | "hybrid"
  | "app"
  | "platform";

export type OrgStatus = "active" | "inactive" | "unknown" | "pending_review";

export interface Organization {
  id: string;
  name: string;
  category: OrgCategory;
  subcategory: string;
  year_featured: number;
  year_founded: number | null;
  source_url: string;
  location_city: string;
  location_state: string;
  leaders: string[];
  mission: string;
  evidence_type: EvidenceType;
  impact_metric: string;
  tags: string[];
  funding_amount: number | null;
  cohort_size: number | null;
  population_served: string | null;
  delivery_model: DeliveryModel;
  status: OrgStatus;
  summary: string;
  lat?: number;
  lng?: number;
}

export const CATEGORY_LABELS: Record<OrgCategory, string> = {
  financial_literacy: "Financial Literacy & Wealth",
  startup: "Startups",
  leadership: "Leadership Circles",
  community: "Community Advancement",
  grassroots: "Grassroots / Self-Help",
};

export const CATEGORY_COLORS: Record<OrgCategory, string> = {
  financial_literacy: "gold",
  startup: "teal",
  leadership: "purple",
  community: "blue",
  grassroots: "rose",
};

export const CATEGORY_BADGE: Record<OrgCategory, string> = {
  financial_literacy: "badge-financial",
  startup: "badge-startup",
  leadership: "badge-leadership",
  community: "badge-community",
  grassroots: "badge-grassroots",
};
