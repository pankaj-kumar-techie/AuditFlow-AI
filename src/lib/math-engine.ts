export const NICHE_BENCHMARKS: any = {
  plumbing: { cvr: 3.5, ticket: 700 },
  hvac: { cvr: 3.0, ticket: 1635 },
  roofing: { cvr: 1.2, ticket: 8000 },
  electrical: { cvr: 3.2, ticket: 1200 },
  painting: { cvr: 2.5, ticket: 4500 },
  insulation: { cvr: 2.8, ticket: 3200 },
  default: { cvr: 2.0, ticket: 1500 }
};

export const ISSUE_WEIGHTS: any = {
  slow_speed: 0.20,
  no_cta: 0.15,
  no_reviews: 0.25,
  no_schema: 0.10,
  no_service_area: 0.15,
  no_booking: 0.10,
  no_financing: 0.15,
  poor_mobile: 0.20
};

export function calculateAuditMath(niche: string, traffic: number, evidence: any, scores: any) {
  const bench = NICHE_BENCHMARKS[niche.toLowerCase()] || NICHE_BENCHMARKS.default;
  
  // 1. Calculate Potential (if the site was perfect)
  const potential_revenue = Math.round(traffic * (bench.cvr / 100) * bench.ticket);
  
  // 2. Identify issues based on EVIDENCE (not AI)
  const active_issues = [];
  if (scores.mobile < 60) active_issues.push('slow_speed');
  if (!evidence.has_cta_above_fold) active_issues.push('no_cta');
  if (!evidence.has_on_site_reviews) active_issues.push('no_reviews');
  if (!evidence.has_schema_markup) active_issues.push('no_schema');
  if (!evidence.has_service_area_pages) active_issues.push('no_service_area');
  if (!evidence.has_online_booking) active_issues.push('no_booking');
  if (!evidence.has_financing) active_issues.push('no_financing');

  // 3. Calculate Weighted Loss
  let total_loss_pct = 0;
  active_issues.forEach(issue => {
    total_loss_pct += (ISSUE_WEIGHTS[issue] || 0.10);
  });
  
  // Reality Cap: Loss cannot exceed 70% of potential
  total_loss_pct = Math.min(total_loss_pct, 0.70);
  
  const total_loss = Math.round(potential_revenue * total_loss_pct);
  const missed_jobs = Math.round(total_loss / bench.ticket);

  return {
    potential_revenue,
    total_loss,
    total_loss_pct: Math.round(total_loss_pct * 100),
    missed_jobs,
    active_issues,
    bench
  };
}
