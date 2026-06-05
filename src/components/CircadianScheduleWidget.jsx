import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

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

export function CircadianScheduleWidget() {
  const { t, lang } = useTranslation();
  const { userProfile } = useEventStore();

  const [events, setEvents] = useState([]);
  const [currentMinutes, setCurrentMinutes] = useState(0);

  // Parse "hh:mm" to minutes since midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Format minutes to local 12-hour time string
  const formatTimeFromMinutes = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    const tempDate = new Date();
    tempDate.setHours(hrs, mins, 0);
    return tempDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    if (!userProfile) return;

    const calculateTimeline = () => {
      const tempEvents = [];
      const wakeMin = parseTimeToMinutes(userProfile.wakeTime);
      const sleepMin = parseTimeToMinutes(userProfile.sleepTime);
      const workStartMin = parseTimeToMinutes(userProfile.workStart);
      const workEndMin = parseTimeToMinutes(userProfile.workEnd);

      // 1. Core Sleep & Wake Times
      tempEvents.push({
        name: 'Wake Up',
        nameAr: 'الاستيقاظ والنشاط',
        minutes: wakeMin,
        type: 'wake',
        icon: '🌅',
        description: 'Wake up, hydrate, and get light exposure.',
        descriptionAr: 'الاستيقاظ، ترطيب الجسم بالماء، والتعرض للضوء الطبيعي.'
      });

      tempEvents.push({
        name: 'Sleep Phase',
        nameAr: 'النوم والراحة البيولوجية',
        minutes: sleepMin,
        type: 'sleep',
        icon: '🌙',
        description: 'Autophagy and cell rebuilding active.',
        descriptionAr: 'بدء النوم، تنشيط الالتهام الذاتي وإعادة بناء الخلايا.'
      });

      // 2. Focused Focus / Study Blocks
      let focusLabel = 'Focused Work';
      let focusLabelAr = 'بدء ساعات العمل والتركيز';
      let focusIcon = '⚡';
      if (userProfile.occupation === 'student') {
        focusLabel = 'Study Session';
        focusLabelAr = 'بدء ساعات الدراسة والتركيز';
        focusIcon = '📚';
      } else if (userProfile.occupation === 'freelancer') {
        focusLabel = 'Freelance Focus Block';
        focusLabelAr = 'بدء جلسات العمل الحر';
        focusIcon = '💻';
      }

      tempEvents.push({
        name: focusLabel,
        nameAr: focusLabelAr,
        minutes: workStartMin,
        type: 'work',
        icon: focusIcon,
        description: 'High cognitive efficiency block. Use 60/15 cycle.',
        descriptionAr: 'جلسة تركيز ذهني عالية. استخدم دورات 60/15 دقيقة.'
      });

      tempEvents.push({
        name: 'Focus Block End',
        nameAr: 'نهاية ساعات التركيز',
        minutes: workEndMin,
        type: 'work_end',
        icon: '🧘',
        description: 'Wind down from work and enter transition phase.',
        descriptionAr: 'نهاية وقت العمل الأساسي والبدء في الاسترخاء.'
      });

      // 3. Extra Work if configured
      if (userProfile.occupation !== 'freelancer' && userProfile.hasExtraJob && userProfile.extraWorkStart && userProfile.extraWorkEnd) {
        tempEvents.push({
          name: 'Secondary Focus Session',
          nameAr: 'جلسة تركيز ثانوي',
          minutes: parseTimeToMinutes(userProfile.extraWorkStart),
          type: 'extra_work',
          icon: '🚀',
          description: 'Secondary work blocks.',
          descriptionAr: 'جلسة تركيز إضافية لإنجاز المهام الجانبية.'
        });
        tempEvents.push({
          name: 'Secondary Focus End',
          nameAr: 'نهاية التركيز الثانوي',
          minutes: parseTimeToMinutes(userProfile.extraWorkEnd),
          type: 'extra_work_end',
          icon: '💤',
          description: 'Rest and close all screens.',
          descriptionAr: 'إنهاء العمل الثانوي وبدء الاستعداد للنوم.'
        });
      }

      // 4. Metabolic Meals (Relative to wake time)
      tempEvents.push({
        name: 'Breakfast (Metabolic)',
        nameAr: 'وجبة الإفطار الأيضية',
        minutes: (wakeMin + 60) % 1440,
        type: 'meal',
        icon: '🍳',
        description: 'First meal within 1 hour. Gluten-free recommended.',
        descriptionAr: 'الوجبة الأولى خلال ساعة من الاستيقاظ. خالية من الجلوتين.'
      });

      tempEvents.push({
        name: 'Lunch (Digestive Peak)',
        nameAr: 'وجبة الغداء',
        minutes: (wakeMin + 360) % 1440,
        type: 'meal',
        icon: '🥗',
        description: 'Optimal metabolic rate. Avoid snacking afterwards.',
        descriptionAr: 'قمة النشاط الأيضي للهضم. تجنب السناكس بعدها.'
      });

      tempEvents.push({
        name: 'Dinner (Insulin Rest)',
        nameAr: 'وجبة العشاء (إراحة الأنسولين)',
        minutes: (wakeMin + 720) % 1440,
        type: 'meal',
        icon: '🥣',
        description: 'Last meal. Eat 3-4 hours before sleeping.',
        descriptionAr: 'الوجبة الأخيرة. تناولها قبل النوم بـ 3-4 ساعات.'
      });

      // 5. Muslim Prayer Times if location is configured
      const lat = Number(localStorage.getItem('prayer_lat'));
      const lng = Number(localStorage.getItem('prayer_lng'));
      const method = localStorage.getItem('prayer_method') || 'UmmAlQura';

      if (lat && lng) {
        try {
          const coords = new Coordinates(lat, lng);
          const params = getMethodParams(method);
          const date = new Date();
          const prayers = new PrayerTimes(coords, date, params);

          const getPrayerMin = (d) => d.getHours() * 60 + d.getMinutes();

          tempEvents.push({ name: t('dashboard.fajr'), nameAr: 'صلاة الفجر', minutes: getPrayerMin(prayers.fajr), type: 'prayer', icon: '🕌', description: 'Early morning prayer.', descriptionAr: 'صلاة الفجر وبداية البكور البركة.' });
          tempEvents.push({ name: t('dashboard.dhuhr'), nameAr: 'صلاة الظهر', minutes: getPrayerMin(prayers.dhuhr), type: 'prayer', icon: '🕌', description: 'Noon prayer.', descriptionAr: 'صلاة الظهر والاستراحة الأيضية الأولى.' });
          tempEvents.push({ name: t('dashboard.asr'), nameAr: 'صلاة العصر', minutes: getPrayerMin(prayers.asr), type: 'prayer', icon: '🕌', description: 'Afternoon prayer.', descriptionAr: 'صلاة العصر وبداية تجديد النشاط اليومي.' });
          tempEvents.push({ name: t('dashboard.maghrib'), nameAr: 'صلاة المغرب', minutes: getPrayerMin(prayers.maghrib), type: 'prayer', icon: '🕌', description: 'Sunset prayer.', descriptionAr: 'صلاة المغرب وبدء الاستعداد للصيام الهضمي.' });
          tempEvents.push({ name: t('dashboard.isha'), nameAr: 'صلاة العشاء', minutes: getPrayerMin(prayers.isha), type: 'prayer', icon: '🕌', description: 'Night prayer.', descriptionAr: 'صلاة العشاء وبداية الهدوء العصبي والنوم.' });
        } catch (e) {
          console.error('Error adding prayers to schedule', e);
        }
      }

      // Sort events chronologically
      tempEvents.sort((a, b) => a.minutes - b.minutes);
      setEvents(tempEvents);
    };

    calculateTimeline();
    
    // Set up timer to track current minutes of the day
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [userProfile, lang]);

  if (!userProfile || events.length === 0) return null;

  return (
    <div className="widget-card schedule-widget grid-col-12 animate-fade-in">
      <div className="widget-header">
        <div>
          <h3>🕒 {t('dashboard.scheduleTitle')}</h3>
          <p className="subtitle-detail">{t('dashboard.scheduleSubtitle')}</p>
        </div>
      </div>

      <div className="widget-body">
        <div className="timeline-container">
          <div className="timeline-line"></div>

          <div className="timeline-items-grid">
            {events.map((event, index) => {
              // Find if this event is currently active or next
              // Active is defined as: the current time is past this event but before the next one
              const nextEvent = events[index + 1] || events[0];
              let isActive = false;

              if (index === events.length - 1) {
                // Last event of the day
                isActive = currentMinutes >= event.minutes || currentMinutes < events[0].minutes;
              } else {
                isActive = currentMinutes >= event.minutes && currentMinutes < nextEvent.minutes;
              }

              return (
                <div 
                  key={index} 
                  className={`timeline-item ${isActive ? 'active-step' : ''} type-${event.type}`}
                >
                  <div className="timeline-badge-wrap">
                    <span className="timeline-badge">
                      {event.icon}
                    </span>
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className="timeline-time">
                        {formatTimeFromMinutes(event.minutes)}
                      </span>
                      {isActive && (
                        <span className="badge badge-active animate-pulse">
                          {lang === 'ar' ? 'الآن' : 'Active'}
                        </span>
                      )}
                    </div>
                    <h4 className="timeline-title">
                      {lang === 'ar' ? event.nameAr : event.name}
                    </h4>
                    <p className="timeline-desc">
                      {lang === 'ar' ? event.descriptionAr : event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircadianScheduleWidget;
