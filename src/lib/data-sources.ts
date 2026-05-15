import * as cheerio from 'cheerio';

export async function fetchWebsiteData(url: string, city: string = "Toledo, OH", vertical: string = "plumber") {
  const domain = new URL(url).hostname.replace("www.", "");
  
  try {
    const results = await Promise.allSettled([
      fetchPageSpeedData(url, "desktop"),
      fetchPageSpeedData(url, "mobile"),
      fetchLocalRankings(domain, vertical, city),
      fetchLocalData(domain),
      fetchScreenshotBase64(url, "desktop"),
      fetchScreenshotBase64(url, "mobile"),
      scrapeDeepEvidence(url)
    ]);

    const [psDesktop, psMobile, rankings, localData, screenshotDesktop, screenshotMobile, evidence] = results;

    const rankData: any = rankings.status === "fulfilled" ? rankings.value : { lead: null, competitor: null };
    const localVal: any = localData.status === "fulfilled" ? localData.value : null;
    const evidenceVal: any = evidence.status === "fulfilled" ? evidence.value : {};

    return {
      domain,
      city,
      vertical,
      brand: localVal?.name || domain.split('.')[0],
      lead_rank: rankData.lead?.rank || 21,
      lead_rating: localVal?.rating || 0,
      lead_reviews: localVal?.total_reviews || 0,
      competitor: rankData.competitor,
      
      scores: {
        desktop: psDesktop.status === "fulfilled" && psDesktop.value ? psDesktop.value.score : 50,
        mobile: psMobile.status === "fulfilled" && psMobile.value ? psMobile.value.score : 50,
      },
      
      // CRITICAL: TRUTH EVIDENCE DICTIONARY
      evidence: evidenceVal,
      
      screenshots: {
        desktop: screenshotDesktop.status === "fulfilled" ? screenshotDesktop.value : null,
        mobile: screenshotMobile.status === "fulfilled" ? screenshotMobile.value : null,
      }
    };
  } catch (error) {
    throw error;
  }
}

async function scrapeDeepEvidence(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    return {
      has_cta_above_fold: $('a[href^="tel:"], button:contains("Call"), .cta').length > 0,
      has_on_site_reviews: html.includes('★') || html.includes('review') || html.toLowerCase().includes('testimonial'),
      has_schema_markup: html.includes('application/ld+json'),
      has_service_area_pages: $('a[href*="/locations/"], a[href*="/areas/"]').length > 0,
      has_online_booking: html.toLowerCase().includes('schedule') || html.toLowerCase().includes('appointment') || html.includes('calendly'),
      has_financing: html.toLowerCase().includes('financing') || html.toLowerCase().includes('payment plan'),
      has_mobile_optimization: html.includes('viewport') && html.includes('width=device-width'),
      has_sticky_header: html.includes('fixed') || html.includes('sticky')
    };
  } catch (e) { return {}; }
}

// ... (Rest of fetchLocalRankings, fetchPageSpeedData, fetchScreenshotBase64, fetchLocalData)
async function fetchLocalRankings(leadDomain: string, vertical: string, city: string) {
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
  const keyword = `${vertical} ${city}`;

  try {
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ keyword, location_code: 2840, language_code: "en", limit: 20 }])
    });
    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items || [];

    const lead = items.find((i: any) => i.domain === leadDomain || i.url?.includes(leadDomain));
    const leadRank = lead?.rank_absolute || 21;

    let targetMaxRank = 10;
    if (leadRank <= 10) targetMaxRank = 3;
    else if (leadRank <= 20) targetMaxRank = 5;

    const competitor = items.find((i: any) => 
      i.rank_absolute <= targetMaxRank && 
      i.domain !== leadDomain && 
      !['yelp.com', 'angi.com', 'houzz.com', 'yellowpages.com'].includes(i.domain)
    );

    return {
      lead: { rank: leadRank },
      competitor: competitor ? {
        name: competitor.title,
        domain: competitor.domain,
        rank: competitor.rank_absolute,
        rating: competitor.rating?.value || 0,
        reviews: competitor.rating?.votes_count || 0,
        cid: competitor.cid
      } : null
    };
  } catch (e) { return { lead: null, competitor: null }; }
}

async function fetchPageSpeedData(url: string, strategy: "desktop" | "mobile") {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return {
      score: Math.round(data.lighthouseResult.categories.performance.score * 100),
      load_time: data.lighthouseResult.audits["interactive"]?.displayValue || "0s"
    };
  } catch (e) { return null; }
}

async function fetchScreenshotBase64(url: string, device: "desktop" | "mobile") {
  const params = new URLSearchParams({
    access_key: process.env.SCREENSHOTONE_API_KEY!,
    url: url,
    viewport_width: device === "desktop" ? "1280" : "390",
    viewport_height: device === "desktop" ? "800" : "844",
    delay: "3"
  });
  try {
    const res = await fetch(`https://api.screenshotone.com/take?${params.toString()}`);
    const buffer = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (e) { return null; }
}

async function fetchLocalData(domain: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = domain.split(".")[0].replace(/-/g, " ");
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey!, "X-Goog-FieldMask": "places.displayName,places.websiteUri,places.rating,places.userRatingCount" },
      body: JSON.stringify({ textQuery: `${query} in USA` })
    });
    const data = await res.json();
    const p = data.places?.[0];
    return p ? { name: p.displayName?.text, rating: p.rating, total_reviews: p.userRatingCount, website: p.websiteUri } : null;
  } catch (e) { return null; }
}
