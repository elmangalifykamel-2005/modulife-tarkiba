import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';
import LocalDB from '../db/LocalDB';

export function TimerWidget() {
  const { t, lang } = useTranslation();
  const { userProfile, timerSession, setTimerSession, emit } = useEventStore();
  
  const [timeLeft, setTimeLeft] = useState(60 * 60); // Default 60 minutes
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('focus'); // 'focus' | 'recover' | 'sleep' | 'idle'
  const [isTestMode, setIsTestMode] = useState(false); // Speed up timer for testing

  const timerRef = useRef(null);

  // Time conversion helper
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Determine the current circadian phase based on system clock
  const checkCurrentSchedulePhase = () => {
    if (!userProfile) return 'idle';

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    const sleepMin = parseTimeToMinutes(userProfile.sleepTime);
    const wakeMin = parseTimeToMinutes(userProfile.wakeTime);
    const workStartMin = parseTimeToMinutes(userProfile.workStart);
    const workEndMin = parseTimeToMinutes(userProfile.workEnd);
    
    // Check Sleep Cycle
    let isSleeping = false;
    if (sleepMin > wakeMin) {
      isSleeping = currentMin >= sleepMin || currentMin < wakeMin;
    } else {
      isSleeping = currentMin >= sleepMin && currentMin < wakeMin;
    }

    if (isSleeping) return 'sleep';

    // Check Extra Work Cycle if configured and not freelancer
    if (userProfile.occupation !== 'freelancer' && userProfile.hasExtraJob && userProfile.extraWorkStart && userProfile.extraWorkEnd) {
      const extraStartMin = parseTimeToMinutes(userProfile.extraWorkStart);
      const extraEndMin = parseTimeToMinutes(userProfile.extraWorkEnd);
      let isExtraWork = false;
      if (extraStartMin > extraEndMin) {
        isExtraWork = currentMin >= extraStartMin || currentMin < extraEndMin;
      } else {
        isExtraWork = currentMin >= extraStartMin && currentMin < extraEndMin;
      }
      if (isExtraWork) return 'extra_work';
    }

    // Check Core Focus Cycle (Study/Freelance/Work)
    let isWorking = false;
    if (workStartMin > workEndMin) {
      isWorking = currentMin >= workStartMin || currentMin < workEndMin;
    } else {
      isWorking = currentMin >= workStartMin && currentMin < workEndMin;
    }

    if (isWorking) return 'focus';

    return 'idle';
  };

  // Sync phase with clock schedules
  useEffect(() => {
    const checkPhase = () => {
      const activePhase = checkCurrentSchedulePhase();
      setCurrentPhase(activePhase);
      
      // Update central state context
      setTimerSession(prev => ({
        ...prev,
        type: activePhase === 'focus' ? 'work' : activePhase === 'recover' ? 'rest' : activePhase
      }));
    };

    checkPhase();
    const interval = setInterval(checkPhase, 60000); // Check schedule every minute
    return () => clearInterval(interval);
  }, [userProfile]);

  // Handle countdown transitions
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handlePhaseTransition();
            return 0;
          }
          return prev - (isTestMode ? 60 : 1); // 60x speed in test mode
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, currentPhase, isTestMode]);

  // Manage transition between work/study and break cycles
  const handlePhaseTransition = () => {
    if (currentPhase === 'focus' || currentPhase === 'extra_work') {
      // Switch to Recover (15m)
      setCurrentPhase('recover');
      setTimeLeft(15 * 60); // 15 mins
      
      // Log focus time to database
      LocalDB.addTimeLog({
        userId: userProfile?.uid || 'local_user_default',
        type: currentPhase === 'focus' ? 'work' : 'extra_work',
        durationSeconds: 60 * 60
      });

      emit('session_changed', { type: 'rest', duration: 15 * 60 });
    } else if (currentPhase === 'recover') {
      // Switch back to Focus
      const nextPhase = checkCurrentSchedulePhase();
      setCurrentPhase(nextPhase === 'sleep' ? 'sleep' : 'focus');
      setTimeLeft(60 * 60); // 60 mins
      
      emit('session_changed', { type: 'work', duration: 60 * 60 });
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(currentPhase === 'recover' ? 15 * 60 : 60 * 60);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // UI styling and labeling based on current biological/occupational phase
  const getPhaseConfig = () => {
    if (currentPhase === 'focus') {
      if (userProfile?.occupation === 'student') {
        return { label: t('dashboard.timerStudy'), colorClass: 'phase-work', icon: '📚' };
      }
      if (userProfile?.occupation === 'freelancer') {
        return { label: t('dashboard.timerFreelance'), colorClass: 'phase-work', icon: '💻' };
      }
      return { label: t('dashboard.work'), colorClass: 'phase-work', icon: '⚡' };
    }

    switch (currentPhase) {
      case 'extra_work':
        return { label: t('dashboard.stateExtraWork'), colorClass: 'phase-extrawork', icon: '🚀' };
      case 'recover':
        return { label: t('dashboard.stateRest'), colorClass: 'phase-rest', icon: '🍃' };
      case 'sleep':
        return { label: t('dashboard.stateSleep'), colorClass: 'phase-sleep', icon: '🌙' };
      default:
        return { label: t('dashboard.stateRest'), colorClass: 'phase-idle', icon: '🧘' };
    }
  };

  const phaseConfig = getPhaseConfig();

  return (
    <div className={`widget-card timer-widget ${phaseConfig.colorClass} animate-fade-in`}>
      <div className="widget-header">
        <h3>{t('dashboard.currentTask')}</h3>
        <span className="phase-badge">
          {phaseConfig.icon} {phaseConfig.label}
        </span>
      </div>

      <div className="widget-body text-center">
        {currentPhase !== 'sleep' ? (
          <>
            <div className="timer-display">
              <span className="time">{formatTime(timeLeft)}</span>
            </div>
            
            <div className="timer-controls">
              <button 
                onClick={toggleTimer} 
                className={`btn btn-circle ${isActive ? 'btn-pause' : 'btn-play'}`}
                aria-label={isActive ? 'Pause' : 'Start'}
              >
                {isActive ? '⏸' : '▶'}
              </button>
              <button onClick={resetTimer} className="btn btn-circle btn-reset" aria-label="Reset">
                🔄
              </button>
            </div>
          </>
        ) : (
          <div className="sleep-mode-display">
            <div className="sleep-icon">🌙</div>
            <p>{lang === 'ar' ? 'نمط التعافي الليلي نشط حالياً' : 'Night Recovery Mode Active'}</p>
            <span className="sleep-time-hint">
              {lang === 'ar' ? `الاستيقاظ المقرر: ${userProfile?.wakeTime}` : `Scheduled Wakeup: ${userProfile?.wakeTime}`}
            </span>
          </div>
        )}
      </div>

      <div className="widget-footer">
        {currentPhase !== 'sleep' && (
          <button 
            onClick={() => setIsTestMode(!isTestMode)} 
            className={`btn-test ${isTestMode ? 'active' : ''}`}
          >
            {lang === 'ar' 
              ? `نمط الاختبار: ${isTestMode ? 'نشط (1ث = 1د)' : 'مغلق'}` 
              : `Test Mode: ${isTestMode ? 'Active (1s = 1m)' : 'Off'}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default TimerWidget;
