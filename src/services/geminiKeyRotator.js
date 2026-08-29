import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GeminiKeyRotator — Robust multi-key rotation and model failover engine.
 * Supports Vercel serverless, Node.js process.env, and Vite import.meta.env.
 */
class GeminiKeyRotator {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.keyCooldowns = new Map(); // key -> cooldown expiry timestamp
    this.initializeKeys();
  }

  initializeKeys() {
    let rawKeys = '';

    if (typeof process !== 'undefined' && process && process.env) {
      rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    if (!rawKeys && typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      rawKeys = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEYS || '';
    }

    if (rawKeys) {
      this.keys = rawKeys
        .split(',')
        .map(k => k.replace(/["']/g, '').trim())
        .filter(k => k.length > 10);
    }

    // Deduplicate keys
    this.keys = [...new Set(this.keys)];
    console.log(`[GeminiKeyRotator] Initialized with ${this.keys.length} valid API key(s).`);
  }

  setKeys(keysArray) {
    if (Array.isArray(keysArray) && keysArray.length > 0) {
      this.keys = [...new Set(keysArray.map(k => k.replace(/["']/g, '').trim()).filter(k => k.length > 10))];
      this.currentIndex = 0;
      this.keyCooldowns.clear();
      console.log(`[GeminiKeyRotator] Keys updated: ${this.keys.length} key(s) available.`);
    }
  }

  getActiveKey() {
    if (this.keys.length === 0) {
      this.initializeKeys();
    }
    if (this.keys.length === 0) return null;

    const now = Date.now();
    let attempts = 0;

    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];
      const cooldownUntil = this.keyCooldowns.get(key) || 0;

      if (now >= cooldownUntil) {
        return { key, index: this.currentIndex };
      }

      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }

    // If all keys are in cooldown, clear expired and return first key
    this.keyCooldowns.clear();
    return { key: this.keys[0], index: 0 };
  }

  markKeyFailed(key, errorMessage) {
    const msg = (errorMessage || '').toLowerCase();
    const isRateLimitOrQuota =
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota_exceeded') ||
      msg.includes('403') ||
      msg.includes('api_key_invalid');

    // 1-minute cooldown for rate limits, 15s for temporary errors
    const cooldownMs = isRateLimitOrQuota ? 60000 : 15000;
    this.keyCooldowns.set(key, Date.now() + cooldownMs);

    const maskedKey = key.length > 8
      ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
      : '***';
    console.warn(
      `[GeminiKeyRotator] Key ${maskedKey} (Index ${this.currentIndex}) temporarily cooling down (${errorMessage}).`
    );

    if (this.keys.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
  }

  async executeWithRotation(systemPrompt, userPrompt) {
    if (this.keys.length === 0) {
      this.initializeKeys();
    }

    if (this.keys.length === 0) {
      console.warn('[GeminiKeyRotator] No API keys configured.');
      return null;
    }

    let attempts = 0;
    const maxAttempts = Math.min(this.keys.length, 5);

    // List of reliable working Gemini models
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    while (attempts < maxAttempts) {
      const active = this.getActiveKey();
      if (!active || !active.key) break;

      const { key, index } = active;
      let keySuccess = false;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: modelName });
          const fullPrompt = `${systemPrompt}\n\nUser Query: "${userPrompt}"`;

          const response = await model.generateContent(fullPrompt);
          const text = response.response.text();

          if (text && text.trim()) {
            keySuccess = true;
            return {
              text,
              keyIndexUsed: index,
              totalKeys: this.keys.length,
              modelUsed: modelName
            };
          }
        } catch (err) {
          lastError = err;
          const errStr = (err.message || '').toLowerCase();

          // If model is not found (404/not supported), continue trying next model without failing the key
          if (errStr.includes('404') || errStr.includes('not found') || errStr.includes('unsupported')) {
            continue;
          }

          // If key is invalid or rate limited, break out of models to rotate key
          if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('403') || errStr.includes('api_key_invalid')) {
            break;
          }
        }
      }

      if (!keySuccess) {
        attempts++;
        this.markKeyFailed(key, lastError ? lastError.message : 'Model generation failed');
      }
    }

    console.warn('[GeminiKeyRotator] All available Gemini keys/models failed.');
    return null;
  }
}

export const geminiRotator = new GeminiKeyRotator();
