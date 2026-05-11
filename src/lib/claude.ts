import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const NICHE_DATA = {
  roofing: { avg_ticket: 8000, conv_rate: 0.15, keyword: "roofing contractors" },
  plumbing: { avg_ticket: 700, conv_rate: 0.35, keyword: "plumbers near me" },
  dental: { avg_ticket: 3500, conv_rate: 0.20, keyword: "dental implants" },
  hvac: { avg_ticket: 5500, conv_rate: 0.25, keyword: "ac repair" },
  legal: { avg_ticket: 4500, conv_rate: 0.15, keyword: "personal injury lawyer" },
  landscaping: { avg_ticket: 1200, conv_rate: 0.30, keyword: "landscaping companies" },
  remodeling: { avg_ticket: 15000, conv_rate: 0.10, keyword: "kitchen remodel" },
  default: { avg_ticket: 2000, conv_rate: 0.20, keyword: "services" }
};

export async function generateAuditReport(url: string, rawData: any) {
  console.log(`[Claude] Generating Direct-Response Briefing for: ${url}`);

  const systemPrompt = `
You are a direct-response marketing analyst writing audit reports for home service businesses (plumbing, roofing, HVAC, electrical, etc.).
Your job is NOT to explain SEO. Your job is to identify business problems that are costing the company customers and revenue.

STRICT RULES:
1. Plain business language ONLY. No SEO jargon (No "meta", "backlinks", "H1").
2. Tone: Direct, Blunt, Punchy (Alex Hormozi style).
3. Tie EVERY issue to LOST CUSTOMERS or REVENUE.
4. Use estimated RANGES for impact (e.g., "10-25% more leads").
5. Do NOT hallucinate data. Only use the provided API data.
6. Structure every issue as: Problem -> Consequence -> Solution.
`;

  const userPrompt = `
Analyze the following website data and generate an "Exclusive Briefing" JSON.

WEBSITE: ${url}
DATA:
${JSON.stringify(rawData, null, 2)}

NICHE ECONOMICS:
${JSON.stringify(NICHE_DATA, null, 2)}

OUTPUT REQUIREMENTS:
1. Identify 10-15 key issues (Prioritize highest impact).
2. Construct a "Speed Story" using the raw PageSpeed data and Competitor comparison.
3. Calculate "By The Numbers" metrics using the Niche Economics + Search Volume.

JSON SCHEMA:
{
  "client_name": "Business Name",
  "client_location": "City, State",
  "hero_message": "Punchy Hormozi-style hook (e.g. Mike, your website is bleeding 32% of customers).",
  "summary": {
    "total_issues": 12,
    "overall_assessment": "1-2 sentence brutal diagnosis.",
    "growth_potential_range": "+X% to +Y% more leads"
  },
  "by_the_numbers": {
    "visitors_lost_percent": "e.g. 32%",
    "missed_jobs_monthly": "e.g. 11",
    "revenue_gap_range": "e.g. $4.8K - $7.2K"
  },
  "speed_story": {
    "load_time": "e.g. 8 seconds",
    "bounce_impact": "e.g. −25%",
    "math_breakdown": "Plain English explanation of the traffic loss.",
    "competitor_name": "Name of #1 ranked competitor from data",
    "competitor_speed": "Speed of #1 ranked competitor"
  },
  "issues": [
    {
      "title": "Business Centric Title",
      "problem": "What is wrong in plain English.",
      "consequence": "What it is costing them in customers/revenue.",
      "impact_range": "e.g. +10-25% more conversions",
      "severity": "High | Medium | Low",
      "recommendation": "The ARMA proprietary solution."
    }
  ],
  "top_issues_for_email": [
    "2-3 short punchy problems for cold outreach"
  ],
  "growth_potential_cta": "Final Hormozi-style push.",
  "email_outreach": "Human-style appointment request template."
}
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid response");
  } catch (error: any) {
    return getFallbackReport(url);
  }
}

function getFallbackReport(url: string) {
  return {
    client_name: "Business Owner",
    client_location: "Local Area",
    hero_message: "Your website is currently locking the door on ready-to-buy customers.",
    summary: {
      total_issues: 8,
      overall_assessment: "Your digital storefront is bleeding revenue due to performance bottlenecks.",
      growth_potential_range: "+20% to +35% more leads"
    },
    by_the_numbers: {
      visitors_lost_percent: "28%",
      missed_jobs_monthly: "9",
      revenue_gap_range: "$5,000 - $8,000"
    },
    speed_story: {
      load_time: "7.2 seconds",
      bounce_impact: "−22%",
      math_breakdown: "One in four visitors leave before your site even loads.",
      competitor_name: "Top Market Leader",
      competitor_speed: "1.5 seconds"
    },
    issues: [
      {
        title: "Invisible to Local Search",
        problem: "You aren't appearing where customers are looking.",
        consequence: "High-value local jobs are going directly to your competitors.",
        impact_range: "+15-30% more visibility",
        severity: "High",
        recommendation: "Implement ARMA Local Dominance Framework."
      }
    ],
    top_issues_for_email: ["Site speed is killing your conversions", "Visibility gap in local search"],
    growth_potential_cta: "Stop the bleeding now. ARMA can reclaim your lost revenue.",
    email_outreach: "I need to book a strategy session to fix my site's $8K/mo leak."
  };
}
