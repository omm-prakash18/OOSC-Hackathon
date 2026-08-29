/**
 * CommunityIntel.jsx  (page-level orchestrator)
 * ──────────────────────────────────────────────────────────────────────────
 * "Local Farming Updates" page — the main hub where farmers can:
 *   • See today's crop prices from nearby markets
 *   • Find trusted buyers in their area
 *   • Get live weather for their region
 *   • Share a price they saw at the market
 *   • Read the latest news and alerts from fellow farmers
 *
 * Architecture:
 *   This component owns page-level state and data fetching.
 *   All rendering is delegated to focused sub-components in ./community/.
 *
 * Sections:
 *   1. Stats Summary Row        — Quick stats: reports, top crop, avg price
 *   2. Best Time to Sell Banner — AI-computed sale window advisory
 *   3. Search + Filter Controls — Find prices by crop name or category
 *   4. Today's Crop Prices Grid — Price cards / loading skeletons / empty state
 *   5. Buyers Near You          — Trusted local buyer contacts
 *   6. Compare Prices Table     — Min / avg / max per crop across markets
 *   7. Latest News Feed         — Crowdsourced alerts from other farmers
 *   8. Sell Together (FPO)      — Group selling to get better rates
 *   9. Transport & Storage      — Share trucks and storage space
 *  10. Trust & Safety           — Buyer ratings and complaint form
 *  11. Weather                  — Live regional weather advisory
 *
 * State is managed with useReducer for predictable, testable transitions.
 *
 * UX/UI Refactor Notes (Hackathon PR):
 *   - Page title changed from "Community Intel" → "Local Farming Updates"
 *   - All jargon removed; terminology rewritten for farmers (Class 5–8 literacy)
 *   - CTAs made action-oriented: "Share a Price", "Share Information"
 *   - Verbose subtitles shortened to one clear sentence
 *   - API provider names hidden from UI (farmers don't need to see them)
 */

