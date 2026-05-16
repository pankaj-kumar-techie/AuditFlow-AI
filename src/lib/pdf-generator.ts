import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";

export async function generateDynamicPdf(report: any, screenshots: any, leadData: any) {
  const isProd = process.env.NODE_ENV === "production";
  const execPath = isProd
    ? await (chromium as any).executablePath()
    : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/snap/bin/chromium"].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    args: isProd ? (chromium as any).args : ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: execPath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const stats = report.numbers;
    const competitor = leadData.competitor || { name: "No Direct Rivals Found", rank: "Top 3" };
    const totalPages = (report.page5?.other_issues || []).length > 0 ? 6 : 5;

    const html = `
<!DOCTYPE html><html><head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,700&family=Inter:wght@400;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 0; color: #000; }
    .page { width: 794px; height: 1123px; overflow: hidden; display: flex; flex-direction: column; background: #fff; page-break-after: always; position: relative; border: 15px solid #fff; }
    .content-frame { border: 1px solid #000; flex: 1; display: flex; flex-direction: column; }
    .top-bar { background: #000; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 12px 30px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    .body { flex: 1; padding: 40px 45px; display: flex; flex-direction: column; }
    .footer { border-top: 1px solid #000; padding: 12px 30px; display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    
    .hero-hl { font-family: 'Playfair Display', serif; font-weight: 900; font-size: 58px; line-height: 0.9; letter-spacing: -0.04em; margin-bottom: 20px; }
    .kicker { font-size: 11px; font-weight: 900; color: #D0202E; text-transform: uppercase; margin-bottom: 10px; }

    /* CTA CARDS */
    .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
    .cta-card { border: 1px solid #ddd; padding: 35px; border-radius: 4px; display: flex; flex-direction: column; }
    .cta-card.featured { border: 3px solid #F5C518; background: #fffdf5; position: relative; }
    .cta-card.featured::after { content: 'RECOMMENDED'; position: absolute; top: -12px; left: 20px; background: #F5C518; color: #000; font-size: 10px; font-weight: 900; padding: 4px 12px; }
    .card-title { font-weight: 900; font-size: 24px; margin-bottom: 15px; }
    .card-btn { background: #000; color: #fff; text-align: center; padding: 18px; font-weight: 900; text-transform: uppercase; margin-top: auto; font-size: 14px; letter-spacing: 1px; }
    .card-btn.gold { background: #F5C518; color: #000; }
  </style>
</head><body>
  <!-- PAGE 1: COVER -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>ARMA STRATEGIC AUDIT</span><span>${date}</span></div>
    <div class="body">
      <div class="kicker">Confidential Briefing · ${leadData.brand}</div>
      <div class="hero-hl">${report.page1.headline}</div>
      <div style="font-family:'Playfair Display',serif; font-style:italic; font-size:20px; color:#333;">${report.page1.subheadline}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; border-top:5px solid #000; padding-top:30px;">
        <div>
          <div style="font-size:12px;font-weight:900;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:20px;">By The Numbers</div>
          <div style="margin-bottom:30px;"><div style="font-size:40px;font-weight:900;color:#D0202E;">$${stats.total_loss.toLocaleString()}</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;">conservative monthly revenue gap</div></div>
          <div style="margin-bottom:30px;"><div style="font-size:40px;font-weight:900;color:#D0202E;">${stats.missed_jobs}</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;">jobs missed every month in ${leadData.city}</div></div>
          <div><div style="font-size:40px;font-weight:900;">${stats.total_loss_pct}%</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;">infrastructure conversion gap</div></div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:900;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:20px;">Infrastructure Audit</div>
          <div style="margin-bottom:20px; font-size:14px; font-weight:800; border-bottom:1px solid #eee; padding-bottom:8px;">01 STEP 1: Discovery Visibility</div>
          <div style="margin-bottom:20px; font-size:14px; font-weight:800; border-bottom:1px solid #eee; padding-bottom:8px;">02 STEP 2: Lead Capture Mechanics</div>
          <div style="margin-bottom:20px; font-size:14px; font-weight:800; border-bottom:1px solid #eee; padding-bottom:8px;">03 STEP 3: Authority & Trust Signals</div>
          <div style="margin-bottom:20px; font-size:14px; font-weight:800; border-bottom:1px solid #eee; padding-bottom:8px;">04 NEXT MOVE: Position Recovery</div>
        </div>
      </div>
    </div>
    <div class="footer"><span>PREPARED FOR ${leadData.brand} · ${leadData.city}</span><span>PAGE 1 OF ${totalPages}</span></div>
  </div></div>

  <!-- PAGE 6: CTA CARDS -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>YOUR NEXT MOVE</span><span>STRATEGIC OPTIONS</span></div>
    <div class="body">
      <div class="kicker">Next Move</div>
      <div class="hero-hl">STOP THE<br><span style="background:#F5C518;padding:0 8px;">LEAKAGE.</span></div>
      <div class="cta-grid">
        <div class="cta-card">
          <div class="card-title">Fix It Yourself</div>
          <p style="font-size:14px; color:#555; line-height:1.6; margin-bottom:20px;">Use the audit data above to work with your current team. Total site optimization typically takes 15–20 hours of dev time.</p>
          <div style="font-size:12px; font-weight:900; margin-bottom:10px;">PROS: Low immediate cost.</div>
          <div style="font-size:12px; font-weight:900; margin-bottom:10px;">CONS: High risk of technical error.</div>
          <div class="card-btn">Download Checklists</div>
        </div>
        <div class="cta-card featured">
          <div class="card-title">The Strategic Path</div>
          <p style="font-size:14px; color:#555; line-height:1.6; margin-bottom:20px;">Book a 20-min strategy session. We walk through the math and show you exactly how to overtake ${competitor.name}.</p>
          <div style="font-size:12px; font-weight:900; margin-bottom:10px;">PROS: Expert implementation. Fast results.</div>
          <div style="font-size:12px; font-weight:900; margin-bottom:10px;">CONS: Only 3 slots available per month.</div>
          <div class="card-btn gold">Book Strategy Call →</div>
        </div>
      </div>
    </div>
    <div class="footer"><span>ARMA REVENUE SCAN</span><span>PAGE ${totalPages} OF ${totalPages}</span></div>
  </div></div>
</body></html>`;

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    return pdf;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}