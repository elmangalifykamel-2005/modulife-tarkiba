import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const PRESET_CITIES = {
  makkah: { name: 'Makkah', nameAr: 'مكة المكرمة', lat: 21.4225, lng: 39.8262 },
  riyadh: { name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
  cairo: { name: 'Cairo', nameAr: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  dubai: { name: 'Dubai', nameAr: 'دبي', lat: 25.2048, lng: 55.2708 },
  amman: { name: 'Amman', nameAr: 'عمان', lat: 31.9522, lng: 35.8308 },
  london: { name: 'London', nameAr: 'لندن', lat: 51.5074, lng: -0.1278 },
  newyork: { name: 'New York', nameAr: 'نيويورك', lat: 40.7128, lng: -74.0060 }
};

const METHODS_MAP = {
  UmmAlQura: 'UmmAlQura',
  MuslimWorldLeague: 'MuslimWorldLeague',
  Egyptian: 'Egyptian',
  Karachi: 'Karachi',
  NorthAmerica: 'NorthAmerica'
};

const getMethodParams = (methodName) => {
  switch (methodName) {
    case 'MuslimWorldLeague': return CalculationMethod.MuslimWorldLeague();
    case 'Egyptian': return CalculationMethod.Egyptian();
    case 'Karachi': return CalculationMethod.Karachi();
    case 'NorthAmerica': return CalculationMethod.NorthAmerica();
    case 'UmmAlQura':
    default:
      return CalculationMethod.UmmAlQura();
  }
};

export function PrayerTimesWidget() {
  const { t, lang } = useTranslation();

  // Load configuration from local storage or defaults
  const [lat, setLat] = useState(() => Number(localStorage.getItem('prayer_lat')) || 21.4225);
  const [lng, setLng] = useState(() => Number(localStorage.getItem('prayer_lng')) || 39.8262);
  const [city, setCity] = useState(() => localStorage.getItem('prayer_city') || 'makkah');
  const [method, setMethod] = useState(() => localStorage.getItem('prayer_method') || 'UmmAlQura');
  const [showSettings, setShowSettings] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculation output state
  const [prayers, setPrayers] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [isPrayerActive, setIsPrayerActive] = useState(false);

  // Recalculate prayer times when settings change
  useEffect(() => {
    try {
      const coords = new Coordinates(lat, lng);
      const params = getMethodParams(method);
      const date = new Date();
      const times = new PrayerTimes(coords, date, params);
      setPrayers(times);
      setErrorMsg('');
    } catch (e) {
      console.error(e);
      setErrorMsg(lang === 'ar' ? 'فشل حساب المواقيت للموقع الحالي' : 'Failed to calculate times for coordinates.');
    }
  }, [lat, lng, method, lang]);

  // Update countdown to next prayer every second
  useEffect(() => {
    if (!prayers) return;

    const updateCountdown = () => {
      const now = new Date();
      const coords = new Coordinates(lat, lng);
      const params = getMethodParams(method);

      // List of actual prayers
      const list = [
        { name: 'fajr', time: prayers.fajr },
        { name: 'dhuhr', time: prayers.dhuhr },
        { name: 'asr', time: prayers.asr },
        { name: 'maghrib', time: prayers.maghrib },
        { name: 'isha', time: prayers.isha }
      ];

      // Find next prayer today
      let next = list.find(item => item.time > now);

      // If all passed, it is Fajr tomorrow
      if (!next) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = new PrayerTimes(coords, tomorrow, params);
        next = { name: 'fajr', time: tomorrowTimes.fajr, isTomorrow: true };
      }

      setNextPrayer(next);

      // Calculate countdown
      const diffMs = next.time - now;
      if (diffMs > 0) {
        const diffSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;

        if (lang === 'ar') {
          if (hrs > 0) {
            setCountdown(`${hrs} ساعة و ${mins} دقيقة`);
          } else {
            setCountdown(`${mins} دقيقة و ${secs} ثانية`);
          }
        } else {
          if (hrs > 0) {
            setCountdown(`${hrs}h ${mins}m`);
          } else {
            setCountdown(`${mins}m ${secs}s`);
          }
        }
      }

      // Check if any prayer is currently active (within 15 minutes of start)
      let active = false;
      const allPrayers = [prayers.fajr, prayers.dhuhr, prayers.asr, prayers.maghrib, prayers.isha];
      for (const time of allPrayers) {
        const diff = now - time;
        if (diff >= 0 && diff < 15 * 60 * 1000) {
          active = true;
          break;
        }
      }
      setIsPrayerActive(active);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayers, lat, lng, method, lang]);

  // Handle preset city change
  const handleCityChange = (e) => {
    const val = e.target.value;
    setCity(val);
    localStorage.setItem('prayer_city', val);
    
    if (val !== 'custom' && PRESET_CITIES[val]) {
      const selected = PRESET_CITIES[val];
      setLat(selected.lat);
      setLng(selected.lng);
      localStorage.setItem('prayer_lat', String(selected.lat));
      localStorage.setItem('prayer_lng', String(selected.lng));
    }
  };

  // Handle custom coordinates save
  const handleCoordsChange = (newLat, newLng) => {
    setCity('custom');
    localStorage.setItem('prayer_city', 'custom');
    setLat(newLat);
    setLng(newLng);
    localStorage.setItem('prayer_lat', String(newLat));
    localStorage.setItem('prayer_lng', String(newLng));
  };

  // Auto detect location using GPS
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setErrorMsg(lang === 'ar' ? 'نظام تحديد المواقع غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(4));
        const detectedLng = Number(position.coords.longitude.toFixed(4));
        
        setLat(detectedLat);
        setLng(detectedLng);
        setCity('custom');
        
        localStorage.setItem('prayer_lat', String(detectedLat));
        localStorage.setItem('prayer_lng', String(detectedLng));
        localStorage.setItem('prayer_city', 'custom');
        
        setDetecting(false);
      },
      (error) => {
        console.error(error);
        setDetecting(false);
        setErrorMsg(
          lang === 'ar' 
            ? 'فشل تحديد الموقع. يرجى تفعيل إذن الوصول للموقع الجغرافي.' 
            : 'Failed to acquire location. Please grant GPS permission.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMethodChange = (e) => {
    const val = e.target.value;
    setMethod(val);
    localStorage.setItem('prayer_method', val);
  };

  // Helper to format Date to hh:mm A
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!prayers) return null;

  const prayerItems = [
    { key: 'fajr', name: t('dashboard.fajr'), time: prayers.fajr, icon: '🌅' },
    { key: 'sunrise', name: t('dashboard.sunrise'), time: prayers.sunrise, icon: '☀️' },
    { key: 'dhuhr', name: t('dashboard.dhuhr'), time: prayers.dhuhr, icon: '☀️' },
    { key: 'asr', name: t('dashboard.asr'), time: prayers.asr, icon: '🌤️' },
    { key: 'maghrib', name: t('dashboard.maghrib'), time: prayers.maghrib, icon: '🌇' },
    { key: 'isha', name: t('dashboard.isha'), time: prayers.isha, icon: '🌃' }
  ];

  return (
    <div className={`widget-card prayer-widget ${isPrayerActive ? 'prayer-active-glow' : ''} animate-fade-in`}>
      <div className="widget-header">
        <h3>
          🕌 {t('dashboard.prayerTimes')}{' '}
          <span className="subtitle-detail">({city === 'custom' ? `${lat}°N, ${lng}°E` : (lang === 'ar' ? PRESET_CITIES[city]?.nameAr : PRESET_CITIES[city]?.name)})</span>
        </h3>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="btn-settings-toggle"
          aria-label="Toggle settings"
        >
          ⚙️
        </button>
      </div>

      <div className="widget-body">
        {showSettings ? (
          <div className="prayer-settings-form animate-fade-in">
            <div className="form-group">
              <label>{t('dashboard.manualCity')}</label>
              <select value={city} onChange={handleCityChange}>
                <option value="makkah">{lang === 'ar' ? 'مكة المكرمة' : 'Makkah'}</option>
                <option value="riyadh">{lang === 'ar' ? 'الرياض' : 'Riyadh'}</option>
                <option value="cairo">{lang === 'ar' ? 'القاهرة' : 'Cairo'}</option>
                <option value="dubai">{lang === 'ar' ? 'دبي' : 'Dubai'}</option>
                <option value="amman">{lang === 'ar' ? 'عمان' : 'Amman'}</option>
                <option value="london">{lang === 'ar' ? 'لندن' : 'London'}</option>
                <option value="newyork">{lang === 'ar' ? 'نيويورك' : 'New York'}</option>
                <option value="custom">{lang === 'ar' ? 'موقع مخصص (إحداثيات)' : 'Custom Location (Coordinates)'}</option>
              </select>
            </div>

            {city === 'custom' && (
              <div className="form-row">
                <div className="form-group">
                  <label>{t('dashboard.latitude')}</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    value={lat} 
                    onChange={(e) => handleCoordsChange(Number(e.target.value), lng)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('dashboard.longitude')}</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    value={lng} 
                    onChange={(e) => handleCoordsChange(lat, Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>{t('dashboard.calcMethod')}</label>
              <select value={method} onChange={handleMethodChange}>
                <option value="UmmAlQura">{t('dashboard.methodUmmAlQura')}</option>
                <option value="MuslimWorldLeague">{t('dashboard.methodMWL')}</option>
                <option value="Egyptian">{t('dashboard.methodEgyptian')}</option>
                <option value="Karachi">{t('dashboard.methodKarachi')}</option>
                <option value="NorthAmerica">{t('dashboard.methodISNA')}</option>
              </select>
            </div>

            <button 
              onClick={handleAutoDetect} 
              disabled={detecting}
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
            >
              📍 {detecting ? t('dashboard.detecting') : t('dashboard.autoDetect')}
            </button>

            {errorMsg && <div className="error-message-sm">{errorMsg}</div>}

            <button 
              onClick={() => setShowSettings(false)} 
              className="btn btn-reset" 
              style={{ marginTop: '12px' }}
            >
              {lang === 'ar' ? 'تم' : 'Done'}
            </button>
          </div>
        ) : (
          <>
            {isPrayerActive ? (
              <div className="prayer-alert-glow animate-pulse">
                <span className="alert-icon">🕌</span>
                <strong>{t('dashboard.timeForPrayer')}</strong>
              </div>
            ) : (
              nextPrayer && (
                <div className="next-prayer-banner">
                  <span className="banner-label">{t('dashboard.nextPrayer')}:</span>
                  <strong className="next-prayer-name">
                    {t(`dashboard.${nextPrayer.name}`)}
                  </strong>
                  <span className="next-prayer-countdown">
                    {countdown}
                  </span>
                </div>
              )
            )}

            <ul className="prayer-times-list">
              {prayerItems.map((item) => {
                const isNext = nextPrayer && nextPrayer.name === item.key;
                return (
                  <li 
                    key={item.key} 
                    className={`prayer-time-item ${isNext ? 'next-active' : ''} ${item.key === 'sunrise' ? 'sunrise-item' : ''}`}
                  >
                    <span className="prayer-name">
                      {item.icon} {item.name}
                    </span>
                    <span className="prayer-time-val">
                      {formatTime(item.time)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="widget-footer text-center">
        <span className="info-text-sm">
          {t('dashboard.prayerTimesSubtitle')}
        </span>
      </div>
    </div>
  );
}

export default PrayerTimesWidget;
