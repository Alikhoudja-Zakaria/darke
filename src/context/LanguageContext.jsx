import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import fr from '../data/translations/fr.json';
import ar from '../data/translations/ar.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('dk_lang') || 'fr';
    } catch {
      return 'fr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dk_lang', lang);
    } catch (err) {
      console.error('Could not save language to localStorage', err);
    }
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  }, []);

  const t = useCallback((keyString) => {
    if (!keyString || typeof keyString !== 'string') return keyString || '';
    const keys = keyString.split('.');
    let current = lang === 'fr' ? fr : ar;
    for (const key of keys) {
      if (!current || typeof current !== 'object' || current[key] === undefined) {
        return keyString;
      }
      current = current[key];
    }
    return current;
  }, [lang]);

  const value = useMemo(() => ({ lang, toggleLanguage, t }), [lang, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
