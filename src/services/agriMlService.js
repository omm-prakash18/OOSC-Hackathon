/**
 * agriMlService.js
 * Isolated Service Bridge for LokVani AI Agriculture Machine Learning Model.
 *
 * Provides:
 * - isAgriculturePredictionQuery(text): Intent detection for price prediction/forecasting queries.
 * - predictAgriculturePrice(params): Executes trained Joblib model safely via Python CLI interface.
 * - extractPredictionInputs(text, userLocation): Extracts query parameters without inventing missing values.
 */

import { execFileSync } from 'child_process';

/**
 * Detects if a user query is specifically asking for an agriculture PRICE PREDICTION/ESTIMATE.
 * Returns false for ordinary questions ("What is Kharif?"), live mandi lookups ("What is today's rice price?"),
 * and general advice.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isAgriculturePredictionQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // Mandatory prediction intent indicators
  const predictionTriggers = [
    'predict', 'prediction', 'forecast', 'estimate', 'expected price', 'future price',
    'sambhavit', 'bhavishya', 'aage ka rate', 'aage ka bhav', 'kya rate hoga', 'kya bhav hoga',
    'based on rainfall', 'based on soil', 'weather and soil', 'mandi rate forecast'
  ];

  const hasPredictionTrigger = predictionTriggers.some(kw => lower.includes(kw));
  
  // Exclude explicit current/live market queries unless prediction is asked
  if (lower.includes('today') || lower.includes('aaj ka') || lower.includes('current price')) {
    if (!lower.includes('predict') && !lower.includes('estimate') && !lower.includes('forecast')) {
      return false;
    }
  }

  return hasPredictionTrigger;
}

/**
 * Extract available agricultural input parameters from natural language user query.
 * Does NOT invent missing dataset fields.
 *
 * @param {string} text
 * @param {string} defaultLocation
 * @returns {object}
 */
export function extractPredictionInputs(text, defaultLocation = 'Uttar Pradesh') {
  const lower = (text || '').toLowerCase();
  const inputs = {};

  // Crop detection
  if (lower.includes('potato') || lower.includes('aloo') || lower.includes('आलू')) inputs.crop = 'Potato';
  else if (lower.includes('onion') || lower.includes('pyaaz') || lower.includes('प्याज़') || lower.includes('प्याज')) inputs.crop = 'Onion';
  else if (lower.includes('wheat') || lower.includes('gehun') || lower.includes('गेहूं')) inputs.crop = 'Wheat';
  else if (lower.includes('tomato') || lower.includes('tamatar') || lower.includes('टमाटर')) inputs.crop = 'Tomato';
  else if (lower.includes('rice') || lower.includes('chawal') || lower.includes('dhan') || lower.includes('धान')) inputs.crop = 'Rice';

  // Location / State extraction
  if (lower.includes('west bengal')) inputs.location = 'West Bengal';
  else if (lower.includes('uttar pradesh') || lower.includes('up')) inputs.location = 'Uttar Pradesh';
  else if (lower.includes('maharashtra')) inputs.location = 'Maharashtra';
  else if (lower.includes('rajasthan')) inputs.location = 'Rajasthan';
  else if (lower.includes('bihar')) inputs.location = 'Bihar';
  else if (lower.includes('punjab')) inputs.location = 'Punjab';
  else if (lower.includes('haryana')) inputs.location = 'Haryana';
  else if (defaultLocation) inputs.location = defaultLocation.split(',')[0].trim();

  // Soil Type extraction
  if (lower.includes('alluvial')) inputs.soil_type = 'Alluvial';
  else if (lower.includes('loamy') || lower.includes('loam')) inputs.soil_type = 'Loamy';
  else if (lower.includes('black')) inputs.soil_type = 'Black';
  else if (lower.includes('red')) inputs.soil_type = 'Red';
  else if (lower.includes('clayey') || lower.includes('clay')) inputs.soil_type = 'Clayey';

  // Season extraction
  if (lower.includes('kharif')) inputs.season = 'Kharif';
  else if (lower.includes('rabi')) inputs.season = 'Rabi';
  else if (lower.includes('zaid')) inputs.season = 'Zaid';

  // Numerical parameters extraction using regex
  const phMatch = lower.match(/(?:ph|soil ph)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/);
  if (phMatch && phMatch[1]) inputs.soil_ph = parseFloat(phMatch[1]);

  const rainMatch = lower.match(/(?:rainfall|rain)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/);
  if (rainMatch && rainMatch[1]) inputs.rainfall = parseFloat(rainMatch[1]);

  const tempMatch = lower.match(/(?:temp|temperature)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:°c|c)?/);
  if (tempMatch && tempMatch[1]) inputs.temperature = parseFloat(tempMatch[1]);

  const humMatch = lower.match(/(?:humidity)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*%?/);
  if (humMatch && humMatch[1]) inputs.humidity = parseFloat(humMatch[1]);

  const windMatch = lower.match(/(?:wind|wind speed)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/);
  if (windMatch && windMatch[1]) inputs.wind_speed = parseFloat(windMatch[1]);

  const moistureMatch = lower.match(/(?:moisture|soil moisture)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/);
  if (moistureMatch && moistureMatch[1]) inputs.soil_moisture = parseFloat(moistureMatch[1]);

  return inputs;
}

/**
 * Execute prediction against trained Joblib ML model via agri_ml.api python bridge.
 * Includes complete error isolation (never throws or crashes backend).
 *
 * @param {object} inputParams
 * @returns {object}
 */
export function predictAgriculturePrice(inputParams = {}) {
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const jsonStr = JSON.stringify(inputParams);

    const output = execFileSync(pythonCmd, ['-m', 'agri_ml.api', jsonStr], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 8000
    });

    const parsed = JSON.parse(output.trim());
    if (parsed.success && parsed.data) {
      return {
        is_prediction: true,
        ...parsed.data
      };
    }

    return {
      is_prediction: false,
      error: parsed.error || 'Prediction model returned unparseable output.'
    };
  } catch (err) {
    console.warn('[agriMlService] Agriculture ML prediction fallback (model unavailable or error):', err.message);
    return {
      is_prediction: false,
      error: 'Agriculture prediction is temporarily unavailable.'
    };
  }
}
