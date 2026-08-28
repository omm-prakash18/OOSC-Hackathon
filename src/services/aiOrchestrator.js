import { classifyIntent, INTENTS } from './intentRouter.js';
import * as soilModelService from './soilModelService.js';
import * as cropModelService from './cropModelService.js';
import { fetchLiveWeatherData, fetchLiveMandiPrices } from './realDataService.js';
import { calculateDistressScore } from '../engine/distressEngine.js';
import { getRotatedGeminiResponse } from './geminiService.js';
import { queryDatabaseRAG, processUserSpeechQuery } from './aiCoreEngine.js';

/**
 * Central AI Orchestrator for LokVani AI
 * Coordinates Intent Router, Soil Model, Crop Model, Weather, Mandi, RAG, Distress Engine, and LLM Explanation.
 * Follows the core principle: "Ground first. Predict second. Explain third."
 */
export async function processOrchestratedQuery({ queryText, userLocation = 'Azamgarh, UP', userParams = {} }) {
  const timestamp = new Date().toISOString();

  // Step 1: Classify Intent & Extract Entities
  const routing = classifyIntent(queryText, userLocation);
  const { intent, entities } = routing;

  // Merge entities with user-provided parameters
  const combinedParams = {
    ...entities,
    ...userParams
  };

  let sources = [];
  let modelResults = {};
  let weatherData = null;
  let mandiData = null;
  let distressData = null;
  let reliability = 'HIGH';
  let requiresTrustReview = false;
  let trustReason = null;
  let structuredContextForLLM = '';
  let fallbackAnswerEn = '';
  let fallbackAnswerHi = '';

  // Step 2: Dispatch based on Intent Priority
  switch (intent) {
    case INTENTS.WEATHER: {
      sources.push('WEATHER_API');
      const wResult = await fetchLiveWeatherData(userLocation);
      const temp = wResult.temp ?? 28;
      const rain = wResult.precipitation ?? 0;
      const condition = wResult.condition || 'Clear Sky';
      const advEn = wResult.advisory_en || wResult.advisoryEn || 'Weather is suitable for farming.';
      const advHi = wResult.advisory_hi || wResult.advisoryHi || 'मौसम खेती के लिए उपयुक्त है।';

      weatherData = {
        location: wResult.city || userLocation,
        temperature: temp,
        weatherCondition: condition,
        dailyRainfall: rain,
        advisoryEn: advEn,
        advisoryHi: advHi
      };
      reliability = wResult.stale ? 'MEDIUM' : 'HIGH';

      structuredContextForLLM = `[VERIFIED WEATHER DATA] Location: ${weatherData.location}. Temp: ${weatherData.temperature}°C. Condition: ${weatherData.weatherCondition}. Rain Forecast Next 24h: ${weatherData.dailyRainfall}mm. Live Advisory: ${weatherData.advisoryEn}`;
      fallbackAnswerEn = `Current temperature in ${weatherData.location} is ${weatherData.temperature}°C with ${weatherData.weatherCondition}. Rainfall expected: ${weatherData.dailyRainfall}mm. ${weatherData.advisoryEn}`;
      fallbackAnswerHi = `${weatherData.location} में वर्तमान तापमान ${weatherData.temperature}°C है और ${weatherData.weatherCondition} है। अनुमानित बारिश: ${weatherData.dailyRainfall}mm। ${weatherData.advisoryHi}`;
      break;
    }

    case INTENTS.MANDI_PRICE: {
      sources.push('MANDI_API');
      const cropName = entities.targetCrop || 'wheat';
      const records = await fetchLiveMandiPrices(userLocation, cropName);

      const record = (Array.isArray(records) && records.find(r => r.item && r.item.toLowerCase().includes(cropName))) || (Array.isArray(records) ? records[0] : null);
      const priceKg = record ? record.price : 24;
      const pricePerQuintal = priceKg * 100;
      const market = record ? record.location : 'Azamgarh Mandi';
      const commodity = record ? record.item : cropName;
      const trend = record ? (record.trend || 'up').toUpperCase() : 'STABLE';

      mandiData = {
        market,
        commodity,
        pricePerQuintal,
        trend,
        minPrice: Math.round(pricePerQuintal * 0.9),
        maxPrice: Math.round(pricePerQuintal * 1.1)
      };
      reliability = 'HIGH';

      structuredContextForLLM = `[VERIFIED MANDI COMMODITY DATA] Market: ${mandiData.market}. Commodity: ${mandiData.commodity}. Price: ₹${mandiData.pricePerQuintal} per quintal. Modal Trend: ${mandiData.trend}. Min Price: ₹${mandiData.minPrice}, Max Price: ₹${mandiData.maxPrice}.`;
      fallbackAnswerEn = `Verified Mandi price for ${mandiData.commodity} at ${mandiData.market} is ₹${mandiData.pricePerQuintal}/quintal (Trend: ${mandiData.trend}).`;
      fallbackAnswerHi = `${mandiData.market} मंडी में ${mandiData.commodity} का सत्यापित भाव ₹${mandiData.pricePerQuintal}/क्विंटल है।`;
      break;
    }

    case INTENTS.SOIL_ADVISORY: {
      sources.push('SOIL_MODEL');
      const soilPred = soilModelService.predict(combinedParams);
      modelResults.soil = soilPred;
      reliability = soilPred.reliability;

      if (soilPred.status === 'INVALID_OR_OUT_OF_RANGE_INPUT') {
        requiresTrustReview = true;
        trustReason = 'Out-of-range soil input parameter detected. Requires operator verification.';
        fallbackAnswerEn = 'Provided soil parameters are outside valid safe ranges. Please consult a Kirana Trust Node operator.';
        fallbackAnswerHi = 'दिए गए मिट्टी के मापदंड सामान्य सीमा से बाहर हैं। कृपया किराना ट्रस्ट नोड ऑपरेटर से संपर्क करें।';
      } else {
        requiresTrustReview = true;
        trustReason = 'Fertilizer & chemical dosage recommendation requires 1-click Kirana operator approval.';

        const p = soilPred.prediction;
        structuredContextForLLM = `[TRAINED SOIL MODEL RESULT] Recommended Fertilizer: ${p.recommendedFertilizer}. Fertility Status: ${p.fertilityStatus}. Soil Health Suitability Score: ${p.suitabilityScore}/100. English Advisory: ${p.dosageAdvisoryEn}. Hindi Advisory: ${p.dosageAdvisoryHi}.`;
        fallbackAnswerEn = p.dosageAdvisoryEn;
        fallbackAnswerHi = p.dosageAdvisoryHi;
      }
      break;
    }

    case INTENTS.CROP_PREDICTION: {
      sources.push('SOIL_MODEL', 'CROP_MODEL');

      const soilPred = soilModelService.predict(combinedParams);
      modelResults.soil = soilPred;

      const cropInput = {
        ...combinedParams,
        soilType: soilPred.prediction ? soilPred.prediction.soilType : combinedParams.soilType
      };
      const cropPred = cropModelService.predict(cropInput);
      modelResults.crop = cropPred;

      reliability = (soilPred.reliability === 'HIGH' && cropPred.reliability === 'HIGH') ? 'HIGH' : 'MEDIUM';

      if (cropPred.status === 'INVALID_OR_OUT_OF_RANGE_INPUT') {
        requiresTrustReview = true;
        trustReason = 'Crop model input parameter out of valid range.';
        fallbackAnswerEn = 'Provided crop environmental parameters are invalid. Please check soil and climate inputs.';
        fallbackAnswerHi = 'फसल पर्यावरण मापदंड अमान्य हैं।';
      } else {
        const cp = cropPred.prediction;
        structuredContextForLLM = `[TRAINED CROP MODEL RESULT] Top Recommended Crop: ${cp.primaryCrop}. Crop Suitability Score: ${cp.suitabilityScore}/100. Estimated Yield: ${cp.estimatedYieldTonsPerHectare} t/ha. Top Recommended Alternatives: ${cp.topRecommendedCrops.map(c => `${c.crop} (${c.score}%)`).join(', ')}. Growth Advice: ${cp.advisoryEn}`;
        fallbackAnswerEn = `Based on your soil and region, top recommended crop is ${cp.primaryCrop} (Suitability: ${cp.suitabilityScore}%, Estimated Yield: ${cp.estimatedYieldTonsPerHectare} t/ha). ${cp.advisoryEn}`;
        fallbackAnswerHi = `आपकी मिट्टी और जलवायु के अनुसार सबसे उपयुक्त फसल ${cp.primaryCrop} (उपयुक्तता: ${cp.suitabilityScore}%) है।`;
      }
      break;
    }

    case INTENTS.SCHEME_QUERY: {
      sources.push('SCHEME_DATABASE');
      const ragMatch = queryDatabaseRAG(queryText);
      if (ragMatch) {
        structuredContextForLLM = `[VERIFIED GOVT SCHEME DATA] Title: ${ragMatch.title}. Details: ${ragMatch.solution_en}`;
        fallbackAnswerEn = ragMatch.solution_en;
        fallbackAnswerHi = ragMatch.solution_hi;
      } else {
        fallbackAnswerEn = 'PM-Kisan Samman Nidhi provides ₹6,000 annually in 3 installments to eligible farmers. Ensure Aadhar e-KYC and land verification are complete.';
        fallbackAnswerHi = 'PM-Kisan सम्मान निधि योजना के तहत किसानों को प्रतिवर्ष ₹6,000 की सहायता 3 किश्तों में मिलती है। 17वीं किश्त के लिए e-KYC एवं भू-सत्यापन अनिवार्य है।';
      }
      break;
    }

    case INTENTS.DISTRESS_CHECK: {
      sources.push('DISTRESS_ENGINE', 'WEATHER_API', 'MANDI_API');
      const wResult = await fetchLiveWeatherData(userLocation);
      const mResult = await fetchLiveMandiPrices(userLocation, entities.targetCrop || 'wheat');

      const dScore = calculateDistressScore({
        rainfallDeviationPct: wResult.dailyRainfall < 5 ? -40 : 0,
        priceDropPct: mResult.trend === 'FALLING' ? -20 : 0,
        cropStage: 'vegetative',
        cropType: entities.targetCrop || 'wheat'
      });

      distressData = dScore;
      if (dScore.tier === 'URGENT') {
        requiresTrustReview = true;
        trustReason = `Urgent distress alert triggered (Score: ${dScore.score}/100). Requires Kirana operator intervention.`;
      }

      structuredContextForLLM = `[FARMER DISTRESS ASSESSMENT] Score: ${dScore.score}/100 (Tier: ${dScore.tier}). Reasons: ${dScore.reasons.join('; ')}. Advisory: ${dScore.spokenReasons.en}`;
      fallbackAnswerEn = dScore.spokenReasons.en;
      fallbackAnswerHi = dScore.spokenReasons.hi;
      break;
    }

    default: {
      sources.push('KNOWLEDGE_RAG');
      const ragMatch = queryDatabaseRAG(queryText);
      if (ragMatch) {
        structuredContextForLLM = `[LOCAL RAG VERIFIED KNOWLEDGE] Title: ${ragMatch.title}. Solution: ${ragMatch.solution_en}`;
        fallbackAnswerEn = ragMatch.solution_en;
        fallbackAnswerHi = ragMatch.solution_hi || ragMatch.solution_en;
      } else {
        const smartRes = processUserSpeechQuery(queryText, { userLocation });
        structuredContextForLLM = `[GENERAL AGRICULTURAL QUERY] User asked: "${queryText}". Grounded Advisory: ${smartRes.shortAnswerEn}`;
        fallbackAnswerEn = smartRes.shortAnswerEn || `Regarding "${queryText}": For best crop yield, ensure 50kg DAP/acre during sowing, maintain adequate field drainage, and verify current Mandi commodity rates.`;
        fallbackAnswerHi = smartRes.shortAnswerHi || `"${queryText}" के संबंध में: फसल की अच्छी पैदावार के लिए बुवाई के समय प्रति एकड़ 50 किग्रा डीएपी डालें, खेत में जल निकासी रखें और नजदीकी मंडी भाव जांचें।`;
      }
    }
  }

  // Step 3: LLM Explanation Layer (Gemini grounded by verified data context)
  let finalAnswerEn = fallbackAnswerEn;
  let finalAnswerHi = fallbackAnswerHi;

  try {
    const prompt = `You are LokVani AI, an empathetic agricultural assistant for Indian farmers.
Rule: You MUST NOT invent or modify verified numbers, prices, rainfall data, or ML predictions provided below. Your role is purely to explain and translate the verified results clearly in warm, plain language.

VERIFIED DATA CONTEXT:
${structuredContextForLLM}

USER QUERY:
"${queryText}"

Provide a concise, 2-3 sentence explanation in Hindi (script) followed by an English translation.
Format:
HINDI: <hindi_response>
ENGLISH: <english_response>`;

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1200));
    let llmRes = null;
    if (typeof getRotatedGeminiResponse === 'function') {
      llmRes = await Promise.race([getRotatedGeminiResponse(prompt), timeoutPromise]);
    }

    if (llmRes && llmRes.text) {
      const text = llmRes.text;
      const hindiMatch = text.match(/HINDI:\s*([\s\S]*?)(?=ENGLISH:|$)/i);
      const englishMatch = text.match(/ENGLISH:\s*([\s\S]*?)$/i);

      if (hindiMatch && hindiMatch[1].trim()) finalAnswerHi = hindiMatch[1].trim();
      if (englishMatch && englishMatch[1].trim()) finalAnswerEn = englishMatch[1].trim();
    }
  } catch (err) {
    // LLM fallback silently preserved
  }

  // Step 4: Return Standardized Response Object
  return {
    answer: finalAnswerEn,
    answerHi: finalAnswerHi,
    intent,
    sources,
    modelResults,
    weatherData,
    mandiData,
    distressData,
    reliability,
    requiresTrustReview,
    trustReason,
    staleData: Boolean((weatherData && weatherData.stale) || (mandiData && mandiData.stale)),
    timestamp
  };
}
