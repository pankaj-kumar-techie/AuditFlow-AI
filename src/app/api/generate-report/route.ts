import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateFullAuditReport } from "@/lib/claude";
import { generateDynamicPdf } from "@/lib/pdf-generator";

// Helper for Robust Retry Logic
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, name, niche } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    console.log(`[API] 🚀 STARTING EMPIRE AUDIT: ${url} (Niche: ${niche || 'plumbing'})`);

    // 1. DATA EXTRACTION (TRUTH ENGINE)
    const rawData = await withRetry(() => fetchWebsiteData(url, "Toledo, OH")); // Default city for now
    console.log(`[API] 1/3 Truth extraction complete.`);

    // 2. STRATEGIC NARRATIVE (CLAUDE)
    const reportData = await withRetry(() => generateFullAuditReport(url, { ...rawData, vertical: niche || 'plumbing' }));
    console.log(`[API] 2/3 AI strategy generation complete.`);

    // 3. PDF RENDERING (PUPPETEER)
    const pdfBuffer = await generateDynamicPdf(reportData, rawData.screenshots, { ...rawData, lead_name: name });
    console.log(`[API] 3/3 PDF rendered.`);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ARMA_Audit_${url.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("[API] Fatal Error:", error.message);
    return NextResponse.json({ 
      error: "Failed to generate report", 
      details: error.message,
      status: "error" 
    }, { status: 500 });
  }
}
