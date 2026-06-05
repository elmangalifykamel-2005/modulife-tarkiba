import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';

export function MealWidget() {
  const { t, lang } = useTranslation();
  const { userProfile } = useEventStore();
  const [mealStatus, setMealStatus] = useState({
    activeMeal: null, // null, 'breakfast', 'lunch', 'dinner'
    nextMealName: '',
    nextMealTime: '',
    minutesToNextMeal: 0
  });

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatMinutesToTime = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!userProfile) return;

    const updateClock = () => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const wakeMin = parseTimeToMinutes(userProfile.wakeTime);
      
      // Calculate meal slots relative to wake time
      const breakfastMin = (wakeMin + 60) % 1440;   // Wake + 1 hr
      const lunchMin = (wakeMin + 360) % 1440;    // Wake + 6 hrs
      const dinnerMin = (wakeMin + 720) % 1440;   // Wake + 12 hrs

      // Define windows (e.g., 45 mins long window to eat)
      const windowLen = 45;

      const inWindow = (slotMin) => {
        const diff = (currentMin - slotMin + 1440) % 1440;
        return diff >= 0 && diff < windowLen;
      };

      let activeMeal = null;
      if (inWindow(breakfastMin)) activeMeal = 'breakfast';
      else if (inWindow(lunchMin)) activeMeal = 'lunch';
      else if (inWindow(dinnerMin)) activeMeal = 'dinner';

      // Find the next meal by sorting remaining times
      const meals = [
        { name: 'breakfast', key: t('dashboard.mealBreakfast'), timeMin: breakfastMin },
        { name: 'lunch', key: t('dashboard.mealLunch'), timeMin: lunchMin },
        { name: 'dinner', key: t('dashboard.mealDinner'), timeMin: dinnerMin }
      ];

      const mealsWithDiff = meals.map(m => {
        const diff = (m.timeMin - currentMin + 1440) % 1440;
        return { ...m, diff };
      });

      // Sort by smallest time difference (ascending)
      mealsWithDiff.sort((a, b) => a.diff - b.diff);

      const next = mealsWithDiff[0];

      setMealStatus({
        activeMeal,
        nextMealName: next.key,
        nextMealTime: formatMinutesToTime(next.timeMin),
        minutesToNextMeal: next.diff
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [userProfile, lang]);

  const formatCountdown = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (lang === 'ar') {
      return `${hrs > 0 ? hrs + ' ساعة و ' : ''}${mins} دقيقة`;
    }
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
  };

  if (!userProfile) {
    return <div className="widget-card meal-widget loading">Loading clock...</div>;
  }

  return (
    <div className="widget-card meal-widget animate-fade-in">
      <div className="widget-header">
        <h3>{t('dashboard.mealAlert')}</h3>
        <span className={`status-badge ${mealStatus.activeMeal ? 'status-eating' : 'status-fasting'}`}>
          {mealStatus.activeMeal ? '🍽️' : '⏱️'} {mealStatus.activeMeal ? t('dashboard.waterAdded') : t('dashboard.mealFasting')}
        </span>
      </div>

      <div className="widget-body">
        {mealStatus.activeMeal ? (
          <div className="active-meal-alert text-center animate-pulse">
            <span className="meal-icon">🥗</span>
            <h4>
              {lang === 'ar' ? 'نافذة الطعام مفتوحة!' : 'Meal Window Open!'}
            </h4>
            <p>
              {mealStatus.activeMeal === 'breakfast' && t('dashboard.mealBreakfast')}
              {mealStatus.activeMeal === 'lunch' && t('dashboard.mealLunch')}
              {mealStatus.activeMeal === 'dinner' && t('dashboard.mealDinner')}
            </p>
          </div>
        ) : (
          <div className="fasting-display">
            <div className="fasting-info">
              <span className="info-title">{t('dashboard.nextMeal')}</span>
              <span className="info-value">{mealStatus.nextMealName}</span>
              <span className="info-time">{lang === 'ar' ? 'الموعد: ' : 'Time: '}{mealStatus.nextMealTime}</span>
            </div>
            
            <div className="countdown-container text-center">
              <span className="countdown-label">
                {lang === 'ar' ? 'متبقي على الوجبة' : 'Countdown'}
              </span>
              <span className="countdown-time">
                {formatCountdown(mealStatus.minutesToNextMeal)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="widget-footer meal-warning">
        <div className="warning-card">
          <span className="warning-icon">⚠️</span>
          <p>{t('dashboard.noSnacksWarning')}</p>
        </div>
      </div>
    </div>
  );
}

export default MealWidget;
