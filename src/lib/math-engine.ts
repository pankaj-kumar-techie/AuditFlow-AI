// math-engine.ts
// Verified benchmark data from industry_benchmarks_v2.pdf (Version 2.0 · 2026-05-12)

export const NICHE_BENCHMARKS: Record<string, { cvr: number; ticket: number; confidence: string }> = {
  // EMERGENCY
  "fire_restoration": { cvr: 6.0, ticket: 7300, confidence: "M" },
  "water_damage": { cvr: 6.0, ticket: 7300, confidence: "M" },
  
  // HIGH URGENCY
  "plumbing": { cvr: 3.5, ticket: 1080, confidence: "H" },
  "plumber": { cvr: 3.5, ticket: 1080, confidence: "H" },
  "pest_control": { cvr: 3.5, ticket: 390, confidence: "H" },
  "junk_removal": { cvr: 4.0, ticket: 510, confidence: "M" },
  "tree_service": { cvr: 4.0, ticket: 1120, confidence: "M" },
  "window_cleaning": { cvr: 4.0, ticket: 320, confidence: "L" },
  "handyman": { cvr: 3.0, ticket: 382, confidence: "M" },
  "hvac": { cvr: 3.0, ticket: 1635, confidence: "H" },
  "electrical": { cvr: 3.0, ticket: 885, confidence: "H" },
  "electrician": { cvr: 3.0, ticket: 885, confidence: "H" },
  "garage_door": { cvr: 4.0, ticket: 578, confidence: "M" },
  
  // MEDIUM / PLANNED
  "flooring": { cvr: 2.0, ticket: 6300, confidence: "L" },
  "painting": { cvr: 2.0, ticket: 4650, confidence: "M" },
  "painter": { cvr: 2.0, ticket: 4650, confidence: "M" },
  "concrete": { cvr: 2.0, ticket: 5700, confidence: "L" },
  "fences": { cvr: 2.0, ticket: 6800, confidence: "L" },
  "drywall": { cvr: 2.0, ticket: 1830, confidence: "L" },
  "carpet": { cvr: 2.0, ticket: 2300, confidence: "L" },
  
  // HIGH-TICKET
  "roofing": { cvr: 1.2, ticket: 9540, confidence: "H" },
  "roofer": { cvr: 1.2, ticket: 9540, confidence: "H" },
  "siding": { cvr: 1.2, ticket: 13250, confidence: "M" },
  "windows": { cvr: 1.5, ticket: 8400, confidence: "M" },
  "foundation": { cvr: 2.0, ticket: 9750, confidence: "L" },
  "kitchen_remodel": { cvr: 1.2, ticket: 26950, confidence: "H" },
  "bathroom_remodel": { cvr: 1.5, ticket: 12135, confidence: "H" },
  "adu": { cvr: 1.2, ticket: 68000, confidence: "L" },
  "solar": { cvr: 0.9, ticket: 22200, confidence: "H" },
  "pool": { cvr: 1.2, ticket: 53000, confidence: "L" },
  
  "default": { cvr: 2.5, ticket: 1500, confidence: "M" }
};

export function calculateAuditMath(niche: string, traffic: number, evidence: any, scores: any) {
  const key = niche.toLowerCase().replace(/\s+/g, "_");
  const bm = NICHE_BENCHMARKS[key] || NICHE_BENCHMARKS["default"];
  
  // 1. CVR Logic (Typical vs Potential)
  const cvr_typical = bm.cvr / 100;
  const cvr_potential = cvr_typical * 2.0; // Optimized site ~ 2x lift
  
  // 2. Revenue Calculation
  const current_revenue = Math.round(traffic * cvr_typical * bm.ticket);
  const potential_revenue = Math.round(traffic * cvr_potential * bm.ticket);
  
  // 3. Loss Delta
  let loss = potential_revenue - current_revenue;
  
  // 4. SANITY CHECKS & REALITY CAPS
  // Reality cap: loss cannot exceed 50% of potential (per v2.0 spec)
  const max_defensible_loss = Math.round(potential_revenue * 0.50);
  if (loss > max_defensible_loss) {
    loss = max_defensible_loss;
  }

  // 5. CONFIDENCE BANDS (0.7x to 1.3x)
  const loss_low = Math.round(loss * 0.7);
  const loss_high = Math.round(loss * 1.3);
  
  const total_loss_pct = Math.round((loss / potential_revenue) * 100);
  const missed_jobs = Math.round(loss / bm.ticket);

  return {
    potential_revenue,
    current_revenue,
    total_loss: loss,
    loss_low,
    loss_high,
    total_loss_pct,
    missed_jobs,
    bench: { cvr: bm.cvr, ticket: bm.ticket }
  };
}

export function formatRevRange(low: number, high: number): string {
  const fmt = (n: number) => {
    if (n >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return "$" + n.toLocaleString();
  };
  return `${fmt(low)}–${fmt(high)}`;
}