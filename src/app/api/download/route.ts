import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteData } from "@/lib/data-sources";
import { generateAuditReport } from "@/lib/claude";
import { generatePdf } from "@/lib/pdf-generator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const rawData = await fetchWebsiteData(url);
    const report = await generateAuditReport(url, rawData);
    const pdfBuffer = await generatePdf(url, report);

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