import React, { useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from './community/communityTranslations.js';
import { fetchLiveMandiRates } from '../services/mandiService';
import { fetchLiveWeatherData } from '../services/realDataService';
import { fetchBuyers }          from '../services/buyerService';
import { fetchTransport, fetchStorage } from '../services/logisticsService';
import { fetchLiveNews } from '../services/newsService';
import LocationPrompt from './common/LocationPrompt.jsx';

const DISTRICT_NEIGHBORS = {
  // Uttar Pradesh
  'azamgarh': ['Mau', 'Jaunpur', 'Gorakhpur', 'Ghazipur', 'Ballia', 'Ambedkar Nagar', 'Varanasi'],
  'mau': ['Azamgarh', 'Ballia', 'Ghazipur', 'Deoria', 'Gorakhpur'],
  'gorakhpur': ['Maharajganj', 'Deoria', 'Kushinagar', 'Sant Kabir Nagar', 'Azamgarh', 'Basti'],
  'varanasi': ['Chandauli', 'Mirzapur', 'Jaunpur', 'Ghazipur', 'Bhadohi', 'Azamgarh'],
  'jaunpur': ['Varanasi', 'Azamgarh', 'Sultanpur', 'Pratapgarh', 'Prayagraj', 'Ghazipur'],
  'ghazipur': ['Varanasi', 'Ballia', 'Mau', 'Azamgarh', 'Chandauli'],
  'ballia': ['Mau', 'Ghazipur', 'Deoria', 'Bhojpur', 'Saran'],
  'lucknow': ['Barabanki', 'Unnao', 'Rae Bareli', 'Sitapur', 'Hardoi', 'Kanpur'],
  'kanpur': ['Unnao', 'Kanpur Dehat', 'Fatehpur', 'Kannauj', 'Lucknow'],
  'prayagraj': ['Kaushambi', 'Pratapgarh', 'Bhadohi', 'Mirzapur', 'Chitrakoot', 'Jaunpur'],
  'faizabad': ['Ayodhya', 'Basti', 'Ambedkar Nagar', 'Sultanpur', 'Barabanki', 'Gonda'],
  'ayodhya': ['Faizabad', 'Basti', 'Ambedkar Nagar', 'Sultanpur', 'Barabanki', 'Gonda'],
  'basti': ['Sant Kabir Nagar', 'Siddharthnagar', 'Gonda', 'Faizabad', 'Gorakhpur'],
  'agra': ['Mathura', 'Firozabad', 'Hathras', 'Etawah', 'Bharatpur'],
  'meerut': ['Ghaziabad', 'Hapur', 'Muzaffarnagar', 'Baghpat', 'Bulandshahr'],
  'bareilly': ['Badaun', 'Pilibhit', 'Shahjahanpur', 'Rampur'],
  'aligarh': ['Mathura', 'Hathras', 'Bulandshahr', 'Kasganj'],

  // Bihar
  'patna': ['Vaishali', 'Saran', 'Bhojpur', 'Jehanabad', 'Nalanda', 'Samastipur'],
  'muzaffarpur': ['Vaishali', 'Samastipur', 'Darbhanga', 'Sitamarhi', 'East Champaran'],
  'gaya': ['Jehanabad', 'Aurangabad', 'Nawada', 'Chatra', 'Patna'],
  'bhagalpur': ['Banka', 'Munger', 'Katihar', 'Khagaria', 'Purnia'],
  'darbhanga': ['Madhubani', 'Samastipur', 'Muzaffarpur', 'Saharsa'],
  'purnia': ['Katihar', 'Araria', 'Kishanganj', 'Madhepura', 'Bhagalpur'],
  'samastipur': ['Muzaffarpur', 'Darbhanga', 'Begusarai', 'Vaishali', 'Patna'],

  // Madhya Pradesh
  'indore': ['Ujjain', 'Dewas', 'Dhar', 'Khargone', 'Khandwa'],
  'bhopal': ['Sehore', 'Raisen', 'Rajgarh', 'Vidisha', 'Hoshangabad'],
  'ujjain': ['Indore', 'Dewas', 'Ratlam', 'Shajapur', 'Agar Malwa'],
  'jabalpur': ['Katni', 'Seoni', 'Mandla', 'Narsinghpur', 'Damoh'],
  'gwalior': ['Morena', 'Bhind', 'Datia', 'Shivpuri'],

  // Maharashtra
  'pune': ['Satara', 'Ahmednagar', 'Solapur', 'Thane', 'Raigad'],
  'nashik': ['Ahmednagar', 'Dhule', 'Jalgaon', 'Aurangabad', 'Palghar'],
  'nagpur': ['Wardha', 'Bhandara', 'Amravati', 'Chandrapur', 'Gondia'],
  'aurangabad': ['Jalna', 'Ahmednagar', 'Nashik', 'Beed', 'Jalgaon'],
  'kolhapur': ['Sangli', 'Satara', 'Ratnagiri', 'Belgaum'],

  // Rajasthan
  'jaipur': ['Dausa', 'Sikar', 'Tonk', 'Ajmer', 'Alwar', 'Nagaur'],
  'kota': ['Bundi', 'Baran', 'Jhalawar', 'Sawai Madhopur', 'Chittorgarh'],
  'jodhpur': ['Nagaur', 'Pali', 'Barmer', 'Jaisalmer', 'Bikaner'],
  'bikaner': ['Sriganganagar', 'Hanumangarh', 'Churu', 'Nagaur', 'Jodhpur'],

  // Punjab & Haryana
  'ludhiana': ['Jalandhar', 'Moga', 'Barnala', 'Fatehgarh Sahib', 'Rupnagar'],
  'amritsar': ['Tarn Taran', 'Gurdaspur', 'Kapurthala'],
  'karnal': ['Kurukshetra', 'Kaithal', 'Panipat', 'Yamunanagar', 'Jind'],
  'hisar': ['Fatehabad', 'Jind', 'Rohtak', 'Bhiwani'],

  // Gujarat
  'ahmedabad': ['Gandhinagar', 'Kheda', 'Anand', 'Surendranagar', 'Mehsana'],
  'surat': ['Navsari', 'Bharuch', 'Tapi', 'Valsad'],
  'rajkot': ['Morbi', 'Surendranagar', 'Jamnagar', 'Junagadh', 'Amreli'],

  // South
  'coimbatore': ['Tiruppur', 'Erode', 'Nilgiris', 'Palakkad'],
  'bangalore': ['Ramanagara', 'Tumkur', 'Kolar', 'Chikkaballapur', 'Mandya'],
  'hyderabad': ['Rangareddy', 'Medchal', 'Sangareddy', 'Nalgonda', 'Mahabubnagar'],
  'vijayawada': ['Guntur', 'Krishna', 'Eluru', 'West Godavari'],
};

const STATE_NEARBY_DISTRICTS = {
  'Uttar Pradesh': ['Azamgarh', 'Mau', 'Jaunpur', 'Gorakhpur', 'Varanasi', 'Ghazipur', 'Ballia', 'Lucknow'],
  'Bihar': ['Patna', 'Vaishali', 'Muzaffarpur', 'Gaya', 'Samastipur', 'Bhagalpur', 'Darbhanga'],
  'Madhya Pradesh': ['Indore', 'Ujjain', 'Dewas', 'Bhopal', 'Sehore', 'Jabalpur', 'Gwalior'],
  'Maharashtra': ['Nashik', 'Pune', 'Satara', 'Ahmednagar', 'Nagpur', 'Aurangabad', 'Solapur'],
  'Rajasthan': ['Jaipur', 'Dausa', 'Sikar', 'Tonk', 'Ajmer', 'Kota', 'Jodhpur'],
  'Punjab': ['Ludhiana', 'Jalandhar', 'Moga', 'Amritsar', 'Patiala', 'Bathinda'],
  'Haryana': ['Karnal', 'Kurukshetra', 'Panipat', 'Kaithal', 'Hisar', 'Rohtak'],
  'Gujarat': ['Ahmedabad', 'Gandhinagar', 'Kheda', 'Surat', 'Rajkot', 'Vadodara'],
  'West Bengal': ['Kolkata', 'Hooghly', 'Howrah', 'Burdwan', 'Nadia', 'Murshidabad'],
  'Tamil Nadu': ['Coimbatore', 'Tiruppur', 'Erode', 'Salem', 'Madurai', 'Trichy'],
  'Karnataka': ['Bangalore', 'Ramanagara', 'Tumkur', 'Mysore', 'Mandya', 'Hubli'],
  'Andhra Pradesh': ['Vijayawada', 'Guntur', 'Krishna', 'Visakhapatnam', 'Kurnool', 'Tirupati'],
  'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal', 'Sangareddy', 'Warangal', 'Nizamabad'],
};

