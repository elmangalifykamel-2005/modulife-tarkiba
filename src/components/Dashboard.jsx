import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';
import TimerWidget from './TimerWidget';
import WaterWidget from './WaterWidget';
import MealWidget from './MealWidget';
import ProjectsWidget from './ProjectsWidget';
import TipsWidget from './TipsWidget';
import PrayerTimesWidget from './PrayerTimesWidget';
import CircadianScheduleWidget from './CircadianScheduleWidget';

export function Dashboard({ onLogout, onEditProfile }) {
  const { t, lang, setLang } = useTranslation();
  const { userProfile, on, off } = useEventStore();
  const [notification, setNotification] = useState(null);

  // Handle Event Bus notifications for layout alerts
  useEffect(() => {
    const handleNotification = (notif) => {
      setNotification(notif);
      
      // Auto-hide alert after 8 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    };

    on('notify', handleNotification);
    return () => off('notify', handleNotification);
  }, []);

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Dashboard Top Navigation */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="logo-icon-sm">T</div>
          <h2>ModuLife <span className="brand-sub">/ تركيبة</span></h2>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="notification-banner animate-slide-down">
            <span className="banner-icon">🔔</span>
            <div className="banner-text">
              <strong>{lang === 'ar' ? notification.titleAr : notification.title}</strong>
              <p>{lang === 'ar' ? notification.messageAr : notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="banner-close">✕</button>
          </div>
        )}

        <div className="header-actions">
          <button 
            className="btn-header"
            onClick={onEditProfile}
            title={lang === 'ar' ? 'تعديل الملف البيولوجي' : 'Edit Bio Profile'}
          >
            ⚙️ {lang === 'ar' ? 'الملف الشخصي' : 'Bio Profile'}
          </button>

          <button 
            className={`lang-btn-sm ${lang === 'ar' ? 'active' : ''}`} 
            onClick={() => setLang('ar')}
          >
            عربي
          </button>
          <button 
            className={`lang-btn-sm ${lang === 'en' ? 'active' : ''}`} 
            onClick={() => setLang('en')}
          >
            EN
          </button>

          <button onClick={onLogout} className="btn-logout">
            🚪 {t('dashboard.logout')}
          </button>
        </div>
      </header>

      {/* Main Grid container containing modular components */}
      <main className="dashboard-grid">
        <div className="grid-col-6 animate-fade-in-up">
          <TimerWidget />
        </div>
        <div className="grid-col-6 animate-fade-in-up delay-1">
          <WaterWidget />
        </div>
        <div className="grid-col-6 animate-fade-in-up delay-2">
          <MealWidget />
        </div>
        <div className="grid-col-6 animate-fade-in-up delay-3">
          <PrayerTimesWidget />
        </div>
        <div className="grid-col-6 animate-fade-in-up delay-4">
          <ProjectsWidget />
        </div>
        <div className="grid-col-6 animate-fade-in-up delay-5">
          <TipsWidget />
        </div>
        
        {/* Full-width chronological schedule roadmap */}
        <div className="grid-col-12 animate-fade-in-up delay-5" style={{ gridColumn: 'span 12' }}>
          <CircadianScheduleWidget />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
