import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateAuditReport } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch real data (PageSpeed, DataForSEO Lab Keywords/SERP/Maps, Google Places V1)
    const rawData = await fetchWebsiteData(url);

    // 2. Generate Audit with Claude (Opus 4.5 Strategy)
    const report = await generateAuditReport(url, rawData);

    // 3. Merge raw metrics and assets
    const finalReport = {
      ...report,
      screenshot_url: rawData.metrics.screenshot_desktop,
      screenshot_mobile_url: rawData.metrics.screenshot_mobile,
      reviews: rawData.metrics.local?.reviews || [],
      // Ensure local_stats is ALWAYS populated with DataForSEO metrics even if Google Places fails
      local_stats: {
        name: rawData.metrics.local?.name || "Business Name Unknown",
        rating: rawData.metrics.local?.rating || 0,
        total_reviews: rawData.metrics.local?.total_reviews || 0,
        address: rawData.metrics.local?.address || "Address Not Verified",
        phone: rawData.metrics.local?.phone || "Phone Not Listed",
        website: rawData.metrics.local?.website || url,
        // These come from DataForSEO, they should not depend on rawData.metrics.local
        in_local_pack: rawData.metrics.seo?.in_local_pack || false,
        brand_rank: rawData.metrics.seo?.brand_rank || "Unranked",
      },
      metrics: {
        performance_score: rawData.metrics.performance?.score || 0,
        organic_traffic: rawData.metrics.seo?.organic_traffic || 0,
        organic_keywords_count: rawData.metrics.seo?.organic_keywords_count || 0,
        top_keywords: rawData.metrics.seo?.top_keywords || [],
        serp_visibility: rawData.metrics.seo?.serp_visibility || "LOW",
      },
      _sources: {
        google_pagespeed: !!rawData.metrics.performance,
        dataforseo_labs: !!rawData.metrics.seo?.top_keywords?.length,
        dataforseo_maps: !!rawData.metrics.seo?.in_local_pack,
        google_places: !!rawData.metrics.local,
        screenshot_desktop: !!rawData.metrics.screenshot_desktop,
        screenshot_mobile: !!rawData.metrics.screenshot_mobile,
        claude_analysis: !report.executive_summary.includes("Strategic intelligence offline"),
      }
    };

    return NextResponse.json({ report: finalReport });
  } catch (error) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: "Analysis failed. Verify your API credits and billing." }, { status: 500 });
  }
}