// ── Scoped styles (never touches index.css) ──────────────────────────────────
import '../styles/community.css';

// ── Sub-components ────────────────────────────────────────────────────────────
import PriceCard        from './community/PriceCard.jsx';
import SkeletonCard     from './community/SkeletonCard.jsx';
import BuyerCard        from './community/BuyerCard.jsx';
import SubmitReportModal from './community/SubmitReportModal.jsx';
import Toast            from './community/Toast.jsx';
import SaleWindowBanner     from './community/SaleWindowBanner.jsx';
import IntelFeed           from './community/IntelFeed.jsx';
import TrustSystem         from './community/TrustSystem.jsx';
import FPOPooling          from './community/FPOPooling.jsx';
import LogisticsStorage    from './community/LogisticsStorage.jsx';

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  Globe,
  TrendingUp,
  PlusCircle,
  RefreshCw,
  Search,
  CloudSun,
  Users,
  BarChart2,
  Inbox,
  Newspaper,
  MapPin,
  Compass,
  Wind,
  Droplets,
  Thermometer,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════════
   State Management — useReducer
   ══════════════════════════════════════════════════════════════════════════════ */

const INITIAL_STATE = {
  intelList:    [],
  buyers:       [],
  transport:    [],
  storage:      [],
  news:         [],
  loading:      true,
  submitting:   false,
  showModal:    false,
  toast:        null,       // { message, type } | null
  searchQuery:  '',
  activeCategory: 'All',
  selectedRegion: '',
  regionWeather: null,
  activeTab: 'prices_buyers', // 'prices_buyers' | 'news' | 'services' | 'weather'
  customLocationInput: '',
};

const CATEGORIES_CONFIG = [
  { key: 'All',       hi: 'सभी',    en: 'All' },
  { key: 'Vegetable', hi: 'सब्ज़ी',  en: 'Vegetable' },
  { key: 'Grain',     hi: 'अनाज',  en: 'Grain' },
  { key: 'Pulse',     hi: 'दाल',    en: 'Pulse' },
  { key: 'Spice',     hi: 'मसाले', en: 'Spice' },
  { key: 'Fruit',     hi: 'फल',    en: 'Fruit' },
  { key: 'Oilseed',   hi: 'तिलहन', en: 'Oilseed' },
  { key: 'Other',     hi: 'अन्य',  en: 'Other' },
];

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, intelList: action.payload };
    case 'SET_BUYERS':
      return { ...state, buyers: action.payload };
    case 'SET_TRANSPORT':
      return { ...state, transport: action.payload };
    case 'SET_STORAGE':
      return { ...state, storage: action.payload };
    case 'SET_NEWS':
      return { ...state, news: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false };
    case 'PREPEND_ITEM':
      return { ...state, intelList: [action.payload, ...state.intelList] };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };
    case 'OPEN_MODAL':
      return { ...state, showModal: true };
    case 'CLOSE_MODAL':
      return { ...state, showModal: false, submitting: false };
    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message, type: action.toastType } };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'SET_REGION_WEATHER':
      return { ...state, selectedRegion: action.region, regionWeather: action.weather };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_CUSTOM_LOCATION_INPUT':
      return { ...state, customLocationInput: action.payload };
    default:
      return state;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   Derived Stats Helper
   ══════════════════════════════════════════════════════════════════════════════ */

