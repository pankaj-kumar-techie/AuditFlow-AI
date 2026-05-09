import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateAuditReport } from "@/lib/claude";
import { generatePdf } from "@/lib/pdf-generator";
import { getCachedAudit } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Check if we have a cached report first (extremely fast)
    let finalReport = getCachedAudit(url);
    
    if (!finalReport) {
      console.log(`[PDF] Cache miss for ${url}, re-fetching...`);
      const rawData = await fetchWebsiteData(url);
      const report = await generateAuditReport(url, rawData);
      
      finalReport = {
        ...report,
        screenshot_url: rawData.metrics.screenshot_desktop,
        screenshot_mobile_url: rawData.metrics.screenshot_mobile,
        local_stats: {
          name: rawData.metrics.local?.name || "Business Name Unknown",
          rating: rawData.metrics.local?.rating || 0,
          total_reviews: rawData.metrics.local?.total_reviews || 0,
          in_local_pack: rawData.metrics.seo?.in_local_pack || false,
          brand_rank: rawData.metrics.seo?.brand_rank || "Unranked",
        },
        metrics: {
          performance_score: rawData.metrics.performance?.score || 0,
          organic_traffic: rawData.metrics.seo?.organic_traffic || 0,
          organic_keywords_count: rawData.metrics.seo?.organic_keywords_count || 0,
        }
      };
    }

    const pdfBuffer = await generatePdf(url, finalReport);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AuditFlow-Report-${new URL(url).hostname}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
