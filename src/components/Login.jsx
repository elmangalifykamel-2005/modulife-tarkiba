import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';
import LocalDB from '../db/LocalDB';

export function Login({ onLoginSuccess, onGoToOnboarding }) {
  const { t, lang, setLang } = useTranslation();
  const { loadProfile } = useEventStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Default master PIN for local access (e.g. 1234)
  const MASTER_PIN = '1234';

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === MASTER_PIN) {
      loadProfile('local_user_default');
      onLoginSuccess();
    } else {
      setError(t('login.error'));
      setPin('');
    }
  };

  return (
    <div className="login-container">
      {/* Top Bar for Language Toggle */}
      <div className="top-actions">
        <button 
          className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} 
          onClick={() => setLang('ar')}
        >
          العربية
        </button>
        <button 
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`} 
          onClick={() => setLang('en')}
        >
          English
        </button>
      </div>

      <div className="glass-card login-card animate-fade-in">
        <div className="logo-section">
          <div className="logo-icon">T</div>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="pin">{t('login.password')}</label>
            <input
              type="password"
              id="pin"
              placeholder="••••"
              maxLength="4"
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              required
            />
            <span className="hint-text">
              {lang === 'ar' ? 'رمز المرور الافتراضي هو 1234' : 'Default Security PIN is 1234'}
            </span>
          </div>

          {error && <div className="error-message animate-shake">{error}</div>}

          <button type="submit" className="btn btn-primary">
            {t('login.submit')}
          </button>
        </form>

        <div className="card-footer">
          <button onClick={onGoToOnboarding} className="link-btn">
            {lang === 'ar' ? 'إعادة ضبط الملف البيولوجي' : 'Reset Biological Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
