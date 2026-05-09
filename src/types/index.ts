export interface AuditIssue {
  title: string;
  problem: string;
  why_it_matters: string;
  impact: string;
  opportunity: string;
  recommendation: string;
  severity: "high" | "medium" | "low";
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  time: string;
}

export interface AuditReport {
  executive_summary: string;
  traffic_overview: string;
  performance_overview: string;
  seo_visibility: string;
  ai_visibility: string;
  local_seo: string;
  competitor_comparison: string;
  growth_potential_cta: string;
  total_revenue_leak: string;
  issues: AuditIssue[];
  email_outreach: string;
  screenshot_url?: string;
  screenshot_mobile_url?: string;
  reviews?: Review[];
  local_stats?: {
    rating: number;
    total_reviews: number;
    name: string;
    address: string;
  };
  metrics?: {
    performance_score: number;
    organic_traffic: number;
    organic_keywords: number;
  };
}
