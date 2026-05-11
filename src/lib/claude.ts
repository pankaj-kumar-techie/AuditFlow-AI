import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

/**
 * NICHE_ECONOMICS — LOCKED VALUES
 * These are REAL industry averages. Claude MUST use these for all math.
 */
const NICHE_ECONOMICS: Record<string, { ticket: number; conv: number; label: string }> = {
  plumbing:    { ticket: 700,   conv: 0.35, label: "plumbing" },
  roofing:     { ticket: 8000,  conv: 0.15, label: "roofing" },
  hvac:        { ticket: 5500,  conv: 0.25, label: "hvac" },
  dental:      { ticket: 3500,  conv: 0.20, label: "dental" },
  legal:       { ticket: 4500,  conv: 0.15, label: "legal" },
  electrical:  { ticket: 600,   conv: 0.30, label: "electrical" },
  landscaping: { ticket: 1200,  conv: 0.30, label: "landscaping" },
  remodeling:  { ticket: 15000, conv: 0.10, label: "remodeling" },
  default:     { ticket: 1200,  conv: 0.20, label: "home service" }
};

export async function generateAuditReport(url: string, rawData: any) {
  console.log(`[Claude] Generating Magazine-Style Strategic Audit for: ${url}`);

  const systemPrompt = `
You are a direct-response marketing analyst writing audit reports for home service businesses.

REVENUE MATH RULES (MANDATORY — NO EXCEPTIONS):
- Assume the business gets 300–600 LOCAL visitors/month (typical small local service co).
- Use the NICHE_ECONOMICS ticket sizes and conversion rates provided.
- Revenue Loss formula: (Visitors Lost) × (Conv Rate) × (Ticket Size)
- Example for plumbing: 300 visitors × 25% lost = 75 lost visitors × 35% conv × $700 = $18,375... NO. That is too high.
- Correct example: 300 visitors × 25% lost = 75 × 0.35 conv = ~26 leads × 0.30 close = ~8 jobs × $700 = $5,600/mo
- ALWAYS apply a 30% close rate ON TOP of conversion rate (visitors who call vs. actually book).
- Revenue loss ranges must be CONSERVATIVE: $2K–$8K/mo for plumbing. $5K–$15K for roofing.

OUTPUT RULES:
- Write 5 issues max (not 8–12). Keep it tight.
- Headline must be 3 lines ONLY. Short phrases — 3–5 words each line.
- Subheadline: max 20 words.
- Story per issue: max 30 words.
- impact_badge: a % like "-20%", "-35%", etc.
- fix_steps: max 2 steps per issue.
- whats_happening_paragraphs: max 2 sentences total.
- Tone: Alex Hormozi. Blunt. Short. Zero fluff.
- Return ONLY valid JSON. No markdown. No preamble.
`;

  const userPrompt = `
Analyze this business. Generate a compact, realistic Magazine-Style briefing.

URL: ${url}
DATA: ${JSON.stringify(rawData)}

NICHE_ECONOMICS: ${JSON.stringify(NICHE_ECONOMICS)}

OUTPUT JSON (ALL FIELDS REQUIRED):
{
  "brand_name": "ARMA",
  "report_id": "047",
  "headline_line1": "3-5 word hook",
  "headline_line2": "3-5 word subject",
  "headline_highlight": "3-5 word punchline",
  "subheadline": "Max 20 words about money left on table.",
  "numbers": {
    "visitors_lost": "e.g. 28%",
    "missed_jobs": "e.g. 6 jobs/mo",
    "revenue_loss": "e.g. $4,200–$6,800/mo",
    "issues_count": 5
  },
  "inside_items": [
    "5 problems ranked by revenue lost.",
    "Exact math shown for each issue.",
    "How you compare to the #1 competitor.",
    "Fixes you can do this week."
  ],
  "issues": [
    {
      "category": "PERFORMANCE",
      "title": "Short Title",
      "headline": "Punchy 4-word headline",
      "story": "Max 30 words. What is happening and why it costs them money.",
      "impact_badge": "-25%",
      "impact_headline": "One punchy sentence about the loss.",
      "impact_sub": "The math: e.g. 6 jobs gone × $700 = $4,200.",
      "whats_happening_paragraphs": ["Short sentence 1.", "Short sentence 2."],
      "fix_steps": [
        { "num": "01", "title": "Action title", "desc": "One sentence what to do." }
      ],
      "what_youll_get": "One sentence result.",
      "difficulty": "Easy",
      "time": "2h"
    }
  ],
  "cta": "Max 40 words. Hormozi-style close.",
  "client_name": "Business Name from data",
  "client_location": "City, ST from data",
  "total_pages": 7
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
    if (content.type !== "text") throw new Error("Non-text response from Claude");

    const text = content.text;
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON found in Claude response");

    const jsonStr = text.substring(jsonStart, jsonEnd);

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Attempt to auto-fix common JSON errors
      const cleaned = jsonStr
        .replace(/,\s*([\]}])/g, "$1")   // trailing commas
        .replace(/[\x00-\x1F\x7F]/g, " ") // control chars
        .replace(/\n/g, " ");
      return JSON.parse(cleaned);
    }
  } catch (error: any) {
    console.error("[Claude] Generation Failed:", error.message);
    throw new Error(`Strategic Analysis Failed: ${error.message}`);
  }
}
