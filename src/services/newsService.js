function cleanHtml(raw) {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const translationCache = new Map();

/**
 * Fast Google Translate helper with cache and memory fallback
 */
export async function translateText(text, targetLang = 'hi') {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const isDevanagari = /[\u0900-\u097F]/.test(trimmed);
  if (targetLang === 'hi' && isDevanagari) return trimmed;
  if (targetLang === 'en' && !isDevanagari) return trimmed;

  const cacheKey = `${targetLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(s => s[0]).join('').trim();
        if (translated) {
          translationCache.set(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (_) {}

  // Fallback to MyMemory translation API
  try {
    const pair = targetLang === 'hi' ? 'en|hi' : 'hi|en';
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        const translated = cleanHtml(data.responseData.translatedText);
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (_) {}

  return trimmed;
}

const KNOWN_REPORTERS_HI = {
  'News On AIR': 'न्यूज़ ऑन एआईआर (ऑल इंडिया रेडियो)',
  'Bhaskar English': 'दैनिक भास्कर',
  'Dainik Bhaskar': 'दैनिक भास्कर',
  'Amar Ujala': 'अमर उजाला',
  'Navbharat Times': 'नवभारत टाइम्स',
  'Kisan Tak': 'किसान तक',
  'Krishi Jagran': 'कृषि जागरण',
  'Gaon Connection': 'गाँव कनेक्शन',
  'Elets eGov': 'ई-गॉव न्यूज़ नेटवर्क',
  'The Times of India': 'टाइम्स ऑफ इंडिया',
  'The Hindu': 'द हिन्दू',
  'Business Standard': 'बिजनेस स्टैंडर्ड',
  'Economic Times': 'इकोनॉमिक टाइम्स',
  'DD News': 'डीडी न्यूज़',
  'Agri News': 'कृषि समाचार ब्यूरो',
};

/**
 * Fetch fresh real-time agriculture news across multiple targeted streams
 * Aggregates state-level, national mandi rates, government schemes, and crop advisories
 */
export async function fetchLiveNews(state = 'Uttar Pradesh', district = '', lang = 'hi') {
  try {
    const loc = district || state || 'India';
    const isEn = lang === 'en';
    
    // Multiple targeted queries to maximize variety and quantity of fresh news
    const queries = isEn
      ? [
          `(agriculture OR farmer OR mandi OR crop) ${loc} when:7d`,
          `(agriculture OR "mandi rate" OR "crop price" OR "MSP") India when:7d`,
          `("PM Kisan" OR "agriculture scheme" OR "fertilizer subsidy" OR "crop insurance" OR eNAM) when:7d`,
          `("farming news" OR "agricultural advisory" OR "weather alert" OR "agri news") when:7d`,
        ]
      : [
          `(कृषि OR किसान OR मंडी OR फसल OR "मंडी भाव") ${loc} when:7d`,
          `(कृषि OR "मंडी भाव" OR "फसल दाम" OR "एमएसपी" OR "MSP") भारत when:7d`,
          `("पीएम किसान" OR "PM Kisan" OR "कृषि योजना" OR "खाद सब्सिडी" OR "फसल बीमा" OR eNAM) when:7d`,
          `("खेती किसानी" OR "कृषि सलाह" OR "मौसम अलर्ट" OR "कृषि समाचार") when:7d`,
        ];

    const fetchPromises = queries.map(async (q) => {
      try {
        const hl = isEn ? 'en' : 'hi';
        const ceid = isEn ? 'IN:en' : 'IN:hi';
        const targetUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=IN&ceid=${ceid}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) return [];
        const data = await res.json();
        return (data && data.status === 'ok' && Array.isArray(data.items)) ? data.items : [];
      } catch (_) {
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const allItems = [];

    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allItems.push(...res.value);
      }
    });

    const now = Date.now();
    const MAX_AGE_MS = 10 * 24 * 60 * 60 * 1000; // Fresh articles within last 10 days
    const seenTitles = new Set();
    const parsedArticles = [];

    for (let i = 0; i < allItems.length; i++) {
      const article = allItems[i];
      const rawTitle = cleanHtml(article.title || '');
      if (!rawTitle || rawTitle.length < 5) continue;

      // Extract headline and publisher
      const titleParts = rawTitle.split(' - ');
      let headline = rawTitle;
      let sourceName = article.author || (isEn ? 'Agri News' : 'कृषि समाचार');

      if (titleParts.length > 1) {
        sourceName = titleParts.pop().trim();
        headline = titleParts.join(' - ').trim();
      }

      // Deduplicate similar headlines
      const normalizedKey = headline.slice(0, 40).toLowerCase().replace(/\s+/g, '');
      if (seenTitles.has(normalizedKey)) continue;
      seenTitles.add(normalizedKey);

      let cleanDescription = cleanHtml(article.description || article.content || '');
      if (!cleanDescription || cleanDescription === rawTitle) {
        cleanDescription = headline;
      }

      const isUrgent = /अलर्ट|चेतावनी|alert|warning|नुकसान|बारिश|कीट|ओलावृष्टि/i.test(headline);

      // Categorization
      let category = 'ANNOUNCEMENT';
      if (isUrgent) category = 'WARNING';
      else if (/भाव|दाम|रेट|mandi|price|msp|खरीद/i.test(headline)) category = 'PRICE_ALERT';
      else if (/योजना|subsidy|scheme|pm kisan|किस्त|सब्सिडी|बीमा/i.test(headline)) category = 'ANNOUNCEMENT';
      else if (/मौसम|rain|weather|मानसून/i.test(headline)) category = 'WARNING';
      else if (/मांग|बिक्री|निर्यात|demand/i.test(headline)) category = 'DEMAND_SPIKE';

      const articleDate = new Date(article.pubDate || now);
      const ageMs = now - articleDate.getTime();

      if (ageMs <= MAX_AGE_MS) {
        const reporterHi = KNOWN_REPORTERS_HI[sourceName] || sourceName;

        parsedArticles.push({
          id: `news_${i}_${articleDate.getTime()}`,
          category,
          rawHeadline: headline,
          rawDetail: cleanDescription,
          headline_hi: headline,
          headline_en: headline,
          detail_hi: cleanDescription,
          detail_en: cleanDescription,
          reporter_hi: reporterHi,
          reporter_en: sourceName,
          location: district ? `${district}, ${state}` : `${state}`,
          timestamp: articleDate,
          confirms: Math.floor(Math.random() * 35) + 10,
          flags: 0,
          urgent: isUrgent,
          url: article.link || article.guid || '',
        });
      }
    }

    // Sort strictly newest first
    parsedArticles.sort((a, b) => b.timestamp - a.timestamp);

    const topArticles = parsedArticles.slice(0, 30);

    // Asynchronously translate top articles so that both Hindi and English are 100% available
    await Promise.allSettled(
      topArticles.map(async (art) => {
        const isDevanagari = /[\u0900-\u097F]/.test(art.rawHeadline);
        if (isDevanagari) {
          art.headline_hi = art.rawHeadline;
          art.detail_hi = art.rawDetail;
          art.headline_en = await translateText(art.rawHeadline, 'en');
          art.detail_en = await translateText(art.rawDetail, 'en');
        } else {
          art.headline_en = art.rawHeadline;
          art.detail_en = art.rawDetail;
          art.headline_hi = await translateText(art.rawHeadline, 'hi');
          art.detail_hi = await translateText(art.rawDetail, 'hi');
        }
      })
    );

    return topArticles;
  } catch (err) {
    console.warn('[newsService] Multi-stream fetch failed:', err.message);
  }

  return [];
}
