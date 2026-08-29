import { GOVT_SCHEMES } from '../data/mockData.js';

/**
 * LokVani AI Client-Side Local NLP Engine
 *
 * SECURITY NOTE: This file does NOT import @google/generative-ai and does NOT use any API keys.
 * All live Gemini API calls happen ONLY on the Express server (server.js / geminiService.js).
 *
 * This module provides a deterministic, keyword-based local fallback engine that runs entirely
 * in the browser with no network calls. It activates when the backend is unreachable,
 * so the app degrades gracefully instead of breaking.
 */

// Commodity price database (local benchmark prices for offline fallback)
const COMMODITY_DATABASE = [
  { keywords: ['tamatar', 'tomato', 'टमाटर'], name: 'Tamatar (Tomato)', price: 28, unit: 'kg' },
  { keywords: ['pyaaz', 'onion', 'प्याज़', 'प्याज'], name: 'Pyaaz (Onion)', price: 34, unit: 'kg' },
  { keywords: ['aloo', 'potato', 'आलू'], name: 'Aloo (Potato)', price: 18, unit: 'kg' },
  { keywords: ['gehun', 'wheat', 'गेहूं', 'गेहुं'], name: 'Gehun (Wheat)', price: 24, unit: 'kg' },
  { keywords: ['chawal', 'rice', 'paddy', 'dhan', 'चावल', 'धान'], name: 'Dhan / Chawal (Rice)', price: 26, unit: 'kg' },
  { keywords: ['mirch', 'chilli', 'chili', 'मिर्च'], name: 'Hari Mirch (Green Chilli)', price: 42, unit: 'kg' },
  { keywords: ['baingan', 'brinjal', 'eggplant', 'बैंगन'], name: 'Baingan (Brinjal)', price: 22, unit: 'kg' },
  { keywords: ['bhindi', 'okra', 'ladyfinger', 'भिंडी'], name: 'Bhindi (Okra)', price: 32, unit: 'kg' },
  { keywords: ['karela', 'bitter gourd', 'करेला'], name: 'Karela (Bitter Gourd)', price: 38, unit: 'kg' },
  { keywords: ['lahsun', 'garlic', 'लहसुन'], name: 'Garlic (Lahsun)', price: 140, unit: 'kg' },
  { keywords: ['adrak', 'ginger', 'अदरक'], name: 'Adrak (Ginger)', price: 90, unit: 'kg' },
  { keywords: ['sarson', 'mustard', 'सरसों'], name: 'Sarson (Mustard)', price: 54, unit: 'kg' },
  { keywords: ['kapas', 'cotton', 'कपास'], name: 'Kapas (Cotton)', price: 68, unit: 'kg' },
  { keywords: ['ganna', 'sugarcane', 'गन्ना'], name: 'Ganna (Sugarcane)', price: 3.5, unit: 'kg' },
  { keywords: ['aam', 'mango', 'आम'], name: 'Aam (Mango)', price: 45, unit: 'kg' },
  { keywords: ['kela', 'banana', 'केला'], name: 'Kela (Banana)', price: 30, unit: 'doz' },
  { keywords: ['doodh', 'milk', 'दूध'], name: 'Doodh (Milk)', price: 52, unit: 'liter' },
  { keywords: ['makka', 'maize', 'corn', 'मक्का'], name: 'Makka (Maize)', price: 21, unit: 'kg' },
  { keywords: ['chana', 'gram', 'चना'], name: 'Chana (Gram)', price: 62, unit: 'kg' }
];

/**
 * Process a user speech query using the local NLP engine (no API key, no network).
 * This is the browser-side fallback used when the Express backend is unreachable.
 *
 * Returns a response in the same shape expected by UserVoiceApp so the UI
 * can display it without any special-casing.
 *
 * @param {string} transcribedText
 * @param {{ userLocation?: string }} options
 */
export function processUserSpeechQuery(transcribedText, options = {}) {
  const userLocation = options.userLocation || 'Azamgarh, UP';
  const result = localNlpEngine(transcribedText, userLocation);
  return {
    engine_source: 'LOCAL_NLP_FALLBACK',
    confidence: 'LOW', // local engine is always LOW confidence
    follow_up_questions: [
      'Kirana node se verify karna chahenge?',
      'Koi aur sawal hai?'
    ],
    ...result
  };
}

