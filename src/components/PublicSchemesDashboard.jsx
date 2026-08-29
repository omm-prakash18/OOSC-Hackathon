import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  matchSchemesForProfile,
  querySchemeWithAi
} from '../services/schemeService';
import {
  FileText,
  User,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  Bot,
  Landmark,
  Edit3,
  Save,
  Award,
  BookOpen,
  X,
  MapPin,
  Sprout,
  IndianRupee,
  ShieldAlert
} from 'lucide-react';
import MyApplications from './MyApplications';

const STATES_LIST = [
  'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
  'Punjab', 'Haryana', 'West Bengal', 'Odisha', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'All India'
];

const OCCUPATIONS = [
  'Farmer', 'Agriculture Worker', 'Small Merchant', 'Artisan',
  'Worker/Laborer', 'Student', 'Unemployed', 'Senior Citizen'
];

export default function PublicSchemesDashboard() {
  const { language, userProfile, updateUserProfile, pendingReviewsCount } = useApp();
  const { user } = useAuth();
  const userId = user?.uid || 'user_demo_1';

  const [dashboardView, setDashboardView] = useState('browse'); // 'browse' | 'applications'
  const [appliedSchemeIds, setAppliedSchemeIds] = useState(new Set());
  const [isApplyFormOpen, setIsApplyFormOpen] = useState(false);
  const [applyRefNo, setApplyRefNo] = useState('');
  const [applyState, setApplyState] = useState('idle'); // 'idle' | 'saving' | 'done'
  const [applyError, setApplyError] = useState('');

  const [profile, setProfile] = useState({ ...userProfile });

  useEffect(() => {
    setProfile({ ...userProfile });
  }, [userProfile]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'all' | 'ai_assistant' | 'trust_node' | 'applications'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const matchedSchemes = matchSchemesForProfile(profile);
  const strictlyMatchedSchemes = matchedSchemes.filter(s => s.eligible || (s.matchScore && s.matchScore >= 50));

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile(profile);
    setIsEditingProfile(false);
  };

  const handleAiAsk = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;
    setIsAiLoading(true);
    setAiResponse('');
    const res = await querySchemeWithAi(profile, aiQuery, language);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const filteredAllSchemes = matchedSchemes.filter(scheme => {
    const matchSearch = scheme.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        scheme.title_hi.includes(searchQuery) ||
                        scheme.description_en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || scheme.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      
      {/* HEADER TITLE BANNER - Emerald Palette Matching Home */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-amber-50/40 border border-emerald-200/80 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Public Scheme Intelligence Engine
            </span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {language === 'hi' ? 'सार्वजनिक सरकारी योजनाएं एवं पात्रता डैशबोर्ड' : 'Public Government Schemes & Eligibility Portal'}
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-2xl">
            {language === 'hi'
              ? 'अपनी व्यक्तिगत जानकारी दर्ज करें और पीएम-किसान, आयुष्मान भारत, पीएम आवास सहित सभी सरकारी योजनाओं में अपनी पात्रता प्राप्त करें।'
              : 'Enter your personal details to automatically discover eligible Central & State schemes, benefits, and application guidelines.'}
          </p>
        </div>

        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="btn-primary flex-shrink-0 !py-2.5 !px-5 shadow-emerald-600/20"
        >
          {isEditingProfile ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          <span>
            {isEditingProfile
              ? (language === 'hi' ? 'प्रोफ़ाइल बंद करें' : 'Close Profile Editor')
              : (language === 'hi' ? 'अपनी जानकारी अपडेट करें' : 'Edit Personal Profile')}
          </span>
        </button>
      </div>

      {/* 2. PERSONAL PROFILE CARD / EDIT FORM */}
      {(isEditingProfile || !profile.fullName) && (
        <div className="bg-white border-2 border-emerald-600 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl shadow-emerald-500/10">
          <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
            <User className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'hi' ? 'व्यक्तिगत जानकारी एवं पात्रता प्रोफाइल' : 'Personal Details & Eligibility Profile'}
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleProfileChange}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="pf-name" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full name</label>
                <input id="pf-name" type="text" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} required placeholder="e.g. Ramesh Kumar" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>

              <div>
                <label htmlFor="pf-age" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Age</label>
                <input id="pf-age" type="number" name="age" value={profile.age || ''} onChange={handleProfileChange} required placeholder="e.g. 38" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>

              <div>
                <label htmlFor="pf-gender" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gender</label>
                <select id="pf-gender" name="gender" value={profile.gender || ''} onChange={handleProfileChange} className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div>
                <label htmlFor="pf-state" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">State</label>
                <select id="pf-state" name="state" value={profile.state || ''} onChange={handleProfileChange} className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                  <option value="">Select State</option>
                  {STATES_LIST.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="pf-district" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">District</label>
                <input id="pf-district" type="text" name="district" value={profile.district || ''} onChange={handleProfileChange} placeholder="e.g. Azamgarh" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>

              <div>
                <label htmlFor="pf-occ" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Occupation</label>
                <select id="pf-occ" name="occupation" value={profile.occupation || ''} onChange={handleProfileChange} className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="pf-income" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Annual household income (₹)</label>
                <input id="pf-income" type="number" name="annualIncome" value={profile.annualIncome || ''} onChange={handleProfileChange} step="5000" placeholder="e.g. 120000" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>

              <div>
                <label htmlFor="pf-land" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Land holding (acres)</label>
                <input id="pf-land" type="number" name="landHoldingAcres" value={profile.landHoldingAcres || ''} onChange={handleProfileChange} step="0.1" placeholder="e.g. 1.8" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>

              <div>
                <label htmlFor="pf-cat" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Social category</label>
                <select id="pf-cat" name="casteCategory" value={profile.casteCategory || ''} onChange={handleProfileChange} className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save & Update Eligibility Matches
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ACTIVE PROFILE SUMMARY BAR */}
      {!isEditingProfile && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {profile.fullName || 'Citizen'} ({profile.age} yrs, {profile.gender})
            </span>
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.district}, {profile.state}
            </span>
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" /> {profile.occupation} ({profile.landHoldingAcres} Acres)
            </span>
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" /> {Number(profile.annualIncome).toLocaleString('en-IN')}/yr
            </span>
            {profile.isBpl && <span className="text-xs font-bold text-amber-700">BPL Card</span>}
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Update Profile
          </button>
        </div>
      )}

      {/* TAB NAVIGATION BUTTONS - Matched to Emerald Palette */}
      <div className="flex border-b border-slate-200 mb-8 gap-4 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matched')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
            activeTab === 'matched'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-5 h-5 text-emerald-700" />
          <span>{language === 'hi' ? 'मेरे लिए योग्य योजनाएं' : 'My Matched Schemes'}</span>
          <span className="text-xs font-bold text-emerald-800 ml-1">
            ({matchedSchemes.filter(s => s.matchScore >= 70).length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>{language === 'hi' ? 'सभी सार्वजनिक योजनाएं' : 'All Public Schemes Directory'}</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
            activeTab === 'ai_assistant'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>{language === 'hi' ? 'AI योजना मित्र' : 'AI Scheme Assistant'}</span>
        </button>

        <button
          onClick={() => setActiveTab('trust_node')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
            activeTab === 'trust_node'
              ? 'border-red-600 text-red-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>{language === 'hi' ? 'किराना ट्रस्ट नोड समीक्षा' : 'Kirana Trust Node Queue'}</span>
          {pendingReviewsCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingReviewsCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: MATCHED SCHEMES */}
      {activeTab === 'matched' && (
        strictlyMatchedSchemes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-black/[0.1] bg-white p-12 text-center">
            <Award size={28} strokeWidth={1.25} className="text-amber-500" />
            <h3 className="font-condensed text-base font-semibold text-zinc-900">
              {language === 'hi' ? 'आपकी प्रोफ़ाइल के लिए कोई सटीक योजना नहीं मिली' : 'No Exact Matches for Current Profile'}
            </h3>
            <p className="max-w-md text-sm text-zinc-500">
              {language === 'hi'
                ? 'कृपया "प्रोफ़ाइल संपादन" पर जाकर अपनी सही जानकारी भरें या "सभी सार्वजनिक योजनाएं" में खोजें।'
                : 'Try editing your profile details or browse the full catalog under "All Schemes".'}
            </p>
            <button onClick={() => setIsEditingProfile(true)} className="btn-primary mt-2">
              {language === 'hi' ? 'प्रोफ़ाइल अपडेट करें' : 'Update Profile'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strictlyMatchedSchemes.map(scheme => (
              <div
                key={scheme.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">
                      {scheme.category}
                    </span>

                    <span className={`text-xs font-black flex items-center gap-1 ${
                      scheme.matchScore >= 75
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {scheme.matchScore}% Match
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                    {language === 'hi' ? scheme.title_hi : scheme.title_en}
                  </h3>

                  <p className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'hi' ? scheme.ministry_hi : scheme.ministry_en}</span>
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {language === 'hi' ? scheme.description_hi : scheme.description_en}
                  </p>

                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80 mb-5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">BENEFITS</span>
                    <span className="text-sm font-bold text-emerald-900">
                      {language === 'hi' ? scheme.benefits_hi : scheme.benefits_en}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedScheme(scheme)}
                  className="btn-secondary w-full justify-center"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'hi' ? 'आवश्यक दस्तावेज़ और आवेदन देखें' : 'View Requirements & Apply'}</span>
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* 4. TAB 2: ALL SCHEMES DIRECTORY */}
      {activeTab === 'all' && (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheme name or ministry..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'All' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === cat ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredAllSchemes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-black/[0.1] py-20 text-center">
              <Search size={20} strokeWidth={1.25} className="text-zinc-300" />
              <p className="text-sm text-zinc-400">
                {language === 'hi' ? 'कोई योजना नहीं मिली — खोज बदलकर देखें।' : 'No schemes found — try a different search or category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAllSchemes.map(scheme => (
                <div
                  key={scheme.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">
                        {scheme.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{scheme.badge}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {language === 'hi' ? scheme.title_hi : scheme.title_en}
                    </h3>

                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {language === 'hi' ? scheme.description_hi : scheme.description_en}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="btn-secondary w-full justify-center"
                  >
                    Details & Documents
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: AI SCHEME ASSISTANT */}
      {activeTab === 'ai_assistant' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Scheme Mitra (Interactive Query Assistant)</h3>
              <p className="text-xs text-slate-500">Ask any specific question about your scheme eligibility, document requirements, or application steps.</p>
            </div>
          </div>

          <form onSubmit={handleAiAsk} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder={language === 'hi' ? "उदा: क्या मुझे 1.5 एकड़ जमीन के साथ PM Kisan योजना मिलेगी?" : "e.g. Am I eligible for PM-Kisan if I own 1.8 acres in UP?"}
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <button type="submit" disabled={isAiLoading} className="btn-primary !px-6">
              {isAiLoading ? 'Analyzing...' : 'Ask AI'}
            </button>
          </form>

          {isAiLoading && (
            <div className="p-6 text-center text-amber-700 font-semibold text-sm animate-pulse flex items-center justify-center gap-2">
              <Bot className="w-4 h-4 text-amber-600 animate-spin" />
              <span>LokVani AI is processing your profile against government scheme guidelines...</span>
            </div>
          )}

          {aiResponse && !isAiLoading && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 leading-relaxed whitespace-pre-wrap text-sm text-slate-800">
              <div className="font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Advice Response:
              </div>
              {aiResponse}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: KIRANA TRUST NODE QUEUE */}
      {activeTab === 'trust_node' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-6 h-6 text-red-400" />
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-100">
                  {language === 'hi' ? 'किराना ट्रस्ट नोड — मानव सत्यापन कतार' : 'Kirana Trust Node — Human-in-the-Loop Review Queue'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {language === 'hi'
                  ? 'उच्च जोखिम वाली सलाह और संकट पूर्वाभास सूचनाओं को 1-क्लिक में सत्यापित या संशोधित करें।'
                  : 'Review high-stakes scheme queries and urgent agricultural distress predictions before final release to farmer voice apps.'}
              </p>
            </div>
            <span className="text-xs font-mono bg-red-950/80 text-red-300 border border-red-800/60 px-3 py-1.5 rounded-xl font-bold">
              {pendingReviewsCount} Pending Items
            </span>
          </div>

          {/* Urgent Distress Alert Queue Item */}
          <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-2 border-red-500/50 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black border border-red-500/40 uppercase tracking-wider">
                  DISTRESS_ALERT (URGENT)
                </span>
                <span className="text-xs text-slate-400 font-mono">Node #Azamgarh-402</span>
              </div>
              <span className="text-xs text-amber-400 font-bold bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-800/50">
                Score: 78 / 100
              </span>
            </div>
            <h4 className="font-bold text-base sm:text-lg text-slate-100 mb-1">
              {language === 'hi' ? 'सूखा एवं फसल क्षति जोखिम चेतावनी — गेहूं (फूल आने की स्थिति)' : 'Drought & Price Crash Risk Warning — Wheat (Flowering Stage)'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              {language === 'hi'
                ? 'बारिश 45% कम और मंडी भाव में 25% की गिरावट दर्ज की गई। KCC लोन की किश्त 10 दिनों में देय है।'
                : 'Rainfall 45% below normal and Mandi price dropped by 25%. KCC loan repayment due in 10 days.'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tagged PENDING_TRUST_REVIEW
              </span>
              <button
                onClick={() => alert(language === 'hi' ? 'सफलतापूर्वक सत्यापित और किसान ऐप पर प्रेषित।' : 'Distress alert verified and released to farmer voice app.')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-4 h-4" /> 1-Click Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── My Applications (tracker + grievance) ───────────── */}
      {activeTab === 'applications' && (
        <MyApplications
          userName={profile.fullName}
          userEmail={user?.email || ''}
          onBrowseSchemes={() => setActiveTab('matched')}
        />
      )}

      {/* ── Scheme detail modal ─────────────────────────────── */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">
                  {selectedScheme.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2 mb-1">
                  {language === 'hi' ? selectedScheme.title_hi : selectedScheme.title_en}
                </h2>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'hi' ? selectedScheme.ministry_hi : selectedScheme.ministry_en}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedScheme(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">DESCRIPTION</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {language === 'hi' ? selectedScheme.description_hi : selectedScheme.description_en}
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl mb-5">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">FINANCIAL BENEFIT</h4>
              <p className="text-base font-bold text-slate-900">
                {language === 'hi' ? selectedScheme.benefits_hi : selectedScheme.benefits_en}
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">REQUIRED DOCUMENTS CHECKLIST</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {(language === 'hi' ? selectedScheme.requiredDocuments_hi : selectedScheme.requiredDocuments_en).map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedScheme(null)} className="btn-secondary">
                Close
              </button>
              <a
                href={selectedScheme.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <span>Official Apply Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
