import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';

export function WaterWidget() {
  const { t, lang } = useTranslation();
  const { getTodayWaterTotal, addWater, resetWater, on, off } = useEventStore();
  const [todayTotal, setTodayTotal] = useState(0);
  const [shouldDrinkNudge, setShouldDrinkNudge] = useState(false);

  // Load and refresh daily water total
  const refreshTotal = () => {
    setTodayTotal(getTodayWaterTotal());
  };

  useEffect(() => {
    refreshTotal();
    
    // Register Event Bus listeners
    const handleWaterAdded = () => refreshTotal();
    const handleWaterReset = () => refreshTotal();
    const handleHydrationNudge = (notification) => {
      if (notification.type === 'hydration_suggestion') {
        setShouldDrinkNudge(true);
      }
    };

    on('water_added', handleWaterAdded);
    on('water_reset', handleWaterReset);
    on('notify', handleHydrationNudge);

    return () => {
      off('water_added', handleWaterAdded);
      off('water_reset', handleWaterReset);
      off('notify', handleHydrationNudge);
    };
  }, []);

  const handleDrink = () => {
    addWater(250);
    setShouldDrinkNudge(false); // Reset the visual alert once water is consumed
  };

  const handleReset = () => {
    resetWater();
    setShouldDrinkNudge(false);
  };

  const TARGET = 3000;
  const percentage = Math.min((todayTotal / TARGET) * 100, 100);

  return (
    <div className={`widget-card water-widget ${shouldDrinkNudge ? 'nudge-glow' : ''} animate-fade-in`}>
      <div className="widget-header">
        <h3>{t('dashboard.waterTracker')}</h3>
        <span className="water-stats">
          {todayTotal} / {TARGET} ml
        </span>
      </div>

      <div className="widget-body text-center">
        {shouldDrinkNudge && (
          <div className="nudge-text animate-pulse">
            ⚠️ {lang === 'ar' ? 'وقت الراحة: اشرب كوباً من الماء الآن!' : 'Rest Break: Drink a glass of water now!'}
          </div>
        )}

        <div className="water-progress-container">
          <div className="water-tank">
            <div className="water-level" style={{ height: `${percentage}%` }}>
              {percentage > 15 && <span className="percentage-text">{Math.round(percentage)}%</span>}
            </div>
          </div>
        </div>

        <div className="water-actions">
          <button onClick={handleDrink} className="btn btn-water-add animate-bounce-on-hover">
            💧 {t('dashboard.addWater')}
          </button>
          <button onClick={handleReset} className="btn-text btn-water-reset">
            {t('dashboard.resetWater')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WaterWidget;
