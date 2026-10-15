import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './CookieConsent.css';

const COOKIE_STORAGE_KEY = 'darkoum_cookie_consent';

const CookieConsent = () => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const isAr = lang === 'ar';

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!consent) {
        // Small delay so it smoothly appears after initial page render
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.warn("Could not access localStorage for cookie consent:", err);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'all');
    } catch (err) {
      console.warn("Could not save cookie consent:", err);
    }
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'essential');
    } catch (err) {
      console.warn("Could not save cookie consent:", err);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner-overlay" role="dialog" aria-live="polite">
      <div className="cookie-content">
        <span className="cookie-icon">🍪</span>
        <div className="cookie-text">
          <h4>{isAr ? 'احترام خصوصيتك واستخدام ملفات تعريف الارتباط' : 'Respect de votre vie privée'}</h4>
          <p>
            {isAr
              ? 'نستخدم ملفات تعريف الارتباط الضرورية لضمان تجربة تصفح سريعة وآمنة وحفظ تفضيلاتك وفق القانون 18-07.'
              : 'Darkoum utilise des cookies techniques nécessaires au bon fonctionnement de la plateforme et à la mémorisation de vos préférences, conformément à la Loi 18-07.'}
            <Link to="/privacy" style={{ [isAr ? 'marginRight' : 'marginLeft']: '6px' }}>
              {isAr ? 'معرفة المزيد' : 'En savoir plus'}
            </Link>
          </p>
        </div>
      </div>
      <div className="cookie-actions">
        <button 
          type="button" 
          className="cookie-btn-essential" 
          onClick={handleAcceptEssential}
        >
          {isAr ? 'الضرورية فقط' : 'Essentiels uniquement'}
        </button>
        <button 
          type="button" 
          className="cookie-btn-accept" 
          onClick={handleAcceptAll}
        >
          {isAr ? 'قبول الكل' : 'Accepter tout'}
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
