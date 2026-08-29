/**
 * mandiService.js
 * Live Mandi Price & Commodity Intelligence Service
 *
 * Uses backend proxy (/api/intel) to prevent browser CORS blocks on government APIs.
 * Falls back cleanly to demo dataset if API is unreachable.
 */

/* ── Category mapping by commodity name ──────────────────────────────────── */
const CATEGORY_MAP = {
  tomato: 'Vegetable', onion: 'Vegetable', potato: 'Vegetable',
  tamatar: 'Vegetable', pyaaz: 'Vegetable', aloo: 'Vegetable',
  garlic: 'Vegetable', cauliflower: 'Vegetable', cabbage: 'Vegetable',
  wheat: 'Grain', gehun: 'Grain', paddy: 'Grain', rice: 'Grain',
  maize: 'Grain', bajra: 'Grain', jowar: 'Grain',
  arhar: 'Pulse', moong: 'Pulse', urad: 'Pulse', chana: 'Pulse',
  lentil: 'Pulse', masoor: 'Pulse',
  mustard: 'Oilseed', sarson: 'Oilseed', soybean: 'Oilseed',
  sunflower: 'Oilseed', groundnut: 'Oilseed',
  mango: 'Fruit', banana: 'Fruit', guava: 'Fruit', apple: 'Fruit',
  turmeric: 'Spice', chili: 'Spice', coriander: 'Spice', ginger: 'Spice',
};

export function detectCategory(commodityName) {
  const lower = (commodityName || '').toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return 'Other';
}

/* ── Static fallback data (used when backend is offline) ──────── */
export const INITIAL_MANDI_RATES = [
  { id: 'm1', item: 'Tamatar (Tomato)', price: 28, unit: 'kg',      location: 'Azamgarh Mandi',  state: 'Uttar Pradesh', trend: 'down',   category: 'Vegetable', reportedBy: 'Mandi Board', createdAt: new Date().toISOString() },
  { id: 'm2', item: 'Pyaaz (Onion)',    price: 34, unit: 'kg',      location: 'Gorakhpur Mandi', state: 'Uttar Pradesh', trend: 'stable', category: 'Vegetable', reportedBy: 'Local Farmer', createdAt: new Date().toISOString() },
  { id: 'm3', item: 'Aloo (Potato)',    price: 18, unit: 'kg',      location: 'Varanasi Mandi',  state: 'Uttar Pradesh', trend: 'up',     category: 'Vegetable', reportedBy: 'Mandi Board', createdAt: new Date().toISOString() },
  { id: 'm4', item: 'Gehun (Wheat)',    price: 2275, unit: 'quintal', location: 'Kanpur Mandi',  state: 'Uttar Pradesh', trend: 'stable', category: 'Grain',     reportedBy: 'MSP Portal', createdAt: new Date().toISOString() },
  { id: 'm5', item: 'Dhan (Paddy)',     price: 2183, unit: 'quintal', location: 'Patna Mandi',   state: 'Bihar',         trend: 'up',     category: 'Grain',     reportedBy: 'MSP Portal', createdAt: new Date().toISOString() },
  { id: 'm6', item: 'Sarson (Mustard)', price: 5450, unit: 'quintal', location: 'Jaipur Mandi',  state: 'Rajasthan',     trend: 'stable', category: 'Oilseed',   reportedBy: 'Mandi Board', createdAt: new Date().toISOString() },
  { id: 'm7', item: 'Chana (Gram)',     price: 5800, unit: 'quintal', location: 'Indore Mandi',  state: 'Madhya Pradesh', trend: 'down',  category: 'Pulse',     reportedBy: 'Mandi Board', createdAt: new Date().toISOString() },
  { id: 'm8', item: 'Kapaas (Cotton)',  price: 7120, unit: 'quintal', location: 'Rajkot Mandi',  state: 'Gujarat',       trend: 'up',     category: 'Other',     reportedBy: 'Mandi Board', createdAt: new Date().toISOString() },
];

/**
 * Fetch live mandi rates from backend endpoint (/api/intel).
 * Uses proxy to eliminate client CORS restrictions.
 */
export async function fetchLiveMandiRates(state = 'Uttar Pradesh', limit = 50) {
  // 1. Fetch from backend API route
  try {
    const res = await fetch('/api/intel');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map(item => ({
          ...item,
          category: item.category || detectCategory(item.item)
        }));
      }
    }
  } catch (_) {}

  // 2. Clean fallback
  return INITIAL_MANDI_RATES;
}