function computeStats(intelList) {
  if (!intelList || intelList.length === 0) {
    return { total: 0, topCommodity: '—', avgPriceKg: '—' };
  }

  const counts = {};
  intelList.forEach((r) => {
    const k = r.item?.trim() || 'Unknown';
    counts[k] = (counts[k] || 0) + 1;
  });
  const topCommodity = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const kgPrices = intelList.map((r) =>
    r.unit === 'quintal' ? r.price / 100 : r.price
  ).filter(Boolean);
  const avgPriceKg = kgPrices.length
    ? `₹${(kgPrices.reduce((s, p) => s + p, 0) / kgPrices.length).toFixed(0)}/kg`
    : '—';

  return { total: intelList.length, topCommodity, avgPriceKg };
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════════════════ */

export default function CommunityIntel() {
  const { liveWeather, language, userLocation } = useApp();
  const lang = language || 'hi';
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [showAllPrices, setShowAllPrices] = useState(false);

  const { 
    intelList, 
    buyers, 
    transport, 
    storage, 
    news, 
    loading, 
    submitting, 
    showModal, 
    toast, 
    searchQuery, 
    activeCategory, 
    selectedRegion, 
    regionWeather, 
    activeTab,
    customLocationInput 
  } = state;

  // Dynamic nearby locations based on user's current district and state
  const userDistrict = userLocation?.district || userLocation?.city || 'Your Area';
  const userState = userLocation?.state || 'Uttar Pradesh';

  const nearbyLocations = useMemo(() => {
    const normDist = userDistrict.trim().toLowerCase();
    
    // 1. Direct exact match in district adjacency map
    if (DISTRICT_NEIGHBORS[normDist]) {
      return DISTRICT_NEIGHBORS[normDist].slice(0, 6);
    }
    
    // 2. Fuzzy match for composite names (e.g. "Azamgarh Sadar" -> "azamgarh")
    const matchKey = Object.keys(DISTRICT_NEIGHBORS).find(k => normDist.includes(k) || k.includes(normDist));
    if (matchKey && DISTRICT_NEIGHBORS[matchKey]) {
      return DISTRICT_NEIGHBORS[matchKey].slice(0, 6);
    }

    // 3. Fallback to state cluster without current district
    const stateList = STATE_NEARBY_DISTRICTS[userState] || STATE_NEARBY_DISTRICTS['Uttar Pradesh'];
    return stateList.filter(d => d.toLowerCase() !== normDist).slice(0, 6);
  }, [userState, userDistrict]);

  const handleRegionChange = async (cityName, lat = null, lon = null) => {
    dispatch({ type: 'SET_REGION_WEATHER', region: cityName, weather: regionWeather });
    const w = await fetchLiveWeatherData(cityName, lat, lon);
    dispatch({ type: 'SET_REGION_WEATHER', region: cityName, weather: w });

    // Dynamically re-optimize transport & storage for selected location
    try {
      fetchTransport(userState, cityName).then(data => dispatch({ type: 'SET_TRANSPORT', payload: data })).catch(() => {});
      fetchStorage(userState, cityName).then(data => dispatch({ type: 'SET_STORAGE', payload: data })).catch(() => {});
    } catch (_) {}
  };

  const handleCustomLocationSubmit = (e) => {
    e.preventDefault();
    if (customLocationInput.trim()) {
      handleRegionChange(customLocationInput.trim());
      dispatch({ type: 'SET_CUSTOM_LOCATION_INPUT', payload: '' });
    }
  };

  /* ── Data Fetching ───────────────────────────────────────────────────────── */
  const fetchIntel = useCallback(async () => {
    if (!userLocation) return;
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchLiveMandiRates(userLocation.state);
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      console.error('Error loading intel dataset:', err);
      dispatch({ type: 'FETCH_ERROR' });
    }
  }, [userLocation]);

  useEffect(() => {
    if (userLocation) {
      fetchIntel();
      
      const currentDist = userLocation.district || userLocation.city || 'Azamgarh';

      // Fetch buyers
      fetchBuyers(userLocation.state).then(data => dispatch({ type: 'SET_BUYERS', payload: data })).catch(() => {});

      // Fetch location-optimized transport & storage
      fetchTransport(userLocation.state, currentDist).then(data => dispatch({ type: 'SET_TRANSPORT', payload: data })).catch(() => {});
      fetchStorage(userLocation.state, currentDist).then(data  => dispatch({ type: 'SET_STORAGE',   payload: data })).catch(() => {});
      
      // Fetch news
      fetchLiveNews(userLocation.state, userLocation.district, lang).then(data => dispatch({ type: 'SET_NEWS', payload: data })).catch(() => {});

      // Fetch initial live weather for current user location
      const initialLoc = userLocation.district || userLocation.city || 'Your Area';
      handleRegionChange(initialLoc, userLocation.lat, userLocation.lng);
    }
  }, [fetchIntel, userLocation, lang]);

  /* ── Form Submission ─────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async (formData) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const res = await fetch('/api/intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const text = await res.text();
      let json = {};
      try { json = JSON.parse(text); } catch (_) {}
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      dispatch({ type: 'PREPEND_ITEM', payload: json.data });
      dispatch({ type: 'CLOSE_MODAL' });
      dispatch({ type: 'SHOW_TOAST', message: 'Price report submitted successfully!', toastType: 'success' });
    } catch (err) {
      console.error('[CommunityIntel] POST /api/intel failed:', err.message);
      dispatch({ type: 'SET_SUBMITTING', payload: false });
      dispatch({ type: 'SHOW_TOAST', message: 'Failed to submit report. Please try again.', toastType: 'error' });
    }
  }, []);

  /* ── Filtered / Searched Intel List ─────────────────────────────────────── */
  const filteredList = useMemo(() => {
    let list = intelList;

    if (activeCategory !== 'All') {
      list = list.filter(
        (r) => r.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.item?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [intelList, searchQuery, activeCategory]);

  const stats = useMemo(() => computeStats(intelList), [intelList]);

  // Tab definitions
  const TABS_CONFIG = [
    {
      id: 'prices_buyers',
      label_hi: 'मंडी भाव व खरीदार',
      label_en: 'Mandi Prices & Buyers',
      icon: <TrendingUp size={16} />,
    },
    {
      id: 'news',
      label_hi: 'ताज़ा समाचार व अलर्ट',
      label_en: 'Latest News & Alerts',
      icon: <Newspaper size={16} />,
    },
    {
      id: 'services',
      label_hi: 'सामुदायिक सेवाएं',
      label_en: 'Community Services',
      icon: <Users size={16} />,
    },
    {
      id: 'weather',
      label_hi: 'मौसम पूर्वानुमान',
      label_en: 'Weather Advisory',
      icon: <CloudSun size={16} />,
    },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <main className="community-int__page" aria-label={lang === 'hi' ? 'सामुदायिक मंडी जानकारी' : 'Local Farming Updates'}>

      {/* ── LOCATION ENGINE ── */}
      {!userLocation && <LocationPrompt />}

      {userLocation && (
        <React.Fragment>
          {/* ── SUB-NAVBAR ── */}
          <nav 
            className="community-int__tabs" 
            style={{ 
              display: 'flex', 
              gap: '10px', 
              padding: '12px 0', 
              overflowX: 'auto', 
              borderBottom: '1px solid var(--border-subtle, #e5e7eb)', 
              marginBottom: '20px',
              scrollbarWidth: 'none',
            }} 
            role="tablist"
          >
            {TABS_CONFIG.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
                  className={`community-int__pill ${isActive ? 'community-int__pill--active' : ''}`}
                  style={{ 
                    whiteSpace: 'nowrap', 
                    padding: '8px 18px', 
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '24px',
                  }}
                >
                  {tab.icon}
                  <span>{lang === 'hi' ? tab.label_hi : tab.label_en}</span>
                </button>
              );
            })}
          </nav>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Mandi Prices & Buyers
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'prices_buyers' && (
            <React.Fragment>
              {/* SECTION 1 — Page Header + Stats */}
              <section className="community-int__section" aria-labelledby="ci-page-heading" style={{ paddingTop: 0 }}>
                <div className="community-int__section-header">
                  <div>
                    <p className="community-int__eyebrow">
                      <Globe size={13} aria-hidden="true" />
                      {t('pageEyebrow', lang)}
                    </p>
                    <h2 id="ci-page-heading" style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: '4px 0' }}>
                      {lang === 'hi' ? 'मंडी भाव और स्थानीय खरीदार' : 'Mandi Prices & Local Buyers'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '560px', marginTop: '4px', lineHeight: 1.55 }}>
                      {t('pageSubtitle', lang)}
                    </p>
                  </div>

                  <button
                    onClick={() => dispatch({ type: 'OPEN_MODAL' })}
                    className="btn-primary"
                    style={{ padding: '9px 18px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    aria-label={t('reportBtn', lang)}
                  >
                    <PlusCircle size={16} aria-hidden="true" />
                    {t('reportBtn', lang)}
                  </button>
                </div>

                {/* Stats row */}
                <div className="community-int__stats-row" role="list" aria-label={lang === 'hi' ? 'बाज़ार सारांश' : 'Quick stats'}>
                  <div className="community-int__stat-card" role="listitem">
                    <p className="community-int__stat-label">{t('statTotalLabel', lang)}</p>
                    <p className="community-int__stat-value">{stats.total}</p>
                    <p className="community-int__stat-sub">{t('statTotalSub', lang)}</p>
                  </div>
                  <div className="community-int__stat-card" role="listitem">
                    <p className="community-int__stat-label">{t('statTopLabel', lang)}</p>
                    <p className="community-int__stat-value" style={{ fontSize: '1.1rem', paddingTop: '4px' }}>{stats.topCommodity}</p>
                    <p className="community-int__stat-sub">{t('statTopSub', lang)}</p>
                  </div>
                  <div className="community-int__stat-card" role="listitem">
                    <p className="community-int__stat-label">{t('statAvgLabel', lang)}</p>
                    <p className="community-int__stat-value" style={{ fontSize: '1.2rem', paddingTop: '2px' }}>{stats.avgPriceKg}</p>
                    <p className="community-int__stat-sub">{t('statAvgSub', lang)}</p>
                  </div>
                  <div className="community-int__stat-card" role="listitem">
                    <p className="community-int__stat-label">{t('statBuyersLabel', lang)}</p>
                    <p className="community-int__stat-value">{buyers.length || '—'}</p>
                    <p className="community-int__stat-sub">{t('statBuyersSub', lang)}</p>
                  </div>
                </div>
              </section>

              {/* SECTION 2 — Today's Crop Prices Grid */}
              <section className="community-int__section" aria-labelledby="ci-prices-heading">
                <div className="community-int__section-header">
                  <h3 className="community-int__section-title" id="ci-prices-heading">
                    <TrendingUp size={18} color="var(--accent-cyan)" aria-hidden="true" />
                    {t('pricesSectionTitle', lang)}
                    {!loading && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-dim)' }}>
                        ({filteredList.length} / {intelList.length})
                      </span>
                    )}
                  </h3>
                  <button onClick={fetchIntel} className="btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    aria-label={t('refreshBtn', lang)} disabled={loading}>
                    <RefreshCw size={13} aria-hidden="true" /> {t('refreshBtn', lang)}
                  </button>
                </div>

                {/* Sale Window Advisory Banner */}
                {!loading && intelList.length > 0 && (
                  <SaleWindowBanner intelList={intelList} />
                )}

                {/* Search + Category Filter Controls */}
                <div className="community-int__controls" role="search" aria-label={t('searchAriaLabel', lang)}>
                  <div className="community-int__search-wrap">
                    <Search size={15} className="community-int__search-icon" aria-hidden="true" />
                    <input type="search" id="ci-search" className="community-int__search-input"
                      placeholder={t('searchPlaceholder', lang)}
                      value={searchQuery}
                      onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                      aria-label={t('searchAriaLabel', lang)}
                    />
                  </div>
                  <ul className="community-int__filter-pills" role="group" aria-label={lang === 'hi' ? 'श्रेणी से फ़िल्टर करें' : 'Filter by crop type'}>
                    {CATEGORIES_CONFIG.map(cat => (
                      <li key={cat.key}>
                        <button type="button"
                          className={`community-int__pill ${activeCategory === cat.key ? 'community-int__pill--active' : ''}`}
                          onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.key })}
                          aria-pressed={activeCategory === cat.key}>
                          {lang === 'hi' ? cat.hi : cat.en}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grid */}
                <div className="community-int__grid" aria-busy={loading} aria-live="polite" aria-label={t('pricesSectionTitle', lang)}>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
                  ) : filteredList.length > 0 ? (
                    (showAllPrices ? filteredList : filteredList.slice(0, 6)).map(ci => (
                      <PriceCard key={ci._id || ci.id}
                        item={ci.item} price={ci.price} unit={ci.unit}
                        location={ci.location} trend={ci.trend}
                        reportedBy={ci.reportedBy} category={ci.category}
                        createdAt={ci.createdAt} lang={lang}
                      />
                    ))
                  ) : (
                    <div className="community-int__empty" role="status">
                      <Inbox size={30} strokeWidth={1.25} style={{ color: 'var(--text-dim)', marginBottom: 12 }} aria-hidden="true" />
                      <h4 className="community-int__empty-title">{t('emptyTitle', lang)}</h4>
                      <p className="community-int__empty-sub">
                        {searchQuery || activeCategory !== 'All'
                          ? t('emptySubFilter', lang)
                          : t('emptySubDefault', lang)}
                      </p>
                    </div>
                  )}
                </div>
                
                {!loading && filteredList.length > 6 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                      onClick={() => setShowAllPrices(!showAllPrices)}
                      className="btn-secondary"
                      style={{ fontSize: '0.9rem', padding: '8px 24px' }}
                    >
                      {showAllPrices ? (lang === 'hi' ? 'कम दिखाएं' : 'Show Less') : (lang === 'hi' ? 'और देखें' : 'See More')}
                    </button>
                  </div>
                )}
              </section>

              {/* SECTION 3 — Buyers Near You (Moved into Mandi Prices & Buyers tab) */}
              <section className="community-int__section" aria-labelledby="ci-buyers-heading">
                <div className="community-int__section-header">
                  <div>
                    <h3 className="community-int__section-title" id="ci-buyers-heading">
                      <Users size={18} color="var(--accent-primary)" aria-hidden="true" />
                      {t('buyersSectionTitle', lang)}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                      {t('buyersSectionSub', lang)}
                    </p>
                  </div>
                </div>
                <div className="community-int__buyer-grid">
                  {(buyers.length > 0 ? buyers : []).map((buyer, i) => (
                    <BuyerCard key={buyer.id || `b_${i}`} {...buyer} lang={lang} />
                  ))}
                  {buyers.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1/-1', padding: '16px 0' }}>
                      {lang === 'hi' ? 'खरीदार लोड हो रहे हैं…' : 'Loading buyers…'}
                    </p>
                  )}
                </div>
              </section>

              {/* SECTION 4 — Compare Prices Across Markets */}
              {!loading && intelList.length > 1 && (
                <section className="community-int__section" aria-labelledby="ci-compare-heading">
                  <div className="community-int__section-header">
                    <h3 className="community-int__section-title" id="ci-compare-heading">
                      <BarChart2 size={18} color="var(--accent-gold)" aria-hidden="true" />
                      {t('compareSectionTitle', lang)}
                    </h3>
                  </div>
                  <ComparisonTable intelList={intelList} lang={lang} />
                </section>
              )}
            </React.Fragment>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Latest Farming News & Real Alerts
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'news' && (
            <React.Fragment>
              <IntelFeed lang={lang} feedItems={news} />
            </React.Fragment>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Community Services (FPO, Transport, Trust)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'services' && (
            <React.Fragment>
              {/* SECTION 6 — FPO Pooling */}
              <FPOPooling lang={lang} />

              {/* SECTION 7 — Logistics & Storage */}
              <LogisticsStorage lang={lang} transportItems={transport.length > 0 ? transport : undefined} storageItems={storage.length > 0 ? storage : undefined} />

              {/* SECTION 8 — Trust System */}
              <TrustSystem lang={lang} />
            </React.Fragment>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — Weather Advisory & Dynamic Location Forecast
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'weather' && (
            <React.Fragment>
              <section className="community-int__section" aria-labelledby="ci-weather-heading" style={{ paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px', gap: '12px' }}>
                  <div>
                    <h3 className="community-int__section-title" id="ci-weather-heading" style={{ fontSize: '1.25rem' }}>
                      <CloudSun size={20} color="var(--accent-gold)" aria-hidden="true" />
                      {lang === 'hi' ? 'स्थानीय मौसम व 7-दिवसीय कृषि पूर्वानुमान' : 'Local Weather & 7-Day Farm Forecast'}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {lang === 'hi' 
                        ? 'अपनी वर्तमान लोकेशन और आस-पास की मंडियों का वास्तविक समय मौसम पूर्वानुमान'
                        : 'Real-time weather advisory & rainfall projection for your location and nearby markets'}
                    </p>
                  </div>
                </div>

                {/* Location Selection Bar */}
                <div style={{ 
                  background: 'var(--bg-surface, #ffffff)', 
                  border: '1px solid var(--border-subtle, #e5e7eb)', 
                  borderRadius: '12px', 
                  padding: '16px 18px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Compass size={14} color="var(--accent-primary)" />
                      {lang === 'hi' ? 'स्थान चुनें:' : 'Select Location:'}
                    </span>

                    {/* Current Location Pill */}
                    <button
                      type="button"
                      onClick={() => handleRegionChange(userDistrict, userLocation.lat, userLocation.lng)}
                      className={`community-int__pill ${selectedRegion === userDistrict || !selectedRegion ? 'community-int__pill--active' : ''}`}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '5px 12px'
                      }}
                    >
                      <MapPin size={12} />
                      {userDistrict} ({lang === 'hi' ? 'आपकी लोकेशन' : 'Current'})
                    </button>

                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: '0 4px', fontWeight: 600 }}>
                      {lang === 'hi' ? 'नजदीकी ज़िले:' : 'Nearby Districts:'}
                    </span>

                    {/* Nearby Districts Pills */}
                    {nearbyLocations.map(reg => (
                      <button 
                        type="button" 
                        key={reg} 
                        onClick={() => handleRegionChange(reg)}
                        className={`community-int__pill ${selectedRegion === reg ? 'community-int__pill--active' : ''}`}
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        aria-pressed={selectedRegion === reg}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>

                  {/* Custom District Search Form */}
                  <form onSubmit={handleCustomLocationSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder={lang === 'hi' ? 'अन्य कोई ज़िला या शहर खोजें…' : 'Search any district/city…'}
                      value={customLocationInput}
                      onChange={(e) => dispatch({ type: 'SET_CUSTOM_LOCATION_INPUT', payload: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-muted, #d1d5db)',
                        background: 'var(--bg-main, #ffffff)',
                        color: 'var(--text-main, #111827)'
                      }}
                    />
                    <button
                      type="submit"
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      {lang === 'hi' ? 'देखें' : 'View'}
                    </button>
                  </form>
                </div>

                {/* Current Selected Weather Summary Box */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(240,253,244,0.7) 0%, rgba(254,249,195,0.4) 100%)',
                  border: '1px solid var(--border-muted, #dbe7d4)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <MapPin size={15} />
                        <span>{regionWeather?.city || selectedRegion || userDistrict}</span>
                      </div>
                      <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--text-main)' }}>
                        {regionWeather ? `${Math.round(regionWeather.temp)}°C` : (liveWeather ? `${Math.round(liveWeather.temp)}°C` : '31°C')}
                      </h2>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                        {regionWeather?.condition || liveWeather?.condition || 'Clear Sky'}
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          <Droplets size={12} color="var(--accent-cyan)" />
                          {lang === 'hi' ? '24 घंटे में बारिश' : '24h Rain'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                          {regionWeather?.precipitation ?? (liveWeather?.precipitation ?? 0)} mm
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          <Wind size={12} color="var(--accent-primary)" />
                          {lang === 'hi' ? 'हवा की गति' : 'Wind Speed'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                          {regionWeather?.windSpeed ?? (liveWeather?.windSpeed ?? 12)} km/h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agricultural Advisory Text */}
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                      <strong>🌾 {lang === 'hi' ? 'किसान सलाह:' : 'Farming Advisory:'}</strong>{' '}
                      {lang === 'hi' 
                        ? (regionWeather?.advisory_hi || liveWeather?.advisory_hi || 'मौसम सामान्य है। फसल सिंचाई और कटाई के लिए उत्तम मौसम है।')
                        : (regionWeather?.advisory_en || liveWeather?.advisory_en || 'Weather is normal. Suitable for crop irrigation and harvesting.')}
                    </p>
                  </div>
                </div>

                {/* 7-Day Forecast Horizon */}
                <WeatherForecast weather={regionWeather || liveWeather} lang={lang} />
              </section>
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          MODALS & OVERLAYS
          ──────────────────────────────────────────────────────────────────── */}
      <SubmitReportModal
        isOpen={showModal}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => dispatch({ type: 'CLEAR_TOAST' })}
        />
      )}
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ComparisonTable — inline sub-component (used only in this file)
   Groups intelList by crop and shows lowest / average / highest price per kg.

   UX Change: Column headers now use the translation dictionary (t()) so they
   display in the correct language (Hindi / English) based on user preference.
   Heading text changed: "Commodity" → "Crop", "Min" → "Lowest", "Max" → "Highest".
   ══════════════════════════════════════════════════════════════════════════════ */

function ComparisonTable({ intelList, lang = 'en' }) {
  // Build grouped data
  const groups = useMemo(() => {
    const map = {};
    intelList.forEach((r) => {
      if (!r.item || r.price == null) return;
      const key = r.item.trim();
      if (!map[key]) map[key] = { name: key, prices: [] };
      // Normalise to per-kg for consistent display
      const pricePerKg = r.unit === 'quintal' ? r.price / 100 : r.price;
      map[key].prices.push(pricePerKg);
    });

    return Object.values(map)
      .filter((g) => g.prices.length >= 2) // Only show crops with multiple data points
      .map((g) => ({
        name: g.name,
        min:  Math.min(...g.prices),
        max:  Math.max(...g.prices),
        avg:  g.prices.reduce((s, p) => s + p, 0) / g.prices.length,
        count: g.prices.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Show top 8 crops by number of reports
  }, [intelList]);

  if (groups.length === 0) return null;

  // UX Change: Column headers resolved via t() — correct language, no hardcoded English
  const columns = [
    { key: 'colCommodity', align: 'left'  },
    { key: 'colMin',       align: 'right' },
    { key: 'colAvg',       align: 'right' },
    { key: 'colMax',       align: 'right' },
    { key: 'colReports',   align: 'right' },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}
        aria-label={t('compareSectionTitle', lang)}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  padding: '8px 12px',
                  textAlign: col.align,
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t(col.key, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr
              key={g.name}
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                {g.name}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ci-trend-down)' }}>
                ₹{g.min.toFixed(1)}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                ₹{g.avg.toFixed(1)}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ci-trend-up)' }}>
                ₹{g.max.toFixed(1)}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-dim)' }}>
                {g.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   WeatherForecast — inline sub-component
   Shows the 7-day weather estimation.
   ══════════════════════════════════════════════════════════════════════════════ */
function WeatherForecast({ weather, lang = 'en' }) {
  if (!weather || !weather.dailyForecast || weather.dailyForecast.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>
        {lang === 'hi' ? 'अगले 7 दिनों का अनुमान' : '7-Day Forecast'}
      </h4>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {weather.dailyForecast.map((day, i) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' });
          const isToday = i === 0;

          return (
            <div key={day.date} style={{ 
              minWidth: '80px', 
              padding: '12px 8px', 
              borderRadius: '8px', 
              backgroundColor: isToday ? 'var(--bg-secondary)' : 'var(--bg-panel)', 
              border: isToday ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isToday ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                {isToday ? (lang === 'hi' ? 'आज' : 'Today') : dayName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {date.getDate()}/{date.getMonth() + 1}
              </span>
              <div style={{ margin: '8px 0', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--ci-trend-up)' }}>{Math.round(day.maxTemp)}°</span>
                {' / '}
                <span style={{ color: 'var(--ci-trend-down)' }}>{Math.round(day.minTemp)}°</span>
              </div>
              {day.rain > 0 ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                  {day.rain}mm
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  0mm
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
