export async function fetchWebsiteData(url: string) {
  const domain = new URL(url).hostname.replace("www.", "");
  console.log(`\n%c[Audit Start] ${domain}`, "color: #D0202E; font-weight: bold; border-bottom: 1px solid #D0202E;");

  const startTime = Date.now();

  try {
    // 1. Start CRITICAL data fetching (SEO + Local + Performance)
    const criticalResults = await Promise.allSettled([
      fetchPageSpeedData(url),
      fetchDataForSeoData(domain),
      fetchLocalData(domain),
    ]);

    // 2. Start Screenshots (Non-blocking for AI analysis if we wanted, but required for full report)
    // We run them in parallel with a timeout to prevent hanging the whole audit
    const screenshotResults = await Promise.allSettled([
      fetchScreenshot(url, "desktop"),
      fetchScreenshot(url, "mobile"),
    ]);

    const [pageSpeed, dataForSeo, localData] = criticalResults;
    const [screenshotDesktop, screenshotMobile] = screenshotResults;

    console.log(`[Audit] Total Data Fetch Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return {
      domain,
      metrics: {
        performance: pageSpeed.status === "fulfilled" ? pageSpeed.value : null,
        seo: dataForSeo.status === "fulfilled" ? dataForSeo.value : null,
        local: localData.status === "fulfilled" ? localData.value : null,
        screenshot_desktop: screenshotDesktop.status === "fulfilled" ? screenshotDesktop.value : null,
        screenshot_mobile: screenshotMobile.status === "fulfilled" ? screenshotMobile.value : null,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Audit] Critical Fetch Error:", error);
    throw error;
  }
}

async function fetchPageSpeedData(url: string) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;
  
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("PageSpeed Failed");
    const data = await res.json();
    return {
      score: Math.round(data.lighthouseResult.categories.performance.score * 100),
      metrics: {
        lcp: data.lighthouseResult.audits["largest-contentful-paint"].displayValue,
        speedIndex: data.lighthouseResult.audits["speed-index"].displayValue,
      },
      mobileFriendly: data.lighthouseResult.audits["viewport"]?.score === 1,
    };
  } catch (e) {
    console.warn("[PageSpeed] Error:", e);
    return null;
  }
}

async function fetchDataForSeoData(domain: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  
  const brandName = domain.split(".")[0];
  console.log(`[DataForSEO] Analyzing Market Depth for: ${domain}`);

  try {
    const [keywordsRes, serpRes, localPackRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify([{ target: domain, location_code: 2840, language_code: "en", include_serp_info: true, limit: 10 }])
      }),
      fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify([{ keyword: brandName, location_code: 2840, language_code: "en", device: "desktop", os: "windows" }])
      }),
      fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify([{ keyword: brandName, location_code: 2840, language_code: "en", limit: 20 }])
      })
    ]);

    const keywordsData = await keywordsRes.json();
    const serpData = await serpRes.json();
    const localPackData = await localPackRes.json();

    const siteKeywords = keywordsData.tasks?.[0]?.result?.[0]?.items?.map((k: any) => ({
      keyword: k.keyword_data?.keyword,
      pos: k.rank_group,
      vol: k.keyword_data?.keyword_info?.search_volume
    })) || [];

    const organicItems = serpData.tasks?.[0]?.result?.[0]?.items || [];
    const brandRank = organicItems.findIndex((item: any) => item.url?.includes(domain)) + 1;

    const mapItems = localPackData.tasks?.[0]?.result?.[0]?.items || [];
    const inLocalPack = mapItems.some((item: any) => item.domain === domain || item.title?.toLowerCase().includes(brandName.toLowerCase()));

    return {
      organic_traffic: keywordsData.tasks?.[0]?.result?.[0]?.metrics?.organic?.etv || 0,
      organic_keywords_count: siteKeywords.length,
      top_keywords: siteKeywords,
      brand_rank: brandRank > 0 ? brandRank : "Unranked",
      in_local_pack: inLocalPack,
      serp_visibility: brandRank > 0 && brandRank <= 3 ? "HIGH" : "LOW",
    };
  } catch (error) {
    console.error("[DataForSEO] Deep Scan Failure:", error);
    return null;
  }
}

async function fetchLocalData(domain: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const businessQuery = domain.split(".")[0].replace(/-/g, " ");
  
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri,places.reviews"
      },
      body: JSON.stringify({ textQuery: businessQuery })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    return {
      name: place.displayName?.text,
      rating: place.rating,
      total_reviews: place.userRatingCount,
      address: place.formattedAddress,
      phone: place.internationalPhoneNumber,
      website: place.websiteUri,
      reviews: place.reviews?.map((r: any) => ({
         author: r.authorAttribution?.displayName,
         rating: r.rating,
         text: r.text?.text,
         time: r.relativePublishTimeDescription
      })) || [],
    };
  } catch (error) {
    return null;
  }
}

async function fetchScreenshot(url: string, device: "desktop" | "mobile") {
  const apiKey = process.env.SCREENSHOTONE_API_KEY;
  const params = new URLSearchParams({
    access_key: apiKey!,
    url: url,
    viewport_width: device === "desktop" ? "1280" : "375",
    viewport_height: device === "desktop" ? "720" : "812",
    format: "jpg",
    image_quality: "80",
    block_ads: "true",
    block_cookie_banners: "true"
  });
  
  const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`;
  
  // Test if the screenshot service is responding within 15s
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(screenshotUrl, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) return screenshotUrl;
    throw new Error("Screenshot Failed");
  } catch (e) {
    console.warn(`[Screenshot] ${device} failure, using fallback UI logic.`);
    return null;
  }
}
