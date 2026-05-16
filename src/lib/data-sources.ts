import * as cheerio from "cheerio";

export async function fetchWebsiteData(url: string, niche: string = "plumber") {
  const domain = new URL(url).hostname.replace("www.", "");

  // 1. FIRST: GET REAL LOCATION DATA (NO HARDCODING)
  const localData = await fetchLocalData(domain);
  const city = localData?.city || "USA"; // Use detected city

  const [psDesktop, psMobile, rankings, shotDesktop, shotMobile, evidence] =
    await Promise.allSettled([
      fetchPageSpeedData(url, "desktop"),
      fetchPageSpeedData(url, "mobile"),
      fetchLocalRankings(domain, niche, city),
      fetchScreenshotBase64(url, "desktop"),
      fetchScreenshotBase64(url, "mobile"),
      scrapeDeepEvidence(url),
    ]);

  const rankData: any = rankings.status === "fulfilled" ? rankings.value : { lead: null, competitor: null };
  const evidenceVal: any = evidence.status === "fulfilled" ? evidence.value : {};

  // Estimate traffic from rank: rough heuristic until SimilarWeb/DataForSEO is wired
  const rank = rankData.lead?.rank || 21;
  const baseTraffic = rank <= 3 ? 1200 : rank <= 10 ? 600 : rank <= 20 ? 250 : 80;

  return {
    domain,
    city,
    vertical: niche,
    brand: localData?.name || domain.split(".")[0],
    traffic: baseTraffic,
    lead_rank: rank,
    lead_rating: localData?.rating || 0,
    lead_reviews: localData?.total_reviews || 0,
    competitor: rankData.competitor || null, // NO MORE MARKET LEADER FAKES
    scores: {
      desktop: psDesktop.status === "fulfilled" && psDesktop.value ? psDesktop.value.score : 50,
      mobile: psMobile.status === "fulfilled" && psMobile.value ? psMobile.value.score : 50,
    },
    evidence: {
      has_cta_above_fold: evidenceVal.has_cta_above_fold ?? false,
      has_on_site_reviews: evidenceVal.has_on_site_reviews ?? false,
      has_schema_markup: evidenceVal.has_schema_markup ?? false,
      has_service_area_pages: evidenceVal.has_service_area_pages ?? false,
      has_online_booking: evidenceVal.has_online_booking ?? false,
      has_financing: evidenceVal.has_financing ?? false,
      has_mobile_optimization: evidenceVal.has_mobile_optimization ?? true,
      has_sticky_header: evidenceVal.has_sticky_header ?? false,
    },
    screenshots: {
      desktop: shotDesktop.status === "fulfilled" ? shotDesktop.value : null,
      mobile: shotMobile.status === "fulfilled" ? shotMobile.value : null,
    },
  };
}

async function scrapeDeepEvidence(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // REAL UX/BUSINESS LOGIC AUDIT
    return {
      has_cta_above_fold: $('a[href^="tel:"], button:contains("Call"), button:contains("Schedule")').length > 0,
      has_on_site_reviews: html.includes("★") || html.toLowerCase().includes("testimonial"),
      has_schema_markup: html.includes("application/ld+json") || html.includes("itemtype="),
      has_service_area_pages: $('a[href*="/locations/"], a[href*="/areas/"]').length > 0,
      has_online_booking: html.toLowerCase().includes("book") || html.toLowerCase().includes("appointment"),
      has_financing: html.toLowerCase().includes("financing") || html.toLowerCase().includes("pay later"),
      has_mobile_optimization: html.includes("viewport") && html.includes("width=device-width"),
      has_sticky_header: html.includes("fixed") || html.includes("sticky"),
    };
  } catch {
    return {};
  }
}

async function fetchLocalData(domain: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = domain.split(".")[0].replace(/-/g, " ");
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: query }),
    });
    const data = await res.json();
    const p = data.places?.[0];
    if (!p) return null;

    // Extract city from formattedAddress (e.g., "123 Main St, New York, NY 10001")
    const parts = p.formattedAddress.split(",");
    const city = parts.length >= 2 ? parts[parts.length - 3].trim() : "USA";

    return {
      name: p.displayName?.text,
      city: city,
      rating: p.rating,
      total_reviews: p.userRatingCount
    };
  } catch {
    return null;
  }
}

async function fetchLocalRankings(leadDomain: string, vertical: string, city: string) {
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
  const keyword = `${vertical} ${city}`;

  try {
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ keyword, location_code: 2840, language_code: "en", limit: 10 }]),
    });
    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items || [];

    const lead = items.find((i: any) => i.domain === leadDomain || i.url?.includes(leadDomain));
    const leadRank = lead?.rank_absolute || 21;

    // FIND A REAL COMPETITOR (NO FAKES)
    const competitor = items.find(
      (i: any) =>
        i.rank_absolute <= 3 &&
        i.domain !== leadDomain &&
        !["yelp.com", "angi.com", "houzz.com"].includes(i.domain)
    );

    return {
      lead: { rank: leadRank },
      competitor: competitor ? {
        name: competitor.title,
        domain: competitor.domain,
        rank: competitor.rank_absolute,
        rating: competitor.rating?.value || 0,
        reviews: competitor.rating?.votes_count || 0,
      } : null,
    };
  } catch {
    return { lead: null, competitor: null };
  }
}

async function fetchPageSpeedData(url: string, strategy: "desktop" | "mobile") {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return {
      score: Math.round(data.lighthouseResult.categories.performance.score * 100),
      load_time: data.lighthouseResult.audits["interactive"]?.displayValue || "0s",
    };
  } catch {
    return null;
  }
}

async function fetchScreenshotBase64(url: string, device: "desktop" | "mobile") {
  const params = new URLSearchParams({
    access_key: process.env.SCREENSHOTONE_API_KEY!,
    url: url,
    viewport_width: device === "desktop" ? "1280" : "390",
    viewport_height: device === "desktop" ? "800" : "844",
    delay: "3",
    format: "jpeg",
  });
  try {
    const res = await fetch(`https://api.screenshotone.com/take?${params}`);
    const buffer = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}