import React, { useState, useEffect, useMemo, useId } from 'react';
import { 
  Users, 
  Package, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  PlusCircle, 
  X, 
  Trash2,
  Inbox,
  Award,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { t } from './communityTranslations.js';
import { 
  createCropPool, 
  joinCropPool, 
  deleteCropPool, 
  getOrCreateUserId, 
  normalizePool, 
  subscribeCropPools,
  sanitizeText
} from '../../services/poolService.js';

const STATUS_BADGE = {
  OPEN:    { color: 'var(--accent-primary, #15803d)', bg: 'rgba(21,128,61,0.08)', labelEn: 'Open', labelHi: 'खुला है' },
  FILLING: { color: 'var(--text-main, #18181b)',      bg: 'var(--bg-hover, #f4f4f5)', labelEn: 'Almost Full', labelHi: 'लगभग भर गया' },
  CLOSED:  { color: 'var(--text-dim, #71717a)',       bg: 'var(--bg-hover, #f4f4f5)', labelEn: 'Full', labelHi: 'भर गया' },
};

function PoolProgressBar({ filled, target, status, lang }) {
  const pct = Math.min(100, Math.max(0, Math.round((filled / target) * 100)));
  const barColor = status === 'CLOSED' ? 'var(--text-dim, #71717a)' : 'var(--accent-primary, #15803d)';

  return (
    <div style={{ margin: '14px 0 10px 0' }}>
      <div
        role="progressbar"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={target}
        style={{ height: '7px', background: 'var(--border-subtle, #e2e8f0)', borderRadius: '9999px', overflow: 'hidden' }}
      >
        <div 
          style={{ width: `${pct}%`, background: barColor, height: '100%', borderRadius: '9999px', transition: 'width 0.4s ease' }} 
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px', fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--text-muted, #64748b)' }}>
          <strong style={{ color: 'var(--accent-primary, #15803d)', fontWeight: 700 }}>{filled}</strong> / {target} {lang === 'hi' ? 'क्विंटल' : 'qtl'}
        </span>
        <span style={{ color: 'var(--accent-primary, #15803d)', fontWeight: 700 }}>
          {pct}% {t('poolFilled', lang)}
        </span>
      </div>
    </div>
  );
}

