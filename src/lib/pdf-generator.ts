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
    
    // DATA PROTECTION LAYER
    const brand = leadData.brand || "Business Owner";
    const competitor = leadData.competitor || { name: "Market Leader", rank: 1, reviews: 100, rating: 4.8 };
    const stats = report.numbers || { total_loss: 0, missed_jobs: 0, total_loss_pct: 0 };
    
    const page3 = report.page3 || { headline: "Three Seconds. No Reason to Stay.", comparison_rows: [] };
    const page4 = report.page4 || { headline: "The Authority Gap", story: "", angle: "reviews", trust_fixes: [] };
    const page5 = report.page5 || { other_issues: [] };
    
    const hasOtherIssues = (page5.other_issues || []).length > 0;
    const totalPages = hasOtherIssues ? 6 : 5;

    const html = `
<!DOCTYPE html><html><head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,700&family=Inter:wght@400;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; color: #000; background: #fff; line-height: 1.15; }
    .page { width: 794px; height: 1123px; overflow: hidden; display: flex; flex-direction: column; background: #fff; page-break-after: always; position: relative; border: 15px solid #fff; }
    .content-frame { border: 1px solid #000; flex: 1; display: flex; flex-direction: column; }
    .top-bar { background: #000; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 12px 30px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    .body { flex: 1; padding: 40px 45px; display: flex; flex-direction: column; }
    .kicker { font-size: 11px; font-weight: 900; color: #D0202E; text-transform: uppercase; margin-bottom: 10px; }
    .hero-hl { font-family: 'Playfair Display', serif; font-weight: 900; font-size: 58px; line-height: 0.9; letter-spacing: -0.04em; margin-bottom: 20px; }
    .footer { border-top: 1px solid #000; padding: 12px 30px; display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; text-transform: uppercase; }

    /* TABLES & GRIDS */
    .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; border-top: 5px solid #000; padding-top: 25px; }
    .stat-val { font-size: 38px; font-weight: 900; color: #D0202E; line-height: 1; }
    .toc-row { display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 13px; font-weight: 800; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
    
    .comparison-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
    .comparison-table th { text-align: left; font-size: 10px; font-weight: 900; padding: 12px; border-bottom: 2px solid #000; }
    .comparison-table td { padding: 18px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    .loss { color: #D0202E; font-weight: 900; }
  </style>
</head><body>
  <!-- PAGE 1: COVER -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>ARMA STRATEGIC AUDIT</span><span>${date}</span></div>
    <div class="body">
      <div class="kicker">Confidential Briefing · ${brand}</div>
      <div class="hero-hl">${report.page1.headline}</div>
      <div style="font-family:'Playfair Display',serif; font-style:italic; font-size:20px; color:#333;">${report.page1.subheadline}</div>
      <div class="dashboard">
        <div>
          <div style="font-size:12px;font-weight:900;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:20px;">By The Numbers</div>
          <div style="margin-bottom:30px;"><div class="stat-val">$${stats.total_loss.toLocaleString()}</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;color:#444;">monthly revenue leakage</div></div>
          <div style="margin-bottom:30px;"><div class="stat-val">${stats.missed_jobs}</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;color:#444;">jobs missed every month</div></div>
          <div><div class="stat-val" style="color:#000;">${stats.total_loss_pct}%</div><div style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;color:#444;">total conversion gap</div></div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:900;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:20px;">Inside This Report</div>
          <div class="toc-row"><span><span style="color:#D0202E;margin-right:10px;">01</span> Discovery</span><span>P. 02</span></div>
          <div class="toc-row"><span><span style="color:#D0202E;margin-right:10px;">02</span> First Impression</span><span>P. 03</span></div>
          <div class="toc-row"><span><span style="color:#D0202E;margin-right:10px;">03</span> Authority Gap</span><span>P. 04</span></div>
          ${hasOtherIssues ? `<div class="toc-row"><span><span style="color:#D0202E;margin-right:10px;">04</span> Revenue Leaks</span><span>P. 05</span></div>` : ''}
          <div class="toc-row"><span><span style="color:#D0202E;margin-right:10px;">0${hasOtherIssues?5:4}</span> Next Move</span><span>P. 0${totalPages}</span></div>
        </div>
      </div>
    </div>
    <div class="footer"><span>STRICTLY CONFIDENTIAL</span><span>PAGE 1 OF ${totalPages}</span></div>
  </div></div>

  <!-- PAGE 2: DISCOVERY -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>STEP 1 · DISCOVERY</span><span>MAP PACK ANALYSIS</span></div>
    <div class="body">
      <div class="hero-hl">HIDDEN IN<br><span style="background:#000;color:#fff;padding:0 8px;">PLAIN SIGHT.</span></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:35px; margin-top:35px;">
        <div style="height:450px;border:1px solid #000;overflow:hidden;"><img src="${screenshots.mobile || ''}" style="width:100%; height:100%; object-fit:cover; object-position:top;"></div>
        <div>
          <div class="kicker">Visibility Report</div>
          <p style="font-size:15px; line-height:1.6; margin-bottom:25px;">You sit at #${leadData.lead_rank}. Your rival, <b>${competitor.name}</b>, holds #${competitor.rank}. This gap costs you ${stats.missed_jobs} jobs every month.</p>
          ${(report.page2.discovery_fixes || []).map((f:any)=>`
            <div style="display:flex; gap:12px; margin-bottom:20px;">
              <div style="font-size:22px; font-weight:900; color:#D0202E;">${f.num}</div>
              <div><div style="font-weight:900; font-size:14px;">${f.title}</div><div style="font-size:12px; color:#666;">${f.desc}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="footer"><span>ARMA REVENUE SCAN</span><span>PAGE 2 OF ${totalPages}</span></div>
  </div></div>

  <!-- PAGE 3: FIRST IMPRESSION -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>STEP 2 · FIRST IMPRESSION</span><span>VISUAL AUDIT</span></div>
    <div class="body">
      <div class="hero-hl">${page3.headline}</div>
      <table class="comparison-table">
        <thead><tr><th>Factor</th><th>Your Site</th><th>${competitor.name.toUpperCase()}</th></tr></thead>
        <tbody>
          ${(page3.comparison_rows || []).map((r:any)=>`
            <tr><td>${r.label}</td><td class="loss">${r.lead_val}</td><td style="font-weight:900;">${r.comp_val}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="footer"><span>ARMA REVENUE SCAN</span><span>PAGE 3 OF ${totalPages}</span></div>
  </div></div>

  <!-- PAGE 4: TRUST GAP -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>STEP 3 · TRUST</span><span>AUTHORITY GAP</span></div>
    <div class="body">
      <div class="hero-hl">${page4.headline}</div>
      <p style="font-family:'Playfair Display',serif; font-style:italic; font-size:20px; color:#333; margin:20px 0;">${page4.story}</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px;">
        <div style="background:#f9f9f9; padding:40px; text-align:center; border:1px solid #eee;">
          <div class="kicker">Lead</div>
          <div style="font-size:52px; font-weight:900; color:#D0202E;">${page4.angle === 'rating' ? leadData.lead_rating : leadData.lead_reviews}</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;color:#666;">${page4.angle === 'rating' ? 'stars' : 'reviews'}</div>
        </div>
        <div style="background:#000; color:#fff; padding:40px; text-align:center;">
          <div class="kicker" style="color:#F5C518;">${competitor.name}</div>
          <div style="font-size:52px; font-weight:900;">${page4.angle === 'rating' ? competitor.rating : competitor.reviews}</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;color:#ccc;">${page4.angle === 'rating' ? 'stars' : 'reviews'}</div>
        </div>
      </div>
    </div>
    <div class="footer"><span>ARMA REVENUE SCAN</span><span>PAGE 4 OF ${totalPages}</span></div>
  </div></div>

  ${hasOtherIssues ? `
  <!-- PAGE 5: REVENUE LEAKS -->
  <div class="page"><div class="content-frame">
    <div class="top-bar"><span>STEP 4 · REVENUE LEAKS</span><span>OTHER ISSUES</span></div>
    <div class="body">
      <div class="hero-hl">THE BLEEDING.</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:40px;">
        ${(page5.other_issues || []).map((i:any)=>`
          <div style="border-left:5px solid #D0202E; padding-left:20px; margin-bottom:25px;">
            <div style="font-weight:900; font-size:16px; margin-bottom:5px;">${i.title}</div>
            <div style="font-size:13px; color:#555; line-height:1.4;">${i.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="footer"><span>ARMA REVENUE SCAN</span><span>PAGE 5 OF 6</span></div>
  </div></div>` : ''}

  <!-- PAGE 6: CTA -->
  <div class="page"><div class="content-frame" style="background:#000; color:#fff;">
    <div class="body" style="align-items:center; justify-content:center; text-align:center; padding:80px;">
      <h1 style="font-family:'Playfair Display',serif; font-size:75px; font-weight:900; line-height:0.85; margin-bottom:40px;">STOP THE<br>LEAKAGE.<br><span style="color:#D0202E;">NOW.</span></h1>
      <p style="font-size:20px; max-width:550px; line-height:1.6; margin-bottom:60px; color:#ccc;">${report.cta}</p>
      <div style="background:#D0202E; color:#fff; padding:25px 75px; font-size:18px; font-weight:900; text-transform:uppercase;">Recover My Position</div>
    </div>
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