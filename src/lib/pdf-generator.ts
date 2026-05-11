import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { AuditReport } from "@/types";

export async function generatePdf(url: string, report: AuditReport) {
  let browser;

  try {
    const isProd = process.env.NODE_ENV === "production";
    
    browser = await puppeteer.launch({
      args: isProd ? (chromium as any).args : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: isProd ? await (chromium as any).executablePath() : "/usr/bin/google-chrome",
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1800 });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Bebas+Neue&family=Space+Mono&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0; 
            margin: 0; 
            color: #fff; 
            background: #000;
            line-height: 1.1;
            -webkit-print-color-adjust: exact;
          }
          
          .page {
            padding: 80px;
            min-height: 100vh;
            background: #000;
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .footer-info {
            margin-top: auto;
            border-top: 1px solid #333;
            padding-top: 20px;
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #666;
            display: flex;
            justify-content: space-between;
          }

          .brand-header {
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            color: #D0202E;
            letter-spacing: 4px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
          }

          h1 { 
            font-family: 'Bebas Neue', cursive;
            font-size: 120px; 
            color: #fff;
            margin: 40px 0; 
            line-height: 0.8;
            text-transform: uppercase;
            letter-spacing: -4px;
          }

          .exclusive-tag {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #666;
            margin-bottom: 10px;
          }

          .hero-text {
            font-size: 42px;
            font-weight: 800;
            color: #fff;
            line-height: 1.1;
            max-width: 80%;
          }
          
          .hero-text span { color: #D0202E; }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
            background: #333;
            margin: 60px 0;
            border: 1px solid #333;
          }

          .stat-box {
            background: #000;
            padding: 40px 20px;
            text-align: center;
          }

          .stat-label { font-size: 9px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: block; }
          .stat-value { font-family: 'Bebas Neue', cursive; font-size: 50px; color: #D0202E; }

          .toc-section {
            margin-top: 40px;
          }

          .toc-item {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            font-size: 14px;
            color: #999;
          }

          .toc-num { color: #D0202E; font-weight: 900; }

          /* STORY PAGE STYLES */
          .story-label { font-family: 'Bebas Neue', cursive; font-size: 40px; color: #D0202E; margin-bottom: 10px; }
          .story-title { font-family: 'Bebas Neue', cursive; font-size: 80px; line-height: 0.8; margin-bottom: 40px; }

          .story-hero { font-size: 48px; font-weight: 800; margin-bottom: 30px; }
          .story-hero span { color: #D0202E; }

          .story-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; margin-top: 40px; }
          
          .story-block h3 { font-size: 10px; font-weight: 900; color: #D0202E; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
          .story-block p { font-size: 16px; color: #ccc; line-height: 1.6; margin-bottom: 20px; }

          .impact-box {
            background: #D0202E;
            padding: 40px;
            border-radius: 4px;
          }
          .impact-value { font-family: 'Bebas Neue', cursive; font-size: 60px; margin-bottom: 10px; }
          .impact-text { font-size: 14px; font-weight: 700; line-height: 1.4; opacity: 0.9; }

          .fix-step { margin-bottom: 30px; }
          .fix-num { color: #D0202E; font-weight: 900; font-size: 14px; margin-right: 10px; }
          .fix-title { font-weight: 800; font-size: 16px; margin-bottom: 10px; }
          .fix-desc { font-size: 14px; color: #999; }

        </style>
      </head>
      <body>
        <!-- PAGE 1: THE BRIEFING -->
        <div class="page">
          <div class="brand-header">
            <span>ARMA AGENCY · WEBSITE REPORT · ISSUE 047</span>
            <span>MAY 10, 2026</span>
          </div>

          <div class="exclusive-tag">EXCLUSIVE BRIEFING FOR ${report.client_name.toUpperCase()} — ${report.client_location.toUpperCase()}</div>

          <h1>YOUR WEBSITE<br/>IS BLEEDING.</h1>

          <div class="hero-text">
            ${report.hero_message.replace(report.by_the_numbers.visitors_lost_percent, `<span>${report.by_the_numbers.visitors_lost_percent}</span>`).replace(report.by_the_numbers.missed_jobs_monthly, `<span>${report.by_the_numbers.missed_jobs_monthly} jobs</span>`)}
            <br/><br/>
            Here's exactly why — and what to do about it.
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Problems Found</span>
              <div class="stat-value">${report.summary.total_issues}</div>
            </div>
            <div class="stat-box">
              <span class="stat-label">Missed Jobs/mo</span>
              <div class="stat-value">${report.by_the_numbers.missed_jobs_monthly}</div>
            </div>
            <div class="stat-box">
              <span class="stat-label">Growth Potential</span>
              <div class="stat-value" style="font-size: 35px;">${report.summary.growth_potential_range}</div>
            </div>
          </div>

          <div class="toc-section">
            <div class="toc-item">
              <span class="toc-num">01</span>
              <div>The ${report.summary.total_issues} problems on your site ranked by what they're costing you.</div>
            </div>
            <div class="toc-item">
              <span class="toc-num">02</span>
              <div>Exact % of customers each problem is losing — with the math shown.</div>
            </div>
            <div class="toc-item">
              <span class="toc-num">03</span>
              <div>How you stack up against ${report.speed_story.competitor_name} and other top players in ${report.client_location}.</div>
            </div>
          </div>

          <div class="footer-info">
            <span>PREPARED FOR ${report.client_name.toUpperCase()} ${report.client_location.toUpperCase()}</span>
            <span>PAGE 1 OF 3</span>
          </div>
        </div>

        <!-- PAGE 2: THE SPEED STORY -->
        <div class="page" style="page-break-before: always;">
          <div class="brand-header">
            <span>ARMA AGENCY · PROBLEM 1 OF ${report.summary.total_issues}</span>
            <span>PERFORMANCE</span>
          </div>

          <div class="story-label">STORY 01</div>
          <div class="story-title">SPEED</div>

          <div class="story-hero">${report.speed_story.load_time}.<br/><span>That's how long your site makes a customer wait.</span></div>

          <div class="story-grid">
            <div class="story-block">
              <h3>What's Happening</h3>
              <p>When someone clicks your site from a Google search, they wait <span>${report.speed_story.load_time}</span> before anything appears.</p>
              <p>Google's own research is brutal: 53% of visitors leave a page that takes more than 3 seconds to load on a phone.</p>
              <p><span>${report.speed_story.competitor_name}</span> — currently one of your top competitors — has a site that loads in <span>${report.speed_story.competitor_speed}</span>.</p>

              <h3>How to Fix It</h3>
              <div class="fix-step">
                <span class="fix-num">01</span>
                <span class="fix-title">Compress Assets</span>
                <div class="fix-desc">Your images are bloated. One pass through a compressor would save 60% of your load time.</div>
              </div>
              <div class="fix-step">
                <span class="fix-num">02</span>
                <span class="fix-title">Proprietary Framework</span>
                <div class="fix-desc">Implement the ARMA Strategic hydration layer to ensure instant-load for mobile users.</div>
              </div>
            </div>

            <div>
              <div class="impact-box">
                <div class="impact-value">${report.speed_story.bounce_impact}</div>
                <div class="impact-text">BOUNCE RATE IMPACT</div>
                <div class="impact-math" style="margin-top:20px;">${report.speed_story.math_breakdown}</div>
              </div>
              
              <div style="margin-top: 40px; padding: 20px; border: 1px solid #333;">
                <span class="stat-label">Outcome</span>
                <div style="font-size: 18px; font-weight: 800; color: #fff;">Load time goes from ${report.speed_story.load_time} to under 2s. Phone calls up roughly 20-30%.</div>
              </div>
            </div>
          </div>

          <div class="footer-info">
            <span>PREPARED FOR ${report.client_name.toUpperCase()} ${report.client_location.toUpperCase()}</span>
            <span>PAGE 2 OF 3</span>
          </div>
        </div>

        <!-- PAGE 3: THE BATTLEPLAN -->
        <div class="page" style="page-break-before: always;">
          <div class="brand-header">
            <span>ARMA AGENCY · STRATEGIC BATTLEPLAN</span>
            <span>RECLAIM REVENUE</span>
          </div>

          <div class="story-label">FINAL BRIEFING</div>
          <div class="story-title">THE ACTION PLAN</div>

          <div style="margin: 40px 0;">
            ${report.issues.slice(0, 3).map((issue: any, i: number) => `
              <div style="display: flex; gap: 40px; margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 40px;">
                <div style="font-family: 'Bebas Neue'; font-size: 60px; color: #D0202E; line-height: 1;">0${i+2}</div>
                <div style="flex: 1;">
                  <div style="font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">${issue.title}</div>
                  <p style="color: #999; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${issue.problem}</p>
                  <div style="display: flex; gap: 40px;">
                    <div style="background: #111; padding: 15px; flex: 1;">
                      <span class="stat-label">Fix</span>
                      <div style="font-size: 14px; font-weight: 700;">${issue.recommendation}</div>
                    </div>
                    <div style="background: rgba(208,32,46,0.1); padding: 15px; flex: 1;">
                      <span class="stat-label">Impact</span>
                      <div style="font-size: 14px; font-weight: 900; color: #D0202E;">${issue.impact_range}</div>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="background: #D0202E; padding: 60px; text-align: center; border-radius: 4px; margin-top: auto;">
             <div style="font-family: 'Bebas Neue'; font-size: 70px; line-height: 0.8; margin-bottom: 20px;">STOP THE BLEEDING.</div>
             <p style="font-size: 18px; font-weight: 800; margin-bottom: 30px;">${report.growth_potential_cta}</p>
             <div style="background: #fff; color: #D0202E; display: inline-block; padding: 20px 60px; font-weight: 900; text-transform: uppercase; font-size: 18px;">Book Strategic Consult</div>
          </div>

          <div class="footer-info">
            <span>PREPARED FOR ${report.client_name.toUpperCase()} ${report.client_location.toUpperCase()}</span>
            <span>PAGE 3 OF 3</span>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    const pdfBuffer = await page.pdf({ 
      format: "A4",
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      displayHeaderFooter: false
    });

    return pdfBuffer;
  } catch (error) {
    console.error("[PDF] Generation Error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