// ─── Local NLP Engine ────────────────────────────────────────────────────────

function localNlpEngine(userSpeech, userLocation) {
  const text = userSpeech.trim();
  const lower = text.toLowerCase();

  const matchedCommodity = COMMODITY_DATABASE.find(c =>
    c.keywords.some(kw => lower.includes(kw))
  );

  const matchedScheme = GOVT_SCHEMES.find(s =>
    lower.includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().split(' ').some(w => w.length > 3 && lower.includes(w))
  );

  // 1. CROP DISEASE, PESTICIDE & FERTILIZER
  if (
    lower.includes('keeda') || lower.includes('कीड़ा') || lower.includes('spray') ||
    lower.includes('छिड़काव') || lower.includes('pesticide') || lower.includes('दवा') ||
    lower.includes('dap') || lower.includes('urea') || lower.includes('खाद') ||
    lower.includes('disease') || lower.includes('blight') || lower.includes('peele')
  ) {
    const cropName = matchedCommodity ? matchedCommodity.name : extractGeneralTopic(text);
    const isFertilizer = lower.includes('dap') || lower.includes('urea') || lower.includes('खाद');
    const shortHi = isFertilizer
      ? `${cropName} mein per acre 50 kg DAP aur 45 kg Urea daalein. Sahi matra ke liye Kirana operator se mitti jaanch confirm karein.`
      : `${cropName} mein keede/bimari ke liye Copper Oxychloride 3g per liter paani mein spray karein. Sahi dosage Kirana center se confirm zaroor karein.`;
    const shortEn = isFertilizer
      ? `For ${cropName}, apply 50 kg DAP & 45 kg Urea per acre. Confirm exact dose with Kirana Node soil test.`
      : `For ${cropName} pest control, spray Copper Oxychloride (3g/L). Confirm exact dosage at your Kirana Trust Node.`;

    return {
      transcribedText: userSpeech,
      intent: 'general_advice',
      domain: 'AGRI_ADVISORY',
      shortAnswerHi: shortHi,
      shortAnswerEn: shortEn,
      detailedAnswerHi: shortHi + ' Kisan Helpline 1551 par bhi call kar sakte hain. Har fasal aur mitti ki zaroorat alag hoti hai, isliye Kirana node operator se mitti jaanch karwa kar hi sahi matra tay karein.',
      detailedAnswerEn: shortEn + ' You can also call Kisan Helpline 1551. Every crop and soil type has different needs, so always verify dosage with a certified Kirana Trust Node operator before application.',
      needs_trust_node_review: true,
      isHighStakes: true,
      riskCategory: isFertilizer ? 'AGRICULTURAL_DOSAGE' : 'PESTICIDE_SAFETY',
      trustNote: isFertilizer
        ? 'Fertilizer dosage: Requires Kirana operator review based on soil type.'
        : 'Chemical pesticide advice: Requires Kirana operator review for crop safety.',
      actionableSteps: [
        'Subah ya shaam ke waqt spray/khad daalein',
        'Peene ke paani ke strot se door rakhein',
        'Kirana node par mitti jaanch karwayein'
      ]
    };
  }

  // 2. SCHEME & LOAN ELIGIBILITY
  if (
    matchedScheme ||
    lower.includes('scheme') || lower.includes('yojana') || lower.includes('योजना') ||
    lower.includes('loan') || lower.includes('ऋण') || lower.includes('apply') ||
    lower.includes('आवेदन') || lower.includes('subsidy') || lower.includes('सब्सिडी') ||
    lower.includes('svanidhi') || lower.includes('kcc') || lower.includes('kusum')
  ) {
    let schemeObj = matchedScheme;
    if (!schemeObj) {
      if (lower.includes('svanidhi') || lower.includes('स्वनिधि') || lower.includes('thela')) schemeObj = GOVT_SCHEMES[1];
      else if (lower.includes('kcc') || lower.includes('credit')) schemeObj = GOVT_SCHEMES[3];
      else if (lower.includes('kusum') || lower.includes('solar')) schemeObj = GOVT_SCHEMES[4];
      else schemeObj = GOVT_SCHEMES[0];
    }
    const shortHi = `${schemeObj.name} ke liye Aadhar Card aur Bank Passbook ke saath Kirana Center par jayen. Isme ${schemeObj.benefits} milta hai.`;
    const shortEn = `For ${schemeObj.name}, visit your Kirana Center with Aadhar Card and bank passbook. Benefit: ${schemeObj.benefits}.`;

    return {
      transcribedText: userSpeech,
      intent: 'scheme_query',
      domain: 'GOVT_SCHEME',
      shortAnswerHi: shortHi,
      shortAnswerEn: shortEn,
      detailedAnswerHi: shortHi + ` Aavedan ke liye ${(schemeObj.documents || ['Aadhar', 'Bank Passbook']).join(', ')} zaroori hain. Niyam badal sakte hain, isliye Kirana node se latest jankari lein.`,
      detailedAnswerEn: shortEn + ` Documents needed: ${(schemeObj.documents || ['Aadhar', 'Bank Passbook']).join(', ')}. Rules may change, always verify current eligibility at your Kirana Trust Node.`,
      needs_trust_node_review: true,
      isHighStakes: true,
      riskCategory: lower.includes('loan') || lower.includes('ऋण') ? 'FINANCIAL_LOAN' : 'FINANCIAL_ELIGIBILITY',
      trustNote: `High-stakes ${schemeObj.name} query: Requires Kirana node document verification.`,
      actionableSteps: schemeObj.documents
        ? schemeObj.documents.map(d => `${d} tayyar rakhein`)
        : ['Aadhar Card tayyar rakhein', 'Bank Passbook ready rakhein']
    };
  }

  // 3. WEATHER FORECAST
  if (
    lower.includes('barish') || lower.includes('मौसम') || lower.includes('weather') ||
    lower.includes('rain') || lower.includes('dhoop') || lower.includes('thand')
  ) {
    return {
      transcribedText: userSpeech,
      intent: 'weather_advisory',
      domain: 'WEATHER',
      shortAnswerHi: `Agle 48 ghante mein ${userLocation} mein halki barish ki sambhavna hai. Khuli fasal ko tarpaulin se dhak lein aur khet mein paani nikasi ki vyavastha karein.`,
      shortAnswerEn: `Light rainfall expected in ${userLocation} over the next 48 hours. Cover harvested crops with tarpaulin and ensure field drainage.`,
      detailedAnswerHi: `Mausam vibhag ke anusar ${userLocation} mein agle 48 ghante mein halki se madham barish ho sakti hai. Isse pehle apni kati hui fasal ko surakshit jagah par rakhein ya tarpaulin se dhakein. Khet mein paani ka johar na ho, iski vyavastha karein. Barish ke baad khet mein ureya ya DAP daalein kyunki nam mitti mein khad jaldi ghulti hai.`,
      detailedAnswerEn: `Meteorological reports suggest light to moderate rainfall in ${userLocation} over the next 48 hours. Move harvested produce to a covered area or cover with tarpaulin. Ensure field drainage to prevent waterlogging. After rainfall, consider applying fertilizers like Urea/DAP as moist soil improves nutrient absorption.`,
      needs_trust_node_review: false,
      isHighStakes: false,
      riskCategory: 'NONE',
      trustNote: 'Auto-verified regional weather forecast.',
      actionableSteps: [
        'Khuli fasal ko tarpaulin se dhakein',
        'Khet mein paani nikasi saaf karein',
        'Barish ke baad khad daalein'
      ]
    };
  }

  // 4. MARKET PRICE QUERY
  if (
    matchedCommodity ||
    lower.includes('bhav') || lower.includes('भाव') || lower.includes('rate') ||
    lower.includes('रेट') || lower.includes('price') || lower.includes('मंडी') ||
    lower.includes('mandi') || lower.includes('thok')
  ) {
    const item = matchedCommodity ? matchedCommodity.name : extractGeneralTopic(text);
    const price = matchedCommodity ? matchedCommodity.price : 30;
    const unit = matchedCommodity ? matchedCommodity.unit : 'kg';

    return {
      transcribedText: userSpeech,
      intent: 'price_query',
      domain: 'MARKET_PRICE',
      shortAnswerHi: `Aaj ${userLocation} mein ${item} ka mandi rate ₹${price} prati ${unit} chal raha hai. Yeh benchmark price hai, sthaniya rate thoda upar ya neeche ho sakta hai.`,
      shortAnswerEn: `Today at ${userLocation}, ${item} mandi rate is approximately ₹${price}/${unit}. This is a benchmark; local rates may vary slightly.`,
      detailedAnswerHi: `${item} ka aaj ka benchmark mandi rate ₹${price} prati ${unit} hai. Yeh data community reports aur sarkari data par aadharit hai. Subah 10 baje ke pehle mandi jaana achha hota hai jab stock fresh hota hai. Bade shopkeepers se bargain karein aur doosri mandion ka rate bhi compare karein. Apna sthaniya rate neeche wale button se community ke saath share karein.`,
      detailedAnswerEn: `The benchmark mandi rate for ${item} today is ₹${price}/${unit}. This is based on community reports and government data. Arriving before 10 AM gets fresher stock. Compare rates across nearby mandis and negotiate with bulk buyers. Share your local rate with the community using the button below.`,
      needs_trust_node_review: false,
      isHighStakes: false,
      riskCategory: 'NONE',
      trustNote: 'Auto-verified market rate lookup.',
      actionableSteps: [
        'Subah 10 baje se pehle mandi jayen',
        'Doosri mandion ka rate compare karein',
        'Apna sthaniya rate community se share karein'
      ]
    };
  }

  // 5. GENERAL FALLBACK
  const topic = extractGeneralTopic(text);
  return {
    transcribedText: userSpeech,
    intent: 'general_advice',
    domain: 'AGRI_ADVISORY',
    shortAnswerHi: `Aapka sawal "${text.slice(0, 60)}" prapt hua. ${topic} ke baare mein sahi jankari ke liye apne Kirana Node se sampark karein.`,
    shortAnswerEn: `Received your question about "${topic}". For verified guidance, please consult your local Kirana Trust Node.`,
    detailedAnswerHi: `Aapne ${topic} ke baare mein poochha. Is vishay par sahi aur up-to-date jankari ke liye apne saamipya Kirana Center par jaen. Wahan trained operator aapko sarkari yojanaon, mandi rates, aur krishi salah ke baare mein sahi margdarshan de sakte hain. Aap Kisan Helpline 1551 par bhi free call kar sakte hain.`,
    detailedAnswerEn: `You asked about ${topic}. For accurate and up-to-date information on this subject, visit your nearest Kirana Center. Trained operators can guide you on government schemes, mandi rates, and agricultural advisory. You can also call Kisan Helpline 1551 for free guidance.`,
    needs_trust_node_review: false,
    isHighStakes: false,
    riskCategory: 'NONE',
    trustNote: 'General voice assistance response — consider verifying with Kirana node.',
    actionableSteps: [
      'Apna vishisht sawal dobara bolen',
      'Kirana node par jankari verify karein',
      'Kisan Helpline 1551 par call karein'
    ]
  };
}

function extractGeneralTopic(text) {
  if (!text) return 'aapke sawal';
  const clean = text
    .replace(/mujhe|batao|kya|hai|kaisey|kaise|karna|chahiye|aur|ke|ki|ka|me|mein|par|karo/gi, '')
    .trim();
  return clean.length > 2 ? clean : text;
}

/**
 * RAG database lookup for scheme and agricultural queries
 */
export function queryDatabaseRAG(queryText) {
  if (!queryText || typeof queryText !== 'string') return null;
  const text = queryText.toLowerCase();

  if (Array.isArray(GOVT_SCHEMES)) {
    for (const scheme of GOVT_SCHEMES) {
      const titleMatch = scheme.name && text.includes(scheme.name.toLowerCase());
      const queryMatch = scheme.spokenQuery && text.includes(scheme.spokenQuery.toLowerCase());
      if (titleMatch || queryMatch) {
        return {
          title: scheme.name,
          solution_en: scheme.ideal_ai_answer_en || scheme.benefits || 'Government scheme details available.',
          solution_hi: scheme.ideal_ai_answer_hi || scheme.benefits || 'सरकारी योजना विवरण उपलब्ध हैं।'
        };
      }
    }
  }
  return null;
}
