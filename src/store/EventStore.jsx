import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import LocalDB from '../db/LocalDB';

const EventStoreContext = createContext();

export function EventStoreProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [waterLogs, setWaterLogs] = useState([]);
  const [timerSession, setTimerSession] = useState({
    type: 'idle', // 'work' | 'rest' | 'extra_work' | 'sleep'
    timeLeft: 0,
    isActive: false
  });

  // Use a ref for listeners to prevent infinite re-renders during on/off registration
  const listenersRef = useRef({});

  const emit = (event, data) => {
    console.log(`[EventStore] Event Emitted: ${event}`, data);
    const eventListeners = listenersRef.current[event];
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[EventStore] Error in listener for event ${event}:`, e);
        }
      });
    }
  };

  const on = (event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);
  };

  const off = (event, callback) => {
    if (listenersRef.current[event]) {
      listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
    }
  };

  // Sync state functions
  const loadProfile = (uid = 'local_user_default') => {
    const profile = LocalDB.getUserProfile(uid);
    setUserProfile(profile);
    if (profile) {
      const water = LocalDB.getWaterLogs(uid);
      setWaterLogs(water);
    }
  };

  const updateProfile = (profileData) => {
    const saved = LocalDB.saveUserProfile(profileData);
    setUserProfile(saved);
    emit('profile_updated', saved);
  };

  const addWater = (amountMl) => {
    if (!userProfile) return;
    const log = LocalDB.addWaterLog(userProfile.uid, amountMl);
    setWaterLogs(prev => [...prev, log]);
    // Compute total immediately including the new log
    const today = new Date().toDateString();
    const updatedLogs = [...waterLogs, log];
    const total = updatedLogs
      .filter(l => new Date(l.timestamp).toDateString() === today)
      .reduce((sum, l) => sum + l.amountMl, 0);

    emit('water_added', { amountMl, total });
  };

  const resetWater = () => {
    if (!userProfile) return;
    LocalDB.clearWaterLogs(userProfile.uid);
    setWaterLogs([]);
    emit('water_reset', 0);
  };

  const getTodayWaterTotal = () => {
    const today = new Date().toDateString();
    return waterLogs
      .filter(log => new Date(log.timestamp).toDateString() === today)
      .reduce((sum, log) => sum + log.amountMl, 0);
  };

  // Perform initial load
  useEffect(() => {
    loadProfile();
  }, []);

  // Central Coordinator: listen for timer transitions and dispatch health reminders
  useEffect(() => {
    const handleSessionSwitch = (session) => {
      if (session.type === 'rest') {
        emit('notify', {
          title: 'Time to Recover!',
          titleAr: 'وقت الاستراحة والتعافي!',
          message: 'Great job! Take 15 minutes of rest, move around, and grab a glass of water.',
          messageAr: 'عمل رائع! خذ 15 دقيقة للراحة والحركة، ولا تنس شرب كوب من الماء.',
          type: 'hydration_suggestion'
        });
      }
    };
    on('session_changed', handleSessionSwitch);
    return () => off('session_changed', handleSessionSwitch);
  }, []);

  return (
    <EventStoreContext.Provider value={{
      userProfile,
      setUserProfile,
      loadProfile,
      updateProfile,
      waterLogs,
      addWater,
      resetWater,
      getTodayWaterTotal,
      timerSession,
      setTimerSession,
      on,
      emit,
      off
    }}>
      {children}
    </EventStoreContext.Provider>
  );
}

export function useEventStore() {
  const context = useContext(EventStoreContext);
  if (!context) {
    throw new Error('useEventStore must be used within an EventStoreProvider');
  }
  return context;
}
export default EventStoreProvider;
