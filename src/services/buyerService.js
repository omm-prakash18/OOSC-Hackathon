/**
 * buyerService.js
 * Verified Buyer & FPO Network Service
 *
 * Uses backend proxy (/api/buyers) to prevent browser CORS blocks on government APIs.
 * Falls back cleanly to DEMO_BUYERS if backend is offline.
 */

export const DEMO_BUYERS = [
  { id: 'buyer_001', name: 'FreshKart Foods Pvt. Ltd.',   location: 'Lucknow, UP',    distance: '62 km',  commodities: ['Tomato', 'Onion', 'Potato', 'Garlic'],   offerPrice: 2400, offerUnit: 'quintal', badge: 'FPO Partner',       contactInfo: '***-***-7890' },
  { id: 'buyer_002', name: 'Azamgarh APMC Warehouse',     location: 'Azamgarh, UP',   distance: '5 km',   commodities: ['Wheat', 'Paddy', 'Maize', 'Bajra'],      offerPrice: 2310, offerUnit: 'quintal', badge: 'APMC Registered',   contactInfo: '***-***-4421' },
  { id: 'buyer_003', name: 'Kisaan Connect Cooperative',  location: 'Varanasi, UP',   distance: '88 km',  commodities: ['Arhar', 'Moong', 'Urad', 'Chana'],       offerPrice: 7600, offerUnit: 'quintal', badge: 'FPO Partner',       contactInfo: '***-***-3312' },
  { id: 'buyer_004', name: 'Spice Route Exports',         location: 'Gorakhpur, UP',  distance: '110 km', commodities: ['Turmeric', 'Chili', 'Coriander', 'Sesame'], offerPrice: null, offerUnit: 'quintal', badge: 'Export Certified',  contactInfo: '***-***-0065' },
  { id: 'buyer_005', name: 'Agro-Nutrient Foods',         location: 'Allahabad, UP',  distance: '145 km', commodities: ['Soybean', 'Mustard', 'Sunflower'],        offerPrice: 4950, offerUnit: 'quintal', badge: 'Verified Buyer',    contactInfo: '***-***-6677' },
  { id: 'buyer_006', name: 'GrainMart Direct',            location: 'Mau, UP',        distance: '28 km',  commodities: ['Wheat', 'Paddy', 'Barley'],              offerPrice: 2290, offerUnit: 'quintal', badge: 'Verified Buyer',    contactInfo: '***-***-9801' },
];

/**
 * Fetch verified buyers from backend (/api/buyers).
 */
export async function fetchBuyers(state = 'Uttar Pradesh') {
  try {
    const res = await fetch('/api/buyers');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (_) {}

  return DEMO_BUYERS;
}
