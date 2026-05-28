import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <span className="logo-dk">dar</span>
          <span>koum</span>
        </div>
        <div className="footer-links">
          <a href="#!" onClick={e => e.preventDefault()}>{t('footer.about')}</a>
          <a href="#!" onClick={e => e.preventDefault()}>{t('footer.contact')}</a>
          <a href="#!" onClick={e => e.preventDefault()}>{t('footer.terms')}</a>
        </div>
        <div className="footer-made-in">
          {t('footer.made_in')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
