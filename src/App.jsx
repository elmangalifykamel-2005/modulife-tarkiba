import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/translator';
import { EventStoreProvider, useEventStore } from './store/EventStore';
import LocalDB from './db/LocalDB';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { userProfile, loadProfile } = useEventStore();
  const [view, setView] = useState('login'); // 'login' | 'onboarding' | 'dashboard'
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check if the local database has a configured user profile
    const profile = LocalDB.getUserProfile('local_user_default');
    if (!profile) {
      setView('onboarding'); // Redirect to profile configuration if empty
    } else {
      setView('login'); // Secure entry if profile exists
    }
  }, []); // Run only on initial app mount

  const handleLoginSuccess = () => {
    setIsAuth(true);
    setView('dashboard');
  };

  const handleOnboardingComplete = () => {
    setIsAuth(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsAuth(false);
    setView('login');
  };

  const handleEditProfile = () => {
    setView('onboarding');
  };

  return (
    <>
      {view === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onGoToOnboarding={() => setView('onboarding')}
        />
      )}
      {view === 'onboarding' && (
        <Onboarding onOnboardingComplete={handleOnboardingComplete} />
      )}
      {view === 'dashboard' && isAuth && (
        <Dashboard 
          onLogout={handleLogout} 
          onEditProfile={handleEditProfile}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <EventStoreProvider>
        <AppContent />
      </EventStoreProvider>
    </LanguageProvider>
  );
}

export default App;
