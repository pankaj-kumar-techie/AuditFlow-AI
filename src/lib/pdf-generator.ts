import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { AuditReport } from "@/types";

export async function generatePdf(url: string, report: AuditReport) {
  let browser;

  try {
    // Vercel / Production environment configuration
    const isProd = process.env.NODE_ENV === "production";
    
    browser = await puppeteer.launch({
      args: isProd ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: isProd ? chromium.defaultViewport : { width: 1200, height: 1600 },
      executablePath: isProd ? await chromium.executablePath() : "/usr/bin/google-chrome", // Update path for local dev if needed
      headless: isProd ? chromium.headless : true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Bebas+Neue&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0; 
            margin: 0; 
            color: #fff; 
            background: #000;
            line-height: 1.3;
          }
          
          .page {
            padding: 60px;
            min-height: 100vh;
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            background: #000;
          }

          .border-red { border-left: 8px solid #D0202E; }
          
          .header { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 20px;
          }
          
          .logo { height: 25px; width: auto; }

          .tag {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #D0202E;
            background: rgba(208,32,46,0.1);
            padding: 6px 12px;
            border-radius: 4px;
          }

          h1 { 
            font-family: 'Bebas Neue', cursive;
            font-size: 80px; 
            color: #fff;
            margin: 0; 
            line-height: 0.85;
            text-transform: uppercase;
            letter-spacing: -2px;
          }
          
          .domain { 
            color: #D0202E; 
            font-size: 24px; 
            font-weight: 700;
            margin: 20px 0 50px 0; 
            font-family: 'Bebas Neue', cursive;
            text-transform: uppercase;
          }

          .screenshot-container {
            display: grid;
            grid-template-columns: 2fr 1.2fr;
            gap: 20px;
            margin-bottom: 40px;
          }

          .screenshot-box {
            background: #111;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
          }

          .screenshot-box img {
            width: 100%;
            height: auto;
            display: block;
          }

          .screenshot-label {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            padding: 4px 8px;
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            color: #D0202E;
            border-radius: 4px;
          }
          
          .summary-card { 
            background: #0e121a; 
            padding: 40px; 
            border-radius: 30px; 
            border: 1px solid rgba(255,255,255,0.05);
          }
          
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
          }

          .stat-item {
            background: rgba(255,255,255,0.03);
            padding: 20px;
            border-radius: 20px;
            text-align: center;
          }

          .stat-label { font-size: 8px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: block; }
          .stat-value { font-family: 'Bebas Neue', cursive; font-size: 42px; color: #fff; line-height: 1; }
          .stat-value.red { color: #D0202E; }

          .section-title {
            font-family: 'Bebas Neue', cursive;
            font-size: 48px;
            color: #fff;
            text-transform: uppercase;
            margin: 50px 0 25px 0;
            line-height: 1;
          }

          .issue { 
            margin-bottom: 25px; 
            padding: 30px;
            background: #0e121a;
            border-radius: 25px;
            border: 1px solid rgba(255,255,255,0.05);
            page-break-inside: avoid;
          }
          
          .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }

          .issue-title { 
            font-family: 'Bebas Neue', cursive;
            font-size: 28px; 
            color: #fff; 
            text-transform: uppercase;
            margin: 0;
            line-height: 1;
          }

          .severity { font-size: 8px; font-weight: 900; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; background: #D0202E; }
          
          .issue-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
          }

          .point { margin-bottom: 15px; }
          .point-label { font-size: 7px; font-weight: 900; color: #D0202E; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; display: block; }
          .point-text { font-size: 11px; color: #ccc; }

          .impact-callout {
            background: rgba(208,32,46,0.05);
            border-left: 4px solid #D0202E;
            padding: 15px;
            border-radius: 0 12px 12px 0;
          }

          .impact-text { font-size: 12px; font-weight: 700; color: #fff; font-style: italic; }

          .cta-box {
            background: #D0202E;
            color: #fff;
            text-align: center;
            padding: 50px 40px;
            border-radius: 40px;
            margin-top: 40px;
          }

          .cta-headline { font-family: 'Bebas Neue', cursive; font-size: 52px; line-height: 0.9; margin-bottom: 20px; }
          .cta-btn { background: #fff; color: #D0202E; display: inline-block; padding: 15px 40px; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <img src="https://arma-agency.us/wp-content/uploads/2026/02/logo.webp" alt="ARMA" class="logo" />
            <div class="tag">Strategic Revenue Scan</div>
          </div>

          <h1>Stop Losing <br/>Your Jobs.</h1>
          <div class="domain">${new URL(url).hostname}</div>

          <div class="screenshot-container">
            <div class="screenshot-box">
              <div class="screenshot-label">Desktop View</div>
              ${report.screenshot_url ? `<img src="${report.screenshot_url}" />` : ''}
            </div>
            <div class="screenshot-box">
              <div class="screenshot-label">Mobile View</div>
              ${report.screenshot_mobile_url ? `<img src="${report.screenshot_mobile_url}" />` : ''}
            </div>
          </div>

          <div class="summary-card border-red">
            <span class="stat-label">Executive Diagnosis</span>
            <p style="font-size: 15px; font-weight: 700; margin: 15px 0 0 0;">${report.executive_summary}</p>
          </div>

          <div class="stat-grid">
             <div class="stat-item">
                <span class="stat-label">Monthly Revenue Leak</span>
                <div class="stat-value red">${report.total_revenue_leak}</div>
             </div>
             <div class="stat-item">
                <span class="stat-label">Organic Reach</span>
                <div class="stat-value">${report.metrics?.organic_traffic?.toLocaleString() || 0}</div>
             </div>
             <div class="stat-item">
                <span class="stat-label">Site Health</span>
                <div class="stat-value">${report.metrics?.performance_score || 0}%</div>
             </div>
          </div>
        </div>

        <div class="page" style="padding-top: 20px;">
          <h2 class="section-title">Critical Bottlenecks</h2>
          
          ${report.issues.slice(0, 6).map((issue: any, i: number) => `
            <div class="issue">
              <div class="issue-header">
                <h3 class="issue-title">0${i+1}. ${issue.title}</h3>
                <span class="severity">${issue.severity}</span>
              </div>
              <div class="issue-body">
                <div>
                  <div class="point">
                    <span class="point-label">Problem</span>
                    <div class="point-text">${issue.problem}</div>
                  </div>
                  <div class="point">
                    <span class="point-label">Strategic Resolution</span>
                    <div class="point-text" style="color: #fff; font-weight: 700;">${issue.recommendation}</div>
                  </div>
                </div>
                <div>
                  <div class="point impact-callout">
                    <span class="point-label">Direct Revenue Impact</span>
                    <div class="impact-text">"${issue.impact}"</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}

          <div class="cta-box">
            <div class="cta-headline">Recover Your Market <br/>Dominance.</div>
            <div style="font-size: 15px; font-weight: 700;">${report.growth_potential_cta}</div>
            <div class="cta-btn">Book Strategic Appointment</div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const pdfBuffer = await page.pdf({ 
      format: "A4",
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      printBackground: true,
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
