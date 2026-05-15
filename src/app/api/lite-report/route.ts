import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateLiteReport } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { url, city } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    console.log(`[Lite Report] Running outreach scan for: ${url} in ${city || 'Toledo, OH'}`);

    // 1. DATA EXTRACTION (Rankings + GBP only for speed)
    const rawData = await fetchWebsiteData(url, city);
    
    // 2. STRATEGIC LITE NARRATIVE + PERSISTENCE
    const liteReport = await generateLiteReport(url, rawData);

    return NextResponse.json(liteReport);
  } catch (error: any) {
    console.error("[Lite Report] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
