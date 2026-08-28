import { geminiRotator } from './geminiKeyRotator.js';

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
10. trust_note: Explain clearly why human/Kirana node review is needed (or say "Auto-verified" if not high stakes).
11. actionable_steps: Array of 2-3 short, practical bullet points.

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
  "actionable_steps": ["step 1", "step 2"]
}
`;

export async function processVoiceQuery(queryText, communityIntel = [], weatherData = null, dialect = null) {
  // Server-side input sanitization
  const safeQuery = sanitizeInput(queryText);
  if (!safeQuery) {
    throw new Error('Invalid or empty query after sanitization.');
  }

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

  const systemContext = `${SYSTEM_PROMPT}\n\nContext:\n${intelContext}\n${weatherContext}${dialectContext ? '\n' + dialectContext : ''}`;

  const rotatedResult = await geminiRotator.executeWithRotation(systemContext, safeQuery);

  if (rotatedResult && rotatedResult.text) {
    try {
      const cleanJson = rotatedResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        apiKeyIndexUsed: rotatedResult.keyIndexUsed,
        modelUsed: rotatedResult.modelUsed
      };
    } catch (err) {
      // Don't leak parse details to API response — just rethrow a clean message
      throw new Error('AI response could not be parsed. Please try again.');
    }
  }

  throw new Error('AI service temporarily unavailable. Please try again in a moment.');
}

/**
 * Low-level Rotated Gemini Response Generator for AI Orchestrator
 */
export async function getRotatedGeminiResponse(promptText) {
  return await geminiRotator.executeWithRotation("You are LokVani AI agricultural expert assistant.", promptText);
}
