export async function fetchWebsiteData(url: string) {
  const domain = new URL(url).hostname.replace("www.", "");
  
  console.group(`%c[ARMA DATA SOURCE: ${domain}]`, "color: #fff; background: #000; padding: 10px; border-radius: 8px; border: 2px solid #D0202E;");
  
  const startTime = Date.now();

  try {
    const results = await Promise.allSettled([
      fetchPageSpeedData(url),
      fetchDataForSeoData(domain),
      fetchLocalData(domain),
      fetchScreenshot(url, "desktop"),
      fetchScreenshot(url, "mobile"),
    ]);

    const [pageSpeed, dataForSeo, localData, screenshotDesktop, screenshotMobile] = results;

    const finalData = {
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

    console.log("%c[1] PAGESPEED RAW:", "color: #3b82f6; font-weight: bold;", finalData.metrics.performance);
    console.log("%c[2] DATAFORSEO RAW:", "color: #10b981; font-weight: bold;", finalData.metrics.seo);
    console.log("%c[3] GOOGLE PLACES RAW:", "color: #f59e0b; font-weight: bold;", finalData.metrics.local);
    console.log("%c[4] TOTAL FETCH TIME: %s", "color: #666;", `${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.groupEnd();

    return finalData;
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
    if (!res.ok) return null;
    const data = await res.json();
    return {
      score: Math.round(data.lighthouseResult.categories.performance.score * 100),
      load_time_seconds: parseFloat(data.lighthouseResult.audits["interactive"].displayValue.replace(/[^0-9.]/g, "")),
      lcp: data.lighthouseResult.audits["largest-contentful-paint"].displayValue,
      speed_index: data.lighthouseResult.audits["speed-index"].displayValue,
      fcp: data.lighthouseResult.audits["first-contentful-paint"].displayValue,
      mobile_friendly: data.lighthouseResult.audits["viewport"]?.score === 1,
    };
  } catch (e) {
    return null;
  }
}

async function fetchDataForSeoData(domain: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  
  const brandName = domain.split(".")[0];

  try {
    const [keywordsRes, serpRes, localPackRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify([{ target: domain, location_code: 2840, language_code: "en", limit: 20 }])
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

    // EXTRACT KEYWORDS WITH REAL VOLUME AND POSITION
    const siteKeywords = (keywordsData.tasks?.[0]?.result?.[0]?.items || [])
      .map((k: any) => ({
        keyword: k.keyword_data?.keyword || "unknown",
        pos: k.ranked_serp_element?.serp_item?.rank_absolute || 0,
        vol: k.keyword_data?.keyword_info?.search_volume || 0
      }))
      .filter((k: any) => k.pos > 0 && k.vol > 0)
      .slice(0, 10);

    const organicItems = serpData.tasks?.[0]?.result?.[0]?.items || [];
    const brandRank = organicItems.findIndex((item: any) => item.url?.includes(domain) || item.domain?.includes(domain)) + 1;
    
    // ROBUST COMPETITOR DISCOVERY
    const topCompetitorItem = organicItems.find((item: any) => item.type === "organic" && item.rank_absolute === 1) 
                          || organicItems.find((item: any) => item.type === "organic");

    const topCompetitor = topCompetitorItem ? {
      name: topCompetitorItem.title || topCompetitorItem.domain,
      domain: topCompetitorItem.domain,
      rank: topCompetitorItem.rank_absolute || 1
    } : null;

    const mapItems = localPackData.tasks?.[0]?.result?.[0]?.items || [];
    const inLocalPack = mapItems.some((item: any) => item.domain === domain || item.title?.toLowerCase().includes(brandName.toLowerCase()));

    const traffic_etv = keywordsData.tasks?.[0]?.result?.[0]?.metrics?.organic?.etv || 0;
    let visibility = brandRank > 0 && brandRank <= 3 ? "HIGH" : "LOW";
    if (traffic_etv === 0 && visibility === "HIGH") visibility = "LOW_CONFIDENCE";

    return {
      organic_traffic_etv: traffic_etv,
      organic_keywords_count: siteKeywords.length,
      top_keywords: siteKeywords,
      brand_rank: brandRank > 0 ? brandRank : "Unranked",
      top_competitor,
      in_local_pack: inLocalPack,
      serp_visibility: visibility,
    };
  } catch (error) {
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
      body: JSON.stringify({ textQuery: `${businessQuery} in USA` })
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
      reviews: place.reviews?.slice(0, 3).map((r: any) => ({
         author: r.authorAttribution?.displayName,
         rating: r.rating,
         text: r.text?.text
      })) || [],
    };
  } catch (error) {
    return null;
  }
}

async function fetchScreenshot(url: string, device: "desktop" | "mobile") {
  const apiKey = process.env.SCREENSHOTONE_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    access_key: apiKey!,
    url: url,
    viewport_width: device === "desktop" ? "1280" : "375",
    viewport_height: device === "desktop" ? "720" : "812",
    format: "jpg",
    image_quality: "80",
    block_ads: "true",
    block_cookie_banners: "true",
    delay: "2"
  });
  return `https://api.screenshotone.com/take?${params.toString()}`;
}
