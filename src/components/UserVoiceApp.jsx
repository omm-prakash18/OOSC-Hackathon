import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';
import { processUserSpeechQuery } from '../services/aiCoreEngine';
import { geminiRotator } from '../services/geminiKeyRotator';
import {
  Mic, MicOff, Volume2, VolumeX, ShieldAlert, Sparkles, CheckCircle2,
  AlertTriangle, ArrowRight, RefreshCw, Wheat, Bug, TrendingUp, Send, X,
  ChevronDown, ChevronUp, MessageSquare, Gauge, Type, Zap, Clock, MapPin,
  ThumbsUp, ThumbsDown, MessageSquarePlus, Trash2, Edit2, Check, User,
  RotateCcw, Globe, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import DistressCard from './DistressCard';
import AgriculturalModelsPanel from './AgriculturalModelsPanel';
import ConversationSidebar from './chat/ConversationSidebar';

// ─── Dialect Map ────────────────────────────────────────────────────────────
const DIALECT_MAP = {
  hi:  { label: 'हिंदी',       locale: 'hi-IN',  promptName: 'Hindi' },
  en:  { label: 'English',     locale: 'en-IN',  promptName: 'English' },
  bho: { label: 'भोजपुरी',    locale: 'hi-IN',  promptName: 'Bhojpuri dialect of Hindi' },
  awa: { label: 'अवधी',       locale: 'hi-IN',  promptName: 'Awadhi dialect of Hindi' },
  mai: { label: 'मैथिली',     locale: 'hi-IN',  promptName: 'Maithili' },
  mr:  { label: 'मराठी',      locale: 'mr-IN',  promptName: 'Marathi' },
  bn:  { label: 'বাংলা',      locale: 'bn-IN',  promptName: 'Bengali' },
  ta:  { label: 'தமிழ்',      locale: 'ta-IN',  promptName: 'Tamil' },
  te:  { label: 'తెలుగు',     locale: 'te-IN',  promptName: 'Telugu' },
  pa:  { label: 'ਪੰਜਾਬੀ',     locale: 'pa-IN',  promptName: 'Punjabi' },
  gu:  { label: 'ગુજરાતી',    locale: 'gu-IN',  promptName: 'Gujarati' },
  kn:  { label: 'कन्नड',       locale: 'kn-IN',  promptName: 'Kannada' },
  or:  { label: 'ଓଡ଼ିଆ',       locale: 'or-IN',  promptName: 'Odia' },
};

const DEMO_PRESETS = [
  { label_en: 'PM-Kisan & Mandi', label_hi: 'पीएम-किसान व मंडी',
    query_en: 'How to apply for PM-Kisan scheme and what is tomato mandi rate?',
    query_hi: 'Mujhe PM-Kisan scheme ke liye apply karna hai aur tamatar ka mandi bhav janna hai.',
    icon: Wheat, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { label_en: 'Crop Disease', label_hi: 'फसल रोग',
    query_en: 'Insects on tomatoes, which pesticide should I spray?',
    query_hi: 'Tamatar me keede lag rahe hain, konsa pesticide spray karna chahiye?',
    icon: Bug, color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
  { label_en: 'Mandi Rates', label_hi: 'मंडी भाव',
    query_en: 'What is today wholesale price of onion in Gorakhpur Mandi?',
    query_hi: 'Aaj Gorakhpur Mandi me pyaaz ka thoke rate kya hai?',
    icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  { label_en: 'ML Price Forecast', label_hi: 'मूल्य पूर्वानुमान (ML)',
    query_en: 'Predict rice price in West Bengal with rainfall 820mm, temperature 28C, soil pH 6.5',
    query_hi: 'West Bengal mein Rice ka price predict karein (Barish 820mm, Temp 28C, pH 6.5)',
    icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
];

function ConfidenceBadge({ level }) {
  const map = {
    HIGH:   { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '✓', label_en: 'High Confidence', label_hi: 'उच्च विश्वास' },
    MEDIUM: { cls: 'bg-blue-100 text-blue-800 border-blue-300',       icon: '✓', label_en: 'Verified Standard', label_hi: 'मानक सत्यापित' },
    LOW:    { cls: 'bg-amber-100 text-amber-800 border-amber-300',    icon: 'ℹ', label_en: 'Community Sourced', label_hi: 'समुदाय स्रोत' },
  };
  const c = map[level] || map['HIGH'];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border', c.cls)}>
      <span>{c.icon}</span>
      <span>{c.label_en}</span>
    </span>
  );
}

// ─── Distress Bar Component ─────────────────────────────────────────
function DistressDamageBar({ result, dialect }) {
  if (!result) return null;

  let score = result.distressScore || result.distress_score;
  let level = result.distressLevel || result.distress_level;
  let impactEn = result.damageImpactEn || result.damage_impact_en;
  let impactHi = result.damageImpactHi || result.damage_impact_hi;

  // Heuristic calculation if not explicitly provided by backend
  if (score === undefined || score === null) {
    if (result.domain === 'AGRI_ADVISORY' && (result.riskCategory === 'PESTICIDE_SAFETY' || result.riskCategory === 'AGRICULTURAL_DOSAGE')) {
      score = 85;
      level = 'CRITICAL';
      impactEn = 'High Crop Damage Risk: Potential 35%–55% crop yield loss if pest/fungal blight is untreated within 48 hours.';
      impactHi = 'उच्च फसल क्षति जोखिम: 48 घंटे में उचित कीटनाशक न छिड़कने पर 35%-55% तक फसल नुकसान की संभावना।';
    } else if (result.domain === 'WEATHER') {
      score = 65;
      level = 'HIGH';
      impactEn = 'Weather Impact Risk: 20%–30% harvest damage risk from rain/waterlogging. Cover harvested produce immediately.';
      impactHi = 'मौसम प्रभाव जोखिम: बारिश/जलभराव से 20%-30% कटी फसल नुकसान का खतरा। तुरंत तिरपाल से ढकें।';
    } else if (result.domain === 'GOVT_SCHEME' || result.isHighStakes) {
      score = 75;
      level = 'HIGH';
      impactEn = 'Financial Eligibility Risk: Risk of subsidy delay or application rejection without land record verification.';
      impactHi = 'वित्तीय पात्रता जोखिम: दस्तावेज सत्यापन के बिना सब्सिडी रुकने या आवेदन निरस्त होने की संभावना।';
    } else if (result.domain === 'MARKET_PRICE') {
      score = 35;
      level = 'MODERATE';
      impactEn = 'Market Price Risk: Moderate 10%–15% income variance based on market location and quality grade.';
      impactHi = 'मंडी भाव जोखिम: बाजार स्थान और गुणवत्ता ग्रेड के आधार पर 10%-15% आय में उतार-चढ़ाव की संभावना।';
    } else {
      score = 20;
      level = 'LOW';
      impactEn = 'Low Business Impact: Standard informational query with minimal operational risk.';
      impactHi = 'कम व्यावसायिक जोखिम: सामान्य जानकारी प्रश्न; न्यूनतम परिचालन जोखिम।';
    }
  }

  const levelColor =
    score >= 80 ? 'bg-rose-600 border-rose-200 text-white' :
    score >= 60 ? 'bg-amber-500 border-amber-200 text-white' :
    score >= 30 ? 'bg-orange-500 border-orange-200 text-white' :
                  'bg-emerald-500 border-emerald-200 text-white';

  const barGradient =
    score >= 80 ? 'from-rose-500 to-red-600' :
    score >= 60 ? 'from-amber-500 to-orange-500' :
    score >= 30 ? 'from-amber-400 to-amber-600' :
                  'from-emerald-400 to-emerald-600';

  const impactText = (dialect === 'en') ? (impactEn || impactHi) : (impactHi || impactEn);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white space-y-3.5 shadow-lg border border-zinc-800 my-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={score >= 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            {dialect === 'en' ? 'Farming & Business Distress Index' : 'फसल व व्यवसाय क्षति जोखिम सूचकांक'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest', levelColor)}>
            {level} ({score}%)
          </span>
        </div>
      </div>

      {/* Animated Meter Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={cn('h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r', barGradient)}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
          <span>0% Low Impact</span>
          <span>50% Moderate</span>
          <span>100% Critical Damage</span>
        </div>
      </div>

      {/* Impact Explanation */}
      {impactText && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs leading-relaxed text-zinc-200 flex items-start gap-2.5">
          <ShieldAlert size={15} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-0.5">
              {dialect === 'en' ? 'Estimated Damage & Business Impact:' : 'अनुमानित क्षति व व्यावसायिक प्रभाव:'}
            </p>
            <p className="text-zinc-300">{impactText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-5 w-24 rounded-full ml-auto" />
        </div>
        <div className="space-y-3 p-5 rounded-xl bg-muted/40">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UserVoiceApp() {
  const {
    language, setActiveTab, dialect, setDialect, isSpeaking, stopSpeaking,
    conversations, activeConvId, activeConversation, createConversation,
    selectConversation, deleteConversation, deleteMessageFromActiveConv, clearAllConversations,
    renameConversation, addMessageToActiveConv, userProfile
  } = useApp();
  const { user } = useAuth();

  const [appState, setAppState]             = useState('IDLE');
  const [transcript, setTranscript]         = useState('');
  const [typedQuery, setTypedQuery]         = useState('');
  const [showDetailedMap, setShowDetailedMap] = useState({});
  const [ttsRate, setTtsRate]               = useState(1.0);
  const [largeText, setLargeText]           = useState(() => localStorage.getItem('lokvani_large_text') === 'true');
  const [activeTranslateLang, setActiveTranslateLang] = useState('auto');
  const [showModal, setShowModal]           = useState(false);
  const [reportItem,     setReportItem]     = useState('Tamatar (Tomato)');
  const [reportPrice,    setReportPrice]    = useState('30');
  const [reportLocation, setReportLocation] = useState('Azamgarh Mandi');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText]   = useState('');

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Sync appState with global speaking status
  useEffect(() => {
    if (isSpeaking) {
      setAppState('SPEAKING');
    } else if (appState === 'SPEAKING') {
      setAppState('IDLE');
    }
  }, [isSpeaking, appState]);

  // Keyboard shortcut: Press Escape to stop AI voice output anytime
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSpeaking) {
        stopSpeaking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking, stopSpeaking]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    localStorage.setItem('lokvani_large_text', String(largeText));
  }, [largeText]);

  // Auto-scroll to bottom of conversation thread when new message is added
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages?.length]);

  const activeDialectKey = (language === 'hi' && (dialect === 'en' || !dialect)) ? 'hi' : (dialect || 'hi');
  const dialectInfo = DIALECT_MAP[activeDialectKey] || DIALECT_MAP.hi;
  const sttLocale   = dialectInfo.locale || 'hi-IN';
  const ttsLocale   = activeDialectKey === 'en' ? 'en-IN' : sttLocale;
  const isProcessing = appState === 'THINKING';

  const primaryAnswer = (r) =>
    (language === 'en' || activeDialectKey === 'en') ? (r?.shortAnswerEn || r?.shortAnswerHi) : (r?.shortAnswerHi || r?.shortAnswerEn);
  const detailedAnswer = (r) =>
    (language === 'en' || activeDialectKey === 'en') ? (r?.detailedAnswerEn || r?.detailedAnswerHi) : (r?.detailedAnswerHi || r?.detailedAnswerEn);

  const handlePlayTTS = useCallback((text) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!text) return;
    setAppState('SPEAKING');
    speechService.speakText(text, ttsLocale, () => setAppState('IDLE'), ttsRate);
  }, [isSpeaking, stopSpeaking, ttsLocale, ttsRate]);

  // ── Query processing with Context Retention ──────────────────────────
  const handleProcessQuery = useCallback(async (queryText) => {
    const trimmed = queryText.trim().slice(0, 500);
    if (!trimmed) { setAppState('IDLE'); return; }

    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (_) { /* ignore */ }
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setAppState('THINKING');

    try {
      let data = null;
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            transcribed_text: trimmed,
            user_location: 'Azamgarh, UP',
            userId: user?.uid || 'user_demo_1',
            userName: userProfile?.fullName || user?.displayName || 'Citizen',
            dialect: dialectInfo.promptName,
            conversation_history: activeConversation?.messages || []
          })
        });
        if (res.ok) {
          const j = await res.json();
          if (j.data) {
            data = {
              ...j.data,
              shortAnswerHi: j.data.shortAnswerHi || j.data.short_answer_hi || '',
              shortAnswerEn: j.data.shortAnswerEn || j.data.short_answer_en || '',
              detailedAnswerHi: j.data.detailedAnswerHi || j.data.detailed_answer_hi || '',
              detailedAnswerEn: j.data.detailedAnswerEn || j.data.detailed_answer_en || '',
              followUpQuestions: j.data.followUpQuestions || j.data.follow_up_questions || [],
              isHighStakes: j.data.isHighStakes ?? j.data.is_high_stakes ?? false,
              riskCategory: j.data.riskCategory || j.data.risk_category || 'NONE',
              trustNote: j.data.trustNote || j.data.trust_note || '',
              actionableSteps: j.data.actionableSteps || j.data.actionable_steps || [],
            };
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.warn('[UserVoiceApp] Backend offline — using local fallback engine');
      }

      if (!data || (!data.shortAnswerHi && !data.shortAnswerEn)) {
        data = {
          _id: `offline_${Date.now()}`,
          transcribedText: trimmed,
          shortAnswerHi: 'AI सेवा अस्थायी रूप से अनुपलब्ध है।',
          shortAnswerEn: 'AI service is temporarily out of service.',
          confidence: 'LOW',
          createdAt: new Date(),
        };
      }

      addMessageToActiveConv(data);
      setTranscript('');
      handlePlayTTS(primaryAnswer(data));
    } catch (err) {
      console.error('[UserVoiceApp] Error processing query:', err);
    } finally {
      setAppState('IDLE');
    }
  }, [dialectInfo.promptName, addMessageToActiveConv, handlePlayTTS, activeConversation?.messages, user?.uid, userProfile?.fullName]);

  const querySubmittedRef = useRef(false);

  const handleStartListening = useCallback(() => {
    if (isProcessing) return;
    if (isSpeaking) stopSpeaking();
    setAppState('LISTENING');
    setTranscript('');
    querySubmittedRef.current = false;

    speechService.startListening(
      (r) => {
        setTranscript(r.transcript);
      },
      (e) => {
        console.warn('[UserVoiceApp] STT Error:', e);
        setAppState('IDLE');
      },
      (capturedText) => {
        // Conclude voice session and process complete transcript
        setAppState('IDLE');
        if (capturedText && capturedText.trim() && !querySubmittedRef.current) {
          querySubmittedRef.current = true;
          handleProcessQuery(capturedText.trim());
        }
      },
      sttLocale
    );
  }, [isProcessing, isSpeaking, stopSpeaking, sttLocale, handleProcessQuery]);

  const handleStopListening = useCallback(() => {
    speechService.stopListeningAndSubmit();
  }, []);

  const handlePresetSelect = useCallback((p) => {
    if (isProcessing) return;
    if (isSpeaking) stopSpeaking();
    const q = language === 'hi' ? p.query_hi : p.query_en;
    setTranscript(q);
    handleProcessQuery(q);
  }, [isProcessing, isSpeaking, stopSpeaking, language, handleProcessQuery]);

  const handlePriceReport = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/intel', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: reportItem, price: reportPrice, unit: 'kg', location: reportLocation, reportedBy: 'Local Farmer' }) });
    } catch (_) {}
    setShowModal(false);
    alert('Thank you! Your market price report has been shared with neighboring farmers.');
  };

  const handleSaveTitle = () => {
    if (editTitleText.trim()) {
      renameConversation(activeConvId, editTitleText.trim());
    }
    setIsEditingTitle(false);
  };

  const toggleDetailed = (msgId) => {
    setShowDetailedMap(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <TooltipProvider>
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-5 items-start', largeText && 'large-text')}>

      {/* ── Floating Sticky Stop Voice Banner ──────────────── */}
      {isSpeaking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3.5 px-5 py-3 rounded-full bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border border-white/20">
            <div className="waveform text-emerald-400">
              {[...Array(5)].map((_, i) => <div key={i} className="waveform-bar" />)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">
                {language === 'hi' ? 'एआई आवाज़ चालू है' : 'AI Speaking...'}
              </span>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={stopSpeaking}
              className="h-8 text-xs font-extrabold gap-1.5 rounded-full px-4 shadow-md shadow-red-500/30"
            >
              <VolumeX size={14} />
              {language === 'hi' ? 'आवाज़ रोकें' : 'Stop Audio'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Sidebar (Conversations Sessions List) ───────────────── */}
      <ConversationSidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={selectConversation}
        onCreateConversation={createConversation}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onClearAllConversations={clearAllConversations}
        language={language}
        dialect={dialect}
        setDialect={setDialect}
        dialectMap={DIALECT_MAP}
        ttsRate={ttsRate}
        setTtsRate={setTtsRate}
        largeText={largeText}
        setLargeText={setLargeText}
        isProcessing={isProcessing}
        onStopSpeaking={stopSpeaking}
      />

      {/* ── Main Panel ─────────────────────────────────────────── */}
      <div className="flex-1 w-full min-w-0 space-y-5">

        {/* Active Conversation Header Bar */}
        <Card className="p-4 border-zinc-200/80 bg-white shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <MessageSquare size={16} className="text-zinc-900" />
            </div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editTitleText}
                  onChange={e => setEditTitleText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                  className="h-8 px-2 text-sm font-bold border border-zinc-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 flex-1"
                  autoFocus
                />
                <Button size="sm" className="h-8 px-2 bg-zinc-900 hover:bg-zinc-800 text-white" onClick={handleSaveTitle}>
                  <Check size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 truncate">
                  {activeConversation?.title || 'Chat Session'}
                </h3>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-900 shrink-0"
                  onClick={() => {
                    setEditTitleText(activeConversation?.title || '');
                    setIsEditingTitle(true);
                  }}
                  title="Rename Chat Session"
                >
                  <Edit2 size={12} />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold border-zinc-300 text-zinc-700">
              {activeConversation?.messages?.length || 0} {language === 'hi' ? 'संदेश' : 'messages'}
            </Badge>
            {(conversations || []).length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 px-2"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  deleteConversation(activeConvId);
                }}
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">{language === 'hi' ? 'हटाएं' : 'Delete'}</span>
              </Button>
            )}
          </div>
        </Card>

        {/* ── TOP VOICE QUERY HERO CARD (PURE WHITE MONOTHEME) ──────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-white text-slate-900 border border-slate-200/90 shadow-sm p-6 sm:p-8">

          <div className="relative z-10 text-center">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-5">
              {appState === 'IDLE'      && !isSpeaking && <><Sparkles size={12} className="text-slate-900" /> {language === 'hi' ? 'तैयार है (Ready)' : 'Ready for Voice Query'}</>}
              {appState === 'LISTENING' && <><Mic size={12} className="text-red-600 animate-pulse" /> {language === 'hi' ? 'सुन रहे हैं…' : 'Listening…'}</>}
              {appState === 'THINKING'  && <><RefreshCw size={12} className="animate-spin text-slate-900" /> {language === 'hi' ? 'उत्तर तैयार हो रहा है…' : 'AI Processing…'}</>}
              {isSpeaking               && <><Volume2 size={12} className="text-emerald-700 animate-bounce" /> {language === 'hi' ? 'ऑडियो चल रहा है…' : 'AI Speaking…'}</>}
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              {activeConversation?.messages?.length > 0
                ? (language === 'hi' ? 'अगला सवाल पूछें' : 'Ask Next Question')
                : (language === 'hi' ? 'बोलकर सवाल पूछें' : 'Ask with Your Voice')}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
              {language === 'hi'
                ? 'मंडी भाव, सरकारी योजनाएं, फसल सलाह — अपनी भाषा में'
                : 'Mandi rates, government schemes, crop advisory in your local dialect'}
            </p>

            {/* Mic Button & Quick Action Controls */}
            <div className="flex flex-col items-center justify-center gap-3 mb-6">
              <div className={cn('mic-wrap', appState === 'LISTENING' && 'listening')}>
                {(appState === 'LISTENING') && (
                  <>
                    <div className="mic-ring" />
                    <div className="mic-ring-2" />
                  </>
                )}
                <button
                  id="mic-btn"
                  onClick={appState === 'LISTENING' ? handleStopListening : handleStartListening}
                  disabled={isProcessing}
                  className={cn(
                    'mic-btn',
                    appState === 'LISTENING'  && 'listening',
                    isSpeaking                && 'speaking',
                    isProcessing              && 'processing'
                  )}
                  aria-label={appState === 'LISTENING' ? 'Stop listening' : 'Start listening'}
                >
                  {isSpeaking ? (
                    <div className="waveform text-white">
                      {[...Array(5)].map((_, i) => <div key={i} className="waveform-bar" />)}
                    </div>
                  ) : isProcessing ? (
                    <RefreshCw size={30} className="animate-spin text-white" />
                  ) : appState === 'LISTENING' ? (
                    <MicOff size={30} className="text-white" />
                  ) : (
                    <Mic size={30} className="text-white" />
                  )}
                </button>
              </div>

              {/* Stop AI Voice Button */}
              {isSpeaking && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopSpeaking}
                  className="gap-2 font-bold rounded-full px-5 text-xs shadow-md"
                >
                  <VolumeX size={14} />
                  {language === 'hi' ? 'आवाज़ बंद करें (Stop Voice)' : 'Stop AI Voice Output'}
                </Button>
              )}
            </div>

            {/* Live transcript */}
            {transcript && (
              <p className="text-slate-800 text-sm font-semibold italic mb-4 animate-pulse px-4 max-w-md mx-auto bg-slate-50 py-2 rounded-xl border border-slate-200">
                "{transcript}"
              </p>
            )}

            {/* Typed Text Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typedQuery.trim() && !isProcessing) {
                  handleProcessQuery(typedQuery);
                  setTypedQuery('');
                }
              }}
              className="flex items-center gap-2 max-w-lg mx-auto mb-6"
            >
              <input
                type="text"
                value={typedQuery}
                onChange={(e) => setTypedQuery(e.target.value)}
                placeholder={language === 'hi' ? 'यहाँ अपना सवाल लिखें (Type question here)...' : 'Type your question here...'}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              <Button
                type="submit"
                disabled={isProcessing || !typedQuery.trim()}
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs gap-1.5 shrink-0 transition-all disabled:opacity-50"
              >
                <Send size={13} />
                {language === 'hi' ? 'भेजें' : 'Send'}
              </Button>
            </form>

            {/* Demo Presets */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                {language === 'hi' ? 'त्वरित उदाहरण' : 'Quick Preset Examples'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {DEMO_PRESETS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      id={`preset-${i}`}
                      onClick={() => handlePresetSelect(p)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition-all disabled:opacity-40"
                    >
                      <Icon size={12} className="text-slate-600" />
                      {language === 'hi' ? p.label_hi : p.label_en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton while processing */}
        {isProcessing && <SkeletonCard />}

        {/* ── Interactive Agricultural ML Models Panel ── */}
        <AgriculturalModelsPanel language={language} />

        {/* ── Distress Prediction Module Card ── */}
        <div className="mb-4">
          <DistressCard
            cropType="wheat"
            cropStage="vegetative"
            daysToLoanDue={15}
            conversationMessages={activeConversation?.messages || []}
          />
        </div>

        {/* ── BOTTOM CONVERSATION MESSAGE HISTORY THREAD ────────────── */}
        {activeConversation?.messages?.length > 0 && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} />
                {language === 'hi' ? 'बातचीत इतिहास (Message History)' : 'Conversation Messages'}
              </p>
            </div>

            {activeConversation.messages.map((msg, idx) => {
              const msgId = msg._id || msg.id || idx;
              const isDetailedOpen = !!showDetailedMap[msgId];

              return (
                <div key={msgId} className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  {/* User Query Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-xl bg-zinc-900 text-white p-4 rounded-2xl rounded-tr-xs shadow-sm space-y-1">
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 font-bold">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {language === 'hi' ? 'आप (किसान)' : 'You'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Response Bubble — Ultra-Clean Modern AI Chat UI */}
                  <div className="response-card bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                    {/* Top Row: AI Avatar / Title + Play Audio */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                          <Sparkles size={14} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          LokVani AI
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={isSpeaking ? 'destructive' : 'default'}
                        className="h-7 text-xs gap-1.5 px-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        onClick={() => handlePlayTTS(primaryAnswer(msg))}
                      >
                        {isSpeaking
                          ? <><VolumeX size={12} /> {language === 'hi' ? 'रोकें' : 'Stop'}</>
                          : <><Volume2 size={12} /> {language === 'hi' ? 'सुनाएं' : 'Listen'}</>}
                      </Button>
                    </div>

                    {/* Primary Answer Text */}
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                        {primaryAnswer(msg)}
                      </p>
                      {msg.shortAnswerEn && msg.shortAnswerHi && msg.shortAnswerEn !== msg.shortAnswerHi && (
                        <p className="text-xs text-slate-500 italic leading-normal">
                          {dialect !== 'en' ? `EN: ${msg.shortAnswerEn}` : `HI: ${msg.shortAnswerHi}`}
                        </p>
                      )}
                    </div>

                    {/* Detailed Answer (Expandable if different) */}
                    {detailedAnswer(msg) && detailedAnswer(msg) !== primaryAnswer(msg) && (
                      <div className="pt-2">
                        <button
                          onClick={() => toggleDetailed(msgId)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition-colors"
                        >
                          <MessageSquare size={13} />
                          {language === 'hi' ? 'विस्तृत उत्तर देखें' : 'View Detailed Answer'}
                          {isDetailedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isDetailedOpen && (
                          <p className="mt-2 text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                            {detailedAnswer(msg)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* High-Stakes Review Alert */}
                    {msg.isHighStakes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                        <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            {language === 'hi' ? 'मानव सत्यापन आवश्यक है' : 'Human Verification Recommended'}
                          </p>
                          <p className="text-xs text-amber-800 mt-0.5">{msg.trustNote}</p>
                        </div>
                      </div>
                    )}

                    {/* Actionable Steps (Clean Checklist) */}
                    {msg.actionableSteps?.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {language === 'hi' ? 'अनुशंसित कदम' : 'Recommended Steps'}
                        </p>
                        <div className="space-y-1.5">
                          {msg.actionableSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Questions (Sleek Interactive Pill Chips) */}
                    {msg.followUpQuestions?.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {language === 'hi' ? 'संबंधित प्रश्न' : 'Related Questions'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.followUpQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleProcessQuery(q)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                            >
                              <ArrowRight size={11} className="text-emerald-700" />
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sleek Metadata Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 size={12} />
                          {msg.isHighStakes
                            ? (language === 'hi' ? 'समीक्षा आवश्यक' : 'Needs Review')
                            : (language === 'hi' ? 'सत्यापित' : 'Auto Verified')}
                        </span>
                        {msg.domain && (
                          <span className="uppercase text-[10px] tracking-wider text-slate-400">
                            • {msg.domain.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 text-slate-400 hover:text-red-600 transition-colors"
                        title={language === 'hi' ? 'यह संदेश हटाएं' : 'Delete message'}
                        onClick={() => {
                          if (isSpeaking) stopSpeaking();
                          deleteMessageFromActiveConv(msgId);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Skeleton while thinking */}
        {isProcessing && <SkeletonCard />}
      </div>

      {/* ── Price Report Modal ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full shadow-2xl">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <h3 className="text-base font-bold">Report Local Mandi Rate</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowModal(false)}>
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePriceReport} className="space-y-3">
                {[
                  { label: 'Commodity', value: reportItem, set: setReportItem, type: 'text' },
                  { label: 'Rate (₹/kg)', value: reportPrice, set: setReportPrice, type: 'number' },
                  { label: 'Mandi Location', value: reportLocation, set: setReportLocation, type: 'text' },
                ].map(({ label, value, set, type }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type={type} value={value} onChange={e => set(e.target.value)} required
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="gap-1.5"><Send size={13} /> Submit</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
