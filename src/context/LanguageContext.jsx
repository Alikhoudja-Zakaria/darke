import React, { createContext, useContext, useState, useEffect } from 'react';
import fr from '../data/translations/fr.json';
import ar from '../data/translations/ar.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('dk_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('dk_lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const toggleLanguage = () => setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));

  const t = (keyString) => {
    const keys = keyString.split('.');
    let current = lang === 'fr' ? fr : ar;
    for (const key of keys) {
      if (current[key] === undefined) return keyString;
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
