import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { AuditReport } from "@/types";

export async function generatePdf(url: string, report: AuditReport) {
  let browser;

  try {
    const isProd = process.env.NODE_ENV === "production";

    // Dynamic Browser Path Discovery
    let executablePath = isProd ? await (chromium as any).executablePath() : undefined;
    if (!isProd) {
      const paths = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/snap/bin/chromium",
        "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ];
      const fs = require("fs");
      executablePath = paths.find((p) => fs.existsSync(p));
    }

    browser = await puppeteer.launch({
      args: isProd
        ? (chromium as any).args
        : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: { width: 1200, height: 1600 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;700;800;900&family=Space+Mono:wght@400;700&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', sans-serif;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ─── SHARED PAGE SHELL ─────────────────────────────── */
          .mag-page {
            width: 794px;           /* A4 at 96dpi */
            min-height: 1123px;
            padding: 0;
            background: #fff;
            position: relative;
            page-break-after: always;
            display: flex;
            flex-direction: column;
          }

          /* ─── TOP HEADER BAR (black strip) ─────────────────── */
          .top-bar {
            background: #000;
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 36px;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          /* ─── CONTENT AREA ──────────────────────────────────── */
          .page-body {
            padding: 32px 36px 28px 36px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          /* ─── EYEBROW ROW (under header) ────────────────────── */
          .eyebrow-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;
          }
          .eyebrow-label {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #D0202E;
          }
          .eyebrow-right {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #000;
          }
          .eyebrow-divider {
            border: none;
            border-top: 2px solid #000;
            margin: 8px 0 28px 0;
          }

          /* ─── PAGE 1: HERO HEADLINE ─────────────────────────── */
          .hero-headline {
            font-family: 'Inter', sans-serif;
            font-size: 72px;
            font-weight: 900;
            line-height: 1.0;
            letter-spacing: -0.02em;
            margin-bottom: 0;
            color: #000;
          }
          .hero-headline .highlight {
            display: inline;
            background: #F5C518;
            color: #000;
            padding: 0 6px 4px 2px;
            line-height: 1.05;
          }
          .hero-subtext {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 15px;
            line-height: 1.4;
            color: #000;
            margin: 10px 0 14px 0;
          }

          /* ─── PAGE 1: STATS TWO-COL ─────────────────────────── */
          .stats-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 24px;
            border-top: 1.5px solid #000;
            padding-top: 12px;
            margin-top: 4px;
          }
          .stats-col-label {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .stat-line {
            display: flex;
            align-items: baseline;
            gap: 7px;
            margin-bottom: 5px;
            flex-wrap: nowrap;
            white-space: nowrap;
          }
          .stat-number {
            font-family: 'Inter', sans-serif;
            font-size: 22px;
            font-weight: 900;
            line-height: 1;
            color: #D0202E;
            flex-shrink: 0;
          }
          .stat-number.black { color: #000; }
          .stat-desc {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 11px;
            color: #000;
            white-space: nowrap;
          }

          .inside-list {
            list-style: none;
            padding: 0;
          }
          .inside-list li {
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 6px;
            color: #000;
          }

          /* ─── PAGE 1: FOOTER ────────────────────────────────── */
          .page-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #ccc;
            padding: 14px 36px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #000;
          }

          /* ─── PAGE 2: STORY PAGE ────────────────────────────── */
          .story-label-row {
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 6px;
          }
          .story-label {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #D0202E;
          }
          .story-sublabel {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #000;
          }

          .story-headline {
            font-family: 'Inter', sans-serif;
            font-size: 64px;
            font-weight: 900;
            line-height: 1.0;
            letter-spacing: -0.02em;
            margin: 4px 0 12px 0;
          }
          .story-subtext {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 19px;
            line-height: 1.5;
            margin-bottom: 24px;
          }

          /* ─── IMPACT BOX ────────────────────────────────────── */
          .impact-box {
            display: flex;
            align-items: stretch;
            border: 1.5px solid #000;
            margin-bottom: 30px;
          }
          .impact-badge {
            background: #F5C518;
            color: #000;
            font-family: 'Inter', sans-serif;
            font-size: 38px;
            font-weight: 900;
            padding: 18px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 110px;
            letter-spacing: -0.02em;
            line-height: 1;
          }
          .impact-content {
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .impact-headline {
            font-size: 16px;
            font-weight: 800;
            line-height: 1.3;
            margin-bottom: 4px;
          }
          .impact-sub {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 13px;
            color: #333;
          }

          /* ─── TWO-COL DETAIL SECTION ────────────────────────── */
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 40px;
            flex: 1;
          }
          .detail-col-label {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 14px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
          }
          .detail-body {
            font-size: 14px;
            line-height: 1.6;
            color: #000;
          }
          .detail-body p { margin-bottom: 14px; }

          /* fix steps */
          .fix-step {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
            align-items: flex-start;
          }
          .fix-num {
            font-size: 22px;
            font-weight: 900;
            color: #D0202E;
            line-height: 1;
            min-width: 28px;
          }
          .fix-text .fix-title {
            font-size: 14px;
            font-weight: 800;
            margin-bottom: 2px;
          }
          .fix-text .fix-desc {
            font-size: 13px;
            color: #333;
            line-height: 1.5;
          }

          /* ─── YELLOW BOTTOM BAR ─────────────────────────────── */
          .yellow-bar {
            background: #F5C518;
            padding: 16px 36px;
            margin-top: auto;
          }
          .yellow-bar-label {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .yellow-bar-body {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .yellow-bar-meta {
            font-size: 11px;
            color: #333;
          }

          /* ─── PAGE 3: CTA (RED) ──────────────────────────────── */
          .cta-page {
            background: #D0202E;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 80px 60px;
            min-height: 1123px;
          }
          .cta-headline {
            font-family: 'Inter', sans-serif;
            font-size: 80px;
            font-weight: 900;
            line-height: 1.0;
            letter-spacing: -0.03em;
            margin-bottom: 36px;
          }
          .cta-body {
            font-size: 22px;
            line-height: 1.6;
            max-width: 560px;
            margin-bottom: 52px;
            font-weight: 400;
          }
          .cta-btn {
            background: #fff;
            color: #D0202E;
            padding: 22px 72px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            border-radius: 3px;
          }

        </style>
      </head>
      <body>

        <!-- ══════════════════════════════════════════════════════
             PAGE 1 — THE BRIEFING
        ══════════════════════════════════════════════════════════ -->
        <div class="mag-page">

          <!-- Black top bar -->
          <div class="top-bar">
            <span>${(report.brand_name || 'ARMA').toUpperCase()} · WEBSITE REPORT · ISSUE ${report.report_id || '001'}</span>
            <span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
          </div>

          <div class="page-body">

            <!-- Eyebrow -->
            <div class="eyebrow-row">
              <span class="eyebrow-label">Exclusive Briefing</span>
              <span class="eyebrow-right">FOR ${(report.client_name || 'VALUED CLIENT').toUpperCase()} — ${(report.client_location || '').toUpperCase()}</span>
            </div>
            <hr class="eyebrow-divider" />

            <!-- Hero Headline -->
            <div class="hero-headline">
              ${report.headline_line1 || 'Mike,'}<br>
              ${report.headline_line2 || 'your website'}<br>
              ${report.headline_line3 || 'is bleeding'}<br>
              <span class="highlight">${report.headline_highlight || report.numbers.visitors_lost + ' of customers.'}</span>
            </div>

            <!-- Sub text -->
            <div class="hero-subtext">
              ${report.subheadline}
            </div>

            <!-- Two-col stats + inside-report -->
            <div class="stats-section">
              <div>
                <div class="stats-col-label">By the Numbers</div>
                <div class="stat-line">
                  <span class="stat-number">${report.numbers.visitors_lost}</span>
                  <span class="stat-desc">visitors lost</span>
                </div>
                <div class="stat-line">
                  <span class="stat-number black">${report.numbers.missed_jobs}</span>
                  <span class="stat-desc">missed jobs/month</span>
                </div>
                <div class="stat-line">
                  <span class="stat-number">${report.numbers.revenue_loss}</span>
                  <span class="stat-desc">monthly revenue gap</span>
                </div>
                <div class="stat-line">
                  <span class="stat-number black">${report.numbers.issues_count || report.issues.length}</span>
                  <span class="stat-desc">fixable problems</span>
                </div>
              </div>
              <div>
                <div class="stats-col-label">Inside This Report</div>
                <ul class="inside-list">
                  ${(report.inside_items || [
        `The ${report.issues.length} problems on your site, ranked by what they're costing you.`,
        'Exact % of customers each problem is losing — with the math shown.',
        `How you stack up against the top competitors in ${report.client_location || 'your area'}.`,
        'Step-by-step fixes. Most can be done in an afternoon.'
      ]).map((item: string) => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Screenshots -->
            <div style="display:grid;grid-template-columns:1fr 0.38fr;gap:12px;margin-top:16px;">
              <div>
                <div style="font-size:8px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#666;margin-bottom:4px;">Desktop View</div>
                <div style="border:1px solid #ddd;border-radius:4px;overflow:hidden;background:#f5f5f5;height:190px;">
                  ${report.screenshot_url
                    ? `<img src="${report.screenshot_url}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;" />`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#ccc;font-weight:600;letter-spacing:0.05em;">DESKTOP SCREENSHOT</div>`}
                </div>
              </div>
              <div>
                <div style="font-size:8px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#666;margin-bottom:4px;">Mobile View</div>
                <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#f5f5f5;height:240px;">
                  ${report.screenshot_mobile_url
                    ? `<img src="${report.screenshot_mobile_url}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;" />`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#ccc;font-weight:600;letter-spacing:0.05em;">MOBILE</div>`}
                </div>
              </div>
            </div>

          </div><!-- /page-body -->

          <!-- Footer -->
          <div class="page-footer">
            <span>PREPARED FOR&nbsp;&nbsp;${(report.client_name || 'VALUED CLIENT').toUpperCase()}</span>
            <span>${(report.client_location || '').toUpperCase()}</span>
            <span>PAGE 1 OF ${report.total_pages || (report.issues.length + 2)}</span>
          </div>

        </div><!-- /page 1 -->


        <!-- ══════════════════════════════════════════════════════
             PAGES 2–N — ONE ISSUE PER PAGE
        ══════════════════════════════════════════════════════════ -->
        ${report.issues.map((issue: any, idx: number) => `
        <div class="mag-page" style="page-break-before: always;">

          <!-- Black top bar -->
          <div class="top-bar">
            <span>${(report.brand_name || 'ARMA').toUpperCase()} · PROBLEM ${idx + 1} OF ${report.issues.length}</span>
            <span>${(issue.category || 'PERFORMANCE').toUpperCase()}</span>
          </div>

          <div class="page-body">

            <!-- Story label + divider -->
            <div class="story-label-row">
              <span class="story-label">STORY ${String(idx + 1).padStart(2, '0')}</span>
              <span class="story-sublabel">${issue.title}</span>
            </div>
            <hr class="eyebrow-divider" />

            <!-- Story headline -->
            <div class="story-headline">${issue.headline || issue.title}</div>
            <div class="story-subtext">${issue.story}</div>

            <!-- Impact box -->
            <div class="impact-box">
              <div class="impact-badge">${issue.impact_badge || issue.impact_pct || '-' + (idx === 0 ? '25%' : '?')}</div>
              <div class="impact-content">
                <div class="impact-headline">${issue.impact_headline || issue.impact}</div>
                <div class="impact-sub">${issue.impact_sub || issue.result}</div>
              </div>
            </div>

            <!-- Two-col: What's Happening + How to Fix It -->
            <div class="detail-grid">
              <div>
                <div class="detail-col-label">What's Happening</div>
                <div class="detail-body">
                  ${(issue.whats_happening_paragraphs || [issue.impact]).map((p: string) => `<p>${p}</p>`).join('')}
                </div>
              </div>
              <div>
                <div class="detail-col-label">How to Fix It</div>
                ${(issue.fix_steps || [{ num: '01', title: 'Fix it', desc: issue.fix }]).map((step: any) => `
                  <div class="fix-step">
                    <div class="fix-num">${step.num}</div>
                    <div class="fix-text">
                      <div class="fix-title">${step.title}</div>
                      <div class="fix-desc">${step.desc}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div><!-- /page-body -->

          <!-- Yellow bottom bar -->
          <div class="yellow-bar">
            <div class="yellow-bar-label">What You'll Get</div>
            <div class="yellow-bar-body">${issue.what_youll_get || issue.result}</div>
            ${issue.difficulty ? `<div class="yellow-bar-meta">Time: ${issue.time || '?'} · Difficulty: ${issue.difficulty}</div>` : ''}
          </div>

          <!-- Footer -->
          <div class="page-footer">
            <span>PREPARED FOR&nbsp;&nbsp;${(report.client_name || 'VALUED CLIENT').toUpperCase()}</span>
            <span>${(report.client_location || '').toUpperCase()}</span>
            <span>PAGE ${idx + 2} OF ${report.total_pages || (report.issues.length + 2)}</span>
          </div>

        </div>
        `).join('')}


        <!-- ══════════════════════════════════════════════════════
             LAST PAGE — CALL TO ACTION (RED)
        ══════════════════════════════════════════════════════════ -->
        <div class="cta-page" style="page-break-before: always;">
          <div class="cta-headline">TIME TO<br/>STOP THE<br/>BLEEDING.</div>
          <div class="cta-body">${report.cta}</div>
          <div class="cta-btn">Book Your Free Consult</div>
        </div>

      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      displayHeaderFooter: false,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("[PDF] Generation Error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}