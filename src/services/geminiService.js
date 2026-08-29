import { geminiRotator } from './geminiKeyRotator.js';
import { isAgriculturePredictionQuery, extractPredictionInputs, predictAgriculturePrice } from './agriMlService.js';

/**
 * Gemini AI Query Engine — SERVER-SIDE ONLY.
 * Evaluates queries, returns expanded response schema, and tags high-stakes responses.
 * Input is sanitized before building the prompt.
 */

/**
 * Sanitize input: trim, strip control characters, cap length.
 * @param {string} text
 * @returns {string}
 */
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Strip ASCII control characters (0x00-0x1F, 0x7F) except newline/tab
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, 500);
}

const SYSTEM_PROMPT = `
You are LokVani AI, an inclusive voice AI assistant for small farmers, street vendors, and artisans in India.
Analyze the user's voice query and provide accurate, helpful responses in the user's preferred dialect.

Rules:
1. short_answer_hi: 35-50 words, written for TTS playback, must FULLY answer the question — not just acknowledge it. Use simple Hindi in Devanagari script.
2. short_answer_en: Equivalent English translation (35-50 words).
3. detailed_answer_hi: 90-160 words with reasoning, context, and practical detail. This is shown as expandable text.
4. detailed_answer_en: Equivalent English translation (90-160 words).
5. confidence: "HIGH" if you have reliable data, "MEDIUM" if approximate, "LOW" if uncertain or needs verification.
6. follow_up_questions: Array of exactly 2 short, natural follow-up questions in the same language as the query.
7. domain: "GOVT_SCHEME" | "MARKET_PRICE" | "AGRI_ADVISORY" | "WEATHER"
8. is_high_stakes (boolean): TRUE only for government scheme eligibility, document applications, pesticide/chemical dosage, or loan/financial commitments. FALSE for market prices, weather, general crop tips.
9. risk_category: "FINANCIAL_ELIGIBILITY" | "PESTICIDE_SAFETY" | "FINANCIAL_LOAN" | "NONE"
11. actionable_steps: Array of 2-3 short, practical bullet points.
12. distress_score (number 0-100): Quantify the distress/damage impact level (0-30 Low, 31-60 Moderate, 61-80 High, 81-100 Critical).
13. distress_level: "CRITICAL" | "HIGH" | "MODERATE" | "LOW"
14. damage_impact_hi: Concise explanation in simple Hindi of potential crop/financial/business damage if not addressed.
15. damage_impact_en: Equivalent English explanation.

IMPORTANT: If a dialect is specified in the query context, respond in that dialect/script wherever possible.
For market price queries: use the provided community price data if available.
For weather: use the provided weather context if available.

Return ONLY valid JSON — no markdown fences, no explanations outside the JSON:
{
  "short_answer_hi": "string (35-50 words)",
  "short_answer_en": "string (35-50 words)",
  "detailed_answer_hi": "string (90-160 words)",
  "detailed_answer_en": "string (90-160 words)",
  "confidence": "HIGH | MEDIUM | LOW",
  "follow_up_questions": ["question 1", "question 2"],
  "domain": "GOVT_SCHEME | MARKET_PRICE | AGRI_ADVISORY | WEATHER",
  "is_high_stakes": false,
  "risk_category": "FINANCIAL_ELIGIBILITY | PESTICIDE_SAFETY | FINANCIAL_LOAN | NONE",
  "trust_note": "string",
  "actionable_steps": ["step 1", "step 2"],
  "distress_score": 75,
  "distress_level": "CRITICAL | HIGH | MODERATE | LOW",
  "damage_impact_hi": "string",
  "damage_impact_en": "string"
}
`;

