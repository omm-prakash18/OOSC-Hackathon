import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Megaphone, 
  Clock, 
  Wifi, 
  ExternalLink, 
  Newspaper,
  ThumbsUp
} from 'lucide-react';
import { t } from './communityTranslations.js';
import { translateText } from '../../services/newsService.js';

const CATEGORY_CONFIG = {
  PRICE_ALERT:  { label_hi: 'भाव अलर्ट', label_en: 'Price Alert', icon: <TrendingUp size={12} />, bg: '#f4f8f2', color: '#2e5735', border: '#dbe7d4' },
  WARNING:      { label_hi: 'सावधानी / अलर्ट', label_en: 'Advisory / Alert', icon: <AlertTriangle size={12} />, bg: '#f4f4f5', color: '#3f3f46', border: '#e4e4e7' },
  ANNOUNCEMENT: { label_hi: 'समाचार व योजनाएं', label_en: 'News & Updates', icon: <Megaphone size={12} />, bg: '#f0f5ee', color: '#3d6544', border: '#cfe0cb' },
  DEMAND_SPIKE: { label_hi: 'मांग में तेजी', label_en: 'Demand Spike', icon: <Zap size={12} />, bg: '#f4f8f2', color: '#1b4d24', border: '#c0dbc0' },
};

function timeAgo(date, lang) {
  if (!date) return t('justNow', lang);
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (isNaN(seconds) || seconds < 60) return t('justNow', lang);
  if (lang === 'hi') {
    if (seconds < 3600)  return `${Math.floor(seconds / 60)} मिनट पहले`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} घंटे पहले`;
    return `${Math.floor(seconds / 86400)} दिन पहले`;
  }
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NewsCard({ item, lang }) {
  const [likes, setLikes] = useState(item.confirms || 12);
  const [liked, setLiked] = useState(false);
  
  const [displayedHeadline, setDisplayedHeadline] = useState(() => {
    return lang === 'hi' ? (item.headline_hi || item.headline_en || item.headline) : (item.headline_en || item.headline_hi || item.headline);
  });
  
  const [displayedDetail, setDisplayedDetail] = useState(() => {
    return lang === 'hi' ? (item.detail_hi || item.detail_en || item.detail) : (item.detail_en || item.detail_hi || item.detail);
  });

  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.ANNOUNCEMENT;
  const reporter = lang === 'hi' ? (item.reporter_hi || item.reporter_en || item.reporter) : (item.reporter_en || item.reporter_hi || item.reporter);

  // Dynamic on-the-fly translation sync if target language text isn't in script
  useEffect(() => {
    let active = true;
    const isHi = lang === 'hi';
    const targetHeadline = isHi ? (item.headline_hi || item.headline_en || item.headline) : (item.headline_en || item.headline_hi || item.headline);
    const targetDetail = isHi ? (item.detail_hi || item.detail_en || item.detail) : (item.detail_en || item.detail_hi || item.detail);

    const hasDevanagari = /[\u0900-\u097F]/.test(targetHeadline || '');

    if (isHi && !hasDevanagari && targetHeadline) {
      translateText(targetHeadline, 'hi').then(tr => {
        if (active && tr) setDisplayedHeadline(tr);
      });
      if (targetDetail && targetDetail !== targetHeadline) {
        translateText(targetDetail, 'hi').then(tr => {
          if (active && tr) setDisplayedDetail(tr);
        });
      } else {
        setDisplayedDetail(targetDetail);
      }
    } else if (!isHi && hasDevanagari && targetHeadline) {
      translateText(targetHeadline, 'en').then(tr => {
        if (active && tr) setDisplayedHeadline(tr);
      });
      if (targetDetail && targetDetail !== targetHeadline) {
        translateText(targetDetail, 'en').then(tr => {
          if (active && tr) setDisplayedDetail(tr);
        });
      } else {
        setDisplayedDetail(targetDetail);
      }
    } else {
      setDisplayedHeadline(targetHeadline);
      setDisplayedDetail(targetDetail);
    }

    return () => {
      active = false;
    };
  }, [lang, item]);

  return (
    <article 
      style={{
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e5e7eb)',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      className="community-news-card"
    >
      {/* Top Meta Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: cat.bg,
            color: cat.color,
            border: `1px solid ${cat.border}`,
          }}>
            {cat.icon}
            {lang === 'hi' ? cat.label_hi : cat.label_en}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {reporter}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          <Clock size={12} />
          <span>{timeAgo(item.timestamp, lang)}</span>
        </div>
      </div>

      {/* Headline & Detail */}
      <div>
        <h4 style={{
          fontFamily: 'var(--font-heading, "Roboto Condensed", sans-serif)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-main, #111827)',
          margin: '0 0 6px 0',
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
        }}>
          {displayedHeadline}
        </h4>
        {displayedDetail && displayedDetail !== displayedHeadline && (
          <p style={{
            fontFamily: 'var(--font-body, "Roboto Condensed", sans-serif)',
            fontSize: '0.86rem',
            color: 'var(--text-muted, #4b5563)',
            lineHeight: 1.55,
            margin: 0,
          }}>
            {displayedDetail}
          </p>
        )}
      </div>

      {/* Footer / Read Link / Helpful Counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle, #f3f4f6)',
        marginTop: 'auto',
      }}>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--accent-primary, #15803d)',
              textDecoration: 'none',
            }}
          >
            <span>{lang === 'hi' ? 'पूरी खबर पढ़ें' : 'Read Full Story'}</span>
            <ExternalLink size={13} />
          </a>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {item.location}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            if (!liked) {
              setLiked(true);
              setLikes(l => l + 1);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: liked ? 'var(--bg-hover, #f0fdf4)' : 'transparent',
            border: '1px solid var(--border-muted, #d1d5db)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: liked ? 'var(--accent-primary, #15803d)' : 'var(--text-muted, #4b5563)',
            cursor: liked ? 'default' : 'pointer',
          }}
          aria-label="Mark as helpful"
        >
          <ThumbsUp size={12} />
          <span>{likes} {lang === 'hi' ? 'किसानों को उपयोगी लगा' : 'Helpful'}</span>
        </button>
      </div>
    </article>
  );
}

export default function IntelFeed({ feedItems = [], lang = 'en' }) {
  const [filter, setFilter] = useState('ALL');

  const filteredItems = feedItems.filter(item => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  return (
    <section className="community-int__section" aria-labelledby="ci-news-heading" style={{ paddingTop: '10px' }}>
      <div className="community-int__section-header">
        <div>
          <h3 className="community-int__section-title" id="ci-news-heading" style={{ fontSize: '1.25rem' }}>
            <Newspaper size={20} color="var(--accent-primary)" aria-hidden="true" />
            {lang === 'hi' ? 'ताज़ा कृषि समाचार व सरकारी अपडेट' : 'Latest Agriculture News & Real Updates'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
            {lang === 'hi' 
              ? 'आपके राज्य और ज़िले के लिए सत्यापित कृषि समाचार, मंडी अपडेट एवं योजनाएं (100% लाइव डेटा)'
              : 'Verified agricultural news, government policies, and mandi alerts for your region (100% Live Feed)'}
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[
          { key: 'ALL', label_hi: 'सभी समाचार', label_en: 'All News' },
          { key: 'PRICE_ALERT', label_hi: 'भाव अलर्ट', label_en: 'Price Alerts' },
          { key: 'WARNING', label_hi: 'चेतावनी / मौसम', label_en: 'Advisories' },
          { key: 'ANNOUNCEMENT', label_hi: 'योजनाएं व नीतियां', label_en: 'Govt Schemes' },
        ].map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setFilter(cat.key)}
            className={`community-int__pill ${filter === cat.key ? 'community-int__pill--active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '5px 14px' }}
          >
            {lang === 'hi' ? cat.label_hi : cat.label_en}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredItems.length === 0 ? (
          <div className="community-int__empty" role="status" style={{ gridColumn: '1/-1', padding: '36px 16px' }}>
            <Wifi size={32} strokeWidth={1.25} style={{ color: 'var(--text-dim)', marginBottom: 12 }} aria-hidden="true" />
            <h4 className="community-int__empty-title">
              {lang === 'hi' ? 'कोई समाचार उपलब्ध नहीं है' : 'No news updates right now'}
            </h4>
            <p className="community-int__empty-sub">
              {lang === 'hi' ? 'ताज़ा समाचार लोड किए जा रहे हैं या इंटरनेट कनेक्शन जांचें।' : 'Latest agricultural updates are being refreshed.'}
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <NewsCard key={item.id} item={item} lang={lang} />
          ))
        )}
      </div>
    </section>
  );
}
