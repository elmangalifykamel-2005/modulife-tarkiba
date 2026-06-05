import React, { createContext, useContext, useState, useEffect } from 'react';
import ar from './ar.json';
import en from './en.json';

const translations = { ar, en };

const LanguageContext = createContext();

export function LanguageProvider({ children, initialLang = 'ar' }) {
  const [lang, setLangState] = useState(initialLang);

  // Set language state and update DB if loaded
  const setLang = (newLang) => {
    if (newLang === 'ar' || newLang === 'en') {
      setLangState(newLang);
      localStorage.setItem('modulife_language', newLang);
    }
  };

  useEffect(() => {
    // Read persisted language preference if exists
    const savedLang = localStorage.getItem('modulife_language');
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      setLangState(savedLang);
    }
  }, []);

  useEffect(() => {
    // Automatically manage document orientation and locale attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Set matching CSS variable for flex orientations and grid shifts if needed
    document.documentElement.style.setProperty('--app-direction', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const t = (path) => {
    const keys = path.split('.');
    let result = translations[lang];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return path; // Fallback to raw key
      }
    }
    return result;
  };

  const getTips = () => {
    return translations[lang].tips || [];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getTips }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
