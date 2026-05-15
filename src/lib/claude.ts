import Anthropic from "@anthropic-ai/sdk";
import { LeadDB, LeadRecord } from "./db";
import { calculateAuditMath } from "./math-engine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export async function generateFullAuditReport(url: string, raw: any) {
  const domain = new URL(url).hostname.replace("www.", "");
  const saved = LeadDB.get(domain);
  const math = calculateAuditMath(raw.vertical || 'plumber', raw.traffic || 500, raw.evidence, raw.scores);
  const competitor = saved ? { name: saved.competitor_name, rank: saved.competitor_rank, reviews: saved.competitor_reviews, rating: saved.competitor_rating } : (raw.competitor || { name: "Market Leader", rank: 1, reviews: 100, rating: 4.8 });

  const systemPrompt = `You are an elite business auditor. Style: Alex Hormozi. 
FORBIDDEN WORDS: SEO, NAP, 301, schema, core web vitals, domain authority, citation, backlinks, indexation.
RULE: Return ONLY raw JSON. No backticks. No explanation.`;

  const userPrompt = `
Analyze ${url} for ${raw.brand}.
MATH: Loss of $${math.total_loss.toLocaleString()} & ${math.missed_jobs} jobs/mo.
EVIDENCE: ${JSON.stringify(raw.evidence)}
COMPETITOR: ${competitor.name} (Rank #${competitor.rank}, Reviews: ${competitor.reviews}, Rating: ${competitor.rating})

Return JSON: { 
  page1: { headline: "${raw.brand} Is Bleeding $${math.total_loss.toLocaleString()} Every Month", subheadline },
  page2: { discovery_fixes: [{num:1, title, desc}, {num:2, title, desc}] },
  page3: { headline: "Three Seconds. No Reason to Stay.", comparison_rows: [{label:"Mobile Speed", lead_val:"${raw.scores.mobile}/100", comp_val:"90/100"}, {label:"Secure Site", lead_val:"Incomplete", comp_val:"Secure"}] },
  page4: { headline: "The Authority Gap", story: "Brief Hormozi story on why customers pick ${competitor.name} over you.", angle: "reviews", trust_fixes: [] },
  page5: { other_issues: [{title, desc}] },
  cta: "The $${math.total_loss.toLocaleString()} leak stops when you fix the infrastructure. Recover your position."
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });

  const rawContent = (response.content[0] as any).text;
  const cleanJson = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
  const report = JSON.parse(cleanJson);
  
  if (!saved) {
    LeadDB.save({
      domain, city: raw.city, vertical: raw.vertical, lead_name: raw.brand,
      lead_rank: raw.lead_rank, lead_rating: raw.lead_rating, lead_reviews: raw.lead_reviews,
      competitor_name: competitor.name, competitor_rank: competitor.rank,
      competitor_reviews: competitor.reviews, competitor_rating: competitor.rating,
      potential_revenue: math.potential_revenue, total_loss: math.total_loss
    } as any);
  }

  return { ...report, numbers: math };
}

export async function generateLiteReport(url: string, raw: any) {
  const domain = new URL(url).hostname.replace("www.", "");
  const math = calculateAuditMath(raw.vertical || 'plumber', raw.traffic || 500, raw.evidence, raw.scores);
  const competitor = raw.competitor || { name: "Market Leader", rank: 1 };

  return {
    lead_id: domain,
    paradox_headline: `Bleeding $${math.total_loss.toLocaleString()} Every Month.`,
    paradox_sentence: `You sit at #${raw.lead_rank}, while ${competitor.name} at #${competitor.rank} captures the ${math.missed_jobs} jobs you are missing.`
  };
}
