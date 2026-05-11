import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateAuditReport } from "@/lib/claude";
import { generatePdf } from "@/lib/pdf-generator";

/**
 * POST /api/generate-report
 * 
 * THE ULTIMATE API FLOW:
 * 1. URL Input → Fetch All Data (Live)
 * 2. Analyze → Narrative Generation (Claude)
 * 3. Render → Magazine Style PDF (Puppeteer)
 * 4. Output → DIRECT PDF STREAM
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`[API] Processing Audit Request for: ${url}`);

    // STEP 1: FETCH DATA
    const rawData = await fetchWebsiteData(url);
    
    // STEP 2: GENERATE NARRATIVE
    const report = await generateAuditReport(url, rawData);

    // STEP 3: GENERATE PDF
    const pdfBuffer = await generatePdf(url, {
      ...report,
      client_name: rawData.metrics.local?.name || new URL(url).hostname,
      screenshot_url: rawData.metrics.screenshot_desktop,
      screenshot_mobile_url: rawData.metrics.screenshot_mobile
    });

    // STEP 4: RETURN PDF DIRECTLY
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ARMA_Strategic_Briefing_${new URL(url).hostname}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("[API Error] PDF Flow Failed:", error.message);
    return NextResponse.json({ 
      error: "Strategic Generation Failed", 
      details: error.message 
    }, { status: 500 });
  }
}
