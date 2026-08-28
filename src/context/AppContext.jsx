import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchLiveWeatherData, fetchLiveMandiPrices } from '../services/realDataService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'home' | 'auth' | 'schemes' | 'intel'
  const [language, setLanguage] = useState(() =>
    localStorage.getItem('lokvani_language') || 'en'
  );

  useEffect(() => {
    localStorage.setItem('lokvani_language', language);
  }, [language]);

  // Dialect selection — persisted to localStorage
  const [dialect, setDialect] = useState(() =>
    localStorage.getItem('lokvani_dialect') || 'en'
  );

  // Real User Queries (Persisted in localStorage, empty on fresh start)
  const [queries, setQueries] = useState(() => {
    const saved = localStorage.getItem('lokvani_real_queries');
    return saved ? JSON.parse(saved) : [];
  });

  // Real-Time Community Intel (Populated via live Agmarknet API + User Reports)
  const [communityIntel, setCommunityIntel] = useState(() => {
    const saved = localStorage.getItem('lokvani_real_intel');
    return saved ? JSON.parse(saved) : [];
  });

  const [liveWeather, setLiveWeather] = useState(null);

  // Location Engine State
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('lokvani_location');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('lokvani_location', JSON.stringify(userLocation));
    }
  }, [userLocation]);

  // Global User Profile State (Demographics + Software Engineer Extensions)
  const EMPTY_USER_PROFILE = {
    fullName: '',
    age: '',
    gender: '',
    state: '',
    district: '',
    occupation: '',
    annualIncome: '',
    casteCategory: '',
    landHoldingAcres: '',
    isBpl: false,
    isDisability: false,

    // Software Engineer & Identity Extensions
    phone: '',
    secondaryEmail: '',
    whatsappAlerts: false,
    technicalRole: '',
    githubUrl: '',
    portfolioUrl: '',
    isKycVerified: false,
    dbtBankLinked: false,
    cscNodeId: '',
    gpsCoordinates: '',
    profileCompleted: false
  };

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('lokvani_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || '',
          age: parsed.age !== undefined && parsed.age !== null ? parsed.age : '',
          gender: parsed.gender || '',
          state: parsed.state || '',
          district: parsed.district || '',
          occupation: parsed.occupation || '',
          annualIncome: parsed.annualIncome !== undefined && parsed.annualIncome !== null ? parsed.annualIncome : '',
          casteCategory: parsed.casteCategory || '',
          landHoldingAcres: parsed.landHoldingAcres !== undefined && parsed.landHoldingAcres !== null ? parsed.landHoldingAcres : '',
          isBpl: Boolean(parsed.isBpl),
          isDisability: Boolean(parsed.isDisability),

          // Engineering extensions
          phone: parsed.phone || '',
          secondaryEmail: parsed.secondaryEmail || '',
          whatsappAlerts: Boolean(parsed.whatsappAlerts),
          technicalRole: parsed.technicalRole || '',
          githubUrl: parsed.githubUrl || '',
          portfolioUrl: parsed.portfolioUrl || '',
          isKycVerified: Boolean(parsed.isKycVerified),
          dbtBankLinked: Boolean(parsed.dbtBankLinked),
          cscNodeId: parsed.cscNodeId || '',
          gpsCoordinates: parsed.gpsCoordinates || '',
          profileCompleted: parsed.profileCompleted !== undefined ? parsed.profileCompleted : Boolean(parsed.fullName?.trim())
        };
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }
    return { ...EMPTY_USER_PROFILE };
  });

  const updateUserProfile = (newProfile) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...newProfile, profileCompleted: Boolean((newProfile.fullName || prev.fullName)?.trim()) };
      localStorage.setItem('lokvani_user_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const clearUserProfile = () => {
    localStorage.removeItem('lokvani_user_profile');
    setUserProfile({ ...EMPTY_USER_PROFILE });
  };

  const requestLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
            if (!res.ok) throw new Error('Geocoding failed');
            const data = await res.json();
            
            const state = data.address.state || 'Uttar Pradesh';
            const district = data.address.state_district || data.address.county || data.address.city || '';
            
            const loc = { lat: latitude, lng: longitude, state, district };
            setUserLocation(loc);
            resolve(loc);
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  };

  // SECURITY: Clear any legacy API key that may have been stored in localStorage
  useEffect(() => {
    localStorage.removeItem('lokvani_api_key');
  }, []);

  // Load Real-Time Data from Public APIs on mount
  useEffect(() => {
    async function loadRealData() {
      const weather = await fetchLiveWeatherData('Azamgarh');
      setLiveWeather(weather);

      const livePrices = await fetchLiveMandiPrices();
      if (livePrices && livePrices.length > 0) {
        setCommunityIntel(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueLive = livePrices.filter(lp => !existingIds.has(lp.id));
          return [...uniqueLive, ...prev];
        });
      }
    }
    loadRealData();
  }, []);

  useEffect(() => {
    localStorage.setItem('lokvani_real_queries', JSON.stringify(queries));
  }, [queries]);

  useEffect(() => {
    localStorage.setItem('lokvani_real_intel', JSON.stringify(communityIntel));
  }, [communityIntel]);

  useEffect(() => {
    localStorage.setItem('lokvani_dialect', dialect);
  }, [dialect]);

  const addQuery = (newQuery) => {
    setQueries(prev => [newQuery, ...prev]);
  };

  const approveQuery = (queryId, updatedAnswerHi, updatedAnswerEn, operatorNotes = '') => {
    setQueries(prev => prev.map(q => {
      if (q.id === queryId) {
        return {
          ...q,
          status: 'VERIFIED_BY_TRUST_NODE',
          short_answer_hi: updatedAnswerHi || q.short_answer_hi,
          short_answer_en: updatedAnswerEn || q.short_answer_en,
          operator_notes: operatorNotes,
          verified_by: 'Gupta Kirana & CSC Node (Azamgarh)',
          verified_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return q;
    }));
  };

  const addCommunityIntel = (item, price, unit = 'kg', location = 'Local Mandi', reporter = 'You') => {
    const newEntry = {
      id: 'user-' + Date.now(),
      item,
      price: Number(price),
      unit,
      location,
      reporter,
      timestamp: 'Just now',
      verified: true,
      trend: 'up'
    };
    setCommunityIntel(prev => [newEntry, ...prev]);
  };

  const pendingReviewsCount = queries.filter(q => q.status === 'PENDING_TRUST_REVIEW').length;

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      language,
      setLanguage,
      dialect,
      setDialect,
      queries,
      addQuery,
      approveQuery,
      communityIntel,
      addCommunityIntel,
      liveWeather,
      pendingReviewsCount,
      userLocation,
      setUserLocation,
      requestLocation,
      userProfile,
      updateUserProfile,
      clearUserProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
