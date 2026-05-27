import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo-dk">DK</div>
          <span>Darkoum</span>
        </div>
        <div className="footer-links">
          <a href="#">{t('footer.about')}</a>
          <a href="#">{t('footer.contact')}</a>
          <a href="#">{t('footer.terms')}</a>
          <a href="#">{t('footer.privacy')}</a>
        </div>
        <div className="footer-made-in">
          {t('footer.made_in')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
