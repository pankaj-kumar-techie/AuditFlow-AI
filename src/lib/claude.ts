import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function generateAuditReport(url: string, rawData: Record<string, unknown>) {
  console.log(`[Claude] Initiating Strategic Analysis for: ${url}`);

  const prompt = `
You are the Senior Growth Strategist at ARMA Agency. You are performing a human-style business audit for a local contractor.
This is NOT an SEO report. This is a CONVERSION audit designed to show a business owner exactly where they are losing money.

CORE LOGIC: Find Problems -> Show Real Customer/Revenue Loss -> Sell ARMA Strategic Fix.

RAW DATA:
${JSON.stringify(rawData, null, 2)}

TARGET URL: ${url}

STRICT INSTRUCTIONS:
- NO TECHNICAL JARGON (No meta, tags, backlinks).
- NO SPECIAL CHARACTERS like "—" or "•" in the descriptions.
- Every "Problem" must be tied to a specific "Monthly Revenue Leak" ($ amount).
- DO NOT give "hacks" or DIY fixes. Frame ARMA Agency as the only proprietary solution.
- TONE: Brutally honest, high-authority, and conversion-focused.

REPORT SECTIONS:
1. EXECUTIVE SUMMARY: High-impact consultant note.
2. ISSUES (8-10): Specific bottlenecks with $ job loss impact.
3. EMAIL OUTREACH: 
   - Context: This is a professional "Appointment Booking Request" from the visitor to ARMA Agency (contact@arma-agency.us).
   - Tone: Urgent, problem-led.
   - Logic: "I ran a scan on my site [URL]. It found a $X revenue leak due to [Bottleneck]. I need to book a strategy session with ARMA to reclaim this."

OUTPUT FORMAT (JSON):
{
  "executive_summary": "Consultant note (3-4 sentences)",
  "total_revenue_leak": "e.g. $15,000+/mo",
  "growth_potential_cta": "Why they need ARMA right now to stop the leak.",
  "issues": [
    {
      "title": "Clear Business Bottleneck",
      "problem": "Brutally honest description",
      "impact": "$ amount of jobs lost monthly",
      "recommendation": "The ARMA Strategic Solution",
      "severity": "high"
    }
  ],
  "email_outreach": "Human-style appointment request template for the visitor."
}
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5", 
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleaned = jsonMatch[0].replace(/[—•]/g, " - ");
        return JSON.parse(cleaned);
      }
      throw new Error("Invalid output format");
    }
    throw new Error("Invalid response type");
  } catch (error: any) {
    console.error("[Claude] API Error:", error.message);
    return getFallbackReport(url);
  }
}

function getFallbackReport(url: string) {
  return {
    executive_summary: "Strategic intelligence offline. Please verify your Anthropic API credits and ensure your billing is active.",
    total_revenue_leak: "$15,000+",
    growth_potential_cta: "Your competitors are capturing your jobs. ARMA can fix this.",
    issues: [
      {
        title: "Revenue Connection Interrupted",
        problem: "The strategic analysis engine is offline. We cannot accurately map your $15,000+ monthly revenue leak right now.",
        impact: "Critical jobs lost daily.",
        recommendation: "Book a manual audit with ARMA Agency immediately.",
        severity: "high"
      }
    ],
    email_outreach: "Hi ARMA Agency,\n\nI just ran a Revenue-Scan on my site and it's identified significant bottlenecks. I'd like to book a strategic consultation to fix these leaks and reclaim my market position.\n\nBest,\n[Name]"
  };
}
