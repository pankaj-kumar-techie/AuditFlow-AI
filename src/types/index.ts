export interface AuditReport {
  headline: string;
  subheadline: string;
  numbers: {
    visitors_lost: string;
    missed_jobs: string;
    revenue_loss: string;
  };
  issues: Array<{
    title: string;
    story: string;
    impact: string;
    fix: string;
    result: string;
  }>;
  cta: string;
  client_name?: string;
  client_location?: string;
  screenshot_url?: string;
  screenshot_mobile_url?: string;
  raw_metrics?: any;
}
