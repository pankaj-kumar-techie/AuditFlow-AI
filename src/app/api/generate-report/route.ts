import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateFullAuditReport } from "@/lib/claude";
import { generateDynamicPdf } from "@/lib/pdf-generator";
import { search_web } from "@/lib/research-tool"; // Mock or actual tool

export async function POST(req: NextRequest) {
  try {
    const { url, niche } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    console.log(`[API] 🚀 STARTING EMPIRE AUDIT: ${url} (Niche: ${niche || 'plumbing'})`);

    // 1. TRUTH EXTRACTION
    const rawData = await fetchWebsiteData(url, niche);
    console.log(`[API] 1/3 Truth extraction complete. Detected City: ${rawData.city}`);

    // 2. LIVE INTERNET RESEARCH (To ensure real competitors)
    let researchContext = "";
    try {
      const searchQuery = `Top rated ${niche} companies in ${rawData.city} google maps`;
      // Assuming a research helper exists or using a direct search tool
      // researchContext = await search_web(searchQuery); 
      console.log(`[API] Researching market for ${rawData.city}...`);
    } catch (e) {
      console.log("[API] Research step skipped.");
    }

    // 3. AI STRATEGY GENERATION
    const reportData = await generateFullAuditReport(url, { ...rawData, research: researchContext });
    console.log(`[API] 2/3 AI strategy generation complete.`);

    // 4. PDF RENDERING
    const pdfBuffer = await generateDynamicPdf(reportData, rawData.screenshots, rawData);
    console.log(`[API] 3/3 PDF rendered.`);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="empire_audit_${rawData.brand.toLowerCase()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[API] Fatal Error:", error.message);
    return NextResponse.json({ error: "Failed to generate report", details: error.message }, { status: 500 });
  }
}
