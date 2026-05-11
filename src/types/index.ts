export interface AuditReport {
  client_name: string;
  client_location: string;
  hero_message: string;
  summary: {
    total_issues: number;
    overall_assessment: string;
    growth_potential_range: string;
  };
  by_the_numbers: {
    visitors_lost_percent: string;
    missed_jobs_monthly: string;
    revenue_gap_range: string;
  };
  speed_story: {
    load_time: string;
    bounce_impact: string;
    math_breakdown: string;
    competitor_name: string;
    competitor_speed: string;
  };
  issues: Array<{
    title: string;
    problem: string;
    consequence: string;
    impact_range: string;
    recommendation: string;
    severity: "High" | "Medium" | "Low";
  }>;
  top_issues_for_email: string[];
  screenshot_url?: string;
  screenshot_mobile_url?: string;
  growth_potential_cta: string;
  email_outreach: string;
}
