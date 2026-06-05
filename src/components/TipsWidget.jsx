import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';

export function TipsWidget() {
  const { t, getTips, lang } = useTranslation();
  const [tips, setTips] = useState([]);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);

  useEffect(() => {
    const loadedTips = getTips();
    setTips(loadedTips);
    setCurrentTipIdx(Math.floor(Math.random() * (loadedTips.length || 1)));
  }, [lang]);

  useEffect(() => {
    // Automatically rotate tips every 45 seconds
    if (tips.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTipIdx(prev => (prev + 1) % tips.length);
    }, 45000);
    return () => clearInterval(interval);
  }, [tips]);

  const handleNextTip = () => {
    if (tips.length === 0) return;
    setCurrentTipIdx(prev => (prev + 1) % tips.length);
  };

  const handlePrevTip = () => {
    if (tips.length === 0) return;
    setCurrentTipIdx(prev => (prev - 1 + tips.length) % tips.length);
  };

  const currentTip = tips[currentTipIdx];

  // Helper to categorize tips based on keywords for a custom visual badge
  const getTipCategory = (text) => {
    if (!text) return '';
    const lower = text.toLowerCase();
    if (lower.includes('sugar') || lower.includes('insulin') || lower.includes('glucose') || text.includes('سكر') || text.includes('أنسولين') || text.includes('جلوكوز')) {
      return { en: 'Insulin Stability', ar: 'استقرار الأنسولين', class: 'badge-sugar' };
    }
    if (lower.includes('gluten') || lower.includes('wheat') || lower.includes('gliadin') || text.includes('جلوتين') || text.includes('قمح') || text.includes('جليادين')) {
      return { en: 'Gluten-Free', ar: 'خالٍ من الجلوتين', class: 'badge-gluten' };
    }
    if (lower.includes('snack') || lower.includes('fasting') || lower.includes('meal') || text.includes('سناكس') || text.includes('تلقيم') || text.includes('وجبات') || text.includes('صيام')) {
      return { en: 'Metabolic Fasting', ar: 'الصيام الهضمي', class: 'badge-fasting' };
    }
    return { en: 'General Bioscience', ar: 'علوم حيوية عامة', class: 'badge-general' };
  };

  if (!currentTip) {
    return <div className="widget-card tips-widget loading">Loading tips...</div>;
  }

  const category = getTipCategory(currentTip.text);

  return (
    <div className="widget-card tips-widget animate-fade-in">
      <div className="widget-header">
        <h3>{t('dashboard.wellnessTips')}</h3>
        <span className={`badge ${category.class}`}>
          {lang === 'ar' ? category.ar : category.en}
        </span>
      </div>

      <div className="widget-body">
        <div className="tip-quote">
          <p className="tip-text">"{currentTip.text}"</p>
        </div>
        {currentTip.link && (
          <a 
            href={currentTip.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="source-link"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
            <span>{t('dashboard.readMore')}</span>
          </a>
        )}
      </div>

      <div className="widget-actions tips-navigation">
        <button onClick={handlePrevTip} className="btn-icon" aria-label="Previous Tip">
          {lang === 'ar' ? '→' : '←'}
        </button>
        <span className="tip-counter">
          {currentTipIdx + 1} / {tips.length}
        </span>
        <button onClick={handleNextTip} className="btn-icon" aria-label="Next Tip">
          {lang === 'ar' ? '←' : '→'}
        </button>
      </div>
    </div>
  );
}

export default TipsWidget;
