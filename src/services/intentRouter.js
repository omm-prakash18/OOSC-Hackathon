/**
 * LokVani AI — Intent Router
 * Classifies multi-lingual voice queries into actionable intents and extracts structured entities.
 */

export const INTENTS = {
  WEATHER: 'WEATHER',
  MANDI_PRICE: 'MANDI_PRICE',
  SOIL_ADVISORY: 'SOIL_ADVISORY',
  CROP_PREDICTION: 'CROP_PREDICTION',
  SCHEME_QUERY: 'SCHEME_QUERY',
  DISTRESS_CHECK: 'DISTRESS_CHECK',
  GENERAL_AGRICULTURE: 'GENERAL_AGRICULTURE'
};

const CROP_KEYWORDS = {
  wheat: ['wheat', 'gehun', 'gehu', 'गेहूं'],
  rice: ['rice', 'paddy', 'dhan', 'chawal', 'धान', 'चावल'],
  tomato: ['tomato', 'tamatar', 'टमाटर'],
  cotton: ['cotton', 'kapas', 'कपास'],
  mustard: ['mustard', 'sarson', 'सरसों'],
  sugarcane: ['sugarcane', 'ganna', 'गन्ना'],
  maize: ['maize', 'makka', 'मक्का'],
  potato: ['potato', 'aalu', 'aalo', 'आलू'],
  onion: ['onion', 'pyaz', 'प्याज']
};

const SOIL_KEYWORDS = {
  sandy: ['sandy', 'balui', 'रेतीली', 'बलुई'],
  loamy: ['loamy', 'domat', 'दोमट'],
  black: ['black', 'kali', 'काली'],
  red: ['red', 'laal', 'लाल'],
  clayey: ['clayey', 'chikni', 'चिकनी']
};

const DISTRICT_LIST = [
  'Azamgarh', 'Varanasi', 'Lucknow', 'Kanpur', 'Gorakhpur', 'Prayagraj',
  'Bareilly', 'Agra', 'Meerut', 'Patna', 'Bhopal', 'Jaipur'
];

/**
 * Route raw user query to specific intent & structured entities
 */
export function classifyIntent(queryText = '', defaultLocation = 'Azamgarh, UP') {
  if (typeof queryText !== 'string') queryText = '';
  const text = queryText.toLowerCase().trim();

  let intent = INTENTS.GENERAL_AGRICULTURE;

  // Weather Intent
  if (
    text.includes('weather') || text.includes('rain') || text.includes('mausam') ||
    text.includes('barish') || text.includes('मौसम') || text.includes('बारिश') ||
    text.includes('temperature') || text.includes('tapman')
  ) {
    intent = INTENTS.WEATHER;
  }
  // Mandi Price Intent
  else if (
    text.includes('mandi') || text.includes('rate') || text.includes('bhav') ||
    text.includes('price') || text.includes('भाव') || text.includes('मंडी') ||
    text.includes('कीमत') || text.includes('dam')
  ) {
    intent = INTENTS.MANDI_PRICE;
  }
  // Crop Recommendation & Suitability Intent
  else if (
    text.includes('kaunsi fasal') || text.includes('which crop') || text.includes('crop prediction') ||
    text.includes('fasal lagayein') || text.includes('fasal ugayein') || text.includes('suitability') ||
    text.includes('कौन सी फसल') || text.includes('फसल लगाएं') || text.includes('crop recommendation')
  ) {
    intent = INTENTS.CROP_PREDICTION;
  }
  // Soil & Fertilizer Intent
  else if (
    text.includes('soil') || text.includes('mitti') || text.includes('khad') ||
    text.includes('fertilizer') || text.includes('dap') || text.includes('urea') ||
    text.includes('npk') || text.includes('मिट्टी') || text.includes('खाद') || text.includes('ph')
  ) {
    intent = INTENTS.SOIL_ADVISORY;
  }
  // Scheme Intent
  else if (
    text.includes('scheme') || text.includes('yojana') || text.includes('kisan') ||
    text.includes('kisht') || text.includes('subsidy') || text.includes('योजना') || text.includes('किश्त') ||
    text.includes('pm') || text.includes('svanidhi') || text.includes('bima') || text.includes('kcc')
  ) {
    intent = INTENTS.SCHEME_QUERY;
  }
  // Distress Check Intent
  else if (
    text.includes('sukha') || text.includes('drought') || text.includes('crop damage') ||
    text.includes('loss') || text.includes('loan due') || text.includes('kharab') || text.includes('सूखा')
  ) {
    intent = INTENTS.DISTRESS_CHECK;
  }

  // Extract Crop
  let targetCrop = null;
  for (const [cropKey, aliases] of Object.entries(CROP_KEYWORDS)) {
    if (aliases.some(alias => text.includes(alias))) {
      targetCrop = cropKey;
      break;
    }
  }

  // Extract Soil Type
  let soilType = null;
  for (const [soilKey, aliases] of Object.entries(SOIL_KEYWORDS)) {
    if (aliases.some(alias => text.includes(alias))) {
      soilType = soilKey;
      break;
    }
  }

  // Extract Location
  let location = defaultLocation;
  for (const district of DISTRICT_LIST) {
    if (text.includes(district.toLowerCase())) {
      location = `${district}, UP`;
      break;
    }
  }

  return {
    intent,
    entities: {
      targetCrop,
      soilType,
      location
    }
  };
}
