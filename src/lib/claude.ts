import Anthropic from "@anthropic-ai/sdk";
import { LeadDB } from "./db";
import { calculateAuditMath, formatRevRange } from "./math-engine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export async function generateFullAuditReport(url: string, raw: any) {
  const domain = new URL(url).hostname.replace("www.", "");
  const saved = LeadDB.get(domain);
  
  const math = calculateAuditMath(raw.vertical || 'plumber', raw.traffic || 500, raw.evidence, raw.scores);
  const revenueRange = formatRevRange(math.loss_low, math.loss_high);
  
  const competitor = saved ? { name: saved.competitor_name, rank: saved.competitor_rank } : (raw.competitor || { name: "Market Leader", rank: 1 });

  const systemPrompt = `You are an elite business auditor. Style: Alex Hormozi. 
FORBIDDEN WORDS: SEO, NAP, 301, schema, core web vitals, domain authority, citation, backlinks, indexation.
RULE: Return ONLY raw JSON. No backticks. No explanation.
MATH RULE: Use the revenue range ${revenueRange} and ${math.missed_jobs} missed jobs exactly.`;

  const userPrompt = `
Analyze ${url} for ${raw.brand}.
MARKET: ${raw.city} · ${raw.vertical}
MATH: Loss range ${revenueRange} & ${math.missed_jobs} jobs/mo.
EVIDENCE: ${JSON.stringify(raw.evidence)}
COMPETITOR: ${competitor.name} (Rank #${competitor.rank})

Return JSON: { 
  page1: { headline: "${raw.brand} Is Bleeding ${revenueRange} Every Month", subheadline },
  page2: { discovery_fixes: [], math_callout: "≈ ${math.missed_jobs} jobs routed to ${competitor.name} instead of you." },
  page3: { headline, comparison_rows: [] },
  page4: { angle, story, trust_fixes: [] },
  page5: { other_issues: [] },
  cta: "The ${revenueRange} leak stops when you fix the infrastructure. Recover your position."
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
  
  return { ...report, numbers: math, revenueRange };
}

export async function generateLiteReport(url: string, raw: any) {
  const domain = new URL(url).hostname.replace("www.", "");
  const math = calculateAuditMath(raw.vertical || 'plumber', raw.traffic || 500, raw.evidence, raw.scores);
  const revenueRange = formatRevRange(math.loss_low, math.loss_high);
  const competitor = raw.competitor || { name: "Market Leader", rank: 1 };

  return {
    lead_id: domain,
    paradox_headline: `Bleeding ${revenueRange} Every Month.`,
    paradox_sentence: `You sit at #${raw.lead_rank}, while ${competitor.name} at #${competitor.rank} captures the ${math.missed_jobs} jobs you are missing.`
  };
}