function CreatePoolModal({ isOpen, onClose, onCreate, lang }) {
  const [commodity, setCommodity] = useState('');
  const [category, setCategory] = useState('Vegetable');
  const [targetQtl, setTargetQtl] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [qualityRequired, setQualityRequired] = useState('Grade A');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const safeCrop = sanitizeText(commodity, 60);
    const safeBuyer = sanitizeText(buyerName, 80);
    const safeLoc = sanitizeText(buyerLocation, 80);
    const target = Number(targetQtl);
    const price = Number(offerPrice);

    if (!safeCrop) { setError(lang === 'hi' ? 'कृपया वैध फसल का नाम दर्ज करें।' : 'Please enter valid crop name.'); return; }
    if (!target || target <= 0 || target > 100000) { setError(lang === 'hi' ? 'कृपया वैध लक्ष्य मात्रा दर्ज करें (1 - 1,00,000)।' : 'Please enter target volume (1 - 100,000 qtl).'); return; }
    if (!price || price <= 0 || price > 1000000) { setError(lang === 'hi' ? 'कृपया वैध भाव दर्ज करें (₹1 - ₹10,00,000)।' : 'Please enter valid offer price.'); return; }
    if (!safeLoc) { setError(lang === 'hi' ? 'कृपया मंडी या स्थान दर्ज करें।' : 'Please enter market location.'); return; }
    if (!deadline) { setError(lang === 'hi' ? 'कृपया अंतिम तिथि चुनें।' : 'Please select a deadline date.'); return; }

    const creatorId = getOrCreateUserId();
    const newPool = {
      poolId: `pool_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      commodity_hi: safeCrop,
      commodity_en: safeCrop,
      category_hi: category === 'Vegetable' ? 'सब्ज़ी' : (category === 'Grain' ? 'अनाज' : (category === 'Pulse' ? 'दाल' : 'तिलहन')),
      category_en: category,
      targetQtl: target,
      filledQtl: 0,
      buyerName: safeBuyer || (lang === 'hi' ? 'स्थानीय APMC मंडी समूह' : 'Local APMC Procurement'),
      buyerLocation: safeLoc,
      offerPrice: price,
      deadline,
      qualityRequired: sanitizeText(qualityRequired, 40) || 'Grade A',
      status: 'OPEN',
      coordinatorName_hi: 'किराना ट्रस्ट नोड (सत्यापित)',
      coordinatorName_en: 'Kirana Trust Node (Verified)',
      participants: 1,
      createdByUserId: creatorId,
    };

    onCreate(newPool);
    onClose();
  }

  return (
    <div className="community-int__modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-hover, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '20px', padding: '6px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '16px', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {lang === 'hi' ? ' नया फसल समूह (FPO Pool) बनाएं' : ' Start a Selling Pool'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                {lang === 'hi' ? 'अपने क्षेत्र के किसानों को साथ जोड़कर थोक भाव प्राप्त करें' : 'Group sell harvest to get higher wholesale mandi prices'}
              </p>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'फसल का नाम *' : 'Crop Name *'}</label>
                <input type="text" className="community-int__input" placeholder={lang === 'hi' ? 'उदा. टमाटर / गेहूं' : 'e.g. Tomato / Wheat'} value={commodity} onChange={e => setCommodity(e.target.value)} maxLength={60} required />
              </div>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'श्रेणी *' : 'Category *'}</label>
                <select className="community-int__select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Vegetable">{lang === 'hi' ? 'सब्ज़ी (Vegetable)' : 'Vegetable'}</option>
                  <option value="Grain">{lang === 'hi' ? 'अनाज (Grain)' : 'Grain'}</option>
                  <option value="Pulse">{lang === 'hi' ? 'दाल (Pulse)' : 'Pulse'}</option>
                  <option value="Oilseed">{lang === 'hi' ? 'तिलहन (Oilseed)' : 'Oilseed'}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'कुल लक्ष्य (क्विंटल) *' : 'Target Volume (Qtl) *'}</label>
                <input type="number" min="1" max="100000" className="community-int__input" placeholder="100" value={targetQtl} onChange={e => setTargetQtl(e.target.value)} required />
              </div>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'भाव (₹/क्विंटल) *' : 'Offer Price (₹/Qtl) *'}</label>
                <input type="number" min="1" max="1000000" className="community-int__input" placeholder="2500" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'मंडी / स्थान *' : 'Destination Market *'}</label>
                <input type="text" className="community-int__input" placeholder={lang === 'hi' ? 'उदा. लखनऊ APMC' : 'e.g. Lucknow APMC'} value={buyerLocation} onChange={e => setBuyerLocation(e.target.value)} maxLength={80} required />
              </div>
              <div>
                <label className="community-int__label">{lang === 'hi' ? 'अंतिम तिथि *' : 'Deadline Date *'}</label>
                <input type="date" className="community-int__input" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="community-int__label">{lang === 'hi' ? 'खरीदार / कंपनी नाम (वैकल्पिक)' : 'Buyer / Aggregator Name'}</label>
              <input type="text" className="community-int__input" placeholder={lang === 'hi' ? 'उदा. मदर डेयरी / ITC' : 'e.g. Mother Dairy / ITC'} value={buyerName} onChange={e => setBuyerName(e.target.value)} maxLength={80} />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.8rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: '0.86rem' }}>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</button>
              <button type="submit" className="btn-primary" style={{ borderRadius: '9999px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                <span>{lang === 'hi' ? 'समूह शुरू करें' : 'Create Pool'}</span>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={13} />
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function JoinPoolForm({ pool, onJoin, onClose, lang }) {
  const formId = useId();
  const [volume, setVolume] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const remaining = Math.max(0, pool.targetQtl - pool.filledQtl);
  const commodity = lang === 'hi' ? pool.commodity_hi : pool.commodity_en;

  function handleSubmit(e) {
    e.preventDefault();
    const vol = Number(volume);
    const safeName = sanitizeText(farmerName, 60);
    const safePhone = sanitizeText(phone, 15);

    if (!vol || vol <= 0) { setError(t('errorVolumeInvalid', lang)); return; }
    if (remaining > 0 && vol > remaining) { setError(t('errorVolumeExceed', lang)); return; }
    if (!safeName || safeName.length < 2) { setError(t('errorNameRequired', lang)); return; }
    if (safePhone && (!/^\d{10}$/.test(safePhone.replace(/\D/g, '')))) {
      setError(lang === 'hi' ? 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    onJoin({ poolId: pool.id, volume: vol, farmerName: safeName, phone: safePhone });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ padding: '16px', background: 'var(--bg-hover, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '12px', textAlign: 'center' }}>
        <CheckCircle size={28} color="var(--accent-primary, #15803d)" style={{ margin: '0 auto 6px' }} />
        <h5 style={{ margin: '4px 0', fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {lang === 'hi' ? 'सफलतापूर्वक जुड़ गए!' : 'Joined Pool Successfully!'}
        </h5>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 10px 0' }}>
          {lang === 'hi'
            ? `आपकी ${volume} क्विंटल ${commodity} पूल में दर्ज हो गई है।`
            : `Your ${volume} qtl of ${commodity} has been registered.`}
        </p>
        <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
          {t('closeBtn', lang)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {t('poolDeadline', lang)}: <strong>{new Date(pool.deadline).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</strong>
        &nbsp;·&nbsp;<span style={{ color: 'var(--accent-primary, #15803d)', fontWeight: 700 }}>{remaining} {t('remaining', lang)}</span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label className="community-int__label" htmlFor={`${formId}-vol`}>
            {t('joinVolLabel', lang)} *
          </label>
          <input
            id={`${formId}-vol`}
            type="number"
            min="0.1"
            max={remaining || pool.targetQtl}
            step="0.5"
            className="community-int__input"
            placeholder={`${lang === 'hi' ? 'मात्रा' : 'Volume'} (qtl)`}
            value={volume}
            onChange={e => { setVolume(e.target.value); setError(''); }}
            required
          />
        </div>
        <div>
          <label className="community-int__label" htmlFor={`${formId}-name`}>
            {t('joinNameLabel', lang)} *
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            className="community-int__input"
            placeholder={t('joinNamePlaceholder', lang)}
            value={farmerName}
            onChange={e => { setFarmerName(e.target.value); setError(''); }}
            maxLength={60}
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label className="community-int__label" htmlFor={`${formId}-phone`}>
          {lang === 'hi' ? 'मोबाइल नंबर (संपर्क हेतु)' : 'Mobile Number (optional)'}
        </label>
        <input
          id={`${formId}-phone`}
          type="tel"
          className="community-int__input"
          placeholder="9876543210"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={15}
        />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.78rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: '0.82rem' }}>{t('cancelBtn', lang)}</button>
        <button type="submit" className="btn-primary" style={{ fontSize: '0.82rem', borderRadius: '9999px', padding: '6px 16px' }}>
          <CheckCircle size={13} /> {t('joinConfirmBtn', lang)}
        </button>
      </div>
    </form>
  );
}

function PoolCard({ pool, onJoin, onDelete, isJoined, userQuantity, currentUserId, lang }) {
  const [showForm, setShowForm] = useState(false);
  const stCfg = STATUS_BADGE[pool.status] || STATUS_BADGE.OPEN;
  const statusLbl = lang === 'hi' ? stCfg.labelHi : stCfg.labelEn;
  const commodity = lang === 'hi' ? pool.commodity_hi : pool.commodity_en;
  const category = lang === 'hi' ? pool.category_hi : pool.category_en;

  const isCreator = Boolean(
    (pool.createdByUserId && pool.createdByUserId === currentUserId) ||
    (pool.id && String(pool.id).includes('pool_custom_'))
  );

  return (
    <div style={{ background: 'var(--bg-hover, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '16px', padding: '6px', height: '100%' }}>
      {/* Double-Bezel Architecture: Inner Core */}
      <article className="community-int__pool-card" style={{ background: 'var(--bg-surface, #ffffff)', border: isJoined ? '1.5px solid var(--accent-primary, #15803d)' : '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
        <div>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{commodity}</h4>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'var(--bg-hover, #f1f5f9)', color: 'var(--text-muted)', fontWeight: 600 }}>{category}</span>
                <span style={{ color: stCfg.color, background: stCfg.bg, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>{statusLbl}</span>
                {isJoined && (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(21,128,61,0.08)', color: 'var(--accent-primary, #15803d)', border: '1px solid rgba(21,128,61,0.2)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={12} /> {lang === 'hi' ? `जुड़े हैं (${userQuantity} Qtl)` : `Joined (${userQuantity} Qtl)`}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                <Package size={13} style={{ color: 'var(--accent-primary, #15803d)', display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {pool.buyerName}
                <span style={{ marginLeft: '8px', color: 'var(--text-dim)' }}>
                  <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> {pool.buyerLocation}
                </span>
              </p>
            </div>
            
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary, #15803d)', margin: 0, lineHeight: 1 }}>
                ₹{pool.offerPrice?.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0 }}>{t('perQtl', lang)}</p>

              {isCreator && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(lang === 'hi' ? 'क्या आप इस समूह को हटाना चाहते हैं?' : 'Delete this selling pool?')) {
                      onDelete?.(pool.id);
                    }
                  }}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    marginTop: '4px'
                  }}
                >
                  <Trash2 size={11} />
                  <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                </button>
              )}
            </div>
          </header>

          <PoolProgressBar filled={pool.filledQtl} target={pool.targetQtl} status={pool.status} lang={lang} />

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle, #f1f5f9)', paddingTop: '10px', marginTop: '6px' }}>
            <span><Users size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> {pool.participants} {t('poolFarmers', lang)}</span>
            <span>
              <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
              {t('poolDeadline', lang)}: {new Date(pool.deadline).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
            </span>
            <span>{t('poolQuality', lang)}: {pool.qualityRequired}</span>
          </div>
        </div>

        {/* Card Footer Action */}
        <div style={{ marginTop: '14px' }}>
          {!showForm ? (
            <button
              type="button"
              className={pool.status === 'CLOSED' ? 'btn-secondary' : 'btn-primary'}
              style={{
                fontSize: '0.85rem',
                borderRadius: '9999px',
                padding: '8px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center'
              }}
              onClick={() => setShowForm(true)}
              disabled={pool.status === 'CLOSED'}
            >
              <span>
                {pool.status === 'CLOSED' ? t('poolFull', lang) : (isJoined ? (lang === 'hi' ? 'और मात्रा जोड़ें' : 'Add More Volume') : t('addVolumeBtn', lang))}
              </span>
              {pool.status !== 'CLOSED' && (
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={12} />
                </span>
              )}
            </button>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-subtle, #f1f5f9)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{t('joinFormTitle', lang)}</p>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                  <X size={16} />
                </button>
              </div>
              <JoinPoolForm pool={pool} onJoin={data => { onJoin?.(data); setShowForm(false); }} onClose={() => setShowForm(false)} lang={lang} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export default function FPOPooling({ lang = 'en' }) {
  const currentUserId = useMemo(() => getOrCreateUserId(), []);
  const [poolList, setPoolList] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [joinedPools, setJoinedPools] = useState(() => {
    try {
      const saved = localStorage.getItem('lokvani_user_joined_pools');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Sub-100ms real-time push stream across all users
  useEffect(() => {
    const unsubscribe = subscribeCropPools((livePools) => {
      if (Array.isArray(livePools)) {
        setPoolList(livePools);
      }
    });

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('lokvani_user_joined_pools', JSON.stringify(joinedPools));
  }, [joinedPools]);

  function handleJoin({ poolId, volume, farmerName, phone }) {
    // Instant local render update (0ms delay)
    setPoolList(prev => prev.map(p => {
      if (p.id !== poolId && p.poolId !== poolId) return p;
      const newFilled = Math.min(p.targetQtl, p.filledQtl + volume);
      return {
        ...p,
        filledQtl: newFilled,
        participants: p.participants + 1,
        status: newFilled >= p.targetQtl ? 'CLOSED' : 'FILLING',
      };
    }));

    setJoinedPools(prev => ({
      ...prev,
      [poolId]: (prev[poolId] || 0) + volume,
    }));

    // Real-time push to all users via Firestore WebSockets + background MongoDB save
    joinCropPool(poolId, { farmerName, phone, qtl: volume });
  }

  function handleCreatePool(newPool) {
    const normalized = normalizePool(newPool);
    setPoolList(prev => [normalized, ...prev]);
    createCropPool(newPool);
  }

  function handleDeletePool(poolId) {
    setPoolList(prev => prev.filter(p => p.id !== poolId && p.poolId !== poolId));
    deleteCropPool(poolId);
  }

  const filteredPools = poolList.filter(p => {
    if (filterCategory === 'ALL') return true;
    return p.category_en?.toLowerCase() === filterCategory.toLowerCase();
  });

  return (
    <section className="community-int__section" aria-labelledby="ci-fpo-heading">
      {/* Clean Header */}
      <div className="community-int__section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 className="community-int__section-title" id="ci-fpo-heading" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            <Users size={20} color="var(--accent-primary, #15803d)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            {t('fpoSectionTitle', lang)}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
            {t('fpoSectionSub', lang)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ fontSize: '0.88rem', borderRadius: '9999px', padding: '9px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>{lang === 'hi' ? 'नया समूह बनाएं' : 'Start a Selling Pool'}</span>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={13} />
          </span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { key: 'ALL', label_hi: 'सभी समूह', label_en: 'All Pools' },
          { key: 'Vegetable', label_hi: 'सब्जियां', label_en: 'Vegetables' },
          { key: 'Grain', label_hi: 'अनाज', label_en: 'Grains' },
          { key: 'Pulse', label_hi: 'दालें', label_en: 'Pulses' },
          { key: 'Oilseed', label_hi: 'तिलहन', label_en: 'Oilseeds' },
        ].map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setFilterCategory(cat.key)}
            className={`community-int__pill ${filterCategory === cat.key ? 'community-int__pill--active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '5px 16px', borderRadius: '9999px' }}
          >
            {lang === 'hi' ? cat.label_hi : cat.label_en}
          </button>
        ))}
      </div>

      {/* Pools Grid or Empty State */}
      {filteredPools.length === 0 ? (
        <div style={{ background: 'var(--bg-hover, #f8fafc)', border: '1px dashed var(--border-muted, #cbd5e1)', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
          <Inbox size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {lang === 'hi' ? 'इस श्रेणी में अभी कोई सक्रिय फसल समूह नहीं है' : 'No Active Selling Pools in this Category'}
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '6px auto 18px', maxWidth: '420px' }}>
            {lang === 'hi'
              ? 'फसलों का सामूहिक एकत्रीकरण करके मंडी व्यापारियों से बेहतर थोक भाव प्राप्त करने के लिए पहला समूह बनाएं।'
              : 'Start the first selling pool in your district to negotiate higher bulk prices with buyers.'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ fontSize: '0.86rem', borderRadius: '9999px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>{lang === 'hi' ? 'पहला समूह शुरू करें' : 'Create First Pool'}</span>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={12} />
            </span>
          </button>
        </div>
      ) : (
        <div className="community-int__pool-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredPools.map(pool => (
            <PoolCard 
              key={pool.id || pool.poolId} 
              pool={pool} 
              onJoin={handleJoin} 
              onDelete={handleDeletePool}
              isJoined={Boolean(joinedPools[pool.id] || joinedPools[pool.poolId])} 
              userQuantity={joinedPools[pool.id] || joinedPools[pool.poolId] || 0}
              currentUserId={currentUserId}
              lang={lang} 
            />
          ))}
        </div>
      )}

      {/* Start Pool Modal */}
      <CreatePoolModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreatePool} 
        lang={lang} 
      />
    </section>
  );
}