export async function processVoiceQuery(queryText, communityIntel = [], weatherData = null, dialect = null, conversationHistory = []) {
  // Server-side input sanitization
  const safeQuery = sanitizeInput(queryText);
  if (!safeQuery) {
    throw new Error('Invalid or empty query after sanitization.');
  }

  // Build prior multi-turn conversation context
  const historyContext = Array.isArray(conversationHistory) && conversationHistory.length > 0
    ? `\nPrior Conversation Context in this chat session:\n${conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'LokVani AI'}: ${sanitizeInput(m.text)}`).join('\n')}\nUse this context to accurately resolve follow-up references (e.g. "it", "that crop", "that scheme", "how much", "where").`
    : '';

  // Build community intel context
  const intelContext = Array.isArray(communityIntel) && communityIntel.length > 0
    ? `Recent community market reports: ${communityIntel.map(i => `${i.item}: ₹${i.price}/${i.unit || 'kg'} at ${i.location}`).join(', ')}.`
    : 'No recent community market reports available.';

  const weatherContext = weatherData
    ? `Live Weather for ${weatherData.city || 'Azamgarh'}: Temp ${weatherData.temp}°C, Condition: ${weatherData.condition}, Precipitation: ${weatherData.precipitation}mm. Advisory: ${weatherData.advisory_en || ''}`
    : 'No live weather telemetry available.';

  const dialectContext = dialect && dialect !== 'hi' && dialect !== 'en'
    ? `User's preferred dialect: ${dialect}. Respond in that dialect/script as closely as possible.`
    : '';

  // Check if query is an Agriculture Price Prediction request
  let mlPredictionContext = '';
  if (isAgriculturePredictionQuery(safeQuery)) {
    try {
      const extractedInputs = extractPredictionInputs(safeQuery, weatherData?.city || 'Azamgarh');
      const mlResult = predictAgriculturePrice(extractedInputs);
      if (mlResult && mlResult.is_prediction) {
        mlPredictionContext = `\nAgriculture ML Model Prediction Context (Trained Joblib Model):
Estimated Price: ₹${mlResult.predicted_price}/${mlResult.unit || 'quintal'}
Estimated Range: ₹${mlResult.lower_estimate} - ₹${mlResult.upper_estimate} ${mlResult.currency || 'INR'}
Model Confidence: ${mlResult.model_confidence}
Warning: ${mlResult.warning}
CRITICAL INSTRUCTION: Explicitly state that this is an ESTIMATED ML MODEL PREDICTION based on weather/soil parameters and NOT a verified live mandi price.`;
      }
    } catch (mlErr) {
      console.warn('[geminiService] Agriculture ML prediction context error:', mlErr.message);
    }
  }

  const systemContext = `${SYSTEM_PROMPT}\n\nContext:\n${historyContext}\n${intelContext}\n${weatherContext}${mlPredictionContext}${dialectContext ? '\n' + dialectContext : ''}`;

  const rotatedResult = await geminiRotator.executeWithRotation(systemContext, safeQuery);

  if (rotatedResult && rotatedResult.text) {
    try {
      let rawText = rotatedResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        rawText = rawText.substring(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(rawText);
      return {
        ...parsed,
        apiKeyIndexUsed: rotatedResult.keyIndexUsed,
        modelUsed: rotatedResult.modelUsed
      };
    } catch (err) {
      console.warn('[geminiService] JSON parse error, returning fallback structure:', err.message);
      return {
        short_answer_hi: rotatedResult.text.slice(0, 300),
        short_answer_en: rotatedResult.text.slice(0, 300),
        detailed_answer_hi: rotatedResult.text,
        detailed_answer_en: rotatedResult.text,
        confidence: 'MEDIUM',
        follow_up_questions: ['पुनः प्रयास करें / Try again', 'मंडी भाव देखें / Check mandi rates'],
        domain: 'AGRI_ADVISORY',
        is_high_stakes: false,
        risk_category: 'NONE',
        trust_note: 'Direct AI Text Response',
        actionable_steps: ['जानकारी की पुष्टि करें / Verify information.'],
        distress_score: 0,
        distress_level: 'LOW',
        damage_impact_hi: 'सामान्य जानकारी।',
        damage_impact_en: 'General advisory.',
        apiKeyIndexUsed: rotatedResult.keyIndexUsed,
        modelUsed: rotatedResult.modelUsed
      };
    }
  }

  throw new Error('AI service temporarily unavailable.');
}

/**
 * Low-level Rotated Gemini Response Generator for AI Orchestrator
 */
export async function getRotatedGeminiResponse(promptText) {
  return await geminiRotator.executeWithRotation("You are LokVani AI agricultural expert assistant.", promptText);
}